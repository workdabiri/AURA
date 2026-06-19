import { describe, expect, test } from 'vitest'

import { evaluateAccess, isAdminRole, isSuperAdminRole } from '@/services/auth/policy'
import type { AdminProfile } from '@/services/auth/types'

const superProfile: AdminProfile = { id: 'u-super', role: 'super_admin', full_name: 'Super' }
const clientProfile: AdminProfile = { id: 'u-client', role: 'client_admin', full_name: 'Client' }

describe('auth role predicates (AURA-104)', () => {
  test('isAdminRole accepts both MVP admin roles', () => {
    expect(isAdminRole('super_admin')).toBe(true)
    expect(isAdminRole('client_admin')).toBe(true)
  })

  test('isAdminRole rejects unknown/empty/null roles (non-MVP roles never qualify)', () => {
    expect(isAdminRole('editor')).toBe(false)
    expect(isAdminRole('viewer')).toBe(false)
    expect(isAdminRole('')).toBe(false)
    expect(isAdminRole(null)).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
  })

  test('isSuperAdminRole is true only for super_admin', () => {
    expect(isSuperAdminRole('super_admin')).toBe(true)
    expect(isSuperAdminRole('client_admin')).toBe(false)
    expect(isSuperAdminRole(null)).toBe(false)
  })
})

describe('evaluateAccess — authenticated negatives (AURA-104, completing AURA-103 deferrals)', () => {
  test('no verified session/user → 401 UNAUTHENTICATED', () => {
    expect(evaluateAccess({ userId: null, profile: null, requirement: 'admin' })).toMatchObject({
      ok: false,
      status: 401,
      code: 'UNAUTHENTICATED',
    })
  })

  test('session present but NO user_profiles row → 403 NO_PROFILE (auth alone is insufficient)', () => {
    expect(evaluateAccess({ userId: 'u-1', profile: null, requirement: 'admin' })).toMatchObject({
      ok: false,
      status: 403,
      code: 'NO_PROFILE',
    })
  })

  test('profile present but role insufficient for requireSuperAdmin → 403 INSUFFICIENT_ROLE', () => {
    expect(
      evaluateAccess({
        userId: clientProfile.id,
        profile: clientProfile,
        requirement: 'super_admin',
      })
    ).toMatchObject({ ok: false, status: 403, code: 'INSUFFICIENT_ROLE' })
  })
})

describe('evaluateAccess — positives (AURA-104)', () => {
  test('super_admin passes requireAdmin', () => {
    const r = evaluateAccess({
      userId: superProfile.id,
      profile: superProfile,
      requirement: 'admin',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.context.role).toBe('super_admin')
      expect(r.context.userId).toBe('u-super')
    }
  })

  test('client_admin passes requireAdmin', () => {
    expect(
      evaluateAccess({ userId: clientProfile.id, profile: clientProfile, requirement: 'admin' }).ok
    ).toBe(true)
  })

  test('super_admin passes requireSuperAdmin', () => {
    expect(
      evaluateAccess({ userId: superProfile.id, profile: superProfile, requirement: 'super_admin' })
        .ok
    ).toBe(true)
  })

  test('client_admin FAILS requireSuperAdmin', () => {
    expect(
      evaluateAccess({
        userId: clientProfile.id,
        profile: clientProfile,
        requirement: 'super_admin',
      }).ok
    ).toBe(false)
  })
})
