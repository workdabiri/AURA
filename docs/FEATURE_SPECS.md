# AURA — Feature Specifications

**Source:** Pack §7, §8, §14  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Public Routes

| Route | Purpose |
|---|---|
| `/` | Redirect to `/en` |
| `/en` | Homepage |
| `/en/properties` | Property listing |
| `/en/properties/[slug]` | Property detail |
| `/en/areas` | Areas overview |
| `/en/about` | Agency/about page — **implemented (AURA-207, merged `65cc384`)** |
| `/en/contact` | Contact page |
| `/en/privacy` | Published Privacy Policy |
| `/en/terms` | Published Terms & Conditions |

---

## Homepage Sections

1. **Interactive Cinematic Hero**
   - Filters: Goal (Buy/Rent/Invest/Off-plan), Area, Budget
   - Optional expandable filters: Bedrooms, Property Type
   - Primary CTA: "Explore Matching Properties"
   - GSAP animations (homepage/storytelling only)
   - Reduced motion support required
2. **Featured Properties** — `is_featured = true AND publish_status = published`
3. **Area Explorer**
4. **Investment / Lifestyle Path Section**
5. **Trust / Why This Agency Section**
6. **Lead CTA Section**
7. **Footer** — From settings; editable by admin

---

## Property Listing Page

Must include:
- Property grid with cards
- Filters: transaction_type, market_type, property_type, area/community, price range, bedrooms, availability_status
- Search: by reference number or keyword (title full-text)
- Sort: newest, price low-to-high, price high-to-low
- Pagination or load-more (server cap: 50 per page)
- Empty state (no results)
- Mobile filter drawer/sheet
- Property card CTA → detail page
- WhatsApp secondary CTA on card

---

## Property Detail Page

Must include:
1. Large media gallery (cover image + ordered gallery; floorplan tab)
2. Title
3. Price (or "Price on Application")
4. Area/community
5. `availability_status` and `market_type` labels (not overloaded `status`)
6. Property type
7. Key specs: bedrooms, bathrooms, parking, size (sqft/sqm)
8. Sticky inquiry card on desktop
9. Sticky bottom CTA on mobile
10. Description
11. Amenities list
12. Location section (text + optional external map link)
13. RERA/reference/trust block (demo-safe values only unless production-approved)
14. Off-plan block (shown only when `market_type = off_plan`)
15. Similar properties
16. Inquiry form

**Off-plan block fields:** developer_name, handover_date, completion_percentage, down_payment_amount, payment_plan_summary.

**Contact routing priority** (locked D-13/D-14; implemented in AURA-203):
```
1. property.agent_whatsapp
2. property.agent_phone
3. property.agent_email
4. settings.whatsapp  (agencyWhatsapp)
5. settings.phone     (agencyPhone)
6. settings.email     (agencyEmail)
```
The first non-empty candidate wins; if none are configured, no contact CTA is shown.
**Contact never auto-routes to a stakeholder** (D-14).

**Public stakeholders** are projected to safe public fields only — `{ name, type }` — and only when
`visibility = public` **and** the property is published (D-16). Stakeholder phone/email/whatsapp,
registration/license, and internal notes are never exposed.

---

## Areas Overview Page (implemented in AURA-204)

`/en/areas` — public areas overview backed by `GET /api/areas`. Reads **active areas only**
(D-22); inactive areas are hidden from the public (no-public-sensitive-reads rule).

**Public-safe area DTO** (the only fields exposed):
```
{ slug, name, description, imageUrl }
```
No `id`, no `is_active`, no `sort_order`, no timestamps, **no property counts**, and **no property
aggregation**. Raw rows never leave the DAL; output is a key-only projection.

- **Ordering:** fixed — `sort_order ASC`, then `slug ASC`. No client-controlled sort.
- **`GET /api/areas`:** Zod-validated; **no query params** accepted; envelope `{ data }`; generic
  errors only; `force-dynamic`.
- **Page states (D-44):** loading / empty / error (+ retry) / success.
- **Not in AURA-204:** no area detail page (`/en/areas/[slug]`), no property counts/aggregation by
  area, no admin area management (AURA-305).

---

## Admin Routes

| Route | Purpose |
|---|---|
| `/admin/login` | Login page |
| `/admin/dashboard` | Dashboard |
| `/admin/properties` | Property list |
| `/admin/properties/new` | Create property |
| `/admin/properties/[id]/edit` | Edit property |
| `/admin/leads` | Lead management |
| `/admin/settings` | Operational settings |
| `/admin/legal` | Legal pages |
| `/admin/areas` | Simple areas admin |

