# AURA — Acceptance Criteria

**Source:** Pack §14  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Property Management

- [ ] Draft can be saved with partial valid data
- [ ] Publish requires: slug, reference_number (unique), title_en, description_en, publish_status, cover image with alt text, price OR price_on_application flag, valid taxonomy fields
- [ ] Published property appears publicly at `/en/properties/[slug]`
- [ ] Draft property returns 404 publicly
- [ ] Archived property returns 404 publicly
- [ ] Duplicate creates a new draft; original is unchanged
- [ ] Bedrooms validation depends on `property_type` (not required for office, plot)
- [ ] Contact override (agent_phone, agent_whatsapp) validated with phone format
- [ ] Stakeholder data is `visibility = internal_only` by default; not exposed publicly
- [ ] Off-plan block visible only when `market_type = off_plan`
- [ ] `publish_status` and `availability_status` are separate and independent
- [ ] Sold/rented `availability_status` does not automatically change `publish_status`
- [ ] Price-on-application: price field nullable; "Price on Application" shown in UI
- [ ] `rental_period` required for rent listings where price is visible
- [ ] Property slug is immutable after publish (A-06)
- [ ] AED-only price display; no FX conversion (A-11)

---

## Property Media

- [ ] Images and floorplan images supported; video upload not present
- [ ] MIME type validation: `image/jpeg`, `image/png`, `image/webp` only
- [ ] File size validated: max 10MB per image
- [ ] Unsupported file type → rejected with error
- [ ] Oversized file → rejected with error
- [ ] UUID-based storage paths (no user-controlled traversal)
- [ ] At least one cover image required before publish
- [ ] `is_cover = true` maintained when cover image changes
- [ ] Alt text required before publish; alt text validated
- [ ] Public cannot upload media

---

## Lead Capture

- [ ] Public visitor can submit a valid lead form
- [ ] `name` and `phone` are required
- [ ] Invalid phone format → validation error; lead not created
- [ ] `email` is optional; invalid format → validation error
- [ ] Lead is stored in `leads` table after validation passes
- [ ] Email notification sent via Resend to configured admin email
- [ ] Lead creation does not fail if email notification fails (fire-and-forget)
- [ ] Rate limit: 5 submissions per hour per salted-hash key; `429` returned when exceeded
- [ ] Public cannot read, list, or export any leads
- [ ] `source` enum is set correctly based on origin page
- [ ] `status` defaults to `new` on creation; uses `lead_status` enum only

---

## WhatsApp Click Tracking

- [ ] WhatsApp CTA opens correct WhatsApp URL with correct number
- [ ] Contact routing priority enforced: `property.agent_whatsapp` → `property.agent_phone` → `settings.whatsapp` → `settings.phone`
- [ ] Click event stored in `whatsapp_clicks` table
- [ ] No IP address stored in `whatsapp_clicks`
- [ ] No phone, email, or personal data stored in `whatsapp_clicks`
- [ ] Payload with PII fields (email, phone, IP) → rejected by API
- [ ] Public cannot read `whatsapp_clicks` data
- [ ] Dashboard shows WhatsApp click metrics

---

## Legal Pages

- [ ] Admin can create draft legal pages (slug: `privacy` or `terms` only)
- [ ] Admin can publish legal version; previous published version is archived
- [ ] `version` integer increments on each publish
- [ ] Public route serves only the active `status = published` version
- [ ] Lead forms link to active Privacy Policy
- [ ] Raw unsafe HTML is rejected by API (not stored, not rendered)
- [ ] Safe rendering: Markdown or controlled rich text only
- [ ] Draft pages return 404 publicly
- [ ] Archived versions not served as active

---

## Settings

- [ ] Admin can edit allowed operational content fields
- [ ] Allowed keys enforced via server-side allowlist; unknown keys rejected
- [ ] Per-key Zod validation applied; invalid value rejected
- [ ] Settings update reflected in public footer/contact where applicable
- [ ] Core layout, motion system, design architecture cannot be changed via settings
- [ ] Settings update is audit-logged (`settings_updated`)

---

## Admin Access

- [ ] `/admin/login` page loads; no public admin registration option
- [ ] Login requires valid Supabase Auth credentials
- [ ] Access to any admin route requires: valid session + `user_profiles` row with `role IN ('super_admin', 'client_admin')`
- [ ] Unauthenticated user → redirected to `/admin/login`
- [ ] Authenticated user with no `user_profiles` row → 403 forbidden
- [ ] `client_admin` cannot manage `user_profiles` or perform hard deletes

---

## Dashboard

- [ ] Total properties count (all statuses)
- [ ] Published/draft/archived breakdown
- [ ] Total leads count
- [ ] New leads count
- [ ] Leads by source
- [ ] Total WhatsApp clicks
- [ ] WhatsApp clicks by source
- [ ] Most inquired property
- [ ] Most clicked property
- [ ] Recent leads list
- [ ] Recent properties list

---

## Areas Admin

- [ ] Admin can add area with name (JSONB), description (JSONB), and unique slug
- [ ] Admin can edit area name, description, image_url, sort_order
- [ ] Admin can deactivate area (`is_active = false`)
- [ ] Inactive area not returned by public API
- [ ] Deactivated area still returns from admin API

---

## Sales Demo Mode

- [ ] Sales Demo Mode is off by default
- [ ] Activates only when `client.config.ts features.salesDemoMode = true` AND `?demo=sales` in URL
- [ ] No private or admin data exposed when active
- [ ] Page meta includes noindex when demo mode is active
- [ ] Demo labels do not affect normal visitor UX (not shown without both conditions)

---

## SEO and Indexing

- [ ] AUTEX demo: `<meta name="robots" content="noindex">` present by default
- [ ] Real-client indexing enabled only when explicitly configured
- [ ] Page titles, meta descriptions, canonical URLs present on all public pages
- [ ] Open Graph tags present on property detail pages
- [ ] `/` redirects to `/en` (301)

---

## Performance

- [ ] Desktop PageSpeed Insights > 90
- [ ] Mobile PageSpeed Insights > 75 (cinematic demo); production target > 80
- [ ] CLS < 0.1
- [ ] Reduced motion: `prefers-reduced-motion` respected for all animations
- [ ] Heavy GSAP animations only on homepage/storytelling; none in admin or forms
- [ ] Mobile: sticky bottom CTA accessible; filter drawer functional; image loading performance-safe

---

## Accessibility

- [ ] Semantic HTML on all pages
- [ ] Keyboard navigation functional
- [ ] Visible focus states present
- [ ] All form controls have associated labels
- [ ] Accessible error messages (announced to screen readers)
- [ ] Image alt text present and meaningful
- [ ] Color contrast meets WCAG AA
- [ ] Modal/dialog focus handling correct

---

## Security

- [ ] Service-role key not present in client JavaScript bundle
- [ ] All admin routes require session + role check
- [ ] All sensitive tables have RLS policies
- [ ] Public lead read: blocked (RLS)
- [ ] Public WhatsApp analytics read: blocked (RLS)
- [ ] Internal stakeholders: hidden from public API responses
- [ ] Draft/archived properties: 404 publicly
- [ ] Unsafe legal HTML: rejected
- [ ] IP not stored in `whatsapp_clicks` or `rate_limits`
- [ ] Audit log created for all specified sensitive actions
- [ ] Lead export audit-logged
