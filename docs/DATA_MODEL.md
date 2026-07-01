# AURA — Data Model

**Source:** Pack §11  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`  
**Carry-forward fixes applied:** CF-2 (storage wording), CF-3 (slug immutability A-06, AED-only A-11)

---

## Hard Rule

Do not create:
- `clients` table
- `client_id` column
- Tenant isolation model
- Cross-client access model

These are merge blockers (D-05).

---

## MVP Tables

- `user_profiles`
- `properties`
- `property_media`
- `property_stakeholders`
- `areas`
- `leads`
- `whatsapp_clicks`
- `settings`
- `legal_pages`
- `audit_logs`
- `rate_limits` (D-51)

---

## `user_profiles`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Linked to Supabase Auth user. |
| `role` | enum | `super_admin / client_admin`. Non-MVP roles not allowed. |
| `full_name` | text | Required. |
| `avatar_url` | text? | Nullable. |
| `created_at` | timestamptz | Auto. |
| `updated_at` | timestamptz | Auto. |

---

## `properties`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `reference_number` | text UNIQUE | Auto-generated; optional admin override; uniqueness mandatory (D-47). |
| `slug` | text UNIQUE | Derived from `title->>'en'`; collision-suffixed; **immutable after publish** (A-06). |
| `title` | JSONB | i18n-ready; `en` key required before publish. |
| `description` | JSONB | i18n-ready; `en` key required before publish. |
| `price` | numeric? | Nullable only when `price_visibility = price_on_application`. |
| `currency` | text | Default `AED`. AED-only display in MVP; no FX conversion (A-11). |
| `price_visibility` | enum | `visible / price_on_application` (D-48). |
| `transaction_type` | enum | `sale / rent` (D-36). |
| `market_type` | enum | `ready / off_plan` (D-36). |
| `property_type` | enum | `apartment / villa / townhouse / penthouse / office / plot / retail / warehouse` (D-36). |
| `availability_status` | enum | `available / reserved / sold / rented / unavailable` (D-36). |
| `rental_period` | enum? | `yearly / monthly / weekly / daily / null`; required for rent where applicable. |
| `publish_status` | enum | `draft / published / archived` (D-32, D-36). |
| `area_id` | UUID FK? | FK to `areas`. |
| `community` | text? | Dubai area/community label. |
| `sub_community` | text? | Sub-community. |
| `building_name` | text? | Building name. |
| `location_label` | text | Public location display. |
| `address` | text? | Internal; avoid overexposing private owner address. |
| `external_map_url` | text? | Optional map link (MVP; full Google Maps is out of MVP, D-49). |
| `bedrooms` | int? | Nullable for office, plot; required for relevant residential types (D-09). |
| `bathrooms` | int? | Nullable. |
| `parking` | int? | Nullable. |
| `size_sqft` | numeric | Required. |
| `size_sqm` | numeric? | Optional/derived. |
| `furnishing_status` | enum | `furnished / semi_furnished / unfurnished / unknown`. |
| `amenities` | JSONB | Array of amenity strings. |
| `rera_number` | text? | Demo-safe; real production requires client/legal approval. |
| `permit_number` | text? | Demo-safe; real production requires client/legal approval. |
| `agent_name` | text? | Contact override (D-13). |
| `agent_phone` | text? | Contact override. |
| `agent_whatsapp` | text? | Contact override. |
| `agent_email` | text? | Contact override. |
| `developer_name` | text? | Off-plan optional; show only when `market_type = off_plan` (D-36 fix). |
| `handover_date` | date? | Off-plan optional. |
| `completion_percentage` | int? | Off-plan optional. |
| `down_payment_amount` | numeric? | Off-plan optional. |
| `payment_plan_summary` | text? | Off-plan optional. |
| `is_featured` | bool | Default false. |
| `views_count` | int? | Optional aggregate. |
| `created_by` | UUID FK? | Nullable FK to admin user. |
| `updated_by` | UUID FK? | Nullable FK to admin user. |
| `created_at` | timestamptz | Auto. |
| `updated_at` | timestamptz | Auto. |
| `published_at` | timestamptz? | Set when published. |
| `archived_at` | timestamptz? | Set when archived. |

**Publish validation rules:**
- Valid slug/reference uniqueness
- `publish_status = published` only when required fields are complete
- `price` present unless `price_visibility = price_on_application`
- `rental_period` present for rental listings where public pricing cadence is needed
- `bedrooms` required only for relevant residential types
- At least one cover image with alt text
- No public exposure of internal stakeholders unless explicitly public
- Off-plan fields displayed only when `market_type = off_plan`

> **AURA-303 lifecycle (merged `a6cb178`):** the publish checklist above is enforced at `draft → published` (pure logic in `src/domain/properties/publish.ts`). The MVP lifecycle is one-way — `draft → published → archived`. **There is no `published → draft` (unpublish) path**; archiving (`publish_status = archived`, the MVP way to remove a listing from public view, D-32) is the way to take a published property out of public view. **No hard delete** is exposed in the UI or API (no `DELETE` endpoint, no DELETE RLS policy on `properties`). The slug is immutable after publish (A-06); the reference number defaults to `AUTEX-NNNNN` with an optional validated override (A-05 / D-47). Media upload is **not** part of AURA-303 — the cover-image rule reads existing `property_media` rows only (upload is AURA-304).

---

## `property_media`

MVP: images and floorplan images only. Native video, 360, and virtual tours are out of MVP (D-41).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `property_id` | UUID FK | FK to `properties`. |
| `url` | text | **Public CDN URL in MVP; signed URLs deferred** (§12.4 posture; see limitation note). |
| `storage_path` | text | Storage object path; UUID-based to prevent enumeration. |
| `media_type` | enum | `image / floorplan`. |
| `order_index` | int | Sort order. |
| `is_cover` | bool | One cover required before publish. |
| `alt_text` | text | Required before publish. |
| `width` | int? | Nullable. |
| `height` | int? | Nullable. |
| `size_bytes` | int | Upload validation; max 10MB default. |
| `created_at` | timestamptz | Auto. |

**Known limitation:** CDN revocation for archived media is not guaranteed without signed URLs. A caller who retained the URL path may still fetch the asset after archival. Full revocation requires signed URLs, deferred out of MVP and documented at handover.

**Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

> **AURA-304 media lifecycle (merged `631bd29`):** the admin **upload / update / delete** lifecycle for `property_media` is now implemented. The existing `property_media` table was **reused — no migration was added**, and no Supabase config change. `POST` creates a storage object + a `property_media` row; `PATCH` edits `alt_text` and/or `is_cover`; `DELETE` removes the row **and** the storage object. Storage paths are **server-built and UUID-based** (extension derived from MIME; original filename never trusted). The **single-cover rule is enforced in app logic** (not a DB constraint), as are floorplan-cannot-be-cover and image-only-cover; deleting the cover does **not** auto-pick another (the publish checklist re-blocks publish until another cover image with alt text exists). Storage writes use a **request-scoped authenticated admin Supabase client + existing RLS — no service role**. Public media read stays **published-parent-only** (the AURA-103 anon RLS policy); draft/archived property media is not public. The **public-read bucket CDN-revocation gap** (a retained object URL stays fetchable after unpublish/archive) remains the deferred signed-URL/CDN follow-up. **Future hardening (Opus follow-up, not implemented):** a DB-level single-cover guarantee — e.g. a partial unique index on `(property_id) where is_cover` — could replace the app-level rule if multi-admin write concurrency becomes a concern.

---

## `property_stakeholders`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `property_id` | UUID FK | FK to `properties`. |
| `name` | text | Required. |
| `type` | enum | `developer / owner / seller / landlord / sales_partner / exclusive_agent`. |
| `phone` | text? | Internal by default. |
| `email` | text? | Internal by default. |
| `whatsapp` | text? | Internal by default. |
| `registration_or_license` | text? | Nullable. |
| `internal_notes` | text? | Admin-only. |
| `visibility` | enum | `internal_only / public`. Default `internal_only` (D-16). |
| `created_at` | timestamptz | Auto. |
| `updated_at` | timestamptz | Auto. |

---

## `areas`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `slug` | text UNIQUE | Unique. |
| `name` | JSONB | i18n-ready. |
| `description` | JSONB | i18n-ready. |
| `image_url` | text? | Nullable. Stores the **representative area/community image public URL** (AURA-305). |
| `is_active` | bool | Default true. |
| `sort_order` | int | Display order. Editable in the admin form (AURA-305). |
| `created_at` | timestamptz | Auto. |
| `updated_at` | timestamptz | Auto. |

> **AURA-305 areas admin (merged `aee1fda`):** the admin **add / edit / deactivate / reactivate** lifecycle for `areas` is now implemented (**no hard delete**). The existing `areas` table was **reused — no migration was added**, and no Supabase config change. `areas.image_url` now stores the **representative area/community image public URL**; the image is uploaded to the **existing `property-media` bucket** under the **server-built, UUID-only** path `areas/{area_id}/{image_id}.{ext}` (extension derived from MIME; original filename never trusted; `upsert: false`) — **there is no area media table, no gallery, and no multi-upload.** The **slug is editable only at create** (`PATCH` cannot change it). **Area property counts** (`totalProperties`, `publishedProperties`) are **computed on read** from `properties.area_id` + `publish_status` for the admin surface only — **not stored** and **never exposed publicly**. Area CRUD + image upload run under a **request-scoped authenticated admin Supabase client + existing RLS — no service role** (the only service-role path remains the AURA-303 audit writer). Public reads stay **active-only** (the AURA-103 anon RLS policy); inactive areas are not public. The **public-read bucket CDN-revocation gap** (a known UUID image URL stays fetchable after deactivation; old-image cleanup is best-effort because only the public URL is stored) remains the deferred signed-URL / object-revocation / storage-GC follow-up.

---

## `leads`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `property_id` | UUID FK? | Nullable FK to `properties`. |
| `name` | text | Required. |
| `phone` | text | Required; validated via libphonenumber-js. |
| `email` | text? | Optional; validated. |
| `message` | text? | Optional. |
| `preferred_contact_method` | enum | `phone / whatsapp / email`. |
| `source` | enum | `homepage / listing / property_detail / contact_page / whatsapp_cta / sales_demo`. |
| `selected_goal` | text? | Nullable (e.g., Buy, Rent). |
| `selected_area` | text? | Nullable. |
| `selected_budget` | text? | Nullable. |
| `selected_bedrooms` | text? | Nullable. |
| `selected_property_type` | text? | Nullable. |
| `language` | text | Default `en`. |
| `status` | enum | Typed by `lead_status` (D-37): `new / contacted / qualified / unqualified / won / lost / archived`. **Do not change to free-form text.** |
| `priority` | enum | `low / normal / high`; default `normal`. |
| `notes` | text? | Admin-only. |
| `archived_at` | timestamptz? | Soft delete/archive timestamp. |
| `created_at` | timestamptz | Auto. |
| `updated_at` | timestamptz | Auto. |

---

## `whatsapp_clicks`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `source` | text | Required. |
| `property_id` | UUID FK? | Nullable FK. |
| `selected_goal` | text? | Nullable. |
| `selected_area` | text? | Nullable. |
| `selected_budget` | text? | Nullable. |
| `selected_bedrooms` | text? | Nullable. |
| `language` | text? | Default `en`. |
| `created_at` | timestamptz | Auto. |

**Must not store:** IP address, user personal data, phone number, email, full user agent fingerprint (D-18).

---

## `settings`

Key-value store for admin-editable operational content:
- `key TEXT UNIQUE` — one row per setting
- `value JSONB` — typed value
- `updated_by` UUID FK — FK to admin user
- `updated_at` timestamptz

Rules:
- Allowed keys enforced via server-side allowlist; unknown/unauthorized keys rejected at API layer
- Each allowed key has a corresponding per-key Zod schema for value validation
- Changes are audit-logged per D-38

> **AURA-306 settings admin (merged `86e8b36`, PR #49):** the admin **read + update** path for `settings` is now implemented. The existing `settings` table was **reused — no migration was added**, and no Supabase config change. The schema is unchanged: `key` (text PK) + `value` (jsonb) + `updated_by` (uuid FK, server-set to the acting admin) + `updated_at` (timestamptz, DB-managed via the `settings_set_updated_at` trigger). The editable allowlist is **exactly the seven existing public footer keys** (`agency_name`, `agency_phone`, `agency_email`, `agency_whatsapp`, `agency_address`, `footer_tagline`, `social_links`) — the same set the public projection surfaces; unknown / deferred keys are rejected by the strict per-key Zod schema before any write. `PATCH` is a **partial batch** (one or more allowed keys; empty patch rejected) and writes via an **`upsert(onConflict: 'key')`**. Admin GET/PATCH run under a **request-scoped authenticated admin Supabase client + RLS — no service role** (the existing public safe selector keeps the service role; the audit writer keeps the service role). **There is no settings DELETE path** (no DELETE policy on `settings`; the DAL issues no row deletion). Public reads stay through the **existing AURA-201 server selector** (`getPublicSettings`, projected through the public allowlist) — the public footer reflects an updated value on the next request (no cache/revalidation system; `force-dynamic` layout). Audit: `settings_updated` (entity type `settings`; metadata carries the changed key **names** only — never phone/email/WhatsApp/address values).

---

## `legal_pages`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `slug` | text | `privacy / terms`. |
| `title` | JSONB | i18n-ready. |
| `content` | JSONB | Safe Markdown or controlled rich text. **Never raw HTML.** |
| `version` | int | Increments on each publish. |
| `effective_date` | date | Required. |
| `status` | enum | `draft / published / archived`. |
| `last_updated_by` | UUID FK | FK to admin user. |
| `created_at` | timestamptz | Auto. |
| `updated_at` | timestamptz | Auto. |
| `published_at` | timestamptz? | Set on publish. |

> **AURA-307 legal admin (merged `74da365`, PR #51) — Phase 3 exit gate:** the admin **create / edit / publish / archive** path for `legal_pages` is now implemented. The existing table was **reused — no migration was added**, and no Supabase config change. The **row-per-version** model uses the pre-existing partial unique index `legal_pages(slug)` WHERE `status = 'published'` (at most one published row per slug): publishing **archives the currently published row for the same slug first**, then promotes the selected draft with `version = max(existing version for slug) + 1` and `published_at = now()`. Only `draft` rows are editable; `slug` is set at create only (allowlist `privacy` / `terms`) and never updated; `title` / `content` are i18n JSONB (English-only in MVP) and `content` is **Markdown only — raw/unsafe HTML is rejected at write time** (never stored). Admin reads/writes run under a **request-scoped authenticated admin Supabase client + RLS — no service role** (`src/dal/legal.dal.ts`; the public `getPublishedLegalPage` selector is intact; the audit writer keeps the service role). **There is no legal DELETE path** (no DELETE policy on `legal_pages`; the DAL issues no row deletion — removal is archive only). Audit: `legal_page_created` / `legal_page_published` / `legal_page_archived` (entity type `legal_page`; metadata carries slug / status transition / version only — never the legal title or body). The publish + audit writes are **non-atomic (owner-accepted; fail loud, tested)** — no DB RPC.

---

## `audit_logs`

Append-only. Public cannot read or write (D-38).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `actor_user_id` | UUID FK? | Nullable FK to admin/auth user. |
| `actor_role` | text | `super_admin / client_admin / system`. |
| `action` | text | Controlled action string (e.g., `property_published`). |
| `entity_type` | text | `property / lead / legal_page / settings / area / media / auth / export`. |
| `entity_id` | text? | Nullable entity UUID/string. |
| `before_snapshot` | JSONB? | Nullable; avoid unnecessary PII. |
| `after_snapshot` | JSONB? | Nullable; avoid unnecessary PII. |
| `metadata` | JSONB | Sanitized context. |
| `created_at` | timestamptz | Auto. |

**Minimum audited actions:** `property_created`, `property_updated`, `property_published`, `property_archived`, `property_duplicated`, `lead_status_updated`, `lead_archived`, `lead_exported`, `settings_updated`, `legal_page_created`, `legal_page_published`, `legal_page_archived`, `area_created`, `area_updated`, `admin_access_denied`.

> **AURA-303 (merged `a6cb178`):** the property lifecycle is now implemented via the admin write DAL (`src/dal/admin-properties.dal.ts`, caller session + RLS) and the server-only audit writer (`src/dal/audit-logs.dal.ts`, service-role, insert-only). `property_created`, `property_updated`, `property_published`, `property_archived`, and `property_duplicated` are all emitted (`property_duplicated` added to the list above). The writer throws on insert failure so a missing audit is loud, never silently swallowed. **Known ordering caveat:** the property mutation commits before the audit insert (no shared transaction yet); an audit-insert failure surfaces as a generic 500 but does not roll back the committed change — a future hardening may move both into one transaction/RPC.

---

## `rate_limits`

Per D-51: raw IP is never stored. Keys are `salted-hash(IP + route)` computed server-side.

| Field | Type | Notes |
|---|---|---|
| `key_hash` | text | Server-computed `salted-hash(IP + route)`. |
| `route` | text | The rate-limited route. |
| `count` | int | Request count in the current window. |
| `window_start` | timestamptz | Start of the current window. |
| `expires_at` | timestamptz | 24-hour TTL; expired rows removed by scheduled cleanup. |

---

## Indexing and Uniqueness Contract

All of the following are required in the initial migration. A migration that omits them is a merge blocker (§11.12).

**Unique constraints:**
- `properties.slug` UNIQUE
- `properties.reference_number` UNIQUE
- `areas.slug` UNIQUE
- `legal_pages(slug)` partial UNIQUE WHERE `status = 'published'`

**Composite indexes on `properties`:**
- `(publish_status, is_featured)`
- `(publish_status, created_at DESC)`

**FK indexes:**
- `property_media(property_id)`
- `property_stakeholders(property_id)`
- `leads(property_id)`
- `whatsapp_clicks(property_id)`
- `audit_logs(entity_type, entity_id)`

**Generated column:**
- `properties.title_en` generated as `(title->>'en')` (stored), with GIN tsvector search index for full-text search

---

## Data Lifecycle

| Entity | Create | Read | Update | Archive/Soft Delete | Hard Delete |
|---|---|---|---|---|---|
| Property | Admin | Public if published; admin all | Admin | `publish_status = archived` | Outside normal UI; super_admin only |
| Lead | Public insert | Admin only | Admin status/notes | `status = archived`, `archived_at` | Outside normal UI only |
| WhatsApp click | Public insert | Admin aggregate only | No normal update | Retention policy (later) | Maintenance/manual only |
| Legal page | Admin draft | Public latest published; admin all | Admin draft/publish | Archive versions | Avoid unless manual |
| Area | Admin | Public if active | Admin | `is_active = false` | Avoid unless manual |
| Settings | Admin | Public through safe selectors only | Admin allowed keys | N/A | N/A |
| User profile | Super/admin setup | Admin auth context only | Super admin | Disable access | Manual |
| Audit log | Server-side audited action | Admin/system only | Append-only | Retention policy (later) | Avoid/manual only |
