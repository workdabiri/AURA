# CLAUDE.md — AURA Repository Operating Rules

**Read this file first on every session before doing anything else.**

---

## Project Summary

AURA is a reusable private real estate website engine. It is not SaaS, not multi-tenant, not a property portal. Each client deployment is a fully isolated Vercel + Supabase + domain instance. The flagship demo brand is **AUTEX Estates Dubai** (fictional, noindex).

**Source of truth hierarchy:**
```
Repository docs > chat history > model memory
```
Repo docs are authoritative. Chat history and model memory are helpers only. Never let model memory override what is written here.

---

## Model Authority Policy

```
Fable 5 was used once, manually, for the initial architecture phase. Do not request or
recommend Fable 5 again unless the user explicitly asks. Opus 4.8 reviews major architecture,
security, and tradeoff decisions. Sonnet 4.6 executes approved tasks only and escalates
architecture concerns instead of changing them. The repository is the source of truth.
```

---

## Non-Negotiable Rules (Merge Blockers)

```
- Never introduce a `clients` table, a `client_id` column, shared production DB, or tenant
  routing (D-05; merge blocker).
- No public admin self-signup; first super_admin via Supabase Auth + seed/admin script (D-40).
- Service-role key is server-only; never in the client bundle.
- No raw IP in event/analytics tables; rate-limit keys use salted-hash(IP+route) (D-18, D-51).
- No unsafe/raw legal HTML; Markdown or sanitized controlled rich text only (D-12).
- Enforce locked decisions D-01 to D-51.
- Auto-merge only into `develop`, never `main`, and only after branch protection + required
  checks exist.
- Do not touch .env/secrets, auth, billing, migrations, or production deploy config without
  explicit approval.
```

---

## Startup Behavior

On every session:
1. Read this file.
2. Read `CURRENT_STATE.md` and `NEXT_STEPS.md`.
3. If implementation work: read the relevant `docs/` file for the domain being touched.
4. Pick one approved task from `docs/TASKS_Project.md` and confirm it before starting.
5. Never start work without a task reference.

---

## Planning Behavior

- Do not generate `docs/TASKS_Project.md` without user approval.
- Do not redesign architecture independently — escalate to Opus.
- Do not expand MVP scope. Scope changes require explicit user approval + pack update.
- Do not create agents, skills, hooks, MCPs, or plugins without explicit approval.
- Escalation format (use when Sonnet detects an architecture concern):

```
Architecture concern:
Affected docs/files:
Why this matters:
Risk level:
Recommended options:
Needs Opus review: yes/no
```

---

## Implementation Behavior

- Implement one approved task at a time.
- Make minimal changes scoped to the task.
- Do not add unapproved scope, abstractions, or dependencies.
- After each task: run quality commands and update continuity files.
- Required quality commands:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run format:check`
  - `npm run test` (where applicable)
  - `npm run deps:check`
  - `npm run build` (where applicable)

---

## Architecture Rules

- Dependency direction: `app/routes → components → domain → dal/services → lib/config`
- No DAL importing UI. No domain importing React. No UI querying Supabase directly.
- No client components importing service-role helpers.
- All API handlers require Zod validation.
- Business rules live in `domain/`, not in JSX.
- i18n-ready: use JSONB fields for translatable content, `/en/...` route prefix.
- Design system is token-based; admin cannot mutate template architecture via settings.

---

## Security Rules

- All sensitive tables require RLS. Public access is allowlisted, never default-open.
- Public reads: published properties, active areas, published legal pages only.
- Public inserts: leads (rate-limited + validated), whatsapp_clicks (no PII).
- Admin routes require: valid session + `user_profiles.role` check + RLS compliance.
- Service-role key: server-only, never in client bundle.
- Rate-limit keys: `salted-hash(IP + route)` server-side; raw IP never stored.
- Legal content: Markdown or sanitized rich text; never raw HTML.
- Media uploads: validate file type, size, path; UUID-based paths; no enumeration.
- Stakeholder data: `internal_only` by default; public visibility must be explicit.

---

## Testing Rules

- No task is done until required gates pass.
- Required tests per task: unit + DAL + integration where applicable.
- Security negative tests required for any auth/RLS/data-boundary task.
- E2E tests for public pages and admin workflows.
- Test DB: Supabase CLI local stack (dev and CI Docker) — no mocking the DB layer.

---

## Git Rules

- Branch naming: `feature/<task-id>-<slug>`, `fix/<issue-id>-<slug>`, `release/<version>`.
- PRs go to `develop`. `main` is production-only, never auto-merged.
- Auto-merge allowed into `develop` only after branch protection + required checks exist.
- Every PR must include: task ID, summary, acceptance criteria checklist, test evidence, gate results.
- Squash merge to `develop`. Manual-only release to `main`.

---

## Session Continuity Rules

- After every meaningful task: update `SESSION_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md`.
- Update `docs/DECISION_LOG.md` when a decision changes.
- Update `docs/TASKS_Project.md` when task status changes.
- Every handoff must include: completed work, current status, open issues, files changed, validation status, next safe action.

---

## Forbidden Actions

- Writing product/UI/implementation code before `docs/TASKS_Project.md` exists and is approved.
- Running `npm install` or modifying `package-lock.json` without explicit approval.
- Creating or modifying `.env` files or secrets.
- Installing MCPs, plugins, hooks, or third-party skills without explicit approval.
- Creating the six review-gate skills (Stage 2 only).
- Introducing `clients`, `client_id`, or any tenant routing model.
- Generating `docs/TASKS_Project.md` without user approval.
- Auto-merging to `main`.
- Force-pushing any branch.
- Touching auth flows, billing, migrations, or production deploy config without explicit approval.

---

## Final Report Format (Required After Each Task)

```
Commands run:
Files created/changed:
Tests added/updated:
Carry-forward fixes applied:
Rules enforced:
Skipped intentionally:
Merge-blocker rules in place: yes/no
Open items / ambiguity:
Next safe action:
```
