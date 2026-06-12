# AURA — Design System

**Source:** Pack §15  
**Authority:** `AURA_OPTIMIZED_PROJECT_PACK_v1_4_PATCHED.md`

---

## Theme

Flagship demo theme: **`luxury-dark`**

Future possible themes (post-MVP): `premium-light`, `sand-neutral`.

Admin cannot mutate theme or design architecture via settings (D-21).

---

## Required Token Groups

```
brand.primary
brand.secondary
brand.accent
surface.page
surface.card
surface.overlay
text.primary
text.secondary
text.inverse
border.default
radius.sm / radius.md / radius.lg / radius.xl
shadow.card / shadow.modal / shadow.hero
motion.duration.fast / motion.duration.normal / motion.duration.slow
motion.easing.premium
layout.container
layout.sectionSpacing
```

---

## Typography Scale

Must define at minimum:

| Token | Use |
|---|---|
| `display` | Large hero text |
| `h1` | Page titles |
| `h2` | Section headings |
| `h3` | Card headings |
| `body` | Body text |
| `small` | Secondary/support text |
| `caption` | Labels, metadata |

---

## Spacing / Layout Scale

Must define:

- Page container width
- Section vertical spacing
- Card gap
- Form field gap
- Mobile padding
- Desktop grid columns

---

## Component Layers

### UI Primitives (`components/ui/`)
- Button
- Input
- Select
- Card
- Badge
- Modal
- Drawer
- Tabs
- Tooltip

### Real Estate Components (`components/real-estate/`)
- PropertyCard
- PropertyGrid
- PropertyFilter
- PropertyGallery
- InquiryForm
- WhatsAppCTA
- AreaCard
- OffPlanBlock
- SimilarProperties
- PublishValidationChecklist

### Experience / Marketing Components (`components/marketing/`)
- CinematicHero
- AreaExplorer
- InvestmentPath
- SalesDemoLabels
- TrustSection
- FeaturedProperties
- LeadCTASection

---

## Core Component Variants

### Button
- `primary` — primary CTA
- `secondary` — secondary action
- `ghost` — minimal/link-style
- `danger` — destructive action
- `whatsapp` — WhatsApp-branded CTA

### Input
- `default` — normal state
- `focused` — active focus
- `error` — validation failure
- `disabled` — non-interactive

### Card
- `property` — property listing card
- `area` — area card
- `metric` — dashboard metric card
- `admin-row` — admin table row variant

### Badge
- `publish_status` — draft / published / archived
- `availability` — available / reserved / sold / rented / unavailable
- `lead_status` — new / contacted / qualified / etc.
- `role` — super_admin / client_admin

### Modal
- `confirm` — general confirmation
- `destructive-confirm` — archive/delete confirmation
- `form-dialog` — form inside a modal

### Toast
- `success` — operation succeeded
- `error` — operation failed
- `warning` — caution
- `undo` — archive undo option

---

## Motion Rules (D-26)

- GSAP: homepage and storytelling sequences only
- Framer Motion: lightweight UI transitions (hover, entrance, tab change)
- No heavy motion in: property listing, admin panel, forms, tables
- Reduced motion: `prefers-reduced-motion` respected for all animations
- Mobile motion: lighter than desktop; heavy GSAP sequences reduced on mobile

---

## Image / Gallery Rules

- Property card image: consistent aspect ratio across all cards
- Property detail gallery: cover image (primary) + ordered gallery; floorplan tab
- Missing image: fallback placeholder required
- Alt text: required before publish (enforced in publish validation)
- Floorplan image: allowed as `media_type = floorplan`
- Native video: out of MVP (D-41)

---

## Accessibility Rules

MVP must support:
- Semantic HTML on all pages
- Keyboard navigation (all interactive elements reachable)
- Visible focus states
- Labels for all form controls
- Accessible error messages (announced to screen readers)
- Reduced motion (`prefers-reduced-motion`)
- Image alt text
- Sufficient color contrast (WCAG AA)
- Modal/dialog focus trapping and return-focus behavior

---

## Admin UI Rules (D-21)

Admin should be **boring, fast, and reliable**:
- No cinematic animation in admin panel
- Consistent table pattern for all entity lists
- Every destructive action requires a confirmation dialog
- Archive actions: confirmation + undo/toast where practical
- Draft save and publish are separate, explicit actions
- Publish button shows validation checklist inline
- Settings changes: immediate, validated, and audit-logged
- Legal content: draft → publish workflow only

---

## LTR/RTL Readiness

- Do not hardcode `left`/`right` in CSS where RTL will be needed
- Use logical CSS properties (`start`/`end`) where practical
- RTL is not activated in MVP but the architecture must support it (D-07)
- Design tokens and layout primitives must not assume text direction

---

## Admin Table Pattern

All admin tables must use a consistent pattern:
- Search (where relevant)
- Filters
- Sort
- Pagination
- Status badges (using defined badge variants)
- Row actions (edit, duplicate, archive)
- Confirm archive dialog
- Empty state
- Error state
- Loading skeleton
- No bulk actions in MVP
