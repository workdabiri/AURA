import { AdminShell } from '@/components/admin/AdminShell'

/**
 * Admin properties loading state (`/admin/properties`) — AURA-303 (D-44 loading state).
 * Rendered by the App Router while the server component fetches the admin list.
 */
export default function AdminPropertiesLoading() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 text-text-primary">Properties</h1>
        <p className="text-small text-text-secondary">Loading properties…</p>
      </div>
      <div className="mt-6 flex flex-col gap-3" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md border border-border-default bg-surface-card"
          />
        ))}
      </div>
    </AdminShell>
  )
}
