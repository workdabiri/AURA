# AURA — Security Baseline

**Source:** Pack §12 + §6  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Core Security Rule

All sensitive tables require RLS. Public access is allowlisted, not default-open. Every admin route requires authentication + role check + RLS compliance — authentication alone is not sufficient.

---

## Public Access Matrix

| Resource | Public Read | Public Insert | Public Update/Delete |
|---|---|---|---|
| Published properties | Yes | No | No |
| Draft/archived properties | No | No | No |
| Media for published properties | Yes | No | No |
| Media for draft/archived properties | No | No | No |
| Active areas | Yes | No | No |
| Published legal pages | Yes | No | No |
| Public stakeholder fields | Yes, only if explicitly `visibility = public` AND property is published | No | No |
| Leads | No | Yes (validated, rate-limited) | No |
| WhatsApp click events | No | Yes (no PII, rate-limited) | No |
| Settings | No direct public DB read (safe server selector only) | No | No |
| User profiles | No | No | No |
| Audit logs | No | No | No |

---

## Admin Access Matrix

| Resource | `super_admin` | `client_admin` |
|---|---|---|
| Properties | Full | Full except hard delete |
| Media | Full | Upload/update/delete within normal workflow |
| Leads | Full (archive/soft-delete/export) | Manage, archive/soft-delete/export |
| Settings | Full | Update allowed settings only |
| Legal pages | Full | Draft/publish/archive within workflow |
| Areas | Full | Add/edit/deactivate |
| User profiles | Full | No user management |
| Audit logs | Full | Read limited if exposed; write only via server-side audited actions |
| Hard delete | Outside normal UI only | No |

---

## Authentication Rules

Admin access requires all of:
1. Valid Supabase session (JWT)
2. Matching row in `user_profiles`
3. Role in `super_admin` or `client_admin`
4. Route/API authorization check
5. RLS policy compliance

**No public admin self-signup.** First `super_admin` created via Supabase Auth + seed/admin script (D-40).

**Implementation status (AURA-301, merged `97c9548`):** the first admin login + session + role-guard
surface is now wired — `/admin/login` (login only; **no signup, no password reset**), a server-side
login action (Zod-validated), the AURA-104 guard verifying `auth.getUser()` + `user_profiles` row +
role (auth alone is never sufficient), and a minimal guarded `/admin` placeholder. No service-role
key in the client bundle; no raw IP persisted/logged. Opus 4.8 review: **APPROVE**, no blockers; the
D-40 no-self-signup boundary is satisfied.

**Implementation status (AURA-302, merged `df4523c`):** the admin **dashboard shell** (`/admin/dashboard`)
**consumes the existing AURA-301 `(protected)` layout guard** and introduces **no new auth/security
boundary**. The shell is guarded server-side (fail-closed) and lives **inside** the `(protected)` group
(`src/app/admin/(protected)/dashboard/**`); there is **no unguarded** `src/app/admin/dashboard/**`
route. `/admin` redirects to `/admin/dashboard` from inside the guard. The admin shell components are
presentational only — **no service-role/DAL/Supabase/services import in the admin UI** (service-role
remains server-only and never reaches the client bundle), no data reads, no admin API routes. The D-40
no-self-signup boundary is unchanged (no signup/reset path added). Opus review was **not required** for
AURA-302.

---

## Secrets and Environment

