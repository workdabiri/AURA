/**
 * AURA-205 — public legal page DTO + projection (pure domain logic).
 *
 * Defines the ONLY shape that leaves the legal boundary for the public surface, plus the pure
 * projector that builds it from the explicit column subset the DAL selects. PURE TypeScript:
 * NO React, NO Supabase, NO DAL, NO I/O.
 *
 * Owner-locked public allowlist (AURA-205). The DTO contains ONLY slug, title, content, and
 * effectiveDate. These fields are NEVER projected: id, status, version, last_updated_by,
 * created_at, updated_at, published_at, and the raw JSONB objects. The projector reads only
 * allowlisted keys, so any extra field present on the input row is structurally dropped —
 * defence in depth behind the DAL's explicit `select(...)` column list.
 *
 * `content` is returned as RAW Markdown (never pre-rendered HTML); safe rendering happens
 * server-side in the render path via the sanitized Markdown renderer (D-12).
 */

// --- Public slug allowlist ------------------------------------------------------------

/** The only legal slugs exposed publicly in AURA-205 (owner decision). */
export const PUBLIC_LEGAL_SLUGS = ['privacy', 'terms'] as const

export type PublicLegalSlug = (typeof PUBLIC_LEGAL_SLUGS)[number]

/** True only for an exact public legal slug (`privacy` | `terms`). */
export function isPublicLegalSlug(slug: unknown): slug is PublicLegalSlug {
  return typeof slug === 'string' && (PUBLIC_LEGAL_SLUGS as readonly string[]).includes(slug)
}

// --- Public DTO shape -----------------------------------------------------------------

/** Public, public-safe legal page. The full owner-approved field allowlist. */
export interface LegalPageDTO {
  slug: PublicLegalSlug
  title: string
  /** Raw Markdown — rendered safely (sanitized) at the render layer, never as trusted HTML. */
  content: string
  effectiveDate: string
}

/**
 * The exact column subset the DAL selects from `legal_pages` for a public read. Kept in sync
 * with the `LEGAL_PAGE_COLUMNS` select list in the DAL. `title`/`content` arrive as raw i18n
 * JSONB (typed `unknown` here — never surfaced raw; always passed through `extractEn`).
 */
export interface PublicLegalPageRow {
  slug: string
  title: unknown
  content: unknown
  effective_date: unknown
}

// --- Pure projection helpers ----------------------------------------------------------

/** Extract the English value from an i18n JSONB object; empty string when absent/invalid. */
export function extractEn(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = (value as Record<string, unknown>).en
    if (typeof en === 'string') return en
  }
  return ''
}

/**
 * Project a raw legal page row into the public DTO. Reads ONLY allowlisted keys; any extra
 * field on `row` (id, status, version, last_updated_by, timestamps, …) is structurally dropped.
 * Returns `null` for a non-public slug — the projector never emits a DTO for an unexpected slug.
 */
export function toLegalPageDTO(row: PublicLegalPageRow): LegalPageDTO | null {
  if (!isPublicLegalSlug(row.slug)) return null
  return {
    slug: row.slug,
    title: extractEn(row.title),
    content: extractEn(row.content),
    effectiveDate: typeof row.effective_date === 'string' ? row.effective_date : '',
  }
}
