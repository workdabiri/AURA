/**
 * AURA-202 — public property card DTO + projection (pure domain logic).
 *
 * Defines the ONLY shape that leaves the listing/featured boundary for the public
 * surface, plus the pure projector that builds it from the explicit column subset the
 * DAL selects. PURE TypeScript: NO React, NO Supabase, NO DAL, NO I/O.
 *
 * Owner-approved public DTO allowlist (AURA-202). Sensitive fields are NEVER projected:
 * views_count, address, external_map_url, agent_*, stakeholders, internal_notes,
 * created_by, updated_by, storage_path, full description, off-plan/payment-plan detail.
 * The projector reads only allowlisted keys, so any extra field present on the input row
 * is structurally dropped — this is the defence-in-depth backstop behind the DAL's
 * explicit `select(...)` column list.
 */

import type { Database } from '@/types/database'

type Enums = Database['public']['Enums']

/** Cover image surfaced on a card — public CDN URL + alt text only (never storage_path). */
export interface CoverImage {
  url: string
  alt: string
}

/** Public, public-safe property card. The full owner-approved field allowlist. */
export interface PropertyCardDTO {
  id: string
  slug: string
  referenceNumber: string
  title: string
  locationLabel: string
  community: string | null
  price: number | null
  currency: string
  priceVisibility: Enums['price_visibility']
  transactionType: Enums['transaction_type']
  marketType: Enums['market_type']
  propertyType: Enums['property_type']
  availabilityStatus: Enums['availability_status']
  bedrooms: number | null
  bathrooms: number | null
  sizeSqft: number
  isFeatured: boolean
  coverImage: CoverImage | null
}

/**
 * The exact column subset the DAL selects from `properties` for a public card. Kept in
 * sync with the `PROPERTY_CARD_COLUMNS` select list in the DAL. No sensitive columns.
 */
export interface PublicPropertyRow {
  id: string
  slug: string
  reference_number: string
  title_en: string | null
  location_label: string
  community: string | null
  price: number | null
  currency: string
  price_visibility: Enums['price_visibility']
  transaction_type: Enums['transaction_type']
  market_type: Enums['market_type']
  property_type: Enums['property_type']
  availability_status: Enums['availability_status']
  bedrooms: number | null
  bathrooms: number | null
  size_sqft: number
  is_featured: boolean
}

/** The media-row subset the DAL selects for cover resolution. No storage_path. */
export interface PublicMediaRow {
  property_id: string
  url: string
  alt_text: string
  is_cover: boolean
  order_index: number
  media_type: Enums['property_media_type']
}

/**
 * Pick the cover image from a property's media rows (pure, deterministic):
 *   1. images flagged `is_cover`, lowest `order_index` first;
 *   2. otherwise the first image by `order_index`.
 * Floorplans are never used as a cover. Returns null when there is no image.
 */
export function selectCoverImage(media: readonly PublicMediaRow[]): CoverImage | null {
  const images = media.filter((m) => m.media_type === 'image')
  if (images.length === 0) return null

  const byOrder = [...images].sort((a, b) => a.order_index - b.order_index)
  const cover = byOrder.find((m) => m.is_cover) ?? byOrder[0]
  if (!cover) return null

  return { url: cover.url, alt: cover.alt_text }
}

/**
 * Project a raw public property row (+ already-selected cover) into the public DTO.
 * Reads ONLY allowlisted keys; any extra field on `row` is dropped.
 */
export function toPropertyCardDTO(
  row: PublicPropertyRow,
  coverImage: CoverImage | null
): PropertyCardDTO {
  return {
    id: row.id,
    slug: row.slug,
    referenceNumber: row.reference_number,
    title: row.title_en ?? '',
    locationLabel: row.location_label,
    community: row.community,
    price: row.price,
    currency: row.currency,
    priceVisibility: row.price_visibility,
    transactionType: row.transaction_type,
    marketType: row.market_type,
    propertyType: row.property_type,
    availabilityStatus: row.availability_status,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sizeSqft: row.size_sqft,
    isFeatured: row.is_featured,
    coverImage,
  }
}

/**
 * Group media rows by property_id and resolve one cover per property — used by the DAL
 * after a single batched media query (avoids an N+1 per-property media fetch).
 */
export function resolveCoversByProperty(media: readonly PublicMediaRow[]): Map<string, CoverImage> {
  const grouped = new Map<string, PublicMediaRow[]>()
  for (const row of media) {
    const list = grouped.get(row.property_id)
    if (list) list.push(row)
    else grouped.set(row.property_id, [row])
  }

  const covers = new Map<string, CoverImage>()
  for (const [propertyId, rows] of grouped) {
    const cover = selectCoverImage(rows)
    if (cover) covers.set(propertyId, cover)
  }
  return covers
}
