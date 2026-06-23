# Next Steps

**Updated:** 2026-06-23
**Current Phase:** **Phase 1 — COMPLETE** (AURA-101–AURA-107 all merged); **Phase 2 (Public Website) is IN PROGRESS — AURA-201 + AURA-202 + AURA-203 merged; 3 of 7 done.** AURA-101 merged at `95f9df3`. AURA-102 merged at `3657e4f`. AURA-103 merged at `1a35958`. **AURA-104 merged at `44a7fd4`.** **AURA-105 merged at `fae3d62`.** **AURA-106 merged at `dd21edd`.** **AURA-107 (Phase 1 exit gate) merged at `04d3522`** (PR #23; Opus 4.8 phase-exit review **APPROVE**, no blocking issues; feature branch deleted). **AURA-201 (public `/[locale]` layout + header/footer/navigation + minimal next-intl v4 i18n shell + server-only public settings selector) merged at `f17b429`** (PR #25; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch deleted local + remote). **AURA-202 (public properties listing + `GET /api/properties` + `GET /api/properties/featured`) merged at `1d4c514`** (PR #27; merged 2026-06-22; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch deleted). **AURA-203 (public property detail + `GET /api/properties/[slug]` + stakeholder visibility + contact routing + off-plan) merged at `b2f6129`** (PR #29; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch `feature/aura-203-property-detail` deleted). `develop` is the source of truth at `b2f6129`. The next task is **AURA-204 (Areas overview — DAL + `GET /api/areas`)** — not started (read-only discovery only).

---

## Immediate Next Action

**AURA-201 (Public layout + header/footer + i18n shell + server-only public settings selector — the first Phase 2 task) is MERGED at `f17b429`** (PR #25 squash-merged into `develop`; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `quality` / `e2e` / `db-tests` / `analyze (javascript-typescript)` / `CodeQL` green before merge; feature branch `feature/aura-201-public-layout-i18n-shell` deleted local + remote). Delivered: public `/[locale]` layout (header / navigation / footer), minimal next-intl v4 i18n shell (English-only visible UI, RTL-ready direction helper), server-only public settings safe selector (allowlist + per-key Zod + fail-closed defaults), settings-driven footer, Q-13 AUTEX disclosure, and unit/live-DAL/e2e tests. **No migration, no package/`.env`/`config.toml` change, no admin/property/area/legal/lead/WhatsApp code, no AURA-202+ work.** **Phase 2 has started (1 of 7 tasks done).**

**AURA-202 (public properties listing + `GET /api/properties` + `GET /api/properties/featured` — the second Phase 2 task) is MERGED at `1d4c514`** (PR #27 squash-merged; merged 2026-06-22T12:54:55Z; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `quality` / `e2e` / `db-tests` / `analyze (javascript-typescript)` / `CodeQL` green before merge; feature branch deleted). Delivered: a published-only properties DAL (anon server client + RLS public-read boundary + DAL published-only re-assertion + explicit public-safe column allowlist), `GET /api/properties` + `GET /api/properties/featured` (Zod-validated; pagination cap 50 that clamps; generic errors), the `/[locale]/properties` listing page with all D-44 states (reusing the AURA-201 shell), `PropertyCard`, the homepage featured section (fails closed to empty), pure domain query/DTO/format modules, and unit/DAL/security/integration/e2e tests. **No migration, no package/`.env`/`config.toml`/CI change, no admin/detail/stakeholder/contact/lead-WhatsApp/media/areas/legal/SEO/cinematic code, no AURA-203+ work.** **Phase 2 is in progress (2 of 7 done).**

**AURA-203 (public property detail + `GET /api/properties/[slug]` + stakeholder visibility + contact routing + off-plan — the third Phase 2 task) is MERGED at `b2f6129`** (PR #29 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-203-property-detail` deleted local + remote). Delivered: `GET /api/properties/[slug]` (Zod slug; published-only; `400`/`404`/generic `500`; no service role in handler), the `/[locale]/properties/[slug]` server-rendered page with all D-44 states, a public-safe detail DTO + media gallery (no `storage_path`), price-on-application + conditional off-plan block (D-36), a safe `{ name, type }` public stakeholder projection (internal_only + PII excluded; narrow server-only fail-closed service-role selector), contact routing (property override → agency fallback → never stakeholder), and unit/DAL/security/integration/e2e tests. **The AURA-202 listing DAL (`src/dal/properties.dal.ts`) is untouched — a separate `src/dal/property-detail.dal.ts` was added.** **No migration, no package/`.env`/`config.toml`/CI change, no admin/lead/WhatsApp/media-upload/SEO/similar-properties/cinematic code, no AURA-204+ work.** **Phase 2 is in progress (3 of 7 done).**

**Branch protection (unchanged by AURA-203):** `db-tests` remains required on `develop` — `develop` required checks are: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, `db-tests`. AURA-203 did not change branch protection.

**Immediate next action — AURA-204 read-only discovery only.** The next Phase 2 task is **AURA-204 (Areas overview — DAL + `GET /api/areas`)**: the public areas overview, reusing the AURA-201 layout shell and the AURA-202/203 DAL/domain patterns. It is **not started**. **Do not start AURA-204 implementation directly. Do not create the AURA-204 branch until discovery is complete and the owner approves.** Read-only discovery only; a new session + explicit per-task discovery/planning approval is required before any work begins. AURA-204 likely touches the public areas/listing taxonomy (D-22) and must still follow read-only discovery first.

**AURA-203 non-blocking carry-forwards (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **CI e2e coverage** — CI's `e2e` job runs `test:smoke` only; `property-detail.spec.ts` (and AURA-202's `properties.spec.ts`) are full-`test:e2e`/local, not run by CI `e2e`. Future follow-up: decide whether CI should run full `npm run test:e2e`.
2. **Detail e2e happy-path** — `property-detail.spec.ts` is data-independent and only verifies the not-found/error graceful states. Future follow-up: add a seeded happy-path detail e2e when the test-data strategy supports it.
3. **FEATURE_SPECS contact-routing drift** — `docs/FEATURE_SPECS.md` had the old 4-step contact priority; **synced in this PR** to the implemented/locked 6-step priority: (1) property.agent_whatsapp (2) property.agent_phone (3) property.agent_email (4) settings.whatsapp / agencyWhatsapp (5) settings.phone / agencyPhone (6) settings.email / agencyEmail. **Never stakeholder.**
4. **Optional stakeholder defense-in-depth** — make the service-role public-stakeholder selector's safety local to the query with an explicit published-parent check. The current control flow is approved and not blocking.
5. **CI ergonomics** — pre-existing: the wait-for-server loop could fail earlier/more clearly. Not an AURA-203 blocker.

**AURA-202 non-blocking carry-forwards (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **FTS index expression/performance mismatch** — DAL search is correct, but the existing GIN index (`to_tsvector('english', coalesce(title_en,''))`) is not used by the query (`to_tsvector('english', title_en)`), so search falls back to a sequential scan. Future migration/performance task; **not** an AURA-202 blocker (the index lives in a pre-existing migration).
2. **RTL badge class** — `PropertyCard` featured badge uses the physical `left-3`; future polish should use the logical `start-3` (the only physical directional class in `src/`; no runtime impact while MVP is English-only).
3. **Static sensitive-token scan completeness** — expand the future security static scan to include `agent_name`, `description`, `payment_plan_summary`. **Do not** add `off_plan` (it is a valid public `market_type` enum/filter value).
4. **E2E CI wiring** — `properties.spec.ts` passes locally but CI's `e2e` job runs the smoke spec only (`test:smoke`); consider wiring full `test:e2e` into CI in a future task.
5. **Unused i18n keys** — `PropertyCard.viewDetails` and `PropertyCard.currency` are currently unused (knip does not scan message keys); remove or use in a future cleanup.
6. **Detail route** — `PropertyCard` links to `/{locale}/properties/{slug}`, but AURA-203 owns that route's implementation. This is expected (dead-until-AURA-203).

**AURA-201 non-blocking carry-forwards (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **Settings selector observability** — `getPublicSettings()` fail-closed branches (`catch` / `if (error)`) swallow errors silently; a misconfigured service-role env or downed DB renders demo defaults with no signal. Add server-side logging/Sentry breadcrumb (defer to observability work, Phase 6).
2. **Stricter phone/WhatsApp validation later** — `agency_phone`/`agency_whatsapp` validate only as non-empty strings (safe at render: WhatsApp strips to digits, phone via `tel:`); tighten when `libphonenumber-js` is wired for lead/contact work (Phase 2–3).
3. **Skip-to-content cleanup** — `Header.skipToContent` message key exists in `en.json` but no skip link is rendered; wire a skip link (a11y) or drop the key.
4. **Future settings caching/revalidate** — `force-dynamic` does a service-role settings read per request with no caching; revisit with `revalidate`/tag-based caching if settings reads become hot.

**Carry-forward / open items still in force:**
- **Live DAL/security/integration tests now run in CI** (AURA-107 `db-tests` job) — the prior "local-only (`SUPABASE_LOCAL_TESTS=1`) until AURA-107" posture from AURA-103/104/105/106 is **resolved**. Local manual runs still use `SUPABASE_LOCAL_TESTS=1` + `supabase start`. The rate-limit service still has **no route consumer yet** — lead/whatsapp/login routes (Phases 3-4) are its first importers; remove `src/services/rate-limit/index.ts` from the Knip `entry` list then.
- **pg_cron is environment-dependent.** The cleanup schedule is registered defensively: where pg_cron is unavailable, the function + index still apply and `public.cleanup_rate_limits()` must be driven by an equivalent external scheduler (A-16 "pg_cron or equivalent"). On hosted Supabase, confirm pg_cron is enabled so the hourly job runs.
- **AURA-106 non-blocking Opus hardening notes (future task, not actioned at merge):** (1) add a defensive `p_limit > 0` / `p_window_seconds > 0` guard inside `consume_rate_limit` (defense-in-depth; only `service_role` calls it with validated config today); (2) tighten the `RATE_LIMIT_SALT` minimum length in `src/lib/validation/env.schema.ts` (currently `z.string().min(1)`, pre-existing from AURA-101); (3) reconfirm/regenerate `src/types/database.ts` from the live stack in a future DB-touching task (the AURA-106 function types were hand-added and verified accurate against the SQL).
- **Live storage catalog/behavioural tests now run in CI** (AURA-107 `db-tests` job; previously local-only). AURA-304 is the first real importer of the media/storage modules — remove their Knip `entry` lines then. **Public-read bucket limitation** (retained URL fetchable after unpublish/archive) is documented + deferred (signed URLs out of MVP).
- **Runner decision (seed-admin, non-blocking follow-up):** executing `scripts/seed-admin.ts` needs a TS runner resolving `@/*` + the `server-only` guard; none added (no `tsx`/`ts-node` in repo). Decide between approving `tsx` + a `seed:admin` script, or a `node --conditions=react-server` + path-alias loader. Pure logic + DB effect are already test-covered. Accepted by Opus as non-blocking at AURA-104 merge.
- **Production `enable_signup = false` (D-40):** hosted-Supabase deployment/config requirement. Local `config.toml` stays `true` (unchanged); the app-layer guard rejects any non-admin session.
- **Minimal-return for anon inserts (AURA-301+):** anon has INSERT but **no SELECT** on `leads` / `whatsapp_clicks`, so those anon inserts must use **minimal-return behavior** (returning the inserted row would fail the RLS read).
- **AURA-107 delivered:** live guard/seed/RLS/storage/rate-limit integration tests now run in CI via the `db-tests` job (Dockerized Supabase stack). The local-only carry-forward is resolved.

Branch protection active on `develop` (verified via API 2026-06-20):
- `quality` — required
- `e2e` — required
- `analyze (javascript-typescript)` — required
- `CodeQL` — required
- **`db-tests` — required** (added to the `develop` rule; AURA-107 Phase 1 exit gate)

GitHub required approvals are disabled for solo-operator mode; required checks remain enforced.

---

## Audit Status — Unchanged

`npm run audit` passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings via `next@15` internal postcss. Documented exception — no action required.

---

## Task Status

### Phase 0 — Complete

| Task | Description | Status |
|---|---|---|
| ~~**AURA-001**~~ | Next.js scaffold | ✅ merged |
| ~~**AURA-002**~~ | ESLint + Prettier quality gates | ✅ merged |
| ~~**AURA-003**~~ | Vitest + Playwright test harness | ✅ merged |
| ~~**AURA-004**~~ | Architecture boundary enforcement | ✅ merged |
| ~~**AURA-005**~~ | Environment schema + config | ✅ merged |
| ~~**AURA-006**~~ | Design tokens + Tailwind pipeline | ✅ merged |
| ~~**AURA-007**~~ | GitHub Actions CI + CodeQL + branch protection | ✅ merged |
| ~~**AURA-008**~~ | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | ✅ merged (`be43dab`) |

### Phase 1 — Complete ✅

| Task | Description | Status |
|---|---|---|
| ~~**AURA-101**~~ | Supabase local stack + client/server/service-role helpers | ✅ merged (`95f9df3`) |
| ~~**AURA-102**~~ | Initial migration — core MVP tables | ✅ merged (`3657e4f`) |
| ~~**AURA-103**~~ | RLS policies for all sensitive tables | ✅ merged (`1a35958`) |
| ~~**AURA-104**~~ | Auth guard + super-admin bootstrap | ✅ merged (`44a7fd4`) |
| ~~**AURA-105**~~ | Storage bucket policies + media path strategy | ✅ merged (`fae3d62`) |
| ~~**AURA-106**~~ | Rate-limit service + salted-hash key + TTL cleanup (D-51) | ✅ merged (`dd21edd`) |
| ~~**AURA-107**~~ | DAL/security/integration live tests in CI (Dockerized stack) — Phase 1 exit gate | ✅ merged (`04d3522`) |

### Phase 2 — Public Website — In progress (3/7)

| Task | Description | Status |
|---|---|---|
| ~~**AURA-201**~~ | Public layout + header/footer + i18n shell + server-only public settings selector | ✅ merged (`f17b429`) |
| ~~**AURA-202**~~ | Properties listing + `GET /api/properties` + featured | ✅ merged (`1d4c514`) |
| ~~**AURA-203**~~ | Property detail + stakeholder visibility | ✅ merged (`b2f6129`) |
| **AURA-204** | Areas overview — DAL + `GET /api/areas` | Not started — next; read-only discovery only; requires a new session + per-task discovery/planning approval |
| AURA-205–207 | Legal, SEO/noindex, about | Not started |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- ~~**AURA-005** → remove `zod`, `server-only`~~ ✅ done
- ~~**AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`~~ ✅ done
- ~~**AURA-008** → remove `next-intl`~~ ✅ done
- **AURA-006 deferred** → `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` — keep until first component that uses them (Phase 2+)
- ~~**AURA-101** → remove `@supabase/ssr`, `@supabase/supabase-js`~~ ✅ done (merged `95f9df3`)
- **AURA-102+** → remove `src/lib/supabase/client.ts`, `server.ts`, `service-role.ts` Knip entries as DAL callers are added. (AURA-102 is migration-only and adds no DAL caller, so these entries remain. AURA-102 added `ignore: ["src/types/database.ts"]` and `ignoreBinaries: ["supabase"]` for the generated types file + global CLI.)
- **AURA-106 / Phase 3** → remove `resend`
- **Phase 2–3 (forms)** → remove `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js`
- **Phase 2+ (data/state)** → remove `@tanstack/react-query`, `zustand`
- **Phase 5 (motion)** → remove `gsap`, `framer-motion`
- **Observability (Phase 6)** → remove `@sentry/nextjs`, `@vercel/analytics`
- `eslint-config-next`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` — used via FlatCompat but untraceable by Knip; keep until ESLint config is updated.

### Knip `entry` debt
- ~~`env.ts` entry~~ ✅ Removed in AURA-101 — real importer exists via `server.ts` and `service-role.ts`.
- ~~`server.ts` entry~~ ✅ Removed in AURA-104 — now statically imported by `src/services/auth/guard.ts`.
- ~~`service-role.ts` entry~~ ✅ Removed in AURA-201 — now **statically** imported by `src/dal/settings.dal.ts`, reached by the public `[locale]` layout via `getPublicSettings()`.
- `client.ts` entry remains — `client.ts` has no Client Component consumer yet; retain until the first Client Component imports the browser anon helper.
- `src/services/auth/guard.ts`, `src/services/auth/index.ts`, `scripts/seed-admin.ts` entries added in AURA-104 — remove the guard/index entries when the first admin Route Handler / admin layout (AURA-301) imports the guard.
- `src/domain/properties/media.ts`, `src/services/storage/policy.ts` entries added in AURA-105 — remove when the media upload route (AURA-304) becomes their first real importer.
- `src/services/rate-limit/index.ts` entry added in AURA-106 — the server-only rate-limit barrel has no route consumer yet; remove when the first lead/whatsapp/login Route Handler (Phases 3-4) imports it. (`key.ts` is already imported by the unit test; `limit.ts` is reachable via the barrel.)

---

## Notes for AURA-008 (merged ✅)

- Merge commit: `be43dab feat: add localized homepage shell and smoke test`
- PR #9 squash-merged to `develop`. Feature branch deleted.
- Original implementation commit: `6df46d0` (on deleted feature branch, for reference only)
- `/` → `/en` redirect via explicit 301 in `src/middleware.ts` (`NextResponse.redirect(..., 301)`).
- `/en` homepage shell uses all AURA luxury-dark design token classes.
- Playwright smoke unskipped; 2 tests: 301 status + location header check; `/en` loads without error.
- CI `e2e` job active; installs Chromium only; runs `--project=chromium`.
- `develop` branch protection updated: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL` all required.
- `next-intl` removed from Knip allowlist (now genuinely imported).

---

## Notes for AURA-101 (Supabase helpers — MERGED ✅)

- Merge commit: `95f9df3 feat: add Supabase helpers and local stack`
- PR #11 squash-merged to `develop`. Feature branch `feat/aura-101-supabase-stack` deleted.
- Opus 4.8 review: **APPROVE** — no blocking issues; non-blocking notes only (see CURRENT_STATE.md).
- Supabase CLI 2.106.0 (Homebrew) + Docker 29.5.3: local-stack verified — `supabase start/status/stop` PASS; `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (5/5).
- Key decisions:
  - `getServerEnv()` called in `createSupabaseServerClient()` — validates full server env before any Supabase call
  - `CookieOptions` imported from `@supabase/ssr` for explicit `setAll` parameter typing (TypeScript strict mode)
  - service-role.ts first line is `import 'server-only'` — enforced by security test + dep-cruiser

## Notes for AURA-102 (MERGED ✅)

- Merge commit: `3657e4f feat: add initial MVP database migration` (full SHA `3657e4fd1d2686bab6d6dcf95261a2f184ac9787`)
- PR #13 squash-merged to `develop`. Feature branch `feat/aura-102-initial-migration` deleted.
- Opus 4.8 review: **APPROVE** — merge recommendation **YES**, no blocking issues. Post-review `db:types` reproducibility / failure-safety fixes completed before merge.
- Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.
- Summary: 11 MVP tables; 17 native PostgreSQL enums; generated `src/types/database.ts`; failure-safe `db:types` script; RLS enabled on all 11 tables; **0 RLS policies**; no seed data; no auth; no API routes; no UI.
- No `clients` table, no `client_id` (D-05 merge blocker); no raw IP columns in event tables (D-18/D-51).
- Knip helper entries (`client.ts`, `server.ts`, `service-role.ts`) remain — AURA-102 is migration-only and added no DAL caller; remove per helper as DAL callers are added.

## Notes for AURA-103 (RLS policies — MERGED ✅)

- Merge commit: `1a35958 feat: add RLS policies for MVP tables` (full SHA `1a35958ccf658b6918474b5b1d51b6c5de37be75`)
- PR #15 squash-merged to `develop` (now the source of truth). Feature branch `feat/aura-103-rls-policies` deleted.
- Opus 4.8 review: **APPROVE** — merge recommendation **YES**, no blocking issues.
- Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.
- Summary: new RLS migration (AURA-102 init untouched); **3 role-check helper functions** (`current_user_role`/`is_admin`/`is_super_admin`); **36 policies across 10 tables**; **0 policies on `rate_limits`** (service-role only); least-privilege GRANT layer (REVOKE ALL then per-role DML); **no anon policy on `property_stakeholders`** (deferred to AURA-203); **no DELETE policy on `properties`** (hard delete is service-role-only); RLS stays **enabled on all 11 tables**; generated types updated with the 3 helper functions under `Functions`; DAL + security RLS tests added.
- **Carry-forward:** live RLS tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI.
- **Carry-forward for AURA-104:** anon has INSERT but no SELECT on `leads` / `whatsapp_clicks` — the route layer must use **minimal-return behavior** for those anon inserts.

---

## Do Not Do Yet

- ~~Do not start AURA-009 before AURA-008 merges~~ ✅ AURA-008 merged
- ~~Do not start AURA-104 in this session~~ ✅ AURA-104 merged (`44a7fd4`)
- ~~Do not start AURA-105~~ ✅ AURA-105 merged at `fae3d62`
- ~~Do not start AURA-106~~ ✅ AURA-106 merged at `dd21edd`
- ~~Do not start AURA-107~~ ✅ AURA-107 merged at `04d3522` (Phase 1 complete)
- ~~Do not start AURA-201~~ ✅ AURA-201 merged at `f17b429` (Phase 2 started)
- ~~Do not start AURA-202~~ ✅ AURA-202 merged at `1d4c514` (Phase 2 → 2/7)
- ~~Do not start AURA-203~~ ✅ AURA-203 merged at `b2f6129` (Phase 2 → 3/7)
- Do not fix audit without explicit dep-change approval
- Do not start AURA-204 implementation directly — AURA-204 (Areas overview — DAL + `GET /api/areas`; next Phase 2 task) is **read-only discovery only**; it requires a new session + explicit per-task discovery/planning approval before implementation
- Do not create the AURA-204 branch until discovery is complete and the owner approves
- Do not modify `develop` branch protection from a code/docs session — branch-protection changes are manual owner actions in GitHub Settings (unchanged by AURA-203; the `db-tests` required check remains in place)
- Do not create `.env` / `.env.local` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
- Do not implement further public pages (areas/legal/about) without per-task approval (AURA-204+)
- Do not load fonts via next/font without explicit task approval
