import { NextResponse } from 'next/server'
import { z } from 'zod'

import { parseFeaturedQuery } from '@/domain/properties/query'
import { listFeaturedProperties } from '@/dal/properties.dal'

/**
 * AURA-202 — `GET /api/properties/featured` (public, published + featured only).
 *
 * Zod-validated `limit` (default 6, hard max 12). Published + `is_featured` is enforced in
 * the DAL via the anon client + RLS. No auth, no mutation, no service role. Generic errors.
 */
export const dynamic = 'force-dynamic'

const rawParamsSchema = z
  .record(z.string())
  .catch({})
  .transform((obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '')))

export async function GET(request: Request): Promise<NextResponse> {
  const rawParams = rawParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams))

  const parsed = parseFeaturedQuery(rawParams)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  try {
    const data = await listFeaturedProperties(parsed.data.limit)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
