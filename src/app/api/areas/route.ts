import { NextResponse } from 'next/server'
import { z } from 'zod'

import { listActiveAreas } from '@/dal/areas.dal'

/**
 * AURA-204 — `GET /api/areas` (public, active-only areas overview).
 *
 * Active-only is enforced in the DAL via the anon client + RLS. No auth, no mutation, no
 * service role in this handler. Errors are generic (no raw DB details leak to the client).
 *
 * AURA-204 supports NO query params (no search/filter/pagination/sort). The handler is
 * Zod-validated with a STRICT empty schema: any provided query param is rejected with 400,
 * so the fixed public contract cannot be silently extended.
 *
 * `force-dynamic`: the response depends on live data; it must never be statically cached.
 */
export const dynamic = 'force-dynamic'

const querySchema = z.object({}).strict()

export async function GET(request: Request): Promise<NextResponse> {
  const params = Object.fromEntries(new URL(request.url).searchParams)

  const parsed = querySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  try {
    const data = await listActiveAreas()
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
