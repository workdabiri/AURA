# AURA — AI Coding Workflow

**Source:** Pack §18  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Standard Workflow

```
Idea / Requirement
  → Update Control Pack if architecture changed
  → Create Task in docs/TASKS_Project.md
  → AI Planning Prompt (plan only, no code)
  → Implementation Branch (feature/<task-id>-<slug>)
  → Code + Tests
  → Local Quality Gates (npm run quality)
  → PR to develop
  → AI Review + Human Review
  → All Gates Pass? → Squash Merge to develop
  → Manual Release to main
```

---

## Model Authority

| Model | Role | When to Use |
|---|---|---|
| Fable 5 | Initial architecture only (used once) | Do not request again unless user explicitly asks |
| Opus 4.8 | Senior reviewer; major decisions | Architecture review, security decisions, RLS design, tradeoff resolution, change to D-01–D-51 |
| Sonnet 4.6 | Execution | Approved tasks, tests, docs updates, lint fixes, small refactors |

**Sonnet must escalate when it detects an architecture concern. It must not redesign architecture independently.**

Escalation format:
```
Architecture concern:
Affected docs/files:
Why this matters:
Risk level:
Recommended options:
Needs Opus review: yes/no
```

---

## AI Planning Prompt Template

```
You are implementing AURA from the approved AURA Optimized Project Control Pack.

Do not write code yet.
First, create an implementation plan for the task below.

Task:
[PASTE TASK]

Rules:
- Enforce all locked decisions D-01 to D-51.
- Do not introduce clients/client_id/multi-tenant SaaS architecture.
- Preserve src/domain, src/dal, src/services, src/components boundaries.
- Use TypeScript strict, Zod validation, Supabase RLS, and tests.
- Identify files likely affected.
- Identify acceptance criteria.
- Identify required tests.
- Identify security risks.
- Identify anything out of scope.

Return:
1. Understanding
2. Implementation plan
3. Files likely affected
4. Data/RLS changes, if any
5. Test plan
6. Risks
7. Confirmation that no locked decisions are violated
```

---

## AI Implementation Prompt Template

```
Implement the approved AURA task below.

Task:
[PASTE TASK]

Use the approved plan:
[PASTE PLAN]

Implementation rules:
- Keep changes minimal and task-scoped.
- Follow src/domain, src/dal, src/services, src/components boundaries.
- Add or update tests required by the task.
- Do not add unapproved scope.
- Do not introduce clients/client_id.
- Do not expose secrets or service-role key client-side.
- Do not allow public reads of leads, WhatsApp analytics, internal stakeholders, or draft/archived properties.
- Use Zod for request validation.
- Use typed responses.
- Keep public UI text localization-ready.
- Respect performance and motion constraints.

After implementation, run or report:
- npm run lint
- npm run typecheck
- npm run format:check
- npm run test
- npm run unused
- npm run deps:check
- npm run build

Return:
1. Summary of changes
2. Files changed
3. Tests added/updated
4. Commands run and results
5. Remaining risks or limitations
6. Confirmation that locked decisions were preserved
```

---

## AI Code Review Prompt Template

```
Review this PR against the AURA Optimized Project Control Pack.

Review areas:
- product scope
- architecture boundaries
- RLS/security
- data model
- API validation
- test coverage
- real estate UX
- performance/motion
- code quality
- merge readiness

Block the PR if it introduces:
- clients/client_id
- shared production database model
- SaaS billing or tenant routing
- public lead reads
- public WhatsApp analytics reads
- public internal stakeholder reads
- draft/archived public property reads
- service role in client code
- unsafe legal HTML
- IP storage in whatsapp_clicks by default
- business logic inside UI components

Return:
1. Verdict: APPROVE / REQUEST_CHANGES / BLOCK
2. Blocking issues
3. Non-blocking issues
4. Missing tests
5. Security concerns
6. Suggested fix prompts
```

---

## PR Requirements

Every PR must include:
- Task ID (e.g., `AURA-042`)
- Summary of changes
- Files changed list
- Acceptance criteria checklist (checked/unchecked)
- Test evidence (command output or screenshots)
- Screenshots for UI changes
- Security/RLS notes if relevant
- Known limitations
- Gate results (`npm run quality` output)

---

## Change Control (After Approval)

Any change to D-01–D-51 requires:
1. Explicit user approval
2. Update to `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md` (or successor)
3. Update to `docs/DECISION_LOG.md`
4. Opus review if security/architecture is affected

**Changes requiring specific gate reviews:**
- Auth, RLS, storage, legal, lead data, WhatsApp tracking → Security/Data Gate review
- Homepage, listing, property detail, CTAs, Sales Demo Mode → Real Estate Product Gate review
- Design tokens, motion, layout system → Design System/Architecture review
- Merge behavior → GitHub PR/Merge Gate review

---

## Forbidden Agent Behaviors

Sonnet 4.6 must not:
- Redesign architecture independently
- Override Fable/Opus architecture decisions
- Expand MVP scope
- Add new dependencies without approval
- Change auth, billing, migrations, secrets, or deployment config without approval
- Convert a small task into a broad refactor
- Write product/UI code before `docs/TASKS_Project.md` exists and is approved

---

## Session Startup Checklist

Before starting any implementation session:
1. Read `CLAUDE.md`
2. Read `CURRENT_STATE.md` and `NEXT_STEPS.md`
3. Read relevant `docs/` section for the domain being touched
4. Pick one approved task from `docs/TASKS_Project.md`
5. Confirm the task and plan with the user
6. Begin implementation

---

## Task Template Reference

See `docs/TASKS_Project.md` §19.1 task template. Every task must list:
- Allowed files/areas
- Forbidden files/areas
- Acceptance criteria
- Test plan (unit, DAL, integration, E2E, security negative, accessibility where UI)
- Required commands
- Migration/rollback note (if DB changes)
- Definition of done
- Out of scope items
