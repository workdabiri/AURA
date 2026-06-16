import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getServerEnv } from '@/lib/config/env'

/**
 * Server (anon) Supabase client — AURA-101.
 *
 * Request-scoped: do NOT memoize. Cookies are per-request; a cached client
 * would share cookie state across requests. Create once per Server Component
 * or Route Handler invocation.
 *
 * Calls getServerEnv() to validate all required server-only env vars are
 * configured before any Supabase call (fail-fast).
 *
 * Next.js 15: cookies() is async — this function must be awaited.
 */
export async function createSupabaseServerClient() {
  getServerEnv()
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies are read-only there.
            // Session refresh is handled by middleware; this is safe to ignore.
          }
        },
      },
    }
  )
}
