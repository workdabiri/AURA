-- AURA-103 — RLS policies for all sensitive MVP tables.
--
-- Authority: docs/SECURITY_BASELINE.md, docs/RBAC.md, docs/DATA_MODEL.md,
--            docs/DECISION_LOG.md, docs/TASKS_Project.md (AURA-103),
--            .claude/rules/no-public-sensitive-reads.md.
--
-- Builds on AURA-102 (20260616183318_init.sql), which created the 11 MVP tables and
-- ENABLEd row level security on every one of them with ZERO policies (default-deny).
-- This migration authors the explicit allowlist: public reads only for approved public
-- surfaces, public inserts only for leads + whatsapp_clicks, admin access gated by
-- user_profiles.role, and everything else default-deny.
--
-- Scope (AURA-103 task spec):
--   * Role-check helper functions (no recursive RLS).
--   * RLS policies per the SECURITY_BASELINE / RBAC matrix.
--   * Least-privilege table GRANTs (the AURA-102 baseline grants NO DML to anon /
--     authenticated / service_role — only TRUNCATE/REFERENCES/TRIGGER — so explicit
--     grants are REQUIRED for both the policies and the server-side service role to
--     function; the stray anon/authenticated TRUNCATE grant is revoked here).
--
-- NOT in scope:
--   * Auth session wiring / application-layer authz negatives -> AURA-104.
--   * Admin bootstrap / seed users / seed data                -> AURA-104 (none here).
--   * Storage bucket policies                                  -> AURA-105.
--   * rate_limits cleanup job / pg_cron                        -> AURA-106.
--
-- Locked decisions enforced for this task (user-approved):
--   * property_stakeholders: NO anon/public SELECT policy. Direct anon access stays
--     default-deny (sensitive internal_notes / contact columns). Column-safe public
--     stakeholder projection is deferred to AURA-203.
--   * properties: NO DELETE policy. Hard delete remains default-deny for anon AND
--     authenticated; rare hard delete (if ever) is service-role-only, outside MVP UI.
--
-- Merge-blocker invariants honoured: no `clients`/`client_id`; no raw IP; RLS stays
-- ENABLED on every table (never disabled); rate_limits gets NO policies and NO
-- anon/authenticated grants; sensitive tables are never publicly readable.
--
-- ---------------------------------------------------------------------------------
-- ROLLBACK (down) PATH — run in this order to fully revert THIS migration.
-- RLS stays ENABLED on every table (we never disable RLS); reverting just drops the
-- policies + helper functions, returning the schema to the AURA-102 default-deny state.
--
--   -- 1. Drop policies (per table):
--   DROP POLICY IF EXISTS properties_anon_select_published      ON public.properties;
--   DROP POLICY IF EXISTS properties_admin_select              ON public.properties;
--   DROP POLICY IF EXISTS properties_admin_insert              ON public.properties;
--   DROP POLICY IF EXISTS properties_admin_update              ON public.properties;
--   DROP POLICY IF EXISTS areas_anon_select_active             ON public.areas;
--   DROP POLICY IF EXISTS areas_admin_select                   ON public.areas;
--   DROP POLICY IF EXISTS areas_admin_insert                   ON public.areas;
--   DROP POLICY IF EXISTS areas_admin_update                   ON public.areas;
--   DROP POLICY IF EXISTS legal_pages_anon_select_published    ON public.legal_pages;
--   DROP POLICY IF EXISTS legal_pages_admin_select             ON public.legal_pages;
--   DROP POLICY IF EXISTS legal_pages_admin_insert             ON public.legal_pages;
--   DROP POLICY IF EXISTS legal_pages_admin_update             ON public.legal_pages;
--   DROP POLICY IF EXISTS property_media_anon_select_published ON public.property_media;
--   DROP POLICY IF EXISTS property_media_admin_select          ON public.property_media;
--   DROP POLICY IF EXISTS property_media_admin_insert          ON public.property_media;
--   DROP POLICY IF EXISTS property_media_admin_update          ON public.property_media;
--   DROP POLICY IF EXISTS property_media_admin_delete          ON public.property_media;
--   DROP POLICY IF EXISTS property_stakeholders_admin_select   ON public.property_stakeholders;
--   DROP POLICY IF EXISTS property_stakeholders_admin_insert   ON public.property_stakeholders;
--   DROP POLICY IF EXISTS property_stakeholders_admin_update   ON public.property_stakeholders;
--   DROP POLICY IF EXISTS property_stakeholders_admin_delete   ON public.property_stakeholders;
--   DROP POLICY IF EXISTS leads_anon_insert                    ON public.leads;
--   DROP POLICY IF EXISTS leads_admin_select                   ON public.leads;
--   DROP POLICY IF EXISTS leads_admin_insert                   ON public.leads;
--   DROP POLICY IF EXISTS leads_admin_update                   ON public.leads;
--   DROP POLICY IF EXISTS whatsapp_clicks_anon_insert          ON public.whatsapp_clicks;
--   DROP POLICY IF EXISTS whatsapp_clicks_admin_select         ON public.whatsapp_clicks;
--   DROP POLICY IF EXISTS settings_admin_select                ON public.settings;
--   DROP POLICY IF EXISTS settings_admin_insert                ON public.settings;
--   DROP POLICY IF EXISTS settings_admin_update                ON public.settings;
--   DROP POLICY IF EXISTS user_profiles_select_own             ON public.user_profiles;
--   DROP POLICY IF EXISTS user_profiles_super_admin_select     ON public.user_profiles;
--   DROP POLICY IF EXISTS user_profiles_super_admin_insert     ON public.user_profiles;
--   DROP POLICY IF EXISTS user_profiles_super_admin_update     ON public.user_profiles;
--   DROP POLICY IF EXISTS user_profiles_super_admin_delete     ON public.user_profiles;
--   DROP POLICY IF EXISTS audit_logs_super_admin_select        ON public.audit_logs;
--   -- 2. Drop helper functions:
--   DROP FUNCTION IF EXISTS public.is_super_admin();
--   DROP FUNCTION IF EXISTS public.is_admin();
--   DROP FUNCTION IF EXISTS public.current_user_role();
--   -- 3. (Optional) Revoke the grants added here, returning to AURA-102 grant state.
--   --    RLS remains ENABLED throughout; reverting policies restores default-deny.
-- ---------------------------------------------------------------------------------

