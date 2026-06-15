# Current State

**Updated:** 2026-06-15  
**Branch:** `feat/aura-007-ci-codeql`  
**Phase:** Phase 0 — AURA-007 executed, awaiting commit approval (Opus review required before merge)

> Note: AURA-006 (`feat/aura-006-design-tokens`) was committed and merged to `develop` (commit `7215152`) before this session.

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
- `.prettierrc.json` — Prettier config; `prettier-plugin-tailwindcss` already wired in plugins array
- `.prettierignore` — excludes `**/*.md` and build artifacts
- `package.json` — lint script: `eslint .`; quality composite script; all test scripts pointing to `src/tests/`
- `next.config.js` — `eslint: { ignoreDuringBuilds: true }`

### Test Harness (AURA-003)
- `vitest.config.ts` — `setupFiles` and `include` updated to canonical `src/tests/` paths
- `playwright.config.ts` — `testDir` updated to `./src/tests/e2e`
- `src/tests/setup.ts` — Vitest global setup entry point
- Harness tests passing: unit, dal, integration, security (harness level)
- `src/tests/e2e/smoke.spec.ts` — Playwright smoke placeholder (`test.describe.skip`); exercised in AURA-008

### Architecture Boundary Enforcement (AURA-004)
- `.dependency-cruiser.cjs` — 12 rules covering all forbidden import directions + `api-route-requires-validation`
- `knip.jsonc` — no-wildcard `ignoreDependencies` allowlist; shrinking as tasks wire deps

### Environment Schema (AURA-005)
- `src/lib/validation/env.schema.ts` — pure Zod schemas; no `server-only`; no `process.env`; fully unit-testable
- `src/lib/config/env.ts` — `getServerEnv()`; `import 'server-only'` guard; lazy + memoized
- `src/lib/config/env.public.ts` — `getPublicEnv()`; client-safe; `NEXT_PUBLIC_*` only
- `.env.example` — 10 variables, placeholders only

### Design Tokens + Tailwind Pipeline (AURA-006) ← NEW
- `tailwind.config.ts` — Tailwind v3.4.x; `theme.extend` only; `@tailwindcss/typography` plugin; token-backed colors (brand/surface/text/border), font families, font sizes (display–caption), border radii, shadows, motion duration/easing, container max-width, section spacing
- `postcss.config.js` — `{ tailwindcss: {}, autoprefixer: {} }` for Next.js PostCSS pipeline
- `src/styles/tokens.css` — All `luxury-dark` CSS custom properties on `:root`; bare HSL channels for Tailwind opacity support; brand, surface, text, border, radius, shadow, motion, layout, typography scale
- `src/styles/globals.css` — Tailwind base/components/utilities directives; `@layer base` global resets using tokens; no hardcoded `left`/`right` directional rules introduced; future layout spacing must use logical CSS properties (`padding-inline`, `margin-inline`, etc.) for RTL-readiness (D-07); `prefers-reduced-motion` respected (D-26)
- `src/app/layout.tsx` — Imports `@/styles/tokens.css` then `@/styles/globals.css`

### CI / CodeQL / Branch Protection (AURA-007) ← NEW
- `.github/workflows/ci.yml` — quality-gate CI on PR/push to `develop`; single `quality` job (Node 20 LTS, `npm ci` + cache) decomposing lint, typecheck, format:check, unit/dal/integration/security tests, deps:check, unused, build, `npm audit --audit-level=high` into named steps. Deferred `e2e` (Playwright) job present as a commented stub — enabled in AURA-008. DAL/integration/security run as plain Vitest now; Dockerized Supabase stack attached in AURA-107 (A-02).
- `.github/workflows/codeql.yml` — CodeQL SAST for `javascript-typescript` on PR + push to `develop` + weekly schedule; `analyze` job; `build-mode: none`; uses built-in `GITHUB_TOKEN` (no secrets).
- `.github/workflows/lighthouse.yml` — disabled advisory stub (`workflow_dispatch` + `if: false`); enabled non-blocking in AURA-206 (CF-4). Never a required check.
- `docs/BRANCH_PROTECTION.md` — manual GitHub branch-protection runbook; required checks `quality` + `analyze`; ≥1 review, dismiss stale, no force-push/deletions; auto-merge into `develop` only after protection exists; `main` manual-only.

