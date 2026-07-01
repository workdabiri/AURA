import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createLegalDraft, listAdminLegalPages } from '@/dal/legal.dal'
import { legalCreateSchema } from '@/domain/legal/admin'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from './_helpers'

/**
 * AURA-307 — `GET/POST /api/admin/legal` (admin-only).
 *
 * Both verbs call `requireAdmin()` (via `withAdmin`) FIRST — the protected layout guards pages,
 * not Route Handlers (RBAC.md). Both MVP admin roles may manage legal (no `requireSuperAdmin`).
 * Input is Zod-validated; errors are generic; no DB detail leaks.
 *
 *   GET  — lists ALL legal pages/versions (draft + published + archived).
 *   POST — creates a Markdown-only DRAFT (slug restricted to `privacy` | `terms`). `effective_date`
 *          defaults to today when omitted; raw/unsafe HTML is rejected by the schema (D-12).
 *
 * Legal writes use the admin's own session + RLS (no service role); the only service-role path is
 * the audit-log write (`legal_page_created`). `force-dynamic`: per-request, session-scoped data.
 */
export const dynamic = 'force-dynamic'

/** Transport shape of the JSON create body (business grammar enforced by `legalCreateSchema`). */
const createBodySchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  effective_date: z.string().optional(),
})

/** Today's date as `YYYY-MM-DD` (UTC) — the default effective date on create. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    const data = await listAdminLegalPages()
    return NextResponse.json({ data })
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

    const transport = createBodySchema.safeParse(body)
    if (!transport.success) {
      return errorResponse('Invalid legal page data', 400, 'VALIDATION_ERROR', {
        issues: transport.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const t = transport.data
    const parsed = legalCreateSchema.safeParse({
      slug: t.slug,
      title: t.title,
      content: t.content,
      effective_date: t.effective_date ?? todayIso(),
    })
    if (!parsed.success) {
      return errorResponse('Invalid legal page data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const result = await createLegalDraft(parsed.data, ctx.userId)
    if (!result.ok) {
      return errorResponse('Invalid legal slug', 400, 'VALIDATION_ERROR')
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'legal_page_created',
      entityType: 'legal_page',
      entityId: result.page.id,
      // Safe identifiers only — never the legal title/body (owner decision).
      metadata: {
        slug: result.page.slug,
        status: result.page.status,
        version: result.page.version,
      },
    })

    return NextResponse.json({ data: result.page }, { status: 201 })
  })
}
