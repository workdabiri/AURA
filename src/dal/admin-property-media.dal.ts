import 'server-only'

import {
  buildMediaStoragePath,
  toAdminMediaDTO,
  type AdminMediaDTO,
  type AdminMediaRow,
  type MediaType,
} from '@/domain/properties/media'
import {
  propertyMediaPublicUrl,
  removePropertyMediaObjects,
  uploadPropertyMediaObject,
} from '@/services/storage/property-media'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * AURA-304 — ADMIN property-media reads + writes (server-only).
 *
 * `server-only`: reached from the admin media Route Handlers / the edit Server Component, never
 * the client. SEPARATE from the public `properties.dal.ts` (which stays anon-only and provably
 * free of `storage_path`): this file legitimately manages the full media lifecycle under the
 * admin's own session.
 *
 * SECURITY POSTURE (owner-locked, AURA-304):
 *   - All reads/writes (DB + Storage) use the ANON server client under the CALLER'S OWN admin
 *     session — NEVER the service role. The `property_media_admin_*` + `storage.objects` admin
 *     RLS policies (AURA-103 / AURA-105, gated on `public.is_admin()`) are the boundary; the
 *     route's `requireAdmin()` runs first.
 *   - Object keys are the server-built UUID path only (no user filename/extension).
 *   - `storage_path` is never projected into the DTO (no public enumeration).
 *   - Mutations are rejected on archived properties (lifecycle backstop — D-32).
 *   - Single-cover invariant: setting one cover unsets every other cover for the property; only
 *     an image may be a cover (a floorplan never can).
 */

class AdminMediaDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminMediaDalError'
  }
}

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

/** Admin DTO columns — kept in sync with `AdminMediaRow`. NEVER `storage_path`, NEVER `*`. */
const ADMIN_MEDIA_COLUMNS =
  'id, property_id, url, media_type, order_index, is_cover, alt_text, width, height, size_bytes, created_at'

/** Read a property's publish status (or null when it does not exist). */
async function loadPropertyStatus(
  supabase: ServerClient,
  propertyId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('publish_status')
    .eq('id', propertyId)
    .maybeSingle()

  if (error) {
    throw new AdminMediaDalError(`Failed to read property status: ${error.message}`)
  }
  return data ? (data as { publish_status: string }).publish_status : null
}

/** Minimal target-media projection for ownership + lifecycle checks. */
interface MediaTargetRow {
  id: string
  property_id: string
  media_type: MediaType
  storage_path: string
}

async function loadMediaTarget(
  supabase: ServerClient,
  mediaId: string
): Promise<MediaTargetRow | null> {
  const { data, error } = await supabase
    .from('property_media')
    .select('id, property_id, media_type, storage_path')
    .eq('id', mediaId)
    .maybeSingle()

  if (error) {
    throw new AdminMediaDalError(`Failed to read media: ${error.message}`)
  }
  return (data as MediaTargetRow | null) ?? null
}

/** Next append-only `order_index` for a property: highest existing + 1, or 0 when none. */
async function nextOrderIndex(supabase: ServerClient, propertyId: string): Promise<number> {
  const { data, error } = await supabase
    .from('property_media')
    .select('order_index')
    .eq('property_id', propertyId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new AdminMediaDalError(`Failed to read media order: ${error.message}`)
  }
  return data ? (data as { order_index: number }).order_index + 1 : 0
}

/** Unset `is_cover` on every media row for the property EXCEPT `keepId` (single-cover rule). */
async function unsetOtherCovers(
  supabase: ServerClient,
  propertyId: string,
  keepId: string
): Promise<void> {
  const { error } = await supabase
    .from('property_media')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
    .eq('is_cover', true)
    .neq('id', keepId)

  if (error) {
    throw new AdminMediaDalError(`Failed to reset other covers: ${error.message}`)
  }
}

/** List a property's media for the admin edit page (cover first, then append order). */
export async function listAdminPropertyMedia(propertyId: string): Promise<AdminMediaDTO[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('property_media')
    .select(ADMIN_MEDIA_COLUMNS)
    .eq('property_id', propertyId)
    .order('is_cover', { ascending: false })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new AdminMediaDalError(`Failed to list property media: ${error.message}`)
  }
  return ((data ?? []) as unknown as AdminMediaRow[]).map(toAdminMediaDTO)
}

interface CreateMediaInput {
  propertyId: string
  mediaType: MediaType
  /** Validated upload MIME (drives the extension + storage content-type). */
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  altText: string
  isCover: boolean
  sizeBytes: number
  body: ArrayBuffer
}

type CreateMediaResult =
  | { ok: true; media: AdminMediaDTO }
  | { ok: false; reason: 'not_found' | 'archived' }

/**
 * Upload + register one media object: mint a UUID, build the UUID storage path, upload the
 * object, then insert the `property_media` row. If the insert fails AFTER a successful upload,
 * the orphaned object is removed best-effort; if THAT also fails, the error is loud (no leak).
 * `is_cover` is applied with the single-cover rule.
 */
