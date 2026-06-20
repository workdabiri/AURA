import 'server-only'

import { getServerEnv } from '@/lib/config/env'
import { getSupabaseServiceRole } from '@/lib/supabase/service-role'

import {
  getRateLimitRule,
  hashRateLimitKey,
  type RateLimitResult,
  type RateLimitRoute,
} from './key'

/**
 * AURA-106 — server-side rate-limit enforcement (D-51).
 *
 * `server-only`: this module reads `RATE_LIMIT_SALT` and uses the service-role client,
 * neither of which may reach the client bundle. The raw IP is accepted ONLY as an
 * in-memory argument — it is hashed into the key and immediately discarded; it is never
 * stored, returned, or logged (D-18 / D-51 merge blocker).
 *
 * Atomic windowing + persistence happen in the SECURITY DEFINER `public.consume_rate_limit`
 * DB function (which keeps `rate_limits` service-role-only). This layer only derives the
 * key and maps the typed result.
 *
 * NOT wired into any route yet — lead / whatsapp / login routes consume this in Phases 3-4.
 */

/** Shape of one row returned by `public.consume_rate_limit` (RETURNS TABLE ...). */
interface ConsumeRow {
  allowed: boolean
  limit_value: number
  remaining: number
  current_count: number
  reset_at: string
}

export interface EnforceRateLimitInput {
  /** Logical route being limited (selects the threshold rule). */
  route: RateLimitRoute
  /** Caller IP — used in-memory to derive the key, never persisted. */
  ip: string
}

/**
 * Check-and-consume one unit of `route`'s budget for the caller identified by `ip`.
 * Returns the structured decision; the caller (a future Route Handler) decides how to
 * respond (e.g. 429 with `resetAt`). The raw IP never appears in the return value.
 */
export async function enforceRateLimit({
  route,
  ip,
}: EnforceRateLimitInput): Promise<RateLimitResult> {
  const rule = getRateLimitRule(route)
  const { RATE_LIMIT_SALT } = getServerEnv()
  const keyHash = hashRateLimitKey(RATE_LIMIT_SALT, ip, route)

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase.rpc('consume_rate_limit', {
    p_key_hash: keyHash,
    p_route: route,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  })

  if (error) {
    throw new Error(`consume_rate_limit failed: ${error.message}`)
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConsumeRow | undefined
  if (!row) {
    throw new Error('consume_rate_limit returned no row')
  }

  return {
    allowed: row.allowed,
    limit: row.limit_value,
    remaining: row.remaining,
    count: row.current_count,
    resetAt: new Date(row.reset_at),
    route,
  }
}
