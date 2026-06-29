import { NextResponse } from 'next/server'
import type { z } from 'zod'

import { getAdminSettings, updateAdminSettings } from '@/dal/settings.dal'
import { settingsPatchSchema, toSettingRows } from '@/domain/settings'
import { writeAuditLog } from '@/dal/audit-logs.dal'

import { errorResponse, withAdmin } from './_helpers'

/**
 * AURA-306 — `GET/PATCH /api/admin/settings` (admin-only).
 *
 * Both verbs call `requireAdmin()` (via `withAdmin`) FIRST — the protected layout guards pages,
 * not Route Handlers (RBAC.md). Both MVP admin roles may edit settings (no `requireSuperAdmin`).
 * Input is Zod-validated against the editable allowlist; errors are generic; no DB detail leaks.
 *
 *   GET   — returns the editable settings (allowed keys only) as the typed public-safe DTO.
 *   PATCH — partial batch update of one or more allowed keys (JSON body). Unknown / deferred keys
 *           are REJECTED by the strict schema; an empty patch is rejected (400).
 *
 * Settings writes use the admin's own session + RLS (the admin settings DAL never uses the
 * privileged client). The only privileged write here is the audit log: `settings_updated` with
 * metadata carrying the changed key NAMES only (never the values — phone/email/etc. may be
 * sensitive; owner decision).
 *
 * Updates are IMMEDIATE (no draft/publish flow): the public layout is `force-dynamic` and reads
 * settings per request, so the next public request reflects the change with no revalidation work.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically cached.
 */
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  return withAdmin(async () => {
    const data = await getAdminSettings()
    return NextResponse.json({ data })
  })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  return withAdmin(async (ctx) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400, 'INVALID_JSON')
    }

    const parsed = settingsPatchSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Invalid settings data', 400, 'VALIDATION_ERROR', {
        issues: parsed.error.issues.map((i: z.ZodIssue) => ({ path: i.path, message: i.message })),
      })
    }

    const rows = toSettingRows(parsed.data)
    if (rows.length === 0) {
      // Defensive: the schema's refine already rejects an empty patch.
      return errorResponse('At least one setting must be provided', 400, 'VALIDATION_ERROR')
    }

    const changedKeys = await updateAdminSettings(rows, ctx.userId)

    await writeAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'settings_updated',
      entityType: 'settings',
      entityId: null,
      // Changed key NAMES only — never the new/old values (owner decision; may be sensitive).
      metadata: { changed_keys: changedKeys },
    })

    const data = await getAdminSettings()
    return NextResponse.json({ data, changedKeys })
  })
}
