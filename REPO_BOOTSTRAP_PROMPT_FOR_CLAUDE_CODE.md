# REPO_BOOTSTRAP_PROMPT_FOR_CLAUDE_CODE — AURA

**Produced by:** Opus 4.8 review/hardening session (Phase 2)
**Authority:** Final pre-implementation bootstrap prompt per file 01 §11 and file 02 Phase 3
**Verdict carried in:** `READY_FOR_TASKS` (no P0 blockers)
**Source of truth for content:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`
**Paste target:** Claude Code, inside an empty greenfield repository

---

## 0. Role and hard stop

You are Claude Code performing **repository foundation bootstrap only**. You scaffold
governance, documentation, rules, lean agents, continuity files, and quality-script
*definitions*. You do **not** write product/implementation code, do **not** install
dependencies, and do **not** install or configure MCPs, plugins, hooks, or third-party
skills.

When the foundation below exists and is committed, **STOP** and report. Implementation
begins only after the user generates `docs/TASKS_Project.md` and approves Phase 0.

---

## 1. Read before doing anything

1. Read this entire prompt.
2. Read `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md` fully — it is the project constitution.
3. Read files `01_UNIVERSAL_AI_PROJECT_LAUNCH_STANDARD_v1.7_FINAL.md` and
   `02_CLAUDE_BOOTSTRAP_EXECUTION_LAYER_v3.2_FINAL.md`.
4. After bootstrap, on every future session, read `CLAUDE.md` first.

---

## 2. What to create (and nothing more)

### 2.1 `CLAUDE.md` (root)

Concise and operational, not a copy of the pack. Must include: project summary; source-of-truth
rule (repo > chat > model memory); startup behavior; planning behavior; implementation behavior;
model authority policy; architecture rules; security rules; testing rules; git rules; session
continuity rules; forbidden actions; final-report format.

Embed this model-policy block **verbatim**:

```text
Fable 5 was used once, manually, for the initial architecture phase. Do not request or
recommend Fable 5 again unless the user explicitly asks. Opus 4.8 reviews major architecture,
security, and tradeoff decisions. Sonnet 4.6 executes approved tasks only and escalates
architecture concerns instead of changing them. The repository is the source of truth.
```

Embed these non-negotiable rules in `CLAUDE.md`:

```text
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

### 2.2 `docs/` decomposition (per pack §42.1)

Create each file by extracting from the pack section(s) listed. Do not invent new scope.

| `docs/` file | Source in pack |
|---|---|
| `PROJECT_BRIEF.md` / `PRD.md` / `MVP_SCOPE.md` | §2, §3, §5 |
| `GLOSSARY.md` | §11.1.1 + §3 |
| `USER_STORIES.md` / `FEATURE_SPECS.md` / `ACCEPTANCE_CRITERIA.md` | §7, §8, §14 |
| `ARCHITECTURE.md` | §9–10 |
| `DATA_MODEL.md` | §11 |
| `API_SPEC.md` | §13 |
| `SECURITY_BASELINE.md` + `RBAC.md` | §12 (+ §6) |
| `QUALITY_GATES.md` | §17 |
| `TEST_STRATEGY.md` | §16 |
| `CI_CD_STRATEGY.md` | §18.2 + assumption A-01 |
| `AI_CODING_WORKFLOW.md` | §18 |
| `SKILLS_STRATEGY.md` | §34 (staged per file 02 §7) |
| `AGENTS_STRATEGY.md` | file 02 §6 lean core set |
| `DECISION_LOG.md` | D-01–D-51 + Q-01–Q-15 + A-01–A-11 resolutions |
| `OBSERVABILITY.md` | §21 |
| `DATA_RETENTION.md` | §22.3 |
| `DESIGN_SYSTEM.md` | §15 |
| `TASKS_Project.md` | **NOT created at bootstrap** — generated after approval (see §6) |

`BILLING_MODEL.md` is intentionally omitted (one-time delivery, D-23).

### 2.3 Apply these carry-forward consistency fixes during decomposition

These are mandatory text corrections identified in Opus review. Apply them to the **docs you
author** (do not silently copy the stale strings out of the pack):

1. **Decision range:** every "D-01 to D-50" becomes **"D-01 to D-51"**. Specifically the scope
   gate (pack §34 Skill 01) and the review prompt (pack §39) carried the stale range — author
   `SKILLS_STRATEGY.md` and `DECISION_LOG.md` against **D-51**.
2. **Storage wording:** in `DATA_MODEL.md`, `property_media.url` = "public CDN URL in MVP; signed
   URLs deferred" — do not carry "signed URL depending visibility" (it contradicts §12.4 posture).
