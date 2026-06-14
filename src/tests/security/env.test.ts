import { afterEach, describe, expect, test, vi } from 'vitest'

import { getPublicEnv } from '@/lib/config/env.public'
import { publicEnvSchema, serverEnvSchema } from '@/lib/validation/env.schema'

const SERVER_ONLY_KEYS = Object.keys(serverEnvSchema.shape)

describe('env secrets boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('public schema exposes only NEXT_PUBLIC_* keys', () => {
    for (const key of Object.keys(publicEnvSchema.shape)) {
      expect(key.startsWith('NEXT_PUBLIC_')).toBe(true)
    }
  })

  test('no server-only key leaks into the public schema', () => {
    const publicKeys = Object.keys(publicEnvSchema.shape)
    for (const serverKey of SERVER_ONLY_KEYS) {
      expect(publicKeys).not.toContain(serverKey)
    }
  })

  test('getPublicEnv() returns public keys only, even when a server secret is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
    // A server secret present in the process environment must NEVER surface here.
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'should-never-leak-to-public')

    const publicEnv = getPublicEnv()
    const keys = Object.keys(publicEnv)

    for (const serverKey of SERVER_ONLY_KEYS) {
      expect(keys).not.toContain(serverKey)
    }
    expect(keys).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(Object.values(publicEnv)).not.toContain('should-never-leak-to-public')
  })
})
