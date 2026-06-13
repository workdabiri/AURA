# Current State

**Updated:** 2026-06-13  
**Branch:** `feat/aura-001-repo-scaffold`  
**Phase:** Phase 0 — AURA-001 executed, awaiting commit approval

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

### Quality Scripts
- `package.json` — scripts block with all required quality commands declared
- `package-lock.json` — created by AURA-001 npm install (758 packages)
- Config stubs: `.dependency-cruiser.cjs`, `.eslintrc.json`, `.prettierrc.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`

### Application Scaffold (AURA-001)
- `next.config.js` — minimal Next.js App Router config
- `src/app/layout.tsx` — root layout (placeholder, no styling)
- `src/app/page.tsx` — placeholder page
- `src/` folder architecture per `docs/ARCHITECTURE.md`:
  - `src/components/{ui,real-estate,marketing,admin,layout}/`
  - `src/config/`, `src/domain/`, `src/dal/`, `src/services/`
  - `src/lib/{supabase,validation,i18n,seo,utils}/`
  - `src/styles/`, `src/types/`
  - `src/tests/{unit,dal,integration,e2e,security}/`
  - All empty dirs have `.gitkeep` sentinels

### Continuity Files
- `SESSION_HANDOFF.md`, `CURRENT_STATE.md` (this file), `NEXT_STEPS.md`

---

## What Does NOT Exist

- No Supabase files or migrations
- No `.env` file or real secrets (only `.env.example` when AURA-005 runs)
- No product UI/features beyond the placeholder shell
- No routing, i18n, redirects, styling, data layer, auth, admin, GSAP
- No Stage 2 skills (six review-gate skills)
- No MCPs, hooks, or plugins
- No GitHub Actions CI (AURA-007)

---

## AURA-001 + AURA-001a Gate Results

| Gate | Result |
|---|---|
| `npm run typecheck` | PASS — clean, no errors |
| `npm run lint` | PASS — no ESLint warnings or errors |
| `npm run build` | PASS — ✓ Compiled successfully, static pages generated |
| `npm run audit` | PASS — 0 high/critical; 2 moderate (below threshold; documented exception) |
| Folder architecture matches `docs/ARCHITECTURE.md` | PASS |
| No Supabase/env/secret files | PASS |

---

## Open Items

### Carry-Forward: `postcss` moderate (documented exception — not fixable)
`npm run audit` passes the `--audit-level=high` gate. Two remaining moderate findings:
- `postcss < 8.5.10` via `next@15` (Next.js bundles its own postcss)
- "Fix" would require downgrading Next to 9.3.3 — nonsensical; not actionable

### Carry-Forward: Test directory discrepancy (AURA-003 scope)
- `vitest.config.ts` includes `tests/unit/**` (root-level), AURA-001 created `src/tests/unit/` (per spec)
- `playwright.config.ts` uses `testDir: './tests/e2e'` (root-level)
- `@vitejs/plugin-react` removed from vitest.config.ts; will be re-evaluated in AURA-003
- Reconcile in AURA-003 (testing stack task)

### Carry-Forward: `next lint` deprecation (AURA-002 scope)
- `next lint` will be removed in Next.js 16; migrate to ESLint CLI
- AURA-002 (ESLint wiring) is the correct place to address this

---

## Decisions in Force

All locked decisions D-01–D-51 are in force. Key non-negotiables:
- No `clients` table, no `client_id` (D-05 — merge blocker)
- No public admin self-signup (D-40)
- Service-role key server-only (security merge blocker)
- No raw IP in event tables (D-18, D-51 — merge blocker)
- No raw legal HTML (D-12 — merge blocker)
- Auto-merge only into `develop`, never `main`
