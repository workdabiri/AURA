# Next Steps

**Updated:** 2026-06-16
**Current Phase:** Phase 0 — complete. AURA-008 merged to `develop` at `be43dab`. Ready for AURA-009.

---

## Immediate Next Action

**Start AURA-009** in a new session.

AURA-008 is fully merged. PR #9 was squash-merged to `develop` at merge commit `be43dab feat: add localized homepage shell and smoke test`. Feature branch `feat/aura-008-homepage-shell` deleted. `develop` is current source of truth.

Before starting AURA-009:
1. Read `CLAUDE.md`, `CURRENT_STATE.md`, `SESSION_HANDOFF.md`, `NEXT_STEPS.md`, and `docs/TASKS_Project.md`.
2. Confirm the task reference from `docs/TASKS_Project.md`.
3. Branch from `develop`: `feature/aura-009-<slug>`.

Branch protection active on `develop`:
- `quality` — required
- `e2e` — required
- `analyze (javascript-typescript)` — required
- `CodeQL` — required

GitHub required approvals are disabled for solo-operator mode; required checks remain enforced.

---

## Audit Status — Unchanged

`npm run audit` passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings via `next@15` internal postcss. Documented exception — no action required.

---

## Phase 0 Task Status

| Task | Description | Status |
|---|---|---|
| ~~**AURA-001**~~ | Next.js scaffold | ✅ merged |
| ~~**AURA-002**~~ | ESLint + Prettier quality gates | ✅ merged |
| ~~**AURA-003**~~ | Vitest + Playwright test harness | ✅ merged |
| ~~**AURA-004**~~ | Architecture boundary enforcement | ✅ merged |
| ~~**AURA-005**~~ | Environment schema + config | ✅ merged |
| ~~**AURA-006**~~ | Design tokens + Tailwind pipeline | ✅ merged |
| ~~**AURA-007**~~ | GitHub Actions CI + CodeQL + branch protection | ✅ merged |
| ~~**AURA-008**~~ | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | ✅ merged (`be43dab`) |
| **AURA-009** | Next approved task | Not started |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- ~~**AURA-005** → remove `zod`, `server-only`~~ ✅ done
- ~~**AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`~~ ✅ done
- ~~**AURA-008** → remove `next-intl`~~ ✅ done
- **AURA-006 deferred** → `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` — keep until first component that uses them (Phase 2+)
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

## Notes for AURA-008 (merged ✅)

- Merge commit: `be43dab feat: add localized homepage shell and smoke test`
- PR #9 squash-merged to `develop`. Feature branch deleted.
- Original implementation commit: `6df46d0` (on deleted feature branch, for reference only)
- `/` → `/en` redirect via explicit 301 in `src/middleware.ts` (`NextResponse.redirect(..., 301)`).
- `/en` homepage shell uses all AURA luxury-dark design token classes.
- Playwright smoke unskipped; 2 tests: 301 status + location header check; `/en` loads without error.
- CI `e2e` job active; installs Chromium only; runs `--project=chromium`.
- `develop` branch protection updated: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL` all required.
- `next-intl` removed from Knip allowlist (now genuinely imported).

---

## Notes for AURA-009

- Confirm task from `docs/TASKS_Project.md` before starting.
- AURA-008 is merged; AURA-009 may start in a new session.

---

## Notes for AURA-101 (Supabase helpers, Phase 1)

- Wires `@supabase/ssr` + `@supabase/supabase-js` — remove from Knip allowlist.
- The service-role helper must `import 'server-only'` and is covered by `no-client-to-service-role`.
- Server client should consume `getServerEnv()` from `src/lib/config/env.ts` — **remove the `entry` declaration for `env.ts` from `knip.jsonc`** once it has a real importer.

---

## Do Not Do Yet

- ~~Do not start AURA-009 before AURA-008 merges~~ ✅ AURA-008 merged
- Do not fix audit without explicit dep-change approval
- Do not create migrations
- Do not create `.env` / `.env.local` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
- Do not implement UI components (deferred to Phase 2)
- Do not load fonts via next/font without explicit task approval
