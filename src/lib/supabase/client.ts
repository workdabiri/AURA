import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser (anon) Supabase client — AURA-101.
 *
 * Uses only public NEXT_PUBLIC_* env vars; never imports server-only modules.
 * Call from Client Components or browser-side code only.
 * Do NOT use this client for service-role operations — see service-role.ts.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
