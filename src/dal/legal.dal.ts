import 'server-only'

import {
  assertSafeLegalMarkdown,
  isLegalAdminSlug,
  nextPublishedVersion,
  toAdminLegalDetail,
  toAdminLegalListItem,
  type AdminLegalPageDetailDTO,
  type AdminLegalPageListItemDTO,
  type AdminLegalPageRow,
  type LegalCreateInput,
  type LegalUpdateInput,
} from '@/domain/legal/admin'
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

/**
 * AURA-307 — ADMIN legal reads + writes (still in this `server-only` module, reached only from the
 * admin Route Handlers / Server Components).
 *
 * SECURITY POSTURE (owner-locked, AURA-307):
 *   - All admin reads/writes use the ANON server client under the CALLER'S OWN admin session —
 *     NEVER the service role. The `legal_pages_admin_*` RLS policies (AURA-103), gated on
 *     `public.is_admin()`, are the boundary; the route's `requireAdmin()` runs first. The ONLY
 *     service-role path for legal remains the audit writer.
 *   - Explicit admin column allowlist — never `select('*')`.
 *   - NO hard delete — there is no DELETE policy on `legal_pages`; "removal" is archive only.
 *   - Slug is restricted to the allowlist (`privacy` | `terms`) and set ONLY at create; updates
 *     never touch it.
 *   - Content is re-checked with `assertSafeLegalMarkdown` before every insert/update (D-12
 *     write-time backstop behind the route's Zod schema).
 *
 * PUBLISH ATOMICITY (owner-accepted caveat): there is no migration/RPC, so the publish sequence
 * (archive previous published row → promote selected draft) and the subsequent audit write are
 * NOT a single transaction. The sequence orders the writes so the partial unique index
 * `legal_pages_slug_published_key` is never violated, and any mid-sequence failure THROWS (fails
 * loud) — same non-atomic pattern accepted by prior admin tasks.
 */

/** Admin legal columns (mirrors `AdminLegalPageRow`). NEVER `*`. */
const ADMIN_LEGAL_COLUMNS =
  'id, slug, title, content, version, effective_date, status, last_updated_by, created_at, updated_at, published_at'

/** Wrap an English string into the i18n JSONB shape the columns store. */
function toI18n(en: string): { en: string } {
  return { en }
}

