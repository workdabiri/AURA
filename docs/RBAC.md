# AURA — Role-Based Access Control (RBAC)

**Source:** Pack §12 + §6  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## MVP Roles

Only two roles exist in MVP (D-30):

| Role | Purpose |
|---|---|
| `super_admin` | Agency/internal owner. Full access including user management, destructive operations outside normal UI. |
| `client_admin` | Client/admin user. Manage properties, leads, settings, legal pages, areas, dashboard. |

**Non-MVP roles (do not implement):** `editor`, `agent`, `viewer`, `support`. These may be documented in Roadmap Parking Lot only.

---

## Admin Access Requirements

Authentication alone is not sufficient. Admin access requires all of:
1. Valid Supabase session (JWT not expired)
2. Matching row in `user_profiles`
3. `user_profiles.role IN ('super_admin', 'client_admin')`
4. Route/API-level authorization check
5. RLS policy compliance

Failing any check: return `401` (not authenticated) or `403` (not authorized).

### Implementation status (AURA-301, AURA-302)

Admin access for `/admin/**` **pages** is now wired (AURA-301, merged `97c9548`): the protected
admin layout (`src/app/admin/(protected)/layout.tsx`) enforces the full AURA-104 guard server-side
(verified `auth.getUser()` + `user_profiles` row + role in `super_admin` / `client_admin`); the
login server action re-authorizes the just-signed-in user before redirecting and signs out any
authenticated-but-unprivileged session. `401` → `/admin/login`; `403` → `/admin/login?error=unauthorized`.

The **admin dashboard shell** `/admin/dashboard` (AURA-302, merged `df4523c`) is now protected by this
same guard — it lives **inside** the `(protected)` group (`src/app/admin/(protected)/dashboard/**`),
so it inherits the layout guard with no auth logic of its own; there is no unguarded admin dashboard
route. `/admin` redirects to `/admin/dashboard` from inside the guard. In AURA-302 **both `super_admin`
and `client_admin` see the same dashboard shell** (no role-conditional navigation; the shell is a
navigation surface with placeholder panels only — no resource-specific admin pages exist yet).

**Note (route handlers):** the layout guard protects **pages**, not Route Handlers. Future
`/api/admin/*` handlers (AURA-303+) must each call `requireAdmin()` / `requireSuperAdmin()`
individually — being under `/admin` does not auto-protect an API route. (AURA-302 added no API routes.)

**Implemented (AURA-303, merged `a6cb178`):** the first admin Route Handlers exist — `GET/POST /api/admin/properties`, `PATCH /api/admin/properties/[id]`, `POST /api/admin/properties/[id]/duplicate`, `PATCH /api/admin/properties/[id]/archive`. **Each calls `requireAdmin()` directly** (via a shared `withAdmin` helper), honoring the note above. Property management uses the **any-admin** guard, so **both `super_admin` and `client_admin`** can create / edit / publish / archive / duplicate properties (matching the matrix below); **no property action is super-admin-only**. The guarded admin property pages live under `src/app/admin/(protected)/properties/**`; there is no unguarded `src/app/admin/properties/**` route.

**Implemented (AURA-304, merged `631bd29`):** the admin property **media** Route Handlers exist — `POST /api/admin/properties/[id]/media`, `PATCH /api/admin/properties/[id]/media/[mediaId]`, `DELETE /api/admin/properties/[id]/media/[mediaId]`. **Each calls `requireAdmin()` directly** via `withAdmin`, so **both `super_admin` and `client_admin`** can upload / update / delete property media (matching the Media rows in the matrix below); **no media action is super-admin-only**. **Public cannot upload / update / delete media** (no anon write path). Published-property media remains **publicly readable only through published-parent visibility** (the AURA-103 anon RLS policy); **draft / archived property media is not public**.

**Implemented (AURA-305, merged `aee1fda`):** the admin **areas** Route Handlers exist — `GET /api/admin/areas`, `POST /api/admin/areas`, `PATCH /api/admin/areas/[id]`. **Each calls `requireAdmin()` directly** via `withAdmin` (not `requireSuperAdmin()`), so **both `super_admin` and `client_admin`** can list, create, edit, deactivate / reactivate areas, and upload / replace the one representative area image (matching the Areas rows in the matrix below); **no area action is super-admin-only**. **Add / edit / deactivate / reactivate only — no hard delete.** **Public cannot create / edit / deactivate / reactivate areas** (no anon write path); the public `/api/areas` surface stays **active-only** and inactive areas stay hidden. The admin-only per-area **property counts** (`totalProperties`, `publishedProperties`) are never exposed publicly.

**Implemented (AURA-306, merged `86e8b36`):** the admin **settings** Route Handlers exist — `GET /api/admin/settings`, `PATCH /api/admin/settings`. **Each calls `requireAdmin()` directly** via `withAdmin` (not `requireSuperAdmin()`), so **both `super_admin` and `client_admin`** can read and update **all** the allowed AURA-306 settings (the seven public footer keys); **no settings key is super-admin-only**. Admin GET/PATCH run under a **request-scoped authenticated admin Supabase client + RLS — no service role** (the existing public safe selector keeps the service role; the audit writer keeps the service role). **Public cannot read or write the admin settings endpoints** (no anon path); the public surface receives only the **safe, server-projected** settings via the existing AURA-201 selector. `PATCH` is a partial batch with per-key Zod; unknown/deferred keys and empty patches are rejected; updates are immediate; **no settings DELETE**.

