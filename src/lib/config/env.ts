import 'server-only'

import { serverEnvSchema, type ServerEnv } from '@/lib/validation/env.schema'

/**
 * Server-only environment accessor (AURA-005).
 *
 * `import 'server-only'` turns any attempt to import this module from a Client
 * Component into a build error — this is the secrets-boundary guard required by
 * the task. Service-role key, rate-limit salt, and other server secrets are
 * reachable only through here.
 *
 * Validation is lazy and memoized: nothing is parsed at import time, so the
 * scaffold build/test/quality gates pass without a real `.env`. The first
 * server-side call fails fast when a required variable is missing or invalid.
 */
let cachedServerEnv: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv
  }

  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const invalid = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid or missing server environment variable(s): ${invalid}`)
  }

  cachedServerEnv = parsed.data
  return cachedServerEnv
}
