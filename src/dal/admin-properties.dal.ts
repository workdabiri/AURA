import 'server-only'

import {
  buildDuplicateInsert,
  buildUpdatePayload,
  canArchive,
  canEditProperty,
  canPublish,
  formatReferenceNumber,
  REFERENCE_NUMBER_PREFIX,
  slugifyTitleEn,
  withSlugSuffix,
  type DuplicateSourceRow,
  type PropertyCreateInput,
  type PropertyUpdateInput,
  type PublishStatus,
} from '@/domain/properties/admin'
import {
  toAdminListItem,
  toAdminPropertyDetail,
  type AdminPropertyDetailDTO,
  type AdminPropertyDetailRow,
  type AdminPropertyListItemDTO,
  type AdminPropertyListRow,
} from '@/domain/properties/admin-view'
import {
  evaluatePublishChecklist,
  summarizeCoverMedia,
  type PublishCandidate,
  type PublishChecklistFailure,
  type PublishMediaRow,
} from '@/domain/properties/publish'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * AURA-303 — ADMIN property reads + writes (all statuses).
 *
 * `server-only`: reached from the admin Route Handlers / Server Components, never the client.
 *
 * This is a SEPARATE file from `properties.dal.ts` ON PURPOSE (mirroring the AURA-203
 * `property-detail.dal.ts` split): the public listing DAL stays anon-only and provably free of
 * sensitive columns, while THIS file legitimately reads/writes the full admin column set
 * (agent_*, address, created_by/updated_by, …) under the admin's own session.
 *
 * SECURITY POSTURE (owner-approved):
 *   - All reads/writes use the ANON server client under the CALLER'S OWN authenticated session —
 *     NEVER the service role. The `properties_admin_*` RLS policies (gated on `public.is_admin()`,
 *     AURA-103) are the enforcement boundary; the route's `requireAdmin()` runs first, so the
 *     session here is always a verified admin. The only service-role path in AURA-303 is the
 *     separate `audit-logs.dal.ts`.
 *   - DELETE is never issued (no policy exists; hard delete is service-role-only, out of UI).
 *     Removal from public view is `publish_status = 'archived'` (D-32).
 *   - Explicit column allowlists — never `select('*')`. Business rules (slug/reference, publish
 *     checklist, lifecycle) live in `@/domain/properties/**`, not here.
 */

/** Internal error type so routes/pages can map to a generic 500 / error state. */
class AdminPropertiesDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminPropertiesDalError'
  }
}

/** The acting admin, threaded into ownership columns + audit. Resolved by the route guard. */
interface DalActor {
  userId: string | null
  role: string
}

/** Admin list columns (mirrors `AdminPropertyListRow`). NEVER `*`. */
const ADMIN_LIST_COLUMNS =
  'id, slug, reference_number, title_en, publish_status, transaction_type, market_type, ' +
  'property_type, availability_status, price, currency, price_visibility, is_featured, updated_at'

/** Admin detail / edit-form columns (mirrors `AdminPropertyDetailRow`). NEVER `*`. */
const ADMIN_DETAIL_COLUMNS =
  'id, slug, reference_number, publish_status, created_at, updated_at, published_at, archived_at, ' +
  'title, description, transaction_type, market_type, property_type, availability_status, ' +
  'price_visibility, rental_period, furnishing_status, price, currency, location_label, ' +
  'community, sub_community, building_name, address, external_map_url, bedrooms, bathrooms, ' +
  'parking, size_sqft, size_sqm, amenities, rera_number, permit_number, agent_name, agent_phone, ' +
  'agent_whatsapp, agent_email, developer_name, handover_date, completion_percentage, ' +
  'down_payment_amount, payment_plan_summary, is_featured'

/** Editable source columns the duplicate projection reads (mirrors `DuplicateSourceRow` + title). */
const ADMIN_DUPLICATE_COLUMNS =
  'title, description, transaction_type, market_type, property_type, availability_status, ' +
  'price_visibility, rental_period, furnishing_status, price, location_label, community, ' +
  'sub_community, building_name, address, external_map_url, bedrooms, bathrooms, parking, ' +
  'size_sqft, size_sqm, amenities, rera_number, permit_number, agent_name, agent_phone, ' +
  'agent_whatsapp, agent_email, developer_name, handover_date, completion_percentage, ' +
  'down_payment_amount, payment_plan_summary, is_featured'

/** Max insert attempts when resolving a unique slug / auto reference number under contention. */
const UNIQUE_RETRY_MAX = 8

