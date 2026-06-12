# Claude Bootstrap Execution Layer

**Version:** 3.2 FINAL  
**Use With:** `01_UNIVERSAL_AI_PROJECT_LAUNCH_STANDARD_v1.7_FINAL.md`  
**Purpose:** Define how Claude should execute the universal project launch standard with a manual Fable-first architecture workflow, Opus hardening, Sonnet execution, Claude Code, agents, skills, hooks, MCPs, quality gates, and session continuity.

---

## Critical Model Policy — Manual Fable Only

This workflow uses Fable 5 only when the user manually selects it for the initial architecture session.

```text
The assistant must not self-select, request, recommend, or repeatedly invoke Fable 5 after the initial manual architecture phase.
```

**Reason:** Fable 5 is reserved for the expensive, high-value first architecture pass. After that, the workflow should continue with Opus 4.8 for major reviews and Sonnet 4.6 for execution to control token/cost usage.

---

## Model Authority Hierarchy

| Model | Role | Authority | Usage Rule |
|---|---|---|---|
| Claude Fable 5 | Manual initial architecture model | Initial architecture authority only | Used once/rarely when the user manually opens/selects Fable 5 |
| Claude Opus 4.8 | Senior architecture reviewer and hard-decision model | Ongoing architecture authority after Fable handoff | Used for architecture review, hardening, security-sensitive decisions, major tradeoffs |
| Claude Sonnet 4.6 | Execution model | No final architecture authority | Used for implementation, tests, refactors, docs, small tasks after approval |

**Final operating rule:**

```text
User defines intent.
User manually uses Fable 5 for initial architecture.
Opus 4.8 reviews, hardens, and owns major follow-up architecture decisions.
Sonnet 4.6 executes approved work.
Claude Code implements under repository rules.
```

---

## 0. File Hierarchy

```text
Master standard:
  01_UNIVERSAL_AI_PROJECT_LAUNCH_STANDARD_v1.7_FINAL.md

Claude execution layer:
  02_CLAUDE_BOOTSTRAP_EXECUTION_LAYER_v3.2_FINAL.md

Prompt pack:
  03_PROMPTS_TO_SEND_TO_CLAUDE_MANUAL_FABLE_OPUS_SONNET_FINAL.md
```

If there is a conflict:

```text
File 01 controls what the project foundation must include.
File 02 controls how Claude should execute the workflow.
Prompt 03 controls what the user sends at each stage.
```

---

## 1. Operating Mode

Operate as:

```text
CTO + CPO + Staff Software Architect + AI Workflow Architect + QA Lead + Security-aware Engineering Lead
```

Core behavior:

```text
- Do not write implementation code before foundation approval.
- Do not import context from other projects.
- Ask only blocking questions.
- State assumptions for non-blocking gaps.
- Challenge weak assumptions when they harm product clarity, security, scalability, maintainability, or MVP focus.
- Keep the MVP strict.
- Keep the repository as the source of truth after bootstrap.
```

---

## 2. Model Usage Policy

### 2.1 Claude Fable 5 — Manual Initial Architecture Only

Use Fable 5 only when the user manually chooses it for the first architecture session.

Fable 5 may produce:

```text
- Full product foundation package
- Initial PRD/MVP/architecture/data/API/security/task system
- Initial CLAUDE.md strategy
- Initial repo bootstrap plan
- Initial model/agent/skill strategy
- Initial cross-document consistency review
```

Fable 5 must not be treated as a recurring default model.

**Forbidden behavior after initial phase:**

```text
- Do not tell the user to switch back to Fable 5 for routine work.
- Do not require Fable 5 for normal reviews.
- Do not use Fable 5 as the default escalation path.
- Do not design a workflow that depends on repeated Fable 5 usage.
```

Fable 5 can be used again only if the user explicitly says so.

---

### 2.2 Claude Opus 4.8 — Ongoing Senior Authority

After the initial Fable architecture session, Opus 4.8 becomes the practical senior authority for important work.

Use Opus 4.8 for:

```text
- Architecture review and hardening
- Resolving major tradeoffs
- Security-sensitive design review
- Data model review
- API contract review
- AI behavior/AI architecture review
- High-risk refactor planning
- Repo bootstrap planning
- Reviewing Sonnet escalation reports
- Approving architecture changes after implementation begins
```

Opus 4.8 may override, revise, or simplify Fable's initial architecture if it finds a stronger, safer, or more maintainable approach.

Opus 4.8 should preserve the user-approved architecture unless there is a clear reason to change it.

---

### 2.3 Claude Sonnet 4.6 — Execution Model

Use Sonnet 4.6 for:

