# Current State

**Updated:** 2026-06-16
**Branch:** `develop` (AURA-008 squash-merged; merge commit `be43dab`)
**Phase:** Phase 0 — complete. AURA-008 merged to `develop`. Ready for AURA-009.

> Note: AURA-007 (`feat/aura-007-ci-codeql`) was committed and merged to `develop` before this session.

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
- `.github/workflows/ci.yml` — quality-gate CI on PR/push to `develop`; `quality` job decomposing all gates; active `e2e` job (enabled in AURA-008). DAL/integration/security run as plain Vitest now; Dockerized Supabase stack attached in AURA-107 (A-02).
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

## What Does NOT Exist

- No root-level `tests/` directory
- No Supabase files or migrations
- No `.env` or `.env.local` file (`.env.example` placeholders only)
- No product UI features beyond the minimal homepage shell
- No UI components (Button, Card, etc.) — component layer is Phase 2+
- No `cn()` utility (deferred to when first component needs it)
- No Stage 2 skills, MCPs, hooks, or plugins
- No Lighthouse advisory run yet (stub disabled until AURA-206)
- No Dockerized Supabase stack in CI yet (attached in AURA-107)
- No real data layer, auth, admin, lead capture, CRM, GSAP, business logic, or search

---

## AURA-008 Gate Results

| Gate | Result |
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
| `npm run build` | PASS — 4 routes: `/`, `/_not-found`, `/[locale]`; middleware 44.1 kB |
| `npm run test:smoke` | PASS — 4/4 (Chromium + Mobile Safari) |
| `npm run test:smoke -- --project=chromium` | PASS — 2/2 (mirrors CI) |
| `npm run quality` | PASS — composite exit 0 |
| `npm run audit` | PASS — exit 0; 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |

### GitHub CI (PR #9 — merged)

| Check | Result |
|---|---|
| `quality` | PASS — 1m 7s |
| `e2e` | PASS — 1m 19s |
| `analyze (javascript-typescript)` | PASS — 1m 1s |
| `CodeQL` | PASS — 2s |

PR #9 was squash-merged to `develop` at merge commit `be43dab feat: add localized homepage shell and smoke test`. Feature branch `feat/aura-008-homepage-shell` deleted. `develop` is current source of truth.

---

## Open Items

### Carry-Forward: `postcss` moderate (documented exception)
Same as AURA-001/002/005/006/007. Passes `--audit-level=high`. Not actionable.

### Note: Playwright Node.js deprecation warning
Playwright 1.60 internal; not a gate failure.

### Note: Font families using system fallbacks
`--font-serif: ui-serif, 'Georgia', serif` etc. are MVP placeholders. Next/font loading for the actual luxury typeface deferred to a later task; the CSS variable makes it swappable without changing tailwind config.

---

## Branch Protection Status

`develop` branch protection is active with required status checks:

```
quality
e2e
analyze (javascript-typescript)
CodeQL
```

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