3. **Encode ratified assumptions that the pack left implicit:**
   - `DATA_MODEL.md`: slug is derived from `en` title, collision-suffixed, **immutable after
     publish** (A-06); AED-only display, no FX in MVP (A-11).
   - `API_SPEC.md`: pagination server cap = **50** (A-07).
   - `TEST_STRATEGY.md`: test DB = Supabase CLI local stack, dev + CI Docker (A-02).
4. **Lighthouse timing (R-02):** in `CI_CD_STRATEGY.md`, Lighthouse runs as an **advisory CI job
   from Phase 2** (first public pages), hard-gated at release — not first introduced at Phase 5.

### 2.4 `.claude/rules/`

Create rule files that machine-enforce the merge blockers (pack §12.6, §17.3): no
`clients`/`client_id`; no service-role in client bundle; no public lead/WhatsApp/stakeholder/
draft reads; no raw IP in event tables; no unsafe legal HTML; dependency-direction boundaries
(`app → components → domain → dal/services → lib/config`, pack §9.4).

### 2.5 `.claude/agents/` — lean core set only (file 02 §6)

Create definition files **only** for: `architect-agent`, `product-agent`, `dev-agent`,
`code-review-agent`, `test-agent`, `database-agent`, `security-agent`, `deployment-agent`,
`docs-agent`. Each defines: purpose; responsibilities; allowed tasks; forbidden tasks; when to
use / not use; required inputs; expected outputs; quality checks. **No optional agents.**

### 2.6 `.claude/skills/README.md` only

Per pack §42.3 and file 02 §7: at Stage 1 (this bootstrap) create the skills **strategy/README
only**. Do **not** create or activate the six review-gate skills yet — they are Stage 2, after
the foundation and quality gates exist. Skills are not MCPs/plugins/hooks.

### 2.7 Continuity files (file 01 §4.4)

Create `SESSION_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md` with initial content reflecting:
"foundation bootstrapped; no product code; next safe action = generate `docs/TASKS_Project.md`
Phase 0 slice."

### 2.8 Quality-script definitions (NOT execution)

Create `package.json` containing the scripts block from pack §17.2 and the config-file stubs they
reference (`.dependency-cruiser.cjs`, ESLint, Prettier, tsconfig strict, Vitest, Playwright
config). **Do not run `npm install`. Do not run the scripts. Do not add dependencies beyond
declaring them.** Dependency installation and tooling wiring are Phase 0 implementation tasks,
not bootstrap.

---

## 3. Forbidden during bootstrap

```text
- Product/implementation/UI code of any kind.
- Running npm install or adding/locking dependency versions beyond declaration.
- Creating .env, secrets, auth flows, migrations, or deploy config.
- Installing or configuring any MCP, plugin, hook, or third-party skill.
- Creating the six review-gate skills (Stage 2 only).
- Creating optional agents.
- Introducing clients/client_id/tenant model in any form, including "for future use".
- Generating docs/TASKS_Project.md (separate, user-approved step).
```

---

## 4. Definition of done for bootstrap

```text
- CLAUDE.md present with model-policy block + non-negotiable rules.
- docs/ decomposed per §2.2 with the §2.3 carry-forward fixes applied.
- DECISION_LOG.md records D-01–D-51, Q-01–Q-15 defaults, A-01–A-11 ratifications.
- .claude/rules present and aligned to merge blockers.
- .claude/agents contains exactly the 9 core agents.
- .claude/skills/README.md present; no gate skills created.
- Continuity files present.
- package.json scripts + config stubs present; nothing installed, nothing run.
- No product code. No secrets. No MCP/plugin/hook/third-party skill.
- Single bootstrap commit on a bootstrap branch (not main).
```

---

## 5. Required final report (file 02 §11 format)

```text
Commands run:
Files created:
Docs decomposed (with section sources):
Carry-forward fixes applied (1-4 from §2.3):
Rules created:
Agents created:
Skipped intentionally (gate skills, optional agents, installs, product code):
Merge-blocker rules in place: yes/no
Open items / anything ambiguous:
Next safe action:
```

---

## 6. After bootstrap — task generation gate (do not skip)

Once foundation is committed and reported, the user generates `docs/TASKS_Project.md`
(planning alias `TASKS_AURA.md`) per pack §19:

```text
- §19.1 task template (D-01→D-51 block, allowed/forbidden files, tests, rollback note).
- §19.2 phases. Phase 0 (foundation + gates + CI) FIRST.
- §19.3 first vertical slice: / → /en redirect, /en homepage shell, env schema, test stack,
  CI quality gate green, zero architecture-boundary violations.
- No cinematic/GSAP homepage work before quality gates and CI exist.
```

Sonnet 4.6 then executes one approved task at a time and escalates architecture concerns
(file 02 §2.3 format) instead of changing architecture. Opus reviews escalations and any
change to D-01–D-51 (pack §38 change control).

# End of Bootstrap Prompt
