import { AdminNav } from './AdminNav'

/**
 * Admin sidebar — AURA-302.
 *
 * Presentational shell chrome: the `AUTEX Admin` brand label + the primary admin nav.
 * Non-localized, static copy, luxury-dark tokens. No data, no Supabase/DAL/services import.
 * Full-width strip on mobile; a fixed-width left rail from `md` up.
 */
export function AdminSidebar() {
  return (
    <aside className="border-b border-border-default bg-surface-card md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 px-5 py-5">
        <span className="font-display text-h3 tracking-wide text-text-primary">AUTEX Admin</span>
        <span className="text-caption uppercase tracking-widest text-text-secondary">
          Demo workspace
        </span>
      </div>
      <AdminNav />
    </aside>
  )
}
