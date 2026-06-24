import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

/**
 * Primary site navigation — AURA-201.
 *
 * Presentational server component: no data fetching, no Supabase/DAL/services.
 * Links point at the public routes built in AURA-202+ (they need not exist yet).
 * Locale-prefixed hrefs keep routing correct ahead of localized `Link` wiring.
 */
const NAV_ITEMS = [
  { key: 'properties', href: 'properties' },
  { key: 'areas', href: 'areas' },
  { key: 'about', href: 'about' },
  { key: 'privacy', href: 'privacy' },
  { key: 'terms', href: 'terms' },
] as const

export function Navigation() {
  const locale = useLocale()
  const t = useTranslations('Navigation')

  return (
    <nav aria-label={t('label')}>
      <ul className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <Link
              href={`/${locale}/${item.href}`}
              className="text-caption uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
            >
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
