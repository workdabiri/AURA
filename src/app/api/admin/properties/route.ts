import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminProperty, listAdminProperties } from '@/dal/admin-properties.dal'
import { propertyCreateSchema, PUBLISH_STATUSES } from '@/domain/properties/admin'
import { MAX_LIMIT } from '@/domain/properties/query'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from './_helpers'

/**
 * AURA-303 — `GET/POST /api/admin/properties` (admin-only).
 *
 * Both verbs call `requireAdmin()` (via `withAdmin`) FIRST — the protected layout guards pages,
 * not Route Handlers (RBAC.md). All input is Zod-validated; errors are generic; no DB detail
 * leaks. Property writes use the admin's own session + RLS (no service role); the only
 * service-role path is the audit-log write (`property_created`, D-38).
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically cached.
 */
export const dynamic = 'force-dynamic'

/** List query: pagination (cap 50 / A-07) + optional status filter + title search. */
const listQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.enum(PUBLISH_STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .transform((q) => ({
    page: q.page ?? 1,
    limit: Math.min(q.limit ?? 20, MAX_LIMIT),
    status: q.status,
    search: q.search,
  }))

export async function GET(request: Request): Promise<NextResponse> {
  return withAdmin(async () => {
    const raw = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = listQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return errorResponse('Invalid query parameters', 400, 'VALIDATION_ERROR')
    }

    const { items, total } = await listAdminProperties(parsed.data)
    return NextResponse.json({
      data: items,
      pagination: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: parsed.data.limit > 0 ? Math.ceil(total / parsed.data.limit) : 0,
      },
    })
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  return withAdmin(async (ctx) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'INVALID_JSON')
    }

    const parsed = propertyCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Invalid property data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const result = await createAdminProperty(parsed.data, { userId: ctx.userId, role: ctx.role })
    if (!result.ok) {
      return errorResponse('Reference number is already in use', 409, 'REFERENCE_CONFLICT')
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'property_created',
      entityType: 'property',
      entityId: result.id,
      afterSnapshot: {
        slug: result.slug,
        reference_number: result.reference_number,
        publish_status: result.publish_status,
      },
    })

    return NextResponse.json(
      {
        data: {
          id: result.id,
          slug: result.slug,
          reference_number: result.reference_number,
          publish_status: result.publish_status,
        },
      },
      { status: 201 }
    )
  })
}
