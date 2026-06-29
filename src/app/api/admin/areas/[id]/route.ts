import { NextResponse } from 'next/server'
import { z } from 'zod'

import { updateAdminArea } from '@/dal/admin-areas.dal'
import { areaUpdateSchema } from '@/domain/areas/admin'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import {
  errorResponse,
  parseFormBool,
  parseFormInt,
  parseFormString,
  validateOptionalAreaImage,
  withAdmin,
} from '../_helpers'

/**
 * AURA-305 — `PATCH /api/admin/areas/[id]` (admin-only).
 *
 * Edits an area's fields, replaces its representative image, and/or toggles `is_active`
 * (deactivate / reactivate). Multipart (optional image file). Runs `requireAdmin()` FIRST.
 *
 * Slug is NEVER writable here — `areaUpdateSchema` has no slug field and the DAL strips it
 * (immutable after create, owner-locked). NO hard delete (deactivate = `is_active = false`).
 * Audit: `area_updated` always; deactivate/reactivate carry metadata indicating the change.
 *
 * `force-dynamic`: per-request, session-scoped admin mutation — never statically cached.
 */
export const dynamic = 'force-dynamic'

/** The `[id]` segment must be a UUID. */
const idSchema = z.string().uuid()

/** Transport-level shape of the multipart update form (business grammar enforced by domain). */
const updateFormSchema = z.object({
  name_en: z.string().optional(),
  description_en: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withAdmin(async (ctx) => {
    const { id: rawId } = await context.params
    const idResult = idSchema.safeParse(rawId)
    if (!idResult.success) {
      return errorResponse('Area not found', 404, 'NOT_FOUND')
    }
    const id = idResult.data

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return errorResponse('Invalid form submission', 400, 'INVALID_FORM')
    }

    const transport = updateFormSchema.safeParse({
      name_en: parseFormString(form.get('name_en')),
      description_en: parseFormString(form.get('description_en')),
      sort_order: parseFormInt(form.get('sort_order')),
      is_active: parseFormBool(form.get('is_active')),
    })
    if (!transport.success) {
      return errorResponse('Invalid area data', 400, 'VALIDATION_ERROR', {
        issues: transport.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const t = transport.data
    // Only forward fields that were actually present, so a partial PATCH (e.g. a lone is_active
    // toggle) never blanks the others. Slug is intentionally never read here.
    const candidate: Record<string, unknown> = {}
    if (t.name_en !== undefined) candidate.name = { en: t.name_en }
    if (t.description_en !== undefined) candidate.description = { en: t.description_en }
    if (t.sort_order !== undefined) candidate.sort_order = t.sort_order
    if (t.is_active !== undefined) candidate.is_active = t.is_active

    const parsed = areaUpdateSchema.safeParse(candidate)
    if (!parsed.success) {
      return errorResponse('Invalid area data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const imageResult = await validateOptionalAreaImage(form.get('file'))
    if (!imageResult.ok) return imageResult.response

    const result = await updateAdminArea(id, parsed.data, imageResult.image)
    if (!result.ok) {
      return errorResponse('Area not found', 404, 'NOT_FOUND')
    }

    // Deactivate/reactivate is recorded as area_updated with metadata indicating the change.
    const activeChanged =
      parsed.data.is_active !== undefined && parsed.data.is_active !== result.previousActive
    const metadata = activeChanged
      ? { active_change: result.area.isActive ? 'reactivated' : 'deactivated' }
      : {}

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'area_updated',
      entityType: 'area',
      entityId: id,
      afterSnapshot: {
        is_active: result.area.isActive,
        sort_order: result.area.sortOrder,
        image_replaced: imageResult.image !== undefined,
      },
      metadata,
    })

    return NextResponse.json({ data: result.area })
  })
}
