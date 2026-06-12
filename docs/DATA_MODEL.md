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
| `image_url` | text? | Nullable. |
| `is_active` | bool | Default true. |
| `sort_order` | int | Display order. |
| `created_at` | timestamptz | Auto. |
| `updated_at` | timestamptz | Auto. |

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

**Minimum audited actions:** `property_created`, `property_updated`, `property_published`, `property_archived`, `lead_status_updated`, `lead_archived`, `lead_exported`, `settings_updated`, `legal_page_created`, `legal_page_published`, `legal_page_archived`, `area_created`, `area_updated`, `admin_access_denied`.

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
