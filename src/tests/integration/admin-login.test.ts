import { describe, expect, test } from 'vitest'

import { evaluateAccess } from '@/services/auth/policy'
import type { AdminProfile } from '@/services/auth/types'
import { RATE_LIMIT_RULES } from '@/services/rate-limit/key'

import {
  asRole,
  CLIENT_ADMIN_ID,
  LOCAL_TESTS,
  NO_PROFILE_ID,
  SUPER_ADMIN_ID,
} from '../security/rls-test-utils'

/**
 * AURA-301 — admin login integration: the policy wiring the login action depends on.
 *
 * The login action (1) rate-limits with the AURA-106 `login` rule, then (2) authorizes the
 * just-signed-in user with the AURA-104 guard's `resolveAdminAccess`, which fetches the
 * caller's own `user_profiles` row and delegates to `evaluateAccess`. These tests lock in
 * the rate-limit threshold and the allow/deny contract WITHOUT needing production secrets;
 * the live-DB block proves the own-row read the action relies on against the real RLS
 * substrate (gated by SUPABASE_LOCAL_TESTS=1).
 */
describe('login rate-limit policy (A-03 / AURA-106)', () => {
  test('the login rule is 5 requests / 15 minutes', () => {
    expect(RATE_LIMIT_RULES.login).toEqual({ limit: 5, windowSeconds: 15 * 60 })
  })
})

describe('login authorization contract — auth alone is never sufficient (D-40)', () => {
  test('signed in but no profile row → denied (403 NO_PROFILE)', () => {
    expect(
      evaluateAccess({ userId: SUPER_ADMIN_ID, profile: null, requirement: 'admin' })
    ).toMatchObject({ ok: false, status: 403, code: 'NO_PROFILE' })
  })

  test('profile present with an admin role → allowed', () => {
    const profile: AdminProfile = { id: CLIENT_ADMIN_ID, role: 'client_admin', full_name: 'C' }
    expect(evaluateAccess({ userId: CLIENT_ADMIN_ID, profile, requirement: 'admin' }).ok).toBe(true)
  })

  test('no verified user (failed sign-in) → denied (401)', () => {
    expect(evaluateAccess({ userId: null, profile: null, requirement: 'admin' })).toMatchObject({
      ok: false,
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })
})

const describeLocal = LOCAL_TESTS ? describe : describe.skip

describeLocal(
  'login own-profile read against the real RLS substrate (SUPABASE_LOCAL_TESTS=1)',
  () => {
    /** The own-row select the login action performs post sign-in (RLS: id = auth.uid()). */
    function ownRole(sub: string): string | null {
      const r = asRole({
        role: 'authenticated',
        sub,
        query: 'select role from public.user_profiles where id = auth.uid();',
      })
      expect(r.ok, r.err).toBe(true)
      return r.out === '' ? null : r.out
    }

    test('a seeded admin can read its own role → login would authorize', () => {
      expect(ownRole(SUPER_ADMIN_ID)).toBe('super_admin')
      expect(ownRole(CLIENT_ADMIN_ID)).toBe('client_admin')
    })

    test('an authenticated non-admin has no profile row → login would deny', () => {
      expect(ownRole(NO_PROFILE_ID)).toBeNull()
    })
  }
)
