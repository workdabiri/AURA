import { NextResponse } from 'next/server'
import { z } from 'zod'

import { parseListingQuery, totalPages } from '@/domain/properties/query'
import { listPublishedProperties } from '@/dal/properties.dal'

/**
 * AURA-202 — `GET /api/properties` (public, published-only listing).
 *
 * Zod-validated query (filters + search + sort + pagination, cap 50 / A-07). Published-only
 * is enforced in the DAL via the anon client + RLS. No auth, no mutation, no service role.
 * Errors are generic (no raw DB details leak to the client).
 *
 * `force-dynamic`: the response depends on per-request query params and live data; it must
 * never be statically cached/prerendered.
 */
export const dynamic = 'force-dynamic'

/**
 * Accept only string-valued query params, then drop empty strings (so `?sort=` is treated as
 * absent rather than an invalid value) before domain validation (defence in depth).
 */
const rawParamsSchema = z
  .record(z.string())
  .catch({})
  .transform((obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '')))

export async function GET(request: Request): Promise<NextResponse> {
  const rawParams = rawParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams))

  const parsed = parseListingQuery(rawParams)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  try {
    const { items, total } = await listPublishedProperties(parsed.data)
    return NextResponse.json({
      data: items,
      pagination: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: totalPages(total, parsed.data.limit),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
