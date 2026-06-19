import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { LOCAL_TESTS } from '../security/rls-test-utils'

/**
 * AURA-104 — DB substrate for the seed-admin bootstrap (no DB mocking).
 *
 * The script's effect is an `insert` into `public.user_profiles` for an existing
 * Auth user, guarded by classifyProfileAction (insert / noop / conflict). Here we
 * prove the underlying DB invariants on the local stack — exactly one super_admin
 * row results, and a duplicate insert is rejected by the primary key (which is why
 * the script must, and does, guard re-runs). Everything runs inside a rolled-back
 * transaction — no committed seed data. Gated by SUPABASE_LOCAL_TESTS=1.
 */

const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const describeLocal = LOCAL_TESTS ? describe : describe.skip

// A fresh id distinct from the rls-test-utils fixtures.
const SEED_USER_ID = '0b3f1d6e-1c2a-4b8e-9f33-2a1b4c5d6e7f'

function runSql(sql: string): { ok: boolean; out: string; err: string } {
  try {
    const out = execFileSync(
      'psql',
      [DB_URL, '-q', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql],
      { encoding: 'utf-8' }
    )
    return { ok: true, out: out.trim(), err: '' }
  } catch (e) {
    const err = e as { stdout?: Buffer | string; stderr?: Buffer | string }
    return { ok: false, out: String(err.stdout ?? '').trim(), err: String(err.stderr ?? '') }
  }
}

/** Wrap statements in a rolled-back transaction — nothing is committed. */
function tx(...statements: string[]): { ok: boolean; out: string; err: string } {
  return runSql(['begin;', ...statements, 'rollback;'].join('\n'))
}

const mkAuthUser = `insert into auth.users (id) values ('${SEED_USER_ID}');`
const insertProfile = `insert into public.user_profiles (id, role, full_name) values ('${SEED_USER_ID}', 'super_admin', 'Bootstrap Admin');`

describeLocal('seed-admin DB substrate (SUPABASE_LOCAL_TESTS=1)', () => {
  test('insert path creates exactly one super_admin profile for an existing Auth user', () => {
    const count = tx(
      mkAuthUser,
      insertProfile,
      `select count(*)::text from public.user_profiles where id = '${SEED_USER_ID}';`
    )
    expect(count.ok, count.err).toBe(true)
    expect(count.out).toBe('1')

    const role = tx(
      mkAuthUser,
      insertProfile,
      `select role::text from public.user_profiles where id = '${SEED_USER_ID}';`
    )
    expect(role.out).toBe('super_admin')
  })

  test('idempotency invariant: a duplicate insert is rejected by the primary key', () => {
    // The script never issues a second insert (classifyProfileAction → noop/conflict);
    // this proves the DB-level uniqueness it relies on.
    const r = tx(mkAuthUser, insertProfile, insertProfile, 'select 1;')
    expect(r.ok).toBe(false)
    expect(r.err).toMatch(/duplicate key value|unique constraint/i)
  })
})
