import 'server-only'

import { NextResponse } from 'next/server'

import {
  ALLOWED_AREA_IMAGE_MIME_TYPES,
  AREA_IMAGE_MAX_BYTES,
  type AreaImageMimeType,
} from '@/domain/areas/admin'
import { AuthorizationError, requireAdmin, type AdminContext } from '@/services/auth'

/**
 * AURA-305 — shared helpers for the admin area Route Handlers.
 *
 * NOT a route module (underscore-prefixed → never routed). `server-only`-tainted via the auth
 * barrel. Mirrors the AURA-303 property helper so each `/api/admin/areas*` handler:
 *   1. enforces `requireAdmin()` IN THE HANDLER (the `(protected)` layout guard protects PAGES,
 *      not Route Handlers — RBAC.md), mapping 401/403 to the safe error envelope, and
 *   2. maps any unexpected throw to a generic 500 (no stack/DB detail leaks — API_SPEC).
 *
 * Both MVP admin roles (`super_admin` and `client_admin`) may manage areas, so this uses the
 * any-admin guard — never the super-admin-only guard.
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

/** Parse a multipart boolean-ish field; absent → undefined. */
export function parseFormBool(value: FormDataEntryValue | null): boolean | undefined {
  if (value == null) return undefined
  const s = String(value).trim().toLowerCase()
  if (s === '') return undefined
  return s === 'true' || s === 'on' || s === '1'
}

/** Parse a multipart integer field; absent/empty → undefined; non-numeric → NaN (caller rejects). */
export function parseFormInt(value: FormDataEntryValue | null): number | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  if (s === '') return undefined
  return Number(s)
}

/** Trim a multipart string field; absent/empty → undefined. */
export function parseFormString(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  return s === '' ? undefined : s
}

type ValidatedAreaImage =
  | { ok: true; image?: { mimeType: AreaImageMimeType; body: ArrayBuffer } }
  | { ok: false; response: NextResponse }

/**
 * Validate an OPTIONAL representative image file from the multipart form. Returns `image:
 * undefined` when no file was provided (image is optional on create and replace). Enforces the
 * AURA-105 MIME allowlist + 10MB cap; the bucket's `allowed_mime_types`/`file_size_limit` are a
 * second defence-in-depth layer at upload time.
 */
export async function validateOptionalAreaImage(
  file: FormDataEntryValue | null
): Promise<ValidatedAreaImage> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: true, image: undefined }
  }
  if (!(ALLOWED_AREA_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, response: errorResponse('Unsupported file type', 400, 'UNSUPPORTED_TYPE') }
  }
  if (file.size > AREA_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      response: errorResponse('File exceeds the 10MB limit', 400, 'FILE_TOO_LARGE'),
    }
  }
  const body = await file.arrayBuffer()
  return { ok: true, image: { mimeType: file.type as AreaImageMimeType, body } }
}
