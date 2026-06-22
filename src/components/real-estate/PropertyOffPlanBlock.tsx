import { useTranslations } from 'next-intl'

import type { OffPlanDTO } from '@/domain/properties/detail'
import { formatAedAmount } from '@/domain/properties/format'

/**
 * Off-plan details block — AURA-203.
 *
 * Presentational server component. The page renders this ONLY when `property.offPlan` is
 * non-null (i.e. `market_type === 'off_plan'`, D-36). Props-only; no Supabase/DAL.
 */
export function PropertyOffPlanBlock({ offPlan }: { offPlan: OffPlanDTO }) {
  const t = useTranslations('PropertyDetail')

  const rows: { label: string; value: string }[] = []
  if (offPlan.developerName)
    rows.push({ label: t('offPlan.developer'), value: offPlan.developerName })
  if (offPlan.handoverDate) rows.push({ label: t('offPlan.handover'), value: offPlan.handoverDate })
  if (offPlan.completionPercentage !== null)
    rows.push({ label: t('offPlan.completion'), value: `${offPlan.completionPercentage}%` })
  if (offPlan.downPaymentAmount !== null)
    rows.push({
      label: t('offPlan.downPayment'),
      value: `AED ${formatAedAmount(offPlan.downPaymentAmount)}`,
    })
  if (offPlan.paymentPlanSummary)
    rows.push({ label: t('offPlan.paymentPlan'), value: offPlan.paymentPlanSummary })

  if (rows.length === 0) return null

  return (
    <section
      aria-labelledby="offplan-heading"
      className="flex flex-col gap-3 rounded-md border border-border-default bg-surface-card p-6"
    >
      <h2 id="offplan-heading" className="font-display text-h3 text-text-primary">
        {t('offPlan.heading')}
      </h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-caption uppercase tracking-widest text-text-secondary">
              {row.label}
            </dt>
            <dd className="text-body text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
