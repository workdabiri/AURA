import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { AreaRowActions } from '@/components/admin/AreaRowActions'
import { AreaStatusBadge } from '@/components/admin/AreaStatusBadge'
import { listAdminAreas } from '@/dal/admin-areas.dal'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Admin areas list (`/admin/areas`) — AURA-305.
 *
 * Server component INSIDE the `(protected)` group, so the AURA-301 layout guard runs first
 * (server-side, fail-closed) — there is no unguarded `src/app/admin/areas/**`. Reads ALL areas
 * (active + inactive) with admin-only property counts via the admin DAL (the admin's own session
 * + RLS; no service role here). Row mutations go through the role-guarded API route via the
 * `AreaRowActions` client island.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Areas · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

export default async function AdminAreasPage() {
  const areas = await listAdminAreas()

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-h2 text-text-primary">Areas</h1>
          <p className="text-small text-text-secondary">
            Create, edit, and deactivate communities. {areas.length} total.
          </p>
        </div>
        <Link
          href="/admin/areas/new"
          className="rounded-md border border-border-default bg-surface-card px-4 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay"
        >
          New area
        </Link>
      </div>

      {areas.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border-default bg-surface-card p-10 text-center">
          <p className="text-small text-text-secondary">No areas yet.</p>
          <Link
            href="/admin/areas/new"
            className="mt-4 inline-block rounded-md border border-border-default px-4 py-2 text-small text-text-primary transition-colors hover:bg-surface-overlay"
          >
            Create the first area
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border-default">
          <table className="w-full min-w-[720px] border-collapse text-left text-small">
            <thead>
              <tr className="border-b border-border-default bg-surface-card text-caption uppercase tracking-widest text-text-secondary">
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium">Properties</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-4 py-3">
                    {area.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={area.imageUrl}
                        alt={`${area.name || area.slug} image`}
                        className="h-10 w-16 rounded object-cover"
                      />
                    ) : (
                      <span className="text-caption text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{area.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{area.slug}</td>
                  <td className="px-4 py-3">
                    <AreaStatusBadge isActive={area.isActive} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{area.sortOrder}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {area.publishedProperties} published / {area.totalProperties} total
                  </td>
                  <td className="px-4 py-3">
                    <AreaRowActions id={area.id} isActive={area.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  )
}
