/**
 * AURA-106 — public surface for the server-side rate-limit service (D-51).
 *
 * Re-exporting `./limit` makes this barrel `server-only`-tainted: import it only from
 * server code (Route Handlers, Server Components). Tests that need the pure policy
 * import `./key` directly to avoid the server-only guard. Not consumed by any route
 * yet — lead / whatsapp / login wiring lands in Phases 3-4.
 */
export { enforceRateLimit, type EnforceRateLimitInput } from './limit'
export { RATE_LIMIT_RULES, getRateLimitRule, isRateLimitRoute, hashRateLimitKey } from './key'
export type { RateLimitResult, RateLimitRoute, RateLimitRule } from './key'
