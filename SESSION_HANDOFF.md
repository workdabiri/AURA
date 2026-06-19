# Session Handoff

**Last Updated:** 2026-06-19
**Branch:** `develop` (current source of truth; this docs-sync update is on `docs/aura-104-merged-state`). **AURA-104 (admin auth guard + first-`super_admin` bootstrap script, D-40) merged at `44a7fd4`** — Opus 4.8 **APPROVE**, no blocking issues; required checks green before merge; feature branch deleted. AURA-103 remains merged at `1a35958`; AURA-102 at `3657e4f`. AURA-105 is next — not started (requires separate per-task approval).

---

## AURA-104 — MERGED (`44a7fd4`)

**AURA-104: Auth + `user_profiles` role checks + admin bootstrap script (D-40).** Implements the application-layer admin authorization guard and the first-`super_admin` bootstrap script, completing the authenticated session/profile/role negatives deferred from AURA-103. **No migration, no `supabase/config.toml` change, no signup route/UI, no API routes, no admin UI.**

Merged via PR #17 (squash) into `develop` at `44a7fd4 feat: add admin auth guard and bootstrap script`. Feature branch `feat/aura-104-auth-rbac` deleted. **Opus 4.8 review (PR #17): APPROVE, merge recommendation YES, no blocking issues** (the non-runnable `scripts/seed-admin.ts` runner decision accepted as a non-blocking follow-up). Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

### What was built

- **Auth guard service (`src/services/auth/`)** — server-only request-path admin authorization:
  - `types.ts` (pure) — `UserRole`, `AdminProfile`, `RoleRequirement`, `AdminContext`, `AccessResult` (discriminated union), `AuthFailureCode`, and the typed `AuthorizationError` (carries `status` 401/403 + stable `code`, maps cleanly to the API `{ error, code }` envelope).
  - `policy.ts` (pure, no `server-only`) — `isAdminRole`, `isSuperAdminRole`, and `evaluateAccess({ userId, profile, requirement })`. Encodes the order that yields the correct 401-vs-403 distinction: no user → 401 `UNAUTHENTICATED`; user but no profile → 403 `NO_PROFILE` (**auth alone is insufficient**); profile but role too low → 403 `INSUFFICIENT_ROLE`; otherwise allowed. Unit-tested directly.
  - `guard.ts` (**`import 'server-only'` first line**) — `getCurrentUser`, `getCurrentAdmin(requirement='admin')`, `requireAdmin`, `requireSuperAdmin`. Uses `createSupabaseServerClient()` (anon, request-scoped) and `supabase.auth.getUser()` (re-validated server-side — **never** the unverified cookie session). Fetches the caller's **own** `user_profiles` row under their session (RLS own-row), then delegates the decision to `evaluateAccess`. **Does not import or use the privileged service-role client.**
  - `index.ts` — public barrel (server-only-tainted; server code imports this; tests import `./policy`/`./types` directly).
  - Role source of truth: `public.user_profiles.role`; allowed admin roles `super_admin`, `client_admin` (D-30).
- **Bootstrap script (`scripts/seed-admin.ts`)** — operator-only first-`super_admin` linker:
  - Links an **existing** Supabase Auth user to a `user_profiles` row with `role = 'super_admin'`. **Does NOT create Auth users or passwords; no self-signup path** (D-40).
  - Inputs: `--user-id <uuid>` / `--full-name <name>` (CLI preferred), with optional `SEED_ADMIN_USER_ID` / `SEED_ADMIN_FULL_NAME` env fallback. These fallbacks are **operator/runtime-only and intentionally NOT added to `src/lib/validation/env.schema.ts`**. Validates UUID + non-empty name.
  - Verifies the Auth user exists via `supabase.auth.admin.getUserById(userId)` before any write.
  - **Idempotent** (already-`super_admin` → no-op success) and **fail-closed** (existing different role → refuses, exits non-zero; never auto-promotes/demotes).
  - Uses `getSupabaseServiceRole()` via a **dynamic import inside `main()`** + a direct-run guard, so unit tests can import the pure helpers without tripping the `server-only` guard or constructing the privileged client. main() runs only on direct invocation.

### Locked decisions applied (this task, user-approved)

