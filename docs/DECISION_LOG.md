# AURA — Decision Log

**Source:** Pack D-01–D-51 + Q-01–Q-15 + A-01–A-11  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`  
**Carry-forward fix applied:** CF-1 — all "D-01 to D-50" references updated to D-01 to D-51
**Audit fix applied:** RF-1 — `A-01–A-11` IDs reconciled to match `OPUS_REVIEW_HANDOFF.md` exactly; displaced technical ratifications moved to **Additional Ratifications (A-12+)** (Opus 4.8 audit)

---

## Change Control

Any change to a locked decision (D-01–D-51) requires:
1. Explicit user approval
2. Update to pack and this log
3. Opus 4.8 review if security or architecture is affected

---

## Locked Decisions (D-01 – D-51)

| ID | Decision | Rule | Status |
|---|---|---|---|
| D-01 | Product identity | AURA is the engine/product name. | Locked |
| D-02 | Demo brand | AUTEX Estates Dubai is fictional and demo-only. | Locked |
| D-03 | Product model | Reusable private real estate website engine, not SaaS MVP. | Locked |
| D-04 | Deployment model | Separate Vercel, Supabase, domain, env vars, DB, storage, and admins per client. | Locked |
| D-05 | No multi-tenant MVP | No `clients` table, no `client_id`, no shared production DB. **Merge blocker.** | Locked |
| D-06 | Route strategy | MVP public routes use `/en/...`; `/` redirects to `/en`. | Locked |
| D-07 | Arabic/RTL | Arabic UI is Phase 2; MVP is English visible UI but RTL-ready. | Locked |
| D-08 | i18n content | Property, area, and legal translatable fields use JSONB/i18n-ready structures. | Locked |
| D-09 | Bedrooms | `bedrooms` is nullable for `office` and `plot`; validation depends on type. | Locked |
| D-10 | Legal pages | Privacy Policy and Terms are in MVP with versioning and statuses. | Locked |
| D-11 | Legal acceptance | User acceptance tracking is out of MVP; lead forms link to active Privacy Policy. | Locked |
| D-12 | Legal safety | Use Markdown or controlled rich text; raw unrestricted HTML is banned. **Merge blocker.** | Locked |
| D-13 | Property contact override | Property may define agent/contact override fields. | Locked |
| D-14 | Contact routing | Property override → agency contact → never stakeholder auto-routing. | Locked |
| D-15 | Stakeholders | Properties may have internal stakeholders: developer, owner, seller, landlord, sales partner, exclusive agent. | Locked |
| D-16 | Stakeholder visibility | Internal-only by default; public visibility must be explicit. | Locked |
| D-17 | WhatsApp tracking | Lightweight WhatsApp click tracking is in MVP. | Locked |
| D-18 | WhatsApp privacy | No IP, phone, email, or personal data in `whatsapp_clicks` by default. **Merge blocker.** | Locked |
| D-19 | Sales Demo Mode | Enabled only by config and `?demo=sales`; off by default for real clients. | Locked |
| D-20 | Admin editable content | Admin can edit operational content, contact, footer, legal, trust fields, and SEO basics. | Locked |
| D-21 | Admin boundaries | Admin cannot edit core layout, design system architecture, motion system, or component behavior. | Locked |
| D-22 | Areas Admin | Simple add/edit/deactivate only in MVP. | Locked |
| D-23 | Delivery model | One-time delivery; optional monthly support. No upstream sync for client forks after delivery. | Locked |
| D-24 | Core/client repos | Both core and client repos must preserve CI/security gates. | Locked |
| D-25 | Design system | Token-based design system; flagship theme is `luxury-dark`. | Locked |
| D-26 | Motion strategy | Heavy motion only for homepage/storytelling; reduced motion required. | Locked |
| D-27 | Performance targets | Desktop PageSpeed > 90; cinematic mobile MVP > 75; production mobile target > 80; CLS < 0.1. | Locked |
| D-28 | Testing/gates | No task is done unless required gates pass. | Locked |
| D-29 | Start mode | Project starts from zero in a new greenfield repo. | Locked |
| D-30 | MVP roles | Only `super_admin` and `client_admin` in MVP. Future roles go to Roadmap Parking Lot. | Locked |
| D-31 | Lead delete | MVP uses soft delete/archive; hard delete only outside normal UI. | Locked |
| D-32 | Property delete | Use `draft / published / archived`; real delete is not normal MVP behavior. | Locked |
| D-33 | Fake data | AUTEX demo data must be license-safe, non-indexed, non-real, and non-PII. | Locked |
| D-34 | API spec | MVP endpoints require explicit auth, authorization, validation, errors, rate limits, logging, and tests. | Locked |
| D-35 | Production readiness | Environment, observability, privacy, data lifecycle, backup, incident, cost, analytics, support, and release checks are required. | Locked |
| D-36 | Property taxonomy | Never overload `status`; use `publish_status`, `transaction_type`, `market_type`, `property_type`, and `availability_status`. | Locked |
| D-37 | Lead enums | Use explicit `lead_status`, `lead_source`, and optional `lead_priority`; no free-form lead lifecycle values. | Locked |
| D-38 | Audit logs | Admin state changes, lead export, legal publish, settings update, and property publish/archive require audit logging where practical. | Locked |
| D-39 | Rate limiting | MVP uses simple server-side/table-based rate limiting; future high-traffic deployments may switch to Upstash/Vercel KV. | Locked |
| D-40 | Admin bootstrap | No public admin self-signup; first `super_admin` is created manually through Supabase Auth plus a seed/admin script. **Merge blocker.** | Locked |
| D-41 | MVP media scope | MVP supports images and optional floorplan images only; video/360/virtual tour upload is out of MVP. | Locked |
| D-42 | SEO indexing policy | AUTEX demo is noindex by default; real-client indexing requires approval and config. | Locked |
| D-43 | Client deployment factory | Every real client must be created from the core template into an isolated repo/deployment/Supabase project. | Locked |
| D-44 | UI state coverage | Every data-driven UI must define loading, empty, error, success, unauthorized, forbidden, validation, and retry states. | Locked |
| D-45 | AI task constraints | Every implementation task must list allowed files, forbidden files, required tests, screenshots for UI tasks, architecture checks, security checks, and rollback notes when migrations are involved. | Locked |
| D-46 | Settings/content governance | Settings changes are immediate but validated and audit-logged; legal pages use draft → publish; design architecture cannot be changed from admin. | Locked |
| D-47 | Reference numbers | Property `reference_number` is auto-generated by default with optional admin override; uniqueness is mandatory. | Locked |
| D-48 | Price visibility | `price_visibility` must support `visible` and `price_on_application`. | Locked |
| D-49 | Map scope | MVP uses text location and optional external map link/static placeholder; full embedded Google Maps is out of MVP. | Locked |
| D-50 | Client legal readiness | Real-client production release requires legal/contact/license/image/property-data approval before indexable launch. | Locked |
| D-51 | Rate-limit key strategy | Rate-limit keys use `salted-hash(IP + route)` computed server-side; raw IP is never stored in `rate_limits` or any event/analytics table; the hash salt is a server-only secret env variable (`RATE_LIMIT_SALT`); the dedicated `rate_limits` table uses a 24-hour TTL with scheduled cleanup. Consistent with D-18 and the security merge blocker. **Merge blocker.** | Locked |

---

## Open Decisions / Questions (Q-01 – Q-15)

These were open before `TASKS_Project.md` generation. Defaults are ratified below.

| ID | Question | Ratified Default | Notes |
|---|---|---|---|
| Q-01 | AUTEX public demo indexable? | **No.** AUTEX demo is noindex by default. | D-42 |
| Q-02 | First `super_admin` creation? | **Manual Supabase Auth user + seed/admin script.** | D-40 |
| Q-03 | Rate limit implementation? | **Server-side/table-based MVP; future Upstash/Vercel KV.** | D-39, D-51 |
| Q-04 | Image upload max size? | **10MB per image.** | §11.4 |
| Q-05 | Media in MVP? | **Images + floorplan images only; no native video.** | D-41 |
| Q-06 | Lead notification recipients? | **Start with one configured admin notification email; allow comma-separated list later.** | `ADMIN_NOTIFICATION_EMAIL` env var |
| Q-07 | Resend sender domain? | **Use verified sender domain before real production; temporary only for dev/staging.** | Server-only |
| Q-08 | Property reference number? | **Auto-generate by default; optional manual override; unique.** | D-47 |
| Q-09 | Price on application? | **Yes, via `price_visibility = price_on_application`.** | D-48 |
| Q-10 | Rental period? | **Yes, required for rental listings where price is visible.** | §11.3 |
| Q-11 | Maps? | **Text location + optional external map URL only in MVP.** | D-49 |
| Q-12 | Client repo strategy? | **New client repo from core template; no shared production repo secrets.** | D-43 |
| Q-13 | AUTEX footer disclosure? | **Yes when public; noindex alone is not enough.** | §3.4 |
| Q-14 | Logo upload? | **Allow settings-level logo URL if storage policy exists; otherwise config/seed.** | §10.2 |
| Q-15 | Settings publish flow? | **Immediate validated update + audit log; legal pages remain draft/publish.** | D-46 |

---

## Ratified Assumptions (A-01 – A-11)

These were carried in `OPUS_REVIEW_HANDOFF.md` §4 and are ratified here. **The IDs and meanings below
are authoritative and match the handoff exactly** (RF-1). Future references to A-03/A-04/A-05/A-08/A-09/A-10
mean what this table says.

| ID | Assumption | Ratified Value |
|---|---|---|
| A-01 | CI workflow | One GitHub Actions workflow: `npm run quality` + Playwright on PR; CodeQL scheduled/PR. |
| A-02 | Test database | Supabase CLI local stack (dev + CI Docker) for DAL/integration tests. Do not mock the DB layer. |
| A-03 | Rate-limit thresholds (config-tunable) | leads `5/hr/key`; whatsapp-clicks `30/hr/key`; login `5/15min/key`. |
| A-04 | `preferred_contact_method` | Enum: `phone / whatsapp / email`. |
| A-05 | `reference_number` | Configurable prefix + padded sequence (e.g. `AUX-00041`); unique; auto-generated by default with optional admin override (D-47). |
| A-06 | Property slug | Derived from `title->>'en'`; collision-suffixed; **immutable after publish**. |
| A-07 | Pagination | `page`/`limit` query params; server cap **50** results per page. |
| A-08 | Lead export | CSV; filter-respecting; audit-logged (`lead_exported`); no persisted public URL. |
| A-09 | Settings shape | Per P-05: key-value + server-side allowlist + per-key Zod schema. |
| A-10 | Open-question defaults | Q-01–Q-15 recommended defaults accepted as written. |
| A-11 | Currency display | **AED-only in MVP; no FX conversion.** |

---

## Additional Ratifications (A-12 – A-16)

Technical defaults ratified during the Opus bootstrap audit. These were previously mis-numbered into the
A-01–A-11 range; they are retained here under fresh IDs so no information is lost (RF-1).

| ID | Assumption | Ratified Value |
|---|---|---|
| A-12 | Frontend testing frameworks | Vitest (unit/integration/DAL/security) + Playwright (E2E/smoke). |
| A-13 | Email service | Resend. |
| A-14 | Supported image formats | `image/jpeg`, `image/png`, `image/webp`. |
| A-15 | Max image upload size | 10MB per image (consistent with Q-04). |
| A-16 | Rate-limit table TTL | 24 hours; scheduled cleanup via Supabase pg_cron or equivalent. |

---

## Change History

| Date | Decision | Change | Approved By |
|---|---|---|---|
| 2026-06-13 | D-51 | Added (v1.4 patch P-02): rate-limit key strategy | Opus 4.8 review |
| 2026-06-13 | A-06 | Ratified: slug immutable after publish | Opus 4.8 review |
| 2026-06-13 | A-07 | Ratified: pagination server cap = 50 | Opus 4.8 review |
| 2026-06-13 | A-11 | Ratified: AED-only display, no FX in MVP | Opus 4.8 review |
| 2026-06-13 | A-02 | Ratified: test DB = Supabase CLI local stack | Opus 4.8 review |
| 2026-06-13 | A-01–A-11 | RF-1: reconciled IDs to match `OPUS_REVIEW_HANDOFF.md`; displaced ratifications moved to A-12–A-16 | Opus 4.8 audit |
