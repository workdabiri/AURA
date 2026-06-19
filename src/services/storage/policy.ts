/**
 * AURA-105 — storage policy/service contract for property media.
 *
 * A server-safe, dependency-clean surface for the storage layer. It re-exports the pure media
 * contract from the domain module and declares the storage-layer posture that the AURA-105
 * migration applies (bucket config + storage.objects policy names). Consumed later by the
 * upload route + storage operations (AURA-304) and the public read paths (AURA-202/203).
 *
 * NO React, NO UI. NO service-role import — the service-role vs. request-scoped-admin-client
 * choice is an AURA-304 route concern, made AFTER requireAdmin(). NO Supabase import either:
 * this module only describes the contract, it performs no I/O.
 */

import {
  ALLOWED_MEDIA_MIME_TYPES,
  buildMediaStoragePath,
  MAX_MEDIA_BYTES,
  MEDIA_BUCKET,
  type MediaPathInput,
} from '@/domain/properties/media'

// Re-export the bucket + path contract so storage consumers import from one place.
export { ALLOWED_MEDIA_MIME_TYPES, buildMediaStoragePath, MAX_MEDIA_BYTES, MEDIA_BUCKET }
export type { MediaPathInput }

/**
 * Declarative description of the `property-media` bucket as configured by the AURA-105
 * migration. Single source of truth for tests and any future bucket reconciliation.
 */
export const MEDIA_BUCKET_CONFIG = {
  id: MEDIA_BUCKET,
  public: true,
  fileSizeLimit: MAX_MEDIA_BYTES,
  allowedMimeTypes: ALLOWED_MEDIA_MIME_TYPES,
} as const

/**
 * Canonical names of the storage.objects RLS policies created by the AURA-105 migration —
 * admin-only (public.is_admin()) write/list, scoped to the bucket. There is intentionally NO
 * anon policy: no public list/enumeration; public read is served by the bucket `public` flag.
 */
export const MEDIA_OBJECT_POLICIES = {
  select: 'property_media_objects_admin_select',
  insert: 'property_media_objects_admin_insert',
  update: 'property_media_objects_admin_update',
  delete: 'property_media_objects_admin_delete',
} as const
