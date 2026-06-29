import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminArea, listAdminAreas } from '@/dal/admin-areas.dal'
import { areaCreateSchema } from '@/domain/areas/admin'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import {
  errorResponse,
  parseFormBool,
  parseFormInt,
  parseFormString,
  validateOptionalAreaImage,
  withAdmin,
} from './_helpers'

/**
 * AURA-305 — `GET/POST /api/admin/areas` (admin-only).
 *
 * Both verbs call `requireAdmin()` (via `withAdmin`) FIRST — the protected layout guards pages,
 * not Route Handlers (RBAC.md). Input is Zod-validated; errors are generic; no DB detail leaks.
 *
 *   GET  — returns ALL areas (active + inactive) with admin-only property counts.
 *   POST — creates an area (multipart: fields + OPTIONAL representative image file).
 *
 * Area writes use the admin's own session + RLS (no service role); the only service-role path is
 * the audit-log write (`area_created`, D-38). `force-dynamic`: per-request, session-scoped data.
 */
export const dynamic = 'force-dynamic'

/**
 * Transport-level shape of the multipart create form. Coerces/validates the raw form transport
 * (strings → typed values); the business grammar (slug pattern, name length, bounds) is enforced
 * by the domain `areaCreateSchema` applied below. Keeping the two layers separate mirrors the
 * AURA-303 query/body split.
 */
const createFormSchema = z.object({
  slug: z.string().optional(),
  name_en: z.string().optional(),
  description_en: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    const data = await listAdminAreas()
    return NextResponse.json({ data })
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  return withAdmin(async (ctx) => {
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return errorResponse('Invalid form submission', 400, 'INVALID_FORM')
    }

    const transport = createFormSchema.safeParse({
      slug: parseFormString(form.get('slug')),
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
    const parsed = areaCreateSchema.safeParse({
      slug: t.slug,
      name: { en: t.name_en },
      description: t.description_en === undefined ? undefined : { en: t.description_en },
      sort_order: t.sort_order,
      is_active: t.is_active,
    })
    if (!parsed.success) {
      return errorResponse('Invalid area data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      })
    }

    const imageResult = await validateOptionalAreaImage(form.get('file'))
    if (!imageResult.ok) return imageResult.response

    const result = await createAdminArea(parsed.data, imageResult.image)
    if (!result.ok) {
      return errorResponse('That slug is already in use', 409, 'SLUG_CONFLICT')
    }

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'area_created',
      entityType: 'area',
      entityId: result.area.id,
      afterSnapshot: {
        slug: result.area.slug,
        is_active: result.area.isActive,
        sort_order: result.area.sortOrder,
        has_image: result.area.imageUrl !== null,
      },
    })

    return NextResponse.json({ data: result.area }, { status: 201 })
  })
}
