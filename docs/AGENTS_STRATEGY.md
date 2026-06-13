# AURA — Agents Strategy

**Source:** File 02 §6 lean core set  
**Authority:** `02_CLAUDE_BOOTSTRAP_EXECUTION_LAYER_v3.2_FINAL.md`

---

## Core Agent Set

Only the nine core agents are created at bootstrap. Optional agents (research-agent, content-agent, messaging-agent, analytics-agent, growth-agent) are not created unless the project explicitly requires them.

Agents are specialized roles for Claude Code sessions. They are not automatically installed tools. Each agent definition file lives in `.claude/agents/`.

---

## Agents Created at Bootstrap

| Agent | Purpose |
|---|---|
| `architect-agent` | Architecture review and escalation |
| `product-agent` | Product scope and MVP discipline |
| `dev-agent` | Implementation of approved tasks |
| `code-review-agent` | PR/code review against pack rules |
| `test-agent` | Test writing and gate verification |
| `database-agent` | Data model, migrations, RLS |
| `security-agent` | Security review and RLS audit |
| `deployment-agent` | CI/CD, Vercel, Supabase deployment |
| `docs-agent` | Documentation maintenance |

---

## Agent File Structure

Each agent file defines:
- `purpose`
- `responsibilities`
- `allowed_tasks`
- `forbidden_tasks`
- `when_to_use`
- `when_not_to_use`
- `required_inputs`
- `expected_outputs`
- `quality_checks`

See `.claude/agents/` for individual agent definition files.

---

## Model Authority Within Agents

All agents operate under the model policy:
- Sonnet 4.6: executes approved tasks
- Opus 4.8: reviews architecture concerns escalated by Sonnet
- Fable 5: not used again unless explicitly requested by user

Agents must not redesign architecture, expand MVP scope, or override locked decisions D-01–D-51.

---

## Optional Agents (Not Created)

These are documented here for completeness. Do not create without explicit user approval:

| Agent | Condition for Creation |
|---|---|
| `research-agent` | If research workflows are needed |
| `content-agent` | If content creation is a regular workflow |
| `messaging-agent` | If WhatsApp/email automation is in scope |
| `analytics-agent` | If advanced analytics is a regular task |
| `growth-agent` | If growth/marketing campaigns are in scope |
