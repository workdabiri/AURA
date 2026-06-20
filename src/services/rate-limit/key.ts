import { createHmac } from 'node:crypto'

/**
 * AURA-106 — pure rate-limit policy: key hashing + threshold config + result types (D-51).
 *
 * NO `server-only`, NO env, NO I/O — this module is pure and unit-testable. The
 * server-only runtime (salt read + DB RPC) lives in `./limit`. Keeping the HMAC and the
 * threshold table here lets the determinism + config tests run without the real secret.
 *
 * SECURITY (D-18 / D-51 — merge blocker): the raw IP is consumed ONLY as an in-memory
 * argument to {@link hashRateLimitKey}; it is folded into the HMAC and never returned,
 * stored, or logged. Only the resulting `key_hash` ever leaves this module.
 */

/** Logical routes that AURA rate-limits. Config-tunable thresholds (A-03). */
export type RateLimitRoute = 'lead_submit' | 'whatsapp_click' | 'login'

export interface RateLimitRule {
  /** Maximum requests permitted within the rolling window. */
  limit: number
  /** Rolling window length, in seconds. */
  windowSeconds: number
}

/**
 * Locked rate-limit thresholds (A-03 / D-51). Tunable here — a single source of truth
 * consumed by both the service and the tests — without touching call sites:
 *   - `lead_submit`    5 requests / hour
 *   - `whatsapp_click` 30 requests / hour
 *   - `login`          5 requests / 15 minutes
 */
export const RATE_LIMIT_RULES: Record<RateLimitRoute, RateLimitRule> = {
  lead_submit: { limit: 5, windowSeconds: 60 * 60 },
  whatsapp_click: { limit: 30, windowSeconds: 60 * 60 },
  login: { limit: 5, windowSeconds: 15 * 60 },
}

/** Structured outcome of a rate-limit check. NEVER contains the raw IP. */
export interface RateLimitResult {
  /** Whether this request is permitted (count was under the limit). */
  allowed: boolean
  /** The route's configured limit. */
  limit: number
  /** Requests remaining in the current window (0 when denied). */
  remaining: number
  /** The post-consume count for the current window. */
  count: number
  /** When the current window resets and the budget refreshes. */
  resetAt: Date
  /** The route this decision applies to. */
  route: RateLimitRoute
}

/** Type guard: true for a route that has a configured rule. */
export function isRateLimitRoute(route: string): route is RateLimitRoute {
  return Object.prototype.hasOwnProperty.call(RATE_LIMIT_RULES, route)
}

/**
 * Look up a route's rule, throwing on an unknown route so callers fail explicitly
 * rather than silently skipping rate limiting.
 */
export function getRateLimitRule(route: string): RateLimitRule {
  if (!isRateLimitRoute(route)) {
    throw new Error(`Unknown rate-limit route: ${route}`)
  }
  return RATE_LIMIT_RULES[route]
}

/**
 * Deterministic rate-limit key = `HMAC-SHA256(salt, `${ip}:${route}`)` as hex.
 *
 * Pure: the salt is passed in so determinism can be tested without the real secret.
 * The same `(ip, route)` always maps to the same key; a different IP OR a different
 * route yields a different key. The raw IP is never present in the returned hash.
 */
export function hashRateLimitKey(salt: string, ip: string, route: string): string {
  return createHmac('sha256', salt).update(`${ip}:${route}`).digest('hex')
}
