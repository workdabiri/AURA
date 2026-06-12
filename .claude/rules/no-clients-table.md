# Rule: No clients Table or client_id Column

**Type:** Merge Blocker  
**Locked Decision:** D-05  
**Enforced By:** Code review, `.claude/rules/`, dependency-cruiser

---

## Rule

Block any PR or code change that introduces:

- A table named `clients`
- A column named `client_id` in any table
- A shared production database across multiple real estate clients
- Tenant routing logic that routes requests based on a client identifier
- Multi-tenant SaaS architecture in any form, including "for future use" stubs

---

## Why

AURA is a reusable private real estate website engine with **separate deployments per client** (D-04). Each client has their own Vercel project, Supabase project, domain, database, and admin users. Introducing a `clients` table or `client_id` would:

1. Undermine the entire deployment isolation architecture
2. Create cross-client data access risk
3. Contradict the one-time delivery model (D-23)
4. Introduce complexity that is explicitly out of MVP scope (D-03, D-05)

---

## How to Check

Search for these patterns before submitting a PR:

```bash
grep -r "clients" supabase/migrations/
grep -r "client_id" supabase/migrations/
grep -r "client_id" src/
grep -rn "tenantId\|tenant_id\|clientId\|client_id" src/
```

---

## Verdict

Any match that is not a legitimate use of the word "client" (e.g., `supabaseClient`, `createClient`) that introduces tenant isolation → **BLOCK the PR**.

---

## Exception

The Supabase client utility (`createClient`, `createServerClient`) is unrelated to this rule. The rule targets the data model only.
