# AURA — Branch Protection Runbook

**Source:** Pack §18.2 + A-01 · `docs/CI_CD_STRATEGY.md` (Branch Strategy, Required Branch Protection Rules) · `CLAUDE.md` (Git Rules, Forbidden Actions)
**Task:** AURA-007 (GitHub Actions CI + CodeQL + branch protection documentation)
**Status:** Documentation only. Branch protection is a **manual GitHub repository setting** — it cannot be applied from repository code. A human with admin rights must configure it in GitHub before auto-merge is permitted.

---

## Why this is a runbook, not code

Branch protection lives in GitHub repository settings (Settings → Branches → Branch protection rules, or the equivalent Rulesets UI / API), not in the repository. Per `CLAUDE.md`:

> Auto-merge allowed into `develop` only after branch protection + required checks exist.

So these rules must be applied **once, manually**, after the AURA-007 workflows have run at least once (GitHub only offers a status check as "required" after it has been seen on a PR/commit).

---

## Branch model (recap — `docs/CI_CD_STRATEGY.md`)

| Branch | Purpose | Merge Policy |
|---|---|---|
| `main` | Production-only | **Manual only; never auto-merge** |
| `develop` | Integration branch | Auto-merge allowed **only after** protection + required checks exist |
| `feature/<task-id>-<slug>` | One task per branch | PR → `develop` |
| `fix/<issue-id>-<slug>` | Bug/security fix | PR → `develop` |
| `release/<version>` | Release preparation | Manual → `main` |

---

## Required status checks

These names must exactly match the GitHub Actions **job names** so they can be selected as required checks.

| Check (job name) | Workflow file | Required? |
|---|---|---|
| `quality` | `.github/workflows/ci.yml` | **Yes** — merge blocker |
| `analyze` | `.github/workflows/codeql.yml` | **Yes** — CodeQL; merge blocker |
| `e2e` | `.github/workflows/ci.yml` (currently **disabled**) | Not yet — add when **AURA-008** enables Playwright |
| `lighthouse-advisory` | `.github/workflows/lighthouse.yml` (currently **disabled**) | **No** — advisory only; never a required check (enabled non-blocking in **AURA-206**) |

> The `quality` job decomposes the full gate (lint, typecheck, format:check, unit/dal/integration/security tests, deps:check, unused, build, `npm audit --audit-level=high`) into named steps. A single required check (`quality`) therefore gates the entire `npm run quality` set plus audit; step names reveal which gate failed.

---

## Protection rules for `develop`

Configure a branch protection rule (or Ruleset) targeting `develop` with:

- [ ] **Require a pull request before merging**
  - [ ] Require **at least 1 approving review**
  - [ ] **Dismiss stale pull request approvals when new commits are pushed**
- [ ] **Require status checks to pass before merging**
  - [ ] **Require branches to be up to date before merging**
  - [ ] Required checks: **`quality`**, **`analyze`**
- [ ] **Require conversation resolution before merging** (recommended)
- [ ] **Do not allow force pushes**
- [ ] **Do not allow deletions**
- [ ] Apply the above to administrators (recommended — "Include administrators" / "Do not bypass")

**Auto-merge:** GitHub auto-merge may be enabled for PRs into `develop` **only after** the rule above exists and the required checks have passed. Squash merge to `develop` (`CLAUDE.md` Git Rules).

---

## Protection rules for `main`

`main` is production-only and **never auto-merged** (`CLAUDE.md` Forbidden Actions, `docs/CI_CD_STRATEGY.md`).

- [ ] **Require a pull request before merging** (manual merge only; no auto-merge)
  - [ ] Require **at least 1 approving review**
  - [ ] **Dismiss stale approvals on new commits**
- [ ] **Require status checks to pass before merging**
  - [ ] Required checks: **`quality`**, **`analyze`**
- [ ] **Do not allow force pushes**
- [ ] **Do not allow deletions**
- [ ] **Restrict who can push** to release managers (recommended)
- [ ] **Disable auto-merge** for `main` (manual promotion from `release/<version>` only)

---

## One-time setup order

1. Open a PR from `feat/aura-007-ci-codeql` → `develop` so `ci.yml` and `codeql.yml` run once and their job names (`quality`, `analyze`) become selectable.
2. Add the `develop` protection rule above; select `quality` and `analyze` as required checks.
3. Add the `main` protection rule above.
4. Only now enable auto-merge into `develop` (squash). `main` stays manual.

---

## Notes & phasing

- **Opus review:** AURA-007 (this CI/security-gate work) requires **Opus 4.8 review before merge** (`docs/TASKS_Project.md` Model Assignment). The required-review setting above is the mechanism that enforces a human sign-off; Opus review is that sign-off for sensitive tasks.
- **AURA-008** unskips the Playwright smoke test and enables the `e2e` job — add `e2e` as a required check then.
- **AURA-206** enables the Lighthouse advisory job (non-blocking) — it remains **excluded** from required checks until the production release gate (`docs/CI_CD_STRATEGY.md` "Lighthouse Timing").
- **AURA-107** attaches the Dockerized Supabase local stack to the DAL/integration/security steps (A-02) — the `quality` check name does not change.
- **No secrets** are required for `ci.yml` or `codeql.yml` (CodeQL uses the built-in `GITHUB_TOKEN`). Production/deploy secrets and Vercel configuration are explicitly out of scope for AURA-007.
