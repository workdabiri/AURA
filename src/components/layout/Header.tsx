import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

import { Navigation } from './Navigation'

/**
 * Public site header — AURA-201.
 *
 * Presentational server component: brand wordmark + primary navigation inside a
 * `<header>` landmark. No data fetching, no Supabase/DAL/services imports.
 */
export function Header() {
  const locale = useLocale()
  const t = useTranslations('Header')

  return (
    <header className="border-b border-border-default bg-surface-page">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-5">
        <Link href={`/${locale}`} className="font-display text-h3 tracking-wide text-text-primary">
          {t('brand')}
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
