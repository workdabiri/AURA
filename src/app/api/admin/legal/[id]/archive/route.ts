import { NextResponse } from 'next/server'
import { z } from 'zod'

import { archiveLegalPage } from '@/dal/legal.dal'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from '../../_helpers'

/**
 * AURA-307 — `POST /api/admin/legal/[id]/archive` (admin-only).
 *
 * Archives a legal row (no hard delete). A `draft` or `published` row becomes `archived`; an
 * already-archived row is a clean 409 (no-op state). Runs `requireAdmin()` FIRST. Archiving the
 * currently published row leaves the slug with NO published page, so the public surface 404s for
 * that slug (published-only) — intended.
 *
 * Audit: `legal_page_archived` with safe identifiers only (slug, status transition, version) —
 * never the legal title/body.
 *
 * `force-dynamic`: per-request, session-scoped admin mutation — never statically cached.
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
      return errorResponse('Legal page not found', 404, 'NOT_FOUND')
    }
    const id = idResult.data

    const result = await archiveLegalPage(id, ctx.userId)
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return errorResponse('Legal page not found', 404, 'NOT_FOUND')
      }
      return errorResponse('Legal page is already archived', 409, 'ALREADY_ARCHIVED')
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'legal_page_archived',
      entityType: 'legal_page',
      entityId: result.page.id,
      metadata: {
        slug: result.page.slug,
        from: result.previousStatus,
        to: 'archived',
        version: result.page.version,
      },
    })

    return NextResponse.json({ data: result.page })
  })
}