type SupabaseError = { code?: string; message?: string; details?: string } | null

function isUniqueViolation(error: SupabaseError): boolean {
  return error?.code === '23505'
}

/** Classify which unique constraint a 23505 hit, so we know what to regenerate. */
function uniqueViolationTarget(error: SupabaseError): 'slug' | 'reference' | 'other' {
  const blob = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase()
  if (blob.includes('slug')) return 'slug'
  if (blob.includes('reference')) return 'reference'
  return 'other'
}

/** Extract the English title from a JSONB value. */
function titleEnOf(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = (value as Record<string, unknown>).en
    if (typeof en === 'string') return en
  }
  return ''
}

/**
 * Next auto reference sequence: 1 + the highest numeric suffix among existing
 * `${PREFIX}-NNNNN` reference numbers (admin reads all rows under RLS). Overrides that do not
 * match the prefix are ignored. Best-effort under contention — the insert retry is the final
 * uniqueness guarantee.
 */
async function nextReferenceSequence(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<number> {
  const { data, error } = await supabase
    .from('properties')
    .select('reference_number')
    .ilike('reference_number', `${REFERENCE_NUMBER_PREFIX}-%`)

  if (error) {
    throw new AdminPropertiesDalError(`Failed to read reference numbers: ${error.message}`)
  }

  let max = 0
  for (const row of (data ?? []) as { reference_number: string }[]) {
    const m = /-(\d+)$/.exec(row.reference_number)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max + 1
}

/** Read the minimal media facts the publish checklist needs (admin sees all media via RLS). */
async function fetchAdminCoverMedia(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  propertyId: string
): Promise<PublishMediaRow[]> {
  const { data, error } = await supabase
    .from('property_media')
    .select('media_type, is_cover, alt_text')
    .eq('property_id', propertyId)

  if (error) {
    throw new AdminPropertiesDalError(`Failed to read property media: ${error.message}`)
  }
  return (data ?? []) as unknown as PublishMediaRow[]
}

/** Result of an admin list read. */
interface AdminListResult {
  items: AdminPropertyListItemDTO[]
  total: number
}

/** Validated admin list query (the route applies pagination defaults + the status filter). */
interface AdminListQuery {
  page: number
  limit: number
  status?: PublishStatus
  search?: string
}

/**
 * List properties for the admin table — ALL statuses (draft/published/archived), newest
 * update first, with optional status filter + title search and pagination (cap applied by the
 * route). Admin RLS returns every row; anon never reaches this path.
 */
export async function listAdminProperties(query: AdminListQuery): Promise<AdminListResult> {
  const supabase = await createSupabaseServerClient()

  let builder = supabase.from('properties').select(ADMIN_LIST_COLUMNS, { count: 'exact' })

  if (query.status) {
    builder = builder.eq('publish_status', query.status)
  }
  if (query.search) {
    // Sanitise to a safe ILIKE term (drop wildcard/filter metacharacters), then match title_en.
    const term = query.search.replace(/[%_,()\\*]/g, ' ').trim()
    if (term) builder = builder.ilike('title_en', `%${term}%`)
  }

  builder = builder.order('updated_at', { ascending: false }).order('id', { ascending: true })

  const from = (query.page - 1) * query.limit
  const { data, count, error } = await builder.range(from, from + query.limit - 1)

  if (error) {
    throw new AdminPropertiesDalError(`Failed to list admin properties: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as AdminPropertyListRow[]
  return { items: rows.map(toAdminListItem), total: count ?? 0 }
}

/** Load a single property (any status) for the admin edit form, or null when not found. */
export async function getAdminPropertyById(id: string): Promise<AdminPropertyDetailDTO | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('properties')
    .select(ADMIN_DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new AdminPropertiesDalError(`Failed to load admin property: ${error.message}`)
  }
  if (!data) return null

  return toAdminPropertyDetail(data as unknown as AdminPropertyDetailRow)
}

/** Build the create insert: validated editable fields + resolved slug/reference + ownership. */
function buildCreatePayload(
  input: PropertyCreateInput,
  args: { slug: string; reference_number: string; actor: DalActor }
): Record<string, unknown> {
  // Drop the optional override key — the resolved `reference_number` is set explicitly below.
  const { reference_number: _ignored, ...fields } = input
  void _ignored
  return {
    ...fields,
    slug: args.slug,
    reference_number: args.reference_number,
    publish_status: 'draft',
    created_by: args.actor.userId,
    updated_by: args.actor.userId,
  }
}

type CreateAdminPropertyResult =
  | { ok: true; id: string; slug: string; reference_number: string; publish_status: PublishStatus }
  | { ok: false; reason: 'reference_conflict' }

/**
 * Create a DRAFT property. Slug is derived from `title.en` (collision-suffixed); the reference
 * number is auto-generated (`AUTEX-NNNNN`) unless the admin supplied an override. Unique
 * conflicts are resolved by retry for AUTO slug/reference; an OVERRIDE collision is a safe
 * validation error (`reference_conflict`) rather than silently changing the admin's value.
 */
export async function createAdminProperty(
  input: PropertyCreateInput,
  actor: DalActor
): Promise<CreateAdminPropertyResult> {
  const supabase = await createSupabaseServerClient()

  const overrideRef = input.reference_number
  const baseSlug = slugifyTitleEn(input.title.en) // schema guarantees this is non-empty
  let slugN = 1
  let refSeq = overrideRef ? 0 : await nextReferenceSequence(supabase)

  for (let attempt = 0; attempt < UNIQUE_RETRY_MAX; attempt++) {
    const slug = withSlugSuffix(baseSlug, slugN)
    const reference_number = overrideRef ?? formatReferenceNumber(refSeq)
    const payload = buildCreatePayload(input, { slug, reference_number, actor })

    const { data, error } = await supabase
      .from('properties')
      .insert(payload)
      .select('id, slug, reference_number, publish_status')
      .single()

    if (!error && data) {
      const row = data as unknown as {
        id: string
        slug: string
        reference_number: string
        publish_status: PublishStatus
      }
      return { ok: true, ...row }
    }

    if (isUniqueViolation(error)) {
      const target = uniqueViolationTarget(error)
      if (target === 'slug') {
        slugN++
        continue
      }
      if (target === 'reference') {
        if (overrideRef) return { ok: false, reason: 'reference_conflict' }
        refSeq++
        continue
      }
    }

    throw new AdminPropertiesDalError(
      `Failed to create property: ${error?.message ?? 'unknown error'}`
    )
  }

  throw new AdminPropertiesDalError(
    'Failed to create property: could not resolve a unique slug/reference'
  )
}

/** Merge the current DTO with a pending patch into the publish checklist candidate. */
function mergeForChecklist(
  current: AdminPropertyDetailDTO,
  fields: Partial<PropertyUpdateInput>
): PublishCandidate {
  const has = <K extends keyof PropertyUpdateInput>(k: K) => k in fields
  const get = <K extends keyof AdminPropertyDetailDTO>(
    k: K,
    patchKey: keyof PropertyUpdateInput
  ) => (has(patchKey) ? (fields as Record<string, unknown>)[patchKey as string] : current[k])

  return {
    title: has('title') ? fields.title : current.title,
    description: has('description') ? fields.description : current.description,
    transaction_type: get('transaction_type', 'transaction_type') as string,
    market_type: get('market_type', 'market_type') as string,
    property_type: get('property_type', 'property_type') as string,
    availability_status: get('availability_status', 'availability_status') as string,
    price_visibility: get('price_visibility', 'price_visibility') as string,
    rental_period: get('rental_period', 'rental_period') as string | null,
    price: get('price', 'price') as number | null,
    location_label: get('location_label', 'location_label') as string,
    bedrooms: get('bedrooms', 'bedrooms') as number | null,
    developer_name: get('developer_name', 'developer_name') as string | null,
    handover_date: get('handover_date', 'handover_date') as string | null,
    completion_percentage: get('completion_percentage', 'completion_percentage') as number | null,
    down_payment_amount: get('down_payment_amount', 'down_payment_amount') as number | null,
    payment_plan_summary: get('payment_plan_summary', 'payment_plan_summary') as string | null,
  }
}

type UpdateAdminPropertyResult =
  | { ok: true; published: boolean; status: PublishStatus }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'archived' }
  | { ok: false; reason: 'checklist'; failures: PublishChecklistFailure[] }

/**
 * Update editable fields on a draft/published property. Slug, reference number, and
 * publish_status are NEVER writable through here (A-06 immutability + D-32 lifecycle backstop
 * via `buildUpdatePayload`). When `patch.publish === true` on a DRAFT, the publish checklist
 * must pass (against the merged record + existing media) before the row transitions to
 * `published` with `published_at = now`. Editing an archived property is rejected; there is no
 * published → draft (unpublish) path in MVP.
 */
export async function updateAdminProperty(
  id: string,
  patch: PropertyUpdateInput,
  actor: DalActor
): Promise<UpdateAdminPropertyResult> {
  const supabase = await createSupabaseServerClient()

  const current = await getAdminPropertyById(id)
  if (!current) return { ok: false, reason: 'not_found' }
  if (!canEditProperty(current.publish_status)) return { ok: false, reason: 'archived' }

  const { publish, ...fields } = patch
  const wantPublish = publish === true && canPublish(current.publish_status)

  if (wantPublish) {
    const candidate = mergeForChecklist(current, fields)
    const media = await fetchAdminCoverMedia(supabase, id)
    const checklist = evaluatePublishChecklist(candidate, summarizeCoverMedia(media))
    if (!checklist.ok) {
      return { ok: false, reason: 'checklist', failures: checklist.failures }
    }
  }

  const updatePayload = buildUpdatePayload(fields, actor.userId)
  if (wantPublish) {
    updatePayload.publish_status = 'published'
    updatePayload.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('properties').update(updatePayload).eq('id', id)
  if (error) {
    throw new AdminPropertiesDalError(`Failed to update property: ${error.message}`)
  }

  return {
    ok: true,
    published: wantPublish,
    status: wantPublish ? 'published' : current.publish_status,
  }
}

type ArchiveAdminPropertyResult =
  | { ok: true; previousStatus: PublishStatus }
  | { ok: false; reason: 'not_found' | 'not_archivable' }

/**
 * Archive a property (the MVP way to remove it from public view — D-32). Sets
 * `publish_status = 'archived'` + `archived_at = now`. Allowed only from draft/published;
 * archiving an already-archived row is rejected. NEVER a hard delete.
 */
export async function archiveAdminProperty(
  id: string,
  actor: DalActor
): Promise<ArchiveAdminPropertyResult> {
  const supabase = await createSupabaseServerClient()

  const current = await getAdminPropertyById(id)
  if (!current) return { ok: false, reason: 'not_found' }
  if (!canArchive(current.publish_status)) return { ok: false, reason: 'not_archivable' }

  const { error } = await supabase
    .from('properties')
    .update({
      publish_status: 'archived',
      archived_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('id', id)

  if (error) {
    throw new AdminPropertiesDalError(`Failed to archive property: ${error.message}`)
  }
  return { ok: true, previousStatus: current.publish_status }
}

type DuplicateAdminPropertyResult =
  | { ok: true; id: string; slug: string; reference_number: string }
  | { ok: false; reason: 'not_found' }

/**
 * Duplicate a property as a NEW DRAFT: copy editable fields, mint a new slug + reference
 * number, force `publish_status = 'draft'`, and do not copy `views_count`/timestamps/featured
 * (API_SPEC). The original is untouched.
 */
export async function duplicateAdminProperty(
  id: string,
  actor: DalActor
): Promise<DuplicateAdminPropertyResult> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('properties')
    .select(ADMIN_DUPLICATE_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new AdminPropertiesDalError(`Failed to load property for duplication: ${error.message}`)
  }
  if (!data) return { ok: false, reason: 'not_found' }

  const source = data as unknown as DuplicateSourceRow
  const baseSlug = slugifyTitleEn(titleEnOf(source.title)) || 'property'
  let slugN = 2 // a duplicate always needs a NEW slug, so begin suffixing at -2
  let refSeq = await nextReferenceSequence(supabase)

  for (let attempt = 0; attempt < UNIQUE_RETRY_MAX; attempt++) {
    const slug = withSlugSuffix(baseSlug, slugN)
    const reference_number = formatReferenceNumber(refSeq)
    const payload = buildDuplicateInsert(source, {
      slug,
      reference_number,
      actorUserId: actor.userId,
    })

    const { data: created, error: insertError } = await supabase
      .from('properties')
      .insert(payload)
      .select('id, slug, reference_number')
      .single()

    if (!insertError && created) {
      return {
        ok: true,
        ...(created as unknown as { id: string; slug: string; reference_number: string }),
      }
    }

    if (isUniqueViolation(insertError)) {
      const target = uniqueViolationTarget(insertError)
      if (target === 'slug') {
        slugN++
        continue
      }
      if (target === 'reference') {
        refSeq++
        continue
      }
    }

    throw new AdminPropertiesDalError(
      `Failed to duplicate property: ${insertError?.message ?? 'unknown error'}`
    )
  }

  throw new AdminPropertiesDalError(
    'Failed to duplicate property: could not resolve a unique slug/reference'
  )
}
