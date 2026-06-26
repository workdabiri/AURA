import 'server-only'

import {
  isPublicLegalSlug,
  toLegalPageDTO,
  type LegalPageDTO,
  type PublicLegalPageRow,
} from '@/domain/legal/legal-page'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * AURA-205 — public legal page data-access layer (published-only reads).
 *
 * `server-only`: reached from the Route Handler / Server Component, never the client bundle.
 *
 * SECURITY POSTURE (owner-approved):
 *   - Uses the ANON server client (`createSupabaseServerClient`), NEVER the service role.
 *     `legal_pages` has an anon RLS policy (`legal_pages_anon_select_published`) scoping reads
 *     to `status = 'published'` (AURA-103), so RLS is the enforcement boundary. We ALSO
 *     re-assert `.eq('status', 'published')` in the query as defence in depth — draft/archived
 *     pages are therefore invisible publicly (→ the route/page maps a miss to 404, never 403).
 *   - Limits the slug to the public allowlist (`privacy` | `terms`) BEFORE querying, so no other
 *     slug can ever be read through this path.
 *   - Selects an EXPLICIT public-safe column allowlist — never `select('*')`. id, status,
 *     version, last_updated_by, created_at, updated_at, and published_at never leave here.
 *   - Returns the public DTO only (via the pure projector) — never raw DB rows, never raw
 *     Supabase errors.
 *
 * The partial unique index `legal_pages_slug_published_key` guarantees at most one published
 * row per slug, so `.maybeSingle()` is exact.
 */

/** Public-safe legal columns (mirrors `PublicLegalPageRow`). NEVER `*`. */
const LEGAL_PAGE_COLUMNS = 'slug, title, content, effective_date'

/** Internal error type so the route/page can map to a generic 500 / error state. */
class LegalDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LegalDalError'
  }
}

/**
 * Load a single PUBLISHED legal page by public slug for the public legal surface. Published-only
 * is enforced via the anon client + RLS, re-asserted here. Returns a public-safe DTO, or `null`
 * for a non-public slug, or a missing / draft / archived page (→ the route/page maps to 404).
 */
export async function getPublishedLegalPage(slug: string): Promise<LegalPageDTO | null> {
  // Defence in depth: the route validates too, but never query outside the public allowlist.
  if (!isPublicLegalSlug(slug)) return null

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('legal_pages')
    .select(LEGAL_PAGE_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    throw new LegalDalError(`Failed to load legal page: ${error.message}`)
  }
  if (!data) return null

  return toLegalPageDTO(data as unknown as PublicLegalPageRow)
}