| Variable | Location |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client-safe) |
| `NEXT_PUBLIC_SITE_URL` | Public (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only; never in client bundle** |
| `RESEND_API_KEY` | Server-only |
| `SENTRY_AUTH_TOKEN` | Server-only |
| `ADMIN_NOTIFICATION_EMAIL` | Server-only |
| `RESEND_FROM_EMAIL` | Server-only |
| `RATE_LIMIT_SALT` | Server-only (used to compute rate-limit key hashes) |

Rules:
- Never commit `.env` files
- Use Vercel encrypted env storage for production secrets
- Rotate secrets when leaked or team changes
- Validate env at startup/server boundary

---

## Rate Limiting

Rate-limit key = `salted-hash(IP + route)` — server-side only. Raw IP is never stored in `rate_limits` or any event/analytics table (D-51, D-18).

| Route | Limit |
|---|---|
| `POST /api/leads` | 5 / hour per key |
| `POST /api/whatsapp-clicks` | 30 / hour per key |
| Admin login route | 5 / 15 min per key |

MVP implementation: table-based (`rate_limits` table with 24-hour TTL + scheduled cleanup). Future option: Upstash/Vercel KV (D-39).

**Status:** the admin login route consumes this service (AURA-301): the `login` rule (5 / 15 min /
key) is enforced **before** any auth attempt, keyed by `salted-hash(IP + route)`; the raw IP is used
in-memory only and never stored or logged.

**Carry-forward (hardening):** the login IP is currently derived from the leftmost `x-forwarded-for`
hop, which is client-spoofable on a proxied platform — a future task should prefer a trusted source
(e.g. `x-real-ip` / the rightmost trusted hop) so the login throttle cannot be trivially bypassed.

---

## Storage Rules

MVP storage posture:
- **Public-read bucket** with UUID-based file paths (prevents enumeration)
- Public media read served via CDN from the public-read bucket
- **Write and delete** require valid admin session + role check at API layer (Supabase RLS + Route Handler auth)
- Path naming must use UUID-based components

**Known limitation:** Archived-property media CDN revocation is not guaranteed without signed URLs. A caller who retained the URL path may still fetch the asset after archival. Full revocation requires signed URLs — deferred out of MVP and documented at handover.

Upload validation:
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 10MB per image
- Storage paths must not expose service credentials or allow traversal

---

## Legal Content Security (D-12)

Legal content must be:
- Markdown or controlled/sanitized rich text
- Sanitized before render if rich text is allowed
- **Never** unrestricted raw HTML
- **Never** `dangerouslySetInnerHTML` without strict sanitization

This is a merge blocker. Any PR rendering raw legal HTML is blocked.

**Implemented (AURA-205, merged `3d6a7e0`) — public read boundary:** the public legal pages (`/en/privacy`, `/en/terms`, `GET /api/legal/[slug]`) render published legal content through the D-12 safe path — Markdown via `react-markdown` + `rehype-sanitize`, with **no `rehype-raw`, no `dangerouslySetInnerHTML`, and no unsafe raw HTML path**. Public legal reads are **published-only** (draft/archived hidden publicly → `404`) via the anon client + RLS public-read boundary; the public read uses **no service-role**. This does not relax the rule: raw unrestricted HTML remains banned, and **D-12 remains a merge blocker for any future legal rendering change** (including admin legal editing, AURA-307).

---

## Data Privacy Rules

- No raw IP stored in `whatsapp_clicks` or `rate_limits` (D-18, D-51)
- No personal data in WhatsApp tracking payload
- Lead data accessible to admin only (public cannot read leads)
- Lead export must be audit-logged
- Admin exports must not be publicly accessible
- Demo data must be fake/test only (no real PII in AUTEX demo)

---

## Audit Logging

Required for (D-38):
- `property_created`, `property_updated`, `property_published`, `property_archived`, `property_duplicated`
- `lead_status_updated`, `lead_archived`, `lead_exported`
- `settings_updated`
- `legal_page_created`, `legal_page_published`, `legal_page_archived`
- `area_created`, `area_updated`
- `admin_access_denied` where practical

Rules:
- Public cannot read or write audit logs
- Append-only from application perspective
- Do not store service-role keys, full lead exports, or unnecessary PII in snapshots

**Implemented (AURA-303, merged `a6cb178`) — admin property write boundary:**
- The admin property routes (`GET/POST /api/admin/properties`, `PATCH /api/admin/properties/[id]`, `POST /api/admin/properties/[id]/duplicate`, `PATCH /api/admin/properties/[id]/archive`) each call **`requireAdmin()` directly** (the `(protected)` layout guards pages, not Route Handlers). Both `super_admin` and `client_admin` may manage properties; no property action is super-admin-only.
- **Property writes use the caller's own authenticated admin session + existing RLS — never the service role** (`src/dal/admin-properties.dal.ts`). The **only** service-role path is the append-only audit-log writer (`src/dal/audit-logs.dal.ts`, `import 'server-only'`); no service-role import/key reaches any client/UI component (enforced by the `no-client-to-service-role` dependency-cruiser rule).
- The writer emits `property_created`, `property_updated`, `property_published`, `property_archived`, `property_duplicated`, with non-PII curated snapshots, and **throws on insert failure** so a missing audit is loud, never silently swallowed. (Ordering caveat: the property mutation commits before the audit insert; an audit failure surfaces as a generic 500 without rolling back the change — a future hardening may use one transaction/RPC.)
- **No hard delete** — there is no `DELETE` endpoint and no DELETE RLS policy on `properties`; archiving (`publish_status = archived`) is the MVP way to remove a listing from public view. **Draft and archived properties stay non-public** (anon RLS = published-only); publish makes a valid property public only after the checklist passes. `audit_logs` remains RLS-protected (super_admin SELECT only; no `authenticated` insert).

**Implemented (AURA-304, merged `631bd29`) — admin property media write boundary:**
- The media routes (`POST /api/admin/properties/[id]/media`, `PATCH …/media/[mediaId]`, `DELETE …/media/[mediaId]`) each call **`requireAdmin()` directly** via `withAdmin` (both `super_admin` and `client_admin`). **No public upload / update / delete** — there is no anon path to write media.
- **Storage writes use a request-scoped authenticated admin Supabase client + existing RLS — never the service role** (`src/dal/admin-property-media.dal.ts` + the server-only storage service `src/services/storage/property-media.ts`). The AURA-303 service-role boundary is unchanged: the **only** service-role path remains the append-only audit-log writer, and no service-role import/key reaches any client/UI component (`no-client-to-service-role` dependency-cruiser rule).
- **Upload validation:** single file only; allowed MIME `image/jpeg` / `image/png` / `image/webp`; 10MB max; **no video / 360 / virtual-tour**. The storage path is **server-built and UUID-based** (extension derived from MIME; the original filename is never trusted) — **no storage enumeration**. Archived properties reject media mutation; media must belong to the property.
- **Deferred (signed URLs / CDN revocation):** media `url` is still a public CDN URL; a retained object URL stays fetchable after a property is unpublished/archived. Full revocation needs signed URLs, deferred out of MVP. **Non-blocking Opus follow-up:** consider magic-byte / content sniffing on upload as defense-in-depth (MIME is currently trusted from the request).

**Implemented (AURA-305, merged `aee1fda`) — admin areas write boundary:**
- The areas routes (`GET /api/admin/areas`, `POST /api/admin/areas`, `PATCH /api/admin/areas/[id]`) each call **`requireAdmin()` directly** via `withAdmin` (both `super_admin` and `client_admin`; **not** `requireSuperAdmin()`). **No public create / edit / deactivate / reactivate** — there is no anon path to write areas. **Add / edit / deactivate / reactivate only — no hard delete.** The public `/api/areas` surface is unchanged (active-only); inactive areas stay hidden.
- **Area CRUD and the representative area image upload use a request-scoped authenticated admin Supabase client + existing RLS — never the service role** (`src/dal/admin-areas.dal.ts` + the server-only storage service `src/services/storage/area-image.ts`). The service-role boundary is unchanged: the **only** service-role path remains the append-only audit-log writer, and no service-role import/key reaches any client/UI component (`no-client-to-service-role` dependency-cruiser rule).
- **Storage boundary:** the one representative image **reuses the existing `property-media` bucket** (AURA-105 policies — authenticated admin writes allowed; anon write / list / mutation denied) under the **server-built, UUID-only** path `areas/{area_id}/{image_id}.{ext}` (extension derived from MIME; original filename never trusted) — **no storage enumeration**. Upload validation: MIME allowlist `image/jpeg` / `image/png` / `image/webp`; 10MB max; `upsert: false`. **No area media table, no gallery, no multi-upload.**
- **Admin-only property counts:** per-area `totalProperties` / `publishedProperties` are computed for the admin surface only and are **never exposed publicly** (no public property counts).
- **Audit:** `area_created` / `area_updated` (deactivate/reactivate logged as `area_updated` with metadata) — a minimal audit-action-union extension; the post-mutation/non-atomic ordering caveat matches the AURA-303 pattern.
- **Deferred (signed URLs / object revocation):** the area image `url` is a public CDN URL — a known UUID image URL stays fetchable after deactivation, and old-image cleanup on replace is best-effort because only the public URL is stored. Full revocation / storage GC needs signed URLs or object revocation, deferred out of MVP.

**Implemented (AURA-306, merged `86e8b36`) — admin settings write boundary:**
- The settings routes (`GET /api/admin/settings`, `PATCH /api/admin/settings`) each call **`requireAdmin()` directly** via `withAdmin` (both `super_admin` and `client_admin`; **not** `requireSuperAdmin()`). **No public read / write** of the admin settings endpoints — there is no anon path. The public surface receives only the **safe, server-projected** settings through the existing AURA-201 selector.
- **Allowlist + per-key Zod (governance):** the editable allowlist is **exactly the seven existing public footer keys** (`agency_name`, `agency_phone`, `agency_email`, `agency_whatsapp`, `agency_address`, `footer_tagline`, `social_links`). The strict per-key Zod schema **rejects unknown keys and deferred keys** before any DB write, and the domain `toSettingRows` helper re-filters to the allowlist as a defence-in-depth backstop. An **empty patch is rejected (400)**. Admin **cannot** mutate template/design architecture (D-21) — only operational content keys are editable.
- **Admin GET/PATCH use a request-scoped authenticated admin Supabase client + RLS — never the service role** (`src/dal/settings.dal.ts` `getAdminSettings` / `updateAdminSettings`, gated by the `settings_admin_select/insert/update` policies on `public.is_admin()`). The existing **public safe selector** (`getPublicSettings`) legitimately keeps the service role, and the **only** other service-role path remains the append-only audit-log writer; no service-role import/key reaches any client/UI component (the `SettingsForm` imports no service-role / Supabase / DAL / services / storage; `no-client-to-service-role` dependency-cruiser rule).
- **No settings DELETE** — there is no DELETE policy on `settings` and the DAL issues no row deletion. Existing settings RLS is sufficient: authenticated admin can `select/insert/update`; anon has no direct settings access; no DELETE policy. **No migration, no Supabase config change.**
- **Audit:** `settings_updated` (entity type `settings`; metadata records the changed key **names** only — never the phone/email/WhatsApp/address values, which may be sensitive). Minimal audit-action-union extension (no broad audit refactor); the post-mutation/non-atomic ordering caveat matches the AURA-303 pattern.

---

## Merge Blockers (Security)

A PR must be blocked if any of these occur:
- Public can read leads
- Public can read WhatsApp analytics
- Public can read internal stakeholders
- Public can read draft/archived properties
- Service-role key appears in client bundle
- Legal content renders unsafe HTML
- `clients` table or `client_id` introduced
- IP stored in `whatsapp_clicks` by default
- Admin route relies only on authentication without role check
- Sensitive admin state change has no audit-log plan
- Lead export is not audit-logged
- Media upload has no file type/size validation

---

## Dependency Security

- Run `npm audit --audit-level=high` on every PR
- Block high/critical vulnerabilities unless explicitly approved
- Use Dependabot or Renovate for automated dependency updates
- CodeQL and Semgrep (recommended) for static analysis
- Check licenses for commercial compatibility

---

## Incident Response (Summary)

| Severity | Example | Response |
|---|---|---|
| P0 | Lead data exposure, service-role leak, RLS failure | Stop release, rotate secrets, patch immediately, postmortem |
| P1 | Lead form broken, admin unavailable | Fix urgently, communicate impact |
| P2 | Visual bug, analytics gap | Queue fix |

Full incident procedure in `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md` §25.
