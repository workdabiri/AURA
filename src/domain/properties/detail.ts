/**
 * AURA-203 — public property detail DTO + projection (pure domain logic).
 *
 * Defines the ONLY shape that leaves the detail boundary for the public surface, plus the
 * pure projector that builds it from the explicit column subset the DAL selects. PURE
 * TypeScript: NO React, NO Supabase, NO DAL, NO I/O.
 *
 * Owner-locked public allowlist (AURA-203). Sensitive fields are NEVER projected:
 * address, views_count, created_by, updated_by, created_at/updated_at/published_at/
 * archived_at, publish_status, area_id, storage_path, stakeholder phone/email/whatsapp/
 * registration_or_license/internal_notes, internal_only stakeholders. The projector reads
 * only allowlisted keys, so any extra field present on the input row is structurally dropped.
 *
 * `agent_*` contact override fields are read here ONLY to resolve the single contact CTA
 * (see ./contact) — they are never surfaced as raw DTO fields. `offPlan` is present ONLY
 * when `marketType === 'off_plan'` (D-36).
 */

import { resolveContact, type ResolvedContactDTO } from '@/domain/properties/contact'
import type { PublicSettings } from '@/domain/settings'
import type { Database } from '@/types/database'

type Enums = Database['public']['Enums']

// --- Slug validation (A-06: lowercase, collision-suffixed, immutable after publish) ----

export const SLUG_MAX_LENGTH = 200
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A public property slug: lowercase, hyphen-separated, bounded. */
export function isValidSlug(slug: string): boolean {
  return (
    typeof slug === 'string' &&
    slug.length > 0 &&
    slug.length <= SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(slug)
  )
}

// --- Public DTO shapes ----------------------------------------------------------------

/** One public media item on the detail gallery — public CDN url + alt only (never storage_path). */
export interface PropertyDetailMediaDTO {
  url: string
  alt: string
  mediaType: Enums['property_media_type']
  isCover: boolean
  orderIndex: number
  width: number | null
  height: number | null
}

/** Safe public stakeholder projection — name + type ONLY (D-16; never contact/notes). */
export interface PublicStakeholderDTO {
  name: string
  type: Enums['stakeholder_type']
}

/** Off-plan block — present only when marketType === 'off_plan' (D-36). */
export interface OffPlanDTO {
  developerName: string | null
  handoverDate: string | null
  completionPercentage: number | null
  downPaymentAmount: number | null
  paymentPlanSummary: string | null
}

/** The full public-safe property detail DTO (owner-approved allowlist, AURA-203). */
export interface PropertyDetailDTO {
  id: string
  slug: string
  referenceNumber: string
  title: string
  description: string
  transactionType: Enums['transaction_type']
  marketType: Enums['market_type']
  propertyType: Enums['property_type']
  availabilityStatus: Enums['availability_status']
  rentalPeriod: Enums['rental_period'] | null
  price: number | null
  currency: string
  priceVisibility: Enums['price_visibility']
  locationLabel: string
  community: string | null
  subCommunity: string | null
  buildingName: string | null
  externalMapUrl: string | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  sizeSqft: number
  sizeSqm: number | null
  furnishingStatus: Enums['furnishing_status']
  amenities: string[]
  reraNumber: string | null
  permitNumber: string | null
  isFeatured: boolean
  media: PropertyDetailMediaDTO[]
  publicStakeholders: PublicStakeholderDTO[]
  contact: ResolvedContactDTO
  offPlan: OffPlanDTO | null
}

// --- Raw row subsets the DAL selects (kept in sync with the DAL column allowlists) -----

/** The exact `properties` column subset the detail DAL selects. No sensitive columns. */
export interface PublicDetailPropertyRow {
  id: string
  slug: string
  reference_number: string
  title_en: string | null
  description: unknown
  price: number | null
  currency: string
  price_visibility: Enums['price_visibility']
  transaction_type: Enums['transaction_type']
  market_type: Enums['market_type']
  property_type: Enums['property_type']
  availability_status: Enums['availability_status']
  rental_period: Enums['rental_period'] | null
  community: string | null
  sub_community: string | null
  building_name: string | null
  location_label: string
  external_map_url: string | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  size_sqft: number
  size_sqm: number | null
  furnishing_status: Enums['furnishing_status']
  amenities: unknown
  rera_number: string | null
  permit_number: string | null
  is_featured: boolean
  // Contact override (D-13) — read ONLY to resolve the CTA, never surfaced raw.
  agent_name: string | null
  agent_phone: string | null
  agent_whatsapp: string | null
  agent_email: string | null
  // Off-plan (surfaced only when market_type === 'off_plan').
  developer_name: string | null
  handover_date: string | null
  completion_percentage: number | null
  down_payment_amount: number | null
  payment_plan_summary: string | null
}

