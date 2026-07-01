import { NextResponse } from 'next/server'
import { z } from 'zod'

import { updateLegalDraft } from '@/dal/legal.dal'
import { legalUpdateSchema } from '@/domain/legal/admin'

import { errorResponse, withAdmin } from '../_helpers'

/**
 * AURA-307 — `PATCH /api/admin/legal/[id]` (admin-only).
 *
 * Updates a legal DRAFT's title / content / effective_date. Runs `requireAdmin()` FIRST. Only
 * `draft` rows are editable — a published/archived row is rejected (409). Slug + status are never
 * writable here (publishing creates a version; archiving is a separate action). Content is
 * Markdown-only — raw/unsafe HTML is rejected by the schema (D-12).
 *
 * Draft PATCH is intentionally NOT audited in AURA-307 (the minimum audit set is
 * create/publish/archive only — owner decision).
 *
 * `force-dynamic`: per-request, session-scoped admin mutation — never statically cached.
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
      return errorResponse('Legal page not found', 404, 'NOT_FOUND')
    }
    const id = idResult.data

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'INVALID_JSON')
    }

    const parsed = legalUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Invalid legal page data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const result = await updateLegalDraft(id, parsed.data, ctx.userId)
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return errorResponse('Legal page not found', 404, 'NOT_FOUND')
      }
      // Published / archived rows are immutable — only drafts can be edited.
      return errorResponse('Only draft legal pages can be edited', 409, 'NOT_DRAFT')
    }

    return NextResponse.json({ data: result.page })
  })
}
