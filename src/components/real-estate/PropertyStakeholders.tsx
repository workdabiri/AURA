import { useTranslations } from 'next-intl'

import type { PublicStakeholderDTO } from '@/domain/properties/detail'

/**
 * Public stakeholders — AURA-203.
 *
 * Presentational server component. Renders ONLY the safe `{ name, type }` projection of
 * stakeholders explicitly marked `visibility = public` (D-16). Never any contact/notes fields.
 * Props-only; no Supabase/DAL.
 */
export function PropertyStakeholders({ stakeholders }: { stakeholders: PublicStakeholderDTO[] }) {
  const t = useTranslations('PropertyDetail')
  const tType = useTranslations('PropertyDetail.enums.stakeholderType')

  if (stakeholders.length === 0) return null

  return (
    <section aria-labelledby="stakeholders-heading" className="flex flex-col gap-3">
      <h2 id="stakeholders-heading" className="font-display text-h3 text-text-primary">
        {t('stakeholders.heading')}
      </h2>
      <ul role="list" className="flex flex-col gap-2">
        {stakeholders.map((stakeholder, i) => (
          <li
            key={`${stakeholder.name}-${i}`}
            className="flex items-center justify-between gap-4 border-b border-border-default pb-2"
          >
            <span className="text-body text-text-primary">{stakeholder.name}</span>
            <span className="text-caption uppercase tracking-widest text-text-secondary">
              {tType(stakeholder.type)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
