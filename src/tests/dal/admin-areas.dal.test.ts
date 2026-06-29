import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

/**
 * AURA-305 — live-DB contract for the ADMIN area reads + writes (the guarantees the admin DAL
 * relies on). The DAL is `server-only` (can't import into Vitest), so — like the AURA-204 public
 * areas DAL test — this drives the SAME operations as the seeded super_admin role against the live
 * schema inside `begin … rollback` (nothing committed). RLS (`areas_admin_*` / `is_admin()`,
 * AURA-103) is the enforcement boundary; the route's `requireAdmin()` runs first in production.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 *
 * Proves: admin reads ALL areas (active + inactive) while anon reads only active; admin can
 * INSERT/UPDATE (incl. deactivate/reactivate) while anon cannot; HARD DELETE is denied (no grant —
 * deactivation is is_active, never delete); and the admin-only property counts (total + published)
 * computed from properties.area_id are correct.
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const ADMIN_ID = '11111111-1111-1111-1111-111111111111'
const AREA_MARINA = '0d000000-0000-0000-0000-000000000001'
const AREA_PALM = '0d000000-0000-0000-0000-000000000002'
const AREA_HIDDEN = '0d000000-0000-0000-0000-000000000003'

/**
 * Seed (run as postgres, which bypasses RLS): one super_admin, three areas (marina + palm active,
 * hidden inactive), and properties linked via area_id — marina has 1 published + 1 draft + 1
 * archived; palm has 1 published; plus one published property with NO area (area_id null).
 */
const SEED = `
insert into auth.users (id) values ('${ADMIN_ID}');
insert into public.user_profiles (id, role, full_name) values ('${ADMIN_ID}', 'super_admin', 'Seed Super');
insert into public.areas (id, slug, name, is_active, sort_order) values
  ('${AREA_MARINA}', 'marina',  '{"en":"Marina"}'::jsonb, true,  1),
  ('${AREA_PALM}',   'palm',    '{"en":"Palm"}'::jsonb,   true,  2),
  ('${AREA_HIDDEN}', 'secret',  '{"en":"Secret"}'::jsonb, false, 3);
insert into public.properties
  (reference_number, slug, transaction_type, market_type, property_type, location_label, size_sqft, publish_status, area_id)
values
  ('A-PUB-1',  'a-pub-1',  'sale', 'ready', 'apartment', 'Loc', 100, 'published', '${AREA_MARINA}'),
  ('A-DRAFT',  'a-draft',  'sale', 'ready', 'apartment', 'Loc', 100, 'draft',     '${AREA_MARINA}'),
  ('A-ARCH',   'a-arch',   'sale', 'ready', 'apartment', 'Loc', 100, 'archived',  '${AREA_MARINA}'),
  ('B-PUB-1',  'b-pub-1',  'sale', 'ready', 'apartment', 'Loc', 100, 'published', '${AREA_PALM}'),
  ('C-NOAREA', 'c-noarea', 'sale', 'ready', 'apartment', 'Loc', 100, 'published', null);
`

interface PsqlResult {
  ok: boolean
  out: string
  err: string
}

