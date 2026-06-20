-- AURA-106 — Rate-limit consume + TTL cleanup functions (D-51).
--
-- Authority: docs/TASKS_Project.md (AURA-106), docs/DECISION_LOG.md (D-39, D-51, A-03,
--            A-16), docs/SECURITY_BASELINE.md, docs/DATA_RETENTION.md,
--            .claude/rules/no-raw-ip-in-events.md.
--
-- Builds on AURA-102 (20260616183318_init.sql), which created public.rate_limits
-- (key_hash, route, count, window_start, expires_at) with RLS ENABLED, and AURA-103
-- (20260617025449_rls_policies.sql), which left rate_limits service-role-only (ZERO
-- policies, NO anon/authenticated grants, service_role full DML).
--
-- Scope (AURA-106 task spec):
--   * public.consume_rate_limit(...) — atomic check-and-increment within a fixed window.
--   * public.cleanup_rate_limits()   — delete expired rows (24h TTL, A-16).
--   * rate_limits_expires_at_idx     — index supporting the cleanup predicate.
--   * Guarded pg_cron registration   — hourly cleanup where pg_cron is available;
--                                      degrades to a NOTICE (never an error) otherwise.
--
-- NOT in scope:
--   * Wiring the service into lead / whatsapp / login routes -> Phases 3-4.
--   * Any change to the rate_limits TABLE shape, RLS, or grants (unchanged here).
--
-- Merge-blocker invariants honoured here:
--   * D-05  : no `clients` table, no `client_id` column, no tenant model.
--   * D-18 / D-51 : NO raw IP anywhere. The functions accept only key_hash + route +
--             limit/window — never an IP. rate_limits keeps key_hash only.
--   * rate_limits stays service-role-only: NO new RLS policy, NO anon/authenticated
--     grant. Both functions are SECURITY DEFINER with a pinned empty search_path and
--     are EXECUTE-revoked from public (anon/authenticated), granted only to service_role.
--
-- ---------------------------------------------------------------------------------
-- ROLLBACK (down) PATH — run in this order to fully revert THIS migration. The
-- rate_limits TABLE is created by AURA-102 and is intentionally NOT dropped here.
--
--   -- 1. Unschedule the cron job (guarded; no-op if pg_cron / the job is absent):
--   DO $$
--   BEGIN
--     IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
--        AND EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'aura-rate-limits-cleanup') THEN
--       PERFORM cron.unschedule('aura-rate-limits-cleanup');
--     END IF;
--   EXCEPTION WHEN OTHERS THEN
--     RAISE NOTICE 'rollback: cron.unschedule skipped (%): %', SQLSTATE, SQLERRM;
--   END $$;
--   -- 2. Drop the functions:
--   DROP FUNCTION IF EXISTS public.cleanup_rate_limits();
--   DROP FUNCTION IF EXISTS public.consume_rate_limit(text, text, integer, integer);
--   -- 3. Drop the index:
--   DROP INDEX IF EXISTS public.rate_limits_expires_at_idx;
--   -- (Do NOT drop public.rate_limits — it belongs to AURA-102.)
-- ---------------------------------------------------------------------------------

begin;

-- =================================================================================
-- 1. INDEX — supports the cleanup predicate (expires_at < now()).
--    AURA-102 created only the PK index on key_hash; the TTL sweep needs this.
-- =================================================================================

create index if not exists rate_limits_expires_at_idx
  on public.rate_limits (expires_at);

-- =================================================================================
-- 2. consume_rate_limit — atomic check-and-increment.
--
-- Accepts only key_hash + route + limit + window (NEVER a raw IP — the IP is hashed
-- into key_hash by the server-side service before this is called). SECURITY DEFINER so
-- it can write rate_limits (service-role-only table) while RLS stays enabled; empty
-- search_path with fully-qualified identifiers defeats search_path hijacking.
--
-- Semantics:
--   * no row            -> insert count=1, window_start=now, expires_at=now+24h, allow.
--   * window expired    -> reset count=1, window_start=now, refresh expires_at, allow.
--   * within window,
--       count < limit   -> increment, refresh expires_at, allow.
--       count >= limit  -> deny; row unchanged (expires_at NOT refreshed on deny).
--
-- `expires_at` is the 24h ROW TTL (A-16), independent of the (shorter) rate window.
-- `reset_at` reflects window_start + window_seconds for the active window.
-- =================================================================================

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_route text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  limit_value integer,
  remaining integer,
  current_count integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now    timestamptz := now();
  v_window interval    := make_interval(secs => p_window_seconds);
  v_ttl    interval    := interval '24 hours';
  v_count  integer;
  v_start  timestamptz;
