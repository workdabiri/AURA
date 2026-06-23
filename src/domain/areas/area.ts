/**
 * AURA-204 — public area card DTO + projection (pure domain logic).
 *
 * Defines the ONLY shape that leaves the areas overview boundary for the public surface,
 * plus the pure projector that builds it from the explicit column subset the DAL selects.
 * PURE TypeScript: NO React, NO Supabase, NO DAL, NO I/O.
 *
 * Owner-locked public allowlist (AURA-204). The DTO contains ONLY slug, name, description,
 * and imageUrl. These fields are NEVER projected: id, is_active, sort_order, created_at,
 * updated_at, any property-derived data (counts/aggregations), and the raw JSONB objects.
 * The projector reads only allowlisted keys, so any extra field present on the input row is
 * structurally dropped — defence in depth behind the DAL's explicit `select(...)` column list.
 */

/** Public, public-safe area card. The full owner-approved field allowlist. */
export interface AreaCardDTO {
  slug: string
  name: string
  description: string
  imageUrl: string | null
}

/**
 * The exact column subset the DAL selects from `areas` for a public card. Kept in sync with
 * the `AREA_CARD_COLUMNS` select list in the DAL. `name`/`description` arrive as raw i18n
 * JSONB (typed `unknown` here — never surfaced raw; always passed through `extractEn`).
 */
export interface PublicAreaRow {
  slug: string
  name: unknown
  description: unknown
  image_url: string | null
}

/** Extract the English value from an i18n JSONB object; empty string when absent/invalid. */
export function extractEn(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = (value as Record<string, unknown>).en
    if (typeof en === 'string') return en
  }
  return ''
}

/**
 * Project a raw public area row into the public DTO. Reads ONLY allowlisted keys; any extra
 * field on `row` (id, is_active, sort_order, timestamps, …) is structurally dropped.
 */
export function toAreaCardDTO(row: PublicAreaRow): AreaCardDTO {
  return {
    slug: row.slug,
    name: extractEn(row.name),
    description: extractEn(row.description),
    imageUrl: row.image_url,
  }
}
