import type { LegalPageStatus } from '@/domain/legal/admin'

/**
 * Admin legal status badge — AURA-307.
 *
 * Presentational only (no data, no Supabase/DAL/services). Renders the draft / published /
 * archived state of a legal page version with luxury-dark tokens. Published pages are the only
 * ones visible on the public surface (AURA-205).
 */
const STYLES: Record<LegalPageStatus, string> = {
  published: 'border-brand-accent/50 text-brand-accent',
  draft: 'border-border-default text-text-primary',
  archived: 'border-border-default text-text-secondary opacity-70',
}

export function LegalPageStatusBadge({ status }: { status: LegalPageStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption uppercase tracking-widest ${STYLES[status]}`}
    >
      {status}
    </span>
  )
}
