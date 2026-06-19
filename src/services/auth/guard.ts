import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/lib/supabase/server'

import { evaluateAccess } from './policy'
import { AuthorizationError } from './types'
import type { AccessResult, AdminContext, AdminProfile, RoleRequirement } from './types'

/**
 * Admin authorization guard — AURA-104 (D-40, RBAC.md, SECURITY_BASELINE §Auth).
 *
 * Request-path authorization. It runs ENTIRELY under the caller's own session via
 * the anon server client (`createSupabaseServerClient`) — it never uses the
 * privileged RLS-bypassing client. The profile lookup is therefore itself
 * RLS-constrained to the caller's own row.
 *
 * Identity is established with `supabase.auth.getUser()`, which re-validates the
 * JWT against the Auth server — never the unverified, cookie-only session read,
 * which must not drive an authorization decision.
 *
 * Authorization requires ALL of: a verified user, a `user_profiles` row, and a
 * qualifying role — authentication alone is never sufficient. The allow/deny
 * decision itself is delegated to the pure `evaluateAccess` policy.
 */

/** Server (anon, request-scoped) client type. */
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>
/** The verified user object (or null) returned by `auth.getUser()`. */
type VerifiedUser = Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user']

/** Fetch the caller's OWN profile row (RLS restricts the select to `id = auth.uid()`). */
async function fetchOwnProfile(
  supabase: ServerClient,
  userId: string
): Promise<AdminProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, role, full_name')
    .eq('id', userId)
    .maybeSingle<AdminProfile>()

  if (error) {
    return null
  }
  return data
}

/**
 * Verified current user, or null. Uses `getUser()` (re-validated server-side).
 * Returns null on any auth error rather than throwing.
 */
export async function getCurrentUser(): Promise<VerifiedUser> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    return null
  }
  return data.user
}

/**
 * Resolve the caller's admin access without throwing. `requirement` defaults to
 * `'admin'` (either MVP admin role); pass `'super_admin'` to require super_admin.
 */
export async function getCurrentAdmin(
  requirement: RoleRequirement = 'admin'
): Promise<AccessResult> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  const user = error ? null : data.user

  if (!user) {
    return evaluateAccess({ userId: null, profile: null, requirement })
  }

  const profile = await fetchOwnProfile(supabase, user.id)
  return evaluateAccess({ userId: user.id, profile, requirement })
}

/**
 * Require an admin (`super_admin` OR `client_admin`). Returns the admin context on
 * success; throws {@link AuthorizationError} (401/403) on failure.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const result = await getCurrentAdmin('admin')
  if (!result.ok) {
    throw new AuthorizationError(result.status, result.code, result.message)
  }
  return result.context
}

/**
 * Require `super_admin` specifically. Returns the admin context on success; throws
 * {@link AuthorizationError} (401/403) on failure.
 */
export async function requireSuperAdmin(): Promise<AdminContext> {
  const result = await getCurrentAdmin('super_admin')
  if (!result.ok) {
    throw new AuthorizationError(result.status, result.code, result.message)
  }
  return result.context
}
