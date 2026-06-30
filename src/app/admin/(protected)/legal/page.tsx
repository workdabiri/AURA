import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { LegalPageRowActions } from '@/components/admin/LegalPageRowActions'
import { LegalPageStatusBadge } from '@/components/admin/LegalPageStatusBadge'
import { listAdminLegalPages } from '@/dal/legal.dal'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Admin legal list (`/admin/legal`) — AURA-307.
 *
 * Server component INSIDE the `(protected)` group, so the AURA-301 layout guard runs first
 * (server-side, fail-closed) — there is no unguarded `src/app/admin/legal/**`. Reads ALL legal
 * pages/versions (draft + published + archived) via the admin DAL (the admin's own session + RLS;
 * no service role here). Row mutations (publish/archive) go through the role-guarded API routes via
 * the `LegalPageRowActions` client island.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Legal · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

export default async function AdminLegalPage() {
  const pages = await listAdminLegalPages()

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-h2 text-text-primary">Legal</h1>
          <p className="text-small text-text-secondary">
            Privacy and Terms pages. Draft → publish → archive, versioned. {pages.length} total.
          </p>
        </div>
        <Link
          href="/admin/legal/new"
          className="rounded-md border border-border-default bg-surface-card px-4 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay"
        >
          New draft
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border-default bg-surface-card p-10 text-center">
          <p className="text-small text-text-secondary">No legal pages yet.</p>
          <Link
            href="/admin/legal/new"
            className="mt-4 inline-block rounded-md border border-border-default px-4 py-2 text-small text-text-primary transition-colors hover:bg-surface-overlay"
          >
            Create the first draft
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border-default">
          <table className="w-full min-w-[720px] border-collapse text-left text-small">
            <thead>
              <tr className="border-b border-border-default bg-surface-card text-caption uppercase tracking-widest text-text-secondary">
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Effective</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-4 py-3 font-mono text-text-secondary">{p.slug}</td>
                  <td className="px-4 py-3 text-text-primary">{p.title || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">v{p.version}</td>
                  <td className="px-4 py-3">
                    <LegalPageStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.effectiveDate || '—'}</td>
                  <td className="px-4 py-3">
                    <LegalPageRowActions id={p.id} status={p.status} />
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
