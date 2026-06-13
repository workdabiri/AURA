# Current State

**Updated:** 2026-06-13  
**Branch:** `feat/aura-003-testing-stack`  
**Phase:** Phase 0 — AURA-003 executed, awaiting commit approval

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
- No `.env` file or real secrets (only `.env.example` when AURA-005 runs)
- No product UI/features beyond the placeholder shell
- No routing, i18n, redirects, styling, data layer, auth, admin, GSAP
- No Stage 2 skills (six review-gate skills)
- No MCPs, hooks, or plugins
- No GitHub Actions CI (AURA-007)

---

## AURA-003 Gate Results

| Gate | Result |
|---|---|
| `npm run typecheck` | PASS — clean, no errors |
| `npm run lint` | PASS — zero errors, zero warnings |
| `npm run format:check` | PASS — all matched files use Prettier code style |
| `npm run test` | PASS — 4 files, 4 tests passed (unit + dal + integration + security) |
| `npm run test:unit` | PASS — 1 passed |
| `npm run test:dal` | PASS — 1 passed |
| `npm run test:integration` | PASS — 1 passed |
| `npm run test:security` | PASS — 1 passed |
| `npm run test:e2e` | PASS — 4 skipped (test.describe.skip; exercised AURA-008) |
| `npm run test:smoke` | PASS — 4 skipped (same) |
| `npm run build` | PASS — compiled cleanly; "Skipping linting" |
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