**Implemented (AURA-307, merged `74da365`) — Phase 3 exit gate:** the admin **legal** Route Handlers exist — `GET /api/admin/legal`, `POST /api/admin/legal`, `PATCH /api/admin/legal/[id]`, `POST /api/admin/legal/[id]/publish`, `POST /api/admin/legal/[id]/archive`. **Each calls `requireAdmin()` directly** via `withAdmin` (not `requireSuperAdmin()`), so **both `super_admin` and `client_admin`** can create / edit / publish / archive legal pages; **no legal action is super-admin-only**. Admin legal CRUD runs under a **request-scoped authenticated admin Supabase client + RLS — no service role** (the service-role path remains isolated to the audit writer). Slugs are limited to `privacy` / `terms` (no arbitrary slugs). **Public cannot create / edit / publish / archive legal pages** (no anon write path); public legal reads stay **published-only** and draft / archived pages remain hidden publicly. **Archive only — no hard delete.**

---

## Permission Matrix

| Resource/Action | `super_admin` | `client_admin` | Public |
|---|---|---|---|
| **Properties** | | | |
| Read all (draft/published/archived) | Yes | Yes | No |
| Read published only | Yes | Yes | Yes |
| Create draft | Yes | Yes | No |
| Update | Yes | Yes | No |
| Publish | Yes | Yes | No |
| Archive | Yes | Yes | No |
| Hard delete | Outside UI only | No | No |
| Duplicate | Yes | Yes | No |
| **Media** | | | |
| Upload | Yes | Yes | No |
| Delete | Yes | Yes (own workflow) | No |
| Read (published property) | Yes | Yes | Yes |
| Read (draft/archived property) | Yes | Yes | No |
| **Leads** | | | |
| Submit | No | No | Yes (insert only) |
| Read/search | Yes | Yes | No |
| Update status/notes | Yes | Yes | No |
| Archive/soft-delete | Yes | Yes | No |
| Export | Yes | Yes | No |
| Hard delete | Outside UI only | No | No |
| **Settings** | | | |
| Read | Yes | Yes | No (safe server selector only) |
| Update (any allowed key) | Yes | Yes | No |
| **Legal Pages** | | | |
| Create draft | Yes | Yes | No |
| Update draft | Yes | Yes | No |
| Publish | Yes | Yes | No |
| Archive | Yes | Yes | No |
| Read published | Yes | Yes | Yes |
| **Areas** | | | |
| Create | Yes | Yes | No |
| Edit | Yes | Yes | No |
| Deactivate (`is_active = false`) | Yes | Yes | No |
| Read active | Yes | Yes | Yes |
| **User Profiles** | | | |
| Create/manage admin users | Yes | No | No |
| Read own profile | Yes | Yes | No |
| **Audit Logs** | | | |
| Read | Yes | Limited if exposed (optional) | No |
| Write | Server-side only | Server-side only | No |
| **Dashboard Metrics** | | | |
| Read | Yes | Yes | No |

---

## RLS Policy Guidance

All sensitive tables require RLS policies. Public access is allowlisted, not default-open.

**`properties` table:**
- SELECT: `publish_status = 'published'` for anon; all rows for admin role
- INSERT: admin role only
- UPDATE: admin role only
- DELETE: admin role only (outside normal UI)

**`leads` table:**
- SELECT: admin role only (never public)
- INSERT: anon (rate-limited, validated)
- UPDATE: admin role only

**`whatsapp_clicks` table:**
- SELECT: admin role only (never public)
- INSERT: anon (rate-limited; PII fields rejected)

**`user_profiles` table:**
- SELECT: own row (authenticated users); full for `super_admin`
- INSERT/UPDATE: `super_admin` or system only

**`audit_logs` table:**
- SELECT: `super_admin` only (or limited `client_admin` if UI exposed later)
- INSERT: server-side service role only

**`settings` table:**
- SELECT: admin role only (public reads go through a safe server selector in Route Handlers)
- UPDATE: admin role only; allowed keys only; per-key Zod validation

**`legal_pages` table:**
- SELECT: `status = 'published'` for anon; all for admin
- INSERT/UPDATE: admin role only

**`areas` table:**
- SELECT: `is_active = true` for anon; all for admin
- INSERT/UPDATE: admin role only

---

## WhatsApp Contact Routing Priority

When determining the WhatsApp number to use for a property CTA:

```
1. property.agent_whatsapp
2. property.agent_phone
3. settings.whatsapp
4. settings.phone
```

Stakeholder phone/email/WhatsApp must never be used for public routing unless the stakeholder is explicitly `visibility = public` and the route has been deliberately configured (D-14, D-16).

---

## Bootstrap Flow for First Admin

No public admin self-signup in MVP (D-40).

1. Create first user manually in Supabase Auth
2. Run protected local/seed/admin script to create `user_profiles` row with `role = super_admin`
3. `super_admin` creates or coordinates `client_admin` accounts
4. Every admin access attempt requires session + profile role check

**Forbidden:**
- Public admin registration page
- Automatic first-user-becomes-admin logic in production
- Hardcoded admin credentials
- Demo admin accounts reused for real client production
