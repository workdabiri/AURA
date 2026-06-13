# AURA — Security Baseline

**Source:** Pack §12 + §6  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Core Security Rule

All sensitive tables require RLS. Public access is allowlisted, not default-open. Every admin route requires authentication + role check + RLS compliance — authentication alone is not sufficient.

---

## Public Access Matrix

| Resource | Public Read | Public Insert | Public Update/Delete |
|---|---|---|---|
| Published properties | Yes | No | No |
| Draft/archived properties | No | No | No |
| Media for published properties | Yes | No | No |
| Media for draft/archived properties | No | No | No |
| Active areas | Yes | No | No |
| Published legal pages | Yes | No | No |
| Public stakeholder fields | Yes, only if explicitly `visibility = public` AND property is published | No | No |
| Leads | No | Yes (validated, rate-limited) | No |
| WhatsApp click events | No | Yes (no PII, rate-limited) | No |
| Settings | No direct public DB read (safe server selector only) | No | No |
| User profiles | No | No | No |
| Audit logs | No | No | No |

---

## Admin Access Matrix

| Resource | `super_admin` | `client_admin` |
|---|---|---|
| Properties | Full | Full except hard delete |
| Media | Full | Upload/update/delete within normal workflow |
| Leads | Full (archive/soft-delete/export) | Manage, archive/soft-delete/export |
| Settings | Full | Update allowed settings only |
| Legal pages | Full | Draft/publish/archive within workflow |
| Areas | Full | Add/edit/deactivate |
| User profiles | Full | No user management |
| Audit logs | Full | Read limited if exposed; write only via server-side audited actions |
| Hard delete | Outside normal UI only | No |

---

## Authentication Rules

Admin access requires all of:
1. Valid Supabase session (JWT)
2. Matching row in `user_profiles`
3. Role in `super_admin` or `client_admin`
4. Route/API authorization check
5. RLS policy compliance

**No public admin self-signup.** First `super_admin` created via Supabase Auth + seed/admin script (D-40).

---

## Secrets and Environment

| Variable | Location |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client-safe) |
| `NEXT_PUBLIC_SITE_URL` | Public (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only; never in client bundle** |
| `RESEND_API_KEY` | Server-only |
| `SENTRY_AUTH_TOKEN` | Server-only |
| `ADMIN_NOTIFICATION_EMAIL` | Server-only |
| `RESEND_FROM_EMAIL` | Server-only |
| `RATE_LIMIT_SALT` | Server-only (used to compute rate-limit key hashes) |

Rules:
- Never commit `.env` files
- Use Vercel encrypted env storage for production secrets
- Rotate secrets when leaked or team changes
- Validate env at startup/server boundary

---

## Rate Limiting

Rate-limit key = `salted-hash(IP + route)` — server-side only. Raw IP is never stored in `rate_limits` or any event/analytics table (D-51, D-18).

| Route | Limit |
|---|---|
| `POST /api/leads` | 5 / hour per key |
| `POST /api/whatsapp-clicks` | 30 / hour per key |
| Admin login route | 5 / 15 min per key |

MVP implementation: table-based (`rate_limits` table with 24-hour TTL + scheduled cleanup). Future option: Upstash/Vercel KV (D-39).

---

## Storage Rules

MVP storage posture:
- **Public-read bucket** with UUID-based file paths (prevents enumeration)
- Public media read served via CDN from the public-read bucket
- **Write and delete** require valid admin session + role check at API layer (Supabase RLS + Route Handler auth)
- Path naming must use UUID-based components

**Known limitation:** Archived-property media CDN revocation is not guaranteed without signed URLs. A caller who retained the URL path may still fetch the asset after archival. Full revocation requires signed URLs — deferred out of MVP and documented at handover.

Upload validation:
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 10MB per image
- Storage paths must not expose service credentials or allow traversal

---

## Legal Content Security (D-12)

Legal content must be:
- Markdown or controlled/sanitized rich text
- Sanitized before render if rich text is allowed
- **Never** unrestricted raw HTML
- **Never** `dangerouslySetInnerHTML` without strict sanitization

This is a merge blocker. Any PR rendering raw legal HTML is blocked.

---

## Data Privacy Rules

- No raw IP stored in `whatsapp_clicks` or `rate_limits` (D-18, D-51)
- No personal data in WhatsApp tracking payload
- Lead data accessible to admin only (public cannot read leads)
- Lead export must be audit-logged
- Admin exports must not be publicly accessible
- Demo data must be fake/test only (no real PII in AUTEX demo)

---

## Audit Logging

Required for (D-38):
- `property_created`, `property_updated`, `property_published`, `property_archived`
- `lead_status_updated`, `lead_archived`, `lead_exported`
- `settings_updated`
- `legal_page_created`, `legal_page_published`, `legal_page_archived`
- `area_created`, `area_updated`
- `admin_access_denied` where practical

Rules:
- Public cannot read or write audit logs
- Append-only from application perspective
- Do not store service-role keys, full lead exports, or unnecessary PII in snapshots

---

## Merge Blockers (Security)

A PR must be blocked if any of these occur:
- Public can read leads
- Public can read WhatsApp analytics
- Public can read internal stakeholders
- Public can read draft/archived properties
- Service-role key appears in client bundle
- Legal content renders unsafe HTML
- `clients` table or `client_id` introduced
- IP stored in `whatsapp_clicks` by default
- Admin route relies only on authentication without role check
- Sensitive admin state change has no audit-log plan
- Lead export is not audit-logged
- Media upload has no file type/size validation

---

## Dependency Security

- Run `npm audit --audit-level=high` on every PR
- Block high/critical vulnerabilities unless explicitly approved
- Use Dependabot or Renovate for automated dependency updates
- CodeQL and Semgrep (recommended) for static analysis
- Check licenses for commercial compatibility

---

## Incident Response (Summary)

| Severity | Example | Response |
|---|---|---|
| P0 | Lead data exposure, service-role leak, RLS failure | Stop release, rotate secrets, patch immediately, postmortem |
| P1 | Lead form broken, admin unavailable | Fix urgently, communicate impact |
| P2 | Visual bug, analytics gap | Queue fix |

Full incident procedure in `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md` §25.
