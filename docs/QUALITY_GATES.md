# AURA — Quality Gates

**Source:** Pack §17  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Core Rule

No task is complete until all required gates pass (D-28).

---

## Required Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format:check": "prettier --check .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:dal": "vitest tests/dal",
    "test:integration": "vitest tests/integration",
    "test:e2e": "playwright test tests/e2e",
    "test:smoke": "playwright test tests/e2e/smoke.spec.ts",
    "test:security": "vitest tests/security",
    "unused": "knip",
    "deps:check": "dependency-cruiser --validate .dependency-cruiser.cjs src/app src/components src/domain src/dal src/services src/lib",
    "audit": "npm audit --audit-level=high",
    "quality": "npm run lint && npm run typecheck && npm run format:check && npm run test && npm run unused && npm run deps:check && npm run build"
  }
}
```

---

## Required Tooling

Must be in place before release:

| Tool | Purpose |
|---|---|
| ESLint strict | Code quality and style |
| TypeScript strict | Type safety |
| Prettier | Formatting consistency |
| Vitest | Unit, DAL, integration, security tests |
| Playwright | E2E and smoke tests |
| CodeQL | Static security analysis |
| Knip | Unused code detection |
| dependency-cruiser | Architecture boundary enforcement |
| npm audit | Dependency vulnerability scanning |
| Lighthouse | Performance audit — **advisory CI enabled in AURA-206** (`.github/workflows/lighthouse.yml`; PRs to `develop`; `continue-on-error: true`; non-blocking; **not a required check**). Hard gate deferred to production release / AURA-505 — see `CI_CD_STRATEGY.md` |
| Sentry | Runtime error tracking |
| Vercel Analytics | Public traffic and conversion |

Recommended (not release-blocking if missing):
- Semgrep (additional static analysis)
- Bundle Analyzer
- Vitest coverage reporting
- Husky / Lefthook (local pre-commit hooks)
- Dependabot / Renovate

---

## Merge Blockers

Block merge if any of these fail:

**Automated checks:**
- lint (`npm run lint`)
- typecheck (`npm run typecheck`)
- format check (`npm run format:check`)
- unit tests
- relevant DAL tests
- relevant integration tests
- build (`npm run build`)
- security negative tests where affected
- dependency boundary check (`npm run deps:check`)
- unused code check (`npm run unused`)
- high/critical dependency vulnerability without approval (`npm run audit`)
- CodeQL critical issue

**Data/security blockers:**
- RLS regression
- Service-role key in client bundle
- Public lead data exposure
- `clients` or `client_id` introduction
- Unsafe legal HTML rendered
- Default IP tracking in `whatsapp_clicks`
- Admin route without role check (auth-only is insufficient)
- Missing audit log for sensitive admin state change

**Architecture blockers:**
- Dependency direction violation (DAL importing UI; domain importing React; UI directly querying Supabase)
- Business logic inside JSX
- API handler without Zod validation

---

## Release Blockers

Block production release if any of these fail:

- Full CI (all merge-blocker checks)
- Full E2E test suite
- Production smoke tests
- Lighthouse gate (Desktop > 90; Mobile > 75 cinematic / production target > 80; CLS < 0.1)
- Sentry sanity check (errors streaming correctly)
- Environment variable audit (no secrets leaked; all required vars present)
- RLS/security checklist signed off
- QA/QC sign-off
- Legal pages published
- AUTEX demo data policy satisfied (noindex, fake data, no real PII)

---

## Per-Task Gate Requirements

For every implementation task:

| Check | Required When |
|---|---|
| `npm run lint` | Always |
| `npm run typecheck` | Always |
| `npm run format:check` | Always |
| `npm run test:unit` | Domain/validation changes |
| `npm run test:dal` | DAL or RLS changes |
| `npm run test:integration` | API or service changes |
| `npm run test:e2e` | UI changes on critical paths |
| `npm run test:security` | Auth/RLS/data-boundary changes |
| `npm run deps:check` | Any new imports or cross-layer changes |
| `npm run unused` | Any deletion or refactor |
| `npm run build` | Before PR merge |
| `npm run audit` | Before release; on dependency changes |

---

## Architecture Boundary Rules

Enforced by `dependency-cruiser`:

```
app/routes → components → domain → dal/services → lib/config
```

Forbidden cross-boundary imports:
- `dal` → `components` or `app`
- `domain` → `components`, `app`, or `dal` (domain is pure business logic)
- `components/ui` → `dal` or `services`
- Any `client` component → service-role helpers
- API handlers without Zod validation before any business logic

---

## AURA-Specific Required Test Cases

See `docs/TEST_STRATEGY.md` §16.8 for the full list. Key cases:

- Draft/archived property is not publicly visible
- Sold/rented status does not change `publish_status`
- Off-plan block visible only when `market_type = off_plan`
- Public cannot read leads, export leads, or read WhatsApp analytics
- IP/PII fields rejected from WhatsApp tracking payload
- Unauthenticated/no-role user blocked from admin routes
- Unsafe legal HTML rejected
- Lead export creates audit log
- Service-role key not present in client bundle output
