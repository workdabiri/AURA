import 'server-only'

import {
  buildAreaImagePath,
  buildAreaUpdatePayload,
  type AreaCreateInput,
  type AreaImageMimeType,
  type AreaUpdateInput,
} from '@/domain/areas/admin'
import {
  toAdminAreaDetail,
  toAdminAreaListItem,
  type AdminAreaDetailDTO,
  type AdminAreaListItemDTO,
  type AdminAreaRow,
  type AreaPropertyCounts,
} from '@/domain/areas/admin-view'
import {
  areaImagePathFromPublicUrl,
  areaImagePublicUrl,
  removeAreaImageObjects,
  uploadAreaImageObject,
} from '@/services/storage/area-image'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * AURA-305 — ADMIN area reads + writes (server-only).
 *
 * `server-only`: reached from the admin Route Handlers / Server Components, never the client.
 * SEPARATE from the public `areas.dal.ts` (which stays anon-only / active-only and provably free
 * of internal columns): this file legitimately reads ALL areas (active + inactive) + admin-only
 * property counts, and performs create/update + image upload under the admin's own session.
 *
 * SECURITY POSTURE (owner-locked, AURA-305):
 *   - All reads/writes (DB + Storage) use the ANON server client under the CALLER'S OWN admin
 *     session — NEVER the service role. The `areas_admin_*` (AURA-103) + `storage.objects` admin
 *     (AURA-105) RLS policies, gated on `public.is_admin()`, are the boundary; the route's
 *     `requireAdmin()` runs first. The only service-role path in AURA-305 is the audit writer.
 *   - NO row deletion — deactivation is `is_active = false`, never a hard delete (no DELETE policy
 *     exists on `areas`). Reactivation is `is_active = true`.
 *   - Explicit column allowlists — never `select('*')`. Slug is set only at create; updates strip
 *     it (immutability backstop in `buildAreaUpdatePayload`).
 *   - The area image is server-built UUID path only; the public URL is stored in `areas.image_url`
 *     (no separate area-media table, no gallery).
 */

class AdminAreasDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminAreasDalError'
  }
}

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

/** Admin area columns (mirrors `AdminAreaRow`). NEVER `*`. */
const ADMIN_AREA_COLUMNS =
  'id, slug, name, description, image_url, is_active, sort_order, created_at, updated_at'

type SupabaseError = { code?: string; message?: string } | null

/** Postgres unique-violation (slug already in use). */
function isUniqueViolation(error: SupabaseError): boolean {
  return error?.code === '23505'
}

/**
 * Compute per-area property counts from a single `properties` read (admin RLS returns ALL rows).
 * `area_id, publish_status` only — never `*`. Aggregated in memory (no N+1, no per-area query).
 */
async function fetchAreaPropertyCounts(
  supabase: ServerClient
): Promise<Map<string, AreaPropertyCounts>> {
  const { data, error } = await supabase
    .from('properties')
    .select('area_id, publish_status')
    .not('area_id', 'is', null)

  if (error) {
    throw new AdminAreasDalError(`Failed to read property counts: ${error.message}`)
  }

  const counts = new Map<string, AreaPropertyCounts>()
  for (const row of (data ?? []) as { area_id: string | null; publish_status: string }[]) {
    if (!row.area_id) continue
    const current = counts.get(row.area_id) ?? { totalProperties: 0, publishedProperties: 0 }
    current.totalProperties += 1
    if (row.publish_status === 'published') current.publishedProperties += 1
    counts.set(row.area_id, current)
  }
  return counts
}

/**
 * List ALL areas for the admin table (active + inactive) with admin-only property counts. Ordered
 * by `sort_order ASC`, then `slug ASC` (matching the public surface's display order). Admin RLS
 * returns every row; anon never reaches this path.
 */
export async function listAdminAreas(): Promise<AdminAreaListItemDTO[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('areas')
    .select(ADMIN_AREA_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('slug', { ascending: true })

  if (error) {
    throw new AdminAreasDalError(`Failed to list admin areas: ${error.message}`)
  }

  const counts = await fetchAreaPropertyCounts(supabase)
  const rows = (data ?? []) as unknown as AdminAreaRow[]
  return rows.map((row) =>
    toAdminAreaListItem(row, counts.get(row.id) ?? { totalProperties: 0, publishedProperties: 0 })
  )
}

/** Load a single area (any active state) for the admin edit form, or null when not found. */
export async function getAdminAreaById(id: string): Promise<AdminAreaDetailDTO | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('areas')
    .select(ADMIN_AREA_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new AdminAreasDalError(`Failed to load admin area: ${error.message}`)
  }
  if (!data) return null

  return toAdminAreaDetail(data as unknown as AdminAreaRow)
}

