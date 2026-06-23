import 'server-only'

import { getPublicSettings } from '@/dal/settings.dal'
import {
  toPropertyDetailDTO,
  type PropertyDetailDTO,
  type PublicDetailMediaRow,
  type PublicDetailPropertyRow,
  type PublicStakeholderDTO,
} from '@/domain/properties/detail'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseServiceRole } from '@/lib/supabase/service-role'

/**
 * AURA-203 — public property detail data-access layer (published-only reads).
 *
 * `server-only`: reached from the Route Handler / Server Component, never the client bundle.
 *
 * SECURITY POSTURE (owner-approved):
 *   - Property + media reads use the ANON server client (`createSupabaseServerClient`),
 *     NEVER the service role. RLS scopes anon to published properties / published-parent
 *     media (AURA-103); we ALSO re-assert `.eq('publish_status','published')` (defence in depth).
 *   - Explicit public-safe column allowlists — never `select('*')`. No address, views_count,
 *     created_by/updated_by, storage_path, publish_status, area_id, or off-plan/payment detail
 *     leaves except inside the owner-approved DTO. `agent_*` is read ONLY to resolve the
 *     single contact CTA (in the pure projector) and is never surfaced raw.
 *   - Public stakeholders: `property_stakeholders` has NO anon RLS policy, so the ONLY public
 *     read path is the narrow, DAL-private service-role selector below — it selects `name,type`
 *     only, filters `visibility='public'`, and FAILS CLOSED to `[]`. Its `propertyId` always
 *     comes from a property already fetched as published via the anon client, so unpublished
 *     properties never reach it.
 *   - Returns the public DTO only (via the pure projector) — never raw DB rows.
 *
 * This is a SEPARATE file from `properties.dal.ts` (which stays anon-only) so the AURA-202
 * listing security guarantees remain intact and independently asserted.
 */

/** Public-safe detail columns (mirrors `PublicDetailPropertyRow`). NEVER `*`. */
const PROPERTY_DETAIL_COLUMNS =
  'id, slug, reference_number, title_en, description, price, currency, price_visibility, ' +
  'transaction_type, market_type, property_type, availability_status, rental_period, ' +
  'community, sub_community, building_name, location_label, external_map_url, ' +
  'bedrooms, bathrooms, parking, size_sqft, size_sqm, furnishing_status, amenities, ' +
  'rera_number, permit_number, is_featured, ' +
  'agent_name, agent_phone, agent_whatsapp, agent_email, ' +
  'developer_name, handover_date, completion_percentage, down_payment_amount, payment_plan_summary'

/** Public-safe media columns (mirrors `PublicDetailMediaRow`). No storage_path. */
const MEDIA_DETAIL_COLUMNS =
  'property_id, url, alt_text, media_type, is_cover, order_index, width, height'

/** Internal error type so the route/page can map to a generic 500 / error state. */
class PropertyDetailDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PropertyDetailDalError'
  }
}

/**
 * Public stakeholders for an ALREADY-PUBLISHED property — DAL-private service-role safe
 * selector. `property_stakeholders` has no anon policy, so this is the only public read
 * path: it selects `name, type` ONLY, filters `visibility='public'`, and FAILS CLOSED to
 * `[]` on any error. `propertyId` MUST come from a property already fetched as published
 * via the anon client (caller contract) — so this selector never runs for unpublished rows.
 */
async function fetchPublicStakeholders(propertyId: string): Promise<PublicStakeholderDTO[]> {
  try {
    const supabase = getSupabaseServiceRole()
    const { data, error } = await supabase
      .from('property_stakeholders')
      .select('name, type')
      .eq('property_id', propertyId)
      .eq('visibility', 'public')

    if (error || !data) return []
    return data as unknown as PublicStakeholderDTO[]
  } catch {
    return []
  }
}

/**
 * Load a single PUBLISHED property by slug for the public detail surface, with its media
 * gallery, the safe public-stakeholder projection, and the resolved contact CTA. Returns a
 * public-safe DTO, or `null` for a missing / draft / archived slug (→ the route maps to 404).
 */
export async function getPublishedPropertyBySlug(slug: string): Promise<PropertyDetailDTO | null> {
  const supabase = await createSupabaseServerClient()

  const { data: row, error } = await supabase
    .from('properties')
    .select(PROPERTY_DETAIL_COLUMNS)
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .maybeSingle()

  if (error) {
    throw new PropertyDetailDalError(`Failed to load property: ${error.message}`)
  }
  if (!row) return null

  const property = row as unknown as PublicDetailPropertyRow

  const { data: media, error: mediaError } = await supabase
    .from('property_media')
    .select(MEDIA_DETAIL_COLUMNS)
    .eq('property_id', property.id)

  if (mediaError) {
    throw new PropertyDetailDalError(`Failed to load property media: ${mediaError.message}`)
  }

  const stakeholders = await fetchPublicStakeholders(property.id)
  const settings = await getPublicSettings()

  return toPropertyDetailDTO(
    property,
    (media ?? []) as unknown as PublicDetailMediaRow[],
    stakeholders,
    settings
  )
}
