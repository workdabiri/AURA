# AURA — Skills README

**Stage:** Stage 1 (bootstrap) — Strategy and index only. No gate skills created yet.  
**Source:** Pack §34; File 02 §7; `docs/SKILLS_STRATEGY.md`

---

## What Are Skills

Skills are repeatable, structured workflows for Claude Code. They are:
- Definition files that describe a workflow, not installed tools
- Not MCPs, plugins, hooks, or third-party services
- Created in `.claude/skills/` as Markdown definition files

---

## Stage Policy

Skills are introduced in stages to avoid overbuilding early.

| Stage | Condition | Content |
|---|---|---|
| Stage 1 | Bootstrap (now) | This README only. No gate skills. |
| Stage 2 | After foundation + quality gates exist | Minimum reusable skills (see below) |
| Stage 3 | After first vertical slice ships | Specialized skills (see below) |

**Do not create any skill files beyond this README until Stage 2 conditions are met.**

---

## Stage 2 Skills (Not Yet Created)

Create these after the repo foundation and quality gates are working:

| Skill | Purpose |
|---|---|
| `review-pr` | Run architecture, security, and test gate checks on the current PR |
| `fix-failing-tests` | Diagnose and fix failing tests without changing scope |
| `update-session-continuity` | Update SESSION_HANDOFF, CURRENT_STATE, NEXT_STEPS after a task |
| `review-architecture-drift` | Check for boundary violations using dependency-cruiser |

---

## Stage 2 — Six Review Gate Skills (Not Yet Created)

These match pack §34 and must not be created until Stage 2.

| Skill File | Purpose |
|---|---|
| `skill-01-project-decision-gate.md` | Enforce D-01–D-51; block scope creep; block SaaS drift |
| `skill-02-architecture-quality-gate.md` | Enforce dependency boundaries, i18n fields, route structure |
| `skill-03-security-data-gate.md` | Verify RLS, auth, storage, stakeholder visibility |
| `skill-04-test-qa-gate.md` | Verify test coverage against task acceptance criteria |
| `skill-05-real-estate-product-gate.md` | Validate real estate UX, conversion flow, Sales Demo Mode |
| `skill-06-github-pr-merge-gate.md` | Inspect PR, verify checks, enforce merge policy |

All six skills enforce decisions D-01 to D-51 (not D-50 — the stale range from earlier pack versions).

---

## Stage 3 Skills (Future)

Evaluate after first vertical slice ships:
- `database-migration-review`
- `deployment-checklist`
- `performance-review`
- `security-review`

---

## Skills Not Created

The following are explicitly not created:
- Any skill that requires MCP installation
- Any billing-related skills (BILLING_MODEL is intentionally omitted; one-time delivery model D-23)
- Optional agent skills

---

## To Activate a Skill

When a skill file is created (Stage 2+), invoke it in a session by referencing the skill file or using a `/skill-name` command if configured. Skills are not auto-activated.
