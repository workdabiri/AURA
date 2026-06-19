import { describe, expect, test } from 'vitest'

import { evaluateAccess } from '@/services/auth/policy'
import type { AdminProfile } from '@/services/auth/types'
import {
  asRole,
  CLIENT_ADMIN_ID,
  LOCAL_TESTS,
  NO_PROFILE_ID,
  SUPER_ADMIN_ID,
} from '../security/rls-test-utils'

/**
 * AURA-104 — the admin guard against the REAL RLS substrate (no DB mocking).
 *
 * `getCurrentAdmin()` fetches the caller's OWN `user_profiles` row under their
 * session, then delegates the decision to `evaluateAccess`. Here we drive the exact
 * own-row read the guard performs (via the AURA-103 psql role-sim harness, in a
 * rolled-back transaction — no committed seed), then assert `evaluateAccess` yields
 * the documented allow/deny outcome. Gated by SUPABASE_LOCAL_TESTS=1.
 */

const describeLocal = LOCAL_TESTS ? describe : describe.skip

/** Read the caller's own profile role exactly as the guard does (RLS own-row select). */
function ownRole(sub: string): string | null {
  const r = asRole({
    role: 'authenticated',
    sub,
    query: 'select role from public.user_profiles where id = auth.uid();',
  })
  expect(r.ok, r.err).toBe(true)
  return r.out === '' ? null : r.out
}

describeLocal('admin guard against the real RLS substrate (SUPABASE_LOCAL_TESTS=1)', () => {
  test('super_admin: own profile readable → passes requireAdmin AND requireSuperAdmin', () => {
    expect(ownRole(SUPER_ADMIN_ID)).toBe('super_admin')
    const profile: AdminProfile = {
      id: SUPER_ADMIN_ID,
      role: 'super_admin',
      full_name: 'Seed Super',
    }
    expect(evaluateAccess({ userId: SUPER_ADMIN_ID, profile, requirement: 'admin' }).ok).toBe(true)
    expect(evaluateAccess({ userId: SUPER_ADMIN_ID, profile, requirement: 'super_admin' }).ok).toBe(
      true
    )
  })

  test('client_admin: own profile readable → passes requireAdmin, FAILS requireSuperAdmin', () => {
    expect(ownRole(CLIENT_ADMIN_ID)).toBe('client_admin')
    const profile: AdminProfile = {
      id: CLIENT_ADMIN_ID,
      role: 'client_admin',
      full_name: 'Seed Client',
    }
    expect(evaluateAccess({ userId: CLIENT_ADMIN_ID, profile, requirement: 'admin' }).ok).toBe(true)
    expect(
      evaluateAccess({ userId: CLIENT_ADMIN_ID, profile, requirement: 'super_admin' })
    ).toMatchObject({ ok: false, status: 403, code: 'INSUFFICIENT_ROLE' })
  })

  test('authenticated user with NO profile row → 403 (auth alone is insufficient)', () => {
    expect(ownRole(NO_PROFILE_ID)).toBeNull()
    expect(
      evaluateAccess({ userId: NO_PROFILE_ID, profile: null, requirement: 'admin' })
    ).toMatchObject({ ok: false, status: 403, code: 'NO_PROFILE' })
  })

  test('anon (no verified session) → 401', () => {
    expect(evaluateAccess({ userId: null, profile: null, requirement: 'admin' })).toMatchObject({
      ok: false,
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })
})
