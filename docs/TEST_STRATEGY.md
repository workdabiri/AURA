# AURA — Test Strategy

**Source:** Pack §16  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`  
**Carry-forward fix applied:** CF-3 — Test DB = Supabase CLI local stack, dev + CI Docker (A-02)

---

## Test DB Policy (A-02)

Test database = **Supabase CLI local stack**, running locally for development and via Docker in CI. Do not mock the database layer for DAL or integration tests. Mocking the DB creates false confidence and has caused prod regressions before (a mock/prod divergence can mask broken migrations). Unit tests mock only pure functions and domain logic.

---

## Test Layers

| Layer | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | Zod schemas, domain logic, validation, pure functions |
| DAL tests | Vitest + local Supabase | RLS rules, public/admin visibility, data access patterns |
| Integration tests | Vitest + local Supabase | API endpoint behavior, service interactions |
| E2E tests | Playwright | Critical user paths end-to-end |
| Smoke tests | Playwright | Fast pre-release sanity checks |
| Security negative tests | Vitest | Auth/RLS bypasses, PII rejection, access control |
| Performance tests | Lighthouse | LCP, CLS, PageSpeed scores |
| CLI checks | npm scripts | Lint, typecheck, format, deps, unused code |
| Manual QA | Human | Visual, UX, accessibility, cross-device |

---

## Unit Tests

Test (no DB required):
- Zod schemas for properties, leads, media, settings, legal pages
- Property publish validation logic
- Lead validation logic
- WhatsApp URL builder and routing priority logic
- sqft to sqm conversion
- Contact routing (override → agency fallback)
- Similar property logic
- Sales Demo Mode detection
- Rate-limit key hash computation (without actual secret)

---

## DAL Tests

Test against local Supabase:
- Public reads only published properties (`publish_status = published`)
- Draft/archived properties hidden from public reads
- Public cannot read leads
- Public cannot read WhatsApp analytics
- Public cannot read internal stakeholders (`visibility = internal_only`)
- Published legal pages are publicly readable
- Inactive areas hidden from public reads
- Media publicly readable only when property is published
- Admin can read all properties regardless of status
- Role check enforced: no-role session cannot access admin data

---

## Integration Tests

Test API route behavior against local Supabase:
- Lead submit → DB insert → email notification attempt (failure does not fail lead)
- Property publish → property appears in public listing
- Legal publish → version increments → old version archived
- Media upload → storage → gallery availability
- Settings update → public footer/contact reflects update
- WhatsApp click → DB event insert + analytics dispatch
- Area deactivate → area hidden from public reads
- Rate-limit trigger on repeated `POST /api/leads` submissions
- PII fields rejected from `POST /api/whatsapp-clicks`

---

## E2E Tests

Test with Playwright against local or staging deployment:
- Homepage loads (`/en`)
- `/` redirects to `/en`
- Hero filters work and persist into listing
- Property listing filters, search, sort work
- Property detail page loads with correct data
- Inquiry form submission works
- WhatsApp CTA click fires tracking event and opens correct URL
- Admin login flow
- Property CRUD (create, edit, publish, archive)
- Lead management (view, update status, archive)
- Legal pages (create draft, publish, verify version)
- Settings update (verify public footer reflects change)
- Sales Demo Mode (labels visible only with config + `?demo=sales`)
- Admin cannot bypass role check

---

## Smoke Tests

Fast tests for pre-release verification:
- `/` redirects to `/en`
- `/en` loads without error
- `/en/properties` loads
- A property detail page (`/en/properties/[slug]`) loads
- `/admin/login` loads
- Test lead can be submitted via `POST /api/leads`
- `/en/privacy` and `/en/terms` load
- Build succeeds (`npm run build`)

---

## Security Negative Tests

**Status (AURA-301):** the admin login + guard test suite now exists — unit (`admin-login` login
schema), security (`auth-guard`: server-only guard, `getUser` not `getSession`, no service-role in
client, no self-signup, role-guard wiring), integration (`admin-login`: login rate-limit rule +
allow/deny contract + live-DB gated own-row RLS read), and e2e/smoke (`/admin/login` login-only +
non-locale-prefixed, unauthenticated `/admin` → login, admin `noindex`). **Follow-up:** the
successful-login happy-path e2e is gated on `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI;
seeding an admin to run it in CI remains a tracked follow-up.

