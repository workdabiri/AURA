import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { PropertyContactCard } from '@/components/real-estate/PropertyContactCard'
import { PropertyDetailHero } from '@/components/real-estate/PropertyDetailHero'
import { PropertyMediaGallery } from '@/components/real-estate/PropertyMediaGallery'
import { PropertyOffPlanBlock } from '@/components/real-estate/PropertyOffPlanBlock'
import { PropertySpecs } from '@/components/real-estate/PropertySpecs'
import { PropertyStakeholders } from '@/components/real-estate/PropertyStakeholders'
import { getPublishedPropertyBySlug } from '@/dal/property-detail.dal'
import { isValidSlug } from '@/domain/properties/detail'

/**
 * Public property detail — AURA-203.
 *
 * Server Component: validates the slug, then calls the DAL directly (no API round-trip, no
 * client fetching). Published-only is enforced in the DAL via the anon client + RLS; a missing
 * / draft / archived slug (or an invalid slug) → `notFound()` (`not-found.tsx`). An unexpected
 * DAL/DB error propagates to `error.tsx`. Inherits `dynamic = 'force-dynamic'` from the
 * `[locale]` layout, so the DB is read at request time only.
 *
 * No lead form (AURA-401), no WhatsApp tracking (AURA-405), no similar properties, no SEO/noindex
 * (AURA-206), no cinematic/GSAP (AURA-502) — out of AURA-203 scope.
 */
export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  if (!isValidSlug(slug)) notFound()

  const property = await getPublishedPropertyBySlug(slug)
  if (!property) notFound()

  const t = await getTranslations('PropertyDetail')

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-12">
      <PropertyDetailHero property={property} />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-10 lg:col-span-2">
          <PropertyMediaGallery media={property.media} />

          {property.description && (
            <section aria-labelledby="description-heading" className="flex flex-col gap-3">
              <h2 id="description-heading" className="font-display text-h3 text-text-primary">
                {t('descriptionHeading')}
              </h2>
              <p className="whitespace-pre-line text-body text-text-secondary">
                {property.description}
              </p>
            </section>
          )}

          <PropertySpecs property={property} />

          {property.amenities.length > 0 && (
            <section aria-labelledby="amenities-heading" className="flex flex-col gap-3">
              <h2 id="amenities-heading" className="font-display text-h3 text-text-primary">
                {t('amenities.heading')}
              </h2>
              <ul role="list" className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, i) => (
                  <li
                    key={`${amenity}-${i}`}
                    className="rounded-sm border border-border-default px-3 py-1 text-small text-text-secondary"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {property.offPlan && <PropertyOffPlanBlock offPlan={property.offPlan} />}

          {property.publicStakeholders.length > 0 && (
            <PropertyStakeholders stakeholders={property.publicStakeholders} />
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <PropertyContactCard
              contact={property.contact}
              referenceNumber={property.referenceNumber}
            />
          </div>
        </aside>
      </div>
    </main>
  )
}
