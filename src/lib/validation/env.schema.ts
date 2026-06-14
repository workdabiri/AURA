import { z } from 'zod'

/**
 * AURA environment schema (AURA-005).
 *
 * Pure Zod schemas only — NO `server-only` import, NO `process.env` access, and
 * NO top-level parsing. This module must stay importable from any layer
 * (including Vitest, which runs in Node) so the validation logic can be
 * exercised directly. The `server-only` guard and the lazy `process.env`
 * parsing live in `src/lib/config/env.ts` and `src/lib/config/env.public.ts`.
 */

/**
 * Optional boolean-ish flag. Accepts `true` | `false` | `1` | `0`; treats an
 * unset or empty value as `false`. Returns a real boolean.
 */
const optionalBooleanFlag = z
  .preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.enum(['true', 'false', '1', '0']).optional()
  )
  .transform((value) => value === 'true' || value === '1')

/**
 * Public, client-safe environment variables.
 *
 * Every key MUST be prefixed `NEXT_PUBLIC_` — these values are inlined into the
 * browser bundle. NEVER add a secret to this schema.
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: optionalBooleanFlag,
})

/**
 * Server-only environment variables. NEVER exposed to the client bundle.
 *
 * Accessed exclusively through `src/lib/config/env.ts`, which is guarded by
 * `import 'server-only'`. Required vars fail validation when absent; optional
 * vars are feature-gated and wired in later phases.
 */
export const serverEnvSchema = z.object({
  // Required
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RATE_LIMIT_SALT: z.string().min(1),
  // Optional (feature-gated)
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>
