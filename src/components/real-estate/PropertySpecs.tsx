import { useTranslations } from 'next-intl'

import type { PropertyDetailDTO } from '@/domain/properties/detail'
import { formatAedAmount } from '@/domain/properties/format'

/** A labelled definition list rendered from already-resolved label/value pairs. */
function DefinitionList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-caption uppercase tracking-widest text-text-secondary">
            {item.label}
          </dt>
          <dd className="text-body text-text-primary">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Property specs + location + trust block — AURA-203.
 *
 * Presentational server component. Props-only; no Supabase/DAL. Never renders `address`
 * (excluded from the DTO); shows the public `locationLabel` + optional external map link (D-49).
 */
export function PropertySpecs({ property }: { property: PropertyDetailDTO }) {
  const t = useTranslations('PropertyDetail')
  const tFurnish = useTranslations('PropertyDetail.enums.furnishingStatus')

  const specs: { label: string; value: string }[] = []
  if (property.bedrooms !== null)
    specs.push({ label: t('specs.bedrooms'), value: String(property.bedrooms) })
  if (property.bathrooms !== null)
    specs.push({ label: t('specs.bathrooms'), value: String(property.bathrooms) })
  if (property.parking !== null)
    specs.push({ label: t('specs.parking'), value: String(property.parking) })
  specs.push({ label: t('specs.sizeSqft'), value: formatAedAmount(property.sizeSqft) })
  if (property.sizeSqm !== null)
    specs.push({ label: t('specs.sizeSqm'), value: formatAedAmount(property.sizeSqm) })
  specs.push({ label: t('specs.furnishing'), value: tFurnish(property.furnishingStatus) })

  const locationRows: { label: string; value: string }[] = []
  if (property.community)
    locationRows.push({ label: t('location.community'), value: property.community })
  if (property.subCommunity)
    locationRows.push({ label: t('location.subCommunity'), value: property.subCommunity })
  if (property.buildingName)
    locationRows.push({ label: t('location.building'), value: property.buildingName })

  const trust: { label: string; value: string }[] = [
    { label: t('specs.reference'), value: property.referenceNumber },
  ]
  if (property.reraNumber) trust.push({ label: t('trust.rera'), value: property.reraNumber })
  if (property.permitNumber) trust.push({ label: t('trust.permit'), value: property.permitNumber })

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="specs-heading" className="flex flex-col gap-3">
        <h2 id="specs-heading" className="font-display text-h3 text-text-primary">
          {t('specs.heading')}
        </h2>
        <DefinitionList items={specs} />
      </section>

      <section aria-labelledby="location-heading" className="flex flex-col gap-3">
        <h2 id="location-heading" className="font-display text-h3 text-text-primary">
          {t('location.heading')}
        </h2>
        <p className="text-body text-text-primary">{property.locationLabel}</p>
        {locationRows.length > 0 && <DefinitionList items={locationRows} />}
        {property.externalMapUrl && (
          <a
            href={property.externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-small uppercase tracking-widest text-brand-secondary hover:text-brand-primary"
          >
            {t('location.viewMap')}
          </a>
        )}
      </section>

      <section aria-labelledby="trust-heading" className="flex flex-col gap-3">
        <h2 id="trust-heading" className="font-display text-h3 text-text-primary">
          {t('trust.heading')}
        </h2>
        <DefinitionList items={trust} />
      </section>
    </div>
  )
}
