import 'server-only'

import { toAreaCardDTO, type AreaCardDTO, type PublicAreaRow } from '@/domain/areas/area'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * AURA-204 — public areas data-access layer (active-only reads).
 *
 * `server-only`: reached from the Route Handler / Server Component, never the client bundle.
 *
 * SECURITY POSTURE (owner-approved):
 *   - Uses the ANON server client (`createSupabaseServerClient`), NEVER the service role.
 *     `areas` has an anon RLS policy (`areas_anon_select_active`) scoping reads to
 *     `is_active = true` (AURA-103), so RLS is the enforcement boundary. We ALSO re-assert
 *     `.eq('is_active', true)` in the query as defence in depth.
 *   - Selects an EXPLICIT public-safe column allowlist — never `select('*')`. id, is_active,
 *     sort_order, created_at, and updated_at never leave here. `sort_order` is used only to
 *     order (PostgREST orders by it without selecting it) — it is never output.
 *   - NEVER reads `properties` or any property-derived data: no counts, no aggregation.
 *   - Returns DTOs only (via the pure projector) — never raw DB rows, never raw Supabase errors.
 *
 * Fixed server-side ordering (no query params in AURA-204): `sort_order ASC`, then `slug ASC`.
 */

/** Public-safe area columns (mirrors `PublicAreaRow`). NEVER `*`. No id/is_active/sort_order. */
const AREA_CARD_COLUMNS = 'slug, name, description, image_url'

/** Internal error type so the route/page can map to a generic 500 / error state. */
class AreasDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AreasDalError'
  }
}

/**
 * List active areas for the public areas overview surface. Active-only is enforced in the DAL
 * via the anon client + RLS, re-asserted here. Returns public-safe DTOs in fixed display order.
 */
export async function listActiveAreas(): Promise<AreaCardDTO[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('areas')
    .select(AREA_CARD_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('slug', { ascending: true })

  if (error) {
    throw new AreasDalError(`Failed to list areas: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as PublicAreaRow[]
  return rows.map(toAreaCardDTO)
}
