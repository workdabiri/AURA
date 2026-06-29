import 'server-only'

import { NextResponse } from 'next/server'

import { AuthorizationError, requireAdmin, type AdminContext } from '@/services/auth'

/**
 * AURA-306 — shared helpers for the admin settings Route Handler.
 *
 * NOT a route module (underscore-prefixed → never routed). `server-only`-tainted via the auth
 * barrel. Mirrors the AURA-305 area helper so each `/api/admin/settings` handler:
 *   1. enforces `requireAdmin()` IN THE HANDLER (the `(protected)` layout guard protects PAGES,
 *      not Route Handlers — RBAC.md), mapping 401/403 to the safe error envelope, and
 *   2. maps any unexpected throw to a generic 500 (no stack/DB detail leaks — API_SPEC).
 *
 * Both MVP admin roles (`super_admin` and `client_admin`) may edit settings (owner decision —
 * no super-admin-only setting in AURA-306), so this uses the any-admin guard — NEVER the
 * super-admin-only guard.
 */

/** The documented error envelope: `{ error, code? }` — never a stack trace or DB detail. */
export function errorResponse(
  message: string,
  status: number,
  code?: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error: message, ...(code ? { code } : {}), ...(extra ?? {}) },
    { status }
  )
}

/** Run `handler` only for a verified admin. Auth failures → 401/403; any throw → generic 500. */
export async function withAdmin(
  handler: (ctx: AdminContext) => Promise<NextResponse>
): Promise<NextResponse> {
  let ctx: AdminContext
  try {
    ctx = await requireAdmin()
  } catch (e) {
    if (e instanceof AuthorizationError) {
      const message = e.status === 401 ? 'Authentication required.' : 'Access denied.'
      return errorResponse(message, e.status, e.code)
    }
    return errorResponse('Internal server error', 500)
  }

  try {
    return await handler(ctx)
  } catch {
    return errorResponse('Internal server error', 500)
  }
}
