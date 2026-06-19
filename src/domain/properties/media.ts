/**
 * AURA-105 — property media validation + storage-path contract (pure domain logic).
 *
 * Single source of truth for the media upload contract consumed later by the upload route
 * (AURA-304), the storage service (src/services/storage/policy.ts), and mirrored by the
 * AURA-105 storage migration. PURE TypeScript: NO React, NO Supabase, NO service-role, NO I/O.
 *
 * Locked decisions: D-41 (images + floorplans only; NO video/360/virtual tours),
 * A-14 (image/jpeg | image/png | image/webp), A-15 / Q-04 (10MB max), and the media path
 * strategy `properties/{property_id}/{media_type}/{media_id}.{ext}` — UUID-only components
 * with a server-derived extension. A user-supplied filename is NEVER trusted as a storage key.
 */

import { z } from 'zod'

/** Supabase Storage bucket holding all property media (one per deployment — D-04). */
export const MEDIA_BUCKET = 'property-media'

/** Max bytes per media object — 10 MiB (A-15 / Q-04). */
export const MAX_MEDIA_BYTES = 10_485_760

/** Allowed upload MIME types (A-14). Images + floorplans only — NO video / 360 (D-41). */
export const ALLOWED_MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type MediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number]

/** Media categories in MVP — matches the public.property_media_type enum (D-41). */
export const MEDIA_TYPES = ['image', 'floorplan'] as const
export type MediaType = (typeof MEDIA_TYPES)[number]

/**
 * MIME -> canonical file extension. The extension is ALWAYS derived from the validated MIME
 * type, never from the uploaded filename (defeats spoofed extensions / traversal).
 */
export const MIME_EXTENSION: Readonly<Record<MediaMimeType, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// --- Zod schemas (the validation contract) ---------------------------------------

export const mediaMimeTypeSchema = z.enum(ALLOWED_MEDIA_MIME_TYPES)
export const mediaTypeSchema = z.enum(MEDIA_TYPES)
/** Size must be a positive integer no greater than the 10MB cap. */
export const mediaSizeSchema = z.number().int().positive().max(MAX_MEDIA_BYTES)

/** Inputs needed to build a storage path — all server-controlled and UUID-only. */
export const mediaPathInputSchema = z.object({
  propertyId: z.string().uuid(),
  mediaId: z.string().uuid(),
  mediaType: mediaTypeSchema,
  mimeType: mediaMimeTypeSchema,
})
export type MediaPathInput = z.infer<typeof mediaPathInputSchema>

/** Full upload validation contract — path inputs + byte size. */
export const mediaUploadSchema = mediaPathInputSchema.extend({
  sizeBytes: mediaSizeSchema,
})
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>

// --- Functions -------------------------------------------------------------------

/** Canonical extension for a validated MIME type. Throws ZodError on an unsupported type. */
export function extensionForMime(mimeType: MediaMimeType): string {
  return MIME_EXTENSION[mediaMimeTypeSchema.parse(mimeType)]
}

/**
 * Validate an upload payload (ids + media type + MIME + size). Returns a Zod SafeParse
 * result so the caller (the AURA-304 route) can branch without try/catch.
 */
export function validateMediaUpload(input: unknown) {
  return mediaUploadSchema.safeParse(input)
}

/**
 * Build the storage object path for a media item:
 *   properties/{property_id}/{media_type}/{media_id}.{ext}
 *
 * Every component is validated first (UUID property_id + media_id, allowed media_type + MIME).
 * Throws ZodError on any invalid / maliciously-shaped input — a slash, `..`, or any non-UUID
 * value fails `z.string().uuid()`, so traversal / slash injection is impossible and the caller
 * can never supply a raw path or filename.
 */
export function buildMediaStoragePath(input: MediaPathInput): string {
  const { propertyId, mediaId, mediaType, mimeType } = mediaPathInputSchema.parse(input)
  return `properties/${propertyId}/${mediaType}/${mediaId}.${extensionForMime(mimeType)}`
}
