/**
 * Admin area status badge — AURA-305.
 *
 * Presentational only (no data, no Supabase/DAL/services). Renders the active/inactive state of
 * an area with luxury-dark tokens. Inactive areas are hidden from the public surface (AURA-204).
 */
export function AreaStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption uppercase tracking-widest ${
        isActive
          ? 'border-brand-accent/50 text-brand-accent'
          : 'border-border-default text-text-secondary opacity-70'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
