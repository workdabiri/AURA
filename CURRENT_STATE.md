# Current State

**Updated:** 2026-06-20
**Branch:** `develop` — source of truth at `04d3522`.
**Phase:** **Phase 1 — COMPLETE** (all 7 tasks AURA-101–AURA-107 merged). **Phase 2 (Public Website) is next.** AURA-101 merged at `95f9df3`. AURA-102 merged at `3657e4f`. AURA-103 merged at `1a35958`. **AURA-104 (admin auth guard + first-`super_admin` bootstrap script, D-40) merged at `44a7fd4`** — Opus 4.8 **APPROVE**, no blocking issues; required checks green before merge; feature branch deleted. **AURA-105 (storage bucket policies + media path strategy) merged at `fae3d62`** — Opus 4.8 **APPROVE**, no blocking issues; required checks green before merge; feature branch deleted. **AURA-106 (rate-limit service + salted-hash key + TTL cleanup, D-51) merged at `dd21edd`** — Opus 4.8 **APPROVE**, no blocking issues; required checks green before merge; feature branch `feature/aura-106-rate-limit-service` deleted. **AURA-107 (live DAL/security/integration tests in CI via Dockerized Supabase — the Phase 1 exit gate) MERGED at `04d3522`** — Opus 4.8 phase-exit review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge; feature branch `feature/aura-107-dal-security-ci-harness` deleted. **The next task is AURA-201 (Public layout + header/footer + i18n shell) — not started; requires a new session + per-task discovery/planning approval before implementation.**

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
- `.github/workflows/lighthouse.yml` — disabled advisory stub; enabled non-blocking in AURA-206 (CF-4)

### i18n Routing + Middleware (AURA-008) ← NEW
- `src/lib/i18n/routing.ts` — next-intl routing config; `locales: ['en']`, `defaultLocale: 'en'`
- `src/middleware.ts` — explicit HTTP 301 redirect from `/` → `/en`; delegates other paths to next-intl locale middleware; matcher excludes `api`, `_next`, `_vercel`, and static assets

### Homepage Shell (AURA-008) ← NEW
- `src/app/[locale]/layout.tsx` — minimal nested locale layout; does not re-render `<html>`/`<body>` (root layout owns those)
- `src/app/[locale]/page.tsx` — minimal luxury-dark homepage shell using all design token Tailwind classes: `bg-surface-page`, `text-text-primary`, `text-text-secondary`, `text-brand-secondary`, `font-display`, `text-display`, `text-caption`, `text-body`. No data fetching, Supabase, auth, GSAP, or CRM.
- `src/app/page.tsx` — updated to defensive fallback `permanentRedirect('/en')` (fires only if middleware is bypassed; middleware handles 301 first)

### Application Scaffold (AURA-001)
- `next.config.js`, `src/app/layout.tsx` (root, static `lang="en"`)
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

**Carry-forward / owner action:** **`db-tests` is NOT yet a required branch-protection check on `develop`** (verified via API: current required checks are `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`). The owner must add **`db-tests`** to the `develop` protection rule in GitHub Settings (see `docs/BRANCH_PROTECTION.md`). With AURA-107 merged, the previously local-only carry-forwards from AURA-103/104/105/106 ("live tests are local-only until AURA-107") are now resolved — those suites run live in CI.

---

## What Does NOT Exist

- No root-level `tests/` directory
- RLS policies are **merged to `develop` in AURA-103** (`1a35958`) — 36 policies across 10 tables + 3 role helpers; `rate_limits` intentionally has 0 policies (service-role only)
- No seed data / seed users; no `supabase/seed.sql`
- Rate-limit service + TTL cleanup **now exist — merged in AURA-106 (`dd21edd`)**: `src/services/rate-limit/{key,limit,index}.ts` + migration `20260619230918_rate_limit_functions.sql` (`consume_rate_limit`, `cleanup_rate_limits`, `rate_limits_expires_at_idx`, guarded hourly pg_cron `aura-rate-limits-cleanup`). Still **not wired into any route** (lead/whatsapp/login consume it in Phases 3-4)
- **AURA-107 Dockerized Supabase CI stack now EXISTS** — merged in AURA-107 (`04d3522`): the `db-tests` CI job boots the Dockerized Supabase stack and runs DAL/security/integration suites live (`SUPABASE_LOCAL_TESTS=1`, 49/94/7 passed). The previously local-only carry-forwards are resolved. **Still pending owner action:** `db-tests` is not yet a required branch-protection check on `develop`
- **Phase 2 (Public Website) does NOT exist yet** — not started. The first Phase 2 task is **AURA-201 (Public layout + header/footer + i18n shell)** — not started; requires a new session + per-task discovery/planning approval
- **Route wiring for lead/whatsapp/login does NOT exist** — the rate-limit service has no route consumer yet; Phases 3-4 Route Handlers are its first importers
- No `.env` or `.env.local` file (`.env.example` placeholders only)
- No product UI features beyond the minimal homepage shell
- No UI components (Button, Card, etc.) — component layer is Phase 2+
- No `cn()` utility (deferred to when first component needs it)
- No Stage 2 skills, MCPs, hooks, or plugins
- No Lighthouse advisory run yet (stub disabled until AURA-206)
- Dockerized Supabase stack in CI **now exists** (the `db-tests` job, AURA-107 `04d3522`); local manual runs still use `SUPABASE_LOCAL_TESTS=1` + `supabase start`
- Admin auth guard + first-`super_admin` bootstrap script **now exist** — merged in AURA-104 (`44a7fd4`): `src/services/auth/**` guard + `scripts/seed-admin.ts`. Still missing: no DAL functions yet; no login UI/route (AURA-301); no admin routes/UI; no signup path anywhere (D-40); rate-limit service merged in AURA-106 (`dd21edd`) but not yet route-wired
- Storage bucket policies + media path contract **now exist** — merged in AURA-105 (`fae3d62`): `property-media` bucket + admin-only `storage.objects` policies + `src/domain/properties/media.ts` + `src/services/storage/policy.ts`. Still missing: no upload route/UI (AURA-304); no signed URLs (deferred out of MVP); rate-limit service merged in AURA-106 (`dd21edd`) but not yet route-wired
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
```

**Owner action required:** AURA-107 added the new **`db-tests`** check (live DAL/security/integration against the Dockerized Supabase stack). It is **green on PR #23 but NOT yet in the required-checks list above** — the owner must add `db-tests` to the `develop` branch-protection rule in GitHub Settings (`docs/BRANCH_PROTECTION.md`). This is the only remaining item to fully harden the Phase 1 exit gate.

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
