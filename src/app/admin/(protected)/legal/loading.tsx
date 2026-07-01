import { AdminShell } from '@/components/admin/AdminShell'

/**
 * Admin legal loading state (`/admin/legal`) — AURA-307 (D-44 loading state).
 * Rendered by the App Router while the server component fetches the admin legal list.
 */
export default function AdminLegalLoading() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 text-text-primary">Legal</h1>
        <p className="text-small text-text-secondary">Loading legal pages…</p>
      </div>
      <div className="mt-6 flex flex-col gap-3" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md border border-border-default bg-surface-card"
          />
        ))}
      </div>
    </AdminShell>
  )
}
