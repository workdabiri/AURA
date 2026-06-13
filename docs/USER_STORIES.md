# AURA — User Stories

**Source:** Pack §7, §8, §14  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Public Website Stories

### US-01: Homepage Browsing
**As a** property buyer/investor, **I want to** see a premium homepage with filtering options, **so that** I can quickly find properties matching my goal, area, and budget.

**Acceptance:** Hero loads; filters work (goal, area, budget, optional bedrooms/type); CTA routes to filtered listing.

---

### US-02: Property Listing
**As a** property buyer/renter, **I want to** browse and filter published properties, **so that** I can find listings matching my criteria.

**Acceptance:** Grid shows published properties; filters by transaction type, market type, property type, area, price range, bedrooms; search by reference/keyword; sort by newest/price; pagination works; empty state shown; draft/archived properties never appear.

---

### US-03: Property Detail
**As a** property buyer, **I want to** view full property details with gallery, specs, and contact options, **so that** I can evaluate the property and inquire.

**Acceptance:** Gallery loads; title, price, area, specs displayed; inquiry form works; WhatsApp CTA opens correct URL; off-plan block shown only when `market_type = off_plan`; internal stakeholders are hidden; `price_on_application` displays correctly.

---

### US-04: WhatsApp CTA
**As a** visitor, **I want to** click a WhatsApp CTA to contact the agent, **so that** I can get quick answers.

**Acceptance:** WhatsApp opens with correct number (routing: property override → agency settings); click event tracked without PII; no phone/email/IP in tracking payload.

---

### US-05: Lead Inquiry
**As a** property buyer, **I want to** submit an inquiry form, **so that** the agent can follow up with me.

**Acceptance:** Form validates name, phone (required), email (optional), message; invalid phone rejected; lead stored in DB; email notification sent to admin; lead submission does not fail if email fails; public cannot read other leads.

---

### US-06: Areas Overview
**As a** visitor, **I want to** explore Dubai areas, **so that** I can understand what each community offers.

**Acceptance:** Active areas displayed; inactive areas hidden; area detail shows description and properties in that area.

---

### US-07: Legal Pages
**As a** visitor, **I want to** read the Privacy Policy and Terms, **so that** I understand how my data is used.

**Acceptance:** Published version accessible at `/en/privacy` and `/en/terms`; draft pages not accessible publicly; safe rendering (no raw HTML).

---

### US-08: Sales Demo Mode
**As a** sales rep, **I want to** activate Sales Demo Mode to show commercial labels during a presentation, **so that** prospects see value without affecting normal visitor UX.

**Acceptance:** Demo labels appear only when `salesDemoMode = true` in config AND `?demo=sales` in URL; no admin/private data exposed; page is noindex.

---

## Admin Stories

### US-10: Admin Login
**As an** admin user, **I want to** log in securely, **so that** I can access the admin panel.

**Acceptance:** Login requires Supabase Auth credentials; valid session + role in `user_profiles` required; no public self-signup.

---

### US-11: Property Management
**As a** `client_admin`, **I want to** create, edit, publish, archive, and duplicate properties, **so that** I can keep the website listing current.

**Acceptance:** Draft can be saved with partial data; publish requires checklist-complete data (slug, reference, title en, description en, cover image with alt, price or POA, required taxonomy); published property appears publicly; draft/archived never appear publicly; duplicate creates new draft.

---

### US-12: Media Management
**As a** `client_admin`, **I want to** upload property images and floorplan images, **so that** visitors see the property visually.

**Acceptance:** Images and floorplan images supported; video out of MVP; file type validated (jpeg/png/webp); max 10MB; UUID-based storage path; cover image required before publish; alt text required before publish.

---

### US-13: Lead Management
**As a** `client_admin`, **I want to** view, search, update status, archive, and export leads, **so that** I can track and action inquiries.

**Acceptance:** Leads visible in admin only; search/filter by status, source, property, date; status updates use `lead_status` enum only; archive soft-deletes; export audit-logged; public cannot access leads.

---

### US-14: Settings Management
**As a** `client_admin`, **I want to** update contact info, social links, footer content, and SEO basics, **so that** the website reflects the agency's current details.

**Acceptance:** Allowed keys editable; forbidden keys rejected; changes audit-logged; template architecture cannot be changed via settings.

---

### US-15: Legal Page Management
**As a** `client_admin`, **I want to** create, edit, publish, and archive legal pages, **so that** visitors see current Privacy Policy and Terms.

**Acceptance:** Draft workflow works; publish increments version; previous version archived; raw unsafe HTML rejected; public sees only active published version.

---

### US-16: Dashboard
**As a** `client_admin`, **I want to** see a dashboard with property, lead, and WhatsApp metrics, **so that** I can understand site performance.

**Acceptance:** Shows total/published/draft/archived properties; total/new leads; leads by source; WhatsApp clicks; most inquired/clicked property; recent leads/properties.

---

### US-17: Areas Admin
**As a** `client_admin`, **I want to** add, edit, and deactivate areas, **so that** the areas overview stays accurate.

**Acceptance:** Add area with name (JSONB), description (JSONB), slug; edit area; deactivate sets `is_active = false`; inactive areas hidden publicly.

---

### US-18: First Super Admin Bootstrap
**As a** system operator, **I want to** create the first `super_admin` without a public signup page, **so that** admin access is controlled from day one.

**Acceptance:** No public admin registration page exists; first user created manually in Supabase Auth; seed/admin script creates `user_profiles` row with `role = super_admin`.