1. `supabase/config.toml` **not modified** — local `enable_signup = true` is unchanged. The guard makes signup drift non-dangerous by rejecting any session without a valid admin `user_profiles` row. **Production hosted Supabase must set `enable_signup = false` (D-40)** — a deployment/config requirement documented here and in CURRENT_STATE/NEXT_STEPS.
2. `scripts/seed-admin.ts` is the approved bootstrap artifact (server-only/operator-only; links existing Auth user; no user/password creation).
3. **No dependencies added; `package-lock.json` unchanged.** No TS runner (`tsx`/`ts-node`) exists in the repo. **Runner decision deferred (see Carry-forward)** — no `package.json` run-script was added because executing the file needs a runner that resolves the `@/*` alias and the `server-only` guard.
4. `SEED_ADMIN_*` fallbacks are **not** in the app runtime env schema.
5. Optional audit-domain deny logging **deferred** — no `src/domain/audit/**` created (task spec marks it optional).

### Files

**New:** `src/services/auth/{types,policy,guard,index}.ts`, `scripts/seed-admin.ts`, `src/tests/unit/auth-policy.test.ts`, `src/tests/unit/seed-admin.test.ts`, `src/tests/security/auth-guard.test.ts`, `src/tests/integration/auth-guard.test.ts`, `src/tests/integration/seed-admin.test.ts`.
**Modified:** `knip.jsonc` (removed `src/lib/supabase/server.ts` entry — now statically imported by `guard.ts`; added `guard.ts`, `index.ts`, `scripts/seed-admin.ts` entries; `service-role.ts` + `client.ts` entries retained — service-role is only dynamically imported by the operator script), continuity docs.
**Untouched (verified):** `supabase/config.toml`, `supabase/migrations/**`, `package-lock.json`, `.env` / `.env.local`.

### Tests (how no-self-signup + auth-alone-insufficient are enforced)

- **Unit** (`src/tests/unit/`, no DB): `auth-policy.test.ts` — predicates + `evaluateAccess` for all negatives (401 no-session; 403 no-profile = auth alone insufficient; 403 insufficient-role) and positives (super_admin & client_admin pass `requireAdmin`; super_admin passes `requireSuperAdmin`; client_admin fails it). `seed-admin.test.ts` — `isValidUuid`, `parseSeedArgs` (CLI precedence over env, missing/invalid throws), `classifyProfileAction` (insert/noop/conflict = idempotent + fail-closed).
- **Security** (`src/tests/security/auth-guard.test.ts`, static): `guard.ts` first line is `import 'server-only'`; guard authorizes via `getUser()` and **not** `getSession()`; guard uses the anon server client and **never** `getSupabaseServiceRole`/the service-role module (request-path guard does not use service-role); **no signup/register route or component** under `src/app`/`src/components` and no `signUp()`/`createUser()` call; **service-role not imported by any `src/app`/`src/components` file**; dependency-cruiser still has `no-client-to-service-role`; seed script verifies via `getUserById` and never calls `createUser`/`signUp`.
- **Integration** (`src/tests/integration/`, gated `SUPABASE_LOCAL_TESTS=1`, no DB mocking): `auth-guard.test.ts` drives the guard's exact own-row profile read against the **real RLS substrate** via the AURA-103 psql role-sim harness (rolled-back txn) — super_admin/client_admin read their own role; the no-profile auth user reads nothing → guard 403; anon → 401. `seed-admin.test.ts` proves the upsert DB invariants (exactly one super_admin row; duplicate insert rejected by the PK — the invariant the script guards via `classifyProfileAction`).

### Verification (this branch)

- **Local stack (CLI 2.106.0):** `supabase start` ✓ → `supabase db reset` applies both migrations clean ✓ → `SUPABASE_LOCAL_TESTS=1 npm run test:security` **PASS (6 files, 53)** → `SUPABASE_LOCAL_TESTS=1 npm run test:integration` **PASS (3 files, 7)** → `supabase stop` ✓.
- **Full gates (CI mode):** `npm run quality` **PASS** (lint, typecheck, format:check, `npm run test` 13 files/65 + 68 gated-skips, unused, deps:check 0 violations, `next build` 4 routes). `npm run audit` **PASS** (exit 0; 2 moderate `postcss`-via-`next` carry-forward only).
- **Blocker greps clean:** no `clients`/`client_id`; no raw IP; no service-role in `src/app`/`src/components`; no `signUp()`/`createUser()` call; `package-lock.json` / `.env` / `config.toml` / migrations untouched.

