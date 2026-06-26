import { useTranslations } from 'next-intl'

/**
 * Legal page loading state — AURA-205 (D-44 loading). Rendered by Next.js while the server
 * component streams. Presentational only; no data, no Supabase.
 */
export default function PrivacyLoading() {
  const t = useTranslations('Legal')

  return (
    <main className="mx-auto max-w-screen-md px-6 py-12">
      <p role="status" aria-live="polite" className="sr-only">
        {t('loading')}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="h-10 w-2/3 animate-pulse rounded-sm bg-surface-card" />
        <div className="h-4 w-40 animate-pulse rounded-sm bg-surface-card" />
        <div className="mt-4 flex flex-col gap-3">
          <div className="h-4 w-full animate-pulse rounded-sm bg-surface-card" />
          <div className="h-4 w-full animate-pulse rounded-sm bg-surface-card" />
          <div className="h-4 w-5/6 animate-pulse rounded-sm bg-surface-card" />
        </div>
      </div>
    </main>
  )
}
