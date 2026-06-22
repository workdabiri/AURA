import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getPublishedPropertyBySlug } from '@/dal/property-detail.dal'
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from '@/domain/properties/detail'

/**
 * AURA-203 — `GET /api/properties/[slug]` (public, published-only property detail).
 *
 * Zod-validated slug param. Published-only is enforced in the DAL via the anon client + RLS;
 * a missing / draft / archived slug yields `null` → 404. No auth, no mutation, no service role
 * in this handler. Errors are generic (no raw DB details leak to the client).
 *
 * `force-dynamic`: the response depends on the path param and live data; never statically cached.
 */
export const dynamic = 'force-dynamic'

const slugSchema = z.string().trim().min(1).max(SLUG_MAX_LENGTH).regex(SLUG_PATTERN)

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await context.params

  const parsed = slugSchema.safeParse(slug)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  try {
    const data = await getPublishedPropertyBySlug(parsed.data)
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
