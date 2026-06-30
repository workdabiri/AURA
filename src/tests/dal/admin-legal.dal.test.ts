import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

/**
 * AURA-307 — live-DB contract for the ADMIN legal reads + writes (the guarantees the admin DAL
 * relies on). The DAL is `server-only` (can't import into Vitest), so — like the AURA-305 admin
 * areas DAL test — this drives the SAME operations as the seeded super_admin role against the live
 * schema inside `begin … rollback` (nothing committed). RLS (`legal_pages_admin_*` / `is_admin()`,
 * AURA-103) is the enforcement boundary; the route's `requireAdmin()` runs first in production.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 *
 * Proves: admin reads ALL legal pages (draft + published + archived) while anon reads only
 * published; admin can INSERT/UPDATE while anon cannot; HARD DELETE is denied (no grant — archive
 * only); the partial unique index allows at most one PUBLISHED row per slug; and the publish
 * sequence (archive previous published → promote draft) preserves the public published-only read
 * boundary.
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const ADMIN_ID = '11111111-1111-1111-1111-111111111111'
const PRIV_PUB = '0e000000-0000-0000-0000-0000000000a1'
const PRIV_DRAFT = '0e000000-0000-0000-0000-0000000000a2'
const TERMS_ARCH = '0e000000-0000-0000-0000-0000000000b1'

/**
 * Seed (run as postgres, bypasses RLS): one super_admin; privacy has a published v1 + a draft v2;
 * terms has a single archived v1 (no published terms row).
 */
const SEED = `
insert into auth.users (id) values ('${ADMIN_ID}');
insert into public.user_profiles (id, role, full_name) values ('${ADMIN_ID}', 'super_admin', 'Seed Super');
insert into public.legal_pages (id, slug, title, content, effective_date, status, version) values
  ('${PRIV_PUB}',   'privacy', '{"en":"Privacy"}'::jsonb,   '{"en":"# Privacy"}'::jsonb,   '2026-01-01', 'published', 1),
  ('${PRIV_DRAFT}', 'privacy', '{"en":"Privacy v2"}'::jsonb,'{"en":"# Privacy v2"}'::jsonb,'2026-03-01', 'draft',     2),
  ('${TERMS_ARCH}', 'terms',   '{"en":"Old Terms"}'::jsonb, '{"en":"# Old"}'::jsonb,       '2025-01-01', 'archived',  1);
`

interface PsqlResult {
  ok: boolean
  out: string
  err: string
}

