# AURA — CI/CD Strategy

**Source:** Pack §18.2 + Assumption A-01  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`  
**Carry-forward fix applied:** CF-4 — Lighthouse runs as advisory CI job from Phase 2; hard-gated at release (not first introduced at Phase 5)

---

## Assumption A-01

CI/CD platform: **GitHub Actions**. All pipeline definitions live in `.github/workflows/`.

---

## Branch Strategy

| Branch | Purpose | Merge Policy |
|---|---|---|
| `main` | Production-only | Manual only; never auto-merge |
| `develop` | Integration branch | Auto-merge allowed after all checks pass |
| `feature/<task-id>-<slug>` | One task per branch | PR to `develop` |
| `fix/<issue-id>-<slug>` | Bug/security fix | PR to `develop` |
| `release/<version>` | Release preparation | Manual to `main` |

**Auto-merge rule:** Only into `develop`, only after branch protection is configured and all required checks pass. Never auto-merge to `main`.

---

## CI Pipeline (Per PR to `develop`)

### Required Checks (All Must Pass)

```yaml
steps:
  - Install dependencies (npm ci)
  - Lint (npm run lint)
  - Typecheck (npm run typecheck)
  - Format check (npm run format:check)
  - Unit tests (npm run test:unit)
  - DAL tests (npm run test:dal)          # uses Supabase CLI local stack in Docker
  - Integration tests (npm run test:integration)
  - Security negative tests (npm run test:security)
  - Dependency boundary check (npm run deps:check)
  - Unused code check (npm run unused)
  - Build (npm run build)
  - npm audit --audit-level=high
  - CodeQL analysis
```

### Advisory Checks (From Phase 2 — Do Not Block PR)

**Enabled in AURA-206 (`a106fe8`).** `.github/workflows/lighthouse.yml` runs as a non-blocking advisory job on PRs to `develop`, using `treosh/lighthouse-ci-action` (GitHub Action tooling; **no npm Lighthouse dependency**), with `continue-on-error: true` and **no score thresholds**. It is **not** a required branch-protection check and never blocks a PR. Hard-gating is deferred to the production release gate (AURA-505).

```yaml
steps:
  - Lighthouse CI (advisory; enabled AURA-206 on PRs to develop)
    # continue-on-error: true; no thresholds; not a required check
    # Reports scores; does not block PR until the release gate (AURA-505)
```

### Required Branch Protection Rules

- Require all status checks to pass before merging
- Require PR review (at least 1 approval)
- Dismiss stale reviews on new commits
- No force push to `develop` or `main`

---

## Lighthouse Timing

**Advisory CI job:** Runs automatically from Phase 2 (first public pages). **Enabled in AURA-206** (`.github/workflows/lighthouse.yml`) on PRs to `develop` with `continue-on-error: true` and no thresholds; **not a required branch-protection check**. Generates a score report but does not block the PR.

**Hard release gate:** At production release, Lighthouse scores must meet:
- Desktop PageSpeed > 90
- Mobile PageSpeed > 75 (cinematic demo); production target > 80
- CLS < 0.1

Failing the release gate blocks deployment to production.

> **Rationale for timing:** Lighthouse can only run meaningfully once public pages exist. Requiring it from Phase 0 would produce meaningless results. Advisory mode from Phase 2 builds a historical baseline; hard-gating at release prevents shipping a slow product.

---

## CD Pipeline

### Preview Deployments (Per PR)

- Vercel Preview deployment triggered automatically on every PR
- Preview URL included in PR for manual QA and visual review
- Preview deployments use non-production Supabase project (or local schema snapshot)

### Staging Deployment

- Auto-deploy to staging on merge to `develop`
- Run full E2E suite against staging
- Run smoke tests against staging
- Run security negative tests against staging

### Production Release

- Manual promotion from `main` branch only
- Pre-release checklist must be completed (see below)
- Deploy via Vercel production deployment
- Verify production smoke tests post-deploy
- Verify Sentry is receiving events
- Verify Vercel Analytics is active

---

## Production Release Checklist

Before any production release:

- [ ] All CI checks pass on `main`
- [ ] Full E2E suite green on staging
- [ ] Production smoke tests green
- [ ] Lighthouse gate met (Desktop > 90; Mobile > 75; CLS < 0.1)
- [ ] Sentry configured and receiving test events
- [ ] Environment variable audit (no secrets leaked; all required vars set)
- [ ] RLS/security checklist signed off
- [ ] QA/QC sign-off
- [ ] Legal pages published (Privacy Policy + Terms)
- [ ] AUTEX demo data: fake, license-safe, noindex
- [ ] Client legal readiness checklist (D-50) completed if real-client launch

---

## Environment Policy

Required environments:
- `local` — Supabase CLI local stack; `.env.local` (never committed)
- `preview` — Vercel Preview + staging Supabase project
- `production` — Vercel production + production Supabase project

Rules:
- Validate env at startup/server boundary (use Zod or t3-env pattern)
- Document every environment variable
- Use Vercel encrypted env storage for production secrets
- Separate Supabase projects per real client deployment
- Never commit `.env` files

---

## Supabase Migration Policy

- Migration files committed to repository under `supabase/migrations/`
- Destructive migrations require a rollback plan documented in the PR
- Production schema changes must be tested in preview/staging first
- Backup strategy documented before production handover (pack §24)

---

## Client Deployment Factory (D-43)

For each new real client:
1. Create new client repo from AURA core template
2. Create new Supabase project
3. Create new Vercel project
4. Configure encrypted environment variables
5. Run migrations
6. Seed settings, legal pages, areas, and optional sample properties
7. Upload client-approved logo/media/assets
8. Create first `super_admin` and `client_admin`
9. Connect domain
10. Run full quality/release checklist
11. Complete handover documentation

Client forks receive **no automated upstream engine fixes** after delivery (D-23). Re-engagement with delivery team required for upstream improvements.