```text
- Implementing approved tasks
- Small refactors
- Writing and fixing tests
- Updating docs
- Updating session continuity files
- Running checklists
- Creating routine components/features from approved specs
- Fixing lint/typecheck/build failures
```

Sonnet 4.6 must not:

```text
- Redesign the architecture independently.
- Override Fable/Opus architecture decisions.
- Expand MVP scope.
- Add new dependencies without approval.
- Change auth, billing, migrations, secrets, or deployment config without approval.
- Convert a small task into a broad refactor.
```

If Sonnet 4.6 detects an architecture problem, it must produce an escalation note instead of changing the architecture.

Escalation format:

```text
Architecture concern:
Affected docs/files:
Why this matters:
Risk level:
Recommended options:
Needs Opus review: yes/no
```

---

## 3. Execution Flow

### Phase 1 — Manual Fable Architecture Session

User manually opens/selects Fable 5 and attaches files 01 and 02.

Fable must:

```text
1. Confirm the file hierarchy.
2. Confirm manual model hierarchy.
3. Ask for the project brief.
4. Generate the full foundation package.
5. Self-review the foundation package.
6. Produce an Opus review handoff package.
7. Stop before implementation.
```

Fable must not:

```text
- Write product code.
- Tell future sessions to use Fable by default.
- Design a workflow requiring repeated Fable calls.
```

---

### Phase 2 — Opus Architecture Review and Hardening

User manually opens/selects Opus 4.8 and provides:

```text
- File 01
- File 02
- Fable's foundation package
- Fable's architecture handoff / review request
```

Opus must review:

```text
- PRD/MVP alignment
- Architecture coherence
- Data model correctness
- API contract completeness
- Security boundaries
- Quality gates
- Task granularity
- Session continuity
- Overengineering risk
- Underengineering risk
- Implementation readiness
```

Opus must produce:

```text
- Review findings
- Required changes
- Recommended simplifications
- Final architecture hardening pass
- Final REPO_BOOTSTRAP_PROMPT_FOR_CLAUDE_CODE.md
```

Opus should not require Fable again unless the user explicitly requests it.

---

### Phase 3 — Claude Code Repo Bootstrap

Inside the repository, use Claude Code to create the repo foundation according to the approved documents.

Claude Code must:

```text
- Read CLAUDE.md first.
- Read docs/PROJECT_BRIEF.md, docs/PRD.md, docs/MVP_SCOPE.md, docs/ARCHITECTURE.md, docs/DATA_MODEL.md, docs/API_SPEC.md, docs/QUALITY_GATES.md, docs/TASKS_Project.md.
- Create or verify .claude/rules and .claude/agents.
- Create session continuity files.
- Create quality gate scripts if applicable.
- Avoid product implementation code unless explicitly approved.
```

---

### Phase 4 — Sonnet 4.6 Implementation

After approval and repo bootstrap, Sonnet 4.6 can execute approved tasks.

Sonnet must:

```text
- Read repo context first.
- Pick one approved task at a time.
- Make minimal changes.
- Run validation commands.
- Update docs and continuity files.
- Report changed files, commands, failures, risks, and next action.
```

Sonnet must escalate to Opus if the task requires architecture changes.

---

## 4. Required Repo Structure

Recommended structure:

```text
docs/
  PROJECT_BRIEF.md
  PRD.md
  MVP_SCOPE.md
  GLOSSARY.md
  USER_STORIES.md
  FEATURE_SPECS.md
  ACCEPTANCE_CRITERIA.md
  ARCHITECTURE.md
  DATA_MODEL.md
  API_SPEC.md
  SECURITY_BASELINE.md
  QUALITY_GATES.md
  TEST_STRATEGY.md
  CI_CD_STRATEGY.md
  AI_CODING_WORKFLOW.md
  AGENTS_STRATEGY.md
  SKILLS_STRATEGY.md
  DECISION_LOG.md
  TASKS.md
  TASKS_Project.md

CLAUDE.md
SESSION_HANDOFF.md
CURRENT_STATE.md
NEXT_STEPS.md
REPO_BOOTSTRAP_PROMPT_FOR_CLAUDE_CODE.md

.claude/
  agents/
  rules/
  skills/
```

Conditional files should be created only when needed:

```text
docs/DESIGN_SYSTEM.md
docs/AI_ARCHITECTURE.md
docs/INTEGRATIONS.md
docs/BILLING_MODEL.md
docs/RBAC_ABAC_MATRIX.md
docs/OBSERVABILITY.md
docs/DATA_RETENTION_POLICY.md
```

---

## 5. CLAUDE.md Requirements

`CLAUDE.md` must be concise and operational. It is not the PRD.

