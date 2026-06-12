# AURA — MVP Scope

**Source:** Pack §5  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## 1. MVP Definition

The AURA MVP delivers a complete, polished, production-grade real estate website engine demonstrated by the AUTEX Estates Dubai fictional flagship. It includes the public website, admin panel, lead system, WhatsApp tracking, and deployment isolation. It does not include SaaS billing, multi-tenancy, Arabic UI, or advanced integrations.

---

## 2. Included in MVP

1. Greenfield repo setup
2. Reusable Core Engine
3. AUTEX Estates Dubai flagship demo
4. Public real estate website
5. Admin panel
6. Supabase Auth
7. `super_admin` and `client_admin` roles
8. First-admin bootstrap flow (manual Supabase Auth + seed script)
9. Property CRUD
10. Duplicate property
11. Property publish workflow (`draft / published / archived`)
12. Canonical property taxonomy (`transaction_type`, `market_type`, `property_type`, `availability_status`)
13. Property media upload/gallery (images and floorplan images only)
14. Property listing and filtering
15. Property detail page
16. Property contact override
17. Optional internal stakeholders
18. Lead capture
19. Lead management
20. Lead search
21. Lead archive/soft-delete
22. Lead export with audit logging
23. Email notification for every new lead (Resend)
24. Basic dashboard with lead/source/WhatsApp/property metrics
25. WhatsApp click tracking without PII
26. Table-based MVP rate limiting for public write endpoints
27. Settings management
28. Admin-editable contact/footer/communication settings
29. Versioned legal pages
30. English visible UI
31. `/en/...` routes
32. i18n-ready data and routing architecture
33. LTR/RTL-ready design architecture
34. Premium interactive homepage
35. Areas overview page
36. Simple Areas Admin
37. Sales Demo Mode
38. SEO basics with AUTEX noindex by default
39. Performance-safe animation strategy
40. Separate deployment support
41. Client deployment factory workflow
42. Manual property entry
43. Managed migration service as agency-side onboarding
44. UI loading/empty/error/forbidden/validation states
45. Audit logs for sensitive admin actions
46. Client legal readiness checklist for real production

---

## 3. Explicitly Out of Scope for MVP

- Multi-tenant SaaS
- `clients` table or `client_id` model
- Shared production database across clients
- Tenant routing or cross-client admin
- SaaS billing/subscription
- Customer maintenance portal
- CRM integration
- Property portal sync (Property Finder/Bayut/Dubizzle)
- WhatsApp Business API automation
- Google Maps full/embedded integration
- Blog/Insights
- Advanced analytics dashboard
- Arabic final UI or full RTL QA
- Virtual tour / 360 media
- Native property video upload
- Bulk admin actions
- Public indexing of AUTEX demo
- Payment gateway, mobile app, AI chatbot
- Multiple demo websites
- Advanced roles (editor/agent/viewer/support)
- Real-time chat
- CSV property import
- Portal/CRM property sync
- Full Area Landing Page CMS

---

## 4. First Vertical Slice

The first implementation slice must prove:
- Repo structure works
- `/` redirects to `/en`
- `/en` renders homepage shell
- Supabase env schema exists
- Basic test stack works
- CI quality gate runs green
- No architecture-boundary violation

Do not start cinematic homepage design before foundation gates exist.

---

## 5. Release Criteria

- All quality gates pass (lint, typecheck, format, tests, build, deps, security)
- Full E2E tests pass
- Lighthouse scores meet targets (Desktop > 90; Mobile > 75 cinematic)
- Sentry configured and verified
- RLS/security checklist signed off
- Legal pages published in demo
- AUTEX data is fake, license-safe, and noindex
- Handover documentation complete

---

## 6. Recommended Task Phases

| Phase | Focus |
|---|---|
| Phase 0 | Foundation: repo init, tooling, CI, env schema, design tokens |
| Phase 1 | Data/Auth: Supabase migrations, RLS, auth, DAL test harness |
| Phase 2 | Public website: routes, listing, property detail, SEO |
| Phase 3 | Admin: property CRUD, media, areas, settings, legal |
| Phase 4 | Lead + WhatsApp: inquiry forms, lead API, email, tracking |
| Phase 5 | Sales Demo + Polish: homepage cinematic, mobile, a11y, Lighthouse |
| Phase 6 | Release readiness: full E2E, security tests, Sentry, handover |

---

## 7. Roadmap Parking Lot

These are intentionally deferred post-MVP:
- Arabic UI and full RTL QA
- CSV import / portal sync
- CRM integration
- WhatsApp Business API
- Google Maps full integration
- Area landing page CMS
- Blog/insights
- Advanced analytics
- Additional admin roles (editor/agent/viewer/support)
- SaaS billing/subscription
- Customer maintenance portal
- Additional demo templates
