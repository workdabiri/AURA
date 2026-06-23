import { useTranslations } from 'next-intl'

/**
 * Property detail loading state — AURA-203 (D-44 loading). Rendered by Next.js while the
 * server component streams. Presentational only; no data, no Supabase.
 */
export default function PropertyDetailLoading() {
  const t = useTranslations('PropertyDetail')

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-12">
      <p role="status" aria-live="polite" className="sr-only">
        {t('loading')}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="h-5 w-48 animate-pulse rounded-sm bg-surface-card" />
        <div className="h-10 w-2/3 animate-pulse rounded-sm bg-surface-card" />
        <div className="h-6 w-40 animate-pulse rounded-sm bg-surface-card" />
        <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="aspect-[16/9] w-full animate-pulse rounded-md bg-surface-card" />
            <div className="h-24 w-full animate-pulse rounded-md bg-surface-card" />
          </div>
          <div className="h-48 w-full animate-pulse rounded-md bg-surface-card lg:col-span-1" />
        </div>
      </div>
    </main>
  )
}
