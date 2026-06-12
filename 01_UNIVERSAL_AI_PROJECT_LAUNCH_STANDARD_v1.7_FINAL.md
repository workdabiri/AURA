# Universal AI-Assisted Project Launch Standard

**Version:** 1.7 FINAL  
**Document Type:** Project-agnostic pre-project operating standard  
**Use With:** `02_CLAUDE_BOOTSTRAP_EXECUTION_LAYER_v3.2_FINAL.md`  
**Purpose:** Master standard for product foundation, architecture, documentation, task planning, quality gates, and session continuity before starting any software project.  
**Model Policy:** This file remains model-agnostic. Model selection, model authority, Claude Code workflow, agents, skills, hooks, MCPs, plugins, and implementation sequencing are defined only in file 02.

---

## Quick Reference — Execution Order

```text
1. Load this file + file 02
2. Receive the project brief
3. Produce the full pre-project foundation package
4. Self-review as CTO/CPO/Architect/QA/Security lead
5. Wait for user approval
6. Create the repo bootstrap prompt
7. Hand off to Claude Code / implementation only after approval
```

**Non-negotiable rule:**

```text
Architecture → Documentation → Repo foundation → Implementation
Never skip ahead. Never write product code before foundation approval.
```

---

## 1. File Hierarchy

```text
Master standard — what must exist:
  01_UNIVERSAL_AI_PROJECT_LAUNCH_STANDARD_v1.7_FINAL.md

Claude execution layer — how Claude should execute it:
  02_CLAUDE_BOOTSTRAP_EXECUTION_LAYER_v3.2_FINAL.md

Prompt pack — what the user should send at each stage:
  03_PROMPTS_TO_SEND_TO_CLAUDE_MANUAL_FABLE_OPUS_SONNET_FINAL.md
```

**Conflict rule:**

```text
File 01 controls product foundation, architecture deliverables, documentation, task planning, quality gates, and governance.
File 02 controls Claude-specific model flow, agent strategy, skill strategy, hooks, MCPs, plugins, and Claude Code behavior.
File 03 is only the user-facing prompt pack.
```

---

## 2. Required AI Behavior

**Act as:**

```text
CTO + CPO + Staff Software Architect + AI Workflow Architect + QA Lead + Security-aware Engineering Lead
```

**Always do:**

```text
- Ask only blocking questions.
- State assumptions for non-blocking gaps and continue.
- Treat the user's goals, constraints, preferences, risks, and business context as inputs, not as final architecture.
- Synthesize architecture from product value, technical constraints, security, scalability, maintainability, and MVP discipline.
- Keep MVP scope strict: the smallest useful version that proves the core workflow.
- Treat the repository as the source of truth after repo bootstrap.
- Prefer explicit repo docs over chat history or model memory.
- Keep documents consistent with each other.
- Escalate high-risk decisions before implementation.
```

**Never do:**

```text
- Write product implementation code before foundation approval.
- Create abstractions before a concrete need exists.
- Expand MVP without explicit approval.
- Add tools, dependencies, MCPs, plugins, hooks, or third-party skills without explicit approval.
- Touch secrets, .env files, auth, billing, database migrations, or production deployment without explicit approval.
- Rely on chat history as the source of truth.
- Import assumptions from previous or unrelated projects.
```

---

## 3. Project Brief Input

Ask for or receive these fields. Mark unknown fields as `TBD` and continue unless the gap is blocking.

```text
Project name:
One-line description:
Target users:
Buyer / decision maker, if different:
Main problem:
Core use case:
Business model:
MVP goal:
Included in MVP:
Out of scope for MVP:
Preferred stack:
Database:
Auth:
Hosting / deployment:
AI features, if any:
Integrations:
Admin / internal users:
Roles and permissions:
Data sensitivity:
Security constraints:
Compliance constraints:
Performance expectations:
Scale assumptions:
Languages / localization:
Design expectations:
Timeline:
Budget / resource constraints:
Known risks:
Success metrics:
```

**Clarification rule:**

```text
Ask only questions that block a correct architecture.
For non-blocking gaps, declare assumptions and continue.
```

---

## 4. Required Foundation Package

After receiving the project brief, produce the following package before implementation.

### 4.1 Core Product Docs

```text
docs/PROJECT_BRIEF.md
docs/PRD.md
docs/MVP_SCOPE.md
docs/GLOSSARY.md
docs/USER_STORIES.md
docs/FEATURE_SPECS.md
docs/ACCEPTANCE_CRITERIA.md
```

### 4.2 Core Technical Docs

```text
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/API_SPEC.md
docs/SECURITY_BASELINE.md
docs/QUALITY_GATES.md
docs/TEST_STRATEGY.md
docs/CI_CD_STRATEGY.md
```

### 4.3 AI-Assisted Development Docs

```text
docs/AI_CODING_WORKFLOW.md
docs/AGENTS_STRATEGY.md
docs/SKILLS_STRATEGY.md
docs/DECISION_LOG.md
docs/TASKS.md
docs/TASKS_Project.md
```

### 4.4 Operational Continuity Files

```text
CLAUDE.md
SESSION_HANDOFF.md
CURRENT_STATE.md
NEXT_STEPS.md
REPO_BOOTSTRAP_PROMPT_FOR_CLAUDE_CODE.md
```

### 4.5 Conditional Docs

Create these only if relevant to the project:

```text
docs/DESIGN_SYSTEM.md                 # if UI/product design is relevant
docs/AI_ARCHITECTURE.md               # if AI behavior is part of the product
docs/INTEGRATIONS.md                  # if external systems are part of the product
docs/BILLING_MODEL.md                 # if monetization/billing is part of the product
docs/RBAC_ABAC_MATRIX.md              # if roles/permissions are meaningful
docs/OBSERVABILITY.md                 # if monitoring/logging/error tracking is required
docs/DATA_RETENTION_POLICY.md         # if sensitive or customer data is stored
```

