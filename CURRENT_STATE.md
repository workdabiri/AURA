# Current State

**Updated:** 2026-06-14  
**Branch:** `feat/aura-005-env-schema`  
**Phase:** Phase 0 — AURA-005 executed, awaiting Opus review / commit approval

---

## What Exists

### Governance and Docs
- `CLAUDE.md` — session protocol, model policy, non-negotiable rules, forbidden actions
- `docs/` — 23 docs covering product brief, PRD, MVP scope, glossary, user stories, feature specs, acceptance criteria, architecture, data model, API spec, security, RBAC, quality gates, test strategy, CI/CD, AI coding workflow, skills strategy, agents strategy, decision log, observability, data retention, design system, and the Opus bootstrap foundation audit
- `docs/DECISION_LOG.md` — D-01–D-51 locked, Q-01–Q-15 ratified, A-01–A-11 ratified
- `docs/TASKS_Project.md` — Approved task breakdown (Phase 0–6, 44 tasks)
- `docs/TASKS_PROJECT_REVIEW_OPUS.md` — Opus 4.8 APPROVE_TASK_PLAN verdict

### Rules and Agents
- `.claude/rules/` — 6 merge-blocker rule files
- `.claude/agents/` — 9 core agent definition files
- `.claude/skills/README.md` — Stage 1 skills strategy (no gate skills created)

### Quality Scripts and Config (AURA-002)
- `eslint.config.mjs` — ESLint 9 flat config; uses `FlatCompat` to bridge `next/core-web-vitals` + `next/typescript`
- `.prettierrc.json` — Prettier config (unchanged)
- `.prettierignore` — excludes `**/*.md` and build artifacts
- `package.json` — lint script: `eslint .`; `@eslint/eslintrc` devDep; test scripts now point to `src/tests/`
- `next.config.js` — `eslint: { ignoreDuringBuilds: true }`

### Test Harness (AURA-003)
- `vitest.config.ts` — `setupFiles` and `include` updated to canonical `src/tests/` paths; coverage exclude updated
- `playwright.config.ts` — `testDir` updated to `./src/tests/e2e`
- `src/tests/setup.ts` — Vitest global setup entry point
- `src/tests/unit/harness.test.ts` — real passing unit harness test
- `src/tests/dal/harness.test.ts` — real passing DAL harness test
- `src/tests/integration/harness.test.ts` — real passing integration harness test
- `src/tests/security/harness.test.ts` — real passing security harness test
- `src/tests/e2e/smoke.spec.ts` — Playwright smoke placeholder (`test.describe.skip`); exercised in AURA-008

### Architecture Boundary Enforcement (AURA-004)
- `.dependency-cruiser.cjs` — finalized forbidden-import rules + `tsConfig` alias resolution so `@/*` imports are checked:
  - Existing: `no-dal-to-ui`, `no-domain-to-ui`, `no-domain-to-dal`, `no-ui-to-dal`, `no-ui-to-services`, `no-lib-to-domain`, `no-circular`
  - Added (Tier 1): `no-domain-to-react`, `no-ui-to-supabase`, `no-client-to-service-role`, and the `required` rule `api-route-requires-validation` (route handlers must import `zod` or `src/lib/validation`)
- `knip.jsonc` — Knip config with an explicit, no-wildcard `ignoreDependencies` allowlist (26 approved-but-not-yet-wired deps, grouped with inline rationale). **Temporary governance debt — each entry is removed by the task that wires it.**
- `npm run deps:check` and `npm run unused` both pass clean on the scaffold; boundary trip proven via temporary fixtures (not committed).

