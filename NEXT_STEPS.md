# Next Steps

**Updated:** 2026-06-15  
**Current Phase:** Phase 0 — AURA-007 executed, awaiting commit approval (Opus review required before merge)

---

## Immediate Next Action

**Opus 4.8 review of AURA-007**, then **user approves AURA-007 commit**, then:

1. Commit `feat/aura-007-ci-codeql`
2. Open PR to `develop` (first run of `ci.yml` + `codeql.yml`)
3. Apply branch protection in GitHub per `docs/BRANCH_PROTECTION.md` (required checks: `quality`, `analyze`) once the checks have appeared
4. Squash merge to `develop` after checks pass + ≥1 review

> AURA-006 (`feat/aura-006-design-tokens`) is already merged to `develop` (`7215152`).

---

## Audit Status — Unchanged

`npm run audit` passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings via `next@15` internal postcss. Documented exception — no action required.

---

## After AURA-007 Merge

Remaining Phase 0 task:

| Task | Description | Opus Review |
|---|---|---|
| ~~**AURA-007**~~ | ~~GitHub Actions CI + CodeQL + branch protection documentation~~ ✅ executed (awaiting Opus review + commit) | **Required** |
| **AURA-008** | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | Not required |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- ~~**AURA-005** → remove `zod`, `server-only`~~ ✅ done
- ~~**AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`~~ ✅ done (all 4 genuinely wired)
- **AURA-006 deferred** → `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` — keep until first component that uses them (Phase 2 or AURA-008)
- **AURA-008** → remove `next-intl`
- **AURA-101** → remove `@supabase/ssr`, `@supabase/supabase-js`
- **AURA-106 / Phase 3** → remove `resend`
- **Phase 2–3 (forms)** → remove `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js`
- **Phase 2+ (data/state)** → remove `@tanstack/react-query`, `zustand`
- **Phase 5 (motion)** → remove `gsap`, `framer-motion`
- **Observability (Phase 6)** → remove `@sentry/nextjs`, `@vercel/analytics`
- `eslint-config-next`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` — used via FlatCompat but untraceable by Knip; keep until ESLint config is updated.

### Knip `entry` debt (AURA-005)
- `knip.jsonc` declares `entry: ["src/lib/config/env.ts"]` because the server env accessor has no runtime caller yet. **AURA-101 must remove this entry** once a server module imports `getServerEnv()`.

---

## Notes for AURA-007 (executed — awaiting Opus review + commit)

- Opus review required (CI/security gate + merge-policy enforcement) — **pending**.
- Created `.github/workflows/ci.yml` — `quality` job (Node 20 LTS): lint, typecheck, format:check, unit/dal/integration/security tests, deps:check, unused, build, audit. Deferred `e2e` stub for AURA-008.
- Created `.github/workflows/codeql.yml` — JS/TS, PR + push + weekly schedule.
- Created `.github/workflows/lighthouse.yml` — disabled stub; enabled non-blocking in AURA-206 (CF-4).
- Created `docs/BRANCH_PROTECTION.md` — required checks `quality` + `analyze`, ≥1 review, dismiss stale, no force-push, auto-merge `develop`-only, `main` manual.
- Follow-ups owned by later tasks: AURA-008 enables the `e2e` check; AURA-107 attaches the Dockerized Supabase stack to DAL/integration/security steps; AURA-206 enables Lighthouse advisory.

---

## Notes for AURA-008

- Depends on AURA-007 (CI green on PR).
- Removes `test.describe.skip` from `src/tests/e2e/smoke.spec.ts`.
- Wires `next-intl` → removes from Knip allowlist.
- `/` → `/en` redirect; `/en` homepage shell using `luxury-dark` tokens.
- Good opportunity to swap system font fallbacks for next/font loaded typeface (update CSS variable `--font-serif`).

---

## Notes for AURA-101 (Supabase helpers, Phase 1)

- Wires `@supabase/ssr` + `@supabase/supabase-js` — remove from Knip allowlist.
- The service-role helper must `import 'server-only'` and is covered by `no-client-to-service-role`.
- Server client should consume `getServerEnv()` from `src/lib/config/env.ts` — **remove the `entry` declaration for `env.ts` from `knip.jsonc`** once it has a real importer.

---

## Do Not Do Yet

- Do not start AURA-007 before AURA-006 merges
- Do not fix audit without explicit dep-change approval
- Do not create migrations
- Do not create `.env` / `.env.local` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
- Do not implement UI components (deferred to Phase 2)
- Do not load fonts via next/font (deferred to AURA-008)
