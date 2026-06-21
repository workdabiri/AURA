import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from '@/lib/i18n/routing'

import enMessages from '@/messages/en.json'

/**
 * next-intl request configuration — AURA-201.
 *
 * Resolves the active locale per request and supplies its message catalog.
 * English is the only visible locale in the MVP (D-07); the structure is
 * RTL-ready so Arabic can be added later without reworking the shell.
 *
 * Catalogs are imported statically because the MVP ships a single locale. When
 * a second locale lands, switch to a dynamic `import(`@/messages/${locale}.json`)`.
 */
const messagesByLocale = {
  en: enMessages,
} as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: messagesByLocale[locale],
  }
})