### Environment Schema (AURA-005)
- `src/lib/validation/env.schema.ts` — pure Zod schemas: `publicEnvSchema` (4 `NEXT_PUBLIC_*` vars) + `serverEnvSchema` (6 server-only vars) + inferred types. No `server-only`, no `process.env` access, no top-level parsing → fully unit-testable.
- `src/lib/config/env.ts` — server accessor `getServerEnv()`; `import 'server-only'` guard; lazy + memoized; fails fast at the server boundary on missing/invalid required vars.
- `src/lib/config/env.public.ts` — client-safe accessor `getPublicEnv()`; exposes only `NEXT_PUBLIC_*` (statically referenced for Next inlining); no `server-only`; no server secret reachable.
- `.env.example` — all 10 variables, grouped public vs server-only, **placeholders only** (no real secrets). No `.env`/`.env.local` created.
- `.dependency-cruiser.cjs` — added `no-client-to-server-env` (`^src/components` → `^src/lib/config/env\.ts$`); scoped to `env.ts` exactly so `env.public.ts` stays allowed. Proven via temporary fixture (FAIL→PASS, not committed).
- `knip.jsonc` — removed `zod` (now used by `env.schema.ts`) and `server-only` (now used by `env.ts`); added `entry: ["src/lib/config/env.ts"]` (no runtime caller until AURA-101; documented).
- Tests: `src/tests/unit/env.test.ts` (schema parse/reject), `src/tests/security/env.test.ts` (no server-only key reachable via public surface).

### Application Scaffold (AURA-001)
- `next.config.js` — Next.js App Router config
- `src/app/layout.tsx` — root layout (placeholder, no styling)
- `src/app/page.tsx` — placeholder page
- `src/` folder architecture per `docs/ARCHITECTURE.md`:
  - `src/components/{ui,real-estate,marketing,admin,layout}/`
  - `src/config/`, `src/domain/`, `src/dal/`, `src/services/`
  - `src/lib/{supabase,validation,i18n,seo,utils}/`
  - `src/styles/`, `src/types/`
  - `src/tests/{unit,dal,integration,e2e,security}/` — harness tests present; `.gitkeep` files removed

### Continuity Files
- `SESSION_HANDOFF.md`, `CURRENT_STATE.md` (this file), `NEXT_STEPS.md`

---

## What Does NOT Exist

- No root-level `tests/` directory
- No Supabase files or migrations
- No `.env` or `.env.local` file, and no real secrets (`.env.example` placeholders only, added in AURA-005)
- No product UI/features beyond the placeholder shell
- No routing, i18n, redirects, styling, data layer, auth, admin, GSAP
- No Stage 2 skills (six review-gate skills)
- No MCPs, hooks, or plugins
- No GitHub Actions CI (AURA-007)

---

## AURA-005 Gate Results

| Gate | Result |
|---|---|
| `npm run lint` | PASS — zero errors, zero warnings |
| `npm run typecheck` | PASS — clean, no errors |
| `npm run format:check` | PASS — all matched files use Prettier code style |
| `npm run test` | PASS — 6 files, 14 tests (harness + env unit/security) |
| `npm run test:unit` | PASS — 2 files, 8 tests |
| `npm run test:dal` | PASS — 1 passed |
| `npm run test:integration` | PASS — 1 passed |
| `npm run test:security` | PASS — 2 files, 4 tests |
| `npm run test:e2e` | PASS — 4 skipped (test.describe.skip; exercised AURA-008) |
| `npm run test:smoke` | PASS — 4 skipped (same) |
| `npm run deps:check` | PASS — zero violations (8 modules); `no-client-to-server-env` proven via temporary fixture (FAIL→PASS) |
| `npm run unused` | PASS — zero issues; `zod`/`server-only` removed from allowlist, `env.ts` declared entry |
| `npm run build` | PASS — compiled cleanly; "Skipping linting" |
| `npm run quality` | PASS — composite (lint→typecheck→format→test→unused→deps:check→build) |
| `npm run audit` | PASS — 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |

---

## Open Items

### Carry-Forward: `postcss` moderate (documented exception — not fixable)
Same as AURA-001/002. Passes `--audit-level=high`. Not actionable.

### Note: Playwright Node.js deprecation warning
`[DEP0205] DeprecationWarning: module.register() is deprecated` — emitted by Playwright 1.60 internals on Node.js 22+. Not from AURA code. Not a gate failure.

---

## Decisions in Force

All locked decisions D-01–D-51 are in force. Key non-negotiables:
- No `clients` table, no `client_id` (D-05 — merge blocker)
- No public admin self-signup (D-40)
- Service-role key server-only (security merge blocker)
- No raw IP in event tables (D-18, D-51 — merge blocker)
- No raw legal HTML (D-12 — merge blocker)
- Auto-merge only into `develop`, never `main`