function runScript(lines: string[]): PsqlResult {
  try {
    const out = execFileSync(
      'psql',
      [DB_URL, '-q', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', lines.join('\n')],
      { encoding: 'utf-8' }
    )
    return { ok: true, out: out.trim(), err: '' }
  } catch (e) {
    const err = e as { stdout?: Buffer | string; stderr?: Buffer | string }
    return { ok: false, out: String(err.stdout ?? '').trim(), err: String(err.stderr ?? '') }
  }
}

/** Seed + switch role (optionally as a user `sub`) + run query, all rolled back. */
function asRole(opts: { role: 'anon' | 'authenticated'; sub?: string; query: string }): PsqlResult {
  const claims = opts.sub ? `{"sub":"${opts.sub}"}` : ''
  return runScript([
    'begin;',
    SEED,
    `set local role ${opts.role};`,
    `set local request.jwt.claims = '${claims}';`,
    opts.query,
    'rollback;',
  ])
}

function isPermissionDenied(r: PsqlResult): boolean {
  return !r.ok && /permission denied/i.test(r.err)
}

describe.skipIf(!LOCAL_TESTS)('AURA-307 admin legal DAL (live DB, role-claimed)', () => {
  test('admin reads ALL legal rows (draft + published + archived)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: 'select count(*) from public.legal_pages;',
    })
    expect(r.ok, r.err).toBe(true)
    expect(r.out).toBe('3')
  })

  test('anon reads ONLY published legal rows (draft/archived hidden by RLS)', () => {
    const r = asRole({ role: 'anon', query: 'select count(*) from public.legal_pages;' })
    expect(r.out).toBe('1')
  })

  test('anon cannot read the draft or archived row by id', () => {
    const draft = asRole({
      role: 'anon',
      query: `select count(*) from public.legal_pages where id = '${PRIV_DRAFT}';`,
    })
    expect(draft.out).toBe('0')
    const arch = asRole({
      role: 'anon',
      query: `select count(*) from public.legal_pages where id = '${TERMS_ARCH}';`,
    })
    expect(arch.out).toBe('0')
  })

  test('admin can INSERT a new draft', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query:
        'insert into public.legal_pages (slug, title, content, effective_date, status, version) ' +
        'values (\'terms\', \'{"en":"Terms"}\'::jsonb, \'{"en":"# Terms"}\'::jsonb, current_date, \'draft\', 1);',
    })
    expect(r.ok, r.err).toBe(true)
  })

  test('admin can UPDATE a draft row', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: `update public.legal_pages set title = '{"en":"Edited"}'::jsonb where id = '${PRIV_DRAFT}';`,
    })
    expect(r.ok, r.err).toBe(true)
  })

  test('anon CANNOT insert a legal page (no grant)', () => {
    const r = asRole({
      role: 'anon',
      query:
        'insert into public.legal_pages (slug, title, content, effective_date, status) ' +
        "values ('privacy', '{}'::jsonb, '{}'::jsonb, current_date, 'draft');",
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon CANNOT update a legal page (no grant)', () => {
    const r = asRole({
      role: 'anon',
      query: `update public.legal_pages set status = 'published' where id = '${PRIV_DRAFT}';`,
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('HARD DELETE is denied for admin (no delete grant — archive only)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: `delete from public.legal_pages where id = '${PRIV_DRAFT}';`,
    })
    expect(r.ok).toBe(false)
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('partial unique index forbids two PUBLISHED rows for the same slug', () => {
    // privacy already has a published v1; promoting the draft to published without archiving v1 first
    // violates legal_pages_slug_published_key.
    const r = asRole({
      role: 'authenticated',
      sub: ADMIN_ID,
      query: `update public.legal_pages set status = 'published' where id = '${PRIV_DRAFT}';`,
    })
    expect(r.ok).toBe(false)
    expect(r.err).toMatch(/duplicate key|unique/i)
  })

  test('publish sequence (archive previous → promote draft) preserves published-only boundary', () => {
    // The DAL order: archive the currently-published row FIRST, then promote the draft. Run both
    // admin writes + an anon read in one rolled-back transaction.
    const r = runScript([
      'begin;',
      SEED,
      `set local role authenticated;`,
      `set local request.jwt.claims = '{"sub":"${ADMIN_ID}"}';`,
      `update public.legal_pages set status = 'archived' where id = '${PRIV_PUB}';`,
      `update public.legal_pages set status = 'published', version = 3, published_at = now() where id = '${PRIV_DRAFT}';`,
      `reset role;`,
      `set local role anon;`,
      `set local request.jwt.claims = '';`,
      // Anon must see exactly one published privacy row, and it must be the newly-promoted v3.
      `select version from public.legal_pages where slug = 'privacy';`,
      'rollback;',
    ])
    expect(r.ok, r.err).toBe(true)
    expect(r.out).toBe('3')
  })

  test('after archiving the only published row, anon sees no published page for that slug', () => {
    const r = runScript([
      'begin;',
      SEED,
      `set local role authenticated;`,
      `set local request.jwt.claims = '{"sub":"${ADMIN_ID}"}';`,
      `update public.legal_pages set status = 'archived' where id = '${PRIV_PUB}';`,
      `reset role;`,
      `set local role anon;`,
      `set local request.jwt.claims = '';`,
      `select count(*) from public.legal_pages where slug = 'privacy';`,
      'rollback;',
    ])
    expect(r.ok, r.err).toBe(true)
    // privacy v1 archived, v2 still draft → anon sees zero privacy rows (public route → 404).
    expect(r.out).toBe('0')
  })
})
