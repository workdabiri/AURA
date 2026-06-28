import { NextResponse } from 'next/server'
import { z } from 'zod'

import { deletePropertyMedia, updatePropertyMedia } from '@/dal/admin-property-media.dal'
import { mediaPatchSchema } from '@/domain/properties/media'

import { errorResponse, withAdmin } from '../../../_helpers'

/**
 * AURA-304 — `PATCH` / `DELETE /api/admin/properties/[id]/media/[mediaId]` (admin-only).
 *
 * Both verbs run `requireAdmin()` FIRST (via `withAdmin`), validate both path params as UUIDs,
 * and delegate to the DAL (admin session + RLS; NO service role). PATCH edits `alt_text` and/or
 * `is_cover` (single-cover rule; only an image may be a cover). DELETE removes the DB row AND the
 * storage object. Errors are generic; no DB/storage detail leaks. There is NO reorder path
 * (out of scope, AURA-304).
 *
 * `force-dynamic`: per-request, session-scoped admin mutation — never statically cached.
 */
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

/** Validate both UUID path params; returns the pair or null when either is malformed. */
async function parseParams(context: {
  params: Promise<{ id: string; mediaId: string }>
}): Promise<{ propertyId: string; mediaId: string } | null> {
  const { id, mediaId } = await context.params
  const idResult = idSchema.safeParse(id)
  const mediaResult = idSchema.safeParse(mediaId)
  if (!idResult.success || !mediaResult.success) return null
  return { propertyId: idResult.data, mediaId: mediaResult.data }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; mediaId: string }> }
): Promise<NextResponse> {
  return withAdmin(async () => {
    const params = await parseParams(context)
    if (!params) return errorResponse('Media not found', 404, 'NOT_FOUND')

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'INVALID_JSON')
    }

    const parsed = mediaPatchSchema.safeParse(payload)
    if (!parsed.success) {
      return errorResponse('Invalid media data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const result = await updatePropertyMedia({
      propertyId: params.propertyId,
      mediaId: params.mediaId,
      altText: parsed.data.alt_text,
      isCover: parsed.data.is_cover,
    })

    if (!result.ok) {
      if (result.reason === 'not_found') return errorResponse('Media not found', 404, 'NOT_FOUND')
      if (result.reason === 'archived') {
        return errorResponse('Archived properties cannot be edited', 409, 'ARCHIVED')
      }
      // not_cover_eligible — a floorplan cannot be a cover.
      return errorResponse('Only an image can be set as the cover', 400, 'NOT_COVER_ELIGIBLE')
    }

    return NextResponse.json({ data: result.media })
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; mediaId: string }> }
): Promise<NextResponse> {
  return withAdmin(async () => {
    const params = await parseParams(context)
    if (!params) return errorResponse('Media not found', 404, 'NOT_FOUND')

    const result = await deletePropertyMedia(params.propertyId, params.mediaId)

    if (!result.ok) {
      if (result.reason === 'not_found') return errorResponse('Media not found', 404, 'NOT_FOUND')
      return errorResponse('Archived properties cannot be edited', 409, 'ARCHIVED')
    }

    return NextResponse.json({ data: { deleted: true } })
  })
}
