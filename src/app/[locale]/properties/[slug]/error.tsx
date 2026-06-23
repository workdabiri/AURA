'use client'

import { useTranslations } from 'next-intl'

/**
 * Property detail error boundary — AURA-203 (D-44 error + retry). Client component so it can
 * call `reset()` to re-render the server component. No data details are surfaced to the user.
 */
export default function PropertyDetailError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('PropertyDetail')

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-12">
      <div
        role="alert"
        className="rounded-md border border-border-default bg-surface-card p-10 text-center"
      >
        <p className="text-body text-text-primary">{t('error')}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-sm bg-brand-primary px-5 py-2 text-small font-medium uppercase tracking-widest text-text-inverse"
        >
          {t('retry')}
        </button>
      </div>
    </main>
  )
}
