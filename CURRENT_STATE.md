# Current State

**Updated:** 2026-07-01
**Branch:** `develop` — source of truth at `74da365`.
**Phase:** **Phase 1 — COMPLETE** (all 7 tasks AURA-101–AURA-107 merged). **Phase 2 (Public Website) — COMPLETE (7 of 7). Phase 3 (Admin Vertical Slice) — COMPLETE — AURA-301 + AURA-302 + AURA-303 + AURA-304 + AURA-305 + AURA-306 + AURA-307 merged; 7 of 7 Phase 3 tasks done.** AURA-101 merged at `95f9df3`. AURA-102 merged at `3657e4f`. AURA-103 merged at `1a35958`. **AURA-104 (admin auth guard + first-`super_admin` bootstrap script, D-40) merged at `44a7fd4`** — Opus 4.8 **APPROVE**, no blocking issues; required checks green before merge; feature branch deleted. **AURA-105 (storage bucket policies + media path strategy) merged at `fae3d62`** — Opus 4.8 **APPROVE**, no blocking issues; required checks green before merge; feature branch deleted. **AURA-106 (rate-limit service + salted-hash key + TTL cleanup, D-51) merged at `dd21edd`** — Opus 4.8 **APPROVE**, no blocking issues; required checks green before merge; feature branch `feature/aura-106-rate-limit-service` deleted. **AURA-107 (live DAL/security/integration tests in CI via Dockerized Supabase — the Phase 1 exit gate) MERGED at `04d3522`** — Opus 4.8 phase-exit review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge; feature branch `feature/aura-107-dal-security-ci-harness` deleted. **AURA-201 (public `/[locale]` layout + header/footer/navigation + minimal next-intl v4 i18n shell + server-only public settings selector) MERGED at `f17b429`** — targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge (`quality`, `e2e`, `db-tests`, `analyze (javascript-typescript)`, `CodeQL`); feature branch `feature/aura-201-public-layout-i18n-shell` deleted. **AURA-202 (public properties listing + `GET /api/properties` + `GET /api/properties/featured` + `/[locale]/properties` listing page + PropertyCard + homepage featured section) MERGED at `1d4c514`** (PR #27; merged 2026-06-22T12:54:55Z) — targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge (`quality`, `e2e`, `db-tests`, `analyze (javascript-typescript)`, `CodeQL`); feature branch deleted. **AURA-203 (public property detail — `GET /api/properties/[slug]` + `/[locale]/properties/[slug]` + safe stakeholder visibility + contact routing + off-plan block + media gallery) MERGED at `b2f6129`** (PR #29; `feat: add public property detail route`) — targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`); feature branch deleted (local + remote). **AURA-204 (public areas overview — active-only areas DAL + `GET /api/areas` + `/[locale]/areas` overview page + public-safe area DTO + D-44 states) MERGED at `1fe2798`** (PR #31; `feat: add public areas overview`) — targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`); feature branch `feature/aura-204-areas-overview` deleted (local + remote). **AURA-205 (public legal page read — published-only legal DAL + `GET /api/legal/[slug]` + `/en/privacy` + `/en/terms` + safe Markdown render under D-12) MERGED at `3d6a7e0`** (PR #33; `feat: add public legal page read`) — targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`); feature branch `feature/aura-205-legal-page-read` deleted (local + remote). **AURA-206 (SEO basics + AUTEX `noindex` (D-42) + enable Lighthouse advisory CI — SEO metadata + robots/sitemap routes + non-blocking Lighthouse advisory) MERGED at `a106fe8`** (PR #35; `feat: add SEO noindex and Lighthouse advisory`) — **Opus review not required per the AURA-206 task block**; required checks green before merge (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`); feature branch `feature/aura-206-seo-noindex-lighthouse` deleted (local + remote). **AURA-207 (About page (`/en/about`) + Phase 2 public-page completion) MERGED at `65cc384`** (PR #37; `feat: add public about page`) — **Opus review not required per the AURA-207 task block**; required checks green before merge (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`); feature branch `feature/aura-207-about-page` deleted (local + remote). **Phase 2 (Public Website) is now COMPLETE — 7 of 7 Phase 2 tasks done. Phase 3 (Admin Vertical Slice) is now IN PROGRESS — AURA-301 (Admin login + session + role guard wiring) MERGED at `97c9548`** (PR #39; `feat: add admin login and guard wiring`; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge — `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`; feature branch `feature/aura-301-admin-login` deleted local + remote). **AURA-302 (Admin dashboard shell) MERGED at `df4523c`** (PR #41; `feat: add admin dashboard shell`; **Opus review not required per the AURA-302 task block**; required checks green before merge — `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`; feature branch `feature/aura-302-admin-dashboard-shell` deleted local + remote). **AURA-303 (Property CRUD admin + publish checklist) MERGED at `a6cb178`** (PR #43; `feat: add admin property CRUD`; **targeted Opus 4.8 review APPROVE, merge recommendation YES, no blocking issues, no required fixes** — admin write routes + publish/visibility lifecycle + audit logging + service-role audit-log write path all cleared; required checks green before merge — `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`; feature branch `feature/aura-303-property-crud-admin` deleted local + remote). **AURA-304 (Media upload — validation, UUID paths) MERGED at `631bd29`** (PR #45; `feat: add admin media upload`; **targeted Opus 4.8 review APPROVE, merge recommendation YES, no blocking issues, no required fixes** — admin-only media routes + request-scoped authenticated admin session + existing RLS storage-write mechanism (no service-role for media) + UUID storage paths + MIME/size validation all cleared; required checks green before merge — `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`; feature branch `feature/aura-304-media-upload` deleted local + remote). **AURA-305 (Areas admin (add/edit/deactivate)) MERGED at `aee1fda`** (PR #47; `feat: add admin areas management`; **targeted Opus 4.8 review APPROVE, merge recommendation YES, no blocking issues, no required fixes** — admin-only areas routes + request-scoped authenticated admin session + existing RLS (no service-role for area CRUD/upload) + representative area image reusing the existing `property-media` bucket under `areas/{area_id}/{image_id}.{ext}` + admin-only property counts + add/edit/deactivate/reactivate (no hard delete) all cleared; required checks green before merge — `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`; feature branch `feature/aura-305-areas-admin` deleted local + remote). **AURA-306 (Settings admin (allowlist + per-key Zod + audit)) MERGED at `86e8b36`** (PR #49; `feat: add admin settings management`; **targeted Opus 4.8 review APPROVE, merge recommendation YES, no blocking issues, no required fixes** — admin-only settings routes/page + request-scoped authenticated admin session + RLS (no service-role for admin settings GET/PATCH) + exactly the seven public footer keys allowlist + per-key Zod + partial-batch PATCH (unknown/deferred keys + empty patch rejected) + immediate update + `settings_updated` audit (changed key names only) all cleared; required checks green before merge — `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`; feature branch `feature/aura-306-settings-admin` deleted local + remote). **AURA-307 (Legal pages admin — draft→publish, versioning, audit; D-10/D-12 — the seventh Phase 3 task and the Phase 3 exit gate) MERGED at `74da365`** (PR #51; `feat: add admin legal page management`; **initial targeted Opus 4.8 review REQUEST_CHANGES** on a `data:`-prose false-positive in the write-time D-12 guard, fixed in `0b07090 fix: narrow legal protocol guard to URL contexts`; **re-review APPROVE, merge recommendation YES, original blocker RESOLVED, no blocking issues, no required fixes** — guarded admin legal UI under `src/app/admin/(protected)/legal/**` (Markdown-textarea editor + `SafeMarkdown` preview) + admin-only routes `GET/POST /api/admin/legal` + `PATCH /api/admin/legal/[id]` + publish/archive (each `requireAdmin()` directly; both `super_admin` and `client_admin`) + request-scoped authenticated admin session + RLS (no service-role for legal CRUD) + write-time D-12 Markdown-only content guard + row-per-version draft→publish→archive lifecycle + `legal_page_created`/`legal_page_published`/`legal_page_archived` audit (no `legal_page_updated`; draft PATCH not audited) + archive-only (no hard delete) all cleared; required checks green before merge — `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`; feature branch `feature/aura-307-legal-admin` deleted local + remote). **Phase 3 (Admin Vertical Slice) is now COMPLETE — 7 of 7 Phase 3 tasks done. The next task is AURA-401 (Inquiry + contact forms + `POST /api/leads`, validated + rate-limited) — the first Phase 4 (Lead and WhatsApp Conversion) task; not started; read-only discovery only, requires a new session + per-task discovery/planning approval before implementation.**

> Note: AURA-007 (`feat/aura-007-ci-codeql`) was committed and merged to `develop` before this session.
> Note: AURA-101 task is labelled "AURA-009" in continuity docs written during AURA-008; the real task-plan ID is AURA-101.

---

## What Exists

### Governance and Docs
- `CLAUDE.md` — session protocol, model policy, non-negotiable rules, forbidden actions
- `docs/` — 23 docs covering product brief, PRD, MVP scope, glossary, user stories, feature specs, acceptance criteria, architecture, data model, API spec, security, RBAC, quality gates, test strategy, CI/CD, AI coding workflow, skills strategy, agents strategy, decision log, observability, data retention, design system, and the Opus bootstrap foundation audit
- `docs/DECISION_LOG.md` — D-01–D-51 locked, Q-01–Q-15 ratified, A-01–A-11 ratified
- `docs/TASKS_Project.md` — Approved task breakdown (Phase 0–6, 44 tasks)
- `docs/TASKS_PROJECT_REVIEW_OPUS.md` — Opus 4.8 APPROVE_TASK_PLAN verdict
- `docs/BRANCH_PROTECTION.md` — Manual GitHub branch-protection runbook

### Rules and Agents
- `.claude/rules/` — 6 merge-blocker rule files
- `.claude/agents/` — 9 core agent definition files
- `.claude/skills/README.md` — Stage 1 skills strategy (no gate skills created)

### Quality Scripts and Config (AURA-002)
- `eslint.config.mjs` — ESLint 9 flat config; uses `FlatCompat` to bridge `next/core-web-vitals` + `next/typescript`
- `.prettierrc.json` — Prettier config; `prettier-plugin-tailwindcss` already wired in plugins array
- `.prettierignore` — excludes `**/*.md` and build artifacts
- `package.json` — lint script: `eslint .`; quality composite script; all test scripts pointing to `src/tests/`
- `next.config.js` — `eslint: { ignoreDuringBuilds: true }`

### Test Harness (AURA-003)
- `vitest.config.ts` — `setupFiles` and `include` updated to canonical `src/tests/` paths
- `playwright.config.ts` — `testDir` updated to `./src/tests/e2e`
- `src/tests/setup.ts` — Vitest global setup entry point
- Harness tests passing: unit, dal, integration, security (harness level)
- `src/tests/e2e/smoke.spec.ts` — Playwright smoke; unskipped in AURA-008; 2 tests green (301 redirect assertion + `/en` title check)

### Architecture Boundary Enforcement (AURA-004)
- `.dependency-cruiser.cjs` — 12 rules covering all forbidden import directions + `api-route-requires-validation`
- `knip.jsonc` — no-wildcard `ignoreDependencies` allowlist; `next-intl` removed in AURA-008 (now genuinely imported)

### Environment Schema (AURA-005)
- `src/lib/validation/env.schema.ts` — pure Zod schemas; no `server-only`; no `process.env`; fully unit-testable
- `src/lib/config/env.ts` — `getServerEnv()`; `import 'server-only'` guard; lazy + memoized
- `src/lib/config/env.public.ts` — `getPublicEnv()`; client-safe; `NEXT_PUBLIC_*` only
- `.env.example` — 10 variables, placeholders only

### Design Tokens + Tailwind Pipeline (AURA-006)
- `tailwind.config.ts` — Tailwind v3.4.x; `theme.extend` only; `@tailwindcss/typography` plugin; token-backed colors (brand/surface/text/border), font families, font sizes (display–caption), border radii, shadows, motion duration/easing, container max-width, section spacing
- `postcss.config.js` — `{ tailwindcss: {}, autoprefixer: {} }` for Next.js PostCSS pipeline
- `src/styles/tokens.css` — All `luxury-dark` CSS custom properties on `:root`; bare HSL channels for Tailwind opacity support
- `src/styles/globals.css` — Tailwind directives; `@layer base` global resets using tokens; RTL-ready logical CSS properties; `prefers-reduced-motion` respected (D-26)
- `src/app/layout.tsx` — Imports `@/styles/tokens.css` then `@/styles/globals.css`

### CI / CodeQL / Branch Protection (AURA-007)
- `.github/workflows/ci.yml` — quality-gate CI on PR/push to `develop`; `quality` job decomposing all gates; active `e2e` job (enabled in AURA-008); **`db-tests` job added in AURA-107** (A-02). In `quality`, DAL/integration/security run as plain Vitest (static + gated suites self-skip without `SUPABASE_LOCAL_TESTS=1`); the **`db-tests` job boots the Dockerized Supabase CLI local stack, applies all migrations via `supabase db reset`, and runs the DAL/security/integration suites live (`SUPABASE_LOCAL_TESTS=1`)** — no DB mocking (A-02).
- `.github/workflows/codeql.yml` — CodeQL SAST for `javascript-typescript` on PR + push to `develop` + weekly schedule
- `.github/workflows/lighthouse.yml` — **enabled in AURA-206 (CF-4)** as a non-blocking advisory job: runs on PRs to `develop`, `continue-on-error: true`, `treosh/lighthouse-ci-action` (no npm Lighthouse dependency), no score thresholds. **Not a required branch-protection check**; hard-gating deferred to release / AURA-505

### i18n Routing + Middleware (AURA-008) ← NEW
- `src/lib/i18n/routing.ts` — next-intl routing config; `locales: ['en']`, `defaultLocale: 'en'`
- `src/middleware.ts` — explicit HTTP 301 redirect from `/` → `/en`; delegates other paths to next-intl locale middleware; matcher excludes `api`, `_next`, `_vercel`, and static assets

### Homepage Shell (AURA-008)
- `src/app/[locale]/layout.tsx` — **SUPERSEDED by AURA-201:** this layout now owns `<html>`/`<body>`, `lang`/`dir`, global styles, and the next-intl provider, and renders Header/Footer (the AURA-008 version was a minimal nested layout that left `<html>`/`<body>` to the root). See the AURA-201 section below.
- `src/app/[locale]/page.tsx` — minimal luxury-dark homepage shell using all design token Tailwind classes: `bg-surface-page`, `text-text-primary`, `text-text-secondary`, `text-brand-secondary`, `font-display`, `text-display`, `text-caption`, `text-body`. Provides the `<main>` landmark. No data fetching, Supabase, auth, GSAP, or CRM. (Unchanged by AURA-201.)
- `src/app/page.tsx` — updated to defensive fallback `permanentRedirect('/en')` (fires only if middleware is bypassed; middleware handles 301 first)

### Application Scaffold (AURA-001)
- `next.config.js`, `src/app/layout.tsx` — **root layout SUPERSEDED by AURA-201:** now a bare `return children` passthrough (the `[locale]` layout owns `<html>`/`lang`/`dir`/styles); the original static `lang="en"` root no longer applies.
- Full `src/` folder architecture per `docs/ARCHITECTURE.md`

### Continuity Files
- `SESSION_HANDOFF.md`, `CURRENT_STATE.md` (this file), `NEXT_STEPS.md`

---

### Supabase Local Stack + Helpers (AURA-101) ← MERGED (`95f9df3`)

- `supabase/config.toml` — minimal Supabase CLI local stack config; no migrations, no seed data, no secrets
- `src/lib/supabase/client.ts` — browser anon helper; `createBrowserClient` from `@supabase/ssr`; `NEXT_PUBLIC_*` vars only; no server-only imports
- `src/lib/supabase/server.ts` — async server anon helper; `createServerClient` from `@supabase/ssr`; `cookies()` from `next/headers` (Next.js 15 async); calls `getServerEnv()` for fail-fast validation; request-scoped (no global memoization)
- `src/lib/supabase/service-role.ts` — server-only service-role helper; first line is `import 'server-only'`; `createClient` from `@supabase/supabase-js`; memoized singleton; `SUPABASE_SERVICE_ROLE_KEY` never exported; enforced by `no-client-to-service-role` dep-cruiser rule

### Tests (AURA-101) ← NEW
- `src/tests/security/supabase-boundaries.test.ts` — 4 tests: asserts service-role.ts first line is `import 'server-only'`; asserts dep-cruiser has `no-client-to-service-role` rule covering the correct paths
- `src/tests/dal/supabase-smoke.test.ts` — 4 tests (1 skipped in CI): importability smoke for `@supabase/ssr` and `@supabase/supabase-js`; local-stack connection test gated by `SUPABASE_LOCAL_TESTS=1`

### Knip Allowlist (AURA-101) ← UPDATED
- Removed `@supabase/ssr` — now imported by `client.ts` and `server.ts`
- Removed `@supabase/supabase-js` — now imported by `service-role.ts`
- Removed `entry: ["src/lib/config/env.ts"]` — env.ts now has a real importer via `server.ts` and `service-role.ts`
- Added `entry: ["src/lib/supabase/client.ts", "src/lib/supabase/server.ts", "src/lib/supabase/service-role.ts"]` — library modules pending first DAL caller (AURA-102+)

---

### Initial MVP Migration + Generated Types (AURA-102) ← MERGED (`3657e4f`)

- `supabase/migrations/20260616183318_init.sql` — single initial migration creating all 11 MVP tables, 17 native PostgreSQL enum types, the shared `set_updated_at()` trigger function + 7 `updated_at` triggers, the full indexing/uniqueness contract, the generated `properties.title_en` STORED column + GIN full-text index, and `ENABLE ROW LEVEL SECURITY` on all 11 tables. **No RLS policies** (AURA-103), **no seed data**, **no rate_limits cleanup job** (AURA-106). Rollback path documented in the migration header comment.
- `src/types/database.ts` — generated via `npm run db:types` (`supabase gen types --local --lang=typescript`, written to a temp file then `mv`d into place so a failed run never truncates it). Treated as a generated artifact: ignored by Knip, Prettier, and ESLint; never hand-edited.
- `package.json` — added `db:types` script. No dependency / lockfile change.
- `src/tests/dal/schema.test.ts` — static (CI-safe) migration assertions + gated (`SUPABASE_LOCAL_TESTS=1`) live Postgres-catalog introspection via `psql`: 11 tables, 17 enums, enum values, JSONB columns, generated column, unique constraints, all 9 indexes, partial-unique + GIN method, and D-05 / D-18 / D-51 negative scans.
- `src/tests/security/schema-rls.test.ts` — static + gated checks: RLS enabled on all 11 tables, **0 policies**, no `clients`/`client_id`, no raw-IP columns in sensitive tables.
- `knip.jsonc` — added `ignore` for the generated types file and `ignoreBinaries: ["supabase"]` (global CLI).
- `.prettierignore` / `eslint.config.mjs` — exclude the generated types file.
- `src/types/.gitkeep` — removed (superseded by `database.ts`).

**Enums created (17):** `user_role`, `publish_status`, `transaction_type`, `market_type`, `property_type`, `availability_status`, `rental_period`, `furnishing_status`, `price_visibility`, `property_media_type`, `stakeholder_type`, `stakeholder_visibility`, `lead_status`, `lead_source`, `lead_priority`, `preferred_contact_method`, `legal_page_status`.

**Local verification (CLI 2.106.0):** `supabase db reset` applies the migration clean from scratch; `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (26); `SUPABASE_LOCAL_TESTS=1 npm run test:security` PASS (18). Note: `supabase gen types --local` in CLI 2.106 requires `SUPABASE_ACCESS_TOKEN` to be set (any value) to bypass a platform-auth pre-check before it falls through to the local postgres-meta container.

**Opus 4.8 review (PR #13):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**. Post-review, two non-blocking `db:types` reproducibility / failure-safety items were completed before merge: (1) the `db:types` script now writes to `/tmp/aura-database-types.ts` and `mv`s it into place, so a failed generation no longer truncates the tracked `src/types/database.ts` (failure-safety tested with the stack down — the file stays unchanged; success path regenerates **byte-identical** with the stack up); (2) the stale `db:types` script wording in the continuity docs was corrected. This patch changed only script safety and docs accuracy — no schema, migration, type, or test changes.

**Merged:** PR #13 squash-merged into `develop` at `3657e4f feat: add initial MVP database migration` (full SHA `3657e4fd1d2686bab6d6dcf95261a2f184ac9787`). Feature branch `feat/aura-102-initial-migration` deleted. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

---

### RLS Policies + Role Helpers (AURA-103) ← MERGED (`1a35958`)

- `supabase/migrations/20260617025449_rls_policies.sql` — new migration (AURA-102 init untouched). Adds **3 role-check helper functions** (`current_user_role()` = SECURITY DEFINER/STABLE/`search_path=''` to avoid recursive RLS; `is_admin()`/`is_super_admin()` invoker wrappers, `coalesce(...,false)` fail-closed), **36 RLS policies** across 10 tables (rate_limits intentionally has 0), and a **least-privilege GRANT layer**. Documented rollback block in header; **RLS stays ENABLED throughout** (never disabled).
- **Public allowlist:** anon SELECT published properties / active areas / published legal pages / media of published properties; anon INSERT leads + whatsapp_clicks only. **Admin** (authenticated + `is_admin()`/`is_super_admin()`): per the RBAC/Security-Baseline matrix.
- **Locked decisions:** NO anon policy on `property_stakeholders` (deferred to AURA-203); NO DELETE policy on `properties` (and none on `leads`) — hard delete is service-role-only.
- **GRANT finding:** AURA-102 baseline granted anon/authenticated/service_role only `Dxt` (TRUNCATE/REFERENCES/TRIGGER), **no DML** — so explicit grants are required. Migration REVOKEs ALL from anon/authenticated (removing the stray anon TRUNCATE), grants least-privilege DML per role, grants service_role full DML on all 11 tables, and leaves rate_limits with **no anon/authenticated grants**.
- Tests: `src/tests/security/rls-test-utils.ts` (psql role-sim harness, rolled-back transactions, no committed seed), `src/tests/security/rls-policies.test.ts` (negatives + catalog), `src/tests/dal/rls-policies.test.ts` (positives). `src/tests/security/schema-rls.test.ts` updated (0-policy assertion → policies-now-exist; rate_limits stays policy-free).
- Generated types: `src/types/database.ts` gained the 3 helper functions under `Functions` (expected; no table/enum type change).
- Local: `supabase db reset` clean; gated `test:dal` 41 PASS, `test:security` 43 PASS; `quality` PASS; `audit` PASS.

**Merged:** PR #15 squash-merged into `develop` at `1a35958 feat: add RLS policies for MVP tables` (full SHA `1a35958ccf658b6918474b5b1d51b6c5de37be75`); `develop` is now the source of truth. Feature branch `feat/aura-103-rls-policies` deleted. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

**Opus 4.8 review (PR #15):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**.

**Carry-forward:** live RLS tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI. For **AURA-104**: anon has INSERT but no SELECT on `leads` / `whatsapp_clicks`, so the route layer must use **minimal-return behavior** for those anon inserts.

---

### Admin Auth Guard + Bootstrap Script (AURA-104) ← MERGED (`44a7fd4`)

Application-layer admin authorization + first-`super_admin` bootstrap. **No migration, no `config.toml` change, no signup route/UI, no API routes, no admin UI.**

- `src/services/auth/types.ts` — pure types + typed `AuthorizationError` (`status` 401/403 + stable `code`; maps to the API `{ error, code }` envelope).
- `src/services/auth/policy.ts` — pure `isAdminRole` / `isSuperAdminRole` / `evaluateAccess`. Encodes the admin contract: a valid session AND a `user_profiles` row AND a qualifying role are all required — **auth alone is never sufficient**. Yields 401 `UNAUTHENTICATED` / 403 `NO_PROFILE` / 403 `INSUFFICIENT_ROLE` / allowed.
- `src/services/auth/guard.ts` — **`import 'server-only'`**; `getCurrentUser` / `getCurrentAdmin` / `requireAdmin` / `requireSuperAdmin`. Uses `createSupabaseServerClient()` (anon, request-scoped) + `supabase.auth.getUser()` (server-verified, not the cookie session). Reads the caller's **own** `user_profiles` row under their session (RLS own-row), then delegates to `evaluateAccess`. **Never imports/uses the service-role client.** Role source of truth = `public.user_profiles.role`; admin roles `super_admin`/`client_admin` (D-30).
- `src/services/auth/index.ts` — server-only public barrel.
- `scripts/seed-admin.ts` — operator-only. Links an **existing** Supabase Auth user to a `super_admin` `user_profiles` row. **Creates no Auth users/passwords; no self-signup** (D-40). Inputs `--user-id`/`--full-name` (CLI) with optional `SEED_ADMIN_USER_ID`/`SEED_ADMIN_FULL_NAME` env fallback (**not** in the app env schema). Verifies the user via `auth.admin.getUserById`, then **idempotent** (already-super_admin → no-op) + **fail-closed** (different existing role → refuse, exit non-zero). Uses `getSupabaseServiceRole()` via a dynamic import inside `main()` + a direct-run guard so unit tests never trip `server-only`.
- Tests: unit (`auth-policy`, `seed-admin` — pure, no DB), security (`auth-guard` — static boundary + no-self-signup + no service-role in UI), integration (`auth-guard`, `seed-admin` — gated `SUPABASE_LOCAL_TESTS=1`, real RLS substrate via the AURA-103 psql harness, no DB mocking).
- `knip.jsonc` — removed `src/lib/supabase/server.ts` entry (now imported by `guard.ts`); added `guard.ts` / `index.ts` / `scripts/seed-admin.ts` entries.

**Production note (D-40):** hosted Supabase must set `enable_signup = false`. Local `config.toml` stays `enable_signup = true` (unchanged) — the app-layer guard rejects any session without a valid admin profile, so local signup drift is non-dangerous.

**Local verification (CLI 2.106.0):** `supabase db reset` clean; `SUPABASE_LOCAL_TESTS=1 npm run test:security` PASS (6 files, 53); `SUPABASE_LOCAL_TESTS=1 npm run test:integration` PASS (3 files, 7); `npm run quality` PASS; `npm run audit` PASS (2 moderate postcss carry-forward). Blocker greps clean.

**Merged:** PR #17 squash-merged into `develop` at `44a7fd4 feat: add admin auth guard and bootstrap script`. Feature branch `feat/aura-104-auth-rbac` deleted. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

**Opus 4.8 review (PR #17):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**. The non-runnable `scripts/seed-admin.ts` runner decision was accepted as a non-blocking follow-up.

**Carry-forward:** (1) **runner decision needed** to execute `scripts/seed-admin.ts` (no `tsx`/`ts-node` in repo; none added — locked decision #3; tracked as non-blocking follow-up); (2) **production hosted Supabase must set `enable_signup = false`** (D-40) — local `config.toml` stays `true`, app-layer guard makes local signup drift non-dangerous; (3) AURA-301 will consume the guard and should remove the `guard.ts`/`index.ts` Knip entries; (4) live guard/seed integration tests are local-only until AURA-107 wires the Dockerized stack into CI.

---

### Storage Bucket Policies + Media Path Strategy (AURA-105) ← MERGED (`fae3d62`)

Supabase Storage layer for property media: the `property-media` bucket + admin-only `storage.objects` policies, plus a pure media validation/path contract. **No upload route/UI, no admin UI, no signed URLs, no service-role usage, no `config.toml`/`.env`/lockfile change.**

- `supabase/migrations/20260619201518_storage_policies.sql` — creates/reconciles the **`property-media`** bucket (`public = true`, `file_size_limit = 10485760`, `allowed_mime_types = {image/jpeg,image/png,image/webp}`) idempotently via `ON CONFLICT`; adds **4 admin-only `storage.objects` policies** (`property_media_objects_admin_{select,insert,update,delete}`) scoped to `bucket_id = 'property-media'` and gated by `public.is_admin()`. **No anon policy** on `storage.objects` (no public list/enumeration; public read is via the bucket `public` flag). Documented rollback block + the public-read CDN-revocation known limitation (signed URLs deferred).
- `src/domain/properties/media.ts` — **pure** contract (no React/Supabase/service-role/I/O): constants (`MEDIA_BUCKET`, `MAX_MEDIA_BYTES = 10_485_760`, `ALLOWED_MEDIA_MIME_TYPES`, `MEDIA_TYPES`, `MIME_EXTENSION`), Zod schemas, `validateMediaUpload`, `extensionForMime`, and `buildMediaStoragePath` → `properties/{property_id}/{media_type}/{media_id}.{ext}` (UUID-only components; extension derived from MIME; rejects non-UUID / traversal / slash injection; never trusts a user filename).
- `src/services/storage/policy.ts` — server-safe storage contract surface: re-exports the bucket/path contract from domain + declares `MEDIA_BUCKET_CONFIG` and `MEDIA_OBJECT_POLICIES` (single source of truth cross-checked against the migration in tests). No Supabase/service-role import.
- Tests: `src/tests/unit/media-contract.test.ts` (19, CI-safe), `src/tests/security/storage-policies.test.ts` (static migration + contract assertions, CI-safe; gated `SUPABASE_LOCAL_TESTS=1` catalog + behavioural access-control). NOTE on gated coverage: anon write/list denial is proven by the "no anon policy" catalog assertion + behavioural anon INSERT denial — behavioural anon UPDATE/DELETE are intentionally omitted (RLS silently filters UPDATE to 0 rows; `storage.protect_delete()` blocks ALL direct SQL DELETEs regardless of role).
- `knip.jsonc` — added `src/domain/properties/media.ts` + `src/services/storage/policy.ts` as `entry` (first real importer is the AURA-304 upload route; remove then).

**Local verification (CLI 2.106.0):** `supabase db reset` applies all three migrations clean; `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (41); `SUPABASE_LOCAL_TESTS=1 npm run test:security` PASS (7 files, 74); `npm run quality` PASS; `npm run audit` PASS (exit 0; 2 moderate postcss carry-forward). Forbidden-path greps clean (no `.env`/lockfile/`config.toml`; no `client_id`/tenant; no raw IP; no real video/360; no service-role in components/app/domain).

**Merged:** PR #19 squash-merged into `develop` at `fae3d62 feat: add storage bucket policies and media path strategy`. Feature branch `feature/aura-105-storage-bucket-policies` deleted. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

**Opus 4.8 review (PR #19):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**.

**Carry-forward:** (1) live storage catalog/behavioural tests are **local-only** until **AURA-107** wires the Dockerized stack into CI; (2) AURA-304 (upload route) is the first real importer of the media/storage modules — remove their Knip `entry` lines then; (3) **public-read bucket limitation** (a retained object URL stays fetchable after a property is unpublished/archived) is documented and deferred — full revocation needs signed URLs (out of MVP); (4) hosted-Supabase note: creating `storage.objects` policies via migration runs as `postgres` (supported on the platform; superuser locally).

---

### Rate-Limit Service + Salted-Hash Key + TTL Cleanup (AURA-106) ← MERGED (`dd21edd`)

Full server-side rate-limit service (D-51) — the salted-hash key strategy, threshold enforcement, AND the 24h-TTL cleanup. **Not wired into any route** (lead/whatsapp/login consume it in Phases 3-4); **no `.env`/`config.toml`/lockfile change**; `rate_limits` table shape, RLS, and grants are unchanged from AURA-102/103.

**Merged:** PR #21 squash-merged into `develop` at `dd21edd feat: add rate-limit service and TTL cleanup`. Feature branch `feature/aura-106-rate-limit-service` deleted. **Opus 4.8 review (PR #21): APPROVE, merge recommendation YES, no blocking issues** (three non-blocking hardening notes preserved below). Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

- `src/services/rate-limit/key.ts` — **pure** (no `server-only`, no env, no I/O): `hashRateLimitKey(salt, ip, route)` = `HMAC-SHA256(salt, `${ip}:${route}`)` hex; `RATE_LIMIT_RULES` (A-03: `lead_submit` 5/h, `whatsapp_click` 30/h, `login` 5/15min); `getRateLimitRule`/`isRateLimitRoute`; `RateLimitResult`/`RateLimitRoute`/`RateLimitRule` types. Raw IP is an in-memory arg only — never in the output.
- `src/services/rate-limit/limit.ts` — **`server-only`** enforcement runtime: reads `RATE_LIMIT_SALT` via `getServerEnv()`, derives the key, calls `consume_rate_limit` via the service-role client, returns the structured `RateLimitResult`. Raw IP never stored/returned/logged.
- `src/services/rate-limit/index.ts` — barrel (server-only-tainted; `entry` in Knip until a route imports it).
- `supabase/migrations/20260619230918_rate_limit_functions.sql` — **new** migration (existing migrations untouched): `public.consume_rate_limit(p_key_hash, p_route, p_limit, p_window_seconds)` (atomic check-and-increment: insert / window-reset / increment / deny; `expires_at` refreshed to now()+24h on allow, untouched on deny) and `public.cleanup_rate_limits()` (deletes `expires_at < now()`, returns count, idempotent). Both **`SECURITY DEFINER`, `search_path=''`**, EXECUTE revoked from public → granted only to `service_role`. Adds `rate_limits_expires_at_idx`. **Guarded** hourly pg_cron job `aura-rate-limits-cleanup` (`0 * * * *`) wrapped so a missing pg_cron degrades to a `NOTICE` (never fails `db reset`); equivalent external scheduler is the A-16 fallback. Documented rollback (unschedule → drop functions → drop index; never drops the table).
- `src/types/database.ts` — regenerated: `Functions` now includes `consume_rate_limit` + `cleanup_rate_limits` (no table/enum change).
- Tests: `src/tests/unit/rate-limit.test.ts` (pure: HMAC determinism, no-raw-IP, thresholds, unknown-route); `src/tests/dal/rate-limit.test.ts` (gated behavioural: consume increment/deny/reset/TTL, cleanup expired/fresh/idempotent); `src/tests/security/rate-limit-functions.test.ts` (static migration hardening + gated negatives: SECURITY DEFINER, anon/auth cannot execute, rate_limits still 0 policies / no grants / no IP column).
- `knip.jsonc` — added `src/services/rate-limit/index.ts` as `entry` (no route consumer yet).

**Local verification (CLI 2.106.0):** `supabase db reset` applies all four migrations clean (pg_cron present on this stack → job scheduled; NOTICE confirms). `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (5 files, 49); `… test:security` PASS (8 files, 94); `npm run quality` PASS; `npm run test:unit` 65 PASS; `npm run audit` PASS (exit 0; 2 moderate postcss carry-forward). Forbidden-path greps clean (no `.env`/lockfile/`config.toml`; no `client_id`/tenant; no raw IP; no new rate_limits policy/anon-auth grant; no service-role in components/app/domain).

**Opus 4.8 review:** **APPROVE — merged.** Merge recommendation **YES**, no blocking issues.

**Carry-forward:** (1) live consume/cleanup tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107**; (2) the rate-limit service has **no route importer yet** — Phases 3-4 (lead/whatsapp/login) are first; remove the `src/services/rate-limit/index.ts` Knip `entry` then; (3) **pg_cron is environment-dependent** — where unavailable, `cleanup_rate_limits()` must be driven by an equivalent external scheduler (A-16); on hosted Supabase confirm pg_cron is enabled.

**Non-blocking Opus hardening notes (preserved for a future task; not actioned at merge):** (1) add a defensive DB guard so `consume_rate_limit` requires `p_limit > 0` and `p_window_seconds > 0` (today only `service_role` calls it with validated config values); (2) tighten the `RATE_LIMIT_SALT` minimum length in `src/lib/validation/env.schema.ts` (currently `z.string().min(1)` — pre-existing from AURA-101, out of AURA-106 scope); (3) reconfirm/regenerate `src/types/database.ts` from the live stack in a future DB-touching task (the AURA-106 function types were hand-added and verified accurate against the SQL).

---

### Live DAL/Security/Integration Tests in CI (AURA-107) ← MERGED (`04d3522`) — **PHASE 1 EXIT GATE**

CI/test-infrastructure only — brings the previously local-only gated suites into CI against a Dockerized Supabase stack. **No product code, no migration, no `package.json`/lockfile, no `.env`/`config.toml`/secrets change** (diff is two files: `.github/workflows/ci.yml` + `src/tests/dal/supabase-smoke.test.ts`).

- `.github/workflows/ci.yml` — new **`db-tests`** job (separate from `quality`, which stays the fast gate and was not weakened): Node 20 + npm `11.12.1` pin (consistent with `quality`/`e2e`), `npm ci`, ensures `psql` is available, `supabase/setup-cli@v1` pinned to **`2.106.0`**, `supabase start` → `supabase db reset` (applies all 4 migrations), `pg_isready` readiness wait, then `test:dal` / `test:security` / `test:integration` with `SUPABASE_LOCAL_TESTS=1`; teardown `supabase stop` runs `if: always()` and tolerates a never-installed CLI. `timeout-minutes: 15`. No secrets / no production resources (local-default `postgres:postgres` creds only).
- `src/tests/dal/supabase-smoke.test.ts` — Node-20 harness fix: the gated reachability test now proves the local stack is reachable with a raw `fetch` against `/rest/v1/` instead of constructing a `supabase-js` client (`createClient()` eagerly builds a `RealtimeClient` that needs a global `WebSocket`, absent in Node < 22). `createClient` importability is still asserted by the CI-smoke `describe` block, so no coverage is lost; the fetch reachability assertion remains. No `ws` dependency added; Node baseline stays 20 (consistent across all jobs).

**Live CI evidence (`db-tests` green, run job 82498034393):** all 4 migrations applied (`init`, `rls_policies`, `storage_policies`, `rate_limit_functions`); Postgres readiness confirmed; **`test:dal` 49 passed**, **`test:security` 94 passed**, **`test:integration` 7 passed** (zero skips in live mode); stack stopped cleanly. Counts match the local pre-PR verification.

**Merged:** PR #23 squash-merged into `develop` at `04d3522 ci: run live Supabase DAL and security tests`. Feature branch `feature/aura-107-dal-security-ci-harness` deleted. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, and the new **`db-tests`**.

**Opus 4.8 phase-exit review (PR #23):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**.

**Branch protection:** **`db-tests` is now required on `develop`** (verified via API: required checks are `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, `db-tests`). **The AURA-107 Phase 1 exit gate is now fully enforced by branch protection.** With AURA-107 merged, the previously local-only carry-forwards from AURA-103/104/105/106 ("live tests are local-only until AURA-107") are now resolved — those suites run live in CI.

---

### Public Layout + i18n Shell + Public Settings Selector (AURA-201) ← MERGED (`f17b429`) — **PHASE 2 STARTED**

First Phase 2 task: the public site shell. Delivers the public `/[locale]` layout (header / navigation / footer), a minimal next-intl v4 i18n shell (English-only visible UI, RTL-ready), and a **server-only public settings safe selector** backing a settings-driven footer. **No migration, no `package.json`/lockfile change, no `.env`/`supabase/config.toml` change, no admin code, no property listing/detail, no areas, no legal pages, no lead/WhatsApp implementation, no AURA-202+ work.** Diff is 16 files (layouts, layout components, settings selector + domain contract, i18n config, messages, tests, `knip.jsonc`, `next.config.js`).

- `src/app/layout.tsx` — root layout reduced to a **passthrough** (`return children`); the `[locale]` layout now owns `<html>`/`<body>`, `lang`/`dir`, global styles, and the next-intl provider.
- `src/app/[locale]/layout.tsx` — localized layout: validates the locale via `hasLocale(routing.locales, …)` → `notFound()`; `setRequestLocale`; resolves messages + public settings in parallel; renders `<html lang={locale} dir={getLocaleDirection(locale)}>` with `NextIntlClientProvider`, `<Header />`, page `children`, and the settings-driven `<Footer />`. `export const dynamic = 'force-dynamic'` so the settings-backed footer reads at request time (build never needs a running DB).
- `src/components/layout/{Header,Navigation,Footer}.tsx` — presentational server components. **No Supabase/DAL/service import.** `Header` = brand wordmark + `Navigation`; `Navigation` = locale-prefixed links to the not-yet-built AURA-202+ routes (`properties`/`areas`/`about`/`legal`) inside a `<nav aria-label>`; `Footer` receives only the `PublicSettings` DTO as a prop and renders agency name/tagline/address, contact links (tel/WhatsApp/email), social links, and the static **Q-13 AUTEX disclosure** (UI copy, not DB-driven).
- `src/dal/settings.dal.ts` — **`import 'server-only'`** safe selector `getPublicSettings()`: uses the service-role client (RLS-bypass, server-only), `select('key, value')` only, filters to the public allowlist at the query level, projects through `projectPublicSettings`, and **fails closed** (any error → `defaultPublicSettings()`). No raw rows ever returned. (`settings` has no anon RLS policy → this is the only public read path.)
- `src/domain/settings/public-settings.ts` + `index.ts` — **pure** contract (no Supabase/`server-only`/I/O): `PUBLIC_SETTING_KEYS` allowlist (`agency_name`, `agency_phone`, `agency_email`, `agency_whatsapp`, `agency_address`, `footer_tagline`, `social_links`), `PublicSettings` DTO, `defaultPublicSettings()` (fresh safe demo defaults), and `projectPublicSettings(rows)` — allowlist filter + per-key Zod (non-empty strings, `.email()`, fixed-platform `social_links` partial schema that strips unknown platforms); malformed/missing values fail closed to safe defaults; row metadata (`updated_by`/timestamps) can never leak (only `key`+`value` consumed).
- `src/i18n/request.ts` — next-intl v4 `getRequestConfig`: resolves the active locale (`hasLocale` + `defaultLocale` fallback) and supplies the statically-imported `en` catalog; documented upgrade path to dynamic import for a second locale.
- `src/lib/i18n/direction.ts` — pure `getLocaleDirection(locale)` → `'ltr'`/`'rtl'`; RTL locale set pre-mapped (`ar`) so Arabic can later flip `<html dir>` with no structural change. **Arabic UI is NOT implemented** (`routing.locales` is `['en']`).
- `src/messages/en.json` — Header/Navigation/Footer message catalog incl. the AUTEX disclosure copy.
- `next.config.js` — wires `createNextIntlPlugin('./src/i18n/request.ts')` (the next-intl v4 plugin; previously middleware-only).
- Tests: `src/tests/unit/settings-public.test.ts` (pure projector — allowlist exactness, defaults, per-key fail-closed validation, social stripping, metadata/internal-key no-leak); `src/tests/dal/settings.dal.test.ts` (live-DB `psql` contract inside `begin … rollback`, gated `SUPABASE_LOCAL_TESTS=1` — proves the same allowlist/`key,value`-only/no-metadata guarantees the `server-only` selector relies on, since it cannot be imported into Vitest); `src/tests/e2e/smoke.spec.ts` (extended — header/nav/main/footer landmarks, footer agency name, AUTEX disclosure, `lang`/`dir`).
- `knip.jsonc` — removed `src/lib/supabase/service-role.ts` from `entry` (now statically imported by `src/dal/settings.dal.ts`, reached by the public `[locale]` layout via `getPublicSettings()`). No other Knip change; no allowlist weakened.

**Merged:** PR #25 squash-merged into `develop` at `f17b429 feat: add public layout and settings-driven footer`. Feature branch `feature/aura-201-public-layout-i18n-shell` deleted (local + remote). Required checks passed before merge: `quality`, `e2e`, `db-tests`, `analyze (javascript-typescript)`, `CodeQL`.

**Targeted Opus 4.8 review (PR #25):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**. The review specifically cleared the service-role public-settings selector (server-only boundary intact, double allowlist, fail-closed, no metadata/secret leak), the component data-boundary (no Supabase/DAL in layout components), the root/`[locale]` layout structure (no double `<html>`/`<body>`), and the next-intl v4 setup.

**Carry-forward / non-blocking (from the Opus review; preserved for future tasks):**
1. **Settings selector observability** — `getPublicSettings()` fail-closed branches (`catch`/`if (error)`) swallow errors silently; a misconfigured service-role env or downed DB renders demo defaults with no signal. Add server-side logging/Sentry breadcrumb (defer to observability work, Phase 6).
2. **Stricter phone/WhatsApp validation later** — `agency_phone`/`agency_whatsapp` validate only as non-empty strings (safe at render: WhatsApp strips to digits, phone via `tel:`). Tighten when `libphonenumber-js` is wired for lead/contact work (Phase 2–3).
3. **Skip-to-content cleanup** — `Header.skipToContent` message key exists in `en.json` but no skip link is rendered; either wire a skip link (a11y) or drop the key.
4. **Future settings caching/revalidate** — `force-dynamic` means every public page does a service-role settings read per request with no caching; revisit with `revalidate`/tag-based caching if settings reads become hot.

---

### Public Properties Listing + API (AURA-202) ← MERGED (`1d4c514`) — **PHASE 2 (2/7)**

Second Phase 2 task: the first public **data** page. Delivers published-only property reads through an anon-client DAL behind the RLS public-read boundary, two validated public API routes, the listing page (reusing the AURA-201 layout shell), the `PropertyCard`, and the homepage featured section. **No migration, no `package.json`/`package-lock.json` change, no `.env`/`supabase/config.toml` change, no CI change, no admin code, no property detail route/page (AURA-203), no stakeholder projection, no contact routing, no lead/WhatsApp routes, no media upload, no areas overview, no legal pages, no SEO/Lighthouse, no cinematic/GSAP, no AURA-203+ work.** Diff is 19 files, all under `src/` (domain, DAL, API routes, listing page + states, PropertyCard, homepage featured section, `en.json`, and unit/DAL/security/integration/e2e tests).

**What exists (AURA-202):**
- **Public properties DAL** — `src/dal/properties.dal.ts` (`import 'server-only'`): `listPublishedProperties()` (filters/search/sort/pagination) + `listFeaturedProperties(limit)`. Uses the **anon server client** (`createSupabaseServerClient()`), **never** the service role — RLS is the enforcement boundary, and the DAL **re-asserts `publish_status = 'published'`** on every read (and `is_featured = true` for featured) as defence in depth. Explicit public-safe **column allowlist** (never `select('*')`); raw DB rows never leave the DAL; only DTOs are returned. Cover images resolved via a single **batched** media query (no N+1); `storage_path` never selected.
- **`GET /api/properties`** — `src/app/api/properties/route.ts`: Zod-validated query (allowlisted filters; pagination default page 1 / limit 12, hard cap 50 that clamps; invalid page/limit/filter → 400; `max_price < min_price` → 400). Envelope `{ data, pagination: { page, limit, total, totalPages } }`. Generic errors only (no raw DB leak); `force-dynamic`.
- **`GET /api/properties/featured`** — `src/app/api/properties/featured/route.ts`: Zod-validated `limit` (default 6, hard max 12; invalid → 400). Envelope `{ data }`. Generic errors; `force-dynamic`.
- **`/[locale]/properties` listing page** — `src/app/[locale]/properties/page.tsx` (Server Component): reads `searchParams`, validates via the domain schema, calls the DAL directly (no API round-trip, no client fetch, no react-query). All D-44 states: `loading.tsx`, empty, validation-error, data-error (`error.tsx` client retry boundary), success grid. `PropertyFilters` is a presentational GET-form server component (no client JS, no Supabase).
- **`PropertyCard`** — `src/components/real-estate/PropertyCard.tsx`: presentational, **props-only** (a public-safe `PropertyCardDTO`); imports no Supabase/DAL/services. Price/AED/price-on-application come from pure domain helpers. Links to the AURA-203-owned detail route (intentional, dead until AURA-203).
- **Homepage featured section** — `src/app/[locale]/page.tsx`: published-featured DAL read that **fails closed** to an empty list on any DB/env error (build/e2e/production resilient without a seeded DB). No cinematic/GSAP (AURA-502).
- **Pure domain** — `src/domain/properties/{query,card,format}.ts`: Zod query contract (single source of truth), the **public-safe DTO** + key-only projector (structurally drops any sensitive field), and AED price formatting (A-11, D-48). No React/Supabase/DAL imports.
- **i18n** — `src/messages/en.json`: `Properties`, `PropertyCard`, `FeaturedProperties`, `ListingStates` namespaces (listing/card/featured/state copy). No detail-page or admin strings.
- **Tests added** — unit (`properties-query`, `property-card-formatting` incl. a sensitive-field-drop projection test), live-DB DAL (`properties.dal.test.ts`), security boundary (`properties-public-boundary.test.ts`), integration (`properties-api.test.ts`, DAL mocked), e2e (`properties.spec.ts`, data-independent).

**Public data boundary (verified at merge):** anon server client (not service-role) → RLS scopes anon reads to published properties / active areas / published-parent media (`property_stakeholders` has no anon policy) → DAL re-asserts published + explicit column allowlist → key-only DTO projection. Sensitive columns (`views_count`, `address`, `external_map_url`, `agent_*`, `internal_notes`, `storage_path`, `created_by`/`updated_by`, `description`, off-plan/payment-plan detail) are never selected or projected.

**Merged:** PR #27 squash-merged into `develop` at `1d4c514 feat: add public properties listing and API` (full SHA `1d4c514399da18249495733c10f4a1b0edf52fc3`; merged 2026-06-22T12:54:55Z; pre-squash implementation commit `1b05e35`). Feature branch deleted. Required checks passed before merge: `quality`, `e2e`, `db-tests`, `analyze (javascript-typescript)`, `CodeQL`.

**Targeted Opus 4.8 review (PR #27):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**. The review specifically cleared the public data-exposure boundary (anon client, RLS reliance, explicit allowlist, no service role, no sensitive-field leakage), the API contract/validation, DAL correctness (search/sort/pagination/area resolution/cover media), and the UI/D-44 states.

**Carry-forward / non-blocking (from the Opus review; preserved for future tasks, not actioned at merge):**
1. **FTS index expression/performance mismatch** — DAL search is correct, but the existing GIN index (`to_tsvector('english', coalesce(title_en,''))`) is not used by the query (`to_tsvector('english', title_en)`), so search falls back to a sequential scan. Correctness is unaffected; the index lives in a pre-existing migration, so this is a future migration/performance task, **not** an AURA-202 blocker.
2. **RTL badge class** — `PropertyCard` featured badge uses the physical `left-3`; future polish should use the logical `start-3` (the only physical directional class in `src/`; zero runtime impact while MVP is English-only).
3. **Static sensitive-token scan completeness** — expand the future security static scan to also include `agent_name`, `description`, `payment_plan_summary`. Do **not** add `off_plan` (it is a valid public `market_type` enum/filter value).
4. **E2E CI wiring** — `properties.spec.ts` passes locally but CI's `e2e` job runs the smoke spec only (`test:smoke`); consider wiring full `test:e2e` into CI in a future task.
5. **Unused i18n keys** — `PropertyCard.viewDetails` and `PropertyCard.currency` are currently unused (knip does not scan message keys); remove or use in a future cleanup.
6. **Detail-route link** — `PropertyCard` links to `/{locale}/properties/{slug}`, but AURA-203 owns that route's implementation. This is expected (dead-until-AURA-203).

---

### Public Property Detail + Stakeholder Visibility + Contact Routing (AURA-203) ← MERGED (`b2f6129`) — **PHASE 2 (3/7)**

Third Phase 2 task: the public property **detail** surface, reusing the AURA-201 layout shell and a new published-only detail DAL. **No migration, no `package.json`/`package-lock.json` change, no `.env`/`supabase/config.toml` change, no CI change, no admin code, no lead/WhatsApp routes, no media upload, no SEO/noindex, no similar properties, no cinematic/GSAP, no AURA-204+ work.** The AURA-202 listing DAL (`src/dal/properties.dal.ts`) is **untouched** — AURA-203 added a **separate** `src/dal/property-detail.dal.ts` so AURA-202's guarantees stay independently asserted.

**What exists (AURA-203):**
- **`GET /api/properties/[slug]`** — public, Zod-validated slug; published-only; `{ data }` envelope; `400` invalid slug / `404` missing-draft-archived / generic `500`; no service role in the handler; `force-dynamic`.
- **`/[locale]/properties/[slug]`** — server-rendered detail page (no client-side data fetching); calls the DAL directly; full D-44 states (`loading.tsx` / `error.tsx` + retry / `not-found.tsx` / success).
- **Published-only property + media reads** via the **anon server client** + RLS (DAL also re-asserts `publish_status = 'published'`); draft/archived/missing slug → `404` (indistinguishable from missing — no oracle).
- **Public-safe detail DTO** (explicit allowlist; never `select('*')`; raw rows never leave the DAL; no `address`, `views_count`, `created_by`/`updated_by`, timestamps, `publish_status`, `area_id`, or `storage_path`).
- **Public media gallery** — images + floorplans (when present); public CDN `url` only (never `storage_path`); cover-first ordering; alt-text with fallback.
- **Price-on-application rendering** (D-48) and an **off-plan block shown only when `market_type = off_plan`** (D-36).
- **Safe public stakeholder projection** — `{ name, type }` only, **only** for `visibility = public` on a published property; `internal_only` stakeholders and all stakeholder PII (phone/email/whatsapp, registration/license, internal notes) are never exposed. The stakeholder read is the **only** public path (no anon RLS policy/grant on `property_stakeholders`) and is confined to a **narrow, server-only, fail-closed service-role selector** in the DAL (`select('name, type')`, `visibility='public'`, `[]` on error); its `propertyId` always comes from an already-published anon fetch.
- **Contact routing** (D-13/D-14): property override → agency fallback → **never** stakeholder; a single resolved CTA (whatsapp/phone/email/none); raw contact fields are never surfaced.
- **Tests added** — unit (`property-contact-routing`, `property-detail`), live-DB DAL (`property-detail.dal`), security boundary (`property-detail-public-boundary`), integration (`property-detail-api`), e2e (`property-detail`).

**Public data boundary (verified at merge):** property/media reads use the anon server client (RLS is the boundary; DAL re-asserts published) → service-role is confined to the narrow `{ name, type }` stakeholder selector (fail-closed; published-parent only by caller contract) → key-only DTO projection structurally drops any sensitive field. Adversarial Opus review found **no** internal_only/PII/draft/archived leak path.

**Merged:** PR #29 squash-merged into `develop` at `b2f6129 feat: add public property detail route`. Feature branch `feature/aura-203-property-detail` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`.

**Targeted Opus 4.8 review (PR #29):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**. The review (incl. an adversarial 6-vector boundary attack) cleared the property/media/stakeholder/contact public boundaries, the API contract/validation, DAL correctness, and the UI/D-44 states.

**Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **CI e2e coverage** — CI's `e2e` job runs `test:smoke` only; `property-detail.spec.ts` (and AURA-202's `properties.spec.ts`) are full-`test:e2e`/local, not run by CI `e2e`. Future follow-up: decide whether CI should run full `npm run test:e2e`.
2. **Detail e2e happy-path** — `property-detail.spec.ts` is data-independent and verifies only the not-found/error graceful states; add a seeded happy-path detail e2e when the test-data strategy supports it.
3. **FEATURE_SPECS contact-routing drift** — synced in this PR: the spec now lists the implemented/locked 6-step priority (property whatsapp/phone/email → agency whatsapp/phone/email → none; never stakeholder).
4. **Optional stakeholder defense-in-depth** — make the service-role public-stakeholder selector's safety local to the query with an explicit published-parent check (current control flow is approved and not blocking).
5. **CI ergonomics** — pre-existing: the wait-for-server loop could fail earlier/more clearly; not an AURA-203 blocker.

---

### Public Areas Overview (AURA-204) ← MERGED (`1fe2798`) — **PHASE 2 (4/7)**

Fourth Phase 2 task: the public areas overview, reusing the AURA-201 layout shell and the AURA-202/203 DAL/domain patterns. **No migration, no `package.json`/`package-lock.json` change, no `.env`/`supabase/config.toml` change, no CI change, no admin code, no area detail page, no property counts, no property aggregation, no AURA-205+ work.**

**What exists (AURA-204):**
- **Public active-only areas DAL** — `src/dal/areas.dal.ts` (`import 'server-only'`): reads **active areas only** via the anon server client + RLS (RLS scopes anon area reads to `is_active = true`; the DAL also re-asserts active as defence in depth). Explicit public-safe column allowlist (never `select('*')`); raw rows never leave the DAL; only DTOs returned. Fixed ordering `sort_order ASC`, then `slug ASC`.
- **`GET /api/areas`** — `src/app/api/areas/route.ts`: Zod-validated; **no query params accepted**; envelope `{ data }`; generic errors only (no raw DB leak); `force-dynamic`.
- **`/[locale]/areas` overview page** — server-rendered; calls the DAL directly (no client-side data fetch); all D-44 states (loading / empty / error + retry / success). `AreaCard` is presentational/props-only (no Supabase/DAL import).
- **Public-safe area DTO** — fields **only**: `slug`, `name`, `description`, `imageUrl`. No `id`, no `is_active`, no `sort_order`, no timestamps, **no property counts**, **no property aggregation**.
- **Active-only / inactive-hidden public boundary** — inactive areas never reach the public; anon read boundary tests cover active-visible / inactive-hidden.
- **Tests added** — DAL (active-only), integration (API), security (anon cannot read inactive areas), e2e (areas page).

**Merged:** PR #31 squash-merged into `develop` at `1fe2798 feat: add public areas overview`. Feature branch `feature/aura-204-areas-overview` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`.

**Targeted Opus 4.8 review (PR #31):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**.

**Carry-forward / non-blocking (preserved for future tasks, not actioned at merge):**
1. **Inline DAL-error retry affordance** — the `/en/areas` inline caught-DAL-error path renders an inline error without retry; the route `error.tsx` boundary has retry, but the inline caught error does not. Future improvement: either let the DAL error propagate to `error.tsx`, or add a refresh/retry affordance to the inline error.
2. **Area i18n extraction is English-only** — acceptable for the current `/en` MVP; needs locale-aware extraction when Arabic / more locales are added.
3. **`AreaCard` uses a plain `<img>`** — not `next/image`; acceptable for AURA-204, revisit in AURA-206 / Lighthouse / performance phase.

---

### Public Legal Page Read + Safe Markdown Render (AURA-205) ← MERGED (`3d6a7e0`) — **PHASE 2 (5/7)**

Fifth Phase 2 task: the public legal pages (Privacy / Terms), reusing the AURA-201 layout shell and the AURA-202/203/204 DAL/domain patterns. This is the first task to render admin-authored content, so it implements the **D-12 safe-render boundary** (no unsafe/raw HTML). **No migration, no `.env`/`supabase/config.toml` change, no CI change, no admin legal editing, no SEO/noindex/Lighthouse, no About page, no AURA-206+ work.** Two **approved** dependencies were added (`react-markdown`, `rehype-sanitize`).

**What exists (AURA-205):**
- **Public published-only legal DAL** — `src/dal/legal.dal.ts` (`import 'server-only'`): reads **published legal pages only** via the anon server client + RLS (RLS scopes anon reads to `status = 'published'`; the DAL also re-asserts published as defence in depth). Explicit public-safe column allowlist (never `select('*')`); raw rows never leave the DAL; only the DTO is returned.
- **`GET /api/legal/[slug]`** — `src/app/api/legal/[slug]/route.ts`: Zod-validated slug; published-only; `{ data }` envelope; `400` invalid slug / `404` missing-draft-archived / generic `500`; no service role in the handler; `force-dynamic`. Draft/archived/missing legal pages return **404 publicly**.
- **`/en/privacy` + `/en/terms`** — `src/app/[locale]/{privacy,terms}/page.tsx`: server-rendered (no client-side data fetch); call the DAL directly; full D-44 states (`loading.tsx` / `error.tsx` + retry / `not-found.tsx` / success).
- **Safe Markdown render (D-12)** — `src/components/legal/SafeMarkdown.tsx` renders the legal Markdown via **`react-markdown` + `rehype-sanitize`**. **No `dangerouslySetInnerHTML`, no `rehype-raw`, no `marked`, no DOMPurify, no unsafe raw HTML path.** `src/components/legal/LegalPageView.tsx` is the presentational view.
- **Public DTO fields only** — `slug`, `title`, `content`, `effectiveDate`. `content` is raw Markdown in the DTO, rendered safely at the render layer; no admin/version/status metadata leaks.
- **Navigation** — `src/components/layout/Navigation.tsx` changed from the dead `/legal` link to `Privacy` and `Terms` locale-prefixed links.
- **Pure domain** — `src/domain/legal/legal-page.ts`: supported slugs (`privacy`, `terms`), Zod contract, and public-safe DTO projector.
- **Tests added** — unit (`legal-page`, `safe-markdown`), live-DB DAL (`legal.dal`), security boundary (`legal-public-boundary`), integration (`legal-api`), e2e (`legal`).

**Public data boundary (verified at merge):** anon server client (not service-role) → RLS scopes anon legal reads to **published** pages → DAL re-asserts published + explicit column allowlist → key-only DTO projection (`{ slug, title, content, effectiveDate }`) → Markdown rendered through `react-markdown` + `rehype-sanitize` (no raw-HTML path). Draft/archived/missing → `404`.

**Merged:** PR #33 squash-merged into `develop` at `3d6a7e0 feat: add public legal page read`. Feature branch `feature/aura-205-legal-page-read` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. The D-12 merge-blocker rule is satisfied (safe Markdown + sanitizer; no raw HTML).

**Targeted Opus 4.8 review (PR #33):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**. The adversarial D-12 review cleared the safe-render boundary (no `dangerouslySetInnerHTML`/`rehype-raw`/raw HTML), the published-only public read, and the DTO projection.

**Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **Legal page `force-dynamic` comment accuracy** — the legal page comments say they inherit `force-dynamic` from the `[locale]` layout; route-segment config does **not** inherit parent→child, so the comment is inaccurate-but-harmless (actual dynamic behavior is still safe — the DAL reads cookies and the layout has `force-dynamic`). Future cleanup: clarify the comment.
2. **Legal e2e is a liveness smoke** — it does not distinguish article-rendered vs not-found-rendered. Acceptable for AURA-205 (live DAL/security/integration cover data behavior); a future improvement may add a seeded happy-path e2e.
3. **SafeMarkdown payload tests** — add committed `SafeMarkdown` tests for `data:` and `vbscript:` payloads in a future hardening patch.
4. **Default sanitize schema permits remote Markdown images** — acceptable for trusted admin legal content; future hardening may drop images or pin a custom schema if untrusted content ever flows through the renderer.
5. **Empty title JSONB may render an empty `<h1>`** — a content-quality issue, not security; a future validation/admin workflow should prevent this.

---

### SEO Basics + AUTEX noindex (D-42) + Lighthouse Advisory CI (AURA-206) ← MERGED (`a106fe8`) — **PHASE 2 (6/7)**

Sixth Phase 2 task: SEO metadata basics, the AUTEX **`noindex`-by-default** posture (D-42), `robots.txt` + `sitemap.xml` routes, and the now-enabled **non-blocking Lighthouse advisory CI**. Reuses the AURA-201 layout shell and the AURA-202–205 patterns. **No migration, no `.env`/`supabase/config.toml` change, no DAL/data-boundary change, no admin code, no About page, no real-client indexing, no production deploy config, no canonical/OpenGraph/Twitter, no npm Lighthouse dependency, no branch-protection change, no AURA-207+ work.**

**What exists (AURA-206):**
- **Source-controlled feature config** — `src/config/feature-flags.ts`: `featureFlags.publicIndexingEnabled = false` (default `noindex`, D-42) and a demo-safe `publicSiteUrl = "https://autex.example"` (reserved `.example` host). Compile-time constants checked into source — **not** read from env/deployment config. Enabling real-client indexing is a deliberate future source change + owner approval (out of scope).
- **Pure SEO helpers** — `src/lib/seo/metadata.ts` + `src/lib/seo/routes.ts`: build Next.js `Metadata` (title / description / robots). The robots directive **fails closed to `noindex, nofollow`** unless indexing is explicitly enabled. No React, no Supabase, no DAL, no IO. Scope is title + description + robots only (no canonical, no OpenGraph, no Twitter cards).
- **Public route metadata** — added to `/en`, `/en/properties`, `/en/properties/[slug]`, `/en/areas`, `/en/privacy`, `/en/terms`; the `[locale]` layout also sets the global default-`noindex` robots. Property-detail metadata is **generic** via `generateMetadata` with **no DAL/database read** (dynamic per-property SEO is out of scope).
- **`robots.txt` route** — `src/app/robots.ts`: **allows crawl** (`allow: '/'`, **no `Disallow: /`** — so crawlers can fetch pages and see the per-page `noindex`), and advertises `…/sitemap.xml`. Static; config-driven; no env/DB.
- **`sitemap.xml` route** — `src/app/sitemap.ts`: lists **only the existing static public routes** (`/en`, `/en/properties`, `/en/areas`, `/en/privacy`, `/en/terms`); **excludes `/en/about`** (AURA-207, not built) and **excludes dynamic property-detail URLs**. No DAL/database reads.
- **Lighthouse advisory CI** — `.github/workflows/lighthouse.yml`: enabled on PRs to `develop`, `continue-on-error: true`, `treosh/lighthouse-ci-action` (no npm dependency added), no score thresholds. **Non-blocking and not a required branch-protection check**; hard-gating deferred to release / AURA-505.
- **Tests added** — unit (`src/tests/unit/seo-metadata.test.ts` — config default + default-`noindex` + route metadata; `src/tests/unit/lighthouse-workflow.test.ts` — advisory/non-blocking guards), integration (`src/tests/integration/seo-routes.test.ts` — robots allows crawl + no `Disallow: /`; sitemap includes the 5 static routes and excludes `/en/about` + dynamic detail URLs), and a **noindex assertion** added to the CI-run `src/tests/e2e/smoke.spec.ts`.

**Merged:** PR #35 squash-merged into `develop` at `a106fe8 feat: add SEO noindex and Lighthouse advisory`. Feature branch `feature/aura-206-seo-noindex-lighthouse` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`.

**Opus review:** **Not required** per the AURA-206 task block (no architecture/security/migration/data-boundary decision changed; D-42 `noindex` is a documented locked decision).

**Carry-forward / non-blocking (preserved for future tasks):**
1. **Canonical URLs deferred** — not implemented in AURA-206.
2. **OpenGraph / Twitter cards deferred** — not implemented in AURA-206.
3. **Real-client indexing deferred** — flipping `publicIndexingEnabled` to `true` requires a future config change + explicit owner approval.
4. **Lighthouse remains advisory** — the hard score gate (Desktop > 90; Mobile > 75 cinematic / 80 prod; CLS < 0.1) is deferred to release / **AURA-505**.
5. **`/en/about` not implemented** — owned by **AURA-207**; intentionally excluded from the sitemap until it exists.
6. **Dynamic property-detail sitemap URLs deferred** — a future data-driven sitemap decision; AURA-206 keeps the sitemap static (no DAL read).

---

### Public About Page (AURA-207) ← MERGED (`65cc384`) — **PHASE 2 (7/7) → PHASE 2 COMPLETE**

Seventh and final Phase 2 task: the public About page, completing the Phase 2 public surface. Reuses the AURA-201 layout shell and the AURA-206 SEO/noindex helper. **No migration, no DAL/Supabase/settings read from the page, no new DB/DAL, no `.env`/`supabase/config.toml`/package/CI change, no admin code, no contact/lead form, no WhatsApp tracking, no media upload, no cinematic/GSAP, no real-client indexing, no canonical/OpenGraph/Twitter, no branch-protection change.**

**What exists (AURA-207):**
- **Public route `/en/about`** — `src/app/[locale]/about/page.tsx`: a **Server Component** reusing the AURA-201 public layout shell. Calls `setRequestLocale(locale)` + `getTranslations`; renders a `<main>` landmark, exactly one `<h1>`, and accessible semantic sections (hero, trust/agency pillars, operating principles, disclosure).
- **Fully static, demo-safe content** — all visible copy comes from the new `About` namespace in `src/messages/en.json`; AUTEX is presented as a premium Dubai real estate advisory **concept/demo brand** (no claim of a real licensed brokerage / RERA / broker license / awards / years in market).
- **No data access** — the page imports only `next`, `next-intl/server`, and the AURA-206 SEO helper (`@/lib/seo/routes`). **No DAL / Supabase / service-role / settings read.** Because it is static, only the D-44 success/render state is relevant — no `loading`/`error`/`not-found` files.
- **SEO/noindex** — `about` route key added to `src/lib/seo/routes.ts`; the page exports `metadata = publicRouteMetadata('about')`, so `/en/about` emits AUTEX **`noindex` by default** (D-42). No canonical/OpenGraph/Twitter.
- **AUTEX disclosure** — the visible on-page disclosure reuses the existing **`Footer.disclosure`** translation string (Q-13), consistent with the footer.
- **Sitemap** — `/en/about` added to `PUBLIC_SITEMAP_PATHS` in `src/app/sitemap.ts` (it now exists); dynamic property-detail URLs remain excluded; no DAL reads.
- **Tests added/updated** — `src/tests/e2e/smoke.spec.ts` (the CI-run smoke spec: `/en/about` loads, has `<main>`, a single visible `<h1>`, the AUTEX disclosure text, and `noindex` metadata), `src/tests/unit/seo-metadata.test.ts` (`about` route metadata key + default-`noindex`), `src/tests/integration/seo-routes.test.ts` (sitemap now includes `/en/about`, still excludes dynamic property-detail URLs).

**Merged:** PR #37 squash-merged into `develop` at `65cc384 feat: add public about page`. Feature branch `feature/aura-207-about-page` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`.

**Opus review:** **Not required** per the AURA-207 task block (static demo-safe page; no architecture/security/migration/data-boundary decision changed; reuses the D-42 `noindex` helper).

**Phase 2 status:** **COMPLETE (7/7).** The public surface — layout/footer (AURA-201), properties listing + API (AURA-202), property detail (AURA-203), areas overview (AURA-204), legal pages (AURA-205), SEO/noindex + robots/sitemap + Lighthouse advisory (AURA-206), and the About page (AURA-207) — is fully merged.

**Carry-forward / non-blocking (preserved for future tasks):**
1. **About content is static and not admin-editable** — a future task could make it data/settings-driven if required (out of MVP scope).
2. **Real-client indexing remains deferred** — `/en/about` is `noindex` by default; flipping `publicIndexingEnabled` to `true` is a future config change + owner approval.
3. **Canonical / OpenGraph / Twitter remain deferred** — not added for the About page.

---

### Admin Login + Session + Role Guard (AURA-301) ← MERGED (`97c9548`) — **PHASE 3 STARTED (1/7)**

First Phase 3 (Admin Vertical Slice) task: the admin login page, server-side session handling, and the role guard wired across `/admin/**`, reusing the AURA-104 guard and the AURA-106 login rate-limit. **No new migration, no `supabase/config.toml`/`.env` change, no `package.json`/`package-lock.json` change, no CI workflow change, no branch-protection change, no service-role in client/UI, no raw IP persistence/logging, no dashboard shell/content beyond a minimal placeholder, no CRUD, no AURA-302+ work.**

**What exists (AURA-301):**
- **`/admin/login`** — `src/app/admin/login/page.tsx` + `AdminLoginForm.tsx` (`'use client'`): **login only — no signup, no password reset**. The client component imports no Supabase/service-role/server env; it drives the server action exclusively and shows generic, non-enumerating error copy. Admin is hard `noindex` (not derived from the public indexing flag).
- **Server-side login action** — `src/app/admin/login/actions.ts` (`'use server'`): (1) Zod-validate input; (2) **rate-limit before any auth attempt** via the AURA-106 `login` rule (5 / 15 min / key; salted-hash key; raw IP used in-memory only, never stored/logged); (3) `signInWithPassword` on the anon server client; (4) **post-auth role validation** via the AURA-104 guard (`resolveAdminAccess`) — **auth alone is insufficient**; an authenticated-but-unprivileged session is signed back out and returned a generic `unauthorized`; (5) redirect to `/admin`. Supabase errors map to generic codes; no password/token/cookie/JWT/IP logging.
- **AURA-104 guard reuse** — `src/services/auth/guard.ts` adds `resolveAdminAccess` (authorize an already-verified user against the request-scoped client) and `src/services/auth/index.ts` re-exports it. Identity is established with verified `auth.getUser()` (never `getSession()`); the `user_profiles` own-row read is RLS-scoped (`id = auth.uid()`); admin roles are `super_admin` / `client_admin` (D-30). Access requires **all of**: a verified user **+** a `user_profiles` row **+** a qualifying role.
- **`/admin` minimal guarded placeholder** — `src/app/admin/(protected)/page.tsx` behind `src/app/admin/(protected)/layout.tsx`, which enforces the full guard server-side and **fails closed** (any guard error → `/admin/login`; `401` → `/admin/login`; `403` → `/admin/login?error=unauthorized`). The login page is outside the `(protected)` group, so it is never guarded (no redirect loop). `src/app/admin/layout.tsx` owns `<html>`/`<body>` for the non-localized admin subtree (mirrors the AURA-201 `[locale]` pattern; one `<html>`/`<body>` per route) and is deliberately unguarded.
- **Middleware** — `src/middleware.ts` adds `admin` to the next-intl matcher exclusion, so `/admin` and `/admin/login` are never rewritten to a locale prefix (`/admin/login` stays `/admin/login`, not `/en/admin/login`); the `/` → `/en` redirect and localized public routes are unchanged.
- **Knip** — `knip.jsonc`: removed the `src/services/auth/guard.ts` entry (now consumed by the protected layout + login action via the barrel); kept `src/services/auth/index.ts` and `src/services/rate-limit/index.ts` entries (their barrels still re-export not-yet-wired surface consumed by later Phase 3-4 tasks).
- **Tests added/updated** — unit (`admin-login` login schema), integration (`admin-login`: login rate-limit rule + allow/deny contract + live-DB gated own-row RLS read), e2e (`admin-login.spec`: login-only + non-locale-prefixed + guard-not-bypassable + gated happy path), smoke (`smoke.spec`: `/admin/login` loads + `noindex` + unauthenticated `/admin` → login), security (`auth-guard`: AURA-301 boundary block). The two public-boundary security tests (`legal-public-boundary`, `property-detail-public-boundary`) were **retargeted** off the now-stale global `src/app/admin` non-existence assertion to the specific `src/app/admin/legal` / `src/app/api/admin` checks.

**Security boundary (verified at merge):** verified `auth.getUser()` + `user_profiles` row + admin role (auth alone never sufficient) → server-side fail-closed guard at the layout + the login action → service-role sealed server-only (the login action uses the anon server client; service-role is reachable only through the server-only rate-limit service) → no raw IP persisted (D-18/D-51) → **D-40 no-self-signup satisfied** (no signup route/UI/link; the seed/admin script remains the only first-`super_admin` path).

**Merged:** PR #39 squash-merged into `develop` at `97c9548 feat: add admin login and guard wiring`. Feature branch `feature/aura-301-admin-login` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`.

**Targeted Opus 4.8 review (PR #39):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**.

**Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **Harden login rate-limit IP source** — the login IP uses the leftmost `x-forwarded-for` hop (client-spoofable on a proxied platform); prefer a trusted source (`x-real-ip` / rightmost trusted hop), best folded into AURA-106 (its rule example uses the same pattern).
2. **Decide `/admin` Supabase session-refresh strategy before the real dashboard** — `/admin` is excluded from middleware and there is no session-refresh middleware; the guard's `auth.getUser()` is fail-closed (secure), but refreshed tokens are not re-persisted, which can shorten effective sessions.
3. **Add a seeded-admin happy-path e2e in CI** — the successful-login e2e is gated on `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI; seed an admin so the full cookie → redirect → guard-pass path runs.
4. **Future `/api/admin/*` route handlers must call `requireAdmin()` / `requireSuperAdmin()` individually** — the layout guard protects pages, not Route Handlers.

---

### Admin Dashboard Shell (AURA-302) ← MERGED (`df4523c`) — **PHASE 3 (2/7)**

Second Phase 3 (Admin Vertical Slice) task: an authenticated **dashboard shell** behind the existing AURA-301 protected layout — navigation to the future admin sections plus placeholder panels, **with no metrics and no data reads**. Consumes the AURA-301 `(protected)` guard; **introduces no new auth/security/data boundary**. **No migration, no `supabase/config.toml`/`.env` change, no `package.json`/`package-lock.json` change, no CI workflow change, no branch-protection change, no service-role/DAL/Supabase/services in the admin UI, no admin API routes, no CRUD, no metrics/aggregation, no AURA-303+ work.**

**What exists (AURA-302):**
- **`/admin/dashboard`** — `src/app/admin/(protected)/dashboard/page.tsx`: the guarded dashboard shell. It lives **inside the `(protected)` group**, so the AURA-301 layout guard wraps it server-side (fail-closed); built as a **dynamic** route (inherits `force-dynamic` from the protected layout). Renders one `<main>`, one `<h1>` ("Dashboard"), a labelled admin `<nav>`, and placeholder panels. Admin is hard `noindex` (re-asserted on the page; also inherited from the admin root layout).
- **No unguarded route** — there is **no** `src/app/admin/dashboard/**` (a sibling of `(protected)` would not inherit the guard and would be publicly reachable). The dashboard is only ever at `src/app/admin/(protected)/dashboard/**`.
- **`/admin` redirect** — `src/app/admin/(protected)/page.tsx` now `redirect('/admin/dashboard')` (the old minimal placeholder copy is gone). It stays inside `(protected)`, so the guard runs first: unauthenticated `/admin` → `/admin/login`; authenticated `/admin` → `/admin/dashboard`.
- **Separate non-localized admin shell** — `src/components/admin/{AdminShell,AdminSidebar,AdminTopBar,AdminNav,AdminPlaceholderPanel}.tsx`: presentational components only, static copy, luxury-dark tokens. **A simple sidebar + top-bar shell** (not the public marketing Header/Footer/Navigation — admin is non-localized and does NOT use next-intl or the public layout components). No Supabase/DAL/services/service-role import.
- **Admin nav links** — to the future sections `/admin/properties`, `/admin/leads`, `/admin/areas`, `/admin/settings`, `/admin/legal` (plus `/admin/dashboard`). These target routes are **not implemented** (AURA-303–307) and 404 until their tasks land — expected; **no placeholder route files were created** for them.
- **Placeholder panels only** — static "Coming soon" cards per section; **no metrics, no real cards, no aggregation, no data reads, no live data**.
- **Both admin roles see the same shell** — `super_admin` and `client_admin` get an identical shell in AURA-302 (no role-conditional nav).
- **Tests added/updated** — unit (`admin-shell` — one `<main>`, labelled nav with all five section links, placeholder panels; CI-safe static render), security (`auth-guard` — AURA-302 block: guarded location, no unguarded `src/app/admin/dashboard`, `/admin`→`/admin/dashboard` redirect, no DAL/Supabase/services/service-role/next-intl/public-layout in admin UI), e2e/smoke (`admin-login.spec` / `smoke.spec` — unauthenticated `/admin/dashboard` → `/admin/login`; full authenticated dashboard render gated behind `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD`, skipped in CI).

**Security boundary (verified at merge):** the dashboard shell is guarded only by the **existing AURA-301 `(protected)` server-side fail-closed guard** (verified `auth.getUser()` + `user_profiles` row + admin role); AURA-302 adds no auth logic of its own, no unguarded admin route, and no service-role/DAL/Supabase access from the UI. D-40 no-self-signup remains satisfied (no signup/reset path added).

**Merged:** PR #41 squash-merged into `develop` at `df4523c feat: add admin dashboard shell`. Feature branch `feature/aura-302-admin-dashboard-shell` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`.

**Opus review:** **Not required** per the AURA-302 task block (consumes the existing protected layout; no new auth/security/data boundary, no migration, no architecture change).

**Carry-forward / non-blocking (preserved for future tasks, not actioned at merge):**
1. **Seeded-admin happy-path e2e in CI** — the full authenticated dashboard render is gated on `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI (same limitation as AURA-301); seed an admin so the cookie → guard → shell-render path runs in CI.
2. **AURA-301 carry-forwards remain relevant** — harden the login rate-limit IP source; decide the `/admin` Supabase session-refresh strategy before richer admin work; future `/api/admin/*` route handlers must each call `requireAdmin()` / `requireSuperAdmin()` (the layout guard protects pages, not Route Handlers).

---

### Admin Property CRUD + Publish Checklist (AURA-303) ← MERGED (`a6cb178`) — **PHASE 3 (3/7)**

Third Phase 3 (Admin Vertical Slice) task: admin property **create / edit / publish / archive / duplicate** with a publish-readiness checklist and append-only audit logging. The first task to add **admin write routes**, the **publish/visibility lifecycle**, and the **service-role audit-log write path** — all cleared by a targeted Opus 4.8 review (**APPROVE**, no blockers, no required fixes). **No media upload (AURA-304), no stakeholder/areas/settings/legal admin, no lead/WhatsApp flows, no dashboard metrics, no hard delete, no unpublish flow, no migration, no `supabase/config.toml`/`.env` change, no `package.json`/`package-lock.json` change, no CI workflow change, no branch-protection change.**

**What exists (AURA-303):**
- **Guarded admin property pages** — under `src/app/admin/(protected)/properties/**`: the list page (`page.tsx`), `new/page.tsx` (create form), and `[id]/edit/page.tsx` (edit form). All live **inside the `(protected)` group** so the AURA-301 server-side fail-closed guard wraps them; **no unguarded `src/app/admin/properties/**` route exists**. The edit page is a Server Component that reads via the admin DAL (`getAdminPropertyById`); the forms are presentational client components.
- **Admin property API routes** — `GET/POST /api/admin/properties`, `PATCH /api/admin/properties/[id]`, `POST /api/admin/properties/[id]/duplicate`, `PATCH /api/admin/properties/[id]/archive`. **Every route calls `requireAdmin()` directly** (via the shared `withAdmin` helper in `src/app/api/admin/properties/_helpers.ts`) — the `(protected)` layout guards pages, not Route Handlers. Both `super_admin` and `client_admin` may manage properties (RBAC); no property action is super-admin-only. All input is Zod-validated; errors use the generic `{ error, code }` envelope with no DB-detail leak.
- **Admin write DAL** — `src/dal/admin-properties.dal.ts` (`import 'server-only'`): admin reads (all statuses) + writes (create/update/publish/archive/duplicate) under the **caller's own authenticated admin session + existing RLS — never the service role** (the `properties_admin_*` policies gated on `public.is_admin()` are the enforcement boundary). Explicit column allowlists (never `select('*')`); no `.delete()` is ever issued (no DELETE endpoint, no DELETE policy — hard delete stays default-deny). The public `src/dal/properties.dal.ts` is **untouched** and remains public-read-only (the split mirrors the AURA-203 `property-detail.dal.ts` pattern).
- **Server-only audit DAL** — `src/dal/audit-logs.dal.ts` (`import 'server-only'`): the only application write path for `audit_logs`, using the RLS-bypassing **service-role client** (RLS grants `authenticated` no insert on `audit_logs`; super_admin SELECT only). Append-only (insert only); snapshots are curated to a small non-PII field set (D-38). Throws on insert failure so a missing audit is **loud, never silently swallowed**.
- **Pure domain logic** — `src/domain/properties/{admin,admin-view,publish}.ts` (no React/Supabase/DAL/I/O): the create/update/duplicate Zod contracts + taxonomy enums (D-36), slug derivation/immutability + reference-number formatting, lifecycle predicates (`canEditProperty`/`canPublish`/`canArchive`/`canMutateSlug`, D-32), the `buildUpdatePayload` immutability backstop (strips slug/reference/publish_status/timestamps/ownership), the duplicate projection, the admin DTOs, and the `evaluatePublishChecklist` rules.
- **Publish checklist** — blocks draft → published unless: English title + English description present; valid transaction/market/property/availability/price-visibility taxonomy; location label present; price present when `price_visibility = visible`; rental period present for a visibly-priced rental; bedrooms present for residential types (nullable for office/plot/retail/warehouse, D-09); off-plan fields present only when `market_type = off_plan` (D-36); at least one **cover image** in `property_media` **with non-empty alt text**. **Media upload is NOT implemented** — the checklist only **reads** existing media rows (upload is AURA-304).
- **Reference-number + slug generation** — slug derived from `title.en`, collision-suffixed, **immutable after publish** (A-06); reference number defaults to `AUTEX-NNNNN` with an optional validated override; uniqueness enforced via insert-retry on the unique constraint (no migration required for generation).
- **Lifecycle / mutation rules** — create = draft; edit draft allowed; publish a draft only if the checklist passes; edit a published property allowed except slug immutability; archive from draft/published (`publish_status = archived`, `archived_at = now`) — the MVP way to remove a listing from public view (D-32); archived properties reject edits; **no `published → draft` unpublish** and **no hard delete** in MVP.
- **Audit logging** — an `audit_logs` row is written for `property_created`, `property_updated`, `property_published`, `property_archived`, and `property_duplicated` (the duplicate action is additive hardening beyond the documented minimum-action list).
- **Tests added** — unit (`property-admin-domain`, `property-admin-schema`, `property-publish-checklist`), security boundary (`admin-properties-boundary` — every route guarded via `requireAdmin`, not `requireSuperAdmin`; no service-role/DAL/Supabase in UI; no unguarded admin page; no DELETE handler / no `.delete()`; audit DAL server-only + insert-only; and `property-detail-public-boundary` regression — anon cannot read draft/archived), integration (`admin-properties-api` — 401/403/validation/conflict/checklist/archived + audit calls, DAL/auth/audit mocked), live-DB DAL (`admin-properties.dal` — gated `SUPABASE_LOCAL_TESTS=1`: admin reads all statuses, anon published-only, hard delete denied, admin cannot insert audit directly), and e2e guard (`admin-properties` — unauthenticated redirect to `/admin/login`; seeded admin flow gated/skipped in CI).

**Security / data-boundary (verified at merge):** admin property writes run under the **caller's own admin session + RLS** (no service role); the **only** service-role path is the server-only `audit-logs.dal.ts`; no service-role import/key reaches any client/UI component (dep-cruiser `no-client-to-service-role` clean). Draft/archived properties remain non-public (anon RLS = published-only); archive hides a property from public reads; publish makes a valid property public only after the checklist passes; no public route can write properties. `audit_logs` stays RLS-protected (super_admin SELECT only; no authenticated insert). The targeted Opus review cleared all six Opus-required risk areas (admin write routes, publish/visibility, audit logging, service-role boundary, public visibility boundary, RLS boundary).

**Merged:** PR #43 squash-merged into `develop` at `a6cb178 feat: add admin property CRUD`. Feature branch `feature/aura-303-property-crud-admin` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`.

**Targeted Opus 4.8 review (PR #43):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**, **no required fixes before merge**.

**Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **Document `property_duplicated`** as a controlled audit action — it is emitted + tested but is not yet in the documented minimum-action list (`DATA_MODEL.md` / `SECURITY_BASELINE.md`); add it (done in this docs-sync).
2. **Audit-write ordering caveat** — each route commits the property mutation **first**, then writes the audit row; an audit-insert failure is **loud** (maps to a generic 500, never silently swallowed) but does not roll back the committed change. A future hardening may move mutation + audit into a single transaction/RPC.
3. **Ratify no `published → draft` unpublish in MVP** — the one-way lifecycle is an implementation inference from D-32 (archive is the way to remove a property from public view), not yet a named decision; recorded here / in `NEXT_STEPS.md` for ratification.
4. **Add direct 401/403 integration assertions** for `PATCH /api/admin/properties/[id]` and `POST /api/admin/properties/[id]/duplicate` — currently their auth boundary is proven structurally (all routes route through `withAdmin` → `requireAdmin`) rather than with a per-verb behavioural assertion.
5. **Stale code-comment cleanup (future, code-only)** — a header comment in `src/domain/properties/admin.ts` references `src/dal/properties.dal.ts` where the actual write DAL is `src/dal/admin-properties.dal.ts`. Cosmetic; defer to a future code cleanup (not touched in this docs-sync).

---

### Admin Property Media Upload (AURA-304) ← MERGED (`631bd29`) — **PHASE 3 (4/7)**

Fourth Phase 3 (Admin Vertical Slice) task: admin **upload / update / delete** of property media (images + floorplan images) with type/size validation, server-built UUID paths, and cover-image/alt-text controls — the first real consumer of the AURA-105 storage policies + media path contract. **No migration, no Supabase config change, no `package.json`/`package-lock.json` change, no CI workflow change, no branch-protection change, no signed URLs, no CDN revocation, no video/360/virtual-tour, no image processing/resizing/transcoding, no manual reordering, no multi-file upload/drag-drop, no media audit actions, no AURA-305+ work.**

**What exists (AURA-304):**
- **Admin-only media routes** — `POST /api/admin/properties/[id]/media`, `PATCH /api/admin/properties/[id]/media/[mediaId]`, `DELETE /api/admin/properties/[id]/media/[mediaId]`. **Every route calls `requireAdmin()` directly** via `withAdmin` (the `(protected)` layout guards pages, not Route Handlers). Both `super_admin` and `client_admin` may manage property media; all input Zod-validated; generic `{ error, code }` errors.
- **Media behavior** — `POST` creates a storage object **and** a `property_media` row; `PATCH` edits `alt_text` and/or `is_cover`; `DELETE` removes the DB row **and** the storage object. Archived properties reject media mutation; media must belong to the property.
- **Admin media manager UI** — `src/components/admin/PropertyMediaManager.tsx`, wired into `src/app/admin/(protected)/properties/[id]/edit/page.tsx`: upload, alt-text editing, and cover selection.
- **Admin property media DAL** — `src/dal/admin-property-media.dal.ts`.
- **Server-only storage service** — `src/services/storage/property-media.ts`.
- **Storage-write mechanism** — a **request-scoped authenticated admin Supabase client + existing RLS — no service role for media** upload/update/delete (the AURA-303 service-role boundary, the audit writer, is unchanged).
- **Storage path** — **server-built and UUID-based**; extension derived from the MIME type only; the original filename is never trusted (no enumeration).
- **Upload validation** — single-file upload only; allowed MIME `image/jpeg` / `image/png` / `image/webp`; 10MB max; **no video / 360 / virtual-tour**.
- **Cover rules** — single-cover rule enforced in **app logic**; only an image can be cover (floorplan cannot be cover); deleting the cover does **not** auto-pick another — the publish checklist then blocks publish until another cover image with alt text exists.
- **Media domain contract** — extended `src/domain/properties/media.ts` (first real importer of the AURA-105 media/storage modules).
- **Tests added** — unit (media validation / cover rules / publish-checklist regression), integration (route contract), security boundary, gated live-DB DAL/RLS media tests, and e2e admin media tests (seeded-admin gating).

**Security / data boundary (verified at merge):** media routes are admin-only (`requireAdmin()` directly; no public upload/update/delete); storage writes use the caller's own authenticated admin session + existing RLS (no service role); UUID server-built paths (no enumeration); MIME + size validation; published-property media stays publicly readable only via published-parent visibility (draft/archived media not public). Signed URLs / CDN revocation remain deferred.

**Merged:** PR #45 squash-merged into `develop` at `631bd29 feat: add admin media upload`. Feature branch `feature/aura-304-media-upload` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests` (Lighthouse advisory non-blocking).

**Targeted Opus 4.8 review (PR #45):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**, **no required fixes before merge**.

**Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **Magic-byte / content sniffing on upload** — consider validating file content (magic bytes) as defense-in-depth; MIME is currently trusted from the request.
2. **DB-level single-cover guarantee** — the single-cover rule is app-level in AURA-304; a partial unique index on `(property_id) where is_cover` could enforce it at the DB level if multi-admin write concurrency becomes a concern.
3. **Public-read bucket CDN revocation gap** — track toward the deferred signed-URL / CDN work (a retained object URL stays fetchable after a property is unpublished/archived).

---

### Admin Areas Management (AURA-305) ← MERGED (`aee1fda`) — **PHASE 3 (5/7)**

Fifth Phase 3 (Admin Vertical Slice) task: admin **add / edit / deactivate / reactivate** of areas (communities) with one representative area/community image, admin-only per-area property counts, and audit logging — **no hard delete**. **No migration, no Supabase config change, no `package.json`/`package-lock.json` change, no CI workflow change, no branch-protection change, no area media table, no gallery, no multi-upload/drag-drop, no image processing/resizing/transcoding, no public property counts, no public areas redesign, no public area-detail pages, no AURA-306+ work.**

**What exists (AURA-305):**
- **Admin areas pages** — `src/app/admin/(protected)/areas/page.tsx` (`/admin/areas`), `…/areas/new/page.tsx` (`/admin/areas/new`), and `…/areas/[id]/edit/page.tsx` (`/admin/areas/[id]/edit`), plus `error.tsx` / `loading.tsx`. All live **inside the `(protected)` group** so the AURA-301 server-side fail-closed guard wraps them.
- **Admin-only API routes** — `GET /api/admin/areas`, `POST /api/admin/areas`, `PATCH /api/admin/areas/[id]` (via the shared `withAdmin` helper in `src/app/api/admin/areas/_helpers.ts`). **Every route calls `requireAdmin()` directly** (not `requireSuperAdmin()`); both `super_admin` and `client_admin` may manage areas; all input Zod-validated; generic `{ error, code }` errors.
- **Area lifecycle** — create / edit / **deactivate** (`is_active = false`) / **reactivate** (`is_active = true`); **no hard delete** (no `DELETE` endpoint, no `.delete()`). The **slug is editable only at create — `PATCH` cannot update the slug.** The admin UI uses an **inline two-step deactivate confirmation** (`AreaRowActions`), exposes `sort_order` and active/inactive status in the form (`AreaForm`, `AreaStatusBadge`).
- **Admin-only property counts** — admin list rows carry `totalProperties` and `publishedProperties` per area, computed from `properties.area_id` + `publish_status` (not stored; never public).
- **Representative area image** — one image upload (single) reusing the **existing `property-media` bucket** under the **server-built, UUID-only** path `areas/{area_id}/{image_id}.{ext}` (extension from MIME; original filename never trusted; MIME allowlist `image/jpeg` / `image/png` / `image/webp`; 10MB max; `upsert: false`). The **public URL is stored in the existing `areas.image_url`** — **no area media table, no gallery, no multi-upload.**
- **Admin areas DAL + domain + storage service** — `src/dal/admin-areas.dal.ts` (caller's own admin session + RLS, **no service role**), pure domain `src/domain/areas/{admin,admin-view}.ts` (Zod contracts + the admin view/projector incl. the counts), the server-only storage service `src/services/storage/area-image.ts`, and admin components `AreaForm` / `AreaRowActions` / `AreaStatusBadge`.
- **Audit** — `audit_logs.dal.ts` extended with `area_created` / `area_updated` (deactivate/reactivate logged as `area_updated` with metadata) — a minimal audit-action-union extension (no broad audit refactor); the post-mutation/non-atomic ordering caveat matches the AURA-303 pattern.
- **Public surface unchanged** — public `/api/areas` stays **active-only**; inactive areas remain hidden; no public property counts; the AURA-204 public areas overview is untouched.
- **Tests added/updated** — unit (`area-admin-schema`, `area-admin-view`), integration (`admin-areas-api`), security boundary (`admin-areas-boundary`; `areas-public-boundary` updated for AURA-305), live-DB DAL/RLS/storage (`admin-areas.dal`, gated `SUPABASE_LOCAL_TESTS=1`), and e2e (`admin-areas`, gated authenticated happy path).

**Security / data boundary (verified at merge):** areas routes are admin-only (`requireAdmin()` directly; no public create/edit/deactivate/reactivate); area CRUD and the area image upload use the caller's own authenticated admin session + existing RLS (**no service role for area CRUD/upload** — service-role stays isolated to the audit writer); the area image reuses the AURA-105 `property-media` bucket (authenticated admin writes allowed; anon write/list/mutation denied) at a server-built UUID path (no enumeration); MIME + size validation + `upsert: false`. Public reads stay active-only; property counts are admin-only.

**Merged:** PR #47 squash-merged into `develop` at `aee1fda feat: add admin areas management`. Feature branch `feature/aura-305-areas-admin` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests` (Lighthouse advisory non-blocking).

**Targeted Opus 4.8 review (PR #47):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**, **no required fixes before merge**.

**Carry-forward / non-blocking (preserved for future tasks, not actioned at merge):**
1. **Public-read bucket / known-URL fetchability** — because the `property-media` bucket is public-read, a known UUID area image URL can remain directly fetchable after an area is deactivated.
2. **Best-effort old-image cleanup** — only the public URL is stored, so cleaning up a replaced/old area image is best-effort; future signed URLs / object revocation / storage GC may address this.

---

### Admin Settings Management (AURA-306) ← MERGED (`86e8b36`) — **PHASE 3 (6/7)**

Sixth Phase 3 (Admin Vertical Slice) task: admin **read + update** of the operational footer settings via a server-side key-value allowlist, per-key Zod validation, partial-batch PATCH, and audit logging — immediate updates, no draft/publish flow. **No migration, no Supabase config change, no `package.json`/`package-lock.json` change, no CI workflow change, no branch-protection change, no public settings API, no settings delete path, no service-role for admin settings GET/PATCH, and no logo/SEO/legal/trust/design-token scope (all deferred).**

**What exists (AURA-306):**
- **Guarded admin settings page** — `src/app/admin/(protected)/settings/page.tsx` (`/admin/settings`) plus `loading.tsx` / `error.tsx`, inside the `(protected)` group so the AURA-301 server-side fail-closed guard wraps it. Reads via the admin DAL (admin's own session + RLS; no service role) and renders the `SettingsForm` client island.
- **Admin-only API routes** — `GET /api/admin/settings`, `PATCH /api/admin/settings` (via the shared `withAdmin` helper in `src/app/api/admin/settings/_helpers.ts`). **Each calls `requireAdmin()` directly** (not `requireSuperAdmin()`); both `super_admin` and `client_admin` may edit; all input Zod-validated; safe `{ error, code }` envelopes (401 / 403 / generic 500).
- **Editable allowlist** — exactly the **seven existing public footer keys**: `agency_name`, `agency_phone`, `agency_email`, `agency_whatsapp`, `agency_address`, `footer_tagline`, `social_links` (canonical names; the same set the public selector projects — a compile-time backstop asserts the editable allowlist equals the public allowlist).
- **Per-key Zod + partial batch** — pure domain contract `src/domain/settings/admin.ts` (`EDITABLE_SETTING_KEYS`, `settingsPatchSchema`, `toSettingRows`): a **strict** schema that **rejects unknown keys and deferred keys**, per-key value grammar (non-empty trimmed strings, valid email, known social-platform URLs; social `{}` clears links), and an **empty-patch rejection (400)**. `PATCH` is a partial batch (one or more allowed keys) written via `upsert(onConflict: 'key')`.
- **Admin settings DAL** — `src/dal/settings.dal.ts` extended with `getAdminSettings()` + `updateAdminSettings()` using a **request-scoped authenticated admin Supabase client + RLS — no service role**. `getPublicSettings()` (the AURA-201 public safe selector) is **intact** and keeps the service role. Explicit `key, value` column allowlist; no `.delete()`; `updated_by` server-set to the acting admin.
- **Audit** — `src/dal/audit-logs.dal.ts` extended with exactly `settings_updated` (entity type `settings`; metadata `{ changed_keys }` — the changed key **names only**, never the phone/email/WhatsApp/address values) — a minimal audit-action-union extension (no broad audit refactor); the post-mutation/non-atomic ordering caveat matches the AURA-303 pattern.
- **Client form** — `src/components/admin/SettingsForm.tsx` fetches the guarded route only; imports **no** Supabase / DAL / services / storage / service-role. Only the seven editable fields are present (no logo/SEO/legal/trust/design controls).
- **Public behaviour** — the public footer reflects updated values on the **next request** (the `[locale]` layout is `force-dynamic` and reads settings per request); **no cache/revalidation system added, no public settings API added.**
- **Tests added** — unit (`settings-admin-schema`), integration (`admin-settings-api`), security boundary (`admin-settings-boundary`), live-DB DAL/RLS (`admin-settings.dal`, gated `SUPABASE_LOCAL_TESTS=1`), and e2e (`admin-settings`, gated authenticated happy path).

**Security / data boundary (verified at merge):** settings routes are admin-only (`requireAdmin()` directly; no public read/write of the admin endpoints); admin GET/PATCH use the caller's own authenticated admin session + RLS (`settings_admin_select/insert/update` gated on `public.is_admin()`) — **no service role for admin settings GET/PATCH**; service-role stays isolated to the public safe selector + the audit writer. Existing `settings` table + RLS were sufficient (no migration); no DELETE policy and no `.delete()` (no settings delete). Allowlist + per-key Zod reject unknown/deferred keys before any write; admin cannot mutate template/design architecture (D-21).

**Merged:** PR #49 squash-merged into `develop` at `86e8b36 feat: add admin settings management`. Feature branch `feature/aura-306-settings-admin` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests` (Lighthouse advisory non-blocking).

**Targeted Opus 4.8 review (PR #49):** Verdict **APPROVE**, merge recommendation **YES**, **no blocking issues**, **no required fixes before merge**.

**Carry-forward / non-blocking (preserved for future tasks, not actioned at merge):**
1. **Mutation-then-audit ordering** — `updateAdminSettings()` commits before `writeAuditLog()`; an audit-insert failure surfaces as a loud generic 500 (never silently swallowed, D-38) but does not roll back the committed settings write. Matches the AURA-303 pattern; a future hardening may move both into one transaction/RPC.
2. **Stricter phone/WhatsApp validation later** — `agency_phone` / `agency_whatsapp` validate as non-empty strings; tighten when `libphonenumber-js` is wired for contact work (carried from AURA-201).

---

### Admin Legal Page Management (AURA-307) ← MERGED (`74da365`) — **PHASE 3 (7/7) → PHASE 3 COMPLETE**

Seventh and final Phase 3 (Admin Vertical Slice) task and the **Phase 3 exit gate**: admin **create / edit / publish / archive** of the Privacy and Terms legal pages under a **row-per-version** lifecycle, with **write-time D-12 content safety** (Markdown only; no raw HTML) and audit logging. **No migration, no DB RPC, no Supabase config change, no `package.json`/`package-lock.json` change, no CI workflow change, no branch-protection change, no new renderer (existing `SafeMarkdown` reused), no `dangerouslySetInnerHTML` / `rehype-raw` / `marked` / DOMPurify, no arbitrary slugs, no hard delete, and no `legal_page_updated` audit action.**

**What exists (AURA-307):**
- **Guarded admin legal UI** — `src/app/admin/(protected)/legal/**` (list `page.tsx` + `loading.tsx` + `error.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`), inside the `(protected)` group so the AURA-301 server-side fail-closed guard wraps it; **no unguarded `src/app/admin/legal/**`**. The `LegalPageForm` client island is a **Markdown textarea only** (no rich-text / raw-HTML editor) with an optional preview reusing the public `SafeMarkdown`; published/archived versions render read-only. `LegalPageRowActions` publishes/archives through the guarded API. All D-44 states handled.
- **Admin-only API routes** — `GET/POST /api/admin/legal`, `PATCH /api/admin/legal/[id]`, `POST /api/admin/legal/[id]/publish`, `POST /api/admin/legal/[id]/archive` (via the shared `withAdmin` helper in `src/app/api/admin/legal/_helpers.ts`). **Each calls `requireAdmin()` directly** (not `requireSuperAdmin()`); both `super_admin` and `client_admin`; all input Zod-validated; safe `{ error, code }` envelopes (401 / 403 / 400 / 404 / 409 / generic 500).
- **Pure domain contract** — `src/domain/legal/admin.ts`: the `privacy` / `terms` slug allowlist, the **write-time D-12 content guard** (`containsUnsafeLegalHtml` / `assertSafeLegalMarkdown`), the create/update Zod schemas, the `nextPublishedVersion` bump rule, and the admin DTO projections. Pure TypeScript (no React/Supabase/DAL/I/O).
- **Admin legal DAL** — `src/dal/legal.dal.ts` extended with the admin list/get/create/update/publish/archive functions using a **request-scoped authenticated admin Supabase client + RLS — no service role**. The public `getPublishedLegalPage` selector is intact (anon client, published-only, explicit column allowlist, no `select('*')`). No `.delete()`; content re-checked with `assertSafeLegalMarkdown` before every insert/update.
- **Row-per-version publish** — archive the currently published row for the slug **first** (keeps the partial unique index `legal_pages_slug_published_key` satisfied), then promote the selected draft to `published` with `version = max(existing version for slug) + 1` and `published_at = now`. Separate writes; any failure throws (fails loud) — the owner-accepted non-atomic caveat, tested.
- **Audit** — `src/dal/audit-logs.dal.ts` extended with exactly `legal_page_created` / `legal_page_published` / `legal_page_archived` (entity type `legal_page`; metadata = slug / status transition / version only — never title/body). `legal_page_updated` intentionally **not** added; draft PATCH is not audited.
- **Tests added** — unit (`legal-admin-schema`), integration (`admin-legal-api`), security boundary (`admin-legal-boundary`, `legal-public-boundary` regression), live-DB DAL/RLS (`admin-legal.dal`, gated `SUPABASE_LOCAL_TESTS=1`), and e2e (`admin-legal`, gated authenticated create→publish→archive happy path).

**Security / D-12 boundary (verified at merge):** legal routes are admin-only (`requireAdmin()` directly; no public write); admin legal CRUD uses the caller's own authenticated admin session + RLS (`legal_pages_admin_*` gated on `public.is_admin()`) — **no service role for legal CRUD**; service-role stays isolated to the audit writer. Content is **Markdown only — raw/unsafe HTML rejected at write time** (domain guard on the Zod refine + re-asserted in the DAL) and at render (existing `SafeMarkdown` = `react-markdown` + `rehype-sanitize`; no `dangerouslySetInnerHTML` / `rehype-raw` / `marked` / DOMPurify). The `0b07090` blocker fix narrowed the protocol guard to URL/link contexts so ordinary `data:` / `personal data:` / `metadata:` prose is accepted while dangerous protocol link targets stay rejected. Existing `legal_pages` table + RLS + partial unique index were sufficient (no migration); archive only (no DELETE policy, no `.delete()`). Public legal reads remain published-only.

**Merged:** PR #51 squash-merged into `develop` at `74da365 feat: add admin legal page management`. Feature branch `feature/aura-307-legal-admin` deleted (local + remote). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests` (Lighthouse advisory non-blocking).

**Targeted Opus 4.8 review (PR #51):** initial verdict **REQUEST_CHANGES** (blocker: the write-time guard false-positived on ordinary privacy-policy prose containing `data:`). After blocker fix `0b07090 fix: narrow legal protocol guard to URL contexts`: **APPROVE**, merge recommendation **YES**, original blocker **RESOLVED**, **no blocking issues**, **no required fixes**.

**Carry-forward / non-blocking (preserved for future tasks, not actioned at merge):**
1. **Reference-style link definitions not flagged at write time** — `[foo]: javascript:alert(1)` is not caught by the URL-context write-time guard, but `rehype-sanitize` strips the dangerous protocol from the rendered href, so there is no XSS path; a future hardening may add a reference-definition pattern.
2. **Publish/audit non-atomic ordering** — the publish sequence + audit write are separate writes (no migration/RPC); any failure is loud (throws → generic 500). Matches the AURA-303 pattern; a future hardening may move the sequence into one transaction/RPC.

---

## What Does NOT Exist

- No root-level `tests/` directory
- RLS policies are **merged to `develop` in AURA-103** (`1a35958`) — 36 policies across 10 tables + 3 role helpers; `rate_limits` intentionally has 0 policies (service-role only)
- No seed data / seed users; no `supabase/seed.sql`
- Rate-limit service + TTL cleanup **now exist — merged in AURA-106 (`dd21edd`)**: `src/services/rate-limit/{key,limit,index}.ts` + migration `20260619230918_rate_limit_functions.sql` (`consume_rate_limit`, `cleanup_rate_limits`, `rate_limits_expires_at_idx`, guarded hourly pg_cron `aura-rate-limits-cleanup`). Still **not wired into any route** (lead/whatsapp/login consume it in Phases 3-4)
- **AURA-107 Dockerized Supabase CI stack now EXISTS** — merged in AURA-107 (`04d3522`): the `db-tests` CI job boots the Dockerized Supabase stack and runs DAL/security/integration suites live (`SUPABASE_LOCAL_TESTS=1`, 49/94/7 passed). The previously local-only carry-forwards are resolved. **`db-tests` is now a required branch-protection check on `develop`** — the Phase 1 exit gate is fully enforced
- **Phase 2 (Public Website) is COMPLETE — AURA-201 (`f17b429`), AURA-202 (`1d4c514`), AURA-203 (`b2f6129`), AURA-204 (`1fe2798`), AURA-205 (`3d6a7e0`), AURA-206 (`a106fe8`), and AURA-207 (`65cc384`) MERGED** (7 of 7 Phase 2 tasks done). The public site shell, settings-driven footer, properties listing page + API, PropertyCard, homepage featured section, the **public property detail surface** (`/[locale]/properties/[slug]` + `GET /api/properties/[slug]`, safe public stakeholder projection, contact routing, off-plan block, media gallery), the **public areas overview** (`/[locale]/areas` + `GET /api/areas`, active-only areas, public-safe area DTO `{ slug, name, description, imageUrl }`, no property counts/aggregation, D-44 states), and the **public legal pages** (`/en/privacy` + `/en/terms` + `GET /api/legal/[slug]`, published-only read, safe Markdown render under D-12 via `react-markdown` + `rehype-sanitize`, public DTO `{ slug, title, content, effectiveDate }`, draft/archived/missing → 404) now exist. The **SEO metadata + AUTEX `noindex` (D-42) + `robots.txt`/`sitemap.xml` routes + non-blocking Lighthouse advisory CI** (AURA-206) now exist. The **public About page** (`/en/about`, AURA-207 — static demo-safe content reusing the AURA-201 shell + AURA-206 `noindex` helper; now included in the sitemap) now exists, completing the Phase 2 public surface. **AURA-301 (Admin login + session + role guard wiring) is MERGED at `97c9548`** (the first Phase 3 / Admin Vertical Slice task — `/admin/login`, server-side login action, protected `/admin` placeholder, AURA-104 role-guard wiring, AURA-106 login rate-limit; Opus review **APPROVE**, no blockers). **AURA-302 (Admin dashboard shell) is MERGED at `df4523c`** (the second Phase 3 task — guarded `/admin/dashboard` shell under the `(protected)` group, `/admin` → `/admin/dashboard` redirect, separate non-localized sidebar + top-bar admin shell, nav links to the future sections, placeholder panels only; **no metrics/data/CRUD/API/DAL/Supabase/service-role**; Opus review not required). **AURA-303 (Property CRUD admin + publish checklist) is MERGED at `a6cb178`** (the third Phase 3 task — guarded admin property pages under `(protected)/properties/**`, the role-guarded `/api/admin/properties*` write routes, the admin write DAL, the server-only audit-log DAL, the publish checklist, reference-number/slug generation + immutability, and the duplicate/archive flows; **no media upload, no hard delete, no unpublish**; targeted Opus review **APPROVE**, no blockers). **AURA-304 (Media upload — validation, UUID paths) is MERGED at `631bd29`** (the fourth Phase 3 task — admin-only media routes + `PropertyMediaManager` UI + admin property media DAL + server-only storage service; request-scoped authenticated admin session + RLS, no service-role for media; server-built UUID paths; MIME/size validation; single-cover/floorplan-cannot-be-cover rules; targeted Opus review **APPROVE**, no blockers, no required fixes). **AURA-305 (Areas admin (add/edit/deactivate)) is MERGED at `aee1fda`** (the fifth Phase 3 task — admin-only `/api/admin/areas*` routes + `/admin/areas` pages + admin areas DAL + server-only area-image storage service; request-scoped authenticated admin session + RLS, no service-role for area CRUD/upload; representative area image reusing the existing `property-media` bucket under `areas/{area_id}/{image_id}.{ext}`; admin-only property counts; add/edit/deactivate/reactivate, no hard delete; targeted Opus review **APPROVE**, no blockers, no required fixes). **AURA-306 (Settings admin (allowlist + per-key Zod + audit)) is MERGED at `86e8b36`** (the sixth Phase 3 task — admin-only `/api/admin/settings` GET/PATCH + `/admin/settings` page + admin settings DAL + `settings_updated` audit; request-scoped authenticated admin session + RLS, no service-role for admin settings GET/PATCH; exactly the seven public footer keys; per-key Zod; partial-batch PATCH; immediate update, no draft/publish, no settings delete, no public settings API; targeted Opus review **APPROVE**, no blockers, no required fixes). **Phase 3 (Admin Vertical Slice) is COMPLETE (7 of 7).** The next task is **AURA-401 (Inquiry + contact forms + `POST /api/leads`, validated + rate-limited)** — the first Phase 4 (Lead and WhatsApp Conversion) task — **not started; read-only discovery only**, requires a new session + per-task discovery/planning approval. **The following do NOT exist yet:** **real-client indexing** not implemented (`publicIndexingEnabled` stays `false`; AUTEX is `noindex` by default — flipping it needs a future config change + owner approval), **canonical / OpenGraph / Twitter metadata** deferred (not in AURA-206), **Lighthouse hard score gate** deferred to release / AURA-505 (the advisory job is non-blocking), **admin SEO editing** not implemented, **area detail pages** not implemented (`/[locale]/areas/[slug]`), **public property counts by area / public property aggregation** not implemented, **admin legal editing** now EXISTS — merged in AURA-307 (`74da365`) (guarded `/admin/legal` pages + role-guarded `/api/admin/legal*` routes + draft→publish→archive row-per-version lifecycle + write-time D-12 Markdown-only guard + `legal_page_created`/`legal_page_published`/`legal_page_archived` audit; still no legal acceptance tracking and no real-client legal approval/content readiness), **signed URLs / CDN revocation** for media (deferred out of MVP; AURA-304 ships public-CDN media), **video / 360 / virtual-tour media** (out of MVP, D-41), **media image processing / resizing / transcoding**, **manual reordering**, **multi-file upload / drag-drop**, and **media audit actions** (all out of AURA-304 scope), **stakeholder admin**, **lead form** (AURA-401), **WhatsApp click tracking** (AURA-405), **similar properties**, and **cinematic/GSAP** work (AURA-502). **Admin property CRUD now EXISTS — merged in AURA-303 (`a6cb178`)** (guarded `/admin/properties` pages + role-guarded `/api/admin/properties*` write routes + admin write DAL + server-only audit DAL + publish checklist + duplicate/archive; no hard delete, no unpublish). **Admin property media upload/update/delete now EXISTS too — merged in AURA-304 (`631bd29`)** (admin-only `/api/admin/properties/[id]/media*` routes + `PropertyMediaManager` + `src/dal/admin-property-media.dal.ts` + server-only `src/services/storage/property-media.ts`; request-scoped admin session + RLS, no service-role for media; UUID paths; MIME/size validation; single-cover/floorplan rules; signed URLs / CDN revocation still deferred). **Admin areas management now EXISTS too — merged in AURA-305 (`aee1fda`)** (admin-only `/api/admin/areas*` routes + `/admin/areas` pages + `src/dal/admin-areas.dal.ts` + server-only `src/services/storage/area-image.ts`; request-scoped admin session + RLS, no service-role for area CRUD/upload; add/edit/deactivate/reactivate, no hard delete; slug editable only at create; representative area image in the existing `property-media` bucket under `areas/{area_id}/{image_id}.{ext}`, public URL stored in `areas.image_url`; admin-only per-area property counts; no area media table / gallery / multi-upload; public `/api/areas` unchanged, active-only)
- **Route wiring for lead/whatsapp/login does NOT exist** — the rate-limit service has no route consumer yet; Phases 3-4 Route Handlers are its first importers
- No `.env` or `.env.local` file (`.env.example` placeholders only)
- No product UI features beyond the minimal homepage shell
- No UI components (Button, Card, etc.) — component layer is Phase 2+
- No `cn()` utility (deferred to when first component needs it)
- No Stage 2 skills, MCPs, hooks, or plugins
- Lighthouse advisory CI **enabled in AURA-206** (`.github/workflows/lighthouse.yml`; non-blocking, `continue-on-error: true`, not a required check); hard score gate still deferred to release / AURA-505
- Dockerized Supabase stack in CI **now exists** (the `db-tests` job, AURA-107 `04d3522`); local manual runs still use `SUPABASE_LOCAL_TESTS=1` + `supabase start`
- Admin auth guard + first-`super_admin` bootstrap script **now exist** — merged in AURA-104 (`44a7fd4`): `src/services/auth/**` guard + `scripts/seed-admin.ts`. **The admin login + session + role-guard surface now exists too — merged in AURA-301 (`97c9548`)**: `/admin/login` (login only — no signup/no password reset), a server-side login action, a protected `/admin` minimal placeholder, and the role guard wired across `/admin/**` pages (the AURA-106 login rate-limit is now route-wired into the login action). **The admin dashboard shell now exists too — merged in AURA-302 (`df4523c`)**: a guarded `/admin/dashboard` shell under the `(protected)` group (`/admin` redirects to it), a separate non-localized sidebar + top-bar admin shell (`src/components/admin/**`), and nav links to the future admin sections — **placeholder panels only, no metrics/data/CRUD**. **The admin property CRUD surface now exists too — merged in AURA-303 (`a6cb178`)**: guarded `/admin/properties` pages (list + `new` + `[id]/edit`) under the `(protected)` group, the role-guarded `/api/admin/properties*` write routes (`GET/POST`, `[id]` PATCH, `[id]/duplicate` POST, `[id]/archive` PATCH — **each calls `requireAdmin()` directly**, both admin roles allowed), the admin write DAL (`src/dal/admin-properties.dal.ts`, caller session + RLS, no service role), the server-only audit DAL (`src/dal/audit-logs.dal.ts`, service-role, insert-only), the publish checklist, and reference/slug generation. **The admin areas management surface now exists too — merged in AURA-305 (`aee1fda`)**: guarded `/admin/areas` pages (list + `new` + `[id]/edit`) under the `(protected)` group, the admin-only `/api/admin/areas*` routes (`GET/POST`, `[id]` PATCH — **each calls `requireAdmin()` directly**, both admin roles allowed), the admin areas DAL (`src/dal/admin-areas.dal.ts`, caller session + RLS, no service role), the server-only area-image storage service (`src/services/storage/area-image.ts`), pure domain `src/domain/areas/{admin,admin-view}.ts`, add/edit/deactivate/reactivate (no hard delete), and the `area_created`/`area_updated` audit actions. **The admin settings management surface now exists too — merged in AURA-306 (`86e8b36`)** (`/admin/settings` page + `/api/admin/settings` GET/PATCH + admin settings DAL + `settings_updated` audit). **The admin legal management surface now exists too — merged in AURA-307 (`74da365`)** (`/admin/legal` pages (list + `new` + `[id]/edit`) + role-guarded `/api/admin/legal*` routes + `src/domain/legal/admin.ts` + admin legal DAL in `src/dal/legal.dal.ts` + `legal_page_*` audit actions; request-scoped admin session + RLS, no service-role for legal CRUD; draft→publish→archive, archive only). Still missing: **no admin management page for the remaining section** — `/admin/leads` does **not** exist as a page (leads; its nav link 404s until built); no admin DAL beyond properties + media + areas + settings + legal + audit; no signup path anywhere (D-40); any future `/api/admin/*` route handler must likewise call `requireAdmin()`/`requireSuperAdmin()` directly — the layout guard protects pages, not Route Handlers
- Storage bucket policies + media path contract **now exist** — merged in AURA-105 (`fae3d62`): `property-media` bucket + admin-only `storage.objects` policies + `src/domain/properties/media.ts` + `src/services/storage/policy.ts`. **The admin upload/update/delete route + UI now exist too — merged in AURA-304 (`631bd29`)**: admin-only `/api/admin/properties/[id]/media*` routes, `PropertyMediaManager`, `src/dal/admin-property-media.dal.ts`, and the server-only storage service `src/services/storage/property-media.ts` (request-scoped admin session + RLS, no service-role for media; server-built UUID paths; MIME/size validation; single-cover rule). Still missing: **no signed URLs** (deferred out of MVP); **no CDN revocation**; **no video/360/virtual-tour**; **no image processing/resizing**; **no manual reordering**; **no multi-file upload**; **no media audit actions**; rate-limit service merged in AURA-106 (`dd21edd`) but not yet route-wired
- No real data layer (beyond the auth guard), admin UI, lead capture, CRM, GSAP, business logic, or search

---

## AURA-102 Gate Results (merged — `3657e4f`)

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run test` (CI mode, flag unset) | PASS — 10 files, 31 tests + 22 skipped (live DB tests skip without `SUPABASE_LOCAL_TESTS=1`) |
| `SUPABASE_LOCAL_TESTS=1 npm run test:dal` | PASS — 3 files, 26 tests |
| `SUPABASE_LOCAL_TESTS=1 npm run test:security` | PASS — 4 files, 18 tests |
| `npm run deps:check` | PASS — 0 violations (21 modules) |
| `npm run unused` | PASS — exit 0 |
| `npm run build` | PASS — 3 routes; middleware 44.1 kB |
| `npm run quality` | PASS — composite exit 0 |
| `npm run audit` | PASS — exit 0; 0 HIGH/CRITICAL; 2 moderate postcss carry-forward |
| `supabase db reset` | PASS — migration applies clean from scratch |

D-05 scan (`clients`/`client_id`) and raw-IP scan: only matches are in comments / test descriptions / guardrail assertions — **no actual schema columns**. Migration creates no `clients` table, no `client_id`, no raw-IP column.

### GitHub CI (PR #13 — AURA-102, squash-merged)

| Check | Result |
|---|---|
| `quality` | PASS |
| `e2e` | PASS |
| `analyze (javascript-typescript)` | PASS |
| `CodeQL` | PASS |

### Opus 4.8 Review (PR #13)

- Verdict: **APPROVE**
- Merge recommendation: **YES** (into `develop`)
- Blocking issues: None
- Post-review: non-blocking `db:types` reproducibility / failure-safety fixes completed before merge (see migration section above).

**AURA-102 summary:** 11 MVP tables; 17 native PostgreSQL enums; generated `src/types/database.ts`; failure-safe `db:types` script; RLS enabled on all 11 tables; **0 RLS policies**; no seed data; no auth; no API routes; no UI.

---

## AURA-101 Gate Results (merged — `95f9df3`)

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run test` | PASS — 8 files, 21 tests + 1 skipped |
| `npm run test:unit` | PASS — 2 files, 8 tests |
| `npm run test:dal` | PASS — 2 files, 4 tests + 1 skipped (local-stack, `SUPABASE_LOCAL_TESTS=1`) |
| `npm run test:security` | PASS — 3 files, 8 tests |
| `npm run deps:check` | PASS — 0 violations (21 modules, 16 deps) |
| `npm run unused` | PASS |
| `npm run build` | PASS — 4 routes; middleware 44.1 kB |
| `npm run quality` | PASS — composite exit 0 |
| `npm run audit` | PASS — exit 0; 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |

### Boundary proof

- Temp fixture `src/components/ui/___boundary_probe_delete_me.ts` importing `service-role.ts` → `deps:check` failed with 2 errors (`no-ui-to-supabase` + `no-client-to-service-role`)
- Fixture removed → `deps:check` passes clean (0 violations, 21 modules)

### Local Supabase CLI

Supabase CLI 2.106.0 (Homebrew) + Docker 29.5.3.

| Command | Result |
|---|---|
| `supabase start` | PASS |
| `supabase status` | PASS |
| `SUPABASE_LOCAL_TESTS=1 npm run test:dal` | PASS — 5/5 tests |
| `supabase stop` | PASS |

`.gitignore` excludes `supabase/.branches/` and `supabase/.temp/` — runtime artifacts untracked and confirmed clean.

### GitHub CI (PR #11 — AURA-101, squash-merged)

| Check | Result |
|---|---|
| `quality` | PASS — 1m 3s |
| `e2e` | PASS — 1m 27s |
| `analyze (javascript-typescript)` | PASS — 1m 3s |
| `CodeQL` | PASS — 2s |

### Opus 4.8 Review (PR #11)

- Verdict: **APPROVE**
- Merge recommendation: **YES** (into `develop`)
- Blocking issues: None
- Non-blocking notes: (1) `config.toml` local `enable_signup = true` is harmless locally — production must set `false` for D-40 in AURA-104. (2) Public env vars not validated by `getServerEnv()` (cosmetic only). (3) Cruiser `no-client-to-service-role` `from` scoped to `^src/components` — build-time `server-only` guard covers all client components regardless. (4) Security tests assert rule configuration, not runtime enforcement — adequate for scaffold.

## AURA-008 Gate Results (archived — merged)

All gates passed. See SESSION_HANDOFF.md for detail.

---

## Open Items

### Carry-Forward: `postcss` moderate (documented exception)
Same as AURA-001/002/005/006/007. Passes `--audit-level=high`. Not actionable.

### Note: Playwright Node.js deprecation warning
Playwright 1.60 internal; not a gate failure.

### Note: Font families using system fallbacks
`--font-serif: ui-serif, 'Georgia', serif` etc. are MVP placeholders. Next/font loading for the actual luxury typeface deferred to a later task; the CSS variable makes it swappable without changing tailwind config.

### Note: AURA-101 Knip entry debt
Three new `entry` declarations for Supabase helpers remain in `knip.jsonc`. Remove each as the first DAL task imports that helper (AURA-102+).

---

## Branch Protection Status

`develop` branch protection is active with required status checks (verified via GitHub API on 2026-06-20):

```
quality
e2e
analyze (javascript-typescript)
CodeQL
db-tests
```

**`db-tests` is now required on `develop`.** AURA-107 added the new **`db-tests`** check (live DAL/security/integration against the Dockerized Supabase stack), and it has been added to the `develop` branch-protection rule. **`develop` required checks are: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, `db-tests`.** The AURA-107 Phase 1 exit gate is now fully enforced by branch protection.

**Unchanged by AURA-301 / AURA-302 / AURA-303 / AURA-304 / AURA-305.** None of these tasks made a branch-protection change; the required-check set above is unchanged. The Lighthouse advisory job (`lighthouse-advisory`) remains intentionally **non-blocking and NOT a required check**.

GitHub required approvals are disabled for solo-operator mode; status checks remain enforced.

---

## Knip Allowlist Status

| Entry | Status |
|---|---|
| ~~`tailwindcss`~~ | ✅ Removed AURA-006 |
| ~~`@tailwindcss/typography`~~ | ✅ Removed AURA-006 |
| ~~`autoprefixer`~~ | ✅ Removed AURA-006 |
| ~~`postcss`~~ | ✅ Removed AURA-006 |
| ~~`next-intl`~~ | ✅ Removed AURA-008 (now imported by `routing.ts` + `middleware.ts`) |
| `class-variance-authority` | Retained — no components yet |
| `clsx` | Retained — no components yet |
| `tailwind-merge` | Retained — no components yet |
| `lucide-react` | Retained — no icons yet |
| ~~`@supabase/ssr`, `@supabase/supabase-js`~~ | ✅ Removed AURA-101 (now imported by `src/lib/supabase/{client,server,service-role}.ts`) |
| `resend` | Wired in AURA-106 |
| `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js` | Wired in Phase 2–3 |
| `@tanstack/react-query`, `zustand` | Wired in Phase 2+ |
| `gsap`, `framer-motion` | Wired in Phase 5 |
| `@sentry/nextjs`, `@vercel/analytics` | Wired in Phase 6 |
| `eslint-config-next`, `@typescript-eslint/{parser,eslint-plugin}` | FlatCompat string-based; keep |
| ~~`entry: ["src/lib/config/env.ts"]`~~ | ✅ Removed AURA-101 (env.ts now has real importers) |

---

## Decisions in Force

All locked decisions D-01–D-51 are in force. Key non-negotiables:
- No `clients` table, no `client_id` (D-05 — merge blocker)
- No public admin self-signup (D-40)
- Service-role key server-only (security merge blocker)
- No raw IP in event tables (D-18, D-51 — merge blocker)
- No raw legal HTML (D-12 — merge blocker)
- Auto-merge only into `develop`, never `main`
- Admin cannot mutate design tokens / template architecture (D-21, D-25)
