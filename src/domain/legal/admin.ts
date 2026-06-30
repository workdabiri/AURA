/**
 * AURA-307 — admin legal page write contract + admin read projections (pure domain logic).
 *
 * Single source of truth for the admin legal create/update grammar, the content-safety guard
 * (D-12 merge blocker), the version-bump rule, and the admin DTO projections. Consumed by:
 *   - the admin API routes (`src/app/api/admin/legal/**`),
 *   - the admin DAL functions (`src/dal/legal.dal.ts`),
 *   - the admin legal form (`src/components/admin/LegalPageForm.tsx`, client-side — schema/types).
 *
 * PURE TypeScript: NO React, NO Supabase, NO DAL, NO services, NO I/O, NO `server-only`.
 * Every business rule lives here (not in JSX or the route), so handlers/forms never trust raw
 * input and the rules are unit-testable in Node.
 *
 * Owner-locked decisions (AURA-307) enforced here:
 *   - Slug allowlist is EXACTLY `privacy` | `terms` (no arbitrary legal slugs in MVP).
 *   - Content is MARKDOWN ONLY. Raw / unsafe HTML is REJECTED at validation time (write-time
 *     safety, not just render-time sanitization — D-12). `assertSafeLegalMarkdown` is reused by the
 *     DAL as a defence-in-depth backstop before any insert/update.
 *   - Row-per-version model: publishing computes `version = max(version for slug) + 1`.
 *   - Statuses are `draft` | `published` | `archived`; only drafts are editable.
 */

import { z } from 'zod'

import {
  extractEn,
  isPublicLegalSlug,
  PUBLIC_LEGAL_SLUGS,
  type PublicLegalSlug,
} from './legal-page'

// --- Slug allowlist + statuses ---------------------------------------------------------

/**
 * The admin legal slug allowlist is IDENTICAL to the public allowlist (`privacy` | `terms`) —
 * owner-locked, no arbitrary legal slugs in MVP. Re-exported under admin names so the routes/DAL
 * import the admin contract from one place.
 */
export const LEGAL_ADMIN_SLUGS = PUBLIC_LEGAL_SLUGS
export type LegalAdminSlug = PublicLegalSlug

/** True only for an exact admin legal slug (`privacy` | `terms`). */
export function isLegalAdminSlug(slug: unknown): slug is LegalAdminSlug {
  return isPublicLegalSlug(slug)
}

/** The legal page lifecycle states (mirrors the DB `legal_page_status` enum). */
export const LEGAL_PAGE_STATUSES = ['draft', 'published', 'archived'] as const
export type LegalPageStatus = (typeof LEGAL_PAGE_STATUSES)[number]

// --- Content safety (D-12 write-time guard) --------------------------------------------

/** Generous bound for a legal document body (Markdown source). */
const CONTENT_MAX_LENGTH = 100_000
/** Generous bound for the page title. */
const TITLE_MAX_LENGTH = 200

/**
 * Conservative unsafe-markup patterns. Markdown is allowed; raw/unsafe HTML is not. The patterns
 * are intentionally narrow so ordinary Markdown — including comparison text like `5 < 10` and
 * Markdown links `[text](https://x.com)` — is NEVER flagged:
 *   - a raw HTML TAG requires `<` (or `</`) IMMEDIATELY followed by a letter, so `5 < 10`,
 *     `a < b`, and `5<10` (digit after `<`) do not match;
 *   - `javascript:` / `vbscript:`/`data:` script protocols are blocked (matches the render-layer
 *     sanitizer, which also strips them) so a Markdown link can never carry a script URL;
 *   - inline event-handler attributes (`onclick=`, `onload=`, …) are blocked as belt-and-braces
 *     even though any tag carrying them is already blocked by the tag rule;
 *   - HTML comments (`<!-- -->`) are blocked.
 */
const UNSAFE_MARKUP_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'script tag', pattern: /<\s*script\b/i },
  { name: 'iframe tag', pattern: /<\s*iframe\b/i },
  { name: 'style tag', pattern: /<\s*style\b/i },
  { name: 'script protocol', pattern: /(?:javascript|vbscript|data)\s*:/i },
  { name: 'event handler', pattern: /\son[a-z]+\s*=/i },
  { name: 'html comment', pattern: /<!--/ },
  // Any raw HTML element — opening or closing — e.g. <div>, <p>, <img …>, <a …>, <span>, </p>.
  { name: 'raw html tag', pattern: /<\/?[a-zA-Z][^>]*>/ },
]

/**
 * True when `content` contains raw/unsafe HTML or a dangerous protocol (i.e. it is NOT
 * Markdown-only). Pure + side-effect free; used by the Zod refine and the DAL backstop.
 */
