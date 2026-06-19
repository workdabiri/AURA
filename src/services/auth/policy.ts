/**
 * Authorization policy — AURA-104.
 *
 * Pure decision logic with NO `server-only`, NO Supabase, and NO request access,
 * so it is unit-tested directly. `./guard.ts` supplies the verified user + profile
 * fetched under the caller's session and delegates the allow/deny decision here.
 *
 * Encodes the admin access contract (RBAC.md / SECURITY_BASELINE §Authentication):
 * authentication ALONE is never sufficient — a valid session, a `user_profiles`
 * row, AND a qualifying role are all required.
 */
import type { AccessResult, AdminProfile, RoleRequirement, UserRole } from './types'

/** MVP admin roles (D-30). */
const ADMIN_ROLES: readonly UserRole[] = ['super_admin', 'client_admin']

/** True when `role` is one of the MVP admin roles (`super_admin` | `client_admin`). */
export function isAdminRole(role: string | null | undefined): role is UserRole {
  return typeof role === 'string' && (ADMIN_ROLES as readonly string[]).includes(role)
}

/** True only for `super_admin`. */
export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === 'super_admin'
}

/**
 * Map a (userId, profile, requirement) triple to an allow/deny result.
 *
 * Order matters — it produces the correct 401-vs-403 distinction:
 *   1. no verified user            → 401 UNAUTHENTICATED
 *   2. user but no profile row     → 403 NO_PROFILE        (auth alone insufficient)
 *   3. profile but role too low    → 403 INSUFFICIENT_ROLE
 *   4. otherwise                   → allowed
 */
export function evaluateAccess(input: {
  userId: string | null | undefined
  profile: AdminProfile | null | undefined
  requirement: RoleRequirement
}): AccessResult {
  const { userId, profile, requirement } = input

  if (!userId) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Authentication required.',
    }
  }

  if (!profile) {
    // Valid session but no admin profile — auth is NOT sufficient (D-40 / RBAC).
    return { ok: false, status: 403, code: 'NO_PROFILE', message: 'Access denied.' }
  }

  const cleared =
    requirement === 'super_admin' ? isSuperAdminRole(profile.role) : isAdminRole(profile.role)
  if (!cleared) {
    return { ok: false, status: 403, code: 'INSUFFICIENT_ROLE', message: 'Access denied.' }
  }

  return { ok: true, context: { userId, role: profile.role, profile } }
}
