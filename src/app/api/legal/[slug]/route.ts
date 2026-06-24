import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getPublishedLegalPage } from '@/dal/legal.dal'
import { PUBLIC_LEGAL_SLUGS } from '@/domain/legal/legal-page'

/**
 * AURA-205 — `GET /api/legal/[slug]` (public, published-only legal page).
 *
 * Zod validates the slug against the public allowlist (`privacy` | `terms`). Any other slug —
 * malformed or simply unsupported — is treated as NOT FOUND (404), never 400: publicly only
 * these two pages exist, so every other slug is indistinguishable from a missing page (no
 * enumeration, no signal about which slugs are valid). Published-only is enforced in the DAL
 * via the anon client + RLS; a missing / draft / archived page yields `null` → 404 as well.
 *
 * The DTO returns RAW Markdown `content` (not pre-rendered HTML); safe rendering happens in the
 * page render path (D-12). No auth, no mutation, no service role. Errors are generic (no raw DB
 * details leak).
 *
 * `force-dynamic`: the response depends on the path param and live data; never statically cached.
 */
export const dynamic = 'force-dynamic'

const slugSchema = z.enum(PUBLIC_LEGAL_SLUGS)

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await context.params

  const parsed = slugSchema.safeParse(slug)
  if (!parsed.success) {
    // Unsupported/malformed slug → indistinguishable from missing (safest, no enumeration).
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const data = await getPublishedLegalPage(parsed.data)
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
