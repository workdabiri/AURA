import type { Metadata } from 'next'

import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel'
import { AdminShell } from '@/components/admin/AdminShell'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Admin dashboard shell (`/admin/dashboard`) — AURA-302.
 *
 * Authenticated dashboard SHELL only: navigation to the future admin sections plus
 * placeholder panels. It performs NO data reads — no Supabase, no DAL, no services, no
 * metrics/aggregation (those arrive in AURA-303+ / AURA-406). Access is enforced entirely
 * by the AURA-301 `(protected)` layout guard (server-side, fail-closed); this page adds no
 * auth logic of its own and lives INSIDE the `(protected)` group so it is always guarded —
 * it must never be created at `src/app/admin/dashboard/**` (that would be unguarded).
 *
 * Admin is always `noindex` (inherited from the admin root layout; re-asserted here).
 */
export const metadata: Metadata = {
  title: 'Dashboard · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

/** Static section descriptors — labels + copy only, never counts or live data. */
const SECTION_PANELS = [
  {
    title: 'Properties',
    description: 'Create, edit, publish, and archive listings.',
  },
  {
    title: 'Leads',
    description: 'Review and manage incoming enquiries.',
  },
  {
    title: 'Areas',
    description: 'Add, edit, and deactivate areas.',
  },
  {
    title: 'Settings',
    description: 'Manage operational settings and contact details.',
  },
  {
    title: 'Legal',
    description: 'Edit and publish the Privacy and Terms pages.',
  },
] as const

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 text-text-primary">Dashboard</h1>
        <p className="max-w-2xl text-small text-text-secondary">
          Welcome to the AUTEX Estates Dubai admin workspace. This is the navigation shell — the
          individual management sections and their data are delivered in later tasks. No live
          operational data is shown here yet.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {SECTION_PANELS.map((panel) => (
          <AdminPlaceholderPanel
            key={panel.title}
            title={panel.title}
            description={panel.description}
          />
        ))}
      </div>
    </AdminShell>
  )
}
