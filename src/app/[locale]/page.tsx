import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PropertyCard } from '@/components/real-estate/PropertyCard'
import type { PropertyCardDTO } from '@/domain/properties/card'
import { FEATURED_DEFAULT_LIMIT } from '@/domain/properties/query'
import { listFeaturedProperties } from '@/dal/properties.dal'

/**
 * Homepage — AURA-008 hero + AURA-202 featured properties section.
 *
 * The featured section is populated by the published-featured DAL selector and FAILS CLOSED:
 * any error (DB/env unavailable) yields an empty list so the homepage always renders (build,
 * e2e, and production are resilient without a seeded DB). No cinematic/GSAP treatment here —
 * that is AURA-502. Inherits `dynamic = 'force-dynamic'` from the `[locale]` layout.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  let featured: PropertyCardDTO[] = []
  try {
    featured = await listFeaturedProperties(FEATURED_DEFAULT_LIMIT)
  } catch {
    featured = []
  }

  return (
    <main className="bg-surface-page text-text-primary">
      <section
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        aria-label="Hero"
      >
        <p className="mb-4 font-sans text-caption uppercase tracking-widest text-brand-secondary">
          Dubai Luxury Real Estate
        </p>
        <h1 className="font-display text-display text-text-primary">AUTEX Estates</h1>
        <p className="mt-6 max-w-prose text-body text-text-secondary">
          Exclusive Properties. Exceptional Service.
        </p>
      </section>

      <FeaturedSection featured={featured} />
    </main>
  )
}

async function FeaturedSection({ featured }: { featured: PropertyCardDTO[] }) {
  const t = await getTranslations('FeaturedProperties')

  return (
    <section aria-labelledby="featured-heading" className="mx-auto max-w-screen-xl px-6 py-20">
      <div className="mb-8">
        <h2 id="featured-heading" className="font-display text-h2 text-text-primary">
          {t('title')}
        </h2>
        <p className="mt-2 max-w-prose text-body text-text-secondary">{t('intro')}</p>
      </div>

      {featured.length === 0 ? (
        <p className="text-body text-text-secondary">{t('empty')}</p>
      ) : (
        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
