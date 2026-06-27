import { describe, expect, test } from 'vitest'

import { loginInputSchema, type LoginInput } from '@/services/auth/login'

/**
 * AURA-301 — pure login input contract.
 *
 * The server action delegates all input shape decisions to `loginInputSchema`, so the
 * accept/reject boundary is unit-tested here directly (no server-only, no DB). A parse
 * failure maps to a single generic `validation` error in the UI — these tests only prove
 * what is and isn't structurally accepted.
 */
describe('loginInputSchema (AURA-301)', () => {
  test('accepts a syntactically valid email + non-empty password', () => {
    const result = loginInputSchema.safeParse({
      email: 'admin@example.com',
      password: 'a-password',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      const value: LoginInput = result.data
      expect(value.email).toBe('admin@example.com')
    }
  })

  test('rejects a malformed email', () => {
    expect(loginInputSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false)
  })

  test('rejects an empty password', () => {
    expect(loginInputSchema.safeParse({ email: 'admin@example.com', password: '' }).success).toBe(
      false
    )
  })

  test('rejects missing fields', () => {
    expect(loginInputSchema.safeParse({}).success).toBe(false)
    expect(loginInputSchema.safeParse({ email: 'admin@example.com' }).success).toBe(false)
  })

  test('rejects non-string inputs (e.g. a missing FormData field returns null)', () => {
    expect(loginInputSchema.safeParse({ email: null, password: null }).success).toBe(false)
  })
})
