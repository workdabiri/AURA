import { NextResponse } from 'next/server'
import { z } from 'zod'

import { duplicateAdminProperty } from '@/dal/admin-properties.dal'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from '../../_helpers'

/**
 * AURA-303 — `POST /api/admin/properties/[id]/duplicate` (admin-only).
 *
 * Duplicates a property as a NEW DRAFT (copy editable fields; mint a new slug + reference;
 * `publish_status = draft`; views_count/timestamps not copied — API_SPEC). The original is
 * untouched. Audit: `property_duplicated` (D-38).
 */
export const dynamic = 'force-dynamic'

/** The `[id]` segment must be a UUID. */
const idSchema = z.string().uuid()

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withAdmin(async (ctx) => {
    const { id: rawId } = await context.params
    const idResult = idSchema.safeParse(rawId)
    if (!idResult.success) {
      return errorResponse('Property not found', 404, 'NOT_FOUND')
    }
    const sourceId = idResult.data

    const result = await duplicateAdminProperty(sourceId, {
      userId: ctx.userId,
      role: ctx.role,
    })

    if (!result.ok) {
      return errorResponse('Property not found', 404, 'NOT_FOUND')
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'property_duplicated',
      entityType: 'property',
      entityId: result.id,
      afterSnapshot: {
        slug: result.slug,
        reference_number: result.reference_number,
        publish_status: 'draft',
      },
      metadata: { source_property_id: sourceId },
    })

    return NextResponse.json(
      {
        data: {
          id: result.id,
          slug: result.slug,
          reference_number: result.reference_number,
        },
      },
      { status: 201 }
    )
  })
}
