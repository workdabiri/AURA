import { describe, expect, test } from 'vitest'

/**
 * Supabase DAL smoke tests — AURA-101.
 *
 * Real local-stack connection tests are gated behind SUPABASE_LOCAL_TESTS=1.
 * Run them manually with a running `supabase start`:
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 *
 * CI Dockerized Supabase stack is deferred to AURA-107. Until then, the CI path
 * passes without a running stack (real-connection tests are skipped, not failed).
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'

describe('Supabase client importability (CI smoke)', () => {
  test('createBrowserClient is importable from @supabase/ssr', async () => {
    const { createBrowserClient } = await import('@supabase/ssr')
    expect(typeof createBrowserClient).toBe('function')
  })

  test('createServerClient is importable from @supabase/ssr', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    expect(typeof createServerClient).toBe('function')
  })

  test('createClient is importable from @supabase/supabase-js', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    expect(typeof createClient).toBe('function')
  })
})

describe('Supabase local-stack connection smoke (requires SUPABASE_LOCAL_TESTS=1)', () => {
  test.skipIf(!LOCAL_TESTS)(
    'can reach local Supabase API endpoint (SUPABASE_LOCAL_TESTS=1 + supabase start required)',
    async () => {
      // Local stack defaults: URL printed by `supabase start` or set in .env.local.
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon-key-placeholder'

      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, anonKey)

      // Issue a request that always succeeds at the network level (401 or 200, not a fetch error).
      // We are proving the client can reach the local stack, not that tables exist.
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      })

      expect(response.status).not.toBe(0)
      expect(response).toBeDefined()

      // Silence TS unused-variable check for the supabase client created above.
      expect(supabase).toBeDefined()
    }
  )
})
