# AURA — Architecture

**Source:** Pack §9–10  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## System Overview

AURA is a Next.js App Router application deployed on Vercel with Supabase as the backend. Each client is a fully isolated deployment: separate Vercel project, Supabase project, domain, and admin users. There is no shared production database and no multi-tenant routing.

---

## Final Stack

### Frontend
- Next.js App Router (TypeScript strict)
- Tailwind CSS
- shadcn/ui (UI primitives)
- GSAP — homepage and storytelling only
- Framer Motion — lightweight UI transitions only
- React Hook Form + Zod
- Zustand — lightweight client state
- TanStack Query — where useful
- next-intl
- libphonenumber-js

### Backend
- Next.js Route Handlers
- Supabase PostgreSQL + Auth + Storage
- Resend (email notifications)
- Zod validation
- `server-only` modules (enforced by Next.js import boundary)

### DevOps / Quality
- Vercel (hosting + preview deployments)
- GitHub Actions (CI/CD)
- Vitest (unit + integration + DAL + security tests)
- Playwright (E2E + smoke tests)
- CodeQL (static analysis)
- npm audit
- ESLint strict
- TypeScript strict
- Prettier
- Knip (unused code detection)
- dependency-cruiser (architecture boundary enforcement)
- Lighthouse (advisory from Phase 2; release gate)
- Sentry (application errors)
- Vercel Analytics (public traffic)
- Semgrep (recommended)
- Dependabot / Renovate (recommended)

---

## Deployment Architecture

Each real client has:
- Own Vercel project
- Own Supabase project
- Own domain
- Own environment variables
- Own database
- Own storage bucket
- Own admin users

**No shared production database across clients.** Client forks receive no automated upstream engine fixes after delivery (intentional per D-23).

---

## Repository Structure

```
src/
  app/
    [locale]/           # /en/... public routes
      page.tsx
      properties/
      areas/
      about/
      contact/
      privacy/
      terms/
    admin/              # /admin/... admin routes
      login/
      dashboard/
      properties/
      leads/
      settings/
      legal/
      areas/
    api/                # Route Handlers
      properties/
      areas/
      legal/
      leads/
      whatsapp-clicks/
      admin/
  components/
    ui/                 # shadcn/ui primitives
    real-estate/        # PropertyCard, InquiryForm, WhatsAppCTA, etc.
    marketing/          # CinematicHero, AreaExplorer, SalesDemoLabels, etc.
    admin/              # Admin-specific components
    layout/             # Header, Footer, Navigation
  config/
    client.config.ts    # Deployment-level config
    feature-flags.ts    # Feature toggles
  domain/
    properties/
    leads/
    legal/
    settings/
    areas/
    whatsapp/
    audit/
  dal/                  # Data Access Layer — only layer querying Supabase
    properties.dal.ts
    leads.dal.ts
    legal.dal.ts
    settings.dal.ts
    areas.dal.ts
    whatsapp.dal.ts
    audit-logs.dal.ts
  services/
    auth/
    email/
    storage/
    analytics/
    rate-limit/
    audit/
  lib/
    supabase/           # Supabase server/client/service-role helpers
    validation/         # Shared Zod schemas
    i18n/               # next-intl config and messages
    seo/
    utils/
  styles/
  types/
  tests/
    unit/
    dal/
    integration/
    e2e/
    security/
```

---

## Dependency Direction (Strict)

```
app/routes → features/components → domain → dal/services → lib/config
```

**Forbidden:**
- DAL importing UI components
- Domain importing React or UI
- UI components directly querying Supabase
- Client components importing service-role helpers
- API handlers without Zod validation
- Business rules hidden inside JSX

Enforced by `dependency-cruiser` on every PR (`npm run deps:check`).

---

## Architecture Diagram

```
Visitor → Public /en Routes
Admin User → Admin Routes
         ↓
    UI Components
         ↓
    Domain Rules
         ↓
    Data Access Layer
         ↓
Supabase PostgreSQL / Supabase Storage
         ↓
Services: Email (Resend), Analytics (Vercel), Rate Limit, Sentry
```

---

## Auth / Authz Model

Authentication alone is not enough for admin access. Every admin request requires:
1. Valid Supabase session
2. Matching row in `user_profiles`
3. Role in `super_admin` or `client_admin`
4. Route/API authorization check
5. RLS policy compliance

**No public admin self-signup.** First `super_admin` created manually via Supabase Auth + seed/admin script.

---

## Configuration Model

### `client.config.ts` — Deployment-level config

```ts
export const clientConfig = {
  engine: "AURA",
  demoBrand: "AUTEX Estates Dubai",
  language: { defaultLocale: "en", enabledLocales: ["en"], rtlReady: true },
  features: {
    salesDemoMode: true,
    arabicEnabled: false,
    propertyVideoLinks: false,
    offPlanBlock: true,
    whatsappClickTracking: true,
    legalPagesEditable: true,
  },
  design: {
    themeVariant: "luxury-dark",
    motionIntensity: "premium",
    templateVariant: "premium-interactive-agency",
  },
};
```

### Database `settings` table — Admin-editable operational content

- Agency name, logo, WhatsApp, phone, email, office address
- Social links, footer content, footer links, Contact Us content
- SEO title/description, trust fields (RERA/license display, years in market)

**Rule:** Use `client.config.ts` for deployment/design decisions. Use DB `settings` for operational client-editable content. Admin settings must never mutate template architecture.

---

## Tradeoffs

| Decision | Chosen | Alternative | Reason |
|---|---|---|---|
| Deployment model | Separate deployments per client | Multi-tenant SaaS | Simpler security, no cross-client data risk, one-time delivery model |
| Auth | Supabase Auth | Custom JWT | Built-in security, RLS integration |
| Animation | GSAP (homepage) + Framer Motion (UI) | Unified animation lib | Performance — GSAP only loads on homepage |
| Storage | Public-read bucket + UUID paths | Signed URLs | Simpler CDN delivery; signed URLs deferred (limitation documented) |
| Rate limiting | Table-based (MVP) | Upstash/Vercel KV | Zero additional infra for MVP; migration path documented |
| Test DB | Supabase CLI local stack | Mock | Prevents mock/prod divergence |

---

## Architecture Risks

- CDN-level revocation for archived media is not guaranteed without signed URLs (known limitation, deferred MVP, documented at handover)
- Heavy GSAP on mobile must be profiled per device class; reduced motion is required
- Pagination server cap (50) prevents runaway queries but must be documented in API spec
