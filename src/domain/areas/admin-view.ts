/**
 * AURA-305 — admin area read projections (pure domain logic).
 *
 * The admin areas surface sees ALL areas (active + inactive) and more fields than the public
 * area DTO (AURA-204), plus admin-only property counts. It still never selects `*`: the DAL
 * selects an explicit admin column allowlist + computes counts, and these pure projectors map
 * the rows into stable DTOs. PURE TypeScript: NO React, NO Supabase, NO DAL, NO I/O.
 *
 *   - `AdminAreaListItemDTO` — one row in the admin areas table (fields + property counts).
 *   - `AdminAreaDetailDTO` — the edit form's initial values (editable fields + slug + image).
 *
 * Property counts (admin-only for AURA-305):
 *   - `totalProperties`     — ALL properties linked to the area, any publish_status.
 *   - `publishedProperties` — only properties with publish_status = 'published'.
 */

/** Columns the admin areas DAL selects from `areas` (kept in sync with the DAL allowlist). */
export interface AdminAreaRow {
  id: string
  slug: string
  name: unknown
  description: unknown
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/** Per-area property counts (computed by the DAL from `properties.area_id` + `publish_status`). */
export interface AreaPropertyCounts {
  totalProperties: number
  publishedProperties: number
}

/** One row in the admin areas table. */
export interface AdminAreaListItemDTO {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
  totalProperties: number
  publishedProperties: number
  updatedAt: string
}

/** Edit-form DTO: editable fields in form-aligned shape + slug (read-only) + image. */
export interface AdminAreaDetailDTO {
  id: string
  slug: string
  name: { en: string }
  description: { en: string }
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/** Extract the English value from an i18n JSONB object; empty string when absent/invalid. */
export function extractEn(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = (value as Record<string, unknown>).en
    if (typeof en === 'string') return en
  }
  return ''
}

/** Project a raw admin area row + its counts into the list-item DTO. */
export function toAdminAreaListItem(
  row: AdminAreaRow,
  counts: AreaPropertyCounts
): AdminAreaListItemDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: extractEn(row.name),
    description: extractEn(row.description),
    imageUrl: row.image_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    totalProperties: counts.totalProperties,
    publishedProperties: counts.publishedProperties,
    updatedAt: row.updated_at,
  }
}

/** Project a raw admin area row into the edit-form DTO (i18n kept as `{ en }`). */
export function toAdminAreaDetail(row: AdminAreaRow): AdminAreaDetailDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: { en: extractEn(row.name) },
    description: { en: extractEn(row.description) },
    imageUrl: row.image_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
