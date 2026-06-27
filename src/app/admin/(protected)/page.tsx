import { redirect } from 'next/navigation'

/**
 * Admin index (`/admin`) — AURA-302.
 *
 * `/admin` is not a page in its own right: it forwards to the dashboard. It stays INSIDE
 * the `(protected)` group, so the AURA-301 layout guard runs FIRST — an unauthenticated
 * request is sent to `/admin/login` by the guard before this redirect is ever reached, and
 * an authorized request is forwarded on to `/admin/dashboard`. There is no second dashboard
 * shell rendered here (AURA-302 owns a single shell, at `/admin/dashboard`).
 */
export default function AdminIndexPage() {
  redirect('/admin/dashboard')
}
