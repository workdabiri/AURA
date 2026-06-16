# Current State

**Updated:** 2026-06-16
**Branch:** `feat/aura-101-supabase-stack` (AURA-101 in progress; PR open against `develop`)
**Phase:** Phase 1 — in progress. AURA-101 PR open; CI green, Opus 4.8 APPROVED — ready for squash-merge to `develop`.

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

### Supabase Local Stack + Helpers (AURA-101) ← NEW (PR open)

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

## What Does NOT Exist

- No root-level `tests/` directory
- No Supabase migrations
- No `.env` or `.env.local` file (`.env.example` placeholders only)
- No product UI features beyond the minimal homepage shell
- No UI components (Button, Card, etc.) — component layer is Phase 2+
- No `cn()` utility (deferred to when first component needs it)
- No Stage 2 skills, MCPs, hooks, or plugins
- No Lighthouse advisory run yet (stub disabled until AURA-206)
- No Dockerized Supabase stack in CI yet (attached in AURA-107); local-stack connection tests require `SUPABASE_LOCAL_TESTS=1`
- No migrations (AURA-102), no RLS policies (AURA-103), no auth (AURA-104), no DAL functions
- No real data layer, auth, admin, lead capture, CRM, GSAP, business logic, or search

---

## AURA-101 Gate Results (branch: feat/aura-101-supabase-stack)

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

### GitHub CI (PR #11 — AURA-101, open)

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
