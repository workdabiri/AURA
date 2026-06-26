import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { LegalPageView } from '@/components/legal/LegalPageView'
import { getPublishedLegalPage } from '@/dal/legal.dal'
import { publicRouteMetadata } from '@/lib/seo/routes'

// AURA-206: static SEO metadata (title/description + default-`noindex` robots, D-42).
export const metadata: Metadata = publicRouteMetadata('privacy')

/**
 * Public privacy policy — AURA-205.
 *
 * Server Component: reads the fixed `privacy` legal page directly via the DAL (no API round-trip,
 * no client fetching). Published-only is enforced in the DAL via the anon client + RLS; a missing
 * / draft / archived page → `notFound()` (`not-found.tsx`), never 403. An unexpected DAL/DB error
 * propagates to `error.tsx` (which provides retry). Inherits `dynamic = 'force-dynamic'` from the
 * `[locale]` layout, so the DB is read at request time only.
 *
 * Content is rendered with the sanitized Markdown renderer (D-12). No admin controls, no lead
 * form, no cinematic/GSAP — out of AURA-205 scope. SEO metadata (default-`noindex`) is added
 * by AURA-206 via the static `metadata` export above.
 */
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const page = await getPublishedLegalPage('privacy')
  if (!page) notFound()

  return <LegalPageView page={page} />
}
