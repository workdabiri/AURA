-- AURA-105 — Storage bucket + media-path policies for property media.
--
-- Authority: docs/TASKS_Project.md (AURA-105), docs/SECURITY_BASELINE.md (Storage Rules),
--            docs/ARCHITECTURE.md (storage tradeoff), docs/DATA_MODEL.md (property_media),
--            docs/DECISION_LOG.md (D-04, D-41, A-14, A-15/Q-04),
--            .claude/rules/no-public-sensitive-reads.md, .claude/rules/no-service-role-in-client.md.
--
-- Builds on AURA-102 (property_media table) and AURA-103 (table RLS + public.is_admin()).
-- This migration owns the SUPABASE STORAGE layer for property media:
--   * the `property-media` bucket (public-read, 10MB cap, image MIME allowlist), and
--   * storage.objects RLS policies that restrict write/list to admins.
--
-- Scope (AURA-105 task spec):
--   * Create/reconcile the `property-media` bucket
--       public = true; file_size_limit = 10485760 (10 MiB);
--       allowed_mime_types = image/jpeg, image/png, image/webp.
--   * storage.objects policies for `bucket_id = 'property-media'`, admin-only
--     (public.is_admin()): SELECT/list, INSERT, UPDATE, DELETE.
--   * NO anon policy of any kind on storage.objects (no anon list/select/insert/update/delete).
--
-- NOT in scope:
--   * Upload route / UI / admin UI         -> AURA-304 / Phase 3.
--   * Signed URLs (CDN revocation)         -> deferred out of MVP (documented limitation).
--   * Service-role wiring for media writes  -> AURA-304 may choose a request-scoped admin
--                                              client or service-role AFTER requireAdmin().
--   * Video / 360 / virtual tours          -> out of MVP (D-41).
--   * rate_limits cleanup job / pg_cron    -> AURA-106.
--
-- Access model (locked):
--   * Public READ is served by the bucket `public = true` flag (direct object fetch by the
--     UUID-based path via the CDN). Which media exist for which property is DISCOVERED only
--     through the EXISTING table RLS on public.property_media (anon sees rows for published
--     properties only — AURA-103). We add NO anon SELECT policy on storage.objects, so anon
--     CANNOT LIST/enumerate bucket objects.
--   * WRITE/UPDATE/DELETE/LIST on storage.objects require an authenticated admin
--     (public.is_admin() => super_admin or client_admin, AURA-103/AURA-104). service_role
--     keeps its built-in BYPASSRLS access (used later, server-side, by AURA-304 if chosen).
--
-- KNOWN LIMITATION (documented, deferred): because the bucket is public-read, an object whose
-- UUID path is already known/retained may still be fetched directly from the CDN even after its
-- parent property is unpublished/archived. The table RLS hides the ROW, not the OBJECT. Full
-- revocation requires signed URLs, deferred out of MVP (docs/ARCHITECTURE.md, docs/DATA_MODEL.md,
-- docs/SECURITY_BASELINE.md).
--
-- Media path strategy (enforced in src/domain/properties/media.ts; mirrored here for context):
--   properties/{property_id}/{media_type}/{media_id}.{ext}
--     - property_id, media_id : UUID (server-generated; NEVER a user filename)
--     - media_type            : 'image' | 'floorplan'
--     - ext                   : derived from MIME (image/jpeg->jpg, image/png->png, image/webp->webp)
--
-- ---------------------------------------------------------------------------------
-- ROLLBACK (down) PATH — run in this order to fully revert THIS migration:
--   DROP POLICY IF EXISTS property_media_objects_admin_select ON storage.objects;
--   DROP POLICY IF EXISTS property_media_objects_admin_insert ON storage.objects;
--   DROP POLICY IF EXISTS property_media_objects_admin_update ON storage.objects;
--   DROP POLICY IF EXISTS property_media_objects_admin_delete ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'property-media';  -- only when it holds no objects
-- RLS on storage.objects is managed by Supabase and stays ENABLED throughout.
-- ---------------------------------------------------------------------------------

begin;

-- =================================================================================
-- 1. BUCKET — create or reconcile `property-media` (idempotent via ON CONFLICT).
--
-- public = true            : direct CDN object fetch by path (no signed URL in MVP).
-- file_size_limit = 10 MiB : 10485760 bytes (A-15 / Q-04) — defence-in-depth on top of the
--                            app-layer validation contract (src/domain/properties/media.ts).
-- allowed_mime_types       : image/jpeg, image/png, image/webp ONLY (A-14; D-41 images +
--                            floorplans, NO video / 360 / virtual tours).
-- =================================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- =================================================================================
-- 2. storage.objects POLICIES — admin-only write/list, scoped to the bucket.
--
-- Supabase keeps RLS ENABLED on storage.objects. With no permissive policy, anon AND
-- authenticated are denied while service_role bypasses RLS. We add admin-only policies for
-- this bucket and DELIBERATELY add NO anon policy, so anon can neither list nor mutate
-- objects. (Public READ of a published object is handled by the bucket `public` flag, not by
-- an anon SELECT policy on storage.objects.)
--
-- `create policy` has no IF NOT EXISTS; drop-then-create keeps this migration idempotent.
-- =================================================================================

drop policy if exists property_media_objects_admin_select on storage.objects;
drop policy if exists property_media_objects_admin_insert on storage.objects;
drop policy if exists property_media_objects_admin_update on storage.objects;
drop policy if exists property_media_objects_admin_delete on storage.objects;

-- admin SELECT / list (the admin app may enumerate objects in this bucket).
create policy property_media_objects_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'property-media' and public.is_admin());

-- admin INSERT (upload).
create policy property_media_objects_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-media' and public.is_admin());

-- admin UPDATE (replace / move within the bucket).
create policy property_media_objects_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'property-media' and public.is_admin())
  with check (bucket_id = 'property-media' and public.is_admin());

-- admin DELETE (remove an object alongside its property_media row).
create policy property_media_objects_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-media' and public.is_admin());

commit;
