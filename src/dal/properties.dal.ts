import 'server-only'

import {
  resolveCoversByProperty,
  toPropertyCardDTO,
  type CoverImage,
  type PropertyCardDTO,
  type PublicMediaRow,
  type PublicPropertyRow,
} from '@/domain/properties/card'
import { paginationRange, type ListingQuery, type SortOption } from '@/domain/properties/query'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * AURA-202 — public properties data-access layer (published-only reads).
 *
 * `server-only`: reached from Route Handlers / Server Components, never the client bundle.
 *
 * SECURITY POSTURE (owner-approved):
 *   - Uses the ANON server client (`createSupabaseServerClient`), NEVER the service role.
 *     `properties` / `property_media` / `areas` all have anon RLS policies that scope reads
 *     to published / active rows (AURA-103), so RLS is the enforcement boundary. We ALSO
 *     re-assert `.eq('publish_status', 'published')` in every query as defence in depth.
 *   - Selects an EXPLICIT public-safe column allowlist — never `select('*')`. No address,
 *     agent_*, stakeholders, internal_notes, created_by/updated_by, storage_path,
 *     views_count, full description, or off-plan/payment-plan detail ever leaves here.
 *   - `property_stakeholders` is never queried by the listing surface.
 *   - Returns DTOs only (via the pure projector) — never raw DB rows.
 *
 * Cover images are resolved with a single BATCHED media query keyed by property id (no
 * N+1), then projected through the pure `resolveCoversByProperty` selector.
 */

/** Public-safe property columns (mirrors `PublicPropertyRow`). NEVER `*`. */
const PROPERTY_CARD_COLUMNS =
  'id, slug, reference_number, title_en, location_label, community, price, currency, ' +
  'price_visibility, transaction_type, market_type, property_type, availability_status, ' +
  'bedrooms, bathrooms, size_sqft, is_featured'

/** Public-safe media columns for cover resolution (mirrors `PublicMediaRow`). No storage_path. */
const MEDIA_COVER_COLUMNS = 'property_id, url, alt_text, is_cover, order_index, media_type'

/** Result of a paginated listing read. */
interface PropertyListResult {
  items: PropertyCardDTO[]
  total: number
}

/** Internal error type so routes/pages can map to a generic 500 / error state. */
class PropertiesDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PropertiesDalError'
  }
}

/** Apply the sort allowlist to a query builder. Stable secondary sort by id. */
function applySort<T extends { order: (col: string, opts?: object) => T }>(
  query: T,
  sort: SortOption
): T {
  switch (sort) {
    case 'price_asc':
      return query.order('price', { ascending: true, nullsFirst: false }).order('id', {
        ascending: true,
      })
    case 'price_desc':
      return query.order('price', { ascending: false, nullsFirst: false }).order('id', {
        ascending: true,
      })
    case 'newest':
    default:
      return query.order('created_at', { ascending: false }).order('id', { ascending: true })
  }
}

/** Batched cover-image lookup for the given property ids (single query, no N+1). */
async function fetchCoversFor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  propertyIds: string[]
): Promise<Map<string, CoverImage>> {
  if (propertyIds.length === 0) return new Map<string, CoverImage>()

  const { data, error } = await supabase
    .from('property_media')
    .select(MEDIA_COVER_COLUMNS)
    .in('property_id', propertyIds)

  if (error) {
    throw new PropertiesDalError(`Failed to load property media: ${error.message}`)
  }

  return resolveCoversByProperty((data ?? []) as unknown as PublicMediaRow[])
}

/**
 * List published properties for the public listing surface, with filters, search, sort,
 * and pagination. Returns public-safe DTOs + the total matching count.
 *
 * `area` is an area SLUG: it is resolved through the ACTIVE `areas` table; an unknown /
 * inactive slug yields an empty result (no leak, no error).
 */
export async function listPublishedProperties(query: ListingQuery): Promise<PropertyListResult> {
  const supabase = await createSupabaseServerClient()

  // Resolve area slug -> id (active areas only). Unknown/inactive slug => empty result.
  let areaId: string | undefined
  if (query.area) {
    const { data: area, error: areaError } = await supabase
      .from('areas')
      .select('id')
      .eq('slug', query.area)
      .eq('is_active', true)
      .maybeSingle()

    if (areaError) {
      throw new PropertiesDalError(`Failed to resolve area: ${areaError.message}`)
    }
    if (!area) {
      return { items: [], total: 0 }
    }
    areaId = (area as unknown as { id: string }).id
  }

  let builder = supabase
    .from('properties')
    .select(PROPERTY_CARD_COLUMNS, { count: 'exact' })
    .eq('publish_status', 'published')

  if (query.transaction_type) builder = builder.eq('transaction_type', query.transaction_type)
  if (query.market_type) builder = builder.eq('market_type', query.market_type)
  if (query.property_type) builder = builder.eq('property_type', query.property_type)
  if (areaId) builder = builder.eq('area_id', areaId)
  if (query.community) builder = builder.eq('community', query.community)
  if (query.availability_status)
    builder = builder.eq('availability_status', query.availability_status)
  if (query.min_price !== undefined) builder = builder.gte('price', query.min_price)
  if (query.max_price !== undefined) builder = builder.lte('price', query.max_price)
  if (query.bedrooms !== undefined) builder = builder.gte('bedrooms', query.bedrooms)
  if (query.search) {
    // Full-text search limited to `title_en` (AURA-202 scope). PostgREST wraps the column
    // as `to_tsvector('english', title_en) @@ websearch_to_tsquery('english', q)`, which the
    // existing GIN index on `to_tsvector('english', coalesce(title_en,''))` accelerates where
    // the planner matches it; correctness does not depend on the index being used.
    builder = builder.textSearch('title_en', query.search, {
      type: 'websearch',
      config: 'english',
    })
  }

  builder = applySort(builder, query.sort)

  const { from, to } = paginationRange(query)
  const { data, count, error } = await builder.range(from, to)

  if (error) {
    throw new PropertiesDalError(`Failed to list properties: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as PublicPropertyRow[]
  const covers = await fetchCoversFor(
    supabase,
    rows.map((r) => r.id)
  )

  const items = rows.map((row) => toPropertyCardDTO(row, covers.get(row.id) ?? null))
  return { items, total: count ?? 0 }
}

/**
 * Published + featured properties for the homepage featured section. Bounded count.
 * Re-asserts `publish_status = 'published'` AND `is_featured = true`.
 */
export async function listFeaturedProperties(limit: number): Promise<PropertyCardDTO[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_CARD_COLUMNS)
    .eq('publish_status', 'published')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .range(0, Math.max(0, limit - 1))

  if (error) {
    throw new PropertiesDalError(`Failed to list featured properties: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as PublicPropertyRow[]
  const covers = await fetchCoversFor(
    supabase,
    rows.map((r) => r.id)
  )

  return rows.map((row) => toPropertyCardDTO(row, covers.get(row.id) ?? null))
}
