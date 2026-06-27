import { redirect } from 'next/navigation'

import { getCurrentAdmin } from '@/services/auth'

/**
 * Protected admin layout — AURA-301.
 *
 * Server-side guard for EVERY route under `/admin` except the login page (which lives
 * outside this `(protected)` group, so it is never wrapped — no redirect loop). Enforces
 * the full AURA-104 contract: a verified session AND a `user_profiles` row AND an admin
 * role (D-30/D-40) — authentication alone is never sufficient, and the check is entirely
 * server-side (no client-only gating).
 *
 * Failure is mapped to a redirect that leaks no internal reason:
 *   - 401 (no verified session) → `/admin/login` (clean)
 *   - 403 (signed in, not an admin) → `/admin/login?error=unauthorized` (generic message)
 *
 * FAIL CLOSED: if the guard itself throws (e.g. a misconfigured environment or an Auth
 * outage), we deny access and send the caller to the login page rather than rendering the
 * protected tree — access is never granted on error.
 */
export const dynamic = 'force-dynamic'

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  let access
  try {
    access = await getCurrentAdmin('admin')
  } catch {
    redirect('/admin/login')
  }

  if (!access.ok) {
    redirect(access.status === 403 ? '/admin/login?error=unauthorized' : '/admin/login')
  }

  return <>{children}</>
}
