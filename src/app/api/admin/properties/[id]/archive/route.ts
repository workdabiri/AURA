import { NextResponse } from 'next/server'
import { z } from 'zod'

import { archiveAdminProperty } from '@/dal/admin-properties.dal'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from '../../_helpers'

/**
 * AURA-303 — `PATCH /api/admin/properties/[id]/archive` (admin-only).
 *
 * Archives a property (`publish_status = archived`, `archived_at = now`) — the MVP way to
 * remove a listing from public view (D-32). NEVER a hard delete (no DELETE endpoint, no DELETE
 * RLS policy). Allowed only from draft/published. Audit: `property_archived` (D-38).
 */
export const dynamic = 'force-dynamic'

/** The `[id]` segment must be a UUID. */
const idSchema = z.string().uuid()

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withAdmin(async (ctx) => {
    const { id: rawId } = await context.params
    const idResult = idSchema.safeParse(rawId)
    if (!idResult.success) {
      return errorResponse('Property not found', 404, 'NOT_FOUND')
    }
    const id = idResult.data

    const result = await archiveAdminProperty(id, { userId: ctx.userId, role: ctx.role })
    if (!result.ok) {
      if (result.reason === 'not_found')
        return errorResponse('Property not found', 404, 'NOT_FOUND')
      return errorResponse(
        'Property cannot be archived from its current state',
        409,
        'NOT_ARCHIVABLE'
      )
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'property_archived',
      entityType: 'property',
      entityId: id,
      beforeSnapshot: { publish_status: result.previousStatus },
      afterSnapshot: { publish_status: 'archived' },
    })

    return NextResponse.json({ data: { status: 'archived' } })
  })
}