**Status (AURA-302):** the admin **dashboard shell** test suite now exists — unit (`admin-shell`:
CI-safe static render — exactly one `<main>` landmark, a labelled admin `<nav>` with links to all five
future sections, placeholder panels), security (`auth-guard` AURA-302 block: the dashboard lives under
the guarded `(protected)` group, **no unguarded `src/app/admin/dashboard/**`**, `/admin` redirects to
`/admin/dashboard`, and the admin UI imports no DAL/Supabase/services/service-role/next-intl/public-layout
components), and e2e/smoke (unauthenticated `/admin/dashboard` → `/admin/login`). **Follow-up:** the
full **authenticated** dashboard render e2e is gated on `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and
skipped in CI — the same seeded-admin happy-path follow-up as AURA-301.

**Status (AURA-303, merged `a6cb178`):** the admin **property CRUD + publish-checklist** test suite now exists across all layers — unit (`property-admin-domain`, `property-admin-schema`, `property-publish-checklist`: reference/slug rules, lifecycle predicates, the immutability backstop, taxonomy/off-plan schema, and every publish-checklist rule incl. bedrooms-by-type), security boundary (`admin-properties-boundary`: every route guarded via `requireAdmin` and **not** `requireSuperAdmin`; no service-role/DAL/Supabase in UI; no unguarded admin property page; no `DELETE` handler / no `.delete()`; audit DAL server-only + insert-only — plus the `property-detail-public-boundary` regression that anon cannot read draft/archived), integration (`admin-properties-api`: 401 unauth / 403 no-role / 400 validation / 409 reference-conflict / 400 publish-checklist / 409 archived-edit, and audit calls for created/updated/published/archived/duplicated, with DAL/auth/audit mocked), live-DB DAL (`admin-properties.dal`, gated `SUPABASE_LOCAL_TESTS=1`: admin reads all statuses, anon published-only, hard delete denied, admin cannot insert `audit_logs` directly — these ran live in CI's `db-tests` job), and e2e guard (`admin-properties`: unauthenticated `/admin/properties*` → `/admin/login`; the seeded-admin happy-path is gated/skipped in CI). **Follow-up:** add direct per-verb 401/403 integration assertions for `PATCH /api/admin/properties/[id]` and `POST /api/admin/properties/[id]/duplicate` (currently their auth boundary is proven structurally via the shared `withAdmin` → `requireAdmin` guard rather than a behavioural per-route case).

**Status (AURA-304, merged `631bd29`):** the admin **property media** test suite now exists across all layers — unit (media validation: single-file, MIME allowlist `image/jpeg`/`image/png`/`image/webp`, 10MB max, server-built UUID path; cover rules: single-cover, floorplan-cannot-be-cover, image-only-cover; **publish-checklist regression** that deleting the cover re-blocks publish until another cover image with alt text exists), integration (media route contract — upload/update/delete behaviour, validation, archived-property rejection), security boundary (media admin-only via `requireAdmin`; no public upload/update/delete; no service-role in UI; storage path is server-built/UUID, original filename never trusted), **live-DB DAL/RLS** (gated `SUPABASE_LOCAL_TESTS=1`: admin media writes under the caller's own session + RLS; published-parent-only public read; draft/archived media not public), and e2e (admin media flow, gated behind seeded-admin `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI). The gated live suites ran in CI's `db-tests` job. **Follow-up:** add magic-byte / content-sniffing upload tests if that defense-in-depth check is implemented later (MIME is currently trusted from the request).

