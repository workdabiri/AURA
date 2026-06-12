# Rule: Architecture Dependency Direction

**Type:** Merge Blocker  
**Source:** Pack §9.4  
**Enforced By:** `dependency-cruiser` (`npm run deps:check`), code review

---

## Allowed Dependency Direction

```
app/routes → components → domain → dal/services → lib/config
```

Import must flow in this direction only. Reverse imports are forbidden.

---

## Forbidden Import Patterns

| From | Must Not Import | Reason |
|---|---|---|
| `dal/` | `components/`, `app/` | DAL is a data layer; it must not depend on UI |
| `domain/` | `components/`, `app/` | Domain is pure business logic; no UI coupling |
| `domain/` | `dal/` | Domain defines interfaces; DAL implements them |
| `components/ui/` | `dal/`, `services/` | UI primitives must not query data directly |
| Any client component | service-role helpers | Service-role must be server-only |
| API handlers | Without Zod validation | All route handlers must validate input with Zod |
| JSX components | Business rules inline | Business rules live in `domain/`, not JSX |

---

## Why

Clean dependency direction:
1. Makes the codebase testable in isolation (domain logic can be unit-tested without DB)
2. Prevents circular dependencies
3. Ensures the DAL can be swapped or mocked at a boundary
4. Keeps UI components reusable across pages without data coupling
5. Prevents service-role key from leaking into client components

---

## How to Check

```bash
npm run deps:check
```

This runs `dependency-cruiser --validate .dependency-cruiser.cjs` against `src/app`, `src/components`, `src/domain`, `src/dal`, `src/services`, `src/lib`.

Check `.dependency-cruiser.cjs` for the rule configuration.

---

## Common Violations to Watch For

```ts
// VIOLATION: UI component directly querying Supabase
// src/components/real-estate/PropertyCard.tsx
import { supabase } from '@/lib/supabase/client' // ← WRONG

// CORRECT: UI component receives data as props from Server Component or TanStack Query
// that calls an API route, which calls the DAL
```

```ts
// VIOLATION: Domain importing a React hook
// src/domain/properties/validation.ts
import { useState } from 'react' // ← WRONG

// Domain files must be pure TypeScript with no React imports
```

```ts
// VIOLATION: API handler without Zod validation
// src/app/api/leads/route.ts
export async function POST(request: Request) {
  const body = await request.json() // ← WRONG: no validation
  await insertLead(body)
}

// CORRECT:
const schema = z.object({ name: z.string(), phone: z.string() })
const parsed = schema.safeParse(await request.json())
if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
```

---

## Verdict

Any PR introducing a forbidden cross-layer import → **BLOCK the PR** until dependency-cruiser reports clean.
