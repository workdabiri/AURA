# Rule: Service-Role Key Must Never Appear in Client Bundle

**Type:** Merge Blocker  
**Locked Decision:** D-35, Security Baseline §12  
**Enforced By:** Code review, build output inspection, `server-only` module enforcement

---

## Rule

Block any PR that causes `SUPABASE_SERVICE_ROLE_KEY` or any other secret server-only variable to be:

- Imported or used in a React component (client component)
- Prefixed with `NEXT_PUBLIC_` (which would expose it in the client bundle)
- Used in any file that is imported by a client component
- Referenced in `next.config.js` `publicRuntimeConfig`

---

## Why

The Supabase service-role key bypasses Row-Level Security. If it leaks to the client bundle, any visitor to the site can access all data in the database — including leads, stakeholder data, and admin-only content. This is a critical security vulnerability.

---

## How to Check

```bash
# Check for SUPABASE_SERVICE_ROLE_KEY in client-side imports
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/app --include="*.tsx" --include="*.ts"
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/components --include="*.tsx" --include="*.ts"

# Verify server-only modules are used where service role is needed
grep -r "server-only" src/lib/supabase/

# Check build output for exposed secrets
# Run: npm run build
# Then inspect .next/static/ for key patterns
```

---

## Correct Pattern

Server-role key must only be used in:
- `src/lib/supabase/server.ts` (or equivalent)
- Route Handlers (`src/app/api/...`)
- Server Components (when used directly, not through a client import)

Always use `import 'server-only'` at the top of any file that uses the service-role key.

---

## Verdict

Any PR where the service-role key is accessible client-side → **BLOCK the PR**.
