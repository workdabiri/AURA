import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { listActiveAreas } from '@/dal/areas.dal'
import { publicRouteMetadata } from '@/lib/seo/routes'

import { AreaCard } from './_components/AreaCard'

// AURA-206: static SEO metadata (title/description + default-`noindex` robots, D-42).
export const metadata: Metadata = publicRouteMetadata('areas')

/**
 * Public areas overview — AURA-204.
 *
 * Server Component: calls the DAL directly (no API round-trip, no client-side fetching). Renders
 * the applicable D-44 states: success grid, empty, and data-error (the loading state is
 * `loading.tsx`; an unexpected throw is caught by `error.tsx`, which also provides retry).
 * Active-only is enforced in the DAL via the anon client + RLS. No query params, no filters,
 * no property data, no area-detail links — informational cards only (AURA-204 owner decisions).
 *
 * Inherits `dynamic = 'force-dynamic'` from the `[locale]` layout, so this is never statically
 * prerendered — the DB is read at request time only.
 */
export default async function AreasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('Areas')

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-12">
      <header className="mb-8">
        <h1 className="font-display text-h1 text-text-primary">{t('title')}</h1>
        <p className="mt-2 max-w-prose text-body text-text-secondary">{t('intro')}</p>
      </header>

      <AreasResults />
    </main>
  )
}

async function AreasResults() {
  const t = await getTranslations('Areas')
  const tStates = await getTranslations('AreaStates')

  let areas
  try {
    areas = await listActiveAreas()
  } catch {
    return (
      <p role="alert" className="text-body text-text-secondary">
        {tStates('error')}
      </p>
    )
  }

  if (areas.length === 0) {
    return (
      <div className="rounded-md border border-border-default bg-surface-card p-10 text-center">
        <p className="text-body text-text-primary">{tStates('empty')}</p>
      </div>
    )
  }

  return (
    <ul
      role="list"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-label={t('title')}
    >
      {areas.map((area) => (
        <li key={area.slug}>
          <AreaCard area={area} />
        </li>
      ))}
    </ul>
  )
}
