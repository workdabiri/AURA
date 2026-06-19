/**
 * Auth guard types — AURA-104.
 *
 * Pure types + the typed authorization error. NO `server-only` import and NO
 * runtime/Supabase access here, so this module stays importable from any layer
 * (including Vitest in Node) and the authorization contract can be unit-tested
 * directly. The request-path binding lives in `./guard.ts` (server-only).
 */
import type { Enums, Tables } from '@/types/database'

/** MVP roles (D-30). Sourced from the generated DB enum — only these two exist. */
export type UserRole = Enums<'user_role'>

/**
 * Minimal projection of `user_profiles` the guard reads under the caller's own
 * session. Role is the authorization source of truth (`public.user_profiles.role`).
 */
export type AdminProfile = Pick<Tables<'user_profiles'>, 'id' | 'role' | 'full_name'>

/** The role bar a request must clear: any admin, or super_admin specifically. */
export type RoleRequirement = 'admin' | 'super_admin'

/** Authenticated AND authorized admin context returned on success. */
export interface AdminContext {
  userId: string
  role: UserRole
  profile: AdminProfile
}

/** Structured failure reasons. `code` is for server logs/handlers, not the client. */
export type AuthFailureCode = 'UNAUTHENTICATED' | 'NO_PROFILE' | 'INSUFFICIENT_ROLE'

/**
 * Non-throwing guard outcome (discriminated union). Route handlers can branch on
 * `ok` and map `status`/`code` onto the API error envelope ({ error, code }).
 */
export type AccessResult =
  | { ok: true; context: AdminContext }
  | { ok: false; status: 401 | 403; code: AuthFailureCode; message: string }

/**
 * Thrown by the `require*` guards. Carries the HTTP status (401 vs 403) and a
 * stable `code` so a later Route Handler can translate it to the documented
 * error envelope without leaking internal detail (API_SPEC §Error Response).
 */
export class AuthorizationError extends Error {
  readonly status: 401 | 403
  readonly code: AuthFailureCode

  constructor(status: 401 | 403, code: AuthFailureCode, message: string) {
    super(message)
    this.name = 'AuthorizationError'
    this.status = status
    this.code = code
  }
}
