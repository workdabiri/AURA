import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { getAdminSettings } from '@/dal/settings.dal'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Admin settings (`/admin/settings`) — AURA-306.
 *
 * Server component INSIDE the `(protected)` group, so the AURA-301 layout guard runs first
 * (server-side, fail-closed) — there is no unguarded `src/app/admin/settings/**`. Reads the
 * editable settings via the admin DAL (the admin's own session + RLS; no service role here) and
 * passes them to the `SettingsForm` client island, which PATCHes the role-guarded API route.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Settings · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings()

  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 text-text-primary">Settings</h1>
        <p className="max-w-2xl text-small text-text-secondary">
          Agency contact details and footer content shown on the public site. Changes are saved
          immediately.
        </p>
      </div>
      <div className="mt-6 max-w-2xl">
        <SettingsForm settings={settings} />
      </div>
    </AdminShell>
  )
}