---

## 5. Document Requirements

### 5.1 `docs/PROJECT_BRIEF.md`

Must contain:

```text
- Product summary
- Target users
- Core problem
- Core workflow
- MVP goal
- Business model
- Main constraints
- Known unknowns
- Assumptions
```

### 5.2 `docs/PRD.md`

Must contain:

```text
- Product vision
- User personas
- Problem statement
- Jobs to be done
- Functional requirements
- Non-functional requirements
- Success metrics
- Risks
- Out-of-scope items
```

### 5.3 `docs/MVP_SCOPE.md`

Must contain:

```text
- MVP definition
- Included features
- Excluded features
- First vertical slice
- Release criteria
- Future phases
```

### 5.4 `docs/ARCHITECTURE.md`

Must contain:

```text
- System overview
- Frontend architecture
- Backend architecture
- Domain boundaries
- Data flow
- Auth/authz model
- Integration boundaries
- AI boundaries, if any
- Deployment architecture
- Major tradeoffs
- Architecture risks
```

### 5.5 `docs/DATA_MODEL.md`

Must contain:

```text
- Core entities
- Relationships
- Ownership model
- Data sensitivity
- Indexing assumptions
- Migration strategy
- Retention/deletion assumptions
```

### 5.6 `docs/API_SPEC.md`

Must contain:

```text
- Endpoint list
- Request/response contracts
- Error model
- Auth requirements
- Rate limiting assumptions
- Validation rules
- Versioning assumptions
```

### 5.7 `docs/QUALITY_GATES.md`

Must contain:

```text
- Lint checks
- Type checks
- Format checks
- Unit tests
- Integration tests
- E2E tests, if relevant
- Build checks
- Security checks
- Dependency checks
- Release checklist
```

### 5.8 `docs/TASKS_Project.md`

Tasks must be written as small, verifiable units:

```text
Task ID:
Title:
Goal:
Scope:
Out of scope:
Files likely to change:
Acceptance criteria:
Validation commands:
Risks:
Dependencies:
Status:
```

---

## 6. MVP Discipline

The MVP must prove the core value proposition with the smallest safe implementation.

**Do:**

```text
- Prioritize the first complete vertical slice.
- Build only what is required for validation.
- Keep future ideas in Future Phases, not MVP.
- Prefer boring, stable architecture unless the domain requires otherwise.
```

**Do not:**

```text
- Build every possible role, integration, admin feature, or automation in v1.
- Add microservices before scale requires them.
- Add AI features without a clear product role.
- Add abstraction layers only because they may be useful later.
```

---

## 7. Architecture Principles

```text
- Clear boundaries over cleverness.
- Explicit contracts over implicit behavior.
- Simple vertical slices over large rewrites.
- Testable design over hidden coupling.
- Security and data ownership designed early.
- Repo documentation is part of the product engineering system.
```

The architecture must explicitly answer:

```text
- What are the core domains?
- What owns each piece of data?
- Where does business logic live?
- What should never be handled on the client?
- What are the trust boundaries?
- What is safe to defer?
- What would be expensive to change later?
```

---

## 8. Quality Gates

Before implementation begins, define commands or expected checks for:

```text
- install
- dev
- build
- lint
- typecheck
- format check
- unit tests
- integration tests
- E2E tests, if applicable
- security/dependency checks
```

No merge/release should be considered valid unless the quality gates pass or the failure is explicitly documented and approved.

---

## 9. Security Baseline

Security must be defined before implementation.

Must cover:

```text
- Secrets handling
- Environment variables
- Authentication
- Authorization
- Role/permission model
- Input validation
- Output encoding
- Rate limits
- Database access boundaries
- Audit logging, if relevant
- Sensitive data handling
- Dependency risk
```

Forbidden without explicit approval:

```text
- Touching .env or secrets
- Changing auth flows
- Changing billing/payment logic
- Changing database migrations
- Changing production deployment config
- Adding third-party services with data access
```

---

## 10. Session Continuity

After repo bootstrap, the repository is the source of truth.

```text
Repo docs = source of truth
Chat history = not source of truth
Claude memory = helper only, not source of truth
```

Maintain:

```text
SESSION_HANDOFF.md
CURRENT_STATE.md
NEXT_STEPS.md
docs/DECISION_LOG.md
docs/TASKS_Project.md
```

Every session handoff must include:

```text
- Current status
- Completed tasks
- Open tasks
- Decisions made
- Files changed
- Known issues
- Validation status
- Next safe action
```

---

## 11. Repo Bootstrap Requirements

Before product implementation, create or verify:

```text
CLAUDE.md
docs/
.claude/rules/
.claude/agents/               # only core agent definitions, not overbuilt
SESSION_HANDOFF.md
CURRENT_STATE.md
NEXT_STEPS.md
package scripts / quality commands
initial task files
```

Do not install MCPs, plugins, hooks, or third-party skills during initial bootstrap unless explicitly approved.

---

## 12. Final Pre-Implementation Review

Before implementation starts, perform a final review:

```text
- Does PRD match MVP scope?
- Does architecture support the MVP without overengineering?
- Does data model support required workflows?
- Does API spec match user stories and feature specs?
- Are quality gates executable?
- Are security boundaries explicit?
- Are tasks small and verifiable?
- Are session continuity files present?
- Are out-of-scope items clearly excluded?
```

If any answer is weak, revise the foundation package before implementation.

---

## 13. Final Rule

```text
The AI may help design, review, and execute.
The repository remains the operational source of truth.
No model memory, chat history, or assumption may override the approved project docs.
```