begin
  -- Lock the existing row (if any) to serialise concurrent consumers of this key.
  select rl.count, rl.window_start
    into v_count, v_start
    from public.rate_limits rl
    where rl.key_hash = p_key_hash
    for update;

  if not found then
    -- First hit. `on conflict do nothing` covers a concurrent inserter racing us.
    insert into public.rate_limits (key_hash, route, count, window_start, expires_at)
    values (p_key_hash, p_route, 1, v_now, v_now + v_ttl)
    on conflict (key_hash) do nothing;

    if found then
      return query select true, p_limit, greatest(p_limit - 1, 0), 1, v_now + v_window;
      return;
    end if;

    -- Lost the race: re-read the row the other transaction inserted, with a lock.
    select rl.count, rl.window_start
      into v_count, v_start
      from public.rate_limits rl
      where rl.key_hash = p_key_hash
      for update;
  end if;

  if v_start + v_window <= v_now then
    -- Rate window elapsed -> reset to a fresh window.
    update public.rate_limits
      set count = 1, route = p_route, window_start = v_now, expires_at = v_now + v_ttl
      where key_hash = p_key_hash;
    return query select true, p_limit, greatest(p_limit - 1, 0), 1, v_now + v_window;
    return;
  elsif v_count < p_limit then
    -- Within window and under the limit -> consume one.
    update public.rate_limits
      set count = v_count + 1, expires_at = v_now + v_ttl
      where key_hash = p_key_hash;
    return query
      select true, p_limit, greatest(p_limit - (v_count + 1), 0), v_count + 1, v_start + v_window;
    return;
  else
    -- Within window and at/over the limit -> deny; leave the row (and expires_at) intact.
    return query select false, p_limit, 0, v_count, v_start + v_window;
    return;
  end if;
end;
$$;

-- =================================================================================
-- 3. cleanup_rate_limits — delete expired rows (24h TTL, A-16). Idempotent: a second
--    run deletes 0. SECURITY DEFINER + empty search_path, same hardening as above.
-- =================================================================================

create or replace function public.cleanup_rate_limits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits where expires_at < now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- =================================================================================
-- 4. FUNCTION GRANTS — keep rate_limits service-role-only. Revoke the implicit PUBLIC
--    EXECUTE (which would otherwise let anon/authenticated call these), then grant
--    EXECUTE only to service_role. No table policy / table grant is added.
-- =================================================================================

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
revoke all on function public.cleanup_rate_limits()                            from public;

grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.cleanup_rate_limits()                            to service_role;

commit;

-- =================================================================================
-- 5. GUARDED pg_cron REGISTRATION (outside the transaction).
--
-- pg_cron requires shared_preload_libraries and is NOT available on the local Supabase
-- CLI stack by default. This block must NEVER fail `supabase db reset`: every step is
-- wrapped so an unavailable pg_cron degrades to a NOTICE. The cleanup FUNCTION + INDEX
-- above always apply; only the in-DB schedule is skipped when pg_cron is absent. On
-- hosted Supabase (pg_cron available), the hourly job is (re)created idempotently.
--
-- Equivalent (A-16 "pg_cron or equivalent"): where pg_cron is unavailable, invoke
-- public.cleanup_rate_limits() from an external scheduler (e.g. Vercel Cron / a
-- scheduled Edge Function) using the service role.
-- =================================================================================

do $$
begin
  -- Best-effort enable; catch the "can only be loaded via shared_preload_libraries"
  -- error (and any other) so a missing pg_cron never aborts the migration.
  begin
    create extension if not exists pg_cron;
  exception
    when others then
      raise notice
        'AURA-106: pg_cron unavailable (%) — cleanup_rate_limits() created but NOT scheduled in-DB. Use an external scheduler or enable pg_cron on the host.',
        sqlerrm;
      return;
  end;

  -- pg_cron present -> (re)schedule idempotently (unschedule any prior job first).
  if exists (select 1 from cron.job where jobname = 'aura-rate-limits-cleanup') then
    perform cron.unschedule('aura-rate-limits-cleanup');
  end if;
  perform cron.schedule('aura-rate-limits-cleanup', '0 * * * *', 'select public.cleanup_rate_limits();');
  raise notice 'AURA-106: scheduled hourly pg_cron job aura-rate-limits-cleanup.';
exception
  when others then
    raise notice 'AURA-106: pg_cron scheduling skipped (%): %', sqlstate, sqlerrm;
end;
$$;
