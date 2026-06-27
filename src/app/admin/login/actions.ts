'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resolveAdminAccess } from '@/services/auth'
import { loginInputSchema, type LoginFormState } from '@/services/auth/login'
import { enforceRateLimit } from '@/services/rate-limit'

/**
 * Admin login server action — AURA-301.
 *
 * Server-side only ('use server'): credentials, the rate-limit service (service-role +
 * salt), and the auth guard all stay off the client. Flow:
 *   1. Validate input (Zod). A parse failure → generic `validation`.
 *   2. Rate-limit BEFORE any auth attempt (A-03: 5 / 15 min / key, AURA-106 `login` rule).
 *      The raw IP is used only in-memory to derive the salted-hash key — never stored or
 *      logged (D-18 / D-51).
 *   3. Sign in server-side. Any failure → generic `invalid_credentials` (no enumeration).
 *   4. Authorize: a verified user is NOT enough — require a `user_profiles` row with an
 *      admin role (D-30/D-40) via the AURA-104 guard. If not authorized, sign the session
 *      back out and return generic `unauthorized`.
 *   5. On success, redirect to `/admin`.
 *
 * Nothing here logs passwords, tokens, cookies, JWTs, or IPs; Supabase errors are mapped
 * to generic codes and never surfaced verbatim.
 */

/** First hop of `x-forwarded-for` (or `x-real-ip`), used in-memory only. Never logged/stored. */
async function getRequestIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return h.get('x-real-ip')?.trim() ?? 'unknown'
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginInputSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'validation' }
  }

  // Rate-limit first so brute-force attempts are throttled before touching auth.
  try {
    const decision = await enforceRateLimit({ route: 'login', ip: await getRequestIp() })
    if (!decision.allowed) {
      return { error: 'rate_limited' }
    }
  } catch {
    // Never leak rate-limiter/internal failure detail to the client.
    return { error: 'generic' }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })
  if (error || !data.user) {
    return { error: 'invalid_credentials' }
  }

  // Auth alone is insufficient — require a qualifying admin profile (D-40 / RBAC).
  const access = await resolveAdminAccess(supabase, data.user.id, 'admin')
  if (!access.ok) {
    await supabase.auth.signOut()
    return { error: 'unauthorized' }
  }

  redirect('/admin')
}
