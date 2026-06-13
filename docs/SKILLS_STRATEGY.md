# AURA — Skills Strategy

**Source:** Pack §34 (staged per file 02 §7)  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`  
**Carry-forward fix applied:** CF-1 — decision range updated to D-01 to D-51 (not D-50)

---

## Skills Definition

Skills are repeatable, structured workflows for Claude Code. They are **not** MCPs, plugins, hooks, or third-party tools. Skills require no installation beyond creating their definition files.

---

## Stage Policy

Skills are introduced in stages to avoid overbuilding early.

| Stage | When | What |
|---|---|---|
| Stage 1 (now — bootstrap) | Repo foundation exists | Strategy doc + `.claude/skills/README.md` only. No gate skills created. |
| Stage 2 | After foundation and quality gates exist | Minimum reusable skills (review-pr, fix-failing-tests, update-session-continuity, review-architecture-drift) |
| Stage 3 | After first vertical slice ships | Specialized skills as needed |

**Do not create Stage 2 or Stage 3 skills during bootstrap.** The six review-gate skills are Stage 2.

---

## Six Review Gate Skills (Stage 2 — Not Yet Created)

These are defined here for planning. Do not create or activate during bootstrap.

### Skill 01 — Project Decision Gate

**Purpose:** Prevent scope creep; enforce D-01 to D-51; block multi-tenant/SaaS drift.

**Blocks:**
- `clients` / `client_id` introduction
- SaaS MVP architecture
- Active Arabic MVP
- Raw legal HTML
- WhatsApp PII tracking
- Unauthorized scope expansion

**Scope gate checks D-01 to D-51** (not D-50 — the old range was stale and has been corrected here per the Opus review).

---

### Skill 02 — Architecture Quality Gate

**Purpose:** Preserve clean architecture boundaries.

**Checks:**
- Public/admin/API separation maintained
- Domain/DAL boundaries respected (dependency-cruiser)
- Config/settings split correct
- i18n JSONB fields used where required
- `/en/...` routes structure correct
- Design system boundaries respected
- Empty/loading/error states present on data-driven UI

---

### Skill 03 — Security and Data Gate

**Purpose:** Verify RLS, auth, storage, and data boundaries.

**Checks:**
- RLS policies present on all sensitive tables
- Role-based admin access enforced (session + profile role + RLS)
- Storage policies correct (admin-only write, public-read for published only)
- Public/private access boundaries respected
- Legal content safe rendering enforced
- WhatsApp tracking has no PII
- Stakeholder visibility is `internal_only` by default

---

### Skill 04 — Test and QA Gate

**Purpose:** Enforce test strategy.

**Checks:**
- Required unit/DAL/integration/security tests exist for the task
- Acceptance criteria are covered
- Smoke tests pass
- Security negative tests pass

Default: review-only unless task explicitly includes test implementation.

---

### Skill 05 — Real Estate Product Gate

**Purpose:** Prevent generic SaaS look; validate real estate UX.

**Checks:**
- Conversion flow intact: homepage → listing → detail → CTA
- WhatsApp CTA routing correct
- Property detail UX correct
- Sales Demo Mode activation correct
- Mobile sticky CTA present
- Empty/error states present

---

### Skill 06 — GitHub PR and Merge Gate

**Purpose:** Inspect PR state; verify checks; block unsafe merge.

**Commands used:**
```bash
git status
git branch --show-current
git diff --stat origin/develop...HEAD
git diff --name-only origin/develop...HEAD
gh pr view --json title,body,state,baseRefName,headRefName,mergeable,reviewDecision,commits,files,checks
gh pr checks
```

**Auto-merge allowed only into `develop` when all rules pass:**
```bash
gh pr merge --squash --auto --delete-branch
```

Never auto-merge to `main`.

---

## Stage 2 Minimum Reusable Skills

After quality gates and repo foundation exist:

| Skill | Purpose |
|---|---|
| `review-pr` | Run architecture, security, and test gate checks on the current PR |
| `fix-failing-tests` | Diagnose and fix failing tests without changing scope |
| `update-session-continuity` | Update SESSION_HANDOFF, CURRENT_STATE, NEXT_STEPS after a task |
| `review-architecture-drift` | Check for boundary violations using dependency-cruiser |

---

## Stage 3 Specialized Skills

After first vertical slice, evaluate:
- `database-migration-review`
- `deployment-checklist`
- `performance-review`
- `security-review`

---

## Skills That Are Not Created

BILLING_MODEL skills are not created (one-time delivery model, D-23).

Optional agents (research-agent, content-agent, etc.) are not created at bootstrap.
