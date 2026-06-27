/**
 * Admin top bar — AURA-302.
 *
 * Thin header strip above the admin content area. Static, presentational only. The
 * "no live data" tag reinforces that this shell shows no real operational data yet
 * (metrics/data reads arrive in later tasks). No data, no Supabase/DAL/services import.
 */
export function AdminTopBar() {
  return (
    <header className="border-b border-border-default bg-surface-page">
      <div className="flex items-center justify-between gap-3 px-6 py-4 md:px-10">
        <span className="text-small font-medium text-text-secondary">
          AUTEX Estates Dubai · Admin
        </span>
        <span className="rounded-full border border-border-default px-3 py-1 text-caption uppercase tracking-widest text-text-secondary">
          Demo · no live data
        </span>
      </div>
    </header>
  )
}
