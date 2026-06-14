import { describe, expect, test } from 'vitest'

import { publicEnvSchema, serverEnvSchema } from '@/lib/validation/env.schema'

describe('env.schema — server', () => {
  const validServerEnv = {
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    RATE_LIMIT_SALT: 'a-sufficiently-long-random-salt',
  }

  test('accepts a valid server env with optional vars omitted', () => {
    expect(() => serverEnvSchema.parse(validServerEnv)).not.toThrow()
  })

  test('rejects when a required server var is missing (fail fast)', () => {
    expect(() => serverEnvSchema.parse({})).toThrow()
    expect(() => serverEnvSchema.parse({ SUPABASE_SERVICE_ROLE_KEY: 'only-one' })).toThrow()
  })

  test('rejects an invalid optional email', () => {
    expect(() =>
      serverEnvSchema.parse({ ...validServerEnv, ADMIN_NOTIFICATION_EMAIL: 'not-an-email' })
    ).toThrow()
  })
})

describe('env.schema — public', () => {
  const validPublicEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  }

  test('accepts a valid public env; omitted analytics flag defaults to false', () => {
    const parsed = publicEnvSchema.parse(validPublicEnv)
    expect(parsed.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED).toBe(false)
  })

  test('coerces the analytics flag to a boolean', () => {
    const truthy = ['true', '1']
    const falsy = ['false', '0']
    for (const value of truthy) {
      expect(
        publicEnvSchema.parse({ ...validPublicEnv, NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: value })
          .NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED
      ).toBe(true)
    }
    for (const value of falsy) {
      expect(
        publicEnvSchema.parse({ ...validPublicEnv, NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: value })
          .NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED
      ).toBe(false)
    }
  })

  test('rejects a malformed URL', () => {
    expect(() =>
      publicEnvSchema.parse({ ...validPublicEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' })
    ).toThrow()
  })

  test('rejects when a required public var is missing', () => {
    expect(() => publicEnvSchema.parse({})).toThrow()
  })
})
