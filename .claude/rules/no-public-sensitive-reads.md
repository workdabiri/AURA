# Rule: No Public Read of Sensitive Data

**Type:** Merge Blocker  
**Source:** Pack §12.6, §12.1, §12.2  
**Enforced By:** RLS policies, DAL security tests, code review, `npm run test:security`

---

## Rule

Block any PR where unauthenticated/anonymous requests can read:

- **Leads** — any row in `leads` table
- **WhatsApp analytics** — any row in `whatsapp_clicks` table
- **Internal stakeholders** — any stakeholder with `visibility = internal_only`
- **Draft properties** — any property with `publish_status = draft`
- **Archived properties** — any property with `publish_status = archived`
- **User profiles** — any row in `user_profiles` table
- **Audit logs** — any row in `audit_logs` table
- **Settings** — direct DB read (public reads must go through a safe server selector in Route Handlers)

---

## Why

AURA is a commercial real estate platform. Lead data contains personal information (name, phone). Analytics data reveals business intelligence. Internal stakeholder data reveals agency relationships. Draft/archived properties may contain unpublished pricing or sensitive commercial information.

Public exposure of any of these is a P0 security incident.

---

## RLS Policy Requirements

Every sensitive table must have RLS enabled with explicit policies:

```sql
-- Example: leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Public insert (validated, rate-limited via Route Handler)
CREATE POLICY "Public can insert leads" ON leads
  FOR INSERT TO anon WITH CHECK (true);

-- Admin read only
CREATE POLICY "Admin can read leads" ON leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('super_admin', 'client_admin')
    )
  );

-- NO public SELECT policy — anon cannot read leads
```

---

## How to Check

```bash
# Run security negative tests
npm run test:security

# Manual check: verify RLS policies exist in migrations
grep -A 5 "ENABLE ROW LEVEL SECURITY" supabase/migrations/

# Verify public API responses don't leak sensitive data
# Test: GET /api/properties/[slug] — confirm internal stakeholders absent
# Test: GET /api/admin/leads — confirm 401 without auth header
```

---

## Required Security Negative Test Cases

The following must exist in `src/tests/security/`:

- `anon cannot SELECT from leads`
- `anon cannot SELECT from whatsapp_clicks`
- `anon cannot SELECT from user_profiles`
- `anon cannot SELECT from audit_logs`
- `anon cannot SELECT draft properties`
- `anon cannot SELECT archived properties`
- `property detail response does not include internal_only stakeholders`
- `unauthenticated GET /api/admin/leads returns 401`
- `authenticated no-role GET /api/admin/leads returns 403`

---

## Verdict

Any PR where the above data is readable without authentication and role check → **BLOCK the PR**.

RLS policy missing on a sensitive table → **BLOCK the PR** (treat as equivalent to public read).
