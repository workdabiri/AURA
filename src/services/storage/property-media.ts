import 'server-only'

import type { createSupabaseServerClient } from '@/lib/supabase/server'

import { MEDIA_BUCKET } from './policy'

/**
 * AURA-304 — property-media storage operations (server-only).
 *
 * Thin, request-scoped wrappers over Supabase Storage for the `property-media` bucket. Every
 * call runs on the AUTHENTICATED ADMIN client passed in by the DAL (resolved AFTER
 * `requireAdmin()`), so the AURA-105 admin-only `storage.objects` RLS policies are the
 * enforcement boundary.
 *
 * SECURITY POSTURE (owner-locked, AURA-304):
 *   - NO service role — media writes use the caller's own session + RLS, never the privileged
 *     RLS-bypassing client (which stays reserved for the audit path).
 *   - NO signed URLs / CDN revocation (bucket is public-read by design — AURA-105). Read URLs
 *     are plain public URLs.
 *   - Object keys are ALWAYS the server-built UUID path from `buildMediaStoragePath` — a caller
 *     can never supply a raw path, filename, or extension (no traversal / enumeration).
 */

/** Request-scoped authenticated admin client (anon key + the caller's session cookies). */
type AdminStorageClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

interface StorageOpResult {
  ok: boolean
  error?: string
}

/**
 * Upload one object to the `property-media` bucket. `upsert: false` so a (UUID) key collision is
 * a hard failure rather than a silent overwrite. The MIME type is the validated upload MIME.
 */
export async function uploadPropertyMediaObject(
  supabase: AdminStorageClient,
  args: { path: string; body: ArrayBuffer; contentType: string }
): Promise<StorageOpResult> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(args.path, args.body, {
    contentType: args.contentType,
    upsert: false,
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Public URL for a stored object (the bucket is public-read — no signed URL). */
export function propertyMediaPublicUrl(supabase: AdminStorageClient, path: string): string {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Remove one or more objects from the bucket (used by delete + best-effort upload rollback). */
export async function removePropertyMediaObjects(
  supabase: AdminStorageClient,
  paths: string[]
): Promise<StorageOpResult> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths)
  return error ? { ok: false, error: error.message } : { ok: true }
}