export function containsUnsafeLegalHtml(content: string): boolean {
  return UNSAFE_MARKUP_PATTERNS.some(({ pattern }) => pattern.test(content))
}

class UnsafeLegalContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeLegalContentError'
  }
}

/**
 * Defence-in-depth backstop (D-12). Throws {@link UnsafeLegalContentError} if `content` is not
 * Markdown-only. The API already rejects unsafe input via the Zod schema; the DAL calls this again
 * before any insert/update so unsafe content can never reach the DB even if a caller bypasses the
 * route schema.
 */
export function assertSafeLegalMarkdown(content: string): void {
  if (containsUnsafeLegalHtml(content)) {
    throw new UnsafeLegalContentError(
      'Legal content must be Markdown only — raw HTML is not allowed.'
    )
  }
}

// --- Field schemas ---------------------------------------------------------------------

/** ISO calendar date `YYYY-MM-DD` that also resolves to a real date. */
const effectiveDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Effective date must be in YYYY-MM-DD format.' })
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Effective date must be a valid date.' })

const titleSchema = z.string().trim().min(1).max(TITLE_MAX_LENGTH)

/** Markdown-only body: non-empty, bounded, and free of raw/unsafe HTML (D-12). */
const contentSchema = z
  .string()
  .trim()
  .min(1)
  .max(CONTENT_MAX_LENGTH)
  .refine((v) => !containsUnsafeLegalHtml(v), {
    message:
      'Content must be Markdown only — raw HTML (tags, scripts, event handlers) is not allowed.',
  })

/**
 * Create a legal draft. Slug is required + restricted to the allowlist; the row is always created
 * as a `draft` (status is NOT accepted from input). `effective_date` defaults to today on the
 * route when omitted; here it is required + validated.
 */
export const legalCreateSchema = z.object({
  slug: z.enum(LEGAL_ADMIN_SLUGS),
  title: titleSchema,
  content: contentSchema,
  effective_date: effectiveDateSchema,
})
export type LegalCreateInput = z.infer<typeof legalCreateSchema>

/**
 * Update a legal DRAFT. Slug + status are intentionally ABSENT (slug is immutable after create;
 * status changes go through publish/archive). All fields optional so a PATCH may edit the title,
 * the body, and/or the effective date; an empty patch is rejected.
 */
export const legalUpdateSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    effective_date: effectiveDateSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided.',
  })
export type LegalUpdateInput = z.infer<typeof legalUpdateSchema>

// --- Version rule ----------------------------------------------------------------------

/**
 * Compute the published version for a slug: `max(existing versions) + 1`, or 1 when the slug has
 * no rows yet. Pure helper so the publish version-bump is unit-testable without a DB.
 */
export function nextPublishedVersion(existingVersions: readonly number[]): number {
  if (existingVersions.length === 0) return 1
  return Math.max(...existingVersions) + 1
}

// --- Admin DTO projections -------------------------------------------------------------

/** Columns the admin legal DAL selects from `legal_pages` (kept in sync with the DAL allowlist). */
export interface AdminLegalPageRow {
  id: string
  slug: string
  title: unknown
  content: unknown
  version: number
  effective_date: string
  status: LegalPageStatus
  last_updated_by: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

/** One row in the admin legal table (no body — kept light for the list). */
export interface AdminLegalPageListItemDTO {
  id: string
  slug: LegalAdminSlug | string
  title: string
  version: number
  status: LegalPageStatus
  effectiveDate: string
  publishedAt: string | null
  updatedAt: string
}

/** Edit-form DTO: the editable fields + slug (read-only) + status/version (read-only). */
export interface AdminLegalPageDetailDTO {
  id: string
  slug: LegalAdminSlug | string
  title: string
  content: string
  version: number
  status: LegalPageStatus
  effectiveDate: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Project a raw admin legal row into the list-item DTO (title via English JSONB, no body). */
export function toAdminLegalListItem(row: AdminLegalPageRow): AdminLegalPageListItemDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: extractEn(row.title),
    version: row.version,
    status: row.status,
    effectiveDate: typeof row.effective_date === 'string' ? row.effective_date : '',
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

/** Project a raw admin legal row into the edit-form detail DTO (title + body via English JSONB). */
export function toAdminLegalDetail(row: AdminLegalPageRow): AdminLegalPageDetailDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: extractEn(row.title),
    content: extractEn(row.content),
    version: row.version,
    status: row.status,
    effectiveDate: typeof row.effective_date === 'string' ? row.effective_date : '',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
