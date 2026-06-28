import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { PropertyRowActions } from '@/components/admin/PropertyRowActions'
import { PropertyStatusBadge } from '@/components/admin/PropertyStatusBadge'
import { listAdminProperties } from '@/dal/admin-properties.dal'
import { PUBLISH_STATUSES, type PublishStatus } from '@/domain/properties/admin'
import { resolvePriceDisplay } from '@/domain/properties/format'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Admin properties list (`/admin/properties`) — AURA-303.
 *
 * Server component INSIDE the `(protected)` group, so the AURA-301 layout guard runs first
 * (server-side, fail-closed) — there is no unguarded `src/app/admin/properties/**`. Reads ALL
 * statuses via the admin DAL (the admin's own session + RLS; no service role here). Row
 * mutations go through the role-guarded API routes via the `PropertyRowActions` client island.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Properties · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

const PAGE_SIZE = 20

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function asStatus(value: string | undefined): PublishStatus | undefined {
  return value && (PUBLISH_STATUSES as readonly string[]).includes(value)
    ? (value as PublishStatus)
    : undefined
}

function buildHref(params: { page?: number; status?: string; search?: string }): string {
  const sp = new URLSearchParams()
  if (params.status) sp.set('status', params.status)
  if (params.search) sp.set('search', params.search)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `/admin/properties?${qs}` : '/admin/properties'
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const status = asStatus(first(sp.status))
  const search = first(sp.search)?.trim() || undefined
  const pageRaw = Number(first(sp.page))
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1

  const { items, total } = await listAdminProperties({ page, limit: PAGE_SIZE, status, search })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-h2 text-text-primary">Properties</h1>
          <p className="text-small text-text-secondary">
            Create, edit, publish, duplicate, and archive listings. {total} total.
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="rounded-md border border-border-default bg-surface-card px-4 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay"
        >
          New property
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-small text-text-secondary">
          <span>Status</span>
          <select
            name="status"
            defaultValue={status ?? ''}
            className="rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary"
          >
            <option value="">All statuses</option>
            {PUBLISH_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-small text-text-secondary">
          <span>Search title</span>
          <input
            name="search"
            defaultValue={search ?? ''}
            placeholder="Title contains…"
            className="rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary"
          />
        </label>
        <button
          type="submit"
          className="rounded-md border border-border-default bg-surface-card px-4 py-2 text-small text-text-primary transition-colors hover:bg-surface-overlay"
        >
          Apply
        </button>
        {(status || search) && (
          <Link href="/admin/properties" className="text-small text-text-secondary underline">
            Clear
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border-default bg-surface-card p-10 text-center">
          <p className="text-small text-text-secondary">
            No properties found{status || search ? ' for this filter' : ''}.
          </p>
          <Link
            href="/admin/properties/new"
            className="mt-4 inline-block rounded-md border border-border-default px-4 py-2 text-small text-text-primary transition-colors hover:bg-surface-overlay"
          >
            Create the first property
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border-default">
          <table className="w-full min-w-[720px] border-collapse text-left text-small">
            <thead>
              <tr className="border-b border-border-default bg-surface-card text-caption uppercase tracking-widest text-text-secondary">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const price = resolvePriceDisplay(item)
                return (
                  <tr key={item.id} className="border-b border-border-default last:border-b-0">
                    <td className="px-4 py-3 font-mono text-text-secondary">
                      {item.referenceNumber}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{item.title || '—'}</td>
                    <td className="px-4 py-3">
                      <PropertyStatusBadge status={item.publishStatus} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {item.transactionType} · {item.propertyType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {price.kind === 'amount' ? price.formatted : 'On application'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{item.updatedAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <PropertyRowActions id={item.id} status={item.publishStatus} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
          <span className="text-caption uppercase tracking-widest text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: page - 1, status, search })}
                className="rounded-md border border-border-default px-3 py-1.5 text-small text-text-secondary hover:bg-surface-overlay"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: page + 1, status, search })}
                className="rounded-md border border-border-default px-3 py-1.5 text-small text-text-secondary hover:bg-surface-overlay"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </AdminShell>
  )
}
