import { useTranslations } from 'next-intl'

import type { PropertyDetailMediaDTO } from '@/domain/properties/detail'

/**
 * Property media gallery — AURA-203.
 *
 * Presentational server component. Renders the public media gallery (images) and a separate
 * floor-plan group. Props-only; no Supabase/DAL. `storage_path` is never present on the DTO.
 */
export function PropertyMediaGallery({ media }: { media: PropertyDetailMediaDTO[] }) {
  const t = useTranslations('PropertyDetail')

  const images = media.filter((m) => m.mediaType === 'image')
  const floorplans = media.filter((m) => m.mediaType === 'floorplan')

  if (images.length === 0 && floorplans.length === 0) {
    return (
      <section aria-label={t('gallery.heading')}>
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-md border border-border-default bg-surface-card text-caption uppercase tracking-widest text-text-secondary">
          {t('gallery.empty')}
        </div>
      </section>
    )
  }

  return (
    <section aria-label={t('gallery.heading')} className="flex flex-col gap-6">
      {images.length > 0 && (
        <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.map((m, i) => (
            <li key={`${m.url}-${i}`} className={m.isCover ? 'sm:col-span-2' : ''}>
              {/* Plain <img>: public CDN URL; next/image remote-pattern config is deployment-specific (out of AURA-203 scope). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt || t('gallery.imageAltFallback')}
                loading={m.isCover ? 'eager' : 'lazy'}
                className="aspect-[4/3] w-full rounded-md object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      {floorplans.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-caption uppercase tracking-widest text-brand-secondary">
            {t('gallery.floorplans')}
          </h2>
          <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {floorplans.map((m, i) => (
              <li key={`${m.url}-${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.alt || t('gallery.imageAltFallback')}
                  loading="lazy"
                  className="w-full rounded-md border border-border-default object-contain"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