**Status (AURA-305, merged `aee1fda`):** the admin **areas** test suite now exists across all layers — unit (`area-admin-schema`: create/edit Zod contracts, slug-set-only-at-create rule, `sort_order`, image MIME/size validation; `area-admin-view`: the admin view/projector incl. admin-only `totalProperties` / `publishedProperties` counts and active/inactive status), integration (`admin-areas-api`: 401 unauth / 403 no-role / validation / duplicate-slug / slug-immutable-on-PATCH / deactivate-reactivate / no-DELETE, with DAL/auth/audit mocked), security boundary (`admin-areas-boundary`: every route guarded via `requireAdmin` and **not** `requireSuperAdmin`; no service-role/DAL/Supabase in UI; no public create/edit/deactivate; area image storage path server-built/UUID, original filename never trusted; property counts admin-only — plus `areas-public-boundary` **updated for AURA-305** so anon still cannot read inactive areas and the public DTO has no property counts), live-DB DAL/RLS/storage (`admin-areas.dal`, gated `SUPABASE_LOCAL_TESTS=1`: admin area writes under the caller's own session + RLS; image upload to the `property-media` bucket under `areas/{area_id}/...`; anon write/list/mutation denied; public reads active-only), and e2e (`admin-areas` spec — unauthenticated `/admin/areas*` → `/admin/login`; the seeded-admin authenticated happy path gated behind `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI). The gated live suites ran in CI's `db-tests` job; CI checks green before merge (`CodeQL`, `analyze (javascript-typescript)`, `db-tests`, `e2e`, `quality`; Lighthouse advisory non-blocking). **Follow-up:** add area old-image storage-cleanup / signed-URL tests if/when object revocation or storage GC is implemented (the public-read bucket means a known UUID image URL stays fetchable after deactivation).

Test that these are blocked:
- Public cannot read leads (`GET /api/admin/leads` without auth → 401)
- Public cannot read draft/archived properties (`GET /api/properties/[slug]` for draft → 404)
- Public cannot upload media
- Public cannot read internal stakeholders (verify not in property detail response)
- Public cannot read WhatsApp analytics
- Unauthenticated user cannot access any `/api/admin/*` route
- Authenticated user without `user_profiles` row cannot access admin
- Invalid phone rejected from `POST /api/leads`
- Oversized image (>10MB) rejected from media upload
- Unsupported file type rejected from media upload
- Unsafe HTML rejected from `POST /api/admin/legal`
- PII fields (email, phone, IP) rejected from `POST /api/whatsapp-clicks`
- `clients` or `client_id` not present in schema

---

## AURA-Specific Required Test Cases (§16.8)

### Property Taxonomy and Visibility
- Draft property is not public
- Archived property is not public
- `publish_status` is separate from `availability_status`
- Sold/rented labels do not auto-unpublish (only `publish_status` change does)
- Off-plan block appears only when `market_type = off_plan`
- Price-on-application displays correctly without price value

### Lead Security
- Public cannot read or export leads
- Archived leads hidden by default in admin filters unless explicitly requested
- Lead export creates an `lead_exported` audit log entry

### WhatsApp Privacy
- Phone/email/IP fields are rejected from tracking payload
- WhatsApp URL builder follows routing priority: `property.agent_whatsapp → property.agent_phone → settings.whatsapp → settings.phone`
- Public cannot read WhatsApp analytics

### Admin Access
- Unauthenticated user blocked from all admin routes
- Authenticated user with no `user_profiles` row blocked
- `client_admin` can manage allowed MVP resources
- Destructive/archive actions require confirmation in UI (E2E)

### SEO/Demo
- AUTEX demo is noindex by default
- Sales Demo Mode labels appear only when both config and query param enable
- Real-client indexing can only be enabled via config

### Media
- Unsupported file types rejected
- Oversized images rejected
- Cover image requirement enforced before publish
- Alt text requirement enforced before publish

---

## Test File Structure

```
src/tests/
  unit/           # Zod schemas, domain logic, pure functions
  dal/            # RLS, visibility, access patterns (local Supabase)
  integration/    # API endpoint behavior (local Supabase)
  e2e/            # Critical user paths
    smoke.spec.ts # Fast pre-release checks
  security/       # Auth/RLS/PII negative tests
```