/** Seed + switch role (optionally as a user `sub`) + run query, all rolled back. */
function asRole(opts: { role: 'anon' | 'authenticated'; sub?: string; query: string }): PsqlResult {
  const claims = opts.sub ? `{"sub":"${opts.sub}"}` : ''
  const script = [
    'begin;',
    SEED,
    `set local role ${opts.role};`,
    `set local request.jwt.claims = '${claims}';`,
    opts.query,
    'rollback;',
  ].join('\n')
  try {
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

function isPermissionDenied(r: PsqlResult): boolean {
  return !r.ok && /permission denied/i.test(r.err)
}

describe.skipIf(!LOCAL_TESTS)('AURA-305 admin areas DAL (live DB, role-claimed)', () => {
  test('admin reads ALL areas (active + inactive)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: 'select count(*) from public.areas;',
    })
    expect(r.ok, r.err).toBe(true)
    expect(r.out).toBe('3')
  })

  test('anon reads ONLY active areas (inactive hidden by RLS)', () => {
    const r = asRole({ role: 'anon', query: 'select count(*) from public.areas;' })
    expect(r.out).toBe('2')
  })

  test('anon cannot read the inactive area by slug', () => {
    const r = asRole({
      role: 'anon',
      query: "select count(*) from public.areas where slug = 'secret';",
    })
    expect(r.out).toBe('0')
  })

  test('admin can INSERT a new area', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query:
        'insert into public.areas (slug, name, is_active, sort_order) values (\'admin-new\', \'{"en":"New"}\'::jsonb, true, 0);',
    })
    expect(r.ok, r.err).toBe(true)
  })

  test('anon CANNOT insert an area (no grant)', () => {
    const r = asRole({
      role: 'anon',
      query:
        'insert into public.areas (slug, name, is_active) values (\'anon-x\', \'{"en":"X"}\'::jsonb, true);',
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('admin can UPDATE (deactivate) an area; reactivation is the same path', () => {
    const deactivate = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: "update public.areas set is_active = false where slug = 'marina';",
    })
    expect(deactivate.ok, deactivate.err).toBe(true)
    const reactivate = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: "update public.areas set is_active = true where slug = 'secret';",
    })
    expect(reactivate.ok, reactivate.err).toBe(true)
  })

  test('anon CANNOT update an area (no grant)', () => {
    const r = asRole({
      role: 'anon',
      query: "update public.areas set is_active = false where slug = 'marina';",
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('HARD DELETE is denied for admin (no delete grant — deactivate only)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: "delete from public.areas where slug = 'secret';",
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('slug uniqueness is enforced (duplicate slug insert fails)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query:
        'insert into public.areas (slug, name, is_active) values (\'marina\', \'{"en":"Dup"}\'::jsonb, true);',
    })
    expect(r.ok).toBe(false)
    expect(r.err).toMatch(/duplicate key|unique/i)
  })

  test('admin-only property counts: total + published per area are correct', () => {
    // Mirrors the DAL aggregation source: admin reads area_id + publish_status for all linked rows.
    const counts = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query:
        "select area_id, count(*), count(*) filter (where publish_status = 'published') " +
        'from public.properties where area_id is not null group by area_id order by area_id;',
    })
    expect(counts.ok, counts.err).toBe(true)
    const rows = counts.out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    // marina: 3 total / 1 published ; palm: 1 total / 1 published. (noarea property excluded.)
    expect(rows).toContain(`${AREA_MARINA}|3|1`)
    expect(rows).toContain(`${AREA_PALM}|1|1`)
  })

  test('anon cannot read draft/archived property rows (counts are admin-only)', () => {
    const r = asRole({
      role: 'anon',
      query: "select count(*) from public.properties where area_id = '" + AREA_MARINA + "';",
    })
    // Anon RLS shows only the 1 published marina property — never the draft/archived ones.
    expect(r.out).toBe('1')
  })

  // --- Area-image storage feasibility (AURA-105 bucket reused, no migration) ---------
  // The representative image lives in the property-media bucket under an `areas/` prefix. The
  // AURA-105 storage.objects admin policies are scoped to bucket_id + is_admin() with NO path
  // restriction, so an admin may write that prefix and anon may not — proving the upload path
  // works WITHOUT any migration or Supabase config change.

  test('admin can write a storage object under the areas/ prefix in property-media', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query:
        'insert into storage.objects (bucket_id, name) values ' +
        `('property-media', 'areas/${AREA_MARINA}/0d000000-0000-0000-0000-0000000000a1.jpg');`,
    })
    expect(r.ok, r.err).toBe(true)
  })

  test('anon CANNOT write a storage object in property-media (RLS denies)', () => {
    const r = asRole({
      role: 'anon',
      query:
        "insert into storage.objects (bucket_id, name) values ('property-media', 'areas/x/y.jpg');",
    })
    expect(r.ok).toBe(false)
    expect(r.err).toMatch(/row-level security|permission denied/i)
  })
})