begin;

-- =================================================================================
-- 1. ROLE-CHECK HELPER FUNCTIONS
--
-- current_user_role() is SECURITY DEFINER so its read of public.user_profiles
-- BYPASSES RLS — this is what prevents infinite recursion when a user_profiles RLS
-- policy (or any policy) needs to know the caller's role. It is STABLE (one lookup
-- per statement) and pins an empty search_path with fully-qualified identifiers to
-- defeat search_path hijacking (a SECURITY DEFINER hardening requirement).
--
-- is_admin() / is_super_admin() are thin SECURITY INVOKER wrappers: they only call
-- current_user_role() (which already bypasses RLS), so they need no elevated rights.
-- coalesce(..., false) maps the NULL role (anon, or a session with no profile row)
-- to a definite false so policies fail closed.
-- =================================================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = ''
as $$
  select up.role
  from public.user_profiles up
  where up.id = (select auth.uid())
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    public.current_user_role() in ('super_admin', 'client_admin'),
    false
  )
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'super_admin', false)
$$;

-- Helper execution: revoke the implicit PUBLIC grant, then grant EXECUTE only to
-- authenticated (anon policies never reference these helpers, so anon gets nothing).
revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin()          from public;
revoke all on function public.is_super_admin()    from public;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin()          to authenticated;
grant execute on function public.is_super_admin()    to authenticated;

