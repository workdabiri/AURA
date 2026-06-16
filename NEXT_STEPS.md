# Next Steps

**Updated:** 2026-06-16
**Current Phase:** Phase 1 — in progress. AURA-101 merged to `develop` at `95f9df3`. AURA-102 is next.

---

## Immediate Next Action

**Start AURA-102 (initial migration) in a new session.**

AURA-101 is merged: squash-merged PR #11 at `95f9df3`. Feature branch deleted.

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
| **AURA-102** | Initial migration — core MVP tables | Not started |
| **AURA-103** | RLS policies for all sensitive tables | Not started |
| **AURA-104** | Auth flow + super-admin bootstrap | Not started |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- ~~**AURA-005** → remove `zod`, `server-only`~~ ✅ done
- ~~**AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`~~ ✅ done
- ~~**AURA-008** → remove `next-intl`~~ ✅ done
- **AURA-006 deferred** → `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` — keep until first component that uses them (Phase 2+)
- ~~**AURA-101** → remove `@supabase/ssr`, `@supabase/supabase-js`~~ ✅ done (merged `95f9df3`)
- **AURA-102+** → remove `src/lib/supabase/client.ts`, `server.ts`, `service-role.ts` Knip entries as DAL callers are added
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

## Notes for AURA-102 (next task after AURA-101 merges)

- Requires explicit per-task approval (migration task — see CLAUDE.md).
- Branch: `feat/aura-102-initial-migration`
- No `clients` table, no `client_id` (D-05 merge blocker)
- No raw IP columns in event tables (D-18/D-51)
- RLS ENABLE on all sensitive tables (policies in AURA-103)
- Remove one or more Knip entries for supabase helpers as DAL callers are added

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
