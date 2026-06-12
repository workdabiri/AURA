# Current State

**Updated:** 2026-06-13  
**Branch:** `chore/bootstrap-foundation`  
**Phase:** Bootstrap complete — awaiting task generation

---

## What Exists

### Governance and Docs
- `CLAUDE.md` — session protocol, model policy, non-negotiable rules, forbidden actions
- `docs/` — 19 docs covering product brief, PRD, MVP scope, glossary, architecture, data model, API spec, security, RBAC, quality gates, test strategy, CI/CD, AI coding workflow, skills, agents, decision log, observability, data retention, design system
- `docs/DECISION_LOG.md` — D-01–D-51 locked, Q-01–Q-15 ratified, A-01–A-11 ratified

### Rules and Agents
- `.claude/rules/` — 6 merge-blocker rule files
- `.claude/agents/` — 9 core agent definition files
- `.claude/skills/README.md` — Stage 1 skills strategy (no gate skills created)

### Quality Scripts
- `package.json` — scripts block with all required quality commands declared
- Config stubs: `.dependency-cruiser.cjs`, `.eslintrc.json`, `.prettierrc.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`

### Continuity Files
- `SESSION_HANDOFF.md`, `CURRENT_STATE.md` (this file), `NEXT_STEPS.md`

---

## What Does NOT Exist

- No product/implementation code
- No `src/` directory
- No UI components, pages, or routes
- No Supabase migrations
- No `.env` file or secrets
- No installed dependencies (`node_modules/`)
- No `docs/TASKS_Project.md` (generated after user approval)
- No Stage 2 skills (six review-gate skills)
- No MCPs, hooks, or plugins

---

## Decisions in Force

All locked decisions D-01–D-51 are in force. Key non-negotiables:
- No `clients` table, no `client_id` (D-05 — merge blocker)
- No public admin self-signup (D-40)
- Service-role key server-only (security merge blocker)
- No raw IP in event tables (D-18, D-51 — merge blocker)
- No raw legal HTML (D-12 — merge blocker)
- Auto-merge only into `develop`, never `main`

---

## Dependency Stack (Declared, Not Installed)

Frontend: Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui, GSAP, Framer Motion, React Hook Form, Zod, Zustand, TanStack Query, next-intl, libphonenumber-js

Backend: Next.js Route Handlers, Supabase PostgreSQL + Auth + Storage, Resend, Zod, server-only

DevOps: Vitest, Playwright, ESLint, TypeScript strict, Prettier, Knip, dependency-cruiser, CodeQL, Sentry, Vercel Analytics