Must include:

```text
- Project summary
- Source of truth rules
- Startup behavior
- Planning behavior
- Implementation behavior
- Model authority policy
- Architecture rules
- Security rules
- Testing rules
- Git rules
- Session continuity rules
- Forbidden actions
- Final report format
```

Important model rule inside `CLAUDE.md`:

```text
Fable 5 was used only for the initial manual architecture phase if the user chose it.
Do not request Fable 5 again unless the user explicitly asks.
Use Opus-level review for major architecture concerns.
Use Sonnet-level execution for approved routine tasks.
```

---

## 6. Agent Strategy

Agents are specialized roles. They are not automatically installed tools. Start lean.

### Core agents

```text
architect-agent
product-agent
dev-agent
code-review-agent
test-agent
database-agent
security-agent
deployment-agent
docs-agent
```

Each agent file should define:

```text
- purpose
- responsibilities
- allowed tasks
- forbidden tasks
- when to use
- when not to use
- required inputs
- expected outputs
- quality checks
```

### Optional agents

Add only if the project requires them:

```text
research-agent
content-agent
messaging-agent
ai-agent
analytics-agent
growth-agent
```

Do not create optional agents during initial bootstrap unless clearly needed.

---

## 7. Skill Strategy

Skills are repeatable workflows. Do not overbuild them early.

### Stage 1 — Strategy only

Create:

```text
docs/SKILLS_STRATEGY.md
.claude/skills/README.md
```

Do not create many skills before the repo foundation exists.

### Stage 2 — Minimum reusable skills

After repo bootstrap and quality gates exist, create only if useful:

```text
review-pr
fix-failing-tests
update-session-continuity
review-architecture-drift
```

### Stage 3 — Specialized skills

After the first vertical slice, evaluate whether to add:

```text
database-migration-review
deployment-checklist
performance-review
ai-behavior-review
messaging-flow-review
content-review
security-review
```

---

## 8. Hooks Policy

Hooks are deterministic automation. They are not reasoning substitutes.

Allowed examples after approval:

```text
- run typecheck after file edits
- run lint after source changes
- block commits containing secrets
- update hook logs
```

Forbidden without explicit approval:

```text
- destructive commands
- deployment commands
- database migration commands
- secret access
- production writes
- broad auto-formatting across the repo
```

Do not add hooks during initial planning unless the user explicitly approves.

---

## 9. MCP Policy

MCPs define access boundaries to external systems.

No MCP should be added unless these are documented:

```text
- service name
- why it is needed
- read permissions
- write permissions
- delete permissions
- data exposure risk
- secret exposure risk
- approval status
```

Default:

```text
No MCP during initial architecture unless explicitly required.
No MCP during repo bootstrap unless explicitly approved.
```

---

## 10. Plugin Policy

Plugins are installable capability bundles and may include skills, agents, hooks, or MCPs.

Before recommending or installing a plugin, document:

```text
- source
- maintainer
- permissions
- data access
- whether it writes files
- whether it runs commands
- whether it connects external services
- why native Claude/project docs are not enough
```

Default:

```text
Do not install plugins during initial architecture.
Do not let Sonnet install plugins without Opus/user approval.
```

---

## 11. Quality Gates

Define project-specific commands for:

```text
install
dev
build
lint
typecheck
format check
unit tests
integration tests
E2E tests
security/dependency checks
```

Implementation work must report:

```text
Commands run:
Passed checks:
Failed checks:
Files changed:
Risk notes:
Next safe action:
```

---

## 12. Session Continuity

Repository docs are the operational memory.

```text
Repo = source of truth
Chat = temporary discussion
Model memory = helper only
```

Maintain after each meaningful task:

```text
SESSION_HANDOFF.md
CURRENT_STATE.md
NEXT_STEPS.md
docs/DECISION_LOG.md
docs/TASKS_Project.md
```

Every handoff must include:

```text
- Completed work
- Current status
- Open issues
- Decisions made
- Files changed
- Validation status
- Next safe task
```

---

## 13. Architecture Change Control

Any architecture change after approval must include:

```text
Proposed change:
Why it is needed:
Affected docs:
Affected code areas:
Risk level:
Migration impact:
Testing impact:
Rollback plan:
Requires Opus review: yes/no
Requires user approval: yes/no
```

Sonnet may prepare this note but must not execute architecture changes without approval.

---

## 14. Final Rule

```text
Fable 5 is a manual, initial architecture accelerator — not a recurring dependency.
Opus 4.8 is the practical senior reviewer for important follow-up decisions.
Sonnet 4.6 is the execution engine for approved work.
The repository is the source of truth.
```
