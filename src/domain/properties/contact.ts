/**
 * AURA-203 — public contact routing (pure domain logic).
 *
 * Resolves the SINGLE public contact CTA for a property detail page following the
 * owner-locked priority (D-13/D-14, FEATURE_SPECS "Contact routing priority"):
 *
 *   1. property.agent_whatsapp
 *   2. property.agent_phone
 *   3. property.agent_email
 *   4. agency.whatsapp   (settings)
 *   5. agency.phone      (settings)
 *   6. agency.email      (settings)
 *   7. none
 *
 * Contact is NEVER routed to a stakeholder (D-14) — this module has no access to
 * stakeholder fields by construction. It returns ONE resolved CTA (method + href +
 * label + source), never the raw set of contact fields.
 *
 * PURE TypeScript: NO React, NO Supabase, NO DAL, NO I/O.
 */

import type { PublicSettings } from '@/domain/settings'

/** The single resolved public contact CTA exposed on the detail surface. */
export interface ResolvedContactDTO {
  method: 'whatsapp' | 'phone' | 'email' | 'none'
  href: string | null
  label: string
  source: 'property' | 'agency' | 'none'
}

/** Property-level contact override fields (D-13). camelCase; never stakeholder fields. */
interface PropertyContactSource {
  agentWhatsapp: string | null
  agentPhone: string | null
  agentEmail: string | null
}

/** Agency fallback contact, taken from the AURA-201 public settings selector. */
type AgencyContactSource = Pick<PublicSettings, 'agencyWhatsapp' | 'agencyPhone' | 'agencyEmail'>

/** Trim to a non-empty string, or null. */
function clean(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function whatsappHref(value: string): string {
  // wa.me requires digits only (country code + number, no punctuation).
  return `https://wa.me/${value.replace(/\D/g, '')}`
}
function phoneHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, '')}`
}
function emailHref(value: string): string {
  return `mailto:${value}`
}

/**
 * Resolve the public contact CTA by walking the locked priority list; the first
 * non-empty candidate wins. Returns a `none` CTA when nothing is configured.
 */
export function resolveContact(
  property: PropertyContactSource,
  agency: AgencyContactSource
): ResolvedContactDTO {
  const candidates: ReadonlyArray<{
    method: 'whatsapp' | 'phone' | 'email'
    source: 'property' | 'agency'
    value: string | null
    href: (v: string) => string
  }> = [
    {
      method: 'whatsapp',
      source: 'property',
      value: clean(property.agentWhatsapp),
      href: whatsappHref,
    },
    { method: 'phone', source: 'property', value: clean(property.agentPhone), href: phoneHref },
    { method: 'email', source: 'property', value: clean(property.agentEmail), href: emailHref },
    {
      method: 'whatsapp',
      source: 'agency',
      value: clean(agency.agencyWhatsapp),
      href: whatsappHref,
    },
    { method: 'phone', source: 'agency', value: clean(agency.agencyPhone), href: phoneHref },
    { method: 'email', source: 'agency', value: clean(agency.agencyEmail), href: emailHref },
  ]

  for (const candidate of candidates) {
    if (candidate.value) {
      return {
        method: candidate.method,
        href: candidate.href(candidate.value),
        label: candidate.value,
        source: candidate.source,
      }
    }
  }

  return { method: 'none', href: null, label: '', source: 'none' }
}
