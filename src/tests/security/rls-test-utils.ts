import { execFileSync } from 'node:child_process'

/**
 * AURA-103 — shared harness for RLS policy tests (role simulation via psql).
 *
 * Not a test file (no `.test.`/`.spec.` suffix → not collected by Vitest). Imported
 * by src/tests/security/rls-policies.test.ts and src/tests/dal/rls-policies.test.ts.
 *
 * Role simulation strategy (task-approved, no committed seed files):
 *   - Connect as the postgres superuser (bypasses RLS) to seed fixtures.
 *   - Everything runs inside a single `begin … rollback` so NOTHING is committed.
 *   - `set local role anon|authenticated` + `set local request.jwt.claims` drives
 *     auth.uid()/RLS exactly as PostgREST would for a real request.
 */

export const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

/** Seeded identities (also inserted into auth.users so the FK + auth.uid() resolve). */
export const SUPER_ADMIN_ID = '11111111-1111-1111-1111-111111111111'
export const CLIENT_ADMIN_ID = '22222222-2222-2222-2222-222222222222'
/** An authenticated user with a row in auth.users but NO user_profiles row. */
export const NO_PROFILE_ID = '33333333-3333-3333-3333-333333333333'

/**
 * Fixture seed run as postgres inside the rolled-back transaction. Covers every
 * publish/visibility state the policies discriminate on.
 */
const SEED = `
insert into auth.users (id) values
  ('${SUPER_ADMIN_ID}'), ('${CLIENT_ADMIN_ID}'), ('${NO_PROFILE_ID}');
insert into public.user_profiles (id, role, full_name) values
  ('${SUPER_ADMIN_ID}', 'super_admin', 'Seed Super'),
  ('${CLIENT_ADMIN_ID}', 'client_admin', 'Seed Client');
insert into public.areas (slug, name, is_active) values
  ('seed-active', '{"en":"Active"}'::jsonb, true),
  ('seed-inactive', '{"en":"Inactive"}'::jsonb, false);
insert into public.properties
  (reference_number, slug, transaction_type, market_type, property_type, location_label, size_sqft, publish_status)
values
  ('SEED-PUB', 'seed-pub', 'sale', 'ready', 'apartment', 'Loc', 100, 'published'),
  ('SEED-DRAFT', 'seed-draft', 'sale', 'ready', 'apartment', 'Loc', 100, 'draft'),
  ('SEED-ARCH', 'seed-arch', 'sale', 'ready', 'apartment', 'Loc', 100, 'archived');
insert into public.property_media (property_id, url, storage_path, media_type, size_bytes)
  select id, 'https://x/y', 'media/'||id, 'image', 1
  from public.properties where slug in ('seed-pub', 'seed-draft');
insert into public.property_stakeholders (property_id, name, type, internal_notes, visibility)
  select id, 'Seed Seller', 'seller', 'private notes', 'public'
  from public.properties where slug = 'seed-pub';
insert into public.legal_pages (slug, title, content, effective_date, status) values
  ('seed-privacy', '{}'::jsonb, '{}'::jsonb, current_date, 'published'),
  ('seed-terms', '{}'::jsonb, '{}'::jsonb, current_date, 'draft');
insert into public.leads (name, phone, source) values ('Seed Lead', '+10000000000', 'homepage');
insert into public.whatsapp_clicks (source) values ('homepage');
insert into public.settings (key, value) values ('whatsapp', '{"v":"x"}'::jsonb);
insert into public.audit_logs (actor_role, action, entity_type) values ('super_admin', 'seed', 'property');
`

interface PsqlResult {
  ok: boolean
  out: string
  err: string
}

function run(script: string): PsqlResult {
  try {
    // -q suppresses command tags (BEGIN/SET/INSERT 0 N/ROLLBACK) so captured stdout is
    // only the measured query's tuple output.
    const out = execFileSync(
      'psql',
      [DB_URL, '-q', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', script],
      { encoding: 'utf-8' }
    )
    return { ok: true, out: out.trim(), err: '' }
  } catch (e) {
    const err = e as { stdout?: Buffer | string; stderr?: Buffer | string }
    return { ok: false, out: String(err.stdout ?? '').trim(), err: String(err.stderr ?? '') }
  }
}

/** Run a catalog/introspection query as postgres (no role switch, no seed). */
export function catalog(query: string): string[] {
  return run(query)
    .out.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

/**
 * Seed fixtures, switch to `role` (optionally as a specific user `sub`), run `query`,
 * then roll everything back. Returns success + captured stdout/stderr so callers can
 * assert either a value (RLS-filtered rows) or a denial (missing grant / failed CHECK).
 */
export function asRole(opts: {
  role: 'anon' | 'authenticated'
  sub?: string
  query: string
}): PsqlResult {
  const claims = opts.sub ? `{"sub":"${opts.sub}"}` : ''
  const script = [
    'begin;',
    SEED,
    `set local role ${opts.role};`,
    `set local request.jwt.claims = '${claims}';`,
    opts.query,
    'rollback;',
  ].join('\n')
  return run(script)
}

/** True when a result is a Postgres permission/grant denial (no table privilege). */
export function isPermissionDenied(r: PsqlResult): boolean {
  return !r.ok && /permission denied/i.test(r.err)
}

/** True when a result is an RLS WITH CHECK / USING violation (grant present, policy denied). */
export function isRlsViolation(r: PsqlResult): boolean {
  return !r.ok && /row-level security/i.test(r.err)
}
