import type { PublishStatus } from '@/domain/properties/admin'

/**
 * Admin property status badge — AURA-303.
 *
 * Presentational only (no data, no Supabase/DAL/services). Renders the `publish_status`
 * lifecycle state (draft / published / archived — D-32) with luxury-dark tokens.
 */
const STATUS_LABEL: Record<PublishStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

const STATUS_CLASS: Record<PublishStatus, string> = {
  draft: 'border-border-default text-text-secondary',
  published: 'border-brand-accent/50 text-brand-accent',
  archived: 'border-border-default text-text-secondary opacity-70',
}

export function PropertyStatusBadge({ status }: { status: PublishStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption uppercase tracking-widest ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
