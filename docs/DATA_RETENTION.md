# AURA — Data Retention

**Source:** Pack §22.3  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Retention Defaults (MVP)

| Entity | Retention Policy |
|---|---|
| **Leads** | Retain until manually archived/exported/deleted per client policy. No automatic expiration in MVP. |
| **Archived leads** | Hidden from default admin view; retained in DB for audit/client operations. |
| **WhatsApp clicks** | Aggregate analytics use. No automatic expiration in MVP. Review scheduled retention post-MVP. |
| **Admin/audit logs** | Retain as practical for support and security purposes. No automatic purge in MVP. |
| **Legal page versions** | Retain all archived versions for legal and audit trail. Do not hard-delete. |
| **Rate limit records** | 24-hour TTL; expired rows removed by scheduled cleanup (Supabase pg_cron or equivalent). |
| **Property media** | Retained until manually deleted by admin workflow. Review CDN revocation limitation at handover. |

---

## Data Collected

MVP collects:
- Lead: name, phone, optional email, optional message, source, filter context
- Admin profile: Supabase Auth user + `user_profiles` row (role, full_name)
- WhatsApp click: source, optional property_id, optional filter context — **no PII**

---

## Privacy Rules

- Lead forms must link to active Privacy Policy (D-11)
- No unnecessary IP storage in any table (D-18, D-51)
- WhatsApp tracking must not store personal data by default
- Admin exports must be protected and audit-logged
- Demo data must be fake/test only; no real PII in AUTEX demo
- Production client data must never be used in demo environments

---

## Client Legal Readiness (D-50)

Before any real-client production launch becomes indexable, confirm and document client approval for:

- [ ] Company legal name
- [ ] Trade license / brokerage license where applicable
- [ ] RERA/ORN/BRN fields where applicable
- [ ] Office address and public contact details
- [ ] Privacy Policy content
- [ ] Terms & Conditions content
- [ ] Image and content ownership
- [ ] Property data accuracy
- [ ] License-safe media
- [ ] SEO index approval

AUTEX demo cannot use this checklist to imply real business operation. AUTEX remains fictional unless legally established and verified.

---

## Backup Scope

Required before production handover:
- Supabase database (automated Supabase backups)
- Supabase storage (backup strategy documented)
- Environment variable inventory (separate secure storage)
- GitHub repository (origin remote)
- Legal page versions (in DB + documented)
- Demo seed data (version-controlled seed scripts)

Recovery targets for MVP:
- RPO: best effort based on Supabase backup availability
- RTO: restore within the operational support window

---

## Post-MVP Retention Review

These require explicit review decisions after MVP ships:

1. WhatsApp click data volume and retention window
2. Archived lead hard-delete workflow for privacy compliance
3. Rate limit table cleanup schedule tuning
4. Audit log archival/compression for long-running deployments
5. Media storage lifecycle for archived properties

Retention policies must be documented in the client handover package.
