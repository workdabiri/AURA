import { useTranslations } from 'next-intl'

import {
  AVAILABILITY_STATUSES,
  MARKET_TYPES,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  TRANSACTION_TYPES,
} from '@/domain/properties/query'

/**
 * Public listing filters — AURA-202.
 *
 * Presentational server component. A plain `<form method="get">` (NO client JS, no
 * client-side filtering, no Supabase): submitting reloads the server-rendered page with the
 * chosen query params, which the page validates and passes to the DAL. `current` holds the
 * raw query strings so inputs repopulate after submit (including on a validation error).
 */
export function PropertyFilters({
  locale,
  current,
}: {
  locale: string
  current: Record<string, string>
}) {
  const t = useTranslations('Properties')
  const tEnum = useTranslations('Properties.enums')

  const selectClass =
    'w-full rounded-sm border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary'
  const labelClass =
    'flex flex-col gap-1 text-caption uppercase tracking-widest text-text-secondary'

  return (
    <form method="get" action={`/${locale}/properties`} className="flex flex-col gap-4">
      <h2 className="text-caption uppercase tracking-widest text-brand-secondary">
        {t('filters.heading')}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>
          {t('filters.searchLabel')}
          <input
            type="search"
            name="search"
            defaultValue={current.search ?? ''}
            placeholder={t('filters.searchPlaceholder')}
            maxLength={100}
            className={selectClass}
          />
        </label>

        <label className={labelClass}>
          {t('filters.transactionType')}
          <select
            name="transaction_type"
            defaultValue={current.transaction_type ?? ''}
            className={selectClass}
          >
            <option value="">{t('filters.anyOption')}</option>
            {TRANSACTION_TYPES.map((v) => (
              <option key={v} value={v}>
                {tEnum(`transactionType.${v}`)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          {t('filters.marketType')}
          <select
            name="market_type"
            defaultValue={current.market_type ?? ''}
            className={selectClass}
          >
            <option value="">{t('filters.anyOption')}</option>
            {MARKET_TYPES.map((v) => (
              <option key={v} value={v}>
                {tEnum(`marketType.${v}`)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          {t('filters.propertyType')}
          <select
            name="property_type"
            defaultValue={current.property_type ?? ''}
            className={selectClass}
          >
            <option value="">{t('filters.anyOption')}</option>
            {PROPERTY_TYPES.map((v) => (
              <option key={v} value={v}>
                {tEnum(`propertyType.${v}`)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          {t('filters.availabilityStatus')}
          <select
            name="availability_status"
            defaultValue={current.availability_status ?? ''}
            className={selectClass}
          >
            <option value="">{t('filters.anyOption')}</option>
            {AVAILABILITY_STATUSES.map((v) => (
              <option key={v} value={v}>
                {tEnum(`availabilityStatus.${v}`)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          {t('filters.community')}
          <input
            type="text"
            name="community"
            defaultValue={current.community ?? ''}
            placeholder={t('filters.communityPlaceholder')}
            maxLength={120}
            className={selectClass}
          />
        </label>

        <label className={labelClass}>
          {t('filters.bedrooms')}
          <input
            type="number"
            name="bedrooms"
            min={0}
            defaultValue={current.bedrooms ?? ''}
            className={selectClass}
          />
        </label>

        <label className={labelClass}>
          {t('filters.minPrice')}
          <input
            type="number"
            name="min_price"
            min={0}
            defaultValue={current.min_price ?? ''}
            className={selectClass}
          />
        </label>

        <label className={labelClass}>
          {t('filters.maxPrice')}
          <input
            type="number"
            name="max_price"
            min={0}
            defaultValue={current.max_price ?? ''}
            className={selectClass}
          />
        </label>

        <label className={labelClass}>
          {t('sort.label')}
          <select name="sort" defaultValue={current.sort ?? 'newest'} className={selectClass}>
            {SORT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {t(`sort.${v}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="rounded-sm bg-brand-primary px-5 py-2 text-small font-medium uppercase tracking-widest text-text-inverse"
        >
          {t('filters.apply')}
        </button>
        <a
          href={`/${locale}/properties`}
          className="text-small uppercase tracking-widest text-text-secondary hover:text-text-primary"
        >
          {t('filters.clear')}
        </a>
      </div>
    </form>
  )
}
