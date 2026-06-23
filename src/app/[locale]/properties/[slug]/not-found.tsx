import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

/**
 * Property detail not-found state — AURA-203 (D-44 not-found). Rendered when the detail page
 * calls `notFound()` for a missing / draft / archived / invalid slug. Renders within the
 * `[locale]` layout, so it has the i18n provider and header/footer. No data details are leaked
 * (draft/archived are indistinguishable from missing).
 */
export default function PropertyNotFound() {
  const locale = useLocale()
  const t = useTranslations('PropertyDetail')

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-20">
      <div className="rounded-md border border-border-default bg-surface-card p-10 text-center">
        <h1 className="font-display text-h2 text-text-primary">{t('notFound.title')}</h1>
        <p className="mt-3 text-body text-text-secondary">{t('notFound.body')}</p>
        <Link
          href={`/${locale}/properties`}
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-brand-primary px-5 py-2 text-small font-medium uppercase tracking-widest text-text-inverse"
        >
          {t('notFound.backToListing')}
        </Link>
      </div>
    </main>
  )
}
