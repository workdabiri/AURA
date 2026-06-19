# Next Steps

**Updated:** 2026-06-20
**Current Phase:** Phase 1 — in progress. AURA-101 merged at `95f9df3`. AURA-102 merged at `3657e4f`. AURA-103 merged at `1a35958`. **AURA-104 merged at `44a7fd4`.** **AURA-105 (storage bucket policies + media path strategy) merged at `fae3d62`.** `develop` is the source of truth at `fae3d62`. AURA-106 is next, not started.

---

## Immediate Next Action

**AURA-105 (storage bucket policies + media path strategy) is MERGED** into `develop` at `fae3d62`. Opus 4.8 APPROVE; required checks green; feature branch deleted.

**Immediate next action — AURA-106 discovery / planning (NOT implementation).** AURA-106 (rate_limits cleanup job / pg_cron, D-51) is the next task — **not started**. It is a migration task and touches security boundaries (rate-limit key strategy, D-18/D-51 merge blocker), so it **requires a new session + explicit per-task approval before any work begins**. The next safe step is to read `docs/TASKS_Project.md` (AURA-106), `docs/SECURITY_BASELINE.md` (rate-limit rules), and `.claude/rules/no-raw-ip-in-events.md` to scope the task — then surface it for approval. Do not write code, migrations, or config in advance of that approval. Branch (when approved): `feature/aura-106-rate-limit-cleanup`.

**Carry-forward / open items still in force:**
- **Live storage catalog/behavioural tests are local-only** (`SUPABASE_LOCAL_TESTS=1`) until AURA-107 wires the Dockerized stack into CI. AURA-304 is the first real importer of the media/storage modules — remove their Knip `entry` lines then. **Public-read bucket limitation** (retained URL fetchable after unpublish/archive) is documented + deferred (signed URLs out of MVP).
- **Runner decision (seed-admin, non-blocking follow-up):** executing `scripts/seed-admin.ts` needs a TS runner resolving `@/*` + the `server-only` guard; none added (no `tsx`/`ts-node` in repo). Decide between approving `tsx` + a `seed:admin` script, or a `node --conditions=react-server` + path-alias loader. Pure logic + DB effect are already test-covered. Accepted by Opus as non-blocking at AURA-104 merge.
- **Production `enable_signup = false` (D-40):** hosted-Supabase deployment/config requirement. Local `config.toml` stays `true` (unchanged); the app-layer guard rejects any non-admin session.
- **Minimal-return for anon inserts (AURA-301+):** anon has INSERT but **no SELECT** on `leads` / `whatsapp_clicks`, so those anon inserts must use **minimal-return behavior** (returning the inserted row would fail the RLS read).
- **AURA-107 still needed:** live guard/seed/RLS/storage integration tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until AURA-107 wires the Dockerized Supabase stack into CI.

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
| ~~**AURA-103**~~ | RLS policies for all sensitive tables | ✅ merged (`1a35958`) |
| ~~**AURA-104**~~ | Auth guard + super-admin bootstrap | ✅ merged (`44a7fd4`) |
| ~~**AURA-105**~~ | Storage bucket policies + media path strategy | ✅ merged (`fae3d62`) |
| **AURA-106** | rate_limits cleanup job / pg_cron | Not started — next; requires a new session + per-task approval |

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

### Knip `entry` debt
- ~~`env.ts` entry~~ ✅ Removed in AURA-101 — real importer exists via `server.ts` and `service-role.ts`.
- ~~`server.ts` entry~~ ✅ Removed in AURA-104 — now statically imported by `src/services/auth/guard.ts`.
- `client.ts`, `service-role.ts` entries remain — `client.ts` has no Client Component consumer yet; `service-role.ts` is only **dynamically** imported by `scripts/seed-admin.ts`, so its entry is retained until a server DAL op imports it statically.
- `src/services/auth/guard.ts`, `src/services/auth/index.ts`, `scripts/seed-admin.ts` entries added in AURA-104 — remove the guard/index entries when the first admin Route Handler / admin layout (AURA-301) imports the guard.
- `src/domain/properties/media.ts`, `src/services/storage/policy.ts` entries added in AURA-105 — remove when the media upload route (AURA-304) becomes their first real importer.

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

## Notes for AURA-103 (RLS policies — MERGED ✅)

- Merge commit: `1a35958 feat: add RLS policies for MVP tables` (full SHA `1a35958ccf658b6918474b5b1d51b6c5de37be75`)
- PR #15 squash-merged to `develop` (now the source of truth). Feature branch `feat/aura-103-rls-policies` deleted.
- Opus 4.8 review: **APPROVE** — merge recommendation **YES**, no blocking issues.
- Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.
- Summary: new RLS migration (AURA-102 init untouched); **3 role-check helper functions** (`current_user_role`/`is_admin`/`is_super_admin`); **36 policies across 10 tables**; **0 policies on `rate_limits`** (service-role only); least-privilege GRANT layer (REVOKE ALL then per-role DML); **no anon policy on `property_stakeholders`** (deferred to AURA-203); **no DELETE policy on `properties`** (hard delete is service-role-only); RLS stays **enabled on all 11 tables**; generated types updated with the 3 helper functions under `Functions`; DAL + security RLS tests added.
- **Carry-forward:** live RLS tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI.
- **Carry-forward for AURA-104:** anon has INSERT but no SELECT on `leads` / `whatsapp_clicks` — the route layer must use **minimal-return behavior** for those anon inserts.

---

## Do Not Do Yet

- ~~Do not start AURA-009 before AURA-008 merges~~ ✅ AURA-008 merged
- ~~Do not start AURA-104 in this session~~ ✅ AURA-104 merged (`44a7fd4`)
- ~~Do not start AURA-105~~ ✅ AURA-105 merged at `fae3d62`
- Do not fix audit without explicit dep-change approval
- Do not start AURA-106 — AURA-106 requires a new session + explicit per-task approval (migration / pg_cron)
- Do not create `.env` / `.env.local` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
- Do not implement UI components (deferred to Phase 2)
- Do not load fonts via next/font without explicit task approval
