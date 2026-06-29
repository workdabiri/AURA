/**
 * AURA-306 — admin settings write contract (pure domain logic).
 *
 * Single source of truth for the editable-settings allowlist + the per-key value grammar +
 * the partial-batch PATCH shape, consumed by:
 *   - the admin API route (`src/app/api/admin/settings/route.ts`),
 *   - the admin DAL write function (`src/dal/settings.dal.ts`),
 *   - the admin settings form (`src/components/admin/SettingsForm.tsx`, client-side).
 *
 * PURE TypeScript: NO React, NO Supabase, NO DAL, NO services, NO I/O, NO `server-only`.
 * Every business rule lives here (not in JSX or the route), so handlers/forms never trust raw
 * input and the rules are unit-testable in Node.
 *
 * Owner-locked decisions (AURA-306) enforced here:
 *   - EXACTLY the seven existing public footer keys are editable — the deferred keys
 *     (logo_url, seo_*, license/trust fields, footer_content, …) are NOT accepted.
 *   - Unknown / non-allowlisted keys are REJECTED (strict object) — never silently written.
 *   - PATCH is a PARTIAL BATCH: one or more allowed keys in a single request; an empty patch
 *     is rejected.
 *   - The editable keys are the SAME seven the public selector projects, so the per-key value
 *     grammar aligns with `public-settings.ts` (non-empty strings, valid email, known social
 *     platform URLs) — no public settings behaviour changes.
 */

import { z } from 'zod'

import { PUBLIC_SETTING_KEYS } from './public-settings'

/**
 * Editable settings allowlist (owner-locked, AURA-306). Deliberately identical to
 * {@link PUBLIC_SETTING_KEYS} — the public footer already reads these `agency_*` keys, so editing
 * the same set avoids any rename/migration risk. The deferred keys are intentionally absent.
 */
export const EDITABLE_SETTING_KEYS = [
  'agency_name',
  'agency_phone',
  'agency_email',
  'agency_whatsapp',
  'agency_address',
  'footer_tagline',
  'social_links',
] as const

export type EditableSettingKey = (typeof EDITABLE_SETTING_KEYS)[number]

/**
 * Backstop: the editable allowlist MUST equal the public allowlist (owner decision — no rename,
 * no extra keys). This is a compile-time check; a drift in either list is a type error.
 */
const _editableMatchesPublic: readonly EditableSettingKey[] = PUBLIC_SETTING_KEYS
void _editableMatchesPublic

// --- Per-key value grammar (mirrors public-settings.ts expectations) ----------------

const nonEmptyString = z.string().trim().min(1)
const emailString = z.string().trim().email()

/**
 * Known social platforms only; each value must be a valid URL. Mirrors the public projector's
 * `socialLinksSchema`: it is a partial object, so any platform may be omitted and unknown
 * platform keys are stripped (never persisted). An empty object `{}` clears all links.
 */
const socialLinksSchema = z
  .object({
    instagram: z.string().trim().url(),
    linkedin: z.string().trim().url(),
    facebook: z.string().trim().url(),
    youtube: z.string().trim().url(),
    x: z.string().trim().url(),
  })
  .partial()

/** Per-key value schemas for the editable settings (the PATCH value grammar). */
const SETTING_VALUE_SCHEMAS = {
  agency_name: nonEmptyString,
  agency_phone: nonEmptyString,
  agency_email: emailString,
  agency_whatsapp: nonEmptyString,
  agency_address: nonEmptyString,
  footer_tagline: nonEmptyString,
  social_links: socialLinksSchema,
} satisfies Record<EditableSettingKey, z.ZodTypeAny>

/**
 * The PATCH body grammar (owner-locked): a PARTIAL BATCH of one or more allowed keys.
 *   - `.strict()` REJECTS any unknown / non-allowlisted key (deferred keys included) — they never
 *     reach the DAL or DB.
 *   - Each provided value is validated by its per-key schema above.
 *   - `.refine(...)` REJECTS an empty patch ({} → 400) so a no-op write is impossible.
 */
export const settingsPatchSchema = z
  .object({
    agency_name: SETTING_VALUE_SCHEMAS.agency_name.optional(),
    agency_phone: SETTING_VALUE_SCHEMAS.agency_phone.optional(),
    agency_email: SETTING_VALUE_SCHEMAS.agency_email.optional(),
    agency_whatsapp: SETTING_VALUE_SCHEMAS.agency_whatsapp.optional(),
    agency_address: SETTING_VALUE_SCHEMAS.agency_address.optional(),
    footer_tagline: SETTING_VALUE_SCHEMAS.footer_tagline.optional(),
    social_links: SETTING_VALUE_SCHEMAS.social_links.optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one setting must be provided.',
  })

/** One validated, allowlisted setting row destined for the DB upsert. */
export interface SettingRow {
  key: EditableSettingKey
  value: unknown
}

const EDITABLE_KEY_SET: ReadonlySet<string> = new Set(EDITABLE_SETTING_KEYS)

/**
 * Convert a validated patch into the rows to upsert. Defensive backstop: even though the strict
 * schema already rejects unknown keys, this re-filters to the allowlist and drops `undefined`
 * values, so a non-allowlisted key can NEVER reach the DB write path. Returns rows in a stable
 * order (the allowlist order) for deterministic audits/tests.
 */
export function toSettingRows(patch: Partial<Record<string, unknown>>): SettingRow[] {
  const rows: SettingRow[] = []
  for (const key of EDITABLE_SETTING_KEYS) {
    const value = patch[key]
    if (value === undefined) continue
    rows.push({ key, value })
  }
  // Any extra (non-allowlisted) keys in `patch` are intentionally ignored here.
  return rows
}

/** Whether a key is an editable setting (allowlist membership check). */
export function isEditableSettingKey(key: string): key is EditableSettingKey {
  return EDITABLE_KEY_SET.has(key)
}
