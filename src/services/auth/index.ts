/**
 * Public surface for the admin auth guard — AURA-104.
 *
 * NOTE: re-exporting `./guard` makes this barrel `server-only`-tainted. Import it
 * from server code only (Route Handlers, Server Components). Tests that need the
 * pure logic import `./policy` / `./types` directly to avoid the server-only guard.
 */
export { getCurrentUser, getCurrentAdmin, requireAdmin, requireSuperAdmin } from './guard'
export { isAdminRole, isSuperAdminRole, evaluateAccess } from './policy'
export { AuthorizationError } from './types'
export type {
  AccessResult,
  AdminContext,
  AdminProfile,
  AuthFailureCode,
  RoleRequirement,
  UserRole,
} from './types'
