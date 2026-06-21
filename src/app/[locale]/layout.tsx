import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import '@/styles/tokens.css'
import '@/styles/globals.css'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getPublicSettings } from '@/dal/settings.dal'
import { getLocaleDirection } from '@/lib/i18n/direction'
import { routing } from '@/lib/i18n/routing'

export const metadata: Metadata = {
  title: 'AUTEX Estates Dubai',
  description: 'Exclusive Dubai luxury real estate.',
}

// The footer is settings-driven (read at request time via the server-only safe
// selector). Render dynamically so the build never depends on a running DB and
// settings changes are reflected without a rebuild.
export const dynamic = 'force-dynamic'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const [messages, settings] = await Promise.all([getMessages(), getPublicSettings()])
  const dir = getLocaleDirection(locale)

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col bg-surface-page text-text-primary">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer settings={settings} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
