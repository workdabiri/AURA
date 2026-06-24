import { useTranslations } from 'next-intl'

import type { LegalPageDTO } from '@/domain/legal/legal-page'

import { SafeMarkdown } from './SafeMarkdown'

/**
 * Public legal page view — AURA-205.
 *
 * Presentational server component shared by `/en/privacy` and `/en/terms`. Renders the page
 * title, the effective date, and the legal body via the sanitized Markdown renderer (D-12).
 * Props-only; no Supabase/DAL/services. The effective date is shown as the raw ISO date string
 * (no client-side Date formatting) to stay deterministic across server render.
 */
export function LegalPageView({ page }: { page: LegalPageDTO }) {
  const t = useTranslations('Legal')

  return (
    <main className="mx-auto max-w-screen-md px-6 py-12">
      <article>
        <header className="mb-8 border-b border-border-default pb-6">
          <h1 className="font-display text-h1 text-text-primary">{page.title}</h1>
          {page.effectiveDate && (
            <p className="mt-3 text-small text-text-secondary">
              {t('effectiveDate', { date: page.effectiveDate })}
            </p>
          )}
        </header>

        <SafeMarkdown content={page.content} />
      </article>
    </main>
  )
}
