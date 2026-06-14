import { publicEnvSchema, type PublicEnv } from '@/lib/validation/env.schema'

/**
 * Public, client-safe environment accessor (AURA-005).
 *
 * Exposes ONLY `NEXT_PUBLIC_*` values (validated by `publicEnvSchema`). There is
 * deliberately no `import 'server-only'` here — this module is safe to use from
 * client or server code, and no server secret can be reached through it.
 *
 * Validation is lazy and memoized so the scaffold build/test gates pass without
 * a real `.env`.
 */
let cachedPublicEnv: PublicEnv | undefined

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) {
    return cachedPublicEnv
  }

  // Each `NEXT_PUBLIC_*` var is referenced statically so Next.js can inline it
  // into the client bundle — a dynamic `process.env` read would not be inlined.
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED,
  })
  if (!parsed.success) {
    const invalid = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid or missing public environment variable(s): ${invalid}`)
  }

  cachedPublicEnv = parsed.data
  return cachedPublicEnv
}
