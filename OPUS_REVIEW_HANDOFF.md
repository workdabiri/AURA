# OPUS_REVIEW_HANDOFF — AURA

**From:** Fable 5 initial architecture session (manual, one-time)
**To:** Opus 4.8 review and hardening session
**Date:** 2026-06-12
**Project:** AURA — Premium Interactive Real Estate Website Engine (flagship demo: AUTEX Estates Dubai)
**Fable verdict:** `NEEDS_PATCH`
**Model policy reminder:** Do not route back to Fable 5. Opus owns all follow-up architecture authority per file 02 §2.2. Sonnet 4.6 executes only after your approval and repo bootstrap.

---

## 1. Inputs You Need

1. `01_UNIVERSAL_AI_PROJECT_LAUNCH_STANDARD_v1_7_FINAL.md` — master standard (controls WHAT)
2. `02_CLAUDE_BOOTSTRAP_EXECUTION_LAYER_v3_2_FINAL.md` — execution layer (controls HOW)
3. `AURA_OPTIMIZED_PROJECT_PACK_v1_3.md` — project-specific source of truth (3,235 lines; read fully)
4. This handoff

File 03 (prompt pack) was referenced by files 01/02 but not provided to the Fable session. Confirm it exists before instructing the user on phase prompts.

## 2. Fable Session Summary

- Full pack read and cross-checked: MVP scope (§5) ↔ data model (§11) ↔ API spec (§13) ↔ RLS matrix (§12) ↔ tests (§16) ↔ gates (§17). No orphan endpoints, no scope leakage from out-of-scope list into model/API.
- Architecture ratified: single-tenant-per-deployment engine, Next.js + Supabase, layered `app → components → domain → dal/services → lib/config` with dependency-cruiser enforcement, config-vs-settings split, canonical real estate taxonomy (D-36) confirmed as the pack's strongest decision.
- Verdict: NEEDS_PATCH — six mandatory patches (Section 3). No P0 blocker. TASKS_AURA.md was NOT created.
- No implementation code written. No MCPs/plugins/hooks/skills installed or recommended for installation.

## 3. Mandatory Patches (verify these were applied to the pack)

| ID | Patch | Class |
|---|---|---|
| P-01 | §7.4/§7.5 taxonomy drift: "property status" → `availability_status` + `market_type`; "status = off_plan" → `market_type = off_plan` (D-36 self-violation) | Internal contradiction |
| P-02 | Rate-limit key strategy: salted-hash(IP + route) in dedicated `rate_limits` table, 24h TTL, scheduled cleanup; never stored in event/analytics tables; salt server-only. Amend D-39 or add D-51. Reconciles D-39 (rate limiting mandatory) with D-18/§13.3 (no raw IP by default) | Security gap — highest priority |
| P-03 | Media storage posture decision: recommended = public-read bucket + unguessable UUID paths + RLS-guarded writes/deletes; document that archived-media CDN revocation is not guaranteed without signed URLs (deferred). Align §12.2 matrix wording with chosen posture | Unenforceable security claim |
| P-04 | Indexing/uniqueness contract added to §11: unique(`properties.slug`, `properties.reference_number`, `areas.slug`, partial unique `legal_pages(slug) WHERE status='published'`); composite(`publish_status,is_featured`), (`publish_status,created_at`); FK indexes; generated column `title_en` from `title->>'en'` + search index | File 01 §5.5 requirement |
| P-05 | Ambiguity fixes: `settings` = key-value + allowlist + per-key Zod; `preferred_contact_method` enum = `phone/whatsapp/email`; note `leads.status` is typed by enum `lead_status` (D-37 intact, prevents agent "fixes") | Implementation ambiguity |
| P-06 | Governance: pack decomposes into file 01 `docs/` structure at repo bootstrap (mapping in Section 5); `TASKS_AURA.md` ≡ `docs/TASKS_Project.md`; pack §34 gates implemented as `.claude/skills` only at file 02 §7 Stage 2; add `/en/about` to §2.7; one line documenting no-upstream-sync for client forks | Standards reconciliation |

Non-blocking (recommend, do not gate): lead-form honeypot; `X-Robots-Tag: noindex` header for `?demo=sales`; defer/batch `views_count`; duplicate-phone soft flag in lead admin.

## 4. Assumptions Awaiting Your Ratification

| ID | Assumption |
|---|---|
| A-01 | CI: one GitHub Actions workflow — `npm run quality` + Playwright on PR; CodeQL scheduled/PR |
| A-02 | Test DB: Supabase CLI local stack (dev + CI Docker) for DAL/integration tests |
| A-03 | Rate limits (config-tunable): leads 5/hr/key; whatsapp-clicks 30/hr/key; login 5/15min/key |
| A-04 | `preferred_contact_method`: `phone/whatsapp/email` |
| A-05 | `reference_number`: configurable prefix + padded sequence (e.g. `AUX-00041`), unique |
| A-06 | Slug from `en` title, collision-suffixed, immutable after publish |
| A-07 | Pagination: `page`/`limit`, server cap 50 |
| A-08 | Lead export: CSV, filter-respecting, audit-logged, no persisted public URL |
| A-09 | Settings shape per P-05 |
| A-10 | Q-01–Q-15 recommended defaults accepted as written |
| A-11 | AED-only currency display in MVP |

