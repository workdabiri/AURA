# Next Steps

**Updated:** 2026-06-13  
**Current Phase:** Foundation bootstrapped — awaiting task generation

---

## Immediate Next Action

**Generate `docs/TASKS_Project.md`** (user-approved step — do not generate without approval).

Requirements per pack §19 and bootstrap prompt §6:

1. Use the §19.1 task template for every task:
   - Goal, Context, Requirements, Constraints (enforce D-01–D-51)
   - Allowed Files, Forbidden Files, Files Likely Affected
   - Acceptance Criteria, Test Plan (unit/DAL/integration/E2E/security)
   - Required Commands, Migration/Rollback Note, Definition of Done, Out of Scope

2. Phase sequence (§19.2) — **Phase 0 first**:
   - **Phase 0:** Repo initialization, Next.js setup, TypeScript strict, ESLint/Prettier, testing stack, dependency-cruiser, Knip, CodeQL, GitHub Actions, base folder architecture, design tokens, environment schema
   - **Phase 1:** Supabase setup, migrations, RLS, auth, admin role checks, storage bucket, DAL test harness
   - **Phase 2:** Public website — `/en` route, layout, homepage shell, properties listing, property detail, areas, legal pages, SEO
   - **Phase 3:** Admin vertical slice — login, dashboard, property CRUD, media upload, areas, settings, legal
   - **Phase 4:** Lead and WhatsApp — inquiry forms, lead API, email, lead admin, WhatsApp tracking, dashboard metrics
   - **Phase 5:** Sales Demo + Polish — homepage cinematic, luxury-dark, mobile CTAs, reduced motion, accessibility, Lighthouse performance *tuning* (Lighthouse is already an advisory CI job from Phase 2 and a hard release gate per `docs/CI_CD_STRATEGY.md` CF-4; Phase 5 only tunes scores, it does not introduce Lighthouse)
   - **Phase 6:** Release readiness — full E2E, security tests, production env, Sentry, handover docs

3. First vertical slice (§19.3) must prove:
   - `/` redirects to `/en`
   - `/en` renders homepage shell
   - Supabase env schema exists
   - Basic test stack works
   - CI quality gate runs green
   - Zero architecture-boundary violations

   **Do not start cinematic homepage work before foundation gates exist.**

---

## After Task Generation

Sonnet 4.6 executes one approved task at a time:
1. Pick the first Phase 0 task from `docs/TASKS_Project.md`
2. Confirm the task and plan
3. Implement (minimal, task-scoped changes)
4. Run quality commands (`npm run quality`)
5. Update session continuity files
6. Report and pick the next task

Escalate architecture concerns to Opus 4.8 instead of changing architecture.

---

## Blocked Until

- User approves and generates `docs/TASKS_Project.md`
- `npm install` is run (Phase 0 task)
- GitHub Actions CI is configured (Phase 0 task)

---

## Do Not Do Yet

- Do not write any product/UI/implementation code
- Do not run `npm install`
- Do not create migrations
- Do not create `.env` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
