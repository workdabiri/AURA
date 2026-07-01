import { NextResponse } from 'next/server'
import { z } from 'zod'

import { publishLegalPage } from '@/dal/legal.dal'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from '../../_helpers'

/**
 * AURA-307 — `POST /api/admin/legal/[id]/publish` (admin-only).
 *
 * Publishes a selected DRAFT for its slug (row-per-version): archives the currently published row
 * for the same slug, then promotes the selected draft to `published` with
 * `version = max(version for slug) + 1` and `published_at = now`. Runs `requireAdmin()` FIRST.
 *
 * Audit: `legal_page_published` with safe identifiers only (slug, status transition, version, and
 * the archived previous version) — never the legal title/body. The publish sequence + audit are
 * non-atomic (owner-accepted caveat); a mid-sequence failure fails loud as a generic 500.
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

    const result = await publishLegalPage(id, ctx.userId)
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return errorResponse('Legal page not found', 404, 'NOT_FOUND')
      }
      if (result.reason === 'invalid_slug') {
        return errorResponse('Invalid legal slug', 400, 'VALIDATION_ERROR')
      }
      // Only a draft can be published (published/archived rows are not re-publishable).
      return errorResponse('Only draft legal pages can be published', 409, 'NOT_DRAFT')
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'legal_page_published',
      entityType: 'legal_page',
      entityId: result.page.id,
      metadata: {
        slug: result.page.slug,
        from: 'draft',
        to: 'published',
        version: result.page.version,
        archived_previous_version: result.archivedPreviousVersion,
      },
    })

    return NextResponse.json({ data: result.page })
  })
}
