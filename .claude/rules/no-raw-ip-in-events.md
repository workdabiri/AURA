# Rule: No Raw IP in Event or Analytics Tables

**Type:** Merge Blocker  
**Locked Decisions:** D-18, D-51  
**Enforced By:** Code review, migration review, DAL security tests

---

## Rule

Block any PR that stores a raw IP address in:

- `whatsapp_clicks` table
- `rate_limits` table
- `audit_logs` table
- Any other event, analytics, or tracking table

---

## Why

Storing raw IP addresses in analytics tables is a privacy risk that:
1. Exposes visitor PII in a table accessible to multiple admin users
2. May require consent under GDPR/PDPA/UAE privacy frameworks
3. Contradicts D-18 (WhatsApp tracking without PII) and D-51 (rate-limit key strategy)

The approved rate-limit key strategy (D-51) hashes the IP server-side:
- Key = `salted-hash(IP + route)` — computed in Route Handler, never persisted raw
- Salt = `RATE_LIMIT_SALT` server-only environment variable
- Stored: only the hash, route, and count — never the IP itself

---

## How to Check

```bash
# Check migrations for ip_address columns in event/analytics tables
grep -i "ip_address\|ip_addr\|user_ip\|client_ip" supabase/migrations/

# Check API handlers for raw IP extraction without hashing
grep -rn "x-forwarded-for\|x-real-ip\|request.ip" src/app/api/ --include="*.ts"
```

Any raw IP extraction that is then stored (not just used ephemerally for hash computation) → **BLOCK the PR**.

---

## Correct Pattern

```ts
// Correct: hash the IP server-side; store only the hash
import { createHash, createHmac } from 'crypto'

const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
const salt = process.env.RATE_LIMIT_SALT ?? ''
const keyHash = createHmac('sha256', salt).update(`${ip}:${route}`).digest('hex')

// Store keyHash in rate_limits — never store ip
```

---

## Verdict

Any migration or code that stores raw IP in an event/analytics table → **BLOCK the PR**.
