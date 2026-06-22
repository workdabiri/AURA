import { useTranslations } from 'next-intl'

import type { PropertyDetailDTO } from '@/domain/properties/detail'
import { resolvePriceDisplay } from '@/domain/properties/format'

/**
 * Property detail hero — AURA-203.
 *
 * Presentational server component. ALL data arrives via the public-safe `property` DTO.
 * No Supabase/DAL/services import; price/AED rules come from pure domain helpers.
 */
export function PropertyDetailHero({ property }: { property: PropertyDetailDTO }) {
  const t = useTranslations('PropertyDetail')
  const tEnum = useTranslations('Properties.enums')

  const price = resolvePriceDisplay(property)
  const priceLabel = price.kind === 'on_application' ? t('priceOnApplication') : price.formatted
  const location = property.community
    ? `${property.locationLabel} — ${property.community}`
    : property.locationLabel

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-caption uppercase tracking-widest text-brand-secondary">
        <span>{tEnum(`transactionType.${property.transactionType}`)}</span>
        <span aria-hidden="true">·</span>
        <span>{tEnum(`propertyType.${property.propertyType}`)}</span>
        <span aria-hidden="true">·</span>
        <span>{tEnum(`marketType.${property.marketType}`)}</span>
        <span aria-hidden="true">·</span>
        <span>{tEnum(`availabilityStatus.${property.availabilityStatus}`)}</span>
        {property.isFeatured && (
          <span className="rounded-sm bg-brand-primary px-2 py-1 font-medium text-text-inverse">
            {t('featuredBadge')}
          </span>
        )}
      </div>

      <h1 className="font-display text-h1 text-text-primary">{property.title}</h1>
      <p className="text-body text-text-secondary">{location}</p>
      <p className="font-sans text-h3 font-medium text-text-primary">{priceLabel}</p>
    </header>
  )
}