## 5. Pack → File 01 Decomposition Map (materialize at repo bootstrap, post-patch)

```text
PROJECT_BRIEF/PRD/MVP_SCOPE ← §2,§3,§5    GLOSSARY ← §11.1.1+§3
USER_STORIES/FEATURE_SPECS/ACCEPTANCE_CRITERIA ← §7,§8,§14
ARCHITECTURE ← §9–10    DATA_MODEL ← §11    API_SPEC ← §13
SECURITY_BASELINE+RBAC ← §12(+§6)    QUALITY_GATES ← §17    TEST_STRATEGY ← §16
CI_CD_STRATEGY ← §18.2+A-01    AI_CODING_WORKFLOW ← §18
SKILLS_STRATEGY ← §34 (staged per file 02 §7)    AGENTS_STRATEGY ← file 02 §6 lean core set
DECISION_LOG ← D-01–D-50 + Q-resolutions    OBSERVABILITY ← §21
DATA_RETENTION ← §22.3    DESIGN_SYSTEM ← §15
CLAUDE.md / SESSION_HANDOFF / CURRENT_STATE / NEXT_STEPS ← created at bootstrap (file 01 §4.4)
BILLING_MODEL ← intentionally omitted (one-time delivery)
```

## 6. Risk Register for Your Hardening Pass

```text
R-01 HIGH   Rate-limit key gap (resolved by P-02 — verify the patch, then close)
R-02 MED    D-27 perf targets vs cinematic homepage; require Lighthouse in CI from Phase 2, not Phase 5
R-03 MED    Storage/CDN revocation tradeoff (P-03) — ratify posture explicitly
R-04 MED    Client forks receive no upstream engine fixes — confirm documented in handover docs
R-05 LOW    Table-based rate limiting DB load under spam; Upstash path reserved
R-06 LOW    JSONB i18n search complexity; mitigated by P-04
R-07 LOW    46-item MVP timeline risk; Phases 0–4 are the sellable core
```

## 7. Your Review Checklist (file 02 §3 Phase 2)

1. Verify P-01..P-06 applied to the pack; spot-check D-36 compliance across §7, §13, §14, §16.
2. Ratify or override A-01..A-11; record outcomes in the pack's open-decisions table or DECISION_LOG.
3. Run file 01 §12 final pre-implementation review (PRD↔MVP, architecture↔MVP, data↔workflows, API↔stories, gates executable, security explicit, tasks small, continuity files planned, exclusions clear).
4. Check overengineering risk: audit-log breadth ("where practical" scope), 6-gate review overhead for a solo+AI team, 10-script quality chain — simplify only if it removes real friction without weakening merge blockers.
5. Check underengineering risk: P-02 thresholds sane? P-03 posture acceptable for client deliveries? Lead spam protection adequate?
6. Issue final verdict. If READY_FOR_TASKS: authorize TASKS_AURA.md generation per pack §19 (template §19.1, phases §19.2, first slice §19.3 — Phase 0 foundation first, no cinematic work before gates exist).
7. Produce final `REPO_BOOTSTRAP_PROMPT_FOR_CLAUDE_CODE.md` per file 01 §11: CLAUDE.md, docs/ decomposition, `.claude/rules`, lean `.claude/agents` (file 02 §6 core set only), continuity files, quality scripts. No product code. No MCPs/plugins/hooks/third-party skills without explicit user approval.

## 8. Hard Constraints You Must Preserve

- Locked decisions D-01–D-50 change only via pack §38 change control with explicit user approval.
- Never introduce `clients`/`client_id`/shared production DB/tenant routing (D-05; merge blocker).
- No public admin signup; bootstrap flow per §13.4/D-40.
- Service role server-only; no raw IP in event tables by default; no unsafe legal HTML.
- AUTEX is fictional: noindex by default, footer disclosure when public, no real RERA/license claims (§3.3–3.4, D-42).
- Auto-merge only into `develop`, never `main`, and only after branch protection + required checks exist.
- Sonnet escalates architecture concerns using file 02 §2.3 format; it never self-redesigns.

## 9. CLAUDE.md Model-Policy Block (carry into bootstrap verbatim)

```text
Fable 5 was used once, manually, for the initial architecture phase. Do not request or
recommend Fable 5 again unless the user explicitly asks. Opus 4.8 reviews major architecture,
security, and tradeoff decisions. Sonnet 4.6 executes approved tasks only and escalates
architecture concerns instead of changing them. The repository is the source of truth.
```

# End of Handoff
