import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

/**
 * AURA-306 — live-DB contract for the ADMIN settings reads + writes (the guarantees the admin DAL
 * relies on). The DAL is `server-only` (can't import into Vitest), so — like the AURA-305 admin
 * areas DAL test — this drives the SAME operations as the seeded admin role against the live schema
 * inside `begin … rollback` (nothing committed). RLS (`settings_admin_select/insert/update` /
 * `is_admin()`, AURA-103) is the enforcement boundary; the route's `requireAdmin()` runs first in
 * production.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 *
 * Proves: an admin can SELECT/INSERT/UPDATE (upsert) settings while anon can do NONE of those;
 * HARD DELETE is denied (no delete policy — owner decision: no settings delete); and an upserted
 * value is read back unchanged — exactly the row the public service-role selector projects, so a
 * settings change is reflected on the next public request.
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const ADMIN_ID = '11111111-1111-1111-1111-111111111111'

/** Seed (run as postgres, which bypasses RLS): one client_admin. settings starts empty. */
const SEED = `
insert into auth.users (id) values ('${ADMIN_ID}');
insert into public.user_profiles (id, role, full_name) values ('${ADMIN_ID}', 'client_admin', 'Seed Admin');
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

describe.skipIf(!LOCAL_TESTS)('AURA-306 admin settings DAL (live DB, role-claimed)', () => {
  test('admin can SELECT settings', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: 'select count(*) from public.settings;',
    })
    expect(r.ok, r.err).toBe(true)
  })

  test('admin can INSERT a setting (upsert insert path)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query:
        "insert into public.settings (key, value, updated_by) values ('agency_name', '\"AUTEX\"'::jsonb, '" +
        ADMIN_ID +
        "');",
    })
    expect(r.ok, r.err).toBe(true)
  })

  test('admin can UPDATE a setting (upsert conflict path)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: [
        "insert into public.settings (key, value) values ('footer_tagline', '\"Old\"'::jsonb);",
        "insert into public.settings (key, value, updated_by) values ('footer_tagline', '\"New\"'::jsonb, '" +
          ADMIN_ID +
          "') on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by;",
      ].join('\n'),
    })
    expect(r.ok, r.err).toBe(true)
  })

  test('an upserted value is read back unchanged (what the public selector projects)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: [
        "insert into public.settings (key, value) values ('agency_name', '\"AUTEX Estates\"'::jsonb) on conflict (key) do update set value = excluded.value;",
        "select value::text from public.settings where key = 'agency_name';",
      ].join('\n'),
    })
    expect(r.ok, r.err).toBe(true)
    expect(r.out).toBe('"AUTEX Estates"')
  })

  test('anon CANNOT select settings (no anon policy)', () => {
    const r = asRole({ role: 'anon', query: 'select count(*) from public.settings;' })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon CANNOT insert a setting (no grant)', () => {
    const r = asRole({
      role: 'anon',
      query: "insert into public.settings (key, value) values ('agency_name', '\"X\"'::jsonb);",
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon CANNOT update a setting (no grant)', () => {
    const r = asRole({
      role: 'anon',
      query: "update public.settings set value = '\"X\"'::jsonb where key = 'agency_name';",
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('HARD DELETE is denied for admin (no delete policy — no settings delete)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: [
        "insert into public.settings (key, value) values ('agency_name', '\"X\"'::jsonb);",
        "delete from public.settings where key = 'agency_name';",
      ].join('\n'),
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })
})
