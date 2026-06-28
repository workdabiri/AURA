# AURA — API Specification

**Source:** Pack §13  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`  
**Carry-forward fix applied:** CF-3 — pagination server cap = 50 (A-07)

---

## Global Rules

All API routes must use:
- Zod request validation
- Typed response contracts
- Explicit auth and authorization rules
- Safe error responses (no stack traces; no internal details)
- Rate limiting where public write exists
- Audit/security logging where admin or sensitive data is involved

Pagination server cap: **50 results per page** (A-07). Clients requesting more will receive at most 50.

---

## Rate Limit Strategy

Rate-limit key = `salted-hash(IP + route)`, server-side only. Raw IP never stored (D-51).

| Route | Threshold |
|---|---|
| `POST /api/leads` | 5 requests / hour per key |
| `POST /api/whatsapp-clicks` | 30 requests / hour per key |
| Admin login / auth route | 5 requests / 15 min per key |

Table schema: `rate_limits(key_hash, route, count, window_start, expires_at)` — 24-hour TTL.

---

## Public API Endpoints

### `GET /api/properties`

Return published property listing results.

- **Auth:** Public
- **Authorization:** Published properties only (`publish_status = published`)
- **Query params:** `transaction_type`, `market_type`, `property_type`, `area`, `community`, `min_price`, `max_price`, `bedrooms`, `availability_status`, `search`, `sort`, `page`, `limit` (max 50)
- **Response:** Paginated property cards
- **Errors:** `400` invalid filters; `400` invalid pagination
- **Rate limit:** Normal public read limit
- **Test cases:** Draft/archived hidden; invalid filters rejected; pagination cap = 50 enforced

---

### `GET /api/properties/featured`

Return featured published properties for homepage.

- **Auth:** Public
- **Authorization:** `publish_status = published AND is_featured = true`
- **Response:** Limited list of property cards
- **Test cases:** Unpublished featured property hidden

---

### `GET /api/properties/[slug]`

Return published property detail.

- **Auth:** Public
- **Authorization:** Published property only; 404 for draft/archived
- **Response:** Full public property detail, public media, allowed public stakeholder fields only
- **Errors:** `404` for missing/draft/archived
- **Test cases:** Internal stakeholders hidden; contact override works; off-plan fields shown only when `market_type = off_plan`

---

### `GET /api/areas`

Return active areas.

- **Auth:** Public
- **Authorization:** `is_active = true` only
- **Response:** Area cards/list
- **Test cases:** Inactive areas hidden

---

### `GET /api/legal/[slug]`

Return active published legal page.

- **Auth:** Public
- **Authorization:** Latest `status = published` version only
- **Response:** Safe-renderable legal content (Markdown/sanitized rich text)
- **Errors:** `404` if no published page
- **Test cases:** Draft pages hidden; archived versions not served as active

---

### `POST /api/leads`

Create visitor lead and trigger email notification.

- **Auth:** Public
- **Authorization:** Insert only; no read
- **Request body:**
  ```json
  {
    "name": "string (required)",
    "phone": "string (required, validated)",
    "email": "string? (optional, validated)",
    "message": "string? (max 1000 chars)",
    "source": "lead_source enum (required)",
    "property_id": "uuid? (optional)",
    "selected_goal": "string?",
    "selected_area": "string?",
    "selected_budget": "string?",
    "selected_bedrooms": "string?",
    "selected_property_type": "string?",
    "preferred_contact_method": "phone | whatsapp | email"
  }
  ```
- **Validation:** Zod + libphonenumber-js + max lengths + rate-limit check
- **Response:** `{ success: true, reference: string }` (non-sensitive)
- **Errors:** `400` validation error; `429` rate limit; `500` server error
- **Side effects:** Email notification via Resend (failure does not fail lead creation)
- **Test cases:** Valid lead inserts; invalid phone rejected; public cannot list leads; email failure does not fail lead

---

### `POST /api/whatsapp-clicks`

Track lightweight WhatsApp CTA click event.

- **Auth:** Public
- **Authorization:** Insert only; no read
- **Request body:**
  ```json
  {
    "source": "string (required)",
    "property_id": "uuid? (optional)",
    "selected_goal": "string?",
    "selected_area": "string?",
    "selected_budget": "string?",
    "selected_bedrooms": "string?",
    "language": "string? (default 'en')"
  }
  ```
- **Validation:** No PII fields accepted (no email, phone, IP)
- **Response:** `{ success: true }`
- **Errors:** `400` validation; `429` rate limit
- **Test cases:** Rejects email/phone/IP fields; public cannot read events

---

## Admin API Endpoints

All `/api/admin/*` routes require:
- Authenticated Supabase session
- `user_profiles.role IN ('super_admin', 'client_admin')`
- RLS compliance
- Audit log where state changes occur

---

### Properties

> **Status:** Implemented in **AURA-303** (merged `a6cb178`) — `GET/POST /api/admin/properties`, `PATCH /api/admin/properties/[id]`, `POST /api/admin/properties/[id]/duplicate`, and `PATCH /api/admin/properties/[id]/archive`. Every route calls `requireAdmin()` directly (both `super_admin` and `client_admin`; the `(protected)` layout guards pages, not Route Handlers). Property writes use the caller's own admin session + RLS (no service role); the only service-role path is the append-only audit-log write. **Media endpoints below (`…/media`) remain deferred to AURA-304 and are NOT implemented.**

#### `GET /api/admin/properties`
List all properties (all statuses).
- **Auth:** Admin
- **Response:** All draft/published/archived properties
- **Test cases:** Unauthenticated blocked; authenticated no-role blocked

#### `POST /api/admin/properties`
Create property draft.
- **Validation:** Zod; canonical taxonomy; bedrooms conditional; price visibility; rental period; `en` field required
- **Response:** Created property
- **Audit:** `property_created`
- **Test cases:** Invalid type/bedroom combo rejected; slug/reference uniqueness; no overloaded `status`

#### `PATCH /api/admin/properties/[id]`
Update property.
- **Validation:** Same as create + publish checklist if publishing
- **Audit:** `property_updated`, `property_published` if applicable
- **Test cases:** Publish checklist enforced; contact override validated

#### `POST /api/admin/properties/[id]/duplicate`
Duplicate property as draft.
- **Behavior:** Copy editable fields; new slug/reference; `publish_status = draft`; do not copy `views_count` or timestamps
- **Audit:** `property_duplicated`
- **Test cases:** Duplicate is draft; original unchanged

#### `PATCH /api/admin/properties/[id]/archive`
Archive property.
- **Behavior:** Set `publish_status = archived`, `archived_at = now()`
- **Audit:** `property_archived`
- **Test cases:** Archived property returns 404 publicly

#### `POST /api/admin/properties/[id]/media`
Upload/register property media. **(Deferred to AURA-304 — not implemented in AURA-303.)**
- **Validation:** `image/jpeg`, `image/png`, `image/webp` only; 10MB max; safe UUID-based storage path; alt text required
- **Test cases:** Unsupported file blocked; public upload blocked

#### `DELETE /api/admin/properties/[id]/media/[mediaId]`
Remove media from property.
- **Behavior:** Remove DB row + storage object if authorized
- **Test cases:** Only admin can remove; cover image consistency preserved

---

### Leads

#### `GET /api/admin/leads`
Admin lead list/search.
- **Query:** search, status, source, property_id, date range, page, limit (max 50)
- **Test cases:** Public blocked; no-role user blocked

#### `PATCH /api/admin/leads/[id]`
Update lead status/notes.
- **Validation:** Allowed `lead_status` values only
- **Audit:** `lead_status_updated`

#### `PATCH /api/admin/leads/[id]/archive`
Soft-archive lead.
- **Behavior:** Set `status = archived`, `archived_at = now()`
- **Audit:** `lead_archived`
- **Test cases:** Archived leads excluded by default admin filters unless explicitly requested

#### `GET /api/admin/leads/export`
Export leads (CSV or generated format).
- **Auth:** Admin; no public access
- **Audit:** `lead_exported`
- **Test cases:** Unauthenticated blocked; export respects filters

---

### Dashboard

#### `GET /api/admin/dashboard`
Return dashboard metrics.
- **Response:** Aggregate counts for properties, leads, WhatsApp, source metrics
- **Test cases:** Aggregate excludes archived where appropriate

---

### Settings

#### `GET /api/admin/settings`
Read editable settings.
- **Response:** Typed settings object (allowed keys only)

#### `PATCH /api/admin/settings`
Update allowed operational settings.
- **Validation:** Allowed keys only; per-key Zod schema
- **Audit:** `settings_updated`
- **Test cases:** Forbidden keys rejected; design architecture cannot be changed

---

### Legal Pages

#### `GET /api/admin/legal`
List all legal pages and versions.
- **Response:** All draft/published/archived versions

#### `POST /api/admin/legal`
Create legal draft/version.
- **Validation:** Slug must be `privacy` or `terms`; safe content only (no raw HTML)
- **Audit:** `legal_page_created`
- **Test cases:** Raw unsafe HTML rejected

#### `PATCH /api/admin/legal/[id]`
Update legal draft.
- **Validation:** Safe content only

#### `POST /api/admin/legal/[id]/publish`
Publish legal version.
- **Behavior:** Archive previous published version for same slug; publish selected version; increment `version`
- **Audit:** `legal_page_published`
- **Test cases:** Version increments; previous version archived

#### `POST /api/admin/legal/[id]/archive`
Archive legal version.
- **Audit:** `legal_page_archived`
- **Test cases:** Public active legal remains valid or 404 if none published

---

### Areas

#### `GET /api/admin/areas`
List all areas (active and inactive).

#### `POST /api/admin/areas`
Create area.
- **Validation:** Slug unique; `name` JSONB; `description` JSONB
- **Audit:** `area_created`

#### `PATCH /api/admin/areas/[id]`
Edit or deactivate area.
- **Behavior:** `is_active = false` for deactivate
- **Audit:** `area_updated`
- **Test cases:** Inactive area hidden publicly

---

## Error Response Format

```json
{
  "error": "human-readable message",
  "code": "ERROR_CODE"
}
```

No stack traces or internal details in responses. Log full details server-side.

---

## Auth Bootstrap

See `docs/ARCHITECTURE.md` §Auth/Authz Model. No public admin self-signup. First `super_admin` created via Supabase Auth manually + seed/admin script.