**Implementation status (AURA-301, merged `97c9548`; AURA-302, merged `df4523c`):** `/admin/login` is
**implemented** (login only — no signup, no password reset; server-side login action with Zod
validation; AURA-106 login rate-limit at 5 / 15 min / key; AURA-104 role guard). `/admin/dashboard` is
**implemented** (AURA-302) — an authenticated **dashboard shell** behind the protected admin layout:
a separate **non-localized** sidebar + top-bar admin shell (`src/components/admin/**`; static copy,
luxury-dark tokens; not the public Header/Footer/Navigation, no next-intl), navigation links to the
future admin sections, and **placeholder panels only — no metrics, no real cards, no aggregation, no
data reads, no CRUD, no admin API routes**. The dashboard lives **inside** the `(protected)` group
(`src/app/admin/(protected)/dashboard/**`); there is **no unguarded** `src/app/admin/dashboard/**`.
`/admin` now **redirects to `/admin/dashboard`** (still inside the guard: unauthenticated → `/admin/login`;
authenticated → `/admin/dashboard`). Both `super_admin` and `client_admin` see the same shell. Admin
is hard `noindex`. The remaining admin routes above (properties / leads / settings / legal / areas) are
**not yet implemented** — their dashboard nav links 404 until built (AURA-303–307); **no placeholder
route files were created** for them.

---

## Feature Spec: Property Management

**Goal:** Allow admins to create, edit, duplicate, publish, archive, and manage property media.

**Required canonical taxonomy** (D-36):
- Use `publish_status` for draft/published/archived workflow
- Use `transaction_type` for sale/rent
- Use `market_type` for ready/off-plan
- Use `availability_status` for available/reserved/sold/rented/unavailable
- Use `property_type` for apartment/villa/townhouse/penthouse/office/plot/retail/warehouse
- Off-plan block displayed only when `market_type = off_plan`
- Rental cadence only for rental listings
- `price_on_application` support via `price_visibility`
- Text location + optional external map URL only in MVP

**Property slug:** Derived from `title->>'en'`; collision-suffixed; **immutable after publish** (A-06).

**Reference number:** Auto-generated by default; optional admin override; uniqueness mandatory (D-47).

**Media:** Images and floorplan images only; UUID-based storage path; 10MB max; type validation; alt text required before publish.

---

## Feature Spec: Lead Capture

**Goal:** Capture qualified inquiries from homepage, listing, property detail, and contact page.

**Lead form fields:** name (required), phone (required, validated), email (optional), message (optional), source (auto), optional property/filter context, privacy acknowledgement link.

**Behavior:**
- Valid lead → DB insert
- Email notification via Resend (fire-and-forget; failure must not fail lead creation)
- Rate-limited: 5 per hour per salted-hash key (D-51)
- Public cannot read leads (RLS enforced)

---

## Feature Spec: WhatsApp Click Tracking

**Goal:** Track conversion intent without PII.

**Tracking payload:** source, optional property_id, optional filter context (goal/area/budget/bedrooms), language.

**Must not accept:** IP address, phone, email, full user agent fingerprint.

**Rate limit:** 30 per hour per salted-hash key.

**Dashboard aggregation:** Total clicks, clicks by source, clicks by property.

---

## Feature Spec: Legal Pages

**Goal:** Manage Privacy Policy and Terms with safe versioning.

**Workflow:** draft → publish. Publishing archives previous published version for the same slug.

**Content safety:** Markdown or sanitized rich text only. Raw HTML is a merge blocker.

**Public access:** Only the current `status = published` version is publicly visible.

**Public read (AURA-205, merged `3d6a7e0`):** the public legal pages are live at `/en/privacy` and `/en/terms`, backed by `GET /api/legal/[slug]`. Supported slugs: `privacy`, `terms`. Reads are **published-only** (draft/archived/missing → `404` publicly) through an anon-client DAL behind the RLS public-read boundary (the DAL re-asserts published; explicit public-safe column allowlist). The public DTO is `{ slug, title, content, effectiveDate }` only — `content` is raw Markdown in the DTO and is rendered safely **server-side via `react-markdown` + `rehype-sanitize`** (no `rehype-raw`, no `dangerouslySetInnerHTML`, no unsafe raw HTML path), honoring D-12. **No admin legal editing and no SEO/noindex in AURA-205** — admin draft→publish→archive editing is AURA-307; SEO/noindex is AURA-206.

---

## Feature Spec: About Page

**Goal:** A premium, demo-safe About page presenting AUTEX as a Dubai real estate advisory **concept/demo brand** used to showcase the AURA engine — without claiming a real licensed brokerage.

**Implemented (AURA-207, merged `65cc384`):**
- **Public route `/en/about`** — `src/app/[locale]/about/page.tsx`: a **Server Component** reusing the AURA-201 public layout shell (header/footer/navigation). Renders a `<main>` landmark, exactly one `<h1>`, and accessible semantic sections (hero, trust/agency pillars, operating principles, disclosure).
- **Fully static, demo-safe content** — all visible copy comes from the `About` namespace in `src/messages/en.json`. **No DAL / Supabase / settings / service-role read** from the page (content-only; only the D-44 success state is relevant, so no loading/error/not-found files). No claim of a real brokerage / RERA / broker license / awards / years in market.
- **SEO/noindex** — reuses the **AURA-206 SEO helper** via `publicRouteMetadata('about')` (route key added to `src/lib/seo/routes.ts`); `/en/about` emits AUTEX **`noindex` by default** (D-42). No canonical/OpenGraph/Twitter.
- **AUTEX disclosure** — the visible on-page disclosure reuses the existing **`Footer.disclosure`** translation string (Q-13), so it never diverges from the footer copy.
- **Sitemap** — `/en/about` is now included in `src/app/sitemap.ts` (it exists as of AURA-207); dynamic property-detail URLs remain excluded.