/** List ALL legal pages/versions (draft + published + archived) for the admin table. */
export async function listAdminLegalPages(): Promise<AdminLegalPageListItemDTO[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('legal_pages')
    .select(ADMIN_LEGAL_COLUMNS)
    .order('slug', { ascending: true })
    .order('version', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new LegalDalError(`Failed to list admin legal pages: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as AdminLegalPageRow[]
  return rows.map(toAdminLegalListItem)
}

/** Load a single legal page (any status) by id for the admin edit form, or null when not found. */
export async function getAdminLegalPageById(id: string): Promise<AdminLegalPageDetailDTO | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('legal_pages')
    .select(ADMIN_LEGAL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new LegalDalError(`Failed to load admin legal page: ${error.message}`)
  }
  if (!data) return null

  return toAdminLegalDetail(data as unknown as AdminLegalPageRow)
}

type CreateLegalResult =
  | { ok: true; page: AdminLegalPageDetailDTO }
  | { ok: false; reason: 'invalid_slug' }

/**
 * Create a legal DRAFT (status forced to `draft`, version starts at 1; the published version is
 * (re)computed at publish time). Slug is restricted to the allowlist; content safety is re-checked.
 */
export async function createLegalDraft(
  input: LegalCreateInput,
  actorUserId: string | null
): Promise<CreateLegalResult> {
  if (!isLegalAdminSlug(input.slug)) return { ok: false, reason: 'invalid_slug' }
  assertSafeLegalMarkdown(input.content)

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('legal_pages')
    .insert({
      slug: input.slug,
      title: toI18n(input.title),
      content: toI18n(input.content),
      effective_date: input.effective_date,
      status: 'draft',
      version: 1,
      last_updated_by: actorUserId,
    })
    .select(ADMIN_LEGAL_COLUMNS)
    .single()

  if (error || !data) {
    throw new LegalDalError(`Failed to create legal draft: ${error?.message ?? 'unknown error'}`)
  }

  return { ok: true, page: toAdminLegalDetail(data as unknown as AdminLegalPageRow) }
}

type UpdateLegalResult =
  | { ok: true; page: AdminLegalPageDetailDTO }
  | { ok: false; reason: 'not_found' | 'not_draft' }

/**
 * Update a legal DRAFT in place (title / content / effective_date). Only `draft` rows are editable
 * — a published or archived row is immutable (publishing creates a new version; archiving is a
 * one-way state change). Slug is never writable here.
 */
export async function updateLegalDraft(
  id: string,
  patch: LegalUpdateInput,
  actorUserId: string | null
): Promise<UpdateLegalResult> {
  const supabase = await createSupabaseServerClient()

  const current = await getAdminLegalPageById(id)
  if (!current) return { ok: false, reason: 'not_found' }
  if (current.status !== 'draft') return { ok: false, reason: 'not_draft' }

  if (patch.content !== undefined) assertSafeLegalMarkdown(patch.content)

  const payload: Record<string, unknown> = { last_updated_by: actorUserId }
  if (patch.title !== undefined) payload.title = toI18n(patch.title)
  if (patch.content !== undefined) payload.content = toI18n(patch.content)
  if (patch.effective_date !== undefined) payload.effective_date = patch.effective_date

  const { data, error } = await supabase
    .from('legal_pages')
    .update(payload)
    .eq('id', id)
    .eq('status', 'draft')
    .select(ADMIN_LEGAL_COLUMNS)
    .single()

  if (error || !data) {
    throw new LegalDalError(`Failed to update legal draft: ${error?.message ?? 'unknown error'}`)
  }

  return { ok: true, page: toAdminLegalDetail(data as unknown as AdminLegalPageRow) }
}

type PublishLegalResult =
  | { ok: true; page: AdminLegalPageDetailDTO; archivedPreviousVersion: number | null }
  | { ok: false; reason: 'not_found' | 'not_draft' | 'invalid_slug' }

/**
 * Publish a selected DRAFT for its slug (row-per-version model):
 *   1. load the selected row — must exist, be a `draft`, and carry an allowlisted slug;
 *   2. read every version for the slug (id, version, status) under admin RLS;
 *   3. ARCHIVE the currently published row for the slug FIRST (so the partial unique index
 *      `legal_pages_slug_published_key` is never violated when the new row goes published);
 *   4. compute `version = max(existing versions for slug) + 1`;
 *   5. promote the selected row to `published` with the new version + `published_at = now`.
 *
 * Non-atomic caveat (owner-accepted): steps 3–5 are separate writes; any failure THROWS so the
 * partial state is loud, never silently inconsistent.
 */
export async function publishLegalPage(
  id: string,
  actorUserId: string | null
): Promise<PublishLegalResult> {
  const supabase = await createSupabaseServerClient()

  const current = await getAdminLegalPageById(id)
  if (!current) return { ok: false, reason: 'not_found' }
  if (current.status !== 'draft') return { ok: false, reason: 'not_draft' }
  if (!isLegalAdminSlug(current.slug)) return { ok: false, reason: 'invalid_slug' }

  // All versions for this slug (admin RLS returns every status).
  const { data: siblings, error: siblingsError } = await supabase
    .from('legal_pages')
    .select('id, version, status')
    .eq('slug', current.slug)

  if (siblingsError) {
    throw new LegalDalError(`Failed to read legal versions: ${siblingsError.message}`)
  }

  const rows = (siblings ?? []) as { id: string; version: number; status: string }[]
  const publishedRow = rows.find((r) => r.status === 'published') ?? null
  const nextVersion = nextPublishedVersion(rows.map((r) => r.version))

  // Step 3: archive the currently published row FIRST (keeps the partial unique index satisfied).
  if (publishedRow && publishedRow.id !== id) {
    const { error: archiveError } = await supabase
      .from('legal_pages')
      .update({ status: 'archived', last_updated_by: actorUserId })
      .eq('id', publishedRow.id)
      .eq('status', 'published')

    if (archiveError) {
      throw new LegalDalError(
        `Failed to archive previous published legal page: ${archiveError.message}`
      )
    }
  }

  // Step 5: promote the selected draft to published with the new version.
  const { data, error } = await supabase
    .from('legal_pages')
    .update({
      status: 'published',
      version: nextVersion,
      published_at: new Date().toISOString(),
      last_updated_by: actorUserId,
    })
    .eq('id', id)
    .eq('status', 'draft')
    .select(ADMIN_LEGAL_COLUMNS)
    .single()

  if (error || !data) {
    throw new LegalDalError(`Failed to publish legal page: ${error?.message ?? 'unknown error'}`)
  }

  return {
    ok: true,
    page: toAdminLegalDetail(data as unknown as AdminLegalPageRow),
    archivedPreviousVersion: publishedRow && publishedRow.id !== id ? publishedRow.version : null,
  }
}

type ArchiveLegalResult =
  | { ok: true; page: AdminLegalPageDetailDTO; previousStatus: 'draft' | 'published' }
  | { ok: false; reason: 'not_found' | 'already_archived' }

/**
 * Archive a legal row (no hard delete). A `draft` or `published` row becomes `archived`; an
 * already-archived row is a clean `already_archived` no-op result (route → 409), never a 500.
 */
export async function archiveLegalPage(
  id: string,
  actorUserId: string | null
): Promise<ArchiveLegalResult> {
  const supabase = await createSupabaseServerClient()

  const current = await getAdminLegalPageById(id)
  if (!current) return { ok: false, reason: 'not_found' }
  if (current.status === 'archived') return { ok: false, reason: 'already_archived' }

  const previousStatus = current.status

  const { data, error } = await supabase
    .from('legal_pages')
    .update({ status: 'archived', last_updated_by: actorUserId })
    .eq('id', id)
    .neq('status', 'archived')
    .select(ADMIN_LEGAL_COLUMNS)
    .single()

  if (error || !data) {
    throw new LegalDalError(`Failed to archive legal page: ${error?.message ?? 'unknown error'}`)
  }

  return {
    ok: true,
    page: toAdminLegalDetail(data as unknown as AdminLegalPageRow),
    previousStatus,
  }
}
