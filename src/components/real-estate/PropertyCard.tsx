import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

import type { PropertyCardDTO } from '@/domain/properties/card'
import { formatAedAmount, resolvePriceDisplay } from '@/domain/properties/format'

/**
 * Public property card — AURA-202.
 *
 * Presentational server component. ALL data arrives via the `property` prop (a public-safe
 * DTO produced by the DAL projector). This component NEVER imports Supabase, the DAL, or
 * services — business rules (price/AED/price-on-application) come from pure domain helpers.
 *
 * The card links to the detail route (`/{locale}/properties/{slug}`); that route is owned by
 * AURA-203 and is intentionally not implemented here.
 */
export function PropertyCard({ property }: { property: PropertyCardDTO }) {
  const locale = useLocale()
  const t = useTranslations('PropertyCard')
  const tEnum = useTranslations('Properties.enums')

  const price = resolvePriceDisplay(property)
  const priceLabel = price.kind === 'on_application' ? t('priceOnApplication') : price.formatted

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-border-default bg-surface-card shadow-card">
      <Link
        href={`/${locale}/properties/${property.slug}`}
        className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-overlay">
          {property.coverImage ? (
            // Plain <img>: cover is a public CDN URL; next/image remote-pattern config is
            // deployment-specific and out of AURA-202 scope.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.coverImage.url}
              alt={property.coverImage.alt || t('coverImageAltFallback')}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-caption uppercase tracking-widest text-text-secondary"
            >
              {t('coverImageAltFallback')}
            </div>
          )}

          {property.isFeatured && (
            <span className="absolute left-3 top-3 rounded-sm bg-brand-primary px-2 py-1 text-caption font-medium uppercase tracking-widest text-text-inverse">
              {t('featuredBadge')}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-caption uppercase tracking-widest text-brand-secondary">
            <span>{tEnum(`transactionType.${property.transactionType}`)}</span>
            <span aria-hidden="true">·</span>
            <span>{tEnum(`propertyType.${property.propertyType}`)}</span>
            <span aria-hidden="true">·</span>
            <span>{tEnum(`marketType.${property.marketType}`)}</span>
          </div>

          <h3 className="font-display text-h3 text-text-primary">{property.title}</h3>

          <p className="text-small text-text-secondary">
            {property.community
              ? `${property.locationLabel} — ${property.community}`
              : property.locationLabel}
          </p>

          <p className="mt-auto font-sans text-body font-medium text-text-primary">{priceLabel}</p>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-secondary">
            {property.bedrooms !== null && <li>{t('bedrooms', { count: property.bedrooms })}</li>}
            {property.bathrooms !== null && (
              <li>{t('bathrooms', { count: property.bathrooms })}</li>
            )}
            <li>{t('size', { value: formatAedAmount(property.sizeSqft) })}</li>
          </ul>

          <p className="text-caption text-text-secondary">
            {t('referenceLabel')}: {property.referenceNumber}
          </p>
        </div>
      </Link>
    </article>
  )
}
