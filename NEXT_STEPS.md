# Next Steps

**Updated:** 2026-06-14  
**Current Phase:** Phase 0 — AURA-005 executed, awaiting Opus review / commit approval

---

## Immediate Next Action

**User/Opus reviews AURA-005 and approves commit**, then:

1. Commit `feat/aura-005-env-schema`
2. Open PR to `develop` (Opus review required before merge — secrets boundary + service-role rule)
3. Squash merge to `develop`

---

## Audit Status — Unchanged

`npm run audit` passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings via `next@15` internal postcss. Documented exception — no action required.

---

## After AURA-005 Merge

Execute Phase 0 tasks in order:

| Task | Description | Opus Review |
|---|---|---|
| **AURA-006** | Design tokens + Tailwind + `luxury-dark` theme tokens | Not required |
| **AURA-007** | GitHub Actions CI + CodeQL + branch protection documentation | Required |
| **AURA-008** | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | Not required |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- ~~**AURA-005** → remove `zod`, `server-only`~~ ✅ **done** (`zod` used by `env.schema.ts`, `server-only` by `env.ts`)
- **AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- **AURA-008** → remove `next-intl`
- **AURA-101** → remove `@supabase/ssr`, `@supabase/supabase-js`
- **AURA-106 / Phase 3** → remove `resend`
- **Phase 2–3 (forms)** → remove `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js`
- **Phase 2+ (data/state)** → remove `@tanstack/react-query`, `zustand`
- **Phase 5 (motion)** → remove `gsap`, `framer-motion`
- **Observability (Phase 6)** → remove `@sentry/nextjs`, `@vercel/analytics`
- `eslint-config-next`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` — used now via FlatCompat but untraceable by Knip; keep until the ESLint config no longer hides them.

### Knip `entry` debt (AURA-005)
- `knip.jsonc` declares `entry: ["src/lib/config/env.ts"]` because the server env accessor has no runtime caller yet (and cannot be test-imported — it pulls in `server-only`). **AURA-101 must remove this entry** once a server module imports `getServerEnv()`.

---

## Notes for AURA-006

- Wires the Tailwind/PostCSS pipeline + design tokens (`luxury-dark`) — remove the 8 Tailwind/PostCSS deps above from the Knip allowlist as each is actually imported/used.
- Token-based design system only; no component implementation. Admin cannot mutate template architecture (D-21).
- Keep `deps:check`, `unused`, and all preservation gates green.

---

## Notes for AURA-101 (Supabase helpers, Phase 1)

- Wires `@supabase/ssr` + `@supabase/supabase-js` — remove from Knip allowlist.
- The service-role helper must `import 'server-only'` and is covered by `no-client-to-service-role`.
- Server client should consume `getServerEnv()` from `src/lib/config/env.ts` — **remove the `entry` declaration for `env.ts` from `knip.jsonc`** once it has a real importer.

---

## Notes for AURA-008

- `src/tests/e2e/smoke.spec.ts` is wired with `test.describe.skip` — enable by removing skip and implementing the actual test assertions once `/en` routing exists.
- Playwright webServer config in `playwright.config.ts` already set to start `npm run dev` locally.

---

## Do Not Do Yet

- Do not start AURA-006 before AURA-005 merges
- Do not fix audit without explicit dep-change approval
- Do not create migrations
- Do not create `.env` / `.env.local` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
