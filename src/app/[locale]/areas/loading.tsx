import { useTranslations } from 'next-intl'

/**
 * Areas loading state — AURA-204 (D-44 loading). Rendered by Next.js while the server
 * component streams. Presentational only; no data, no Supabase.
 */
export default function AreasLoading() {
  const t = useTranslations('AreaStates')

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-12">
      <p role="status" aria-live="polite" className="sr-only">
        {t('loading')}
      </p>
      <div aria-hidden="true" className="space-y-8">
        <div className="h-10 w-48 animate-pulse rounded-sm bg-surface-card" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-md border border-border-default">
              <div className="aspect-[4/3] w-full animate-pulse bg-surface-card" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-2/3 animate-pulse rounded-sm bg-surface-card" />
                <div className="h-4 w-full animate-pulse rounded-sm bg-surface-card" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
