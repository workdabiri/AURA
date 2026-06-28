import { NextResponse } from 'next/server'
import { z } from 'zod'

import { updateAdminProperty } from '@/dal/admin-properties.dal'
import { propertyUpdateSchema } from '@/domain/properties/admin'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from '../_helpers'

/**
 * AURA-303 — `PATCH /api/admin/properties/[id]` (admin-only).
 *
 * Updates editable fields and, when `{ publish: true }` on a DRAFT, enforces the publish
 * checklist before transitioning draft → published. Slug/reference/publish_status are never
 * writable here (A-06 / D-32 enforced in the domain + DAL). There is NO published → draft
 * (unpublish) path. Audit: `property_updated` always; `property_published` on transition (D-38).
 */
export const dynamic = 'force-dynamic'

/** The `[id]` segment must be a UUID. */
const idSchema = z.string().uuid()

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withAdmin(async (ctx) => {
    const { id: rawId } = await context.params
    const idResult = idSchema.safeParse(rawId)
    if (!idResult.success) {
      return errorResponse('Property not found', 404, 'NOT_FOUND')
    }
    const id = idResult.data

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'INVALID_JSON')
    }

    const parsed = propertyUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Invalid property data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const result = await updateAdminProperty(id, parsed.data, {
      userId: ctx.userId,
      role: ctx.role,
    })

    if (!result.ok) {
      if (result.reason === 'not_found')
        return errorResponse('Property not found', 404, 'NOT_FOUND')
      if (result.reason === 'archived') {
        return errorResponse('Archived properties cannot be edited', 409, 'ARCHIVED')
      }
      // checklist
      return errorResponse('Publish checklist not satisfied', 400, 'PUBLISH_CHECKLIST', {
        failures: result.failures,
      })
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'property_updated',
      entityType: 'property',
      entityId: id,
      afterSnapshot: { publish_status: result.status },
    })

    if (result.published) {
      await writeAuditLog({
        actorUserId: ctx.userId,
        actorRole: ctx.role,
        action: 'property_published',
        entityType: 'property',
        entityId: id,
        afterSnapshot: { publish_status: 'published' },
      })
    }

    return NextResponse.json({ data: { status: result.status, published: result.published } })
  })
}
