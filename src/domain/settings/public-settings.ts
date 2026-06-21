import { z } from 'zod'

/**
 * Public settings contract — AURA-201 (A-09 safe-selector allowlist).
 *
 * The `settings` table has NO anon RLS policy: public reads go through a
 * server-only selector that reads via the service-role client and projects the
 * result through THIS allowlist before anything reaches a page. This module is
 * pure (no Supabase, no server-only, no I/O) and fully unit-testable.
 *
 * Security invariants enforced here:
 *   - Only the approved public keys are ever surfaced.
 *   - Each value is validated by a per-key Zod schema; malformed values fail
 *     closed to a safe default (never rendered raw).
 *   - Unknown / internal keys and row metadata (`updated_by`, timestamps) are
 *     never read — the projector only ever consumes `key` + `value`.
 */

/** Approved public-safe setting keys (owner-approved for AURA-201). */
export const PUBLIC_SETTING_KEYS = [
  'agency_name',
  'agency_phone',
  'agency_email',
  'agency_whatsapp',
  'agency_address',
  'footer_tagline',
  'social_links',
] as const

type PublicSettingKey = (typeof PUBLIC_SETTING_KEYS)[number]

const ALLOWLIST: ReadonlySet<string> = new Set(PUBLIC_SETTING_KEYS)

/** Known social platforms. Unknown platforms are stripped on parse. */
const socialLinksSchema = z
  .object({
    instagram: z.string().url(),
    linkedin: z.string().url(),
    facebook: z.string().url(),
    youtube: z.string().url(),
    x: z.string().url(),
  })
  .partial()

export type SocialLinks = z.infer<typeof socialLinksSchema>

/** Typed, public-safe projection of agency settings consumed by the layout. */
export interface PublicSettings {
  agencyName: string
  agencyPhone: string | null
  agencyEmail: string | null
  agencyWhatsapp: string | null
  agencyAddress: string
  footerTagline: string
  socialLinks: SocialLinks
}

/**
 * Fresh default settings for an unconfigured/empty DB (no seed data).
 * Returns a NEW object each call so callers never share mutable state.
 */
export function defaultPublicSettings(): PublicSettings {
  return {
    agencyName: 'AUTEX Estates Dubai',
    agencyPhone: null,
    agencyEmail: null,
    agencyWhatsapp: null,
    agencyAddress: 'Dubai, UAE',
    footerTagline: 'Exclusive properties. Exceptional service.',
    socialLinks: {},
  }
}

const nonEmptyString = z.string().trim().min(1)
const emailString = z.string().trim().email()

/**
 * Project raw `(key, value)` setting rows into the public-safe DTO.
 *
 * Non-allowlisted keys are ignored. Each allowlisted value is validated; any
 * missing or malformed value falls back to its safe default. The input shape is
 * deliberately limited to `{ key, value }` so row metadata can never leak.
 */
export function projectPublicSettings(
  rows: Iterable<{ key: string; value: unknown }>
): PublicSettings {
  const values = new Map<string, unknown>()
  for (const row of rows) {
    if (ALLOWLIST.has(row.key)) {
      values.set(row.key, row.value)
    }
  }

  const settings = defaultPublicSettings()

  const requiredString = (key: PublicSettingKey): string | undefined => {
    const parsed = nonEmptyString.safeParse(values.get(key))
    return parsed.success ? parsed.data : undefined
  }
  const optionalString = (key: PublicSettingKey): string | null | undefined => {
    if (!values.has(key)) return undefined
    const parsed = nonEmptyString.safeParse(values.get(key))
    return parsed.success ? parsed.data : null
  }

  settings.agencyName = requiredString('agency_name') ?? settings.agencyName
  settings.agencyAddress = requiredString('agency_address') ?? settings.agencyAddress
  settings.footerTagline = requiredString('footer_tagline') ?? settings.footerTagline

  settings.agencyPhone = optionalString('agency_phone') ?? settings.agencyPhone
  settings.agencyWhatsapp = optionalString('agency_whatsapp') ?? settings.agencyWhatsapp

  if (values.has('agency_email')) {
    const parsed = emailString.safeParse(values.get('agency_email'))
    settings.agencyEmail = parsed.success ? parsed.data : null
  }

  const social = socialLinksSchema.safeParse(values.get('social_links'))
  if (social.success) {
    settings.socialLinks = social.data
  }

  return settings
}