-- =================================================================================
-- 2. TABLE GRANTS (least privilege)
--
-- The AURA-102 baseline grants anon/authenticated/service_role only Dxt
-- (TRUNCATE/REFERENCES/TRIGGER) and NO DML. RLS alone cannot grant access, so the
-- policies below would be dead without these grants. We first REVOKE ALL from
-- anon/authenticated on every MVP table (this also strips the stray anon/authenticated
-- TRUNCATE footgun), then grant exactly the privileges each policy needs.
--
-- service_role is the trusted server-side role (BYPASSRLS): it performs the
-- "service-role only" operations the matrix relies on — audit_logs writes,
-- rate_limits read/write, and any rare hard delete. It also lacks DML in the
-- baseline, so we grant it the DML it needs (RLS does not apply to it).
-- =================================================================================

revoke all on table
  public.user_profiles,
  public.areas,
  public.properties,
  public.property_media,
  public.property_stakeholders,
  public.leads,
  public.whatsapp_clicks,
  public.settings,
  public.legal_pages,
  public.audit_logs,
  public.rate_limits
from anon, authenticated;

-- ---- anon: minimal public surface ------------------------------------------------
-- Public reads (RLS narrows rows to published/active):
grant select on table public.properties     to anon;
grant select on table public.areas          to anon;
grant select on table public.legal_pages    to anon;
grant select on table public.property_media to anon;
-- Public inserts (RLS WITH CHECK (true); validated + rate-limited at the route layer):
grant insert on table public.leads           to anon;
grant insert on table public.whatsapp_clicks to anon;
-- NOTE: anon gets NOTHING on user_profiles, property_stakeholders, settings,
-- audit_logs, or rate_limits.

-- ---- authenticated: admin DML, gated row-by-row by the policies below ------------
grant select, insert, update on table public.properties            to authenticated;
grant select, insert, update on table public.areas                 to authenticated;
grant select, insert, update on table public.legal_pages           to authenticated;
grant select, insert, update, delete on table public.property_media to authenticated;
grant select, insert, update, delete on table public.property_stakeholders to authenticated;
grant select, insert, update on table public.leads                 to authenticated;
grant select on table public.whatsapp_clicks                       to authenticated;
grant select, insert, update on table public.settings              to authenticated;
grant select, insert, update, delete on table public.user_profiles to authenticated;
grant select on table public.audit_logs                            to authenticated;
-- NOTE: authenticated gets NOTHING on rate_limits, and NO DELETE on properties /
-- leads (hard delete is service-role-only, outside MVP UI).

-- ---- service_role: full DML on every table (trusted server role, BYPASSRLS) ------
grant select, insert, update, delete on table
  public.user_profiles,
  public.areas,
  public.properties,
  public.property_media,
  public.property_stakeholders,
  public.leads,
  public.whatsapp_clicks,
  public.settings,
  public.legal_pages,
  public.audit_logs,
  public.rate_limits
to service_role;

-- =================================================================================
-- 3. POLICIES
--
-- With RLS enabled, a command with no matching policy is denied. Multiple permissive
-- policies for the same (command, role) are OR'd together. We split anon and admin
-- into separate policies so the public surface and the admin surface are independently
-- auditable.
-- =================================================================================

-- ---- A. properties --------------------------------------------------------------
-- anon: published rows only. admin: all rows, full CRUD except DELETE (no policy).
create policy properties_anon_select_published on public.properties
  for select to anon
  using (publish_status = 'published');

create policy properties_admin_select on public.properties
  for select to authenticated
  using (public.is_admin());

create policy properties_admin_insert on public.properties
  for insert to authenticated
  with check (public.is_admin());

create policy properties_admin_update on public.properties
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: intentionally NO policy (locked decision) — hard delete stays default-deny.

-- ---- B. areas -------------------------------------------------------------------
create policy areas_anon_select_active on public.areas
  for select to anon
  using (is_active = true);

create policy areas_admin_select on public.areas
  for select to authenticated
  using (public.is_admin());

create policy areas_admin_insert on public.areas
  for insert to authenticated
  with check (public.is_admin());

create policy areas_admin_update on public.areas
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: no policy — deactivation is via is_active, not hard delete.

-- ---- C. legal_pages -------------------------------------------------------------
create policy legal_pages_anon_select_published on public.legal_pages
  for select to anon
  using (status = 'published');

