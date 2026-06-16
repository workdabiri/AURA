import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getServerEnv } from '@/lib/config/env'

/**
 * Service-role Supabase client — AURA-101.
 *
 * SECURITY: This client bypasses Row-Level Security. It is server-only and
 * must NEVER be imported by Client Components, browser code, or any module
 * reachable from the client bundle. Enforced by:
 *   - `import 'server-only'` (build-time guard)
 *   - `no-client-to-service-role` dependency-cruiser rule
 *
 * Memoized singleton: the service-role client does not use request-scoped
 * cookies, so a single instance is safe to reuse across the server lifetime.
 * The service-role key is never exported — callers receive the client only.
 */
let serviceRoleClient: SupabaseClient | undefined

export function getSupabaseServiceRole(): SupabaseClient {
  if (serviceRoleClient) {
    return serviceRoleClient
  }

  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv()

  serviceRoleClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return serviceRoleClient
}
