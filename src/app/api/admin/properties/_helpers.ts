import 'server-only'

import { NextResponse } from 'next/server'

import { AuthorizationError, requireAdmin, type AdminContext } from '@/services/auth'

/**
 * AURA-303 — shared helpers for the admin property Route Handlers.
 *
 * NOT a route module (underscore-prefixed → never routed). `server-only`-tainted via the auth
 * barrel. Centralises the two things every `/api/admin/properties*` handler must do:
 *   1. enforce `requireAdmin()` IN THE HANDLER (the `(protected)` layout guard protects PAGES,
 *      not Route Handlers — RBAC.md), mapping 401/403 to the safe error envelope, and
 *   2. map any unexpected throw to a generic 500 (no stack/DB detail leaks — API_SPEC).
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

/**
 * Run `handler` only for a verified admin (`super_admin` or `client_admin`). Both MVP admin
 * roles may manage properties (RBAC.md), so this uses the any-admin guard — never the
 * super-admin-only guard. Auth failures become 401/403; any handler throw becomes a generic 500.
 */
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
    // No internal detail leaves the boundary (API_SPEC §Error Response). Full detail is in
    // the thrown DAL error server-side.
    return errorResponse('Internal server error', 500)
  }
}