### Application Scaffold (AURA-001)
- `next.config.js`, `src/app/layout.tsx`, `src/app/page.tsx` (placeholder)
- Full `src/` folder architecture per `docs/ARCHITECTURE.md`

### Continuity Files
- `SESSION_HANDOFF.md`, `CURRENT_STATE.md` (this file), `NEXT_STEPS.md`

---

## What Does NOT Exist

- No root-level `tests/` directory
- No Supabase files or migrations
- No `.env` or `.env.local` file (`.env.example` placeholders only)
- No product UI/features beyond the placeholder shell
- No routing, i18n, redirects, data layer, auth, admin, GSAP, business logic
- No UI components (Button, Card, etc.) — component layer is AURA-008+
- No `cn()` utility (deferred to when first component needs it)
- No Stage 2 skills, MCPs, hooks, or plugins
- No Playwright/e2e job active in CI yet (deferred to AURA-008 — smoke spec still `test.describe.skip`)
- No Lighthouse advisory run yet (stub disabled until AURA-206)
- No Dockerized Supabase stack in CI yet (attached in AURA-107)
- No branch protection applied in GitHub yet (manual step; documented in `docs/BRANCH_PROTECTION.md`)

---

## AURA-007 Gate Results

| Gate | Result |
|---|---|
| `npm run lint` | PASS — zero errors |
| `npm run typecheck` | PASS — clean |
| `npm run format:check` | PASS — all matched files use Prettier code style (YAML included; `**/*.md` excluded) |
| `npm run test` | PASS — 6 files, 14 tests |
| `npm run test:unit` | PASS — 2 files, 8 tests |
| `npm run test:dal` | PASS — 1 |
| `npm run test:integration` | PASS — 1 |
| `npm run test:security` | PASS — 2 files, 4 tests |
| `npm run deps:check` | PASS — 0 violations (10 modules) |
| `npm run unused` | PASS — 0 issues |
| `npm run build` | PASS — compiled cleanly (4 static routes) |
| `npm run audit` | PASS — exit 0; 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |
| `npm run quality` | PASS — composite exit 0 |

> AURA-007 is CI/docs-only: no `src/**`, `package.json`, `package-lock.json`, env, secrets, or migrations changed — gate values are unchanged from AURA-006 as expected.

---

## Open Items

### Carry-Forward: `postcss` moderate (documented exception)
Same as AURA-001/002/005. Passes `--audit-level=high`. Not actionable.

### Note: Tailwind "no utility classes" build warning
Expected — the placeholder `page.tsx` has no Tailwind utility classes. Warning disappears once AURA-008 adds real JSX. Not a gate failure.

### Note: Font families using system fallbacks
`--font-serif: ui-serif, 'Georgia', serif` etc. are MVP placeholders. Next/font loading for the actual luxury typeface (e.g. Cormorant Garamond) is deferred to AURA-008; the CSS variable makes it swappable without changing tailwind config.

### Note: Playwright Node.js deprecation warning
Playwright 1.60 internal; not a gate failure.

---

## Knip Allowlist Status

| Entry | Status |
|---|---|
| ~~`tailwindcss`~~ | ✅ Removed AURA-006 (used by `tailwind.config.ts` + `postcss.config.js`) |
| ~~`@tailwindcss/typography`~~ | ✅ Removed AURA-006 (imported in `tailwind.config.ts`) |
| ~~`autoprefixer`~~ | ✅ Removed AURA-006 (used in `postcss.config.js`) |
| ~~`postcss`~~ | ✅ Removed AURA-006 (PostCSS runner, detected via config file) |
| `class-variance-authority` | Retained — no components yet |
| `clsx` | Retained — no components yet |
| `tailwind-merge` | Retained — no components yet |
| `lucide-react` | Retained — no icons yet |
| `next-intl` | Wired in AURA-008 |
| `@supabase/ssr`, `@supabase/supabase-js` | Wired in AURA-101 |
| `resend` | Wired in AURA-106 |
| `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js` | Wired in Phase 2–3 |
| `@tanstack/react-query`, `zustand` | Wired in Phase 2+ |
| `gsap`, `framer-motion` | Wired in Phase 5 |
| `@sentry/nextjs`, `@vercel/analytics` | Wired in Phase 6 |
| `eslint-config-next`, `@typescript-eslint/{parser,eslint-plugin}` | FlatCompat string-based; keep |
| `entry: ["src/lib/config/env.ts"]` | Remove in AURA-101 |

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
