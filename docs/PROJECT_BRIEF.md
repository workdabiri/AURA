# AURA — Project Brief

**Source:** Pack §2, §3, §5  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Product Summary

AURA is a **reusable private real estate website engine** for Dubai real estate agencies. It is sold as a one-time premium website delivery package under the name:

```
AURA Signature Real Estate Website
```

Each client receives a fully isolated deployment: own Vercel project, own Supabase project, own domain, own database, own admin users. No shared production database. No multi-tenant SaaS.

**Engine name:** AURA  
**Flagship demo brand:** AUTEX Estates Dubai (fictional, demo-only, noindex)

---

## Target Users

Primary:
- Real estate agency owner
- Agency marketing manager
- Agency admin managing properties and leads
- Buyer/renter/investor browsing properties

Secondary:
- Luxury brokers
- Small/new agencies needing premium credibility
- Agencies representing off-plan/developer projects

---

## Core Problem

Many real estate agency websites look generic, perform poorly, fail to build trust, and do not convert qualified visitors into inquiries or WhatsApp conversations. Agencies also lack a manageable admin layer for properties, leads, settings, legal content, and sales demo presentation.

---

## Core Workflow

```
Visitor → Premium homepage → Property listing → Property detail → WhatsApp CTA or inquiry form → Lead captured → Admin reviews lead
```

---

## MVP Goal

Ship a polished flagship demo website for AUTEX Estates Dubai, demonstrating the full engine capability. Then use the engine to deliver separate, isolated real estate client deployments.

---

## Business Model

- One-time premium website delivery
- Optional monthly support and maintenance
- No SaaS billing, no subscriptions, no customer portals in MVP

---

## Base Package Includes

- Premium public real estate website
- Homepage, listing, property detail, areas, about, contact, privacy, and terms pages
- Admin property management
- Property media gallery (images + floorplan only)
- Lead capture and lead management
- WhatsApp CTA routing and non-PII click tracking
- Editable contact/footer/SEO/trust settings
- Versioned legal pages
- AUTEX-style sales demo capability
- Basic SEO and performance setup
- Separate Vercel/Supabase/client deployment setup
- Handover documentation

---

## Main Constraints

- No `clients` table, no `client_id`, no shared production DB (D-05)
- No public admin self-signup (D-40)
- Service-role key server-only (security merge blocker)
- No raw IP in event tables (D-18, D-51)
- English MVP; i18n-ready architecture for future Arabic (D-07, D-08)
- No SaaS billing in MVP (D-23)
- AUTEX demo must remain noindex (D-42)

---

## Known Unknowns / Assumptions

- A-01: GitHub Actions for CI/CD
- A-02: Test DB is Supabase CLI local stack for dev and CI Docker
- A-06: Property slug is derived from `en` title, collision-suffixed, immutable after publish
- A-07: Pagination server cap = 50
- A-11: AED-only price display in MVP; no FX conversion
