# Next Steps

**Updated:** 2026-06-13  
**Current Phase:** Phase 0 — AURA-001 executed, awaiting commit approval

---

## Immediate Next Action

**User approves AURA-001 commit**, then:

1. Commit `feat/aura-001-repo-scaffold` with the scaffold files
2. Open PR to `develop`
3. Resolve the `npm run audit` vulnerability decision (see below)

---

## Audit Status — Resolved

`npm run audit` now passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings are both via `next@15`'s internal postcss bundle; the only npm-suggested fix is a destructive Next downgrade to 9.3.3. Documented exception — no action required.

**AURA-001 + AURA-001a are audit-clean and ready for commit approval.**

---

## After AURA-001 Commit + Merge

Execute Phase 0 tasks in order:

| Task | Description | Opus Review |
|---|---|---|
| **AURA-002** | ESLint + Prettier + quality script wiring | Not required |
| **AURA-003** | Testing stack — Vitest + Playwright harness | Not required |
| **AURA-004** | Architecture boundary enforcement — dependency-cruiser + Knip | Required |
| **AURA-005** | Environment schema + `.env.example` (no secrets) | Required |
| **AURA-006** | Design tokens + Tailwind + `luxury-dark` theme tokens | Not required |
| **AURA-007** | GitHub Actions CI + CodeQL + branch protection documentation | Required |
| **AURA-008** | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | Not required |

---

## Notes for AURA-002

- The existing `.eslintrc.json` uses legacy format. With ESLint 9, `next lint` emits a deprecation notice but passes. AURA-002 should migrate to the flat config (`eslint.config.js`) or document the legacy format decision.
- `@typescript-eslint/recommended-requiring-type-checking` is renamed in v8 to `recommended-type-checked` — verify in AURA-002.

## Notes for AURA-003

- `vitest.config.ts` `include` paths point to root-level `tests/` but AURA-001 created `src/tests/`. AURA-003 must reconcile this — either update `vitest.config.ts` to point to `src/tests/` or move the scaffold directories.
- Same issue with `playwright.config.ts` `testDir: './tests/e2e'`.
- Package.json scripts (`vitest tests/unit` etc.) also need to match the resolved location.

---

## Do Not Do Yet

- Do not start AURA-002 before AURA-001 commits
- Do not fix audit without explicit dep-change approval
- Do not create migrations
- Do not create `.env` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