/** An optional representative image to upload alongside a create/update. */
interface AreaImageUpload {
  mimeType: AreaImageMimeType
  body: ArrayBuffer
}

type CreateAreaResult =
  | { ok: true; area: AdminAreaDetailDTO }
  | { ok: false; reason: 'slug_conflict' }

/**
 * Create an area. Mints the area UUID up front so the (optional) image can be uploaded to its
 * UUID path BEFORE the row insert — if the insert then fails the orphaned object is removed
 * best-effort. A duplicate slug (23505) is a clean `slug_conflict` (route → 409), not a 500.
 */
export async function createAdminArea(
  input: AreaCreateInput,
  image?: AreaImageUpload
): Promise<CreateAreaResult> {
  const supabase = await createSupabaseServerClient()

  const areaId = crypto.randomUUID()
  let imageUrl: string | null = null
  let uploadedPath: string | null = null

  if (image) {
    const path = buildAreaImagePath({
      areaId,
      imageId: crypto.randomUUID(),
      mimeType: image.mimeType,
    })
    const upload = await uploadAreaImageObject(supabase, {
      path,
      body: image.body,
      contentType: image.mimeType,
    })
    if (!upload.ok) {
      throw new AdminAreasDalError(`Failed to upload area image: ${upload.error ?? 'unknown'}`)
    }
    uploadedPath = path
    imageUrl = areaImagePublicUrl(supabase, path)
  }

  const { data, error } = await supabase
    .from('areas')
    .insert({
      id: areaId,
      slug: input.slug,
      name: input.name,
      description: input.description ?? {},
      image_url: imageUrl,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select(ADMIN_AREA_COLUMNS)
    .single()

  if (error || !data) {
    // Roll back a just-uploaded object so a failed insert never leaves an orphan.
    if (uploadedPath) await removeAreaImageObjects(supabase, [uploadedPath])
    if (isUniqueViolation(error)) return { ok: false, reason: 'slug_conflict' }
    throw new AdminAreasDalError(`Failed to create area: ${error?.message ?? 'unknown error'}`)
  }

  return { ok: true, area: toAdminAreaDetail(data as unknown as AdminAreaRow) }
}

type UpdateAreaResult =
  | { ok: true; area: AdminAreaDetailDTO; previousActive: boolean }
  | { ok: false; reason: 'not_found' }

/**
 * Update an area's editable fields and/or replace its image and/or toggle `is_active`
 * (deactivate/reactivate). Slug is NEVER writable here (immutability backstop). When a new image
 * is provided it is uploaded to a fresh UUID path, `image_url` is repointed, and the OLD object is
 * removed best-effort (skipped silently if the stored URL cannot be safely resolved to our bucket
 * path — owner rule: never attempt risky deletion; documented non-blocking limitation).
 */
export async function updateAdminArea(
  id: string,
  patch: AreaUpdateInput,
  image?: AreaImageUpload
): Promise<UpdateAreaResult> {
  const supabase = await createSupabaseServerClient()

  const current = await getAdminAreaById(id)
  if (!current) return { ok: false, reason: 'not_found' }

  const payload = buildAreaUpdatePayload(patch)

  let newPath: string | null = null
  if (image) {
    newPath = buildAreaImagePath({
      areaId: id,
      imageId: crypto.randomUUID(),
      mimeType: image.mimeType,
    })
    const upload = await uploadAreaImageObject(supabase, {
      path: newPath,
      body: image.body,
      contentType: image.mimeType,
    })
    if (!upload.ok) {
      throw new AdminAreasDalError(`Failed to upload area image: ${upload.error ?? 'unknown'}`)
    }
    payload.image_url = areaImagePublicUrl(supabase, newPath)
  }

  const { data, error } = await supabase
    .from('areas')
    .update(payload)
    .eq('id', id)
    .select(ADMIN_AREA_COLUMNS)
    .single()

  if (error || !data) {
    // If we uploaded a new object but the row update failed, remove the orphan.
    if (newPath) await removeAreaImageObjects(supabase, [newPath])
    throw new AdminAreasDalError(`Failed to update area: ${error?.message ?? 'unknown error'}`)
  }

  // Best-effort: remove the previous image only when its URL safely resolves to our bucket path.
  if (newPath) {
    const oldPath = areaImagePathFromPublicUrl(current.imageUrl)
    if (oldPath && oldPath !== newPath) await removeAreaImageObjects(supabase, [oldPath])
  }

  return {
    ok: true,
    area: toAdminAreaDetail(data as unknown as AdminAreaRow),
    previousActive: current.isActive,
  }
}
