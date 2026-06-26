import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { publicRouteMetadata } from '@/lib/seo/routes'

// AURA-206: static SEO metadata (title/description + default-`noindex` robots, D-42).
export const metadata: Metadata = publicRouteMetadata('about')

// AURA-207: keys for the static "what AUTEX represents" / "principles" sections. Driven by
// translation keys only (no data, no DAL) — see the `About` namespace in `messages/en.json`.
const PILLAR_KEYS = ['dubaiFocus', 'curated', 'journey', 'transparent'] as const
const PRINCIPLE_KEYS = ['clarity', 'trust', 'discretion', 'discovery'] as const

/**
 * Public About page (`/en/about`) — AURA-207, completing the Phase 2 public surface.
 *
 * Server Component rendering fully static, demo-safe marketing copy from the `About` i18n
 * namespace. Deliberately NO data access: no DAL, no Supabase, no settings read — the page is
 * content-only, so only the success/render state is relevant (D-44) and no loading/error/
 * not-found files are needed. It reuses the AURA-201 public layout shell (header/footer) and
 * the AURA-206 SEO helper, so `/en/about` is `noindex` by default (D-42). No contact/lead form,
 * no WhatsApp tracking, no admin editing, no cinematic/GSAP — all out of AURA-207 scope.
 *
 * The visible disclosure reuses the existing `Footer.disclosure` string (owner decision Q-13)
 * so the on-page AUTEX disclosure never diverges from the footer copy.
 */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('About')
  const tFooter = await getTranslations('Footer')

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-12">
      <section aria-labelledby="about-heading" className="max-w-prose">
        <p className="text-caption uppercase tracking-widest text-brand-secondary">
          {t('eyebrow')}
        </p>
        <h1 id="about-heading" className="mt-4 font-display text-h1 text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-6 text-body text-text-secondary">{t('intro')}</p>
      </section>

      <section aria-labelledby="about-pillars-heading" className="mt-16">
        <h2 id="about-pillars-heading" className="font-display text-h2 text-text-primary">
          {t('pillars.heading')}
        </h2>
        <ul role="list" className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PILLAR_KEYS.map((key) => (
            <li key={key} className="rounded-md border border-border-default bg-surface-card p-6">
              <h3 className="font-display text-h3 text-text-primary">
                {t(`pillars.${key}.title`)}
              </h3>
              <p className="mt-3 text-body text-text-secondary">{t(`pillars.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-principles-heading" className="mt-16">
        <div className="max-w-prose">
          <h2 id="about-principles-heading" className="font-display text-h2 text-text-primary">
            {t('principles.heading')}
          </h2>
          <p className="mt-4 text-body text-text-secondary">{t('principles.intro')}</p>
        </div>
        <ul role="list" className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLE_KEYS.map((key) => (
            <li key={key}>
              <h3 className="font-display text-h3 text-text-primary">
                {t(`principles.${key}.title`)}
              </h3>
              <p className="mt-3 text-body text-text-secondary">{t(`principles.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="about-disclosure-heading"
        className="mt-16 rounded-md border border-border-default bg-surface-card p-6"
      >
        <h2
          id="about-disclosure-heading"
          className="text-caption uppercase tracking-widest text-brand-secondary"
        >
          {t('disclosure.heading')}
        </h2>
        {/* Q-13: reuse the footer disclosure string so the on-page copy never diverges. */}
        <p className="mt-3 text-body text-text-secondary">{tFooter('disclosure')}</p>
      </section>
    </main>
  )
}
