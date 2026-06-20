import { describe, expect, test } from 'vitest'

import {
  getRateLimitRule,
  hashRateLimitKey,
  isRateLimitRoute,
  RATE_LIMIT_RULES,
  type RateLimitRoute,
} from '@/services/rate-limit/key'

/**
 * AURA-106 — pure unit tests for the rate-limit policy module (key.ts, D-51).
 *
 * Covers HMAC determinism, the no-raw-IP-in-output guarantee, the threshold config,
 * and explicit handling of unknown routes. No secret, no DB — runs in CI.
 */

const SALT = 'test-salt-not-the-real-one'
const IP = '203.0.113.7' // TEST-NET-3 documentation IP

describe('hashRateLimitKey — determinism', () => {
  test('same salt + ip + route → same hash', () => {
    expect(hashRateLimitKey(SALT, IP, 'lead_submit')).toBe(
      hashRateLimitKey(SALT, IP, 'lead_submit')
    )
  })

  test('same ip, different route → different hash', () => {
    expect(hashRateLimitKey(SALT, IP, 'lead_submit')).not.toBe(
      hashRateLimitKey(SALT, IP, 'whatsapp_click')
    )
  })

  test('different ip, same route → different hash', () => {
    expect(hashRateLimitKey(SALT, IP, 'login')).not.toBe(
      hashRateLimitKey(SALT, '198.51.100.42', 'login')
    )
  })

  test('different salt → different hash (salt actually participates)', () => {
    expect(hashRateLimitKey(SALT, IP, 'login')).not.toBe(
      hashRateLimitKey('a-different-salt', IP, 'login')
    )
  })

  test('output is a 64-char hex digest', () => {
    expect(hashRateLimitKey(SALT, IP, 'lead_submit')).toMatch(/^[0-9a-f]{64}$/)
  })

  test('hash output never contains the raw IP (D-18 / D-51)', () => {
    const hash = hashRateLimitKey(SALT, IP, 'lead_submit')
    expect(hash.includes(IP)).toBe(false)
    expect(hash.includes('203')).toBe(false)
  })
})

describe('RATE_LIMIT_RULES — locked thresholds (A-03)', () => {
  test('lead_submit = 5 per hour', () => {
    expect(RATE_LIMIT_RULES.lead_submit).toEqual({ limit: 5, windowSeconds: 3600 })
  })

  test('whatsapp_click = 30 per hour', () => {
    expect(RATE_LIMIT_RULES.whatsapp_click).toEqual({ limit: 30, windowSeconds: 3600 })
  })

  test('login = 5 per 15 minutes', () => {
    expect(RATE_LIMIT_RULES.login).toEqual({ limit: 5, windowSeconds: 900 })
  })

  test('exactly the three locked routes are configured', () => {
    expect(Object.keys(RATE_LIMIT_RULES).sort()).toEqual(
      ['lead_submit', 'login', 'whatsapp_click'].sort()
    )
  })
})

describe('route handling', () => {
  test('isRateLimitRoute recognises configured routes', () => {
    for (const route of Object.keys(RATE_LIMIT_RULES) as RateLimitRoute[]) {
      expect(isRateLimitRoute(route)).toBe(true)
    }
  })

  test('isRateLimitRoute rejects unknown routes', () => {
    expect(isRateLimitRoute('admin_delete')).toBe(false)
    expect(isRateLimitRoute('')).toBe(false)
  })

  test('getRateLimitRule returns the rule for a known route', () => {
    expect(getRateLimitRule('login')).toEqual({ limit: 5, windowSeconds: 900 })
  })

  test('getRateLimitRule throws explicitly on an unknown route', () => {
    expect(() => getRateLimitRule('nope')).toThrow(/unknown rate-limit route/i)
  })
})
