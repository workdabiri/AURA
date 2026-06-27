/**
 * AURA-303 — admin property read projections (pure domain logic).
 *
 * The admin surface sees ALL statuses and more columns than the public DTOs, but it still
 * never selects `*`: the DAL selects an explicit admin column allowlist and these pure
 * projectors map the rows into stable DTOs. PURE TypeScript: NO React, NO Supabase, NO DAL.
 *
 *   - `AdminPropertyListItemDTO` — one row in the admin table (status + summary fields).
 *   - `AdminPropertyDetailDTO` — the edit form's initial values (editable fields, form-aligned
 *     snake_case keys matching ./admin schemas) + lifecycle metadata.
 *
 * Sensitive operational columns that the admin form does not edit (`created_by`, `updated_by`,
 * `views_count`, `area_id`, `title_en`) are intentionally not projected.
 */

import type { PublishStatus } from '@/domain/properties/admin'
import type { Database } from '@/types/database'

type Enums = Database['public']['Enums']

// --- List item -------------------------------------------------------------------

/** Columns the admin list DAL selects (kept in sync with `ADMIN_LIST_COLUMNS` in the DAL). */
export interface AdminPropertyListRow {
  id: string
  slug: string
  reference_number: string
  title_en: string | null
  publish_status: PublishStatus
  transaction_type: Enums['transaction_type']
  market_type: Enums['market_type']
  property_type: Enums['property_type']
  availability_status: Enums['availability_status']
  price: number | null
  currency: string
  price_visibility: Enums['price_visibility']
  is_featured: boolean
  updated_at: string
}

/** One row in the admin properties table. */
export interface AdminPropertyListItemDTO {
  id: string
  slug: string
  referenceNumber: string
  title: string
  publishStatus: PublishStatus
  transactionType: Enums['transaction_type']
  marketType: Enums['market_type']
  propertyType: Enums['property_type']
  availabilityStatus: Enums['availability_status']
  price: number | null
  currency: string
  priceVisibility: Enums['price_visibility']
  isFeatured: boolean
  updatedAt: string
}

export function toAdminListItem(row: AdminPropertyListRow): AdminPropertyListItemDTO {
  return {
    id: row.id,
    slug: row.slug,
    referenceNumber: row.reference_number,
    title: row.title_en ?? '',
    publishStatus: row.publish_status,
    transactionType: row.transaction_type,
    marketType: row.market_type,
    propertyType: row.property_type,
    availabilityStatus: row.availability_status,
    price: row.price,
    currency: row.currency,
    priceVisibility: row.price_visibility,
    isFeatured: row.is_featured,
    updatedAt: row.updated_at,
  }
}

// --- Detail (edit form initial values) -------------------------------------------

/** Columns the admin detail DAL selects (kept in sync with `ADMIN_DETAIL_COLUMNS`). */
export interface AdminPropertyDetailRow {
  id: string
  slug: string
  reference_number: string
  publish_status: PublishStatus
  created_at: string
  updated_at: string
  published_at: string | null
  archived_at: string | null
  title: unknown
  description: unknown
  transaction_type: Enums['transaction_type']
  market_type: Enums['market_type']
  property_type: Enums['property_type']
  availability_status: Enums['availability_status']
  price_visibility: Enums['price_visibility']
  rental_period: Enums['rental_period'] | null
  furnishing_status: Enums['furnishing_status']
  price: number | null
  currency: string
  location_label: string
  community: string | null
  sub_community: string | null
  building_name: string | null
  address: string | null
  external_map_url: string | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  size_sqft: number
  size_sqm: number | null
  amenities: unknown
  rera_number: string | null
  permit_number: string | null
  agent_name: string | null
  agent_phone: string | null
  agent_whatsapp: string | null
  agent_email: string | null
  developer_name: string | null
  handover_date: string | null
  completion_percentage: number | null
  down_payment_amount: number | null
  payment_plan_summary: string | null
  is_featured: boolean
}

/**
 * Edit-form DTO: lifecycle metadata + the editable fields in form-aligned snake_case (the
 * same keys the ./admin update schema accepts), so the form can hydrate directly.
 */
export interface AdminPropertyDetailDTO {
  id: string
  slug: string
  reference_number: string
  publish_status: PublishStatus
  created_at: string
  updated_at: string
  published_at: string | null
  archived_at: string | null
  title: { en: string }
  description: { en: string }
  transaction_type: Enums['transaction_type']
  market_type: Enums['market_type']
  property_type: Enums['property_type']
  availability_status: Enums['availability_status']
  price_visibility: Enums['price_visibility']
  rental_period: Enums['rental_period'] | null
  furnishing_status: Enums['furnishing_status']
  price: number | null
  currency: string
  location_label: string
  community: string | null
  sub_community: string | null
  building_name: string | null
  address: string | null
  external_map_url: string | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  size_sqft: number
  size_sqm: number | null
  amenities: string[]
  rera_number: string | null
  permit_number: string | null
  agent_name: string | null
  agent_phone: string | null
  agent_whatsapp: string | null
  agent_email: string | null
  developer_name: string | null
  handover_date: string | null
  completion_percentage: number | null
  down_payment_amount: number | null
  payment_plan_summary: string | null
  is_featured: boolean
}

function extractEn(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = (value as Record<string, unknown>).en
    if (typeof en === 'string') return en
  }
  return ''
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export function toAdminPropertyDetail(row: AdminPropertyDetailRow): AdminPropertyDetailDTO {
  return {
    id: row.id,
    slug: row.slug,
    reference_number: row.reference_number,
    publish_status: row.publish_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    archived_at: row.archived_at,
    title: { en: extractEn(row.title) },
    description: { en: extractEn(row.description) },
    transaction_type: row.transaction_type,
    market_type: row.market_type,
    property_type: row.property_type,
    availability_status: row.availability_status,
    price_visibility: row.price_visibility,
    rental_period: row.rental_period,
    furnishing_status: row.furnishing_status,
    price: row.price,
    currency: row.currency,
    location_label: row.location_label,
    community: row.community,
    sub_community: row.sub_community,
    building_name: row.building_name,
    address: row.address,
    external_map_url: row.external_map_url,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    size_sqft: row.size_sqft,
    size_sqm: row.size_sqm,
    amenities: toStringArray(row.amenities),
    rera_number: row.rera_number,
    permit_number: row.permit_number,
    agent_name: row.agent_name,
    agent_phone: row.agent_phone,
    agent_whatsapp: row.agent_whatsapp,
    agent_email: row.agent_email,
    developer_name: row.developer_name,
    handover_date: row.handover_date,
    completion_percentage: row.completion_percentage,
    down_payment_amount: row.down_payment_amount,
    payment_plan_summary: row.payment_plan_summary,
    is_featured: row.is_featured,
  }
}
