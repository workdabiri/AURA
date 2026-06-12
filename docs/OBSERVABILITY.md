# AURA — Observability

**Source:** Pack §21  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Required Observability Stack

| Tool | Purpose |
|---|---|
| Sentry | Application runtime errors; crash reporting |
| Vercel Analytics | Public traffic, page views, conversion events |
| Server logs | Lead notification failures; admin action logs |
| Audit logs | Admin state changes (in DB: `audit_logs` table) |
| Performance monitoring | LCP, CLS, route performance (Lighthouse + Vercel) |

---

## What to Monitor

- Sentry: all uncaught server/client exceptions; RLS failures where detectable
- Lead email notification failures (logged server-side; must not fail lead creation)
- Denied admin access attempts where practical
- Rate-limit events (aggregate, not individual — no IP logging)
- Build and deployment failures (GitHub Actions)
- Vercel Analytics: `homepage_viewed`, `hero_filter_used`, `property_card_clicked`, `property_detail_viewed`, `lead_form_submitted`, `whatsapp_cta_clicked`, `sales_demo_mode_viewed`

---

## What Must Never Be Logged

- Service-role keys or private tokens
- Raw private API keys or secrets
- Unnecessary PII (lead phone/email/name in application logs or analytics)
- Lead full export data in public or non-secured logs
- WhatsApp click PII (no IP, phone, or email in tracking events)
- Raw IP addresses in application event tables (D-18, D-51)

---

## MVP Analytics Events

| Event | Trigger | PII? |
|---|---|---|
| `homepage_viewed` | Visitor lands on homepage | No |
| `hero_filter_used` | Visitor uses hero filters | No |
| `property_list_filtered` | Listing filters changed | No |
| `property_card_clicked` | Property card opened | No |
| `property_detail_viewed` | Detail page viewed | No |
| `lead_form_submitted` | Lead successfully submitted | Avoid event-level PII |
| `whatsapp_cta_clicked` | WhatsApp CTA clicked | No PII |
| `sales_demo_mode_viewed` | Demo mode activated | No |

**Privacy rules for analytics:**
- Do not send lead phone/email/name to Vercel Analytics or any external analytics service
- Use property IDs/slugs and source fields where needed
- Aggregate dashboard metrics server-side from `leads` and `whatsapp_clicks` tables

---

## Alert Priorities

| Priority | Example | Response |
|---|---|---|
| P0 | Data exposure, auth/RLS failure, production outage, service-role leak | Stop release; rotate secrets; patch immediately; postmortem |
| P1 | Lead creation failure, admin unavailable, email notification broken | Fix urgently; communicate impact to stakeholders |
| P2 | Analytics failure, non-critical UI error, minor visual bug | Queue fix for next sprint |

---

## Sentry Configuration

Required before production:
- Sentry DSN configured in environment variables (server-side only for backend; client DSN for frontend)
- Source maps uploaded on each production build
- Alert rules configured for P0 and P1 error categories
- Verify Sentry receives test events before marking release ready

---

## Vercel Analytics

Required before production:
- Vercel Analytics enabled in `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` or via Vercel dashboard
- Custom events fired at key conversion touchpoints
- No PII in event payloads

---

## Log Retention

- Application error logs (Sentry): managed by Sentry plan; default retention acceptable for MVP
- Audit logs (DB): retain as practical for support/security; review retention policy post-MVP
- Server-side logs: Vercel log retention settings; no sensitive data in log payloads
