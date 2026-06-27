/**
 * Admin placeholder panel — AURA-302.
 *
 * A static "coming soon" card for the dashboard shell. It deliberately shows NO real data,
 * counts, or metrics — only a section label + description + a not-yet-available badge — so
 * the shell never implies live operational data exists. Presentational props only.
 */
export function AdminPlaceholderPanel({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-h3 text-text-primary">{title}</h2>
        <span className="rounded-full border border-border-default px-2.5 py-0.5 text-caption uppercase tracking-widest text-text-secondary">
          Coming soon
        </span>
      </div>
      <p className="text-small text-text-secondary">{description}</p>
    </section>
  )
}
