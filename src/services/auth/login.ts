/**
 * Admin login contract — AURA-301.
 *
 * Pure module: NO `server-only`, NO Supabase, NO request access — only the Zod input
 * schema and the typed result/error vocabulary. This keeps the login input validation
 * unit-testable directly (Vitest, Node) and lets the server action import the schema and
 * the client form import the (type-only) result shape without crossing the secrets
 * boundary. The user-facing copy lives in the UI; this module only carries stable codes.
 */
import { z } from 'zod'

/**
 * Login input schema. Intentionally minimal — a syntactically valid email and a
 * non-empty password. We never reveal WHICH field failed or whether an account exists;
 * a parse failure maps to a single generic `validation` error in the UI.
 */
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof loginInputSchema>

/**
 * Stable, non-enumerating outcome codes returned by the login action. Each maps to a
 * generic user-facing message in the form; none reveals whether an email exists, whether
 * credentials were valid-but-unauthorized vs invalid, or any internal Supabase detail.
 */
export type LoginErrorCode =
  | 'validation'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'unauthorized'
  | 'generic'

/** Server-action state consumed by the login form (`useActionState`). */
export interface LoginFormState {
  error: LoginErrorCode | null
}
