import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

/**
 * Legal page not-found state — AURA-205 (D-44 not-found). Rendered when the page calls
 * `notFound()` because the published legal page is missing / draft / archived. Renders within
 * the `[locale]` layout, so it has the i18n provider and header/footer. No data details are
 * leaked (draft/archived are indistinguishable from missing — a 404, never a 403).
 */
export default function TermsNotFound() {
  const locale = useLocale()
  const t = useTranslations('Legal')

  return (
    <main className="mx-auto max-w-screen-md px-6 py-20">
      <div className="rounded-md border border-border-default bg-surface-card p-10 text-center">
        <h1 className="font-display text-h2 text-text-primary">{t('notFound.title')}</h1>
        <p className="mt-3 text-body text-text-secondary">{t('notFound.body')}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-brand-primary px-5 py-2 text-small font-medium uppercase tracking-widest text-text-inverse"
        >
          {t('notFound.backHome')}
        </Link>
      </div>
    </main>
  )
}