### Carry-forward / open items

1. **Runner decision (action needed, separate):** `scripts/seed-admin.ts` is committed and type-checked but **not yet runnable** — executing it needs a TS runner that resolves the `@/*` path alias and the `server-only` guard (the only no-throw path is the `react-server` resolve condition). No runner is a repo dependency and none was added (locked decision #3). Options for a follow-up: approve `tsx` (devDependency) and add a `seed:admin` npm script, or run via `node` with a path-alias loader + `--conditions=react-server`. The script's pure logic and DB effect are already covered by unit + gated-integration tests.
2. **Production `enable_signup = false` (D-40):** hosted-Supabase deployment/config requirement (local `config.toml` stays `true`). The app-layer guard already rejects any non-admin session, so local signup drift is non-dangerous.
3. Live guard/seed integration tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI (same posture as AURA-102/103).
4. The first admin Route Handler / admin layout (**AURA-301**) will consume `requireAdmin`/`requireSuperAdmin`; remove the `guard.ts` / `index.ts` Knip entries then.

**Opus 4.8 review: APPROVE — merged.** Current source of truth is `develop` at `44a7fd4`. **AURA-105 (storage bucket policies + media path strategy) is next — not started; requires its own per-task approval (migration task).**

---

## AURA-103 — MERGED (`1a35958`)

**AURA-103: RLS policies for all sensitive MVP tables (+ role-check helpers, least-privilege grants, RLS-layer tests).**

Merged via PR #15 (squash) into `develop` at `1a35958 feat: add RLS policies for MVP tables` (full SHA `1a35958ccf658b6918474b5b1d51b6c5de37be75`); `develop` is now the source of truth. Feature branch `feat/aura-103-rls-policies` deleted. Opus 4.8: **APPROVE**, merge recommendation **YES**, no blocking issues. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

New migration only (AURA-102 init migration untouched).

**Migration:** `supabase/migrations/20260617025449_rls_policies.sql` — adds the RLS policy matrix on top of the AURA-102 default-deny baseline. Documented rollback block in the header (drops policies + helper functions; **RLS stays ENABLED** — never disabled).

**Helper functions (3):**
- `public.current_user_role()` → `public.user_role` — `SECURITY DEFINER`, `STABLE`, `SET search_path = ''`, fully-qualified, reads `public.user_profiles` via `(select auth.uid())`. SECURITY DEFINER is what bypasses RLS on the profile lookup and **prevents recursive RLS**.
- `public.is_admin()` → boolean — `coalesce(role in ('super_admin','client_admin'), false)`; SECURITY INVOKER, STABLE, `search_path=''`.
- `public.is_super_admin()` → boolean — `coalesce(role = 'super_admin', false)`; SECURITY INVOKER, STABLE, `search_path=''`.
- Execution: `REVOKE ALL ... FROM PUBLIC` then `GRANT EXECUTE ... TO authenticated` (anon gets none — no anon policy references them).

**Policies (36 total):** properties 4 · areas 4 · legal_pages 4 · property_media 5 · property_stakeholders 4 · leads 4 · whatsapp_clicks 2 · settings 3 · user_profiles 5 · audit_logs 1. (rate_limits: 0 — service-role only.)
- **Public reads (anon):** published properties, active areas, published legal pages, media of published properties.
- **Public inserts (anon):** leads (`WITH CHECK (true)`), whatsapp_clicks (`WITH CHECK (true)`). No anon SELECT/UPDATE/DELETE on either.
- **Admin (authenticated, `is_admin()`):** properties/areas/legal_pages SELECT/INSERT/UPDATE; property_media + property_stakeholders full CRUD; leads SELECT/INSERT/UPDATE; whatsapp_clicks SELECT; settings SELECT/INSERT/UPDATE.
- **user_profiles:** own-row SELECT (`id = (select auth.uid())`) for any authenticated user; super_admin SELECT/INSERT/UPDATE/DELETE all (`is_super_admin()`). client_admin = own-row only (no user management).
- **audit_logs:** super_admin SELECT only; no INSERT/UPDATE/DELETE policy (writes are service-role only).

**Locked decisions enforced:**
- `property_stakeholders` — **NO anon/public policy** (direct anon access default-deny; column-safe public projection deferred to AURA-203). Verified even with a `visibility='public'` seed row present.
- `properties` — **NO DELETE policy** (hard delete default-deny for anon AND authenticated; service-role-only, outside MVP UI). Same posture applied to leads (no DELETE policy).

**GRANTs (important deviation/finding — flag for Opus):** the AURA-102 baseline grants anon/authenticated/service_role only `Dxt` (TRUNCATE/REFERENCES/TRIGGER) and **NO DML** — so explicit grants are *required* for the policies (and the server-side service role) to function at all. The migration `REVOKE ALL ON TABLE ... FROM anon, authenticated` on all 11 tables (also removing the stray anon/authenticated **TRUNCATE** footgun), then grants least-privilege:
- anon: SELECT on properties/areas/legal_pages/property_media; INSERT on leads/whatsapp_clicks. Nothing else.
- authenticated: per-table DML matching the policies (no DELETE on properties/leads; nothing on rate_limits).
- service_role: SELECT/INSERT/UPDATE/DELETE on all 11 tables — it is the trusted BYPASSRLS server role that performs the "service-role only" operations the matrix relies on (audit_logs writes, rate_limits, any rare hard delete). Without this grant those documented behaviours would be impossible.
- **rate_limits:** NO anon/authenticated grants and NO policies (service-role only). Cleanup/pg_cron is AURA-106.

**Tests:**
- `src/tests/security/rls-test-utils.ts` — shared psql role-simulation harness (not a test file): seeds fixtures + `set local role` + `request.jwt.claims` inside a rolled-back transaction (no committed seed files). `-q` strips command tags so only the measured query output is captured.
- `src/tests/security/rls-policies.test.ts` — RLS-layer **negatives** + policy-catalog assertions (counts per table, rate_limits 0, properties no DELETE, stakeholders no anon, current_user_role SECURITY DEFINER, rate_limits no anon/authenticated grants).
- `src/tests/dal/rls-policies.test.ts` — RLS-layer **positives** (anon allowlist reads/inserts; super_admin all-status + user management + audit; client_admin manages business tables but cannot manage users or read audit logs).
- `src/tests/security/schema-rls.test.ts` — updated: replaced the AURA-102 "0 policies" live assertion with "policies now exist (authored in AURA-103) + rate_limits stays policy-free"; clarified the static init-file guard.
- Application-layer authenticated negatives (session-but-no-profile; profile-but-no-role → 401/403) are intentionally **deferred to AURA-104** and not asserted here.

**Generated types:** `npm run db:types` produced a **small expected diff** in `src/types/database.ts` — the 3 new helper functions now appear under `Functions` (`current_user_role`/`is_admin`/`is_super_admin`). This is correct (the AURA-103 task spec required these helpers); the "byte-identical" expectation in the task brief assumed policies-only, but helper functions necessarily surface in generated types. No table/enum type changes.

**Local verification (CLI 2.106.0):** `supabase db reset` applies both migrations clean from scratch; `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (4 files, 41); `SUPABASE_LOCAL_TESTS=1 npm run test:security` PASS (5 files, 43); `npm run quality` PASS (exit 0); `npm run audit` PASS (2 moderate postcss carry-forward). Blocker greps clean (no `clients`/`client_id`, no raw IP, no rate_limits policy, no anon stakeholder policy, no properties DELETE policy).

**Scope honoured:** no auth flow, no seed users/seed data, no UI, no API routes, no storage policies, no rate-limit cleanup/pg_cron, no AURA-104 work, no `.env`/secrets, no dependency/lockfile change.

**Opus 4.8 review (PR #15): APPROVE — merge recommendation YES, no blocking issues.**

**Carry-forward:** (1) live RLS tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI; (2) for **AURA-104**, anon has INSERT but no SELECT on `leads` / `whatsapp_clicks`, so the route layer must use **minimal-return behavior** for those anon inserts; (3) AURA-104 must complete the application-layer authenticated negatives deferred here (session-but-no-profile → blocked; profile-but-no-qualifying-role → 403; valid `super_admin`/`client_admin` → allowed).

---

## AURA-102 — MERGED (`3657e4f`)

**AURA-102: Initial migration — core MVP tables (+ generated types, schema/security tests)**

Merged via PR #13 (squash) into `develop` at `3657e4f feat: add initial MVP database migration` (full SHA `3657e4fd1d2686bab6d6dcf95261a2f184ac9787`). Feature branch deleted. Opus 4.8: **APPROVE**, merge recommendation **YES**, no blocking issues; post-review `db:types` reproducibility / failure-safety fixes completed before merge. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

Summary: 11 MVP tables; 17 native PostgreSQL enums; generated `src/types/database.ts`; failure-safe `db:types` script; RLS enabled on all 11 tables; **0 RLS policies**; no seed data; no auth; no API routes; no UI.

Files created:

- `supabase/migrations/20260616183318_init.sql` — single initial migration. Creates: 17 native PostgreSQL enum types; the shared `set_updated_at()` trigger function; all 11 MVP tables (`user_profiles`, `areas`, `properties`, `property_media`, `property_stakeholders`, `leads`, `whatsapp_clicks`, `settings`, `legal_pages`, `audit_logs`, `rate_limits`); the generated `properties.title_en` STORED column; the indexing/uniqueness contract (slug/reference_number/areas.slug UNIQUE, partial-unique published-legal-slug, 2 composite property indexes, 5 FK indexes, GIN full-text index); 7 `updated_at` triggers; and `ENABLE ROW LEVEL SECURITY` on all 11 tables. **No RLS policies** (AURA-103), **no seed data**, **no rate_limits cleanup/pg_cron** (AURA-106). Rollback path documented in the file header.
- `src/types/database.ts` — generated by `npm run db:types`. Generated artifact (ignored by Knip/Prettier/ESLint; never hand-edited).
- `src/tests/dal/schema.test.ts` — static migration assertions (CI-safe) + gated `psql` catalog introspection (`SUPABASE_LOCAL_TESTS=1`): tables, enums + values, JSONB columns, generated column, unique constraints, all 9 indexes, partial-unique + GIN method, and D-05 / D-18 / D-51 negative scans.
- `src/tests/security/schema-rls.test.ts` — static + gated: RLS enabled on all 11 tables, **0 policies**, no `clients`/`client_id`, no raw-IP in sensitive tables.

Files modified:

- `package.json` — added failure-safe `db:types` script: `SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-dummy} supabase gen types --local --lang=typescript > /tmp/aura-database-types.ts && mv /tmp/aura-database-types.ts src/types/database.ts`. Generation writes to a temp file and only `mv`s it into place on success, so a failed run never truncates the tracked `src/types/database.ts`. **No dependency / `package-lock.json` change.**
- `knip.jsonc` — added `ignore: ["src/types/database.ts"]` and `ignoreBinaries: ["supabase"]`.
- `.prettierignore`, `eslint.config.mjs` — exclude the generated types file.

Files removed:

- `src/types/.gitkeep` — superseded by `database.ts`.

Locked decisions applied (user-approved for this task):

1. Native PostgreSQL enums for **all** controlled columns (17 enum types — the 9 named in the task plus 8 implied by the data model).
2. `db:types` package script (no lockfile change).
3. CLI-timestamped migration filename via `supabase migration new init`.
4. `rate_limits` table + `expires_at` only — cleanup/pg_cron deferred to AURA-106.
5. Shared `set_updated_at()` trigger function + `updated_at` triggers on the 7 tables whose data-model row marks `updated_at` "Auto".

Implementation notes / deviations:

- **Enum count:** 17 (task listed 17 explicitly; all created). `user_role` references `auth.users(id)` via `user_profiles.id` (standard Supabase pattern).
- **NOT NULL posture:** always-required fields are `NOT NULL`; publish-time requirements (e.g. cover image, `en` title key) are app-layer validations, not DB constraints, per the data model.
- **`legal_pages.content` is JSONB** (structured Markdown / controlled rich text) — there is no raw-HTML column/affordance (D-12).
- **GIN index** built on `to_tsvector('english', coalesce(title_en, ''))` over the generated `title_en` column.
- **`supabase gen types --local` quirk (CLI 2.106.0):** requires `SUPABASE_ACCESS_TOKEN` to be set (any value) to pass a platform-auth pre-check before falling through to the local postgres-meta container. The `db:types` script bakes in `SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-dummy}` to satisfy this, and writes to `/tmp/aura-database-types.ts` then `mv`s it into place so a failed generation never truncates the tracked file. Regeneration still requires a running local stack.
- Schema tests use `psql` (Homebrew, on PATH) for catalog introspection — no new npm dependency. They are gated by `SUPABASE_LOCAL_TESTS=1`; CI (no local stack) runs the static layer only until the Dockerized stack lands in AURA-107.

**No `.env`/secrets. No seed users/data. No auth flow. No RLS policies. No API routes. No UI. No AURA-103/104 work.**

---

## Previous Session (AURA-101 — merged)

**AURA-101: Supabase local stack + client/server/service-role helpers (server-only)**

Files created:

- `supabase/config.toml` — Minimal Supabase CLI local stack config. `project_id = "aura"`. Standard port layout (API 54321, DB 54322, Studio 54323). Auth enabled, anonymous sign-ins disabled. Analytics disabled. No migrations, no seed data, no secrets. Compatible with current Supabase CLI.
- `src/lib/supabase/client.ts` — Browser anon helper. `createBrowserClient` from `@supabase/ssr`. Uses `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`. No `server-only` import. Safe for Client Components.
- `src/lib/supabase/server.ts` — Async server anon helper. `createServerClient` from `@supabase/ssr`. Imports `getServerEnv()` from `@/lib/config/env` (calls it for fail-fast validation; establishes real import path for env.ts). `cookies()` from `next/headers` awaited (Next.js 15 async cookies). Cookie `setAll` typed with `CookieOptions` from `@supabase/ssr`. Request-scoped; no global memoization.
- `src/lib/supabase/service-role.ts` — Service-role server-only helper. First line: `import 'server-only'`. `createClient` from `@supabase/supabase-js`. `SUPABASE_SERVICE_ROLE_KEY` obtained from `getServerEnv()`, never exported. Memoized singleton (singleton is safe: no request-scoped cookies). `auth.autoRefreshToken: false, persistSession: false`.
- `src/tests/security/supabase-boundaries.test.ts` — 4 security tests: (1) service-role.ts first line is exactly `import 'server-only'`; (2) dep-cruiser config has `no-client-to-service-role` rule; (3) rule `from.path` covers `src/components`; (4) rule `to.path` is `^src/lib/supabase/service-role`.
- `src/tests/dal/supabase-smoke.test.ts` — 4 DAL tests (1 skipped in CI): importability smoke for `createBrowserClient`, `createServerClient`, `createClient`; local-stack network test gated by `SUPABASE_LOCAL_TESTS=1`. CI Dockerized stack deferred to AURA-107.

Files modified:

- `knip.jsonc` — Removed `@supabase/ssr` and `@supabase/supabase-js` from `ignoreDependencies` (now genuinely imported). Removed `entry: ["src/lib/config/env.ts"]` (env.ts now has real importers via server.ts and service-role.ts). Added `entry: ["src/lib/supabase/client.ts", "src/lib/supabase/server.ts", "src/lib/supabase/service-role.ts"]` — library modules pending first DAL caller (AURA-102+).
- `CURRENT_STATE.md`, `SESSION_HANDOFF.md` (this file), `NEXT_STEPS.md` — updated to AURA-101 state.

Boundary proof:

- Created temp fixture `src/components/ui/___boundary_probe_delete_me.ts` importing `@/lib/supabase/service-role`.
- `npm run deps:check` failed with 2 errors: `no-ui-to-supabase` + `no-client-to-service-role`.
- Removed fixture. `npm run deps:check` passes clean (0 violations, 21 modules).
- Fixture never committed.

Local Supabase CLI verification:

Supabase CLI 2.106.0 (Homebrew) + Docker 29.5.3: `supabase start` PASS → `supabase status` PASS → `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (5/5) → `supabase stop` PASS. `.gitignore` excludes `supabase/.branches/` and `supabase/.temp/`; runtime artifacts confirmed untracked.

