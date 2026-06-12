# AURA — Product Requirements Document

**Source:** Pack §2, §3, §5  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Product Vision

A premium, performant, AI-maintainable real estate website engine that creates separate high-conversion client websites with property showcase, lead capture, WhatsApp-first conversion, admin management, legal pages, and performance-safe cinematic presentation.

---

## User Personas

**Agency Owner / Marketing Manager**
- Wants a credible, premium website that converts visitors into leads
- Needs admin control over properties, leads, and settings
- Values performance, design quality, and trust signals

**Agency Admin**
- Manages properties (CRUD, publish, archive, media)
- Reviews and manages leads
- Updates legal pages, settings, contact/footer content

**Buyer / Renter / Investor**
- Searches for properties by goal, area, budget, bedrooms
- Views property details with gallery, price, specs
- Contacts agent via WhatsApp CTA or inquiry form

---

## Problem Statement

Real estate agencies in Dubai need premium, fast, trust-building websites that:
- Look distinct (not generic CMS or template-builder output)
- Convert qualified visitors into inquiries and WhatsApp conversations
- Are manageable by non-technical admins
- Support separate branding per client without multi-tenant complexity

---

## Jobs To Be Done

- Admin: manage property listings end-to-end
- Admin: manage and export leads
- Admin: update contact, legal, and trust content
- Visitor: find matching properties by goal/area/budget
- Visitor: initiate contact via WhatsApp or inquiry form
- Agency: demo the product to prospects with Sales Demo Mode

---

## Functional Requirements

### Public Website
- `/` → `/en` redirect
- Homepage with cinematic hero, featured properties, area explorer, lead CTA, footer
- Property listing with filters, search, sort, pagination
- Property detail with gallery, specs, inquiry form, WhatsApp CTA
- Areas overview page
- About page
- Contact page with lead form
- Privacy Policy and Terms pages (versioned, published)

### Admin Panel
- Login/logout (Supabase Auth; no public self-signup)
- Dashboard with property/lead/WhatsApp metrics
- Property CRUD with canonical taxonomy
- Property publish workflow (`draft → published → archived`)
- Media upload (images + floorplan; 10MB max; UUID paths)
- Lead management (search, status, archive, export)
- Settings (editable contact, footer, social, trust, SEO basics)
- Legal pages (draft → publish with versioning)
- Areas admin (add, edit, deactivate)

### Tracking
- WhatsApp click tracking (no PII stored)
- Lead email notification via Resend
- Audit logging for sensitive admin actions

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Desktop PageSpeed | > 90 |
| Mobile PageSpeed (cinematic) | > 75; production target > 80 |
| CLS | < 0.1 |
| TypeScript | Strict mode |
| Test coverage | Unit + DAL + integration + E2E |
| Security | RLS on all sensitive tables; service-role server-only |
| Accessibility | Semantic HTML, keyboard nav, reduced motion, WCAG AA |
| i18n-readiness | `/en/...` routes; JSONB translatable fields; RTL-ready CSS |

---

## Success Metrics

- All quality gates pass (lint, typecheck, format, tests, build, deps, security)
- Admin can manage properties, leads, settings, legal without engineer assistance
- Visitor conversion path works: homepage → listing → detail → WhatsApp/inquiry
- Lead creation and email notification work reliably
- AUTEX demo is noindex and presents as a credible premium real estate site

---

## Risks

- Cinematic performance on mobile (mitigated: heavy GSAP only on homepage/storytelling; reduced motion required)
- Legal content safety (mitigated: Markdown/sanitized rich text only; no raw HTML)
- Admin data exposure (mitigated: RLS on all sensitive tables; role check on every admin route)
- Multi-tenant drift (mitigated: no `clients`/`client_id` merge blocker enforced by `.claude/rules/`)

---

## Out-of-Scope Items

See `docs/MVP_SCOPE.md` §2 for the full exclusion list. Key exclusions:

- Multi-tenant SaaS; `clients` table; `client_id`; shared production DB
- Arabic final UI (Phase 2)
- Blog/insights; advanced analytics; CRM/portal integrations
- WhatsApp Business API; Google Maps full integration
- Native video/360/virtual tour upload
- SaaS billing; customer maintenance portal
- CSV property import; bulk admin actions
