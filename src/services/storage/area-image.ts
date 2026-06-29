import 'server-only'

import type { createSupabaseServerClient } from '@/lib/supabase/server'

import { AREA_IMAGE_BUCKET } from '@/domain/areas/admin'

/**
 * AURA-305 — area representative-image storage operations (server-only).
 *
 * Thin, request-scoped wrappers over Supabase Storage for the ONE representative image per area.
 * The image lives in the SAME `property-media` bucket as property media (AURA-105) under an
 * `areas/{area_id}/{image_id}.{ext}` prefix — feasible WITHOUT a migration because the AURA-105
 * `storage.objects` admin policies are scoped to `bucket_id = 'property-media' AND is_admin()`
 * with NO path restriction, so an authenticated admin may write any prefix in that bucket, and
 * public read is served by the bucket's `public = true` flag.
 *
 * SECURITY POSTURE (owner-locked, AURA-305):
 *   - NO service role — area-image writes use the caller's own session + RLS (the AURA-105
 *     admin-only `storage.objects` policies are the enforcement boundary), never the privileged
 *     RLS-bypassing client (which stays reserved for the audit path).
 *   - NO signed URLs / CDN revocation (bucket is public-read by design — AURA-105).
 *   - Object keys are ALWAYS the server-built UUID path from `buildAreaImagePath` — a caller can
 *     never supply a raw path, filename, or extension (no traversal / enumeration).
 *   - One image per area: no gallery, no multi-upload, no image processing/resizing/transcoding.
 */

/** Request-scoped authenticated admin client (anon key + the caller's session cookies). */
type AdminStorageClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

interface StorageOpResult {
  ok: boolean
  error?: string
}

/**
 * Upload one area image to the bucket. `upsert: false` so a (UUID) key collision is a hard
 * failure rather than a silent overwrite. The MIME type is the validated upload MIME.
 */
export async function uploadAreaImageObject(
  supabase: AdminStorageClient,
  args: { path: string; body: ArrayBuffer; contentType: string }
): Promise<StorageOpResult> {
  const { error } = await supabase.storage.from(AREA_IMAGE_BUCKET).upload(args.path, args.body, {
    contentType: args.contentType,
    upsert: false,
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Public URL for a stored area image (the bucket is public-read — no signed URL). */
export function areaImagePublicUrl(supabase: AdminStorageClient, path: string): string {
  return supabase.storage.from(AREA_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Remove one or more objects from the bucket (best-effort old-image cleanup + upload rollback). */
export async function removeAreaImageObjects(
  supabase: AdminStorageClient,
  paths: string[]
): Promise<StorageOpResult> {
  const { error } = await supabase.storage.from(AREA_IMAGE_BUCKET).remove(paths)
  return error ? { ok: false, error: error.message } : { ok: true }
}

/**
 * Best-effort: derive the bucket-relative storage path from a public image URL we previously
 * built, so an old object can be cleaned up when the image is replaced. Returns null when the URL
 * does not clearly belong to OUR bucket under the `areas/` prefix — in which case the caller must
 * NOT attempt deletion (owner rule: never attempt risky deletion when only a URL is stored).
 *
 * KNOWN LIMITATION (documented, non-blocking): `areas.image_url` stores only the public URL, not
 * the storage path. This parse is intentionally conservative — anything it cannot confidently
 * resolve to `areas/{uuid}/{uuid}.{ext}` in this bucket is skipped (no deletion attempted).
 */
const AREA_IMAGE_PATH_RE = /^areas\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i

export function areaImagePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null
  const marker = `/object/public/${AREA_IMAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const path = url.slice(idx + marker.length).split('?')[0] ?? ''
  return AREA_IMAGE_PATH_RE.test(path) ? path : null
}
