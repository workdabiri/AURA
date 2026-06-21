import { useTranslations } from 'next-intl'

import type { PublicSettings, SocialLinks } from '@/domain/settings'

/**
 * Public site footer — AURA-201.
 *
 * Presentational server component. ALL agency data arrives as the `settings`
 * prop (resolved by the server-only safe selector in the layout) — this
 * component never imports Supabase/DAL/services. The AUTEX disclosure (Q-13) is
 * static UI copy, not DB-driven.
 */

const SOCIAL_LABELS: Record<keyof SocialLinks, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X',
}

export function Footer({ settings }: { settings: PublicSettings }) {
  const t = useTranslations('Footer')
  const socialEntries = Object.entries(settings.socialLinks).filter(
    ([, url]) => typeof url === 'string' && url.length > 0
  ) as [keyof SocialLinks, string][]

  return (
    <footer className="border-t border-border-default bg-surface-card">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-prose">
            <p className="font-display text-h3 text-text-primary">{settings.agencyName}</p>
            <p className="mt-2 text-body text-text-secondary">{settings.footerTagline}</p>
            <p className="mt-2 text-caption text-text-secondary">{settings.agencyAddress}</p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <section aria-labelledby="footer-contact-heading">
              <h2
                id="footer-contact-heading"
                className="text-caption uppercase tracking-widest text-brand-secondary"
              >
                {t('contactHeading')}
              </h2>
              <ul className="mt-3 space-y-2 text-body text-text-secondary">
                {settings.agencyPhone && (
                  <li>
                    <a className="hover:text-text-primary" href={`tel:${settings.agencyPhone}`}>
                      {settings.agencyPhone}
                    </a>
                  </li>
                )}
                {settings.agencyWhatsapp && (
                  <li>
                    <a
                      className="hover:text-text-primary"
                      href={`https://wa.me/${settings.agencyWhatsapp.replace(/[^0-9]/g, '')}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      WhatsApp
                    </a>
                  </li>
                )}
                {settings.agencyEmail && (
                  <li>
                    <a className="hover:text-text-primary" href={`mailto:${settings.agencyEmail}`}>
                      {settings.agencyEmail}
                    </a>
                  </li>
                )}
              </ul>
            </section>

            {socialEntries.length > 0 && (
              <section aria-labelledby="footer-social-heading">
                <h2
                  id="footer-social-heading"
                  className="text-caption uppercase tracking-widest text-brand-secondary"
                >
                  {t('followHeading')}
                </h2>
                <ul className="mt-3 space-y-2 text-body text-text-secondary">
                  {socialEntries.map(([platform, url]) => (
                    <li key={platform}>
                      <a
                        className="hover:text-text-primary"
                        href={url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {SOCIAL_LABELS[platform]}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/* Q-13: AUTEX public disclosure — static, always shown, not DB-driven. */}
        <p className="border-t border-border-default pt-6 text-caption text-text-secondary">
          {t('disclosure')}
        </p>
        <p className="text-caption text-text-secondary">
          &copy; {settings.agencyName}. {t('rights')}
        </p>
      </div>
    </footer>
  )
}