**Not in scope (AURA-207):** no admin editability, no contact/lead form, no WhatsApp tracking, no media upload, no cinematic/GSAP, no real-client indexing, no canonical/OpenGraph/Twitter, no data-driven About content.

---

## Feature Spec: SEO & Indexing

**Goal:** Public pages carry basic SEO metadata while the AUTEX demo stays out of search indexes by default (D-42).

**Implemented (AURA-206, merged `a106fe8`):**
- **Source-controlled config** — `src/config/feature-flags.ts`: `featureFlags.publicIndexingEnabled` (default **`false`** → AUTEX `noindex` by default, D-42) and a demo-safe `publicSiteUrl` (`https://autex.example`, reserved `.example` host). These are compile-time source constants, **not** env/deployment config; real-client indexing is a deliberate future config change + owner approval.
- **Public route metadata** — pure SEO helpers (`src/lib/seo/metadata.ts`, `src/lib/seo/routes.ts`) build per-route `title` / `description` / `robots`. The robots directive **fails closed to `noindex, nofollow`** unless indexing is explicitly enabled. Metadata is present on `/en`, `/en/properties`, `/en/properties/[slug]` (generic, **no DAL read**), `/en/areas`, `/en/about` (added in AURA-207), `/en/privacy`, `/en/terms`; the `[locale]` layout sets the global default-`noindex`. Scope is title + description + robots only — **no canonical, no OpenGraph, no Twitter cards** (deferred).
- **`robots.txt`** (`src/app/robots.ts`) — **allows crawl** (`allow: '/'`, **no `Disallow: /`**) so crawlers can fetch pages and observe the per-page `noindex`; advertises the sitemap.
- **`sitemap.xml`** (`src/app/sitemap.ts`) — lists **only the existing static public routes** (`/en`, `/en/properties`, `/en/areas`, `/en/about` (added in AURA-207), `/en/privacy`, `/en/terms`); **excludes dynamic property-detail URLs**; no DAL/database reads.
- **Lighthouse advisory CI** — `.github/workflows/lighthouse.yml` runs as a **non-blocking advisory** on PRs to `develop` (`continue-on-error: true`, `treosh/lighthouse-ci-action`, no npm dependency, no score thresholds); it is **not** a required branch-protection check. The hard score gate is deferred to release / AURA-505.

**Not in scope yet:** real-client indexing (stays `noindex`), canonical URLs, OpenGraph/Twitter cards, admin-editable SEO fields (`seo_title`/`seo_description` exist in the Settings model but are not wired to public metadata), and dynamic per-property sitemap URLs.

---

## Feature Spec: Settings

**Goal:** Admin-editable operational content without allowing template mutation.

**Editable fields:** agency_name, logo_url, whatsapp, phone, email, office_address, social_links, footer_content, footer_links, contact_us_content, seo_title, seo_description, office_registration_number, broker_license_number, years_in_market, verified_badge_enabled.

**Admin cannot edit:** Core layout, motion system, template architecture, component behavior, section structure, design system architecture.

---

## Feature Spec: Sales Demo Mode

**Goal:** Show commercial conversion labels during sales presentations.

**Activation:** `client.config.ts features.salesDemoMode = true` AND `?demo=sales` in URL.

**Requirements:**
- Off by default for real client deployments
- Only visible when both config and query param enable it
- No private/admin data exposed
- Page is noindex/protected from indexing
- Labels subtle; must not degrade normal visitor UX

---

## UI States Required (D-44)

Every data-driven UI must define:
- Loading (skeleton/spinner)
- Empty (no results message)
- Error (user-friendly message + retry)
- Success (confirmation feedback)
- Unauthorized (redirect or message)
- Forbidden (role insufficient message)
- Validation error (inline field errors)
- Network retry

---

## Admin UX Rules

- Admin should be boring, fast, and reliable — no cinematic animation
- Every destructive action needs confirmation dialog
- Archive actions: confirmation + undo/toast where practical
- Draft save and publish are separate actions
- Publish button shows validation checklist before confirming
- Settings changes: immediate + validated + audit-logged
- Legal content: draft → publish only

---

## Admin Table Pattern

Admin tables (properties, leads, areas, legal) must use:
- Search where relevant
- Filters
- Sort
- Pagination
- Status badges
- Row actions (edit, duplicate, archive, etc.)
- Confirm archive dialog
- Empty state
- Error state
- Loading skeleton
- No bulk actions in MVP unless explicitly approved