export async function createPropertyMedia(input: CreateMediaInput): Promise<CreateMediaResult> {
  const supabase = await createSupabaseServerClient()

  const status = await loadPropertyStatus(supabase, input.propertyId)
  if (status === null) return { ok: false, reason: 'not_found' }
  if (status === 'archived') return { ok: false, reason: 'archived' }

  const mediaId = crypto.randomUUID()
  const storagePath = buildMediaStoragePath({
    propertyId: input.propertyId,
    mediaId,
    mediaType: input.mediaType,
    mimeType: input.mimeType,
  })
  const orderIndex = await nextOrderIndex(supabase, input.propertyId)

  const upload = await uploadPropertyMediaObject(supabase, {
    path: storagePath,
    body: input.body,
    contentType: input.mimeType,
  })
  if (!upload.ok) {
    throw new AdminMediaDalError(`Failed to upload media object: ${upload.error ?? 'unknown'}`)
  }

  const url = propertyMediaPublicUrl(supabase, storagePath)

  const { data, error } = await supabase
    .from('property_media')
    .insert({
      id: mediaId,
      property_id: input.propertyId,
      url,
      storage_path: storagePath,
      media_type: input.mediaType,
      order_index: orderIndex,
      is_cover: input.isCover,
      alt_text: input.altText,
      size_bytes: input.sizeBytes,
    })
    .select(ADMIN_MEDIA_COLUMNS)
    .single()

  if (error || !data) {
    // Roll back the just-uploaded object so a failed insert never leaves an orphan.
    const cleanup = await removePropertyMediaObjects(supabase, [storagePath])
    if (!cleanup.ok) {
      throw new AdminMediaDalError(
        `Media insert failed AND object cleanup failed: ${error?.message ?? 'unknown'}`
      )
    }
    throw new AdminMediaDalError(`Failed to insert media row: ${error?.message ?? 'unknown'}`)
  }

  if (input.isCover) {
    await unsetOtherCovers(supabase, input.propertyId, mediaId)
  }

  return { ok: true, media: toAdminMediaDTO(data as unknown as AdminMediaRow) }
}

interface UpdateMediaInput {
  propertyId: string
  mediaId: string
  altText?: string
  isCover?: boolean
}

type UpdateMediaResult =
  | { ok: true; media: AdminMediaDTO }
  | { ok: false; reason: 'not_found' | 'archived' | 'not_cover_eligible' }

/**
 * Edit a media item's `alt_text` and/or `is_cover`. Enforces belongs-to-property, archived
 * rejection, the only-an-image-can-be-cover rule, and the single-cover invariant. Unsetting a
 * cover (`is_cover=false`) is allowed and may leave the property without a cover (the publish
 * checklist blocks publishing until a cover with alt text exists again).
 */
export async function updatePropertyMedia(input: UpdateMediaInput): Promise<UpdateMediaResult> {
  const supabase = await createSupabaseServerClient()

  const target = await loadMediaTarget(supabase, input.mediaId)
  if (!target || target.property_id !== input.propertyId) {
    return { ok: false, reason: 'not_found' }
  }

  const status = await loadPropertyStatus(supabase, input.propertyId)
  if (status === null) return { ok: false, reason: 'not_found' }
  if (status === 'archived') return { ok: false, reason: 'archived' }

  if (input.isCover === true && target.media_type !== 'image') {
    return { ok: false, reason: 'not_cover_eligible' }
  }

  if (input.isCover === true) {
    await unsetOtherCovers(supabase, input.propertyId, input.mediaId)
  }

  const patch: Record<string, unknown> = {}
  if (input.altText !== undefined) patch.alt_text = input.altText
  if (input.isCover !== undefined) patch.is_cover = input.isCover

  const { data, error } = await supabase
    .from('property_media')
    .update(patch)
    .eq('id', input.mediaId)
    .eq('property_id', input.propertyId)
    .select(ADMIN_MEDIA_COLUMNS)
    .single()

  if (error || !data) {
    throw new AdminMediaDalError(`Failed to update media row: ${error?.message ?? 'unknown'}`)
  }

  return { ok: true, media: toAdminMediaDTO(data as unknown as AdminMediaRow) }
}

type DeleteMediaResult = { ok: true } | { ok: false; reason: 'not_found' | 'archived' }

/**
 * Remove a media item: delete the DB row FIRST (revokes public visibility immediately), then the
 * storage object. These cannot be made atomic across two systems; on object-removal failure the
 * error is loud (a harmless orphaned object remains, but the row — the only public-visibility
 * surface — is already gone). If the deleted item was the cover, no replacement is auto-picked
 * (the property is left without a cover — owner decision; publish is then blocked).
 */
export async function deletePropertyMedia(
  propertyId: string,
  mediaId: string
): Promise<DeleteMediaResult> {
  const supabase = await createSupabaseServerClient()

  const target = await loadMediaTarget(supabase, mediaId)
  if (!target || target.property_id !== propertyId) {
    return { ok: false, reason: 'not_found' }
  }

  const status = await loadPropertyStatus(supabase, propertyId)
  if (status === null) return { ok: false, reason: 'not_found' }
  if (status === 'archived') return { ok: false, reason: 'archived' }

  const { error } = await supabase
    .from('property_media')
    .delete()
    .eq('id', mediaId)
    .eq('property_id', propertyId)

  if (error) {
    throw new AdminMediaDalError(`Failed to delete media row: ${error.message}`)
  }

  const removal = await removePropertyMediaObjects(supabase, [target.storage_path])
  if (!removal.ok) {
    throw new AdminMediaDalError(
      `Media row deleted but object removal failed: ${removal.error ?? 'unknown'}`
    )
  }

  return { ok: true }
}
