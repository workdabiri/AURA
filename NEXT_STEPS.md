# Next Steps

**Updated:** 2026-06-17
**Current Phase:** Phase 1 — in progress. AURA-101 merged at `95f9df3`. AURA-102 merged at `3657e4f`. **AURA-103 (RLS policies) is IMPLEMENTED on `feat/aura-103-rls-policies` — NOT merged.** AURA-104 is next, not started.

---

## Immediate Next Action

**AURA-103 (RLS policies) is implemented on `feat/aura-103-rls-policies` and awaiting Opus 4.8 review + merge.** All local gates pass (`quality` exit 0; gated `test:dal` 41, `test:security` 43; `db reset` clean). **Opus 4.8 review is REQUIRED before merge** (RLS is a P0 security boundary). Do not merge to `develop` until Opus review passes and GitHub required checks are green.

Once AURA-103 merges: **AURA-104 (auth flow + `user_profiles` role checks + admin bootstrap script, D-40)** is the next task — not started. AURA-104 completes the application-layer authenticated negatives deferred from AURA-103 (session-but-no-profile → blocked; profile-but-no-role → 403) and must set `enable_signup = false` for production (D-40).

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

## Task Status

### Phase 0 — Complete

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

### Phase 1 — In Progress

| Task | Description | Status |
|---|---|---|
| ~~**AURA-101**~~ | Supabase local stack + client/server/service-role helpers | ✅ merged (`95f9df3`) |
| ~~**AURA-102**~~ | Initial migration — core MVP tables | ✅ merged (`3657e4f`) |
| **AURA-103** | RLS policies for all sensitive tables | ⏳ Implemented on `feat/aura-103-rls-policies`, NOT merged — gates green; Opus 4.8 review required before merge |
| **AURA-104** | Auth flow + super-admin bootstrap | Not started |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- ~~**AURA-005** → remove `zod`, `server-only`~~ ✅ done
- ~~**AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`~~ ✅ done
- ~~**AURA-008** → remove `next-intl`~~ ✅ done
- **AURA-006 deferred** → `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` — keep until first component that uses them (Phase 2+)
- ~~**AURA-101** → remove `@supabase/ssr`, `@supabase/supabase-js`~~ ✅ done (merged `95f9df3`)
- **AURA-102+** → remove `src/lib/supabase/client.ts`, `server.ts`, `service-role.ts` Knip entries as DAL callers are added. (AURA-102 is migration-only and adds no DAL caller, so these entries remain. AURA-102 added `ignore: ["src/types/database.ts"]` and `ignoreBinaries: ["supabase"]` for the generated types file + global CLI.)
- **AURA-106 / Phase 3** → remove `resend`
- **Phase 2–3 (forms)** → remove `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js`
- **Phase 2+ (data/state)** → remove `@tanstack/react-query`, `zustand`
- **Phase 5 (motion)** → remove `gsap`, `framer-motion`
- **Observability (Phase 6)** → remove `@sentry/nextjs`, `@vercel/analytics`
- `eslint-config-next`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` — used via FlatCompat but untraceable by Knip; keep until ESLint config is updated.

### Knip `entry` debt (AURA-101 update)
- ~~`env.ts` entry~~ ✅ Removed in AURA-101 — real importer exists via `server.ts` and `service-role.ts`.
- `client.ts`, `server.ts`, `service-role.ts` entries added in AURA-101 — remove per helper as first DAL caller is wired (AURA-102+).

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

## Notes for AURA-101 (Supabase helpers — MERGED ✅)

- Merge commit: `95f9df3 feat: add Supabase helpers and local stack`
- PR #11 squash-merged to `develop`. Feature branch `feat/aura-101-supabase-stack` deleted.
- Opus 4.8 review: **APPROVE** — no blocking issues; non-blocking notes only (see CURRENT_STATE.md).
- Supabase CLI 2.106.0 (Homebrew) + Docker 29.5.3: local-stack verified — `supabase start/status/stop` PASS; `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (5/5).
- Key decisions:
  - `getServerEnv()` called in `createSupabaseServerClient()` — validates full server env before any Supabase call
  - `CookieOptions` imported from `@supabase/ssr` for explicit `setAll` parameter typing (TypeScript strict mode)
  - service-role.ts first line is `import 'server-only'` — enforced by security test + dep-cruiser

## Notes for AURA-102 (MERGED ✅)

- Merge commit: `3657e4f feat: add initial MVP database migration` (full SHA `3657e4fd1d2686bab6d6dcf95261a2f184ac9787`)
- PR #13 squash-merged to `develop`. Feature branch `feat/aura-102-initial-migration` deleted.
- Opus 4.8 review: **APPROVE** — merge recommendation **YES**, no blocking issues. Post-review `db:types` reproducibility / failure-safety fixes completed before merge.
- Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.
- Summary: 11 MVP tables; 17 native PostgreSQL enums; generated `src/types/database.ts`; failure-safe `db:types` script; RLS enabled on all 11 tables; **0 RLS policies**; no seed data; no auth; no API routes; no UI.
- No `clients` table, no `client_id` (D-05 merge blocker); no raw IP columns in event tables (D-18/D-51).
- Knip helper entries (`client.ts`, `server.ts`, `service-role.ts`) remain — AURA-102 is migration-only and added no DAL caller; remove per helper as DAL callers are added.

---

## Do Not Do Yet

- ~~Do not start AURA-009 before AURA-008 merges~~ ✅ AURA-008 merged
- Do not fix audit without explicit dep-change approval
- Do not author the AURA-103 RLS-policy migration in this session — AURA-103 requires a new session + explicit per-task approval (migration task)
- Do not create `.env` / `.env.local` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
- Do not implement UI components (deferred to Phase 2)
- Do not load fonts via next/font without explicit task approval