**No dependencies installed. No `package.json` / `package-lock.json` change. No `.env` / `.env.local`. No secrets. No migrations. No auth implementation. No API routes. No AURA-102 work.**

---

## Decisions Applied (this session, user-approved via task spec)

- **`getServerEnv()` called in server.ts factory** — validates server env is complete on every server client creation; memoized so free after first call. Establishes real import path for env.ts (removes Knip entry). ESLint `no-unused-vars` satisfied by the call.
- **`CookieOptions` type import** — explicit type annotation on `setAll` parameter required because TypeScript strict mode + `@supabase/ssr` v0.5.0 doesn't infer it from context.
- **service-role singleton** — safe because the service-role client is not request-scoped (no cookies). Server anon client is NOT memoized (cookies are request-scoped).
- **Knip entries for supabase helpers** — same pattern as `env.ts` in AURA-005: library modules with no application callers yet. Remove in AURA-102+ as DAL functions are added.

---

## Gate Results (AURA-101)

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run test` | PASS — 8 files, 21 tests + 1 skipped |
| `npm run test:unit` | PASS — 8 tests |
| `npm run test:dal` | PASS — 4 tests + 1 skipped (SUPABASE_LOCAL_TESTS=1 gate) |
| `npm run test:security` | PASS — 8 tests |
| `npm run deps:check` | PASS — 0 violations (21 modules) |
| `npm run unused` | PASS |
| `npm run build` | PASS — 4 routes; middleware 44.1 kB |
| `npm run quality` | PASS — composite exit 0 |
| `npm run audit` | PASS — exit 0; 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |

---

## Previous Session (AURA-008 — merged)

**AURA-008: First vertical slice — `/` → `/en` redirect, `/en` homepage shell, Playwright smoke**

Files created:

- `src/middleware.ts` — Explicit HTTP 301 redirect from `/` → `/en` via `NextResponse.redirect(new URL('/en', request.url), 301)`. Delegates all other paths to `next-intl` locale middleware (`createMiddleware(routing)`). Matcher excludes `api`, `_next`, `_vercel`, and static asset paths. `NextRequest` is a type-only import to satisfy `@typescript-eslint/consistent-type-imports`.
- `src/lib/i18n/routing.ts` — next-intl routing config; `defineRouting({ locales: ['en'], defaultLocale: 'en' })`. Wires `next-intl` so it can be removed from Knip allowlist.
- `src/app/[locale]/layout.tsx` — Minimal nested locale layout. Does NOT render `<html>`/`<body>` (root layout owns those). RTL-aware lang/dir attributes deferred to AURA-201.
- `src/app/[locale]/page.tsx` — Minimal luxury-dark homepage shell. Uses all AURA design token Tailwind classes. No data fetching, Supabase, auth, GSAP, CRM, or lead capture.

Files modified:

- `src/app/page.tsx` — Replaced placeholder with defensive `permanentRedirect('/en')` fallback (308). Fires only if a request bypasses the middleware; middleware handles the canonical 301.
- `src/tests/e2e/smoke.spec.ts` — Removed `test.describe.skip`. Added 301 status + `location` header assertions using `request.get('/', { maxRedirects: 0 })`. Added `/en` loads without error test.
- `.github/workflows/ci.yml` — Replaced commented e2e stub with active `e2e` job: checkout → Node 20 → pin npm@11.12.1 → `npm ci` → `npx playwright install --with-deps chromium` → `npm run build` → `npm run start &` → curl wait loop (30×2s) → `npm run test:smoke -- --project=chromium` (`--project=chromium` ensures WebKit is not required in CI).
- `knip.jsonc` — Removed `"next-intl"` from `ignoreDependencies` (now genuinely imported).

Continuity files updated:

- `CURRENT_STATE.md`, `SESSION_HANDOFF.md` (this file), `NEXT_STEPS.md` — updated to AURA-008 state.

**No dependencies installed. No `package.json` / `package-lock.json` change. No `.env` / `.env.local`. No secrets. No Supabase, migrations, auth, admin, CRM, GSAP, deployment config, or AURA-009 work.**

---

## Decisions Applied (this session, user-approved)

- **Explicit 301 via `NextResponse.redirect(..., 301)`** — required by user. `permanentRedirect` (which emits 308) retained as defensive fallback only. `next-intl` middleware-only setup; no `createNextIntlPlugin` needed (no translations used in AURA-008).
- **Chromium-only in CI e2e job** — `npx playwright install --with-deps chromium` + `--project=chromium` flag on smoke step. Local smoke still runs all projects (Chromium + Mobile Safari). CI avoids WebKit download failure.
- **No `createNextIntlPlugin` in `next.config.js`** — middleware-only wiring is sufficient for AURA-008; plugin not needed until message translations are used (Phase 2+).
- **Root layout retains static `lang="en"`** — locale-aware `lang`/`dir` attributes on `<html>` deferred to AURA-201 (RTL support). Correct and safe for Phase 0.
- **`[locale]/layout.tsx` does not wrap `<html>`/`<body>`** — Next.js App Router requires those in the outermost layout only.

---

## Gate Results

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run test` | PASS — 6 files, 14 tests |
| `npm run test:unit` | PASS |
| `npm run test:dal` | PASS |
| `npm run test:integration` | PASS |
| `npm run test:security` | PASS |
| `npm run deps:check` | PASS — 0 violations (15 modules) |
| `npm run unused` | PASS |
| `npm run build` | PASS — 4 routes; middleware 44.1 kB |
| `npm run test:smoke` | PASS — 4/4 (Chromium + Mobile Safari) |
| `npm run test:smoke -- --project=chromium` | PASS — 2/2 |
| `npm run quality` | PASS — composite exit 0 |
| `npm run audit` | PASS — exit 0; 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |

