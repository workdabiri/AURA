/**
 * AURA-202 — public properties listing query contract (pure domain logic).
 *
 * Single source of truth for the validated query shape consumed by:
 *   - the public API route (`src/app/api/properties/route.ts`),
 *   - the featured API route (`src/app/api/properties/featured/route.ts`),
 *   - the server-component listing page (`src/app/[locale]/properties/page.tsx`),
 *   - the DAL (`src/dal/properties.dal.ts`).
 *
 * PURE TypeScript: NO React, NO Supabase, NO DAL, NO services, NO I/O. Every value is
 * validated/normalised here so handlers and pages never trust raw query strings.
 *
 * Owner-approved decisions enforced (AURA-202):
 *   - pagination: default page 1, default limit 12, hard cap 50 (A-07); limit > 50 clamps
 *     to 50; zero/negative/non-numeric page or limit is a validation failure.
 *   - sort allowlist: newest (default) | price_asc | price_desc (no title/size sort).
 *   - search: trimmed, bounded length, matched against `title_en` only.
 *   - max_price < min_price is invalid.
 *   - featured: default limit 6, hard max 12.
 */

import { z } from 'zod'

// --- Constants ------------------------------------------------------------------

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 12
export const MAX_LIMIT = 50
const SEARCH_MAX_LENGTH = 100

export const FEATURED_DEFAULT_LIMIT = 6
export const FEATURED_MAX_LIMIT = 12

/** Sort options (owner-approved allowlist). Default is `newest`. */
export const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc'] as const
export type SortOption = (typeof SORT_OPTIONS)[number]
export const DEFAULT_SORT: SortOption = 'newest'

/** Filter enums — mirror the public.* Postgres enums (D-36 taxonomy). */
export const TRANSACTION_TYPES = ['sale', 'rent'] as const
export const MARKET_TYPES = ['ready', 'off_plan'] as const
export const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'townhouse',
  'penthouse',
  'office',
  'plot',
  'retail',
  'warehouse',
] as const
export const AVAILABILITY_STATUSES = [
  'available',
  'reserved',
  'sold',
  'rented',
  'unavailable',
] as const

// --- Coercion helpers -----------------------------------------------------------

/**
 * A non-negative numeric query param (price). Rejects empty string, NaN, and negatives.
 * `z.coerce.number()` would turn '' into 0, so we guard the empty/whitespace case first.
 */
const nonNegativeNumber = z.string().trim().min(1).pipe(z.coerce.number().nonnegative())

/** A non-negative integer query param (bedrooms). */
const nonNegativeInt = z.string().trim().min(1).pipe(z.coerce.number().int().nonnegative())

/**
 * A positive integer query param (page/limit). Zero / negative / non-numeric is a validation
 * failure; an absent param is `undefined` (the default is applied after parse, below).
 */
const optionalPositiveInt = z
  .string()
  .trim()
  .min(1)
  .pipe(z.coerce.number().int().positive())
  .optional()

// --- Listing query schema -------------------------------------------------------

/**
 * Raw listing query schema. All params optional; absent params fall back to defaults applied
 * in the final `.transform`. `limit` is clamped to MAX_LIMIT (a request for more is capped,
 * not an error — A-07), while a non-numeric / zero / negative `page`/`limit` IS a validation
 * failure (caught by `optionalPositiveInt` before the transform runs).
 */
export const listingQuerySchema = z
  .object({
    transaction_type: z.enum(TRANSACTION_TYPES).optional(),
    market_type: z.enum(MARKET_TYPES).optional(),
    property_type: z.enum(PROPERTY_TYPES).optional(),
    area: z.string().trim().min(1).max(120).optional(),
    community: z.string().trim().min(1).max(120).optional(),
    min_price: nonNegativeNumber.optional(),
    max_price: nonNegativeNumber.optional(),
    bedrooms: nonNegativeInt.optional(),
    availability_status: z.enum(AVAILABILITY_STATUSES).optional(),
    search: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional(),
    sort: z.enum(SORT_OPTIONS).default(DEFAULT_SORT),
    page: optionalPositiveInt,
    limit: optionalPositiveInt,
  })
  .refine(
    (q) => q.min_price === undefined || q.max_price === undefined || q.max_price >= q.min_price,
    { message: 'max_price must be greater than or equal to min_price', path: ['max_price'] }
  )
  .transform((q) => ({
    ...q,
    page: q.page ?? DEFAULT_PAGE,
    limit: Math.min(q.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
  }))

/** Validated listing query (post-parse, defaults + cap applied). */
export type ListingQuery = z.infer<typeof listingQuerySchema>

/** Parse a raw record of query params (e.g. from URLSearchParams). */
export function parseListingQuery(input: Record<string, unknown>) {
  return listingQuerySchema.safeParse(input)
}

/** 0-based inclusive range for a Supabase `.range(from, to)` call. */
export function paginationRange(query: Pick<ListingQuery, 'page' | 'limit'>): {
  from: number
  to: number
} {
  const from = (query.page - 1) * query.limit
  return { from, to: from + query.limit - 1 }
}

/** Total page count for a given total row count + limit. */
export function totalPages(total: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.ceil(total / limit)
}

// --- Featured query schema ------------------------------------------------------

/**
 * Featured query schema. `limit` defaults to 6 and is clamped to a hard max of 12.
 * Non-numeric / zero / negative `limit` is a validation failure.
 */
const featuredQuerySchema = z
  .object({
    limit: optionalPositiveInt,
  })
  .transform((q) => ({
    limit: Math.min(q.limit ?? FEATURED_DEFAULT_LIMIT, FEATURED_MAX_LIMIT),
  }))

export function parseFeaturedQuery(input: Record<string, unknown>) {
  return featuredQuerySchema.safeParse(input)
}
