# Next Steps

**Updated:** 2026-06-13  
**Current Phase:** Phase 0 — AURA-003 executed, awaiting commit approval

---

## Immediate Next Action

**User approves AURA-003 commit**, then:

1. Commit `feat/aura-003-testing-stack`
2. Open PR to `develop`

---

## Audit Status — Unchanged

`npm run audit` passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings via `next@15` internal postcss. Documented exception — no action required.

---

## After AURA-003 Commit + Merge

Execute Phase 0 tasks in order:

| Task | Description | Opus Review |
|---|---|---|
| **AURA-004** | Architecture boundary enforcement — dependency-cruiser + Knip | **Required** |
| **AURA-005** | Environment schema + `.env.example` (no secrets) | Required |
| **AURA-006** | Design tokens + Tailwind + `luxury-dark` theme tokens | Not required |
| **AURA-007** | GitHub Actions CI + CodeQL + branch protection documentation | Required |
| **AURA-008** | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | Not required |

---

## Notes for AURA-004

- Opus review required before merge (architecture boundary enforcement is a merge-blocker mechanism)
- `.dependency-cruiser.cjs` stub is already in place from AURA-001; needs rules wired for the forbidden import directions
- `knip.json` or knip config in `package.json` needs to be finalized
- AURA-003 harness tests should remain passing after AURA-004 boundary checks

---

## Notes for AURA-008

- `src/tests/e2e/smoke.spec.ts` is wired with `test.describe.skip` — enable by removing skip and implementing the actual test assertions once `/en` routing exists
- Playwright webServer config in `playwright.config.ts` already set to start `npm run dev` locally

---

## Do Not Do Yet

- Do not start AURA-004 before AURA-003 commits
- Do not fix audit without explicit dep-change approval
- Do not create migrations
- Do not create `.env` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