### GitHub CI (PR #9)

| Check | Result |
|---|---|
| `quality` | PASS |
| `e2e` | PASS |
| `analyze (javascript-typescript)` | PASS |
| `CodeQL` | PASS |

### Branch Protection (`develop`)

Required checks now enforced:

```
quality
e2e
analyze (javascript-typescript)
CodeQL
```

GitHub required approvals are disabled for solo-operator mode; status checks remain enforced.

---

## Open Issues (Carry-Forward)

1. **`postcss` moderate** — documented exception via `next@15` internal postcss; passes `--audit-level=high`. Not actionable.
2. **Playwright Node.js deprecation warning** — Playwright internal; not a gate failure.
3. **Knip entries for Supabase helpers** — `client.ts`, `server.ts`, `service-role.ts` declared as Knip entries. Remove each as the first DAL caller is added (AURA-102+).
4. **Remaining Knip allowlist entries** — `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `resend`, forms/query/motion packages remain. Remove per phase schedule.
5. **Opus 4.8 non-blocking note** — `config.toml` local `enable_signup = true` (Supabase default; harmless locally; production must set `false` for D-40 in AURA-104).

---

## Validation Status

AURA-103 is merged. Squash-merged PR #15 (`feat/aura-103-rls-policies` → `develop`) at `1a35958` (full SHA `1a35958ccf658b6918474b5b1d51b6c5de37be75`). Feature branch deleted. `develop` is now the source of truth — clean and synced with `origin/develop`. All local gates passed; GitHub required checks (`quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`) all PASSED before merge. Opus 4.8 review: **APPROVE**, merge recommendation **YES**, no blocking issues.

AURA-102 remains merged at `3657e4f`. AURA-101 remains merged at `95f9df3`.

`develop` branch protection active: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL` all required. GitHub required approvals disabled for solo-operator mode.

---

## Next Safe Action

**AURA-104 (auth flow + `user_profiles` role checks + admin bootstrap script, D-40)** is the next safe task — **not started**. It touches auth / seed / security-sensitive flow, so it requires a **new session** and **explicit per-task approval** per CLAUDE.md before any work begins. Do not create the auth flow, seed users, or API routes in this session. AURA-104 must complete the application-layer authenticated negatives deferred from AURA-103 (session-but-no-profile → blocked; profile-but-no-qualifying-role → 403; valid `super_admin`/`client_admin` → allowed), use minimal-return behavior for anon lead/whatsapp_clicks inserts (anon has INSERT but no SELECT), and set `enable_signup = false` for production (D-40). Branch (when approved): `feat/aura-104-auth-rbac`.
