# AURA — Glossary

**Source:** Pack §11.1.1 + §3  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Product / Brand Terms

| Term | Definition |
|---|---|
| **AURA** | The reusable private real estate website engine; the internal productized delivery system. |
| **AUTEX Estates Dubai** | The fictional flagship demo brand created with AURA. Demo-only, noindex by default. |
| **Core Engine** | The AURA codebase that is forked and customized per client delivery. |
| **Client Deployment** | A fully isolated Vercel + Supabase + domain instance for one real estate client. |
| **Sales Demo Mode** | A presentation mode activated by config + `?demo=sales` query param. Labels are shown to aid sales demos. Off by default for real clients. |
| **Client Deployment Factory** | The structured workflow for creating a new client repo from the AURA core template. |

---

## Property Taxonomy Enums

These are the canonical status and classification fields. Do not overload a single `status` field.

### `publish_status`
Controls whether the property is visible in the public listing.

| Value | Meaning |
|---|---|
| `draft` | Not published; admin-only view. |
| `published` | Live and visible publicly. |
| `archived` | Removed from public listing; retained in DB. |

### `transaction_type`
The commercial transaction intent.

| Value | Meaning |
|---|---|
| `sale` | For sale. Maps to "Buy" in UI. |
| `rent` | For rent. Maps to "Rent" in UI. |

### `market_type`
The market segment.

| Value | Meaning |
|---|---|
| `ready` | Ready to move in / secondary market. |
| `off_plan` | Off-plan / under construction. Maps to "Off-plan" in UI. |

### `property_type`
Physical property classification.

| Value | Meaning |
|---|---|
| `apartment` | Apartment/flat. |
| `villa` | Standalone villa. |
| `townhouse` | Townhouse. |
| `penthouse` | Penthouse unit. |
| `office` | Commercial office. |
| `plot` | Land plot. |
| `retail` | Retail unit. |
| `warehouse` | Warehouse/industrial. |

### `availability_status`
Current availability of the property (independent of `publish_status`).

| Value | Meaning |
|---|---|
| `available` | Available for sale or rent. |
| `reserved` | Reserved by a buyer/tenant. |
| `sold` | Sold (for sale listings). |
| `rented` | Rented (for rent listings). |
| `unavailable` | Not currently available (e.g., off-market). |

### `price_visibility`
Whether the price is displayed publicly.

| Value | Meaning |
|---|---|
| `visible` | Price shown publicly. |
| `price_on_application` | Price hidden; CTA to contact agent. |

### `rental_period`
The rental cadence (for `transaction_type = rent`).

| Value | Meaning |
|---|---|
| `yearly` | Annual rent. |
| `monthly` | Monthly rent. |
| `weekly` | Weekly rent. |
| `daily` | Daily/short-term rent. |
| `null` | Not applicable. |

---

## Lead Enums

### `lead_status`

| Value | Meaning |
|---|---|
| `new` | Freshly submitted, not yet actioned. |
| `contacted` | Admin has reached out. |
| `qualified` | Verified as a genuine buyer/renter. |
| `unqualified` | Not a match for current listings. |
| `won` | Deal closed. |
| `lost` | Lead lost to competitor or inactivity. |
| `archived` | Soft-deleted / hidden from default admin view. |

### `lead_source`

| Value | Meaning |
|---|---|
| `homepage` | Lead from homepage hero CTA. |
| `listing` | Lead from property listing page. |
| `property_detail` | Lead from property detail inquiry form. |
| `contact_page` | Lead from contact page form. |
| `whatsapp_cta` | Lead identified via WhatsApp click context. |
| `sales_demo` | Lead from sales demo mode session. |

### `lead_priority`

| Value | Meaning |
|---|---|
| `low` | Low urgency. |
| `normal` | Default priority. |
| `high` | High urgency; needs prompt follow-up. |

---

## UI Intent Mapping

These UI-layer terms map to DB fields as follows:

| UI Term | DB Field |
|---|---|
| Buy | `transaction_type = sale` |
| Rent | `transaction_type = rent` |
| Off-plan | `market_type = off_plan` |
| Invest | UI intent filter only; not a DB status |

---

## Admin Roles

| Role | Description |
|---|---|
| `super_admin` | Agency/internal owner; full access including user management and destructive operations outside normal UI. |
| `client_admin` | Client/admin user; manage properties, leads, settings, legal pages, areas, dashboard. |

Non-MVP roles (do not implement): `editor`, `agent`, `viewer`, `support`.

---

## Technical Terms

| Term | Definition |
|---|---|
| **RLS** | Row-Level Security (Supabase/PostgreSQL). Controls which rows each role can access. |
| **DAL** | Data Access Layer (`src/dal/`). The only layer that directly queries Supabase. |
| **Domain** | Business rules layer (`src/domain/`). No React, no DB queries. |
| **Service** | External integrations layer (`src/services/`). Email, storage, rate-limit, analytics. |
| **Merge Blocker** | A condition that must block a PR from merging if found. See `.claude/rules/`. |
| **Quality Gate** | An automated check that must pass before a task is considered done. |
| **Slug** | URL-safe identifier derived from the `en` title; immutable after publish (A-06). |
| **Rate-limit key** | `salted-hash(IP + route)`, server-side only; raw IP is never stored (D-51). |
| **GSAP** | GreenSock Animation Platform; used only for homepage/storytelling; not in admin or forms. |
| **Framer Motion** | Used only for lightweight UI transitions; not for heavy homepage animations. |