/** The `property_media` subset the detail DAL selects. No storage_path. */
export interface PublicDetailMediaRow {
  property_id: string
  url: string
  alt_text: string
  media_type: Enums['property_media_type']
  is_cover: boolean
  order_index: number
  width: number | null
  height: number | null
}

// --- Pure projection helpers ----------------------------------------------------------

/** Extract the English value from an i18n JSONB object; empty string when absent. */
function extractEn(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = (value as Record<string, unknown>).en
    if (typeof en === 'string') return en
  }
  return ''
}

/** Coerce a JSONB amenities value into a deterministic string array. */
function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

/**
 * Order detail media for display: cover image(s) first, then ascending `order_index`.
 * Includes BOTH images and floorplans (the UI separates them by `mediaType`).
 */
export function selectDetailMedia(
  media: readonly PublicDetailMediaRow[]
): PropertyDetailMediaDTO[] {
  return [...media]
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
      return a.order_index - b.order_index
    })
    .map((m) => ({
      url: m.url,
      alt: m.alt_text,
      mediaType: m.media_type,
      isCover: m.is_cover,
      orderIndex: m.order_index,
      width: m.width,
      height: m.height,
    }))
}

/** Project already-filtered public stakeholders down to the name+type allowlist. */
export function projectPublicStakeholders(
  rows: readonly { name: string; type: Enums['stakeholder_type'] }[]
): PublicStakeholderDTO[] {
  return rows.map((row) => ({ name: row.name, type: row.type }))
}

/** Build the off-plan block, or null for ready properties (D-36). */
function buildOffPlan(row: PublicDetailPropertyRow): OffPlanDTO | null {
  if (row.market_type !== 'off_plan') return null
  return {
    developerName: row.developer_name,
    handoverDate: row.handover_date,
    completionPercentage: row.completion_percentage,
    downPaymentAmount: row.down_payment_amount,
    paymentPlanSummary: row.payment_plan_summary,
  }
}

/**
 * Project a raw detail row (+ media, + already-filtered public stakeholders, + agency
 * settings) into the public detail DTO. Reads ONLY allowlisted keys. The `agent_*` fields
 * feed `resolveContact` and are never surfaced raw; off-plan fields are surfaced only when
 * `market_type === 'off_plan'`.
 */
export function toPropertyDetailDTO(
  row: PublicDetailPropertyRow,
  media: readonly PublicDetailMediaRow[],
  stakeholders: readonly { name: string; type: Enums['stakeholder_type'] }[],
  settings: Pick<PublicSettings, 'agencyWhatsapp' | 'agencyPhone' | 'agencyEmail'>
): PropertyDetailDTO {
  return {
    id: row.id,
    slug: row.slug,
    referenceNumber: row.reference_number,
    title: row.title_en ?? '',
    description: extractEn(row.description),
    transactionType: row.transaction_type,
    marketType: row.market_type,
    propertyType: row.property_type,
    availabilityStatus: row.availability_status,
    rentalPeriod: row.rental_period,
    price: row.price,
    currency: row.currency,
    priceVisibility: row.price_visibility,
    locationLabel: row.location_label,
    community: row.community,
    subCommunity: row.sub_community,
    buildingName: row.building_name,
    externalMapUrl: row.external_map_url,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    sizeSqft: row.size_sqft,
    sizeSqm: row.size_sqm,
    furnishingStatus: row.furnishing_status,
    amenities: toStringArray(row.amenities),
    reraNumber: row.rera_number,
    permitNumber: row.permit_number,
    isFeatured: row.is_featured,
    media: selectDetailMedia(media),
    publicStakeholders: projectPublicStakeholders(stakeholders),
    contact: resolveContact(
      {
        agentWhatsapp: row.agent_whatsapp,
        agentPhone: row.agent_phone,
        agentEmail: row.agent_email,
      },
      {
        agencyWhatsapp: settings.agencyWhatsapp,
        agencyPhone: settings.agencyPhone,
        agencyEmail: settings.agencyEmail,
      }
    ),
    offPlan: buildOffPlan(row),
  }
}