create policy legal_pages_admin_select on public.legal_pages
  for select to authenticated
  using (public.is_admin());

create policy legal_pages_admin_insert on public.legal_pages
  for insert to authenticated
  with check (public.is_admin());

create policy legal_pages_admin_update on public.legal_pages
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: no policy.

-- ---- D. property_media ----------------------------------------------------------
-- anon: media whose parent property is published. admin: full CRUD.
create policy property_media_anon_select_published on public.property_media
  for select to anon
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_media.property_id
        and p.publish_status = 'published'
    )
  );

create policy property_media_admin_select on public.property_media
  for select to authenticated
  using (public.is_admin());

create policy property_media_admin_insert on public.property_media
  for insert to authenticated
  with check (public.is_admin());

create policy property_media_admin_update on public.property_media
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy property_media_admin_delete on public.property_media
  for delete to authenticated
  using (public.is_admin());

-- ---- E. property_stakeholders ---------------------------------------------------
-- NO anon policy (locked decision): direct anon access stays default-deny. Admin only.
create policy property_stakeholders_admin_select on public.property_stakeholders
  for select to authenticated
  using (public.is_admin());

create policy property_stakeholders_admin_insert on public.property_stakeholders
  for insert to authenticated
  with check (public.is_admin());

create policy property_stakeholders_admin_update on public.property_stakeholders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy property_stakeholders_admin_delete on public.property_stakeholders
  for delete to authenticated
  using (public.is_admin());

-- ---- F. leads -------------------------------------------------------------------
-- anon: INSERT only (no SELECT/UPDATE/DELETE). admin: read + manage (soft-delete via
-- archived_at = UPDATE). DELETE: no policy (hard delete service-role-only).
create policy leads_anon_insert on public.leads
  for insert to anon
  with check (true);

create policy leads_admin_select on public.leads
  for select to authenticated
  using (public.is_admin());

create policy leads_admin_insert on public.leads
  for insert to authenticated
  with check (public.is_admin());

create policy leads_admin_update on public.leads
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- G. whatsapp_clicks ---------------------------------------------------------
-- anon: INSERT only (no PII columns exist — D-18). admin: SELECT only.
-- UPDATE/DELETE: no policy.
create policy whatsapp_clicks_anon_insert on public.whatsapp_clicks
  for insert to anon
  with check (true);

create policy whatsapp_clicks_admin_select on public.whatsapp_clicks
  for select to authenticated
  using (public.is_admin());

-- ---- H. settings ----------------------------------------------------------------
-- NO anon policy: public-safe settings are read via a server selector, not direct
-- RLS. admin: SELECT/INSERT/UPDATE. DELETE: no policy.
create policy settings_admin_select on public.settings
  for select to authenticated
  using (public.is_admin());

create policy settings_admin_insert on public.settings
  for insert to authenticated
  with check (public.is_admin());

create policy settings_admin_update on public.settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- I. user_profiles -----------------------------------------------------------
-- Any authenticated user reads their OWN row. super_admin reads/manages ALL rows.
-- client_admin therefore gets own-row SELECT only — no user management.
create policy user_profiles_select_own on public.user_profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy user_profiles_super_admin_select on public.user_profiles
  for select to authenticated
  using (public.is_super_admin());

create policy user_profiles_super_admin_insert on public.user_profiles
  for insert to authenticated
  with check (public.is_super_admin());

create policy user_profiles_super_admin_update on public.user_profiles
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy user_profiles_super_admin_delete on public.user_profiles
  for delete to authenticated
  using (public.is_super_admin());

-- ---- J. audit_logs --------------------------------------------------------------
-- super_admin SELECT only. NO INSERT/UPDATE/DELETE policy — writes are append-only
-- and happen exclusively via the service role (server-side audited actions).
create policy audit_logs_super_admin_select on public.audit_logs
  for select to authenticated
  using (public.is_super_admin());

-- ---- K. rate_limits -------------------------------------------------------------
-- NO policies and NO anon/authenticated grants (revoked above). Service-role only.
-- Cleanup job / pg_cron is AURA-106.

commit;
