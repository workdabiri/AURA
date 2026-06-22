import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PropertyCard } from '@/components/real-estate/PropertyCard'
import { parseListingQuery, type ListingQuery } from '@/domain/properties/query'
import { listPublishedProperties } from '@/dal/properties.dal'

import { PropertyFilters } from './_components/PropertyFilters'

/**
 * Public properties listing — AURA-202.
 *
 * Server Component: reads `searchParams`, validates them with the domain schema, then calls
 * the DAL directly (no API round-trip, no client-side fetching, no react-query). Renders all
 * D-44 states: success grid, empty, validation-error, and data-error (the loading state is
 * `loading.tsx`; an unexpected throw is caught by `error.tsx`). Published-only is enforced in
 * the DAL via the anon client + RLS.
 *
 * Inherits `dynamic = 'force-dynamic'` from the `[locale]` layout, so this is never
 * statically prerendered — the DB is read at request time only.
 */
export default async function PropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('Properties')
  const tStates = await getTranslations('ListingStates')

  // Flatten to a string record (first value wins) and DROP empty strings so blank filter
  // inputs (the form submits `?transaction_type=` for an unset <select>) are treated as
  // absent rather than failing enum/number validation.
  const sp = await searchParams
  const rawParams: Record<string, string> = {}
  for (const [key, value] of Object.entries(sp)) {
    const raw = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined
    if (typeof raw === 'string' && raw !== '') rawParams[key] = raw
  }

  const parsed = parseListingQuery(rawParams)

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-12">
      <header className="mb-8">
        <h1 className="font-display text-h1 text-text-primary">{t('title')}</h1>
        <p className="mt-2 max-w-prose text-body text-text-secondary">{t('intro')}</p>
      </header>

      <section aria-label={t('filters.heading')} className="mb-10">
        <PropertyFilters locale={locale} current={rawParams} />
      </section>

      {!parsed.success ? (
        <p role="alert" className="text-body text-text-secondary">
          {tStates('validationError')}
        </p>
      ) : (
        <ListingResults query={parsed.data} />
      )}
    </main>
  )
}

async function ListingResults({ query }: { query: ListingQuery }) {
  const t = await getTranslations('Properties')
  const tStates = await getTranslations('ListingStates')

  let result
  try {
    result = await listPublishedProperties(query)
  } catch {
    return (
      <p role="alert" className="text-body text-text-secondary">
        {tStates('error')}
      </p>
    )
  }

  if (result.items.length === 0) {
    return (
      <div className="rounded-md border border-border-default bg-surface-card p-10 text-center">
        <p className="text-body text-text-primary">{tStates('empty')}</p>
        <p className="mt-2 text-small text-text-secondary">{tStates('emptyHint')}</p>
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-small text-text-secondary">
        {t('resultsCount', { count: result.total })}
      </p>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-label={t('title')}
      >
        {result.items.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} />
          </li>
        ))}
      </ul>
    </>
  )
}
