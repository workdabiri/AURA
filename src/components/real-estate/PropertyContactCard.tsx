import { useTranslations } from 'next-intl'

import type { ResolvedContactDTO } from '@/domain/properties/contact'

/**
 * Property contact CTA card — AURA-203.
 *
 * Presentational server component. Renders the SINGLE resolved contact CTA (D-13/D-14:
 * property override → agency fallback → never stakeholder). Props-only; no Supabase/DAL.
 * No lead form here (deferred to AURA-401) — a direct tel/WhatsApp/email link only.
 */
export function PropertyContactCard({
  contact,
  referenceNumber,
}: {
  contact: ResolvedContactDTO
  referenceNumber: string
}) {
  const t = useTranslations('PropertyDetail')

  return (
    <section
      aria-labelledby="contact-heading"
      className="flex flex-col gap-4 rounded-md border border-border-default bg-surface-card p-6 shadow-card"
    >
      <h2 id="contact-heading" className="font-display text-h3 text-text-primary">
        {t('contact.heading')}
      </h2>

      {contact.method === 'none' || !contact.href ? (
        <p className="text-small text-text-secondary">{t('contact.none')}</p>
      ) : (
        <a
          href={contact.href}
          {...(contact.method === 'whatsapp'
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          className="inline-flex items-center justify-center rounded-sm bg-brand-primary px-5 py-3 text-small font-medium uppercase tracking-widest text-text-inverse focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {t(`contact.${contact.method}`)}
        </a>
      )}

      <p className="text-caption text-text-secondary">
        {t('specs.reference')}: {referenceNumber}
      </p>
    </section>
  )
}
