# AURA — TASKS_Project.md Review (Opus 4.8)

**Reviewer:** Opus 4.8 (architecture / security / foundation authority)
**Date:** 2026-06-13
**Artifact under review:** `docs/TASKS_Project.md` (generated, uncommitted)
**Base state:** Bootstrap foundation merged to `main`; no implementation started.
**Scope:** Plan-only review against `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md` §19, `docs/DECISION_LOG.md` (D-01–D-51), `.claude/rules/`, `CLAUDE.md`.

---

## Verdict

**APPROVE_TASK_PLAN** — with non-blocking improvements recommended (may be applied as a fast-follow; not gating).

`docs/TASKS_Project.md` may be committed.

---

## Verification Results

| # | Objective | Result |
|---|---|---|
| 1 | §19.1 template fidelity | ✅ All 44 tasks contain all 13 template sections + the 2 plan-specific sections (Model Assignment, Merge Gates). Mechanically verified: 44/44 for each of Goal, Context, Requirements, Constraints, Allowed Files, Forbidden Files, Files Likely Affected, Acceptance Criteria, Test Plan, Required Commands, Migration/Rollback Note, Definition of Done, Out of Scope, Model Assignment, Merge Gates. |
| 1 | §19.2 phase order | ✅ Phases 0→6 present and ordered exactly per §19.2 (Foundation → Data/Auth/Security → Public → Admin → Lead/WhatsApp → Sales Demo/Polish → Release). Each phase has an explicit exit gate. |
| 1 | §19.3 first vertical slice | ✅ AURA-008 encodes the §19.3 slice verbatim: `/`→`/en`, `/en` shell, env schema loads, test stack works, CI green, zero boundary violations. Explicitly marked the Phase 0 exit gate. |
| 2 | Phase 0 has no premature product/cinematic work | ✅ AURA-001 = placeholder only; AURA-006 = tokens only (no components); AURA-008 = "minimal homepage shell, **no cinematic/GSAP**". Cinematic deferred to AURA-502 (Phase 5). Compliant with §19.3 "do not start with cinematic design before foundation gates exist." |
| 3 | Required per-task sections | ✅ Confirmed for all 44 tasks (see #1). |
| 4 | D-01–D-51 preserved & mapped | ✅ Locked-Decision Coverage Map covers **every** ID D-01 through D-51. Spot-checked mappings (D-05→102/602, D-12→205/307, D-18→405, D-40→104/301, D-51→106, D-44→202/203/204/302/401) are correct. A-01–A-16 ratified defaults applied and listed. |
| 5 | Merge blockers represented | ✅ All six represented in Global Constraints **and** in the specific owning tasks' Merge Gates (detail below). |
| 6 | No premature authorization | ✅ Install (AURA-001), Supabase files (AURA-101), migrations (AURA-102), auth (AURA-104), cinematic (AURA-502) each gated behind their phase and explicitly flagged "requires explicit approval." Only `.env.example` is ever created; real `.env` is forbidden throughout. |
| 7 | Granularity safe for Sonnet one-at-a-time | ✅ Acceptable. Three tasks are large but coherent (notes below). |
| 8 | Missing / misplaced / over-broad / mis-assigned tasks | ⚠️ Minor, non-blocking findings below. |

---

## Blocking Issues

**None.** No P0/security/scope/fidelity defect prevents commit or Phase 0 start.

---

## Required Changes

**None.** Nothing must change before this plan is committed or before AURA-001 begins.

The items below are optional quality improvements only.

---

## Non-Blocking Improvements

1. **Missing public-page tasks vs. architecture surface.** `docs/ARCHITECTURE.md` lists public `about/` and `contact/` routes, and `docs/API_SPEC.md` defines `GET /api/properties/featured`. The plan:
   - folds the **contact page** into AURA-401 (acceptable — it is conversion/lead-bound);
   - has **no explicit task** for an **About page** (may be intentionally out of MVP — confirm or add a small Phase 2 task);
   - has **no explicit task** for **`GET /api/properties/featured`** or for wiring real featured-property data into the homepage. The homepage is a shell in Phase 0 and becomes cinematic in AURA-502, but no task sources its property data. *Recommend:* add featured-properties to AURA-202's scope or create a small Phase 2 task, and reference it from AURA-502.

2. **Public-read Opus-review consistency (AURA-204).** AURA-202 (properties public read) and AURA-205 (legal public read) are correctly flagged **Opus review: required** as public data-exposure boundaries, but AURA-204 (areas public read) is **not required**. Areas are low-sensitivity (active/inactive, no PII) so the risk is genuinely lower and the inactive-area negative test is present — but for boundary-consistency consider flagging AURA-204 Opus-review-required, or document why areas are exempt.

3. **Authenticated-role negative tests sequenced one task early.** AURA-103 (RLS) lists "no-role authenticated user blocked from admin reads" and "full security-negative suite green" in its DoD, but authenticated sessions/role wiring land in AURA-104. These are testable in 103 via simulated JWT/role claims against the local stack, but some authenticated-role negatives belong more naturally with AURA-104. *Recommend:* explicitly note that 103 covers anon/default-deny negatives and 104 completes authenticated-role negatives, so neither task's DoD over-claims.

4. **Three over-broad-but-coherent tasks — watch at execution.** AURA-102 (all ~11 MVP tables + enums + indexes in one migration), AURA-103 (RLS for all sensitive tables), and AURA-303 (property create/edit/duplicate/archive + publish checklist + audit) are the largest units. Each is a legitimate atomic unit (one migration / one policy set / one CRUD surface), so no split is required — but if Sonnet stalls, AURA-303 is the natural candidate to split (CRUD vs. publish-checklist+audit).

5. **Per-task approval clarification (governance).** AURA-001 says the install approval "is granted" here. Per `CLAUDE.md` startup behavior, approving this task *plan* does **not** waive the per-task confirmation required before install/migration/auth tasks execute. *Recommend:* add a one-line note that AURA-001/101/102/104 still require an explicit "go" at execution time, so the plan's "requires approval" language is not read as pre-granted by plan approval.

6. **AURA-406 (dashboard metrics) model assignment.** Marked Opus-review-not-required. It aggregates lead + WhatsApp data (D-18 PII surface) behind an already-reviewed guard, so read-only-not-required is defensible; flagging it required would be the more conservative choice. Reviewer's call — left as non-blocking.

---

## Phase 0 Safety Assessment

**SAFE.** Phase 0 (AURA-001→008) builds repo skeleton, lint/format, test harness, dependency-cruiser/Knip, env schema (`.env.example` only), design tokens, and CI — then proves the pipeline with the §19.3 first vertical slice. No cinematic/GSAP, no Supabase migrations, no `.env`, no auth, no admin in Phase 0. The only product code in Phase 0 is the sanctioned §19.3 slice (redirect + shell + smoke test), which is required, not premature. `npm install` is correctly the first gated action (AURA-001) and nothing executes secrets or DB before Phase 1. Phase 0 exit gate (zero boundary violations + green CI) is the correct guard before any data/auth work.

---

## Model Assignment Assessment

**SOUND.** Execution is uniformly Sonnet 4.6; Opus-review-required is set on 27/44 tasks and correctly concentrates on the high-risk surfaces:
- **Every Phase 1 task** (migrations, RLS, auth, service-role, storage, rate-limit hashing) is Opus-required.
- All merge-blocker-owning tasks are Opus-required: D-05 (102, 602), D-12 (205, 307), D-18 (405), D-40 (104, 301), D-51 (106), plus service-role/env (005, 101, 603) and lead/PII boundaries (401, 402, 403, 404, 604).
- Pure tooling/shell/polish tasks (002, 003, 006, 302, 305, 406, 501–505, 601) are correctly not-required, with Opus phase sign-off implied at exit gates.

Only nits: AURA-204 and AURA-406 (see Non-Blocking #2, #6) sit just below the line a stricter reviewer might draw. Neither is a defect.

---

## Merge-Blocker Coverage

| Merge blocker | Global constraint | Owning task(s) + gate | Status |
|---|---|---|---|
| No `clients` table / `client_id` (D-05) | ✅ | AURA-102 (D-05 schema scan), AURA-602 (security scan) | ✅ Covered |
| No service-role in client bundle | ✅ | AURA-005, AURA-101 (server-only boundary), AURA-602/603 (build-output scan) | ✅ Covered |
| No raw IP / PII in event tables (D-18, D-51) | ✅ | AURA-106 (salted-hash, no-raw-IP), AURA-405 (whatsapp PII rejection) | ✅ Covered |
| No unsafe legal HTML (D-12) | ✅ | AURA-205 (safe render), AURA-307 (sanitized authoring) | ✅ Covered |
| No public admin self-signup (D-40) | ✅ | AURA-104 (seed-only, no signup UI), AURA-301 (login-only) | ✅ Covered |
| No public sensitive reads | ✅ | AURA-103 (RLS), AURA-202/203/204/205 (published/active-only), AURA-403 (leads admin-only) | ✅ Covered |

All six are enforced both globally (inherited Constraints/Merge Gates) and at the specific task that introduces the relevant surface, with a corresponding security-negative test in the Test Plan. Architecture-boundary enforcement (dependency-cruiser) is stood up in AURA-004 before any product code.

---

## Recommendation

**Approve and commit `docs/TASKS_Project.md` as-is.** Begin execution at **AURA-001** (Sonnet 4.6, one task at a time), with explicit per-task confirmation retained for install/migration/auth tasks (AURA-001, 101, 102, 104). The six non-blocking improvements may be folded in opportunistically — most cheaply, add the featured-properties/About coverage (Non-Blocking #1) before Phase 2 begins, since that is where the gap would first bite. None block Phase 0.

---

## Next Safe Action

1. Commit `docs/TASKS_Project.md` (and this review) on a `chore/` branch; update `CURRENT_STATE.md` / `NEXT_STEPS.md` / `SESSION_HANDOFF.md` to name **AURA-001** as the first executable task.
2. (Optional, recommended before Phase 2) Add a featured-properties/homepage-data task or extend AURA-202; decide About-page in/out of MVP.
3. Confirm AURA-001 explicitly, then Sonnet 4.6 executes it (first sanctioned `npm install`), running the Phase 0 gates and stopping at the AURA-008 exit gate for Opus phase sign-off before Phase 1.
