import { AdminShell } from '@/components/admin/AdminShell'

/**
 * Admin settings loading state (`/admin/settings`) — AURA-306 (D-44 loading state).
 * Rendered by the App Router while the server component reads the editable settings.
 */
export default function AdminSettingsLoading() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 text-text-primary">Settings</h1>
        <p className="text-small text-text-secondary">Loading settings…</p>
      </div>
      <div className="mt-6 flex max-w-2xl flex-col gap-3" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md border border-border-default bg-surface-card"
          />
        ))}
      </div>
    </AdminShell>
  )
}
