import { useTranslations } from 'next-intl'

import type { AreaCardDTO } from '@/domain/areas/area'

/**
 * Public area card — AURA-204.
 *
 * Presentational server component. ALL data arrives via the `area` prop (a public-safe DTO
 * produced by the DAL projector). This component NEVER imports Supabase, the DAL, or services.
 *
 * Informational only (D-204 owner decision): no link, no property count, no area-detail
 * navigation — area detail pages are out of scope for AURA-204.
 */
export function AreaCard({ area }: { area: AreaCardDTO }) {
  const t = useTranslations('AreaCard')

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-border-default bg-surface-card shadow-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-overlay">
        {area.imageUrl ? (
          // Plain <img>: image_url is a public CDN URL; next/image remote-pattern config is
          // deployment-specific and out of AURA-204 scope.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={area.imageUrl}
            alt={area.name || t('imageAltFallback')}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-caption uppercase tracking-widest text-text-secondary"
          >
            {t('imageAltFallback')}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="font-display text-h3 text-text-primary">{area.name}</h2>
        {area.description && <p className="text-small text-text-secondary">{area.description}</p>}
      </div>
    </article>
  )
}
