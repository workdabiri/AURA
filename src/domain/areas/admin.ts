/**
 * AURA-305 — admin area write contract (pure domain logic).
 *
 * Single source of truth for the admin area create/update shapes + the area-image storage path,
 * consumed by:
 *   - the admin API routes (`src/app/api/admin/areas/**`),
 *   - the admin DAL write functions (`src/dal/admin-areas.dal.ts`),
 *   - the admin area form (`src/components/admin/AreaForm.tsx`, client-side).
 *
 * PURE TypeScript: NO React, NO Supabase, NO DAL, NO services, NO I/O, NO `server-only`.
 * Every business rule lives here (not in JSX or the route), so handlers/forms never trust raw
 * input and the rules are unit-testable in Node.
 *
 * Locked decisions / owner approvals enforced here:
 *   - Slug is editable ONLY at create; PATCH never accepts a slug (immutable after create).
 *   - One representative area image only (no gallery / multi-upload). MIME + size reuse the
 *     AURA-105 media contract (image/jpeg | image/png | image/webp, 10MB). The image's public
 *     URL is stored in the existing `areas.image_url`; the path is server-built + UUID-only.
 *   - Deactivate / reactivate is a plain `is_active` toggle — NO hard delete.
 *   - `sort_order` is an admin-set integer (default 0); no drag/drop ordering.
 */

import { z } from 'zod'

import {
  ALLOWED_MEDIA_MIME_TYPES,
  extensionForMime,
  MAX_MEDIA_BYTES,
  MEDIA_BUCKET,
  type MediaMimeType,
} from '@/domain/properties/media'
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from '@/domain/properties/detail'

// --- Area-image contract (reuses the AURA-105 media bucket + MIME/size rules) ------

/**
 * The representative area image reuses the SAME storage bucket + MIME allowlist + size cap as
 * property media (AURA-105). Re-exported here so the route + DAL import the area contract from
 * one place. One image per area — no gallery, no second media table.
 */
export const AREA_IMAGE_BUCKET = MEDIA_BUCKET
export const AREA_IMAGE_MAX_BYTES = MAX_MEDIA_BYTES
export const ALLOWED_AREA_IMAGE_MIME_TYPES = ALLOWED_MEDIA_MIME_TYPES
export type AreaImageMimeType = MediaMimeType

/** Inputs needed to build the area-image storage path — all server-controlled and UUID-only. */
const areaImagePathInputSchema = z.object({
  areaId: z.string().uuid(),
  imageId: z.string().uuid(),
  mimeType: z.enum(ALLOWED_AREA_IMAGE_MIME_TYPES),
})
type AreaImagePathInput = z.infer<typeof areaImagePathInputSchema>

/**
 * Build the storage object path for an area's representative image:
 *   areas/{area_id}/{image_id}.{ext}
 *
 * Every component is validated first (UUID area_id + image_id, allowed MIME). Throws ZodError on
 * any invalid / maliciously-shaped input — a slash, `..`, or any non-UUID value fails
 * `z.string().uuid()`, so traversal / slash injection is impossible and the caller can never
 * supply a raw path or filename. The extension is ALWAYS derived from the validated MIME.
 */
export function buildAreaImagePath(input: AreaImagePathInput): string {
  const { areaId, imageId, mimeType } = areaImagePathInputSchema.parse(input)
  return `areas/${areaId}/${imageId}.${extensionForMime(mimeType)}`
}

// --- Field schemas ----------------------------------------------------------------

/** Required English name (the public area DTO surfaces `name.en`). */
const nameI18n = z.object({ en: z.string().trim().min(1).max(200) })
/** Optional English description (the public DTO tolerates an empty description). */
const descriptionI18n = z
  .object({ en: z.string().trim().max(5000) })
  .partial()
  .optional()

/**
 * Slug rules (owner-locked): admin-set at create, lowercase, hyphen-separated, bounded — the
 * same public-slug grammar AURA-203 uses. Editable ONLY at create; the update schema below has
 * NO slug field, and the DAL strips it defensively.
 */
const areaSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(SLUG_MAX_LENGTH)
  .refine((v) => SLUG_PATTERN.test(v), {
    message: 'Slug may contain only lowercase letters, numbers, and single hyphens.',
  })

/** `sort_order` is a non-negative integer; default 0 (no drag/drop ordering). */
const sortOrderSchema = z.number().int().min(0).max(100000)

/** Create an area. Slug is required + editable here only; image is handled separately (file). */
export const areaCreateSchema = z.object({
  slug: areaSlugSchema,
  name: nameI18n,
  description: descriptionI18n,
  sort_order: sortOrderSchema.default(0),
  is_active: z.boolean().default(true),
})
export type AreaCreateInput = z.infer<typeof areaCreateSchema>

/**
 * Update an area. Slug is intentionally ABSENT (immutable after create). All fields optional so a
 * PATCH may edit fields, replace the image (handled separately), or toggle `is_active` alone
 * (deactivate/reactivate). The image URL is managed server-side after upload, never accepted here.
 */
export const areaUpdateSchema = z.object({
  name: nameI18n.optional(),
  description: descriptionI18n,
  sort_order: sortOrderSchema.optional(),
  is_active: z.boolean().optional(),
})
export type AreaUpdateInput = z.infer<typeof areaUpdateSchema>

// --- Update payload builder (slug/image/ownership immutability backstop) -----------

/**
 * Columns an admin area update may NEVER write directly through the generic patch. `slug` is the
 * key one — immutable after create. `image_url` is set by the DAL only after a successful upload,
 * never from the patch object; id/timestamps are DB-managed.
 */
const NON_UPDATABLE_AREA_KEYS = new Set(['id', 'slug', 'image_url', 'created_at', 'updated_at'])

/**
 * Build the DB update object for an area from validated fields. The i18n fields stay as `{ en }`
 * JSONB. Defensively strips any immutable key (slug above all) even if present, so the slug can
 * never change via update. `undefined` fields are skipped (a partial PATCH leaves them untouched).
 */
export function buildAreaUpdatePayload(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (NON_UPDATABLE_AREA_KEYS.has(key)) continue
    if (value === undefined) continue
    out[key] = value
  }
  return out
}
