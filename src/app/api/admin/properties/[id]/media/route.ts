import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createPropertyMedia } from '@/dal/admin-property-media.dal'
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_BYTES,
  mediaCreateFieldsSchema,
  type MediaMimeType,
} from '@/domain/properties/media'

import { errorResponse, withAdmin } from '../../_helpers'

/**
 * AURA-304 — `POST /api/admin/properties/[id]/media` (admin-only).
 *
 * Single-file multipart upload. Runs `requireAdmin()` FIRST (via `withAdmin`; the protected
 * layout guards pages, not Route Handlers). Validates the file MIME + size against the AURA-105
 * contract and the non-file fields with Zod, then delegates upload + insert to the DAL, which
 * uses the admin's own session + RLS (NO service role) and a UUID-only storage path. Errors are
 * generic; no DB/storage detail leaks.
 *
 * `force-dynamic`: per-request, session-scoped admin mutation — never statically cached.
 */
export const dynamic = 'force-dynamic'

/** The `[id]` segment must be a UUID. */
const idSchema = z.string().uuid()

/** Parse a multipart boolean-ish field; absent → undefined (schema default applies). */
function parseFormBool(value: FormDataEntryValue | null): boolean | undefined {
  if (value == null) return undefined
  const s = String(value).trim().toLowerCase()
  return s === 'true' || s === 'on' || s === '1'
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withAdmin(async () => {
    const { id: rawId } = await context.params
    const idResult = idSchema.safeParse(rawId)
    if (!idResult.success) {
      return errorResponse('Property not found', 404, 'NOT_FOUND')
    }
    const propertyId = idResult.data

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return errorResponse('Invalid form submission', 400, 'INVALID_FORM')
    }

    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse('A media file is required', 400, 'VALIDATION_ERROR')
    }

    // File MIME + size are validated against the AURA-105 contract (the client-declared MIME is
    // also re-enforced by the bucket's allowed_mime_types as defence in depth).
    const mimeType = file.type
    if (!(ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return errorResponse('Unsupported file type', 400, 'UNSUPPORTED_TYPE')
    }
    if (file.size > MAX_MEDIA_BYTES) {
      return errorResponse('File exceeds the 10MB limit', 400, 'FILE_TOO_LARGE')
    }

    const fields = mediaCreateFieldsSchema.safeParse({
      media_type: form.get('media_type'),
      alt_text: form.get('alt_text'),
      is_cover: parseFormBool(form.get('is_cover')),
    })
    if (!fields.success) {
      return errorResponse('Invalid media data', 400, 'VALIDATION_ERROR', {
        issues: fields.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const body = await file.arrayBuffer()
    const result = await createPropertyMedia({
      propertyId,
      mediaType: fields.data.media_type,
      mimeType: mimeType as MediaMimeType,
      altText: fields.data.alt_text,
      isCover: fields.data.is_cover,
      sizeBytes: file.size,
      body,
    })

    if (!result.ok) {
      if (result.reason === 'not_found') {
        return errorResponse('Property not found', 404, 'NOT_FOUND')
      }
      return errorResponse('Archived properties cannot be edited', 409, 'ARCHIVED')
    }

    return NextResponse.json({ data: result.media }, { status: 201 })
  })
}
