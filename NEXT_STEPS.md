# Next Steps

**Updated:** 2026-06-13  
**Current Phase:** Phase 0 — AURA-004 executed, awaiting Opus review / commit approval

---

## Immediate Next Action

**User/Opus reviews AURA-004 and approves commit**, then:

1. Commit `feat/aura-004-architecture-boundaries`
2. Open PR to `develop` (Opus review required before merge)
3. Squash merge to `develop`

---

## Audit Status — Unchanged

`npm run audit` passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings via `next@15` internal postcss. Documented exception — no action required.

---

## After AURA-004 Merge

Execute Phase 0 tasks in order:

| Task | Description | Opus Review |
|---|---|---|
| **AURA-005** | Environment schema + `.env.example` (no secrets) | **Required** |
| **AURA-006** | Design tokens + Tailwind + `luxury-dark` theme tokens | Not required |
| **AURA-007** | GitHub Actions CI + CodeQL + branch protection documentation | Required |
| **AURA-008** | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | Not required |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- **AURA-005** → remove `zod`
- **AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- **AURA-008** → remove `next-intl`
- **AURA-101** → remove `@supabase/ssr`, `@supabase/supabase-js`, `server-only`
- **AURA-106 / Phase 3** → remove `resend`
- **Phase 2–3 (forms)** → remove `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js`
- **Phase 2+ (data/state)** → remove `@tanstack/react-query`, `zustand`
- **Phase 5 (motion)** → remove `gsap`, `framer-motion`
- **Observability (Phase 6)** → remove `@sentry/nextjs`, `@vercel/analytics`
- `eslint-config-next`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` — used now via FlatCompat but untraceable by Knip; keep until the ESLint config no longer hides them.

---

## Notes for AURA-005

- Opus review required before merge (secrets boundary + service-role rule).
- Wires `zod` (env schema) — remove `zod` from the Knip allowlist as part of AURA-005.
- `.env.example` only — never a real `.env`. Service-role / `RATE_LIMIT_SALT` are server-only (merge blocker).
- `api-route-requires-validation` now accepts `src/lib/validation` imports — AURA-005 may place shared env/Zod schemas under `src/lib/validation`.

---

## Notes for AURA-008

- `src/tests/e2e/smoke.spec.ts` is wired with `test.describe.skip` — enable by removing skip and implementing the actual test assertions once `/en` routing exists.
- Playwright webServer config in `playwright.config.ts` already set to start `npm run dev` locally.

---

## Do Not Do Yet

- Do not start AURA-005 before AURA-004 merges
- Do not fix audit without explicit dep-change approval
- Do not create migrations
- Do not create `.env` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
