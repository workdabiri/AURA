# AURA — TASKS_Project.md

**Source structure:** Pack §19 (Task Breakdown Contract) — template §19.1, phases §19.2, first slice §19.3
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`, `CLAUDE.md`, `docs/DECISION_LOG.md`
**Status:** Generated for approval. No implementation has started. No code, dependencies, migrations, Supabase files, or env files were created by generating this document.
**Generated:** 2026-06-13

---

## How To Use This Document

- Execute **one task at a time, in order**. Phase 0 must complete before Phase 1, and so on. Within a phase, tasks are ordered by dependency.
- Every task uses the pack §19.1 template: Goal, Context, Requirements, Constraints, Allowed/Forbidden/Likely-affected files, Acceptance Criteria, Test Plan, Required Commands, Migration/Rollback Note, Definition of Done, Out of Scope.
- Each task additionally carries an explicit **Model Assignment** and **Merge Gates** block.
- A task is not done until its required quality gates pass (D-28). Update `SESSION_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md` after each task.

---

## Model Authority (applies to every task)

| Activity | Model |
|---|---|
| Architecture / security / tradeoff review and sign-off | **Opus 4.8** |
| Task execution (approved tasks only; escalate, never redesign) | **Sonnet 4.6** |
| Fable 5 | Not used (initial architecture phase only; do not request) |

Each task names the executing model and whether **Opus 4.8 review is required before merge**. Tasks touching auth, RLS, migrations, secrets, service-role, rate-limit hashing, legal HTML, or architecture boundaries are flagged **Opus review: required**.

---

## Execution Approval (Governance)

**Approving this document approves the _plan_, not the _execution_ of sensitive tasks.** Per `CLAUDE.md` startup behavior, install, migration, auth, and secrets tasks still require explicit per-task approval immediately before they run — plan approval does not waive that confirmation. This applies specifically to:

- **AURA-001** — first `npm install` / `package-lock.json` creation
- **AURA-101** — Supabase files (`supabase/config.toml`, client/server/service-role helpers)
- **AURA-102** — initial database migration
- **AURA-104** — auth flow + admin bootstrap (secrets/seed)
- **Any later task** that adds a migration, touches auth, or handles secrets (e.g. AURA-103, AURA-105, AURA-106, AURA-301, AURA-402, AURA-603, AURA-604).

Sonnet 4.6 must surface and confirm such a task before starting it, and may not treat its presence in this approved plan as the required go-ahead.

---

## Global Constraints (inherited by EVERY task)

Repeated per-task as the standard Constraints block. Listed once here in full:

- Must follow locked decisions **D-01 to D-51** and ratified Q-01–Q-15 / A-01–A-16 (`docs/DECISION_LOG.md`).
- Must **never** introduce a `clients` table, `client_id` column, shared production DB, or tenant routing (D-05 — **merge blocker**).
- Service-role key is **server-only**; never imported by a client component or `NEXT_PUBLIC_`-prefixed (**merge blocker**).
- No raw IP/PII in `whatsapp_clicks`, `rate_limits`, `audit_logs`, or any event/analytics table; rate-limit keys use `salted-hash(IP + route)` (D-18, D-51 — **merge blocker**).
- No raw/unsafe legal HTML; Markdown or sanitized controlled rich text only (D-12 — **merge blocker**).
- No public admin self-signup; first `super_admin` via Supabase Auth + seed/admin script (D-40 — **merge blocker**).
- Respect dependency direction: `app/routes → components → domain → dal/services → lib/config`. No DAL→UI, no domain→React, no UI→Supabase, no API handler without Zod validation.
- Minimal, task-scoped changes only. No unapproved scope, abstractions, or dependencies. `npm install` and `package-lock.json` changes require explicit approval.
- Do not touch `.env`/secrets, auth, billing, migrations, or production deploy config without explicit approval.
- PRs target `develop`. `main` is manual-only, never auto-merged. No force-push.

---

## Global Merge Gates (inherited by EVERY task)

A PR may merge to `develop` only when all applicable checks pass (`docs/QUALITY_GATES.md`):

`npm run lint` · `npm run typecheck` · `npm run format:check` · `npm run test` (unit/dal/integration/security as applicable) · `npm run unused` · `npm run deps:check` · `npm run build` · `npm run audit` (on dep changes) · CodeQL · branch protection + ≥1 review. Data/security/architecture blockers in `docs/QUALITY_GATES.md` apply unconditionally.

---

# Phase 0 — Foundation (gates + CI first)

> Phase 0 establishes the repo skeleton, quality gates, and green CI **before any product or cinematic work** (§19.3). The first vertical slice (AURA-008) proves the pipeline end-to-end.

---

## Task AURA-001: Repo scaffold — Next.js App Router + TypeScript strict + base folder architecture

### Goal
Initialize the Next.js App Router application with TypeScript strict mode and the locked `src/` folder architecture, with nothing rendered beyond a placeholder.

### Context
D-29 (greenfield from zero), `docs/ARCHITECTURE.md` repository structure, dependency-direction rule. Dependencies are declared but not installed; this task is the first approved `npm install`.

### Requirements
- Scaffold Next.js App Router with `src/` directory, TypeScript strict (`tsconfig.json` already present — align, do not loosen).
- Create the empty layer folders: `src/app`, `src/components/{ui,real-estate,marketing,admin,layout}`, `src/config`, `src/domain`, `src/dal`, `src/services`, `src/lib/{supabase,validation,i18n,seo,utils}`, `src/styles`, `src/types`, `src/tests/{unit,dal,integration,e2e,security}` (placeholder `.gitkeep` or index where needed).
- Install only the approved frontend/runtime dependencies listed in `CURRENT_STATE.md` (explicit approval required for the install).

### Constraints
- Must follow locked decisions D-01 to D-51. No out-of-scope items. Preserve greenfield boundaries. No `clients`/`client_id`/shared DB/SaaS tenant model.
- `npm install` and lockfile creation require explicit approval (this task is where it is granted).

### Allowed Files / Areas
- `package.json` (deps block), `package-lock.json` (created), `next.config.js`, `tsconfig.json`, `src/**` folder scaffold, `.gitignore`.

### Forbidden Files / Areas
- `supabase/**`, `.env*` (except `.env.example` in AURA-005), any RLS/migration, any business logic, any cinematic/GSAP code.

### Files Likely Affected
- `package.json`, `package-lock.json`, `next.config.js`, `src/app/layout.tsx`, `src/app/page.tsx` (placeholder).

### Acceptance Criteria
- [ ] `npm run build` succeeds with a placeholder page.
- [ ] `npm run typecheck` passes under strict mode.
- [ ] Folder architecture matches `docs/ARCHITECTURE.md`.
- [ ] No Supabase/env/secret files created.

### Test Plan
- Unit: N/A (scaffold).
- DAL / Integration / E2E / Security negative: N/A this task.
- Accessibility / Visual: N/A (placeholder only).

### Required Commands
- `npm run typecheck` · `npm run lint` · `npm run build`

### Migration / Rollback Note
N/A (no DB/storage/env). Rollback = revert the scaffold commit; delete `node_modules`/`package-lock.json` if reverting the install.

### Definition of Done
- [ ] Code implemented · [ ] Tests N/A · [ ] Screenshots N/A · [ ] Quality commands pass · [ ] Architecture boundary preserved · [ ] Security checks pass · [ ] No forbidden scope · [ ] PR ready.

### Out of Scope
Routing, i18n, redirects, styling, any data layer.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (first install + architecture skeleton).

### Merge Gates
Global gates + `deps:check` clean on the empty skeleton.

---

## Task AURA-002: ESLint + Prettier + quality script wiring

### Goal
Wire the strict lint/format toolchain and confirm the `package.json` quality scripts run against the scaffold.

### Context
`docs/QUALITY_GATES.md` required scripts block; configs `.eslintrc.json`, `.prettierrc.json` already present as stubs.

### Requirements
- Activate ESLint strict + Prettier; ensure `lint`, `format`, `format:check`, and the composite `quality` script execute.
- Resolve any lint/format issues in the scaffold so all three pass clean.

### Constraints
Global constraints. Do not change the agreed rule set materially without approval.

### Allowed Files / Areas
- `.eslintrc.json`, `.prettierrc.json`, `package.json` (scripts), `.eslintignore`/`.prettierignore`.

### Forbidden Files / Areas
- Any `src/**` business logic; Supabase/env/secrets.

### Files Likely Affected
- Lint/format config, `package.json`.

### Acceptance Criteria
- [ ] `npm run lint` passes · [ ] `npm run format:check` passes · scripts match `docs/QUALITY_GATES.md`.

### Test Plan
- All layers N/A; this is tooling. Verification is via the commands.

### Required Commands
- `npm run lint` · `npm run format:check`

### Migration / Rollback Note
N/A. Rollback = revert config commit.

### Definition of Done
Standard §19.1 checklist (tests N/A).

### Out of Scope
Test runners, dependency-cruiser, CI.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates (lint + format must be green).

---

## Task AURA-003: Testing stack — Vitest + Playwright harness

### Goal
Stand up Vitest (unit/dal/integration/security) and Playwright (e2e/smoke) with one trivial passing test per layer to prove the harness.

### Context
A-12 (Vitest + Playwright), `docs/TEST_STRATEGY.md` test file structure, A-02 (no DB mocking — DAL/integration use Supabase CLI local stack, scaffolded here but exercised in Phase 1).

### Requirements
- Confirm `vitest.config.ts` and `playwright.config.ts` resolve the `src/tests/**` structure.
- Add one smoke-level passing test per Vitest project and a Playwright placeholder (`tests/e2e/smoke.spec.ts`) that is wired but may be skipped until AURA-008.
- Ensure `test`, `test:unit`, `test:dal`, `test:integration`, `test:security`, `test:e2e`, `test:smoke` scripts run.

### Constraints
Global constraints. Do not mock the DB layer (A-02) — DAL/integration tests connect to the local Supabase stack (introduced Phase 1).

### Allowed Files / Areas
- `vitest.config.ts`, `playwright.config.ts`, `src/tests/**`, `package.json` (test scripts).

### Forbidden Files / Areas
- Product code, Supabase migrations, env files.

### Files Likely Affected
- Test configs, `src/tests/unit/*.test.ts`, `src/tests/e2e/smoke.spec.ts`.

### Acceptance Criteria
- [ ] `npm run test` runs and passes the placeholder suites · [ ] Playwright config loads.

### Test Plan
- Unit: one trivial assertion. E2E: skipped placeholder spec. DAL/Integration/Security: scaffolded, exercised Phase 1.

### Required Commands
- `npm run test` · `npm run typecheck`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist.

### Out of Scope
Real DAL/security tests (Phase 1+), CI integration (AURA-007).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + `npm run test` green.

---

## Task AURA-004: Architecture boundary enforcement — dependency-cruiser + Knip

### Goal
Activate `dependency-cruiser` (dependency direction) and Knip (unused code) so boundary violations and dead code fail CI.

### Context
`.claude/rules/dependency-direction.md`, `docs/ARCHITECTURE.md` dependency direction, `.dependency-cruiser.cjs` stub present.

### Requirements
- Finalize `.dependency-cruiser.cjs` rules encoding the forbidden imports (DAL→UI, domain→React/UI/DAL, UI→Supabase, client→service-role, API without Zod where statically detectable).
- Wire `deps:check` and `unused` to run clean on the scaffold.

### Constraints
Global constraints. The rule set must match the dependency-direction rule file exactly.

### Allowed Files / Areas
- `.dependency-cruiser.cjs`, `knip` config, `package.json` (scripts).

### Forbidden Files / Areas
- Product code, Supabase/env.

### Files Likely Affected
- `.dependency-cruiser.cjs`, `knip.json`/config in `package.json`.

### Acceptance Criteria
- [ ] `npm run deps:check` passes with zero violations · [ ] `npm run unused` passes · [ ] forbidden cross-layer import is provably blocked (add a temporary fixture, confirm failure, remove).

### Test Plan
- Boundary check is the test. Optionally a throwaway violation fixture to confirm the gate trips.

### Required Commands
- `npm run deps:check` · `npm run unused`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + boundary gate demonstrably enforcing.

### Out of Scope
CI wiring (AURA-007).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (architecture boundary enforcement is a merge-blocker mechanism).

### Merge Gates
Global gates + `deps:check` + `unused` green.

---

## Task AURA-005: Environment schema + `.env.example` (no secrets)

### Goal
Define a Zod-validated environment schema validated at the server boundary, plus a documented `.env.example` with **no real values**.

### Context
Pack §20 (public vs server-only vars), `docs/CI_CD_STRATEGY.md` env policy, service-role merge-blocker rule. **D-40/secret rules: no real secrets committed.**

### Requirements
- `src/lib/config/env.ts` (or `src/config/env.ts`) validating: public (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, analytics flag) and server-only (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `SENTRY_AUTH_TOKEN`, `RATE_LIMIT_SALT`).
- Server-only vars guarded so they cannot be read from client code (`server-only` import boundary).
- `.env.example` documents every variable with placeholder values only.

### Constraints
Global constraints. **Never** create a real `.env`. Service-role/RATE_LIMIT_SALT are server-only (merge blocker). `.env.example` only.

### Allowed Files / Areas
- `src/lib/config/env.ts` (or `src/config/env.ts`), `.env.example`, `src/lib/validation/**` (env schema).

### Forbidden Files / Areas
- `.env`, `.env.local`, any real secret value, client components importing server-only env.

### Files Likely Affected
- `env.ts`, `.env.example`.

### Acceptance Criteria
- [ ] Build fails fast on missing required env at server boundary · [ ] `.env.example` lists all vars, no secrets · [ ] service-role/salt unreachable from client bundle.

### Test Plan
- Unit: env schema parse/reject (missing var → throws). Security negative: assert server-only var not exported through any client-importable path.
- Boundary: `deps:check` confirms no client→server-only-env import.

### Required Commands
- `npm run test:unit` · `npm run typecheck` · `npm run build` · `npm run deps:check`

### Migration / Rollback Note
Env change (schema only, no secrets). Rollback = revert; document required vars in `.env.example`.

### Definition of Done
Standard checklist + secret-safety verified.

### Out of Scope
Actual Supabase client construction (AURA-101).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (secrets boundary + service-role rule).

### Merge Gates
Global gates + security: no secret in client bundle + `.env.example` only.

---

## Task AURA-006: Design tokens + Tailwind + `luxury-dark` theme tokens

### Goal
Establish the token-based design system (Tailwind config + CSS variables) with the `luxury-dark` theme, with no component implementation.

### Context
D-25 (token-based, flagship `luxury-dark`), D-21 (admin cannot mutate template architecture), `docs/DESIGN_SYSTEM.md`, §15.7.

### Requirements
- Tailwind config + token layer (`src/styles`) defining color/spacing/typography/motion tokens for `luxury-dark`.
- Tokens are architecture, not admin-editable settings (D-21).

### Constraints
Global constraints. No admin-mutable template architecture. No cinematic/GSAP implementation yet (D-26).

### Allowed Files / Areas
- `tailwind.config.ts`, `src/styles/**`, `src/config/design-tokens` if used.

### Forbidden Files / Areas
- Components, GSAP/motion code, admin settings wiring.

### Files Likely Affected
- `tailwind.config.ts`, `src/styles/tokens.css`, `globals.css`.

### Acceptance Criteria
- [ ] Tokens compile · [ ] `luxury-dark` variables present · [ ] build passes.

### Test Plan
- Unit: N/A (tokens). Visual: placeholder screenshot acceptable; full visual is Phase 5.

### Required Commands
- `npm run build` · `npm run lint` · `npm run typecheck`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist.

### Out of Scope
Cinematic homepage, components, motion system.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required (design-token review optional).

### Merge Gates
Global gates.

---

## Task AURA-007: GitHub Actions CI + CodeQL + branch protection documentation

### Goal
Create the CI workflow running the full quality gate on PRs to `develop`, schedule CodeQL, and document branch protection. Lighthouse advisory job is **defined but disabled until Phase 2**.

### Context
A-01 (one workflow: `npm run quality` + Playwright on PR; CodeQL scheduled/PR), `docs/CI_CD_STRATEGY.md`, CF-4 (Lighthouse advisory from Phase 2, not Phase 0).

### Requirements
- `.github/workflows/ci.yml`: install (`npm ci`), lint, typecheck, format:check, unit/dal/integration/security tests (DAL/integration use Supabase CLI local stack in Docker), deps:check, unused, build, `npm audit --audit-level=high`.
- CodeQL workflow (PR + scheduled).
- Lighthouse job stub present but gated off until Phase 2 (CF-4).
- Document required branch protection (status checks, ≥1 review, dismiss stale, no force-push) — auto-merge into `develop` only, never `main`.

### Constraints
Global constraints. Auto-merge only into `develop` after protection + checks exist. Never auto-merge `main`. No production deploy config without approval.

### Allowed Files / Areas
- `.github/workflows/**`, CI docs in `docs/`.

### Forbidden Files / Areas
- Production deploy/secret config, `main` automation, `.env`.

### Files Likely Affected
- `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`.

### Acceptance Criteria
- [ ] CI runs green on the scaffold PR · [ ] CodeQL configured · [ ] Lighthouse advisory present-but-disabled · [ ] branch protection documented.

### Test Plan
- CI run itself is the verification; security/DAL test jobs wired even if minimal until Phase 1.

### Required Commands
- `npm run quality` (locally) before pushing.

### Migration / Rollback Note
N/A (CI config). Rollback = revert workflow files.

### Definition of Done
Standard checklist + green CI run linked in PR.

### Out of Scope
Vercel preview/prod deploy config, Lighthouse enabling (Phase 2), staging E2E.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (CI/security gate + merge-policy enforcement).

### Merge Gates
Global gates + CI green on its own PR.

---

## Task AURA-008: First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test (§19.3)

### Goal
Prove the pipeline end-to-end: `/` redirects to `/en`, `/en` renders a homepage shell, env schema loads, test stack works, CI is green, zero boundary violations.

### Context
§19.3 first vertical slice, D-06 (route strategy), CF-4 (no cinematic work yet), depends on AURA-001..007.

### Requirements
- `/` → `/en` redirect (D-06).
- `/en` renders a minimal homepage shell using `luxury-dark` tokens (no cinematic/GSAP).
- next-intl scaffold for `/[locale]` with `en` default, RTL-ready structure (D-07 — RTL-ready, Arabic deferred).
- Playwright smoke test: `/` redirects, `/en` loads.

### Constraints
Global constraints. No cinematic homepage before gates (CF-4/§19.3). English visible UI, RTL-ready (D-07).

### Allowed Files / Areas
- `src/app/[locale]/**` (layout + homepage shell), `src/app/page.tsx` (redirect), `src/lib/i18n/**`, `src/components/layout/**` (minimal), `src/tests/e2e/smoke.spec.ts`.

### Forbidden Files / Areas
- GSAP/cinematic code, Supabase queries, admin routes, marketing components.

### Files Likely Affected
- `src/app/page.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, i18n config, smoke spec.

### Acceptance Criteria
- [ ] `/` redirects to `/en` · [ ] `/en` renders shell · [ ] env schema loads · [ ] smoke test passes · [ ] CI green · [ ] zero `deps:check` violations.

### Test Plan
- Unit: i18n/locale helper if any. E2E/Smoke: `/`→`/en`, `/en` loads (Playwright). Security: N/A. Accessibility: basic landmark check. Visual: screenshot of `/en` shell.

### Required Commands
- `npm run test:smoke` · `npm run deps:check` · `npm run build` · `npm run quality`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshot of `/en` shell + green CI.

### Out of Scope
Cinematic hero, property data, areas, legal, admin — all later phases.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required (closes Phase 0; Opus signs off the phase).

### Merge Gates
Global gates + smoke green + zero boundary violations. **Phase 0 exit gate.**

---

# Phase 1 — Data / Auth / Security Foundation

> Establishes Supabase, schema, RLS, auth, role checks, storage, rate-limit table, and the DAL/security test harness. **Opus review required on every Phase 1 task** (migrations, RLS, auth, service-role, rate-limit hashing).

---

## Task AURA-101: Supabase local stack + client/server/service-role helpers (server-only)

### Goal
Add the Supabase CLI local stack config and the three client helpers (browser anon, server anon, server service-role) with strict server-only boundaries.

### Context
A-02 (local stack, no DB mocking), `docs/ARCHITECTURE.md` auth model, service-role merge-blocker rule.

### Requirements
- `supabase/config.toml` + local stack bootstrap (no remote project).
- `src/lib/supabase/{client,server,service-role}.ts`; service-role file begins with `import 'server-only'`.
- DAL is the only layer importing these helpers (enforced by deps:check).

### Constraints
Global constraints. Service-role server-only (merge blocker). No client component may import server/service-role helpers. Migrations require approval (next task).

### Allowed Files / Areas
- `supabase/config.toml`, `src/lib/supabase/**`.

### Forbidden Files / Areas
- Migrations (AURA-102), `.env`, client components importing service-role.

### Files Likely Affected
- `src/lib/supabase/client.ts`, `server.ts`, `service-role.ts`, `supabase/config.toml`.

### Acceptance Criteria
- [ ] Local stack starts · [ ] service-role helper is `server-only` · [ ] `deps:check` blocks client→service-role.

### Test Plan
- Security negative: assert service-role helper not reachable from any client-importable module. DAL: connection smoke against local stack.

### Required Commands
- `npm run deps:check` · `npm run test:dal` · `npm run typecheck`

### Migration / Rollback Note
Supabase env/config change (local only). Rollback = revert config; `supabase stop`.

### Definition of Done
Standard checklist + service-role boundary verified.

### Out of Scope
Tables, RLS, auth flows.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required**.

### Merge Gates
Global gates + service-role-not-in-client + DAL connection smoke.

---

## Task AURA-102: Initial migration — core MVP tables

### Goal
Create the initial migration for the MVP tables exactly per `docs/DATA_MODEL.md`, with RLS **enabled** (policies in AURA-103).

### Context
`docs/DATA_MODEL.md` MVP tables: `user_profiles`, `properties`, `property_media`, `property_stakeholders`, `areas`, `leads`, `whatsapp_clicks`, `settings`, `legal_pages`, `audit_logs`, `rate_limits`. D-05 (no `clients`/`client_id`), D-36/D-37 enums, D-47/A-05 reference numbers, D-48 price visibility, D-08 JSONB i18n fields.

### Requirements
- One migration creating all MVP tables with correct columns, enums (`publish_status`, `transaction_type`, `market_type`, `property_type`, `availability_status`, `lead_status`, `lead_source`, `lead_priority`, `preferred_contact_method`), JSONB translatable fields, indexes and uniqueness (`reference_number` unique, slug uniqueness), and `rate_limits` with 24h TTL design (A-16).
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on every sensitive table (policies next task).

### Constraints
Global constraints. **No `clients` table or `client_id` column anywhere** (D-05 — merge blocker). No raw IP columns in event tables (D-18/D-51). Migrations require explicit approval.

### Allowed Files / Areas
- `supabase/migrations/**`, `src/types/database.ts` (generated types).

### Forbidden Files / Areas
- RLS policy bodies beyond `ENABLE` (AURA-103), seed data, `.env`.

### Files Likely Affected
- `supabase/migrations/0001_init.sql`, `src/types/database.ts`.

### Acceptance Criteria
- [ ] Migration applies clean on local stack · [ ] all MVP tables present · [ ] no `clients`/`client_id` · [ ] no raw IP column in `whatsapp_clicks`/`rate_limits`/`audit_logs` · [ ] RLS enabled on all sensitive tables.

### Test Plan
- DAL: schema introspection asserts table/enum presence and absence of `clients`/`client_id`/`ip_address`. Security: confirm RLS enabled (default-deny) on sensitive tables.

### Required Commands
- `npm run test:dal` · `npm run test:security` · `npm run typecheck`

### Migration / Rollback Note
**Migration task.** Rollback = `down` migration dropping created objects; documented in PR. Test on local before any preview/staging (`docs/CI_CD_STRATEGY.md`).

### Definition of Done
Standard checklist + rollback documented + D-05 scan clean.

### Out of Scope
RLS policy logic, auth, storage, seed data.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (schema + migration).

### Merge Gates
Global gates + D-05 scan + RLS-enabled check + migration rollback documented.

---

## Task AURA-103: RLS policies for all sensitive tables

### Goal
Author explicit RLS policies enforcing public allowlist reads and admin-only access; everything else default-deny.

### Context
`.claude/rules/no-public-sensitive-reads.md`, `docs/SECURITY_BASELINE.md`, D-16 (stakeholder internal-only default), D-30 (roles).

### Requirements
- Public SELECT only: published properties, active areas, published legal pages, public-readable media of published properties.
- Public INSERT only: leads (validated/rate-limited at route layer), whatsapp_clicks (no PII).
- Admin SELECT/mutations gated by `user_profiles.role IN ('super_admin','client_admin')`.
- No public SELECT on leads, whatsapp_clicks, user_profiles, audit_logs, rate_limits, internal stakeholders, draft/archived properties.

### Constraints
Global constraints. Public access allowlisted, never default-open. Admin requires session + role (auth-only insufficient).

### Allowed Files / Areas
- `supabase/migrations/**` (RLS policy migration).

### Forbidden Files / Areas
- App/UI code, env, seed.

### Files Likely Affected
- `supabase/migrations/0002_rls.sql`.

### Acceptance Criteria
- [ ] Every required security-negative DAL test passes (see Test Plan) · [ ] anon cannot read any sensitive table · [ ] internal_only stakeholders absent from public reads.

### Test Plan
- Security negative — **RLS layer only** (required, `docs/TEST_STRATEGY.md`): anon cannot SELECT leads / whatsapp_clicks / user_profiles / audit_logs / rate_limits / draft / archived; property detail excludes internal_only stakeholders. DAL: a role-claimed admin context reads all statuses; published-only public reads. **Application-layer authenticated negatives (session present but no `user_profiles` row; profile present but no role) are completed in AURA-104, not here** — this task must not over-claim full authenticated-role coverage.

### Required Commands
- `npm run test:dal` · `npm run test:security` · `npm run typecheck`

### Migration / Rollback Note
**Migration task** (policies). Rollback = drop policies migration; documented in PR.

### Definition of Done
Standard checklist + RLS-layer (anon/default-deny) security-negatives green. Authenticated session/profile/role-guard negatives are deferred to AURA-104.

### Out of Scope
Auth session wiring + application-layer authz negatives (AURA-104), storage policies (AURA-105).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (RLS is a P0 security boundary).

### Merge Gates
Global gates + RLS-layer `test:security` (anon/default-deny) + no public sensitive read.

---

## Task AURA-104: Auth + `user_profiles` role checks + admin bootstrap script (D-40)

### Goal
Implement Supabase Auth session handling, the admin authorization guard (session + `user_profiles` row + role), and the first-`super_admin` seed/admin script. **No public self-signup.**

### Context
D-40 (no self-signup; first super_admin via Supabase Auth + seed script — merge blocker), D-30 (roles), `docs/RBAC.md`, `docs/ARCHITECTURE.md` auth model.

### Requirements
- `src/services/auth/**` session + role-guard helper used by admin routes/handlers.
- Authorization requires: valid session AND `user_profiles` row AND role in (`super_admin`,`client_admin`) AND route check AND RLS compliance.
- `scripts/seed-admin.ts` (server-only) to create the first `super_admin` against a manually-created Supabase Auth user. No signup UI.
- **Complete the application-layer authenticated negatives deferred from AURA-103:** session present but no `user_profiles` row → blocked; profile present but no qualifying role → 403; valid `super_admin`/`client_admin` → allowed.

### Constraints
Global constraints. **No public admin self-signup** (D-40 — merge blocker). Auth-only is never sufficient — role check mandatory. Touching auth requires explicit approval.

### Allowed Files / Areas
- `src/services/auth/**`, `src/domain/audit/**` (deny-event logging optional), `scripts/seed-admin.ts`.

### Forbidden Files / Areas
- Any signup/self-registration UI, client components importing service-role, `.env`.

### Files Likely Affected
- `src/services/auth/guard.ts`, `scripts/seed-admin.ts`.

### Acceptance Criteria
- [ ] No self-signup path exists · [ ] admin guard rejects no-session, no-profile, and no-role · [ ] seed script creates first super_admin server-side only.

### Test Plan
- Security negative (required): unauthenticated blocked from `/api/admin/*`; authenticated-without-profile blocked; authenticated-without-role blocked (403). Integration: guard allows valid super_admin/client_admin.

### Required Commands
- `npm run test:security` · `npm run test:integration` · `npm run typecheck` · `npm run deps:check`

### Migration / Rollback Note
Auth/seed change (no schema change if `user_profiles` exists from AURA-102). Rollback = revert guard + script; manually disable seeded user.

### Definition of Done
Standard checklist + no-self-signup verified + role-guard negative tests green, completing the authenticated session/profile/role negatives deferred from AURA-103.

### Out of Scope
Admin UI/login page (AURA-301), settings, property CRUD.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (auth + D-40 merge blocker).

### Merge Gates
Global gates + D-40 (no self-signup) + admin-route role-check negative tests.

---

## Task AURA-105: Storage bucket policies + media path strategy

### Goal
Configure the Supabase Storage bucket with UUID-based paths, public-read for published-property media, and upload validation contract (server-side).

### Context
D-41 (images + floorplan only), Q-04/A-15 (10MB), A-14 (jpeg/png/webp), `docs/ARCHITECTURE.md` storage tradeoff (public-read bucket, signed URLs deferred), media-path no-enumeration rule.

### Requirements
- Storage bucket + policies: public read for published property media; admin-only write; UUID paths, no enumeration.
- Media validation contract (type/size/path) defined in `domain`/`services` for later upload route.

### Constraints
Global constraints. Public read allowlisted to published media. No raw enumeration. Video/360 out of MVP (D-41).

### Allowed Files / Areas
- `supabase/migrations/**` (storage policies), `src/domain/properties/media.ts` (validation contract), `src/services/storage/**`.

### Forbidden Files / Areas
- Upload UI (AURA-304), `.env`, signed-URL implementation (deferred).

### Files Likely Affected
- Storage policy migration, `src/services/storage/policy.ts`, media validation.

### Acceptance Criteria
- [ ] Bucket policies applied · [ ] public read only for published media · [ ] admin-only write · [ ] validation rejects >10MB and non-allowed types.

### Test Plan
- Unit: media validation (size/type). DAL/Security: anon cannot read unpublished-property media; anon cannot write.

### Required Commands
- `npm run test:unit` · `npm run test:dal` · `npm run test:security`

### Migration / Rollback Note
**Migration task** (storage policies). Rollback = drop policies; documented in PR.

### Definition of Done
Standard checklist + storage access negative tests green.

### Out of Scope
Upload route/UI (Phase 3), signed URLs (deferred limitation, documented).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (storage access boundary).

### Merge Gates
Global gates + storage access negative tests.

---

## Task AURA-106: Rate-limit table + salted-hash key strategy (D-51)

### Goal
Implement the server-side rate-limit service using `salted-hash(IP + route)` keys with a 24h TTL `rate_limits` table; **raw IP never stored**.

### Context
D-39, D-51 (merge blocker), A-03 (thresholds: leads 5/hr/key, whatsapp 30/hr/key, login 5/15min/key), A-16 (24h TTL + scheduled cleanup), `.claude/rules/no-raw-ip-in-events.md`.

### Requirements
- `src/services/rate-limit/**` computing `createHmac('sha256', RATE_LIMIT_SALT).update(ip+':'+route)`; stores only hash + route + count + window.
- Config-tunable thresholds (A-03). Scheduled cleanup (pg_cron or equivalent) for 24h TTL (A-16).
- `RATE_LIMIT_SALT` is server-only env (already in AURA-005 schema).

### Constraints
Global constraints. **Raw IP never persisted** (D-18/D-51 — merge blocker). Salt is server-only secret.

### Allowed Files / Areas
- `src/services/rate-limit/**`, `supabase/migrations/**` (cleanup job if needed).

### Forbidden Files / Areas
- Storing raw IP anywhere; logging IP; client import of salt.

### Files Likely Affected
- `src/services/rate-limit/key.ts`, `limit.ts`, cleanup migration.

### Acceptance Criteria
- [ ] Key = salted hash, computed server-side · [ ] `rate_limits` has no IP column/value · [ ] thresholds enforced · [ ] TTL cleanup defined.

### Test Plan
- Unit: hash computation deterministic (without real secret); same IP+route → same key, different route → different key. Integration: Nth request over threshold → limited. Security: assert no raw IP stored/logged.

### Required Commands
- `npm run test:unit` · `npm run test:integration` · `npm run test:security`

### Migration / Rollback Note
**Migration task** (cleanup job/table tweaks). Rollback = drop cleanup job; documented.

### Definition of Done
Standard checklist + no-raw-IP verified.

### Out of Scope
Wiring into lead/whatsapp/login routes (Phases 3–4 consume this service).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (D-51 merge blocker).

### Merge Gates
Global gates + no-raw-IP-in-events + rate-limit unit/integration tests.

---

## Task AURA-107: DAL test harness + security negative test scaffold

### Goal
Finalize the DAL/security test harness against the local Supabase stack with seed fixtures, so Phase 2+ DAL/security tests run in CI.

### Context
A-02 (local stack, no mocking), `docs/TEST_STRATEGY.md` DAL/security layers, A-01 (CI uses Docker local stack).

### Requirements
- Test fixtures/seed for properties (draft/published/archived), areas (active/inactive), leads, stakeholders (internal/public), legal pages.
- Harness resets DB between suites; CI job runs DAL + security against Dockerized stack.

### Constraints
Global constraints. No DB mocking (A-02). Fixtures use fake, non-PII data (D-33).

### Allowed Files / Areas
- `src/tests/dal/**`, `src/tests/security/**`, `src/tests/fixtures/**`, CI test job config.

### Forbidden Files / Areas
- Product code, real PII in fixtures.

### Files Likely Affected
- Test harness utils, seed fixtures, `.github/workflows/ci.yml` (DAL/security jobs).

### Acceptance Criteria
- [ ] DAL + security suites run green in CI against local stack · [ ] DB reset between suites · [ ] fixtures are fake/non-PII.

### Test Plan
- DAL + Security: the harness itself plus the AURA-103/104 negative tests now run under CI.

### Required Commands
- `npm run test:dal` · `npm run test:security` · `npm run quality`

### Migration / Rollback Note
N/A (test infra). Rollback = revert harness.

### Definition of Done
Standard checklist + CI security/DAL jobs green. **Phase 1 exit gate.**

### Out of Scope
Public/admin features.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required (Opus signs off Phase 1 exit).

### Merge Gates
Global gates + DAL + security suites green in CI.

---

# Phase 2 — Public Website Vertical Slice

> Public `/en` site reading published data only. Lighthouse advisory CI job is **enabled** this phase (CF-4). Opus review required where public data exposure or legal HTML is involved.

---

## Task AURA-201: Public layout + header/footer + i18n shell

### Goal
Build the public `/[locale]` layout (header, footer, navigation) reading agency settings via a safe server selector.

### Context
D-06/D-07 (routing, RTL-ready), A-09 (settings allowlist via safe server selector), D-13/D-14 (contact routing), Q-13 (AUTEX footer disclosure when public).

### Requirements
- Header/footer/nav components; footer reads agency settings through a server-side safe selector (no direct client Supabase).
- AUTEX public disclosure in footer (Q-13). Reduced-motion respected baseline.

### Constraints
Global constraints. UI must not query Supabase directly. Settings read via server selector allowlist. No cinematic motion (Phase 5).

### Allowed Files / Areas
- `src/components/layout/**`, `src/app/[locale]/layout.tsx`, `src/dal/settings.dal.ts` (read), `src/domain/settings/**`.

### Forbidden Files / Areas
- Direct Supabase in components, admin code, GSAP.

### Files Likely Affected
- Layout, header, footer, settings DAL/selector.

### Acceptance Criteria
- [ ] Layout renders with settings-driven footer · [ ] no client Supabase query · [ ] AUTEX disclosure present.

### Test Plan
- DAL: settings safe read. E2E: layout renders, footer shows agency data. Accessibility: landmarks, nav. Visual: header/footer screenshot. Boundary: deps:check.

### Required Commands
- `npm run test:dal` · `npm run test:e2e` · `npm run deps:check` · `npm run build`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshot.

### Out of Scope
Cinematic hero, property data.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + boundary clean + accessibility landmarks.

---

## Task AURA-202: Properties listing — DAL + `GET /api/properties` + listing page

### Goal
Public property listing reading only published properties, with filters/search/sort/pagination, served via a validated API route and DAL — plus the published-featured selector and `GET /api/properties/featured` that populates the homepage featured section.

### Context
`docs/API_SPEC.md` `GET /api/properties` and `GET /api/properties/featured`, A-07 (pagination cap 50), D-36 (taxonomy), D-44 (UI states), D-48 (price visibility), A-11 (AED-only). The homepage shell exists from AURA-008; this task supplies its featured-property data (cinematic treatment is added later in AURA-502).

### Requirements
- `src/dal/properties.dal.ts` published-only reads; `GET /api/properties` with Zod-validated query (filters, page/limit, cap 50).
- `GET /api/properties/featured` returns published, featured properties only (validated, bounded count); a server-side featured selector populates the `/en` homepage featured section using existing `luxury-dark` tokens (no cinematic/GSAP here).
- Listing page with PropertyCard; all D-44 UI states (loading/empty/error/success).

### Constraints
Global constraints. Published-only public reads. API handler Zod-validated. Business rules in `domain`, not JSX. Pagination cap 50 (A-07).

### Allowed Files / Areas
- `src/dal/properties.dal.ts`, `src/domain/properties/**`, `src/app/api/properties/route.ts`, `src/app/api/properties/featured/route.ts`, `src/app/[locale]/properties/**`, `src/app/[locale]/page.tsx` (featured section only), `src/components/real-estate/PropertyCard.tsx`.

### Forbidden Files / Areas
- Draft/archived exposure, admin routes, direct Supabase in UI, cinematic/GSAP on the homepage.

### Files Likely Affected
- Properties DAL/domain/route/page/card, featured route, homepage featured section.

### Acceptance Criteria
- [ ] Only published properties returned · [ ] `GET /api/properties/featured` returns published-featured only, bounded count · [ ] homepage featured section renders · [ ] query validated, cap enforced · [ ] all UI states present · [ ] AED-only display.

### Test Plan
- Unit: query schema, price-visibility/AED formatting, featured selector. DAL: published-only, draft/archived hidden, featured published-only. Integration: API filters/pagination/cap + featured endpoint. E2E: listing filters/search/sort + homepage featured section. Security: anon cannot get draft/archived (incl. via featured). Visual: listing states + homepage featured.

### Required Commands
- `npm run test:unit` · `npm run test:dal` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshots of listing states.

### Out of Scope
Property detail, areas, admin CRUD, cinematic homepage treatment (AURA-502).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (public data-exposure boundary, incl. featured).

### Merge Gates
Global gates + published-only security tests (listing + featured) + Zod-validated handlers.

---

## Task AURA-203: Property detail — `GET /api/properties/[slug]` + stakeholder visibility

### Goal
Public property detail page reading a single published property, **excluding internal-only stakeholders**, with correct contact routing.

### Context
`docs/API_SPEC.md` `GET /api/properties/[slug]`, D-15/D-16 (stakeholders internal-only by default), D-13/D-14 (contact routing override→agency, never stakeholder), A-06 (slug immutable after publish), D-36 (off-plan block when `market_type=off_plan`), D-48/D-48.

### Requirements
- Detail route + page; response excludes `visibility=internal_only` stakeholders.
- Contact routing: property override → agency settings → never stakeholder auto-routing.
- Off-plan block visible only when `market_type=off_plan`. Price-on-application rendering (D-48).

### Constraints
Global constraints. Internal stakeholders never public (D-16 — sensitive read). Contact never auto-routes to stakeholder (D-14). Published-only.

### Allowed Files / Areas
- `src/app/api/properties/[slug]/route.ts`, `src/app/[locale]/properties/[slug]/**`, `src/domain/properties/**`, `src/dal/properties.dal.ts`, `src/components/real-estate/**`.

### Forbidden Files / Areas
- Stakeholder PII in public payload, admin code, draft exposure.

### Files Likely Affected
- Detail route/page, contact-routing domain, stakeholder filter.

### Acceptance Criteria
- [ ] Internal-only stakeholders absent from response · [ ] draft slug → 404 · [ ] contact routing correct · [ ] off-plan block conditional · [ ] price-on-application correct.

### Test Plan
- Unit: contact-routing priority, off-plan visibility. DAL: published-only detail. Security (required): internal_only stakeholders excluded; draft/archived → 404. E2E: detail loads with correct data. Visual: detail page.

### Required Commands
- `npm run test:unit` · `npm run test:dal` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshot + stakeholder-exclusion test green.

### Out of Scope
Admin property edit, media upload.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (stakeholder visibility + contact routing).

### Merge Gates
Global gates + internal-stakeholder-exclusion security test + draft 404.

---

## Task AURA-204: Areas overview — DAL + `GET /api/areas`

### Goal
Public areas overview reading only active areas.

### Context
`docs/API_SPEC.md` `GET /api/areas`, D-22 (areas MVP add/edit/deactivate), no-public-sensitive-reads rule (inactive hidden).

### Requirements
- `src/dal/areas.dal.ts` active-only reads; `GET /api/areas` validated; areas overview page with D-44 states.

### Constraints
Global constraints. Inactive areas hidden from public. UI not querying Supabase. Handler Zod-validated.

### Allowed Files / Areas
- `src/dal/areas.dal.ts`, `src/domain/areas/**`, `src/app/api/areas/route.ts`, `src/app/[locale]/areas/**`.

### Forbidden Files / Areas
- Admin code, inactive-area exposure.

### Files Likely Affected
- Areas DAL/domain/route/page.

### Acceptance Criteria
- [ ] Only active areas public · [ ] validated handler · [ ] UI states present.

### Test Plan
- DAL: active-only. Integration: API. Security: anon cannot read inactive areas. E2E: areas page. Visual: areas overview.

### Required Commands
- `npm run test:dal` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshot.

### Out of Scope
Areas admin (AURA-305).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (public read boundary — consistent with AURA-202/205).

### Merge Gates
Global gates + inactive-area hidden test.

---

## Task AURA-205: Legal page read — `GET /api/legal/[slug]` + safe Markdown render (D-12)

### Goal
Publicly render published legal pages from Markdown/sanitized content — **never raw HTML**.

### Context
D-10 (legal in MVP, versioning/statuses), D-12 (no raw HTML — merge blocker), `.claude/rules/no-unsafe-legal-html.md`.

### Requirements
- `GET /api/legal/[slug]` returns published legal page only.
- Render via Markdown + strict sanitizer allowlist; no `dangerouslySetInnerHTML` with unsanitized input.

### Constraints
Global constraints. **No raw/unsafe legal HTML** (D-12 — merge blocker). Published-only public read.

### Allowed Files / Areas
- `src/dal/legal.dal.ts`, `src/domain/legal/**`, `src/app/api/legal/[slug]/route.ts`, `src/app/[locale]/{privacy,terms}/**`, `src/components/**` (safe renderer).

### Forbidden Files / Areas
- Raw HTML rendering, draft legal exposure, admin legal editing (AURA-307).

### Files Likely Affected
- Legal DAL/domain/route/pages, sanitized renderer.

### Acceptance Criteria
- [ ] Only published legal pages public · [ ] content sanitized · [ ] no unsafe HTML path · [ ] `/en/privacy` and `/en/terms` load.

### Test Plan
- Unit: sanitizer allowlist (script/iframe stripped). DAL: published-only. Security (required): unsafe HTML neutralized; draft legal not public. E2E: privacy/terms load. Visual: legal page.

### Required Commands
- `npm run test:unit` · `npm run test:dal` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + no-unsafe-HTML test green.

### Out of Scope
Admin legal draft/publish (AURA-307).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (D-12 merge blocker).

### Merge Gates
Global gates + no-unsafe-legal-HTML + draft-legal-not-public.

---

## Task AURA-206: SEO basics + AUTEX noindex (D-42) + enable Lighthouse advisory CI

### Goal
Add SEO metadata, sitemap/robots with AUTEX noindex default, and enable the Lighthouse advisory CI job now that public pages exist (CF-4).

### Context
D-42 (AUTEX noindex by default; real-client indexing requires config+approval), CF-4 (Lighthouse advisory from Phase 2), D-27 (performance targets — tuned in Phase 5).

### Requirements
- Per-route metadata, `robots`/`sitemap`; AUTEX `noindex` default driven by config (D-19/D-42).
- Enable Lighthouse CI job as **advisory** (non-blocking) per `docs/CI_CD_STRATEGY.md`.

### Constraints
Global constraints. Noindex default for AUTEX (D-42). Real-client indexing only via config. Lighthouse advisory only (not a PR blocker until release).

### Allowed Files / Areas
- `src/lib/seo/**`, `src/app/[locale]/**` metadata, `robots`/`sitemap` routes, `.github/workflows/**` (enable Lighthouse job), `src/config/feature-flags.ts`.

### Forbidden Files / Areas
- Making Lighthouse a PR blocker, indexing AUTEX by default, production deploy config.

### Files Likely Affected
- SEO lib, metadata, robots/sitemap, CI workflow.

### Acceptance Criteria
- [ ] AUTEX `noindex` by default · [ ] metadata present on public routes · [ ] Lighthouse advisory job runs, does not block.

### Test Plan
- Unit: SEO/metadata helpers. E2E: noindex header/meta present on AUTEX. Integration: robots/sitemap output. (Lighthouse advisory output reviewed, non-gating.)

### Required Commands
- `npm run test:unit` · `npm run test:e2e` · `npm run build`

### Migration / Rollback Note
N/A (config + CI). Rollback = revert; disable Lighthouse job.

### Definition of Done
Standard checklist + Lighthouse advisory visible in CI.

### Out of Scope
Performance tuning/cinematic (Phase 5), real-client indexing, About page (AURA-207).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + AUTEX-noindex test + Lighthouse advisory (non-blocking).

---

## Task AURA-207: About page (`/en/about`) + Phase 2 public-page completion

### Goal
Add the public About page at `/en/about`, reusing the layout and SEO/noindex helper, completing the Phase 2 public surface.

### Context
`docs/ARCHITECTURE.md` lists the public `about/` route (in MVP scope); D-06/D-07 (routing, RTL-ready), D-42 (AUTEX noindex), Q-13 (AUTEX public disclosure). Reuses the layout from AURA-201 and the SEO metadata helper from AURA-206. About content is static/operational (agency/trust copy + settings-driven contact); it is not admin-editable beyond existing settings in MVP.

### Requirements
- `/en/about` renders agency/trust content using the AURA-201 layout; AUTEX disclosure consistent (Q-13).
- SEO metadata + AUTEX `noindex` default applied via the AURA-206 helper.
- Any data-driven content (e.g. settings-sourced contact/trust fields) defines all relevant D-44 states; otherwise static.

### Constraints
Global constraints. No new data table/DAL beyond the existing settings read. AUTEX noindex (D-42). UI must not query Supabase directly. No cinematic/GSAP (Phase 5).

### Allowed Files / Areas
- `src/app/[locale]/about/**`, `src/lib/seo/**` (consume), `src/components/layout/**` (reuse only), `src/components/marketing/**` (static About sections only).

### Forbidden Files / Areas
- New data tables/migrations/DAL, admin code, direct Supabase in components, GSAP/cinematic.

### Files Likely Affected
- About page, SEO metadata wiring.

### Acceptance Criteria
- [ ] `/en/about` renders · [ ] AUTEX `noindex` applied · [ ] AUTEX disclosure consistent with footer · [ ] metadata present · [ ] relevant D-44 states handled.

### Test Plan
- E2E: `/en/about` loads; noindex meta/header present. Accessibility: landmarks/heading order. Visual: about page. Unit: SEO helper reuse (if any). Security: N/A (no new data boundary).

### Required Commands
- `npm run test:e2e` · `npm run build` · `npm run deps:check`

### Migration / Rollback Note
N/A (no DB/storage/env). Rollback = revert the About route.

### Definition of Done
Standard checklist + screenshot. **Phase 2 exit gate** — all public pages present (listing, featured, detail, areas, legal, about), published-only reads enforced, SEO/noindex live, Lighthouse advisory enabled.

### Out of Scope
Admin-editable About content beyond settings, cinematic treatment (Phase 5).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required (static public content; no new data boundary).

### Merge Gates
Global gates + AUTEX-noindex on `/en/about` + boundary clean.

---

# Phase 3 — Admin Vertical Slice

> Authenticated admin behind session+role guard. Every admin route requires the AURA-104 guard. Audit logging required for sensitive state changes (D-38). Opus review required for CRUD/publish/media/legal/settings boundaries.

---

## Task AURA-301: Admin login + session + role guard wiring

### Goal
Admin login page and session handling, gating all `/admin/**` behind the session+`user_profiles`+role guard.

### Context
D-40 (no self-signup), D-30 (roles), `docs/RBAC.md`, AURA-104 guard.

### Requirements
- `/admin/login` (login only — **no signup**); admin layout enforcing guard; redirect unauthenticated/unauthorized.
- Login rate-limited (A-03: 5/15min/key) via AURA-106 service.

### Constraints
Global constraints. No self-signup (D-40). Auth + role required (auth-only insufficient). Touching auth requires approval.

### Allowed Files / Areas
- `src/app/admin/login/**`, `src/app/admin/layout.tsx`, `src/services/auth/**`, `src/components/admin/**`.

### Forbidden Files / Areas
- Signup UI, public exposure of admin, service-role in client.

### Files Likely Affected
- Admin login page/layout, guard wiring.

### Acceptance Criteria
- [ ] Login works for seeded admin · [ ] no signup path · [ ] unauthenticated/unauthorized redirected · [ ] login rate-limited.

### Test Plan
- Security (required): unauthenticated/no-role blocked from `/admin/**`. Integration: login + rate-limit. E2E: admin login flow; role-check cannot be bypassed. Visual: login page.

### Required Commands
- `npm run test:security` · `npm run test:integration` · `npm run test:e2e`

### Migration / Rollback Note
N/A (consumes existing auth). Rollback = revert login UI/guard wiring.

### Definition of Done
Standard checklist + admin-guard E2E + no-signup verified.

### Out of Scope
Dashboard content, CRUD.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (auth surface).

### Merge Gates
Global gates + admin-guard negative tests + no-signup.

---

## Task AURA-302: Admin dashboard shell

### Goal
Authenticated dashboard shell (navigation to properties/leads/areas/settings/legal) with no metrics yet.

### Context
`docs/RBAC.md` admin scope, D-44 (UI states).

### Requirements
- Dashboard layout + nav behind guard; placeholder panels; D-44 states.

### Constraints
Global constraints. Behind role guard. No direct Supabase in components.

### Allowed Files / Areas
- `src/app/admin/dashboard/**`, `src/components/admin/**`.

### Forbidden Files / Areas
- Public exposure, metrics aggregation (AURA-406), service-role in client.

### Files Likely Affected
- Dashboard shell/components.

### Acceptance Criteria
- [ ] Dashboard renders for admin only · [ ] nav links present · [ ] states handled.

### Test Plan
- Security: non-admin cannot reach dashboard. E2E: dashboard renders post-login. Visual: dashboard shell.

### Required Commands
- `npm run test:security` · `npm run test:e2e` · `npm run build`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshot.

### Out of Scope
Metrics, CRUD.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + admin-only access test.

---

## Task AURA-303: Property CRUD admin + publish checklist

### Goal
Admin property create/edit/duplicate/archive with publish validation (cover image, alt text, required fields) and audit logging.

### Context
`docs/API_SPEC.md` admin property endpoints, D-32 (draft/published/archived; no real delete), D-36 (taxonomy), D-44 (states), D-38 (audit publish/archive), A-06 (slug immutable after publish), A-05/D-47 (reference number), D-09 (bedrooms nullable by type).

### Requirements
- `POST/PATCH /api/admin/properties`, `[id]/duplicate`, `[id]/archive` — all Zod-validated, role-guarded.
- Publish checklist enforced (cover image + alt text + required fields; off-plan rules; price visibility).
- Audit log on publish/archive (D-38). Slug immutable after publish (A-06). No hard delete.

### Constraints
Global constraints. Use `publish_status` lifecycle (D-32); no real delete in UI. Audit required (D-38). Handlers Zod-validated. Business rules in `domain`.

### Allowed Files / Areas
- `src/app/api/admin/properties/**`, `src/app/admin/properties/**`, `src/domain/properties/**`, `src/dal/properties.dal.ts`, `src/dal/audit-logs.dal.ts`, `src/components/admin/**`.

### Forbidden Files / Areas
- Hard-delete endpoints, public exposure of drafts, slug edit after publish.

### Files Likely Affected
- Admin property routes/pages, publish validation, audit DAL.

### Acceptance Criteria
- [ ] CRUD works for admin only · [ ] publish checklist enforced · [ ] audit log written on publish/archive · [ ] slug immutable post-publish · [ ] reference number auto/unique.

### Test Plan
- Unit: publish validation, reference-number generation, slug rules, bedrooms-by-type. DAL: admin reads all statuses. Integration: publish → appears public; archive → hidden. Security: non-admin blocked. E2E: property CRUD + publish + archive. Visual: editor + states.

### Required Commands
- `npm run test:unit` · `npm run test:dal` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A (schema exists). If audit-log columns adjusted → migration + rollback documented.

### Definition of Done
Standard checklist + screenshots + audit-on-publish test green.

### Out of Scope
Media upload (AURA-304), lead/whatsapp.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (publish/visibility + audit boundary).

### Merge Gates
Global gates + admin-only + audit-log + publish-checklist tests.

---

## Task AURA-304: Media upload — validation, UUID paths

### Goal
Admin media upload for images + floorplan images with type/size validation, UUID paths, and cover-image/alt-text enforcement.

### Context
D-41 (images/floorplan only), Q-04/A-15 (10MB), A-14 (jpeg/png/webp), AURA-105 storage policies, media no-enumeration.

### Requirements
- `POST /api/admin/properties/[id]/media`, `DELETE .../media/[mediaId]` — validated, role-guarded.
- Reject >10MB and non-allowed types; UUID-based storage paths; cover-image + alt-text required before publish.

### Constraints
Global constraints. Images/floorplan only (D-41). UUID paths, no enumeration. Admin-only write.

### Allowed Files / Areas
- `src/app/api/admin/properties/[id]/media/**`, `src/services/storage/**`, `src/domain/properties/media.ts`, `src/components/admin/**`, `src/dal/properties.dal.ts`.

### Forbidden Files / Areas
- Video/360 upload, public write, path enumeration.

### Files Likely Affected
- Media routes, storage service, media validation, admin uploader.

### Acceptance Criteria
- [ ] >10MB rejected · [ ] unsupported type rejected · [ ] UUID paths · [ ] cover/alt enforced before publish · [ ] admin-only.

### Test Plan
- Unit: media validation. Integration: upload → storage → gallery. Security: oversized/unsupported rejected; public cannot upload. E2E: upload flow. Visual: gallery.

### Required Commands
- `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A (storage policies from AURA-105). Rollback = revert routes/service.

### Definition of Done
Standard checklist + media negative tests green.

### Out of Scope
Signed URLs (deferred), video.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (upload/storage boundary).

### Merge Gates
Global gates + media validation/security tests.

---

## Task AURA-305: Areas admin (add/edit/deactivate)

### Goal
Admin area management — add/edit/deactivate only (MVP scope).

### Context
D-22 (areas MVP add/edit/deactivate), `docs/API_SPEC.md` admin areas endpoints, D-38 (audit where practical).

### Requirements
- `GET/POST/PATCH /api/admin/areas` validated + role-guarded; deactivate hides from public; D-44 states.

### Constraints
Global constraints. Add/edit/deactivate only — no delete. Admin-only.

### Allowed Files / Areas
- `src/app/api/admin/areas/**`, `src/app/admin/areas/**`, `src/domain/areas/**`, `src/dal/areas.dal.ts`.

### Forbidden Files / Areas
- Public exposure, area hard delete.

### Files Likely Affected
- Admin areas routes/pages.

### Acceptance Criteria
- [ ] Add/edit/deactivate work for admin · [ ] deactivated areas hidden public · [ ] validated handlers.

### Test Plan
- Integration: area CRUD + deactivate. DAL/Security: deactivated hidden from public; non-admin blocked. E2E: areas admin. Visual: areas admin.

### Required Commands
- `npm run test:integration` · `npm run test:dal` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshots.

### Out of Scope
Public areas page (AURA-204).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + admin-only + deactivation-hides-public.

---

## Task AURA-306: Settings admin (allowlist + per-key Zod + audit)

### Goal
Admin settings editing via key-value allowlist with per-key Zod schema; immediate validated update + audit log.

### Context
A-09 (settings shape: key-value + server allowlist + per-key Zod), D-20/D-21 (admin edits operational content, not template architecture), D-46 (immediate validated + audit), Q-14 (logo URL), Q-15.

### Requirements
- `GET/PATCH /api/admin/settings` validated + role-guarded; server-side allowlist; per-key Zod; audit on update (D-38/D-46).
- Admin **cannot** mutate template/design architecture (D-21).

### Constraints
Global constraints. Allowlist enforced server-side; unknown keys rejected. Admin cannot change design architecture (D-21). Audit required.

### Allowed Files / Areas
- `src/app/api/admin/settings/**`, `src/app/admin/settings/**`, `src/domain/settings/**`, `src/dal/settings.dal.ts`, `src/dal/audit-logs.dal.ts`.

### Forbidden Files / Areas
- Template/design-architecture mutation, non-allowlisted keys.

### Files Likely Affected
- Settings routes/pages, allowlist + per-key schemas, audit.

### Acceptance Criteria
- [ ] Only allowlisted keys writable · [ ] per-key Zod validation · [ ] audit on update · [ ] public footer/contact reflects update · [ ] design architecture not mutable.

### Test Plan
- Unit: per-key schemas, allowlist rejection. Integration: settings update → public reflects. Security: non-admin blocked; non-allowlisted key rejected; audit written. E2E: settings update verifies footer. Visual: settings.

### Required Commands
- `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A (settings table exists). Rollback = revert routes/schemas.

### Definition of Done
Standard checklist + allowlist + audit tests green.

### Out of Scope
Legal pages (AURA-307), design-token changes.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (settings governance + audit).

### Merge Gates
Global gates + allowlist-enforced + audit-on-settings-update.

---

## Task AURA-307: Legal pages admin — draft→publish, versioning, audit (D-10/D-12)

### Goal
Admin legal page authoring with draft→publish lifecycle, version increment, and audit — content stored/rendered safely (no raw HTML).

### Context
D-10 (versioning/statuses), D-12 (no raw HTML — merge blocker), D-38 (audit on legal publish), D-46 (legal uses draft→publish), `.claude/rules/no-unsafe-legal-html.md`.

### Requirements
- `GET/POST/PATCH /api/admin/legal`, `[id]/publish`, `[id]/archive` — validated, role-guarded.
- Content sanitized/Markdown only (D-12). Publish increments version, archives prior; audit on publish (`legal_published`).

### Constraints
Global constraints. **No raw/unsafe HTML** (D-12 — merge blocker). Draft→publish (D-46). Audit on publish (D-38).

### Allowed Files / Areas
- `src/app/api/admin/legal/**`, `src/app/admin/legal/**`, `src/domain/legal/**`, `src/dal/legal.dal.ts`, `src/dal/audit-logs.dal.ts`.

### Forbidden Files / Areas
- Raw HTML acceptance/storage, public exposure of drafts.

### Files Likely Affected
- Admin legal routes/pages, sanitizer, versioning, audit.

### Acceptance Criteria
- [ ] Unsafe HTML rejected at API · [ ] draft→publish increments version + archives old · [ ] audit on publish · [ ] admin-only.

### Test Plan
- Unit: sanitizer/version logic. Integration: publish → version increments → old archived. Security (required): unsafe HTML rejected; draft not public; non-admin blocked. E2E: create draft → publish → verify version. Visual: legal editor.

### Required Commands
- `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A (schema exists). If versioning columns adjusted → migration + rollback documented.

### Definition of Done
Standard checklist + no-unsafe-HTML + audit-on-publish tests green. **Phase 3 exit gate.**

### Out of Scope
Public legal render (AURA-205).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (D-12 merge blocker + audit).

### Merge Gates
Global gates + no-unsafe-legal-HTML + legal-publish-audit.

---

# Phase 4 — Lead and WhatsApp Conversion

> Public lead capture (rate-limited, validated, no PII leaks), email notification, lead admin/export with audit, and PII-free WhatsApp tracking. Opus review required on lead/whatsapp data boundaries.

---

## Task AURA-401: Inquiry + contact forms + `POST /api/leads` (validated, rate-limited)

### Goal
Public inquiry form (property) and contact-page form submitting to a validated, rate-limited lead API; links to active Privacy Policy.

### Context
`docs/API_SPEC.md` `POST /api/leads` (5/hr/key), D-37 (lead enums), D-11 (forms link active Privacy Policy; no acceptance tracking), A-03 (rate-limit), A-04 (`preferred_contact_method`), libphonenumber validation, D-44 (states).

### Requirements
- Lead Zod schema (name/phone validated via libphonenumber, `preferred_contact_method`, source enum); `POST /api/leads` validated + rate-limited (AURA-106).
- Inquiry form on property detail + contact-page form; link to active Privacy Policy (D-11). All D-44 states.

### Constraints
Global constraints. Public insert allowlisted, rate-limited, validated. No raw IP stored (D-51). Lead enums only (D-37). Handler Zod-validated.

### Allowed Files / Areas
- `src/app/api/leads/route.ts`, `src/domain/leads/**`, `src/dal/leads.dal.ts`, `src/components/real-estate/InquiryForm.tsx`, `src/app/[locale]/contact/**`, `src/services/rate-limit/**` (consume).

### Forbidden Files / Areas
- Admin lead read here, raw IP storage, unvalidated insert.

### Files Likely Affected
- Lead route/domain/DAL, inquiry/contact forms.

### Acceptance Criteria
- [ ] Invalid phone rejected · [ ] rate limit enforced (5/hr/key) · [ ] no raw IP stored · [ ] form links active Privacy Policy · [ ] states handled.

### Test Plan
- Unit: lead schema, phone validation. Integration: insert + rate-limit trigger. Security (required): invalid phone rejected; no raw IP persisted; public cannot read leads back. E2E: inquiry + contact submit. Visual: form states.

### Required Commands
- `npm run test:unit` · `npm run test:integration` · `npm run test:e2e` · `npm run test:security`

### Migration / Rollback Note
N/A (leads table exists). Rollback = revert route/forms.

### Definition of Done
Standard checklist + rate-limit + no-raw-IP tests green.

### Out of Scope
Email (AURA-402), lead admin (AURA-403).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (public insert + rate-limit + PII boundary).

### Merge Gates
Global gates + lead validation + rate-limit + no-raw-IP tests.

---

## Task AURA-402: Lead email notification (Resend)

### Goal
Send a lead notification email via Resend on submission; email failure must **not** fail the lead insert.

### Context
A-13 (Resend), Q-06 (`ADMIN_NOTIFICATION_EMAIL`, single then comma-list later), Q-07 (verified sender), §21 (log notification failures, no PII in public logs), server-only keys.

### Requirements
- `src/services/email/**` sends to `ADMIN_NOTIFICATION_EMAIL`; lead insert succeeds even if email fails (failure logged server-side, no PII in public logs).
- `RESEND_API_KEY`/`RESEND_FROM_EMAIL` server-only.

### Constraints
Global constraints. Email failure non-fatal to lead. Server-only secrets. No lead PII in public logs (§21).

### Allowed Files / Areas
- `src/services/email/**`, `src/app/api/leads/route.ts` (dispatch), `src/lib/config/env.ts` (consume).

### Forbidden Files / Areas
- Client import of `RESEND_API_KEY`, PII in public logs.

### Files Likely Affected
- Email service, lead route dispatch.

### Acceptance Criteria
- [ ] Email sent on lead · [ ] email failure does not fail lead · [ ] keys server-only · [ ] failure logged without PII.

### Test Plan
- Integration: lead insert + email dispatch; simulated email failure still returns lead success. Security: Resend key not in client bundle. Unit: email payload builder (no PII over-logging).

### Required Commands
- `npm run test:integration` · `npm run test:security` · `npm run deps:check`

### Migration / Rollback Note
N/A. Rollback = revert email dispatch.

### Definition of Done
Standard checklist + failure-non-fatal test green.

### Out of Scope
Lead admin/export.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (secret boundary).

### Merge Gates
Global gates + email-failure-non-fatal + Resend-key-not-in-client.

---

## Task AURA-403: Lead admin (view, status, archive)

### Goal
Admin lead management: list/filter, update status, soft-archive — admin-only with archived hidden by default.

### Context
`docs/API_SPEC.md` admin leads endpoints, D-31 (soft delete/archive; no hard delete in UI), D-37 (lead enums), D-44 (states).

### Requirements
- `GET /api/admin/leads`, `PATCH /api/admin/leads/[id]`, `[id]/archive` — validated, role-guarded.
- Archived leads hidden by default unless explicitly requested. Status uses enum (D-37).

### Constraints
Global constraints. Admin-only (no public read). Soft archive only (D-31). Lead enums (D-37).

### Allowed Files / Areas
- `src/app/api/admin/leads/**`, `src/app/admin/leads/**`, `src/domain/leads/**`, `src/dal/leads.dal.ts`.

### Forbidden Files / Areas
- Public lead read, hard delete.

### Files Likely Affected
- Admin lead routes/pages.

### Acceptance Criteria
- [ ] Admin-only access · [ ] status update + archive work · [ ] archived hidden by default · [ ] public cannot read leads.

### Test Plan
- Security (required): unauthenticated 401, no-role 403, public cannot read leads. Integration: status/archive. DAL: archived hidden by default. E2E: lead management. Visual: lead list/states.

### Required Commands
- `npm run test:security` · `npm run test:integration` · `npm run test:dal` · `npm run test:e2e`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + lead-access negative tests green.

### Out of Scope
Export (AURA-404).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (lead data boundary).

### Merge Gates
Global gates + public-cannot-read-leads + admin role tests.

---

## Task AURA-404: Lead export CSV + audit (A-08)

### Goal
Filter-respecting CSV lead export, audit-logged, with no persisted public URL.

### Context
A-08 (CSV, filter-respecting, audit `lead_exported`, no persisted public URL), D-38 (audit), D-31.

### Requirements
- `GET /api/admin/leads/export` role-guarded; respects active filters; writes `lead_exported` audit entry; streams CSV (no public URL persisted).

### Constraints
Global constraints. Admin-only. Audit required (D-38). No persisted public download URL.

### Allowed Files / Areas
- `src/app/api/admin/leads/export/**`, `src/domain/leads/**`, `src/dal/leads.dal.ts`, `src/dal/audit-logs.dal.ts`.

### Forbidden Files / Areas
- Public export, persisted public URL.

### Files Likely Affected
- Export route, audit DAL.

### Acceptance Criteria
- [ ] Export admin-only · [ ] respects filters · [ ] writes `lead_exported` audit · [ ] no persisted public URL.

### Test Plan
- Integration: export respects filters; audit entry created. Security (required): public cannot export; export creates audit log. E2E: export action.

### Required Commands
- `npm run test:integration` · `npm run test:security` · `npm run test:e2e`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + export-audit test green.

### Out of Scope
Dashboard metrics.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (data export + audit).

### Merge Gates
Global gates + lead-export-audit + public-cannot-export.

---

## Task AURA-405: WhatsApp click tracking + `POST /api/whatsapp-clicks` (no PII)

### Goal
PII-free WhatsApp click tracking with the correct CTA routing priority; analytics not publicly readable.

### Context
D-17 (tracking in MVP), D-18 (no IP/phone/email/PII — merge blocker), `docs/API_SPEC.md` `POST /api/whatsapp-clicks` (30/hr/key), routing priority `property.agent_whatsapp → property.agent_phone → settings.whatsapp → settings.phone`, `.claude/rules/no-raw-ip-in-events.md`.

### Requirements
- WhatsApp CTA component + URL builder (routing priority); `POST /api/whatsapp-clicks` validated, rate-limited (30/hr/key), **rejects PII fields**.
- `whatsapp_clicks` stores no IP/PII. Analytics admin-only.

### Constraints
Global constraints. **No IP/PII in `whatsapp_clicks`** (D-18 — merge blocker). Rate-limited. Analytics not public.

### Allowed Files / Areas
- `src/app/api/whatsapp-clicks/route.ts`, `src/domain/whatsapp/**`, `src/dal/whatsapp.dal.ts`, `src/components/real-estate/WhatsAppCTA.tsx`, `src/services/rate-limit/**` (consume).

### Forbidden Files / Areas
- PII/IP in payload or storage, public analytics read.

### Files Likely Affected
- WhatsApp route/domain/DAL/CTA.

### Acceptance Criteria
- [ ] PII fields (phone/email/IP) rejected · [ ] no IP stored · [ ] routing priority correct · [ ] rate-limited · [ ] analytics admin-only.

### Test Plan
- Unit: URL builder routing priority. Integration: click insert + rate-limit. Security (required): PII fields rejected; no raw IP stored; public cannot read analytics. E2E: CTA fires event + opens correct URL.

### Required Commands
- `npm run test:unit` · `npm run test:integration` · `npm run test:security` · `npm run test:e2e`

### Migration / Rollback Note
N/A (table exists). Rollback = revert route/CTA.

### Definition of Done
Standard checklist + PII-rejection + no-raw-IP tests green.

### Out of Scope
Dashboard metric display (AURA-406).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (D-18 merge blocker).

### Merge Gates
Global gates + whatsapp-PII-rejection + no-raw-IP + analytics-not-public.

---

## Task AURA-406: Dashboard metrics

### Goal
Admin dashboard metrics (lead counts by status, WhatsApp click totals, property counts) — aggregated server-side, admin-only.

### Context
`docs/API_SPEC.md` `GET /api/admin/dashboard`, D-18 (aggregate WhatsApp without PII), D-44.

### Requirements
- `GET /api/admin/dashboard` role-guarded aggregates; dashboard renders metrics; no PII surfaced from WhatsApp aggregates.

### Constraints
Global constraints. Admin-only. WhatsApp metrics are PII-free aggregates. Server-side aggregation.

### Allowed Files / Areas
- `src/app/api/admin/dashboard/**`, `src/app/admin/dashboard/**`, `src/domain/**` (aggregation), relevant DALs (read).

### Forbidden Files / Areas
- Public metrics, PII in aggregates.

### Files Likely Affected
- Dashboard route/page, aggregation domain.

### Acceptance Criteria
- [ ] Metrics admin-only · [ ] aggregates correct · [ ] no PII in WhatsApp metrics.

### Test Plan
- Integration: aggregate correctness. Security: non-admin blocked; no PII surfaced. E2E: dashboard metrics. Visual: dashboard.

### Required Commands
- `npm run test:integration` · `npm run test:security` · `npm run test:e2e`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + screenshots. **Phase 4 exit gate.**

### Out of Scope
Cinematic/sales-demo.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (aggregates lead/WhatsApp metrics — PII-adjacent analytics boundary).

### Merge Gates
Global gates + admin-only metrics test.

---

# Phase 5 — Sales Demo and Polish

> Cinematic/luxury polish on top of a proven foundation. Lighthouse is **tuned** here, not introduced (CF-4). GSAP only on homepage/storytelling; reduced motion mandatory.

---

## Task AURA-501: Sales Demo Mode labels (D-19)

### Goal
Sales Demo labels visible only when config enables AND `?demo=sales` present.

### Context
D-19 (config + `?demo=sales`; off by default for real clients), D-33 (fake data), test cases in `docs/TEST_STRATEGY.md`.

### Requirements
- Demo-label components gated by both `feature-flags.salesDemoMode` and `?demo=sales`. Off by default.

### Constraints
Global constraints. Both conditions required. Off by default for real clients.

### Allowed Files / Areas
- `src/components/marketing/SalesDemoLabels.tsx`, `src/config/feature-flags.ts`, relevant pages.

### Forbidden Files / Areas
- Labels on by default, real-client leakage.

### Files Likely Affected
- Demo-label component, feature flags.

### Acceptance Criteria
- [ ] Labels appear only with config + `?demo=sales` · [ ] hidden otherwise.

### Test Plan
- Unit: demo-mode detection. E2E: labels visible only with both enablers. Visual: demo on/off.

### Required Commands
- `npm run test:unit` · `npm run test:e2e`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + demo-gating test green.

### Out of Scope
Cinematic hero.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + demo-mode-gating test.

---

## Task AURA-502: Cinematic homepage (GSAP) + reduced motion

### Goal
Premium cinematic homepage hero/storytelling with GSAP, honoring `prefers-reduced-motion`.

### Context
D-26 (heavy motion homepage only; reduced motion required), D-25 (luxury-dark), §15.4 motion rules, GSAP homepage-only (architecture tradeoff).

### Requirements
- CinematicHero/AreaExplorer with GSAP loaded only on homepage; full reduced-motion fallback; no layout shift (CLS target).

### Constraints
Global constraints. GSAP homepage/storytelling only. Reduced motion mandatory (D-26). No business logic in JSX.

### Allowed Files / Areas
- `src/components/marketing/**`, `src/app/[locale]/page.tsx`, `src/styles/**`.

### Forbidden Files / Areas
- GSAP on non-homepage routes, motion without reduced-motion fallback.

### Files Likely Affected
- Cinematic components, homepage.

### Acceptance Criteria
- [ ] Cinematic hero renders · [ ] reduced-motion fully honored · [ ] GSAP not loaded off-homepage · [ ] no CLS regression.

### Test Plan
- E2E: homepage renders; reduced-motion path. Accessibility: reduced-motion + focus order. Visual: hero. (Lighthouse advisory observed.)

### Required Commands
- `npm run test:e2e` · `npm run build`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + reduced-motion test + hero screenshot.

### Out of Scope
Performance score tuning (AURA-505).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required (motion-perf advisory).

### Merge Gates
Global gates + reduced-motion test + GSAP-homepage-only boundary.

---

## Task AURA-503: luxury-dark refinement + mobile sticky CTAs

### Goal
Refine luxury-dark visual system and add mobile sticky CTAs (call/WhatsApp/inquiry).

### Context
D-25 (luxury-dark), §15.6 interaction standard, mobile CTA conversion, D-44.

### Requirements
- Visual refinement across public pages; mobile sticky CTA bar wired to WhatsApp routing (AURA-405) and inquiry.

### Constraints
Global constraints. Tokens drive styling (no admin-mutable architecture). CTA uses existing routing priority.

### Allowed Files / Areas
- `src/components/**`, `src/styles/**`, public pages.

### Forbidden Files / Areas
- New data layers, admin code.

### Files Likely Affected
- Layout/CTA components, styles.

### Acceptance Criteria
- [ ] Mobile sticky CTAs present and functional · [ ] luxury-dark consistent.

### Test Plan
- E2E: mobile CTA actions. Accessibility: touch targets/contrast. Visual: mobile screenshots.

### Required Commands
- `npm run test:e2e` · `npm run build`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + mobile screenshots.

### Out of Scope
Perf tuning.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates.

---

## Task AURA-504: Accessibility pass

### Goal
Accessibility pass across public + admin: focus order, contrast, labels, keyboard nav, reduced motion, ARIA.

### Context
§15.5 accessibility rules, D-44 (all UI states incl. unauthorized/forbidden/validation), D-26 (reduced motion).

### Requirements
- Audit and fix accessibility issues; ensure every data-driven UI defines all D-44 states.

### Constraints
Global constraints. Reduced motion respected. No scope expansion.

### Allowed Files / Areas
- `src/components/**`, public + admin pages (a11y fixes only).

### Forbidden Files / Areas
- New features, data-layer changes.

### Files Likely Affected
- Components, pages (a11y attributes).

### Acceptance Criteria
- [ ] Keyboard nav works · [ ] contrast meets target · [ ] all D-44 states present on data-driven UIs.

### Test Plan
- E2E/Accessibility: axe checks on key pages; keyboard nav. Visual: state coverage.

### Required Commands
- `npm run test:e2e` · `npm run build`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + a11y evidence.

### Out of Scope
Perf tuning.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + a11y checks on key paths.

---

## Task AURA-505: Lighthouse performance tuning (D-27)

### Goal
Tune performance so Lighthouse meets D-27 targets (Desktop > 90; Mobile cinematic > 75 / production > 80; CLS < 0.1). **Tuning only — Lighthouse already exists since Phase 2.**

### Context
D-27 (targets), CF-4 (advisory from Phase 2, hard gate at release), `docs/CI_CD_STRATEGY.md`.

### Requirements
- Image optimization, code-splitting, font strategy, GSAP load profiling; meet D-27 on key routes.

### Constraints
Global constraints. Do not introduce Lighthouse (already present). Do not regress reduced motion.

### Allowed Files / Areas
- `src/**` perf-related (images, dynamic imports, fonts), `next.config.js` (perf).

### Forbidden Files / Areas
- Disabling Lighthouse, removing reduced motion.

### Files Likely Affected
- Image/font config, dynamic imports, homepage.

### Acceptance Criteria
- [ ] Desktop > 90 · [ ] Mobile > 75 (cinematic) / target > 80 · [ ] CLS < 0.1 on key routes (advisory run).

### Test Plan
- Lighthouse advisory: meets targets on `/en`, listing, detail. E2E: no functional regression. Visual: unchanged.

### Required Commands
- `npm run build` · `npm run test:e2e`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + Lighthouse scores recorded. **Phase 5 exit gate.**

### Out of Scope
Release gating mechanics (Phase 6).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + Lighthouse targets met (advisory recorded; hard-gated at release).

---

# Phase 6 — Release Readiness

> Final hardening: full E2E + security suites, production env audit, observability, backup/incident/handover docs, and the release checklist. Opus review required for env audit and security sign-off.

---

## Task AURA-601: Full E2E suite

### Goal
Complete the Playwright E2E suite covering all critical public and admin paths.

### Context
`docs/TEST_STRATEGY.md` E2E + smoke lists, D-28 (gates), release blockers.

### Requirements
- E2E for: `/`→`/en`, homepage, listing filters/search/sort, detail, inquiry, WhatsApp CTA, admin login, property CRUD/publish/archive, lead management, legal draft→publish, settings→footer, demo-mode gating, admin role-bypass prevention.

### Constraints
Global constraints. Runs against local/staging stack (A-02). No flaky reliance on mocks.

### Allowed Files / Areas
- `src/tests/e2e/**`.

### Forbidden Files / Areas
- Product code changes (fix forward via separate tasks if a real bug found — escalate).

### Files Likely Affected
- E2E specs, smoke spec.

### Acceptance Criteria
- [ ] All critical paths covered and green · [ ] smoke suite green.

### Test Plan
- E2E + Smoke: full critical-path coverage.

### Required Commands
- `npm run test:e2e` · `npm run test:smoke`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + full E2E green.

### Out of Scope
New features.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: not required.

### Merge Gates
Global gates + full E2E + smoke green.

---

## Task AURA-602: Full security negative suite

### Goal
Complete and run the full security negative-test suite from `docs/TEST_STRATEGY.md`.

### Context
`docs/TEST_STRATEGY.md` security negative list + AURA-specific §16.8, all security merge blockers.

### Requirements
- Ensure every required security case exists and passes: lead/whatsapp/profiles/audit no public read; draft/archived hidden; internal stakeholders excluded; admin role enforcement; PII rejection; unsafe-HTML rejection; lead-export audit; service-role not in client bundle; no `clients`/`client_id`.

### Constraints
Global constraints. This task verifies the merge blockers end-to-end.

### Allowed Files / Areas
- `src/tests/security/**`.

### Forbidden Files / Areas
- Product code (real failures → escalate as fix tasks).

### Files Likely Affected
- Security specs.

### Acceptance Criteria
- [ ] All required security negative cases present and green · [ ] service-role absent from build output · [ ] no `clients`/`client_id` in schema.

### Test Plan
- Security: full suite. Build-output inspection for service-role key.

### Required Commands
- `npm run test:security` · `npm run build`

### Migration / Rollback Note
N/A.

### Definition of Done
Standard checklist + full security suite green.

### Out of Scope
New features.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (security sign-off).

### Merge Gates
Global gates + full security suite + service-role-not-in-bundle + D-05 scan.

---

## Task AURA-603: Production environment audit + secrets

### Goal
Audit production environment variables and secret handling; confirm all required vars present, none leaked, all server-only secrets server-only.

### Context
Pack §20, `docs/CI_CD_STRATEGY.md` env policy, release checklist, service-role/RATE_LIMIT_SALT merge blockers. **Touching production deploy config requires explicit approval.**

### Requirements
- Verify env schema covers all required vars; `.env.example` complete; Vercel encrypted env documented (not committed); no secret in client bundle.

### Constraints
Global constraints. **No real secrets committed.** Production deploy config changes require explicit approval. Server-only secrets verified.

### Allowed Files / Areas
- `.env.example`, env docs, `src/lib/config/env.ts` (read/verify).

### Forbidden Files / Areas
- `.env` with real values, committing production secrets, unapproved deploy config.

### Files Likely Affected
- `.env.example`, env documentation.

### Acceptance Criteria
- [ ] All required vars documented · [ ] no secret in client bundle · [ ] server-only secrets confirmed · [ ] env validated at boundary.

### Test Plan
- Security: build-output secret scan; env schema reject-on-missing. Integration: server boundary validation.

### Required Commands
- `npm run build` · `npm run test:security`

### Migration / Rollback Note
Env documentation only. Rollback = revert docs. No production config changed without approval.

### Definition of Done
Standard checklist + env audit recorded.

### Out of Scope
Actual production deploy (manual, approval-gated).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (secrets/env boundary).

### Merge Gates
Global gates + no-secret-in-bundle + env-completeness.

---

## Task AURA-604: Sentry + Vercel Analytics wiring

### Goal
Wire Sentry (errors) and Vercel Analytics (traffic) with no PII/secret logging.

### Context
§21 observability (do not log service-role/PII/lead full data/WhatsApp PII), `docs/OBSERVABILITY.md`, release checklist.

### Requirements
- Sentry init (server + client appropriately); Vercel Analytics enabled via flag; scrub PII; `SENTRY_AUTH_TOKEN` server-only.

### Constraints
Global constraints. No PII/secrets in telemetry. Server-only tokens.

### Allowed Files / Areas
- `src/services/analytics/**`, Sentry config files, `src/config/feature-flags.ts`.

### Forbidden Files / Areas
- Logging service-role/PII/lead data; client import of `SENTRY_AUTH_TOKEN`.

### Files Likely Affected
- Sentry/analytics config, instrumentation.

### Acceptance Criteria
- [ ] Sentry receives events · [ ] no PII/secret in payloads · [ ] analytics flag-gated · [ ] token server-only.

### Test Plan
- Integration: error captured (scrubbed). Security: no PII/secret in telemetry; token not in client bundle.

### Required Commands
- `npm run test:integration` · `npm run test:security` · `npm run build`

### Migration / Rollback Note
N/A. Rollback = revert instrumentation.

### Definition of Done
Standard checklist + scrubbing verified.

### Out of Scope
Alerting rules tuning.

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (telemetry PII/secret boundary).

### Merge Gates
Global gates + no-PII-in-telemetry + token-not-in-client.

---

## Task AURA-605: Backup / incident / handover docs + release checklist (D-35, D-50)

### Goal
Produce production-readiness docs (backup, incident, handover) and complete the release checklist; verify AUTEX demo data policy.

### Context
D-35 (production readiness), D-50 (client legal readiness before indexable launch), D-33 (fake/noindex/non-PII demo data), pack §22/§24, `docs/CI_CD_STRATEGY.md` release checklist, `docs/DATA_RETENTION.md`.

### Requirements
- Backup strategy, incident runbook, handover checklist; AUTEX demo data verified (fake, license-safe, noindex, no real PII); D-50 client legal readiness checklist for real-client launches.
- Complete the production release checklist (E2E, smoke, Lighthouse hard gate, Sentry, env audit, RLS sign-off, legal published, demo policy).

### Constraints
Global constraints. Real-client indexable launch requires D-50 sign-off. AUTEX stays noindex (D-42).

### Allowed Files / Areas
- `docs/**` (backup/incident/handover/release docs).

### Forbidden Files / Areas
- Product code, production deploy execution without approval.

### Files Likely Affected
- New `docs/` runbooks, release checklist doc.

### Acceptance Criteria
- [ ] Backup/incident/handover docs complete · [ ] release checklist complete · [ ] AUTEX demo policy satisfied · [ ] D-50 checklist present for real-client launch.

### Test Plan
- N/A (documentation); cross-checked against release blockers in `docs/QUALITY_GATES.md`.

### Required Commands
- `npm run quality` (final full gate).

### Migration / Rollback Note
N/A (docs). Backup/restore procedure documented for production handover.

### Definition of Done
Standard checklist + release checklist signed. **Phase 6 / MVP exit gate.**

### Out of Scope
Actual production deploy (manual, approval-gated, outside this task plan).

### Model Assignment
Execute: **Sonnet 4.6**. Opus review: **required** (release readiness sign-off).

### Merge Gates
Global gates + full release checklist + AUTEX demo policy + D-50 (for real-client launch).

---

## Phase Exit Gates Summary

| Phase | Exit Task | Gate |
|---|---|---|
| 0 — Foundation | AURA-008 | `/`→`/en`, shell, env schema, smoke green, CI green, zero boundary violations |
| 1 — Data/Auth/Security | AURA-107 | Schema + RLS + auth + storage + rate-limit; DAL & security suites green in CI |
| 2 — Public | AURA-207 | All public pages present (listing, featured, detail, areas, legal, about); published-only reads; SEO/noindex; Lighthouse advisory enabled |
| 3 — Admin | AURA-307 | Admin behind guard; CRUD/media/areas/settings/legal with audit; no merge-blocker regressions |
| 4 — Lead/WhatsApp | AURA-406 | Lead capture/export + WhatsApp tracking PII-free + rate-limited; metrics |
| 5 — Sales Demo/Polish | AURA-505 | Cinematic + a11y + reduced motion; Lighthouse targets met (advisory) |
| 6 — Release | AURA-605 | Full E2E + security; env/observability; release checklist complete |

---

## Locked-Decision Coverage Map (D-01–D-51)

| Decision | Covered by task(s) |
|---|---|
| D-01, D-02, D-03 | Whole plan (governance), AURA-201/501 (AUTEX branding/demo) |
| D-04, D-23, D-43 | AURA-603/605 (isolated deployment + handover); no `clients` model throughout |
| **D-05** (merge blocker) | AURA-102 (schema scan), AURA-602 (security scan) |
| D-06, D-07 | AURA-008, AURA-201, AURA-207 |
| D-08 | AURA-102 (JSONB i18n), AURA-201/202 |
| D-09 | AURA-303 (bedrooms-by-type validation) |
| D-10, D-46 | AURA-307 (legal draft→publish) |
| D-11 | AURA-401 (lead links Privacy Policy) |
| **D-12** (merge blocker) | AURA-205, AURA-307 |
| D-13, D-14 | AURA-203 (contact routing) |
| D-15, D-16 | AURA-203 (stakeholder visibility), AURA-103 (RLS) |
| D-17, **D-18** (merge blocker) | AURA-405 |
| D-19 | AURA-501, AURA-206 |
| D-20, D-21 | AURA-306 (settings governance) |
| D-22 | AURA-204, AURA-305 |
| D-24 | AURA-007 (CI gates preserved) |
| D-25, D-26 | AURA-006, AURA-502, AURA-503 |
| D-27 | AURA-505, AURA-206 (Lighthouse) |
| D-28 | All tasks (gates) |
| D-29 | AURA-001 |
| D-30 | AURA-104, AURA-301 |
| D-31 | AURA-403 |
| D-32, D-36 | AURA-303, AURA-202/203 |
| D-33 | AURA-107 (fixtures), AURA-605 (demo policy) |
| D-34 | AURA-202+ (all API tasks: auth/validation/errors/rate-limit/logging/tests) |
| D-35 | AURA-603, AURA-604, AURA-605 |
| D-37 | AURA-401, AURA-403 |
| D-38 | AURA-303, AURA-304, AURA-306, AURA-307, AURA-404 (audit) |
| D-39, **D-51** (merge blocker) | AURA-106 |
| **D-40** (merge blocker) | AURA-104, AURA-301 |
| D-41 | AURA-105, AURA-304 |
| D-42 | AURA-206, AURA-207 (noindex on About) |
| D-44 | AURA-202/203/204/302/401 (UI states) |
| D-45 | This document (every task: allowed/forbidden/tests/rollback) |
| D-47 | AURA-303 (reference number) |
| D-48 | AURA-202, AURA-203 |
| D-49 | AURA-203 (text location + external map link) |
| D-50 | AURA-605 |

Ratified defaults applied: A-01 (CI), A-02 (local stack), A-03 (rate-limit thresholds), A-04 (`preferred_contact_method`), A-05 (`reference_number`), A-06 (slug immutable), A-07 (pagination cap 50), A-08 (lead export), A-09 (settings shape), A-11 (AED-only), A-12 (Vitest/Playwright), A-13 (Resend), A-14/A-15 (image formats/size), A-16 (rate-limit TTL).

Public-surface coverage (architecture/API alignment): `GET /api/properties/featured` and the homepage featured section are owned by **AURA-202**; the contact page/form is owned by **AURA-401**; the About page (`/en/about`) is owned by **AURA-207**. All public `/en/*` routes and public read endpoints in `docs/ARCHITECTURE.md` / `docs/API_SPEC.md` now have an explicit owning task.

---

*End of TASKS_Project.md. Awaiting Opus 4.8 review of this task plan before Phase 0 execution begins (Sonnet 4.6, one task at a time).*
