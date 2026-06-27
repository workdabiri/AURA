# Next Steps

**Updated:** 2026-06-27
**Current Phase:** **Phase 1 — COMPLETE** (AURA-101–AURA-107 all merged); **Phase 2 (Public Website) is COMPLETE — AURA-201 + AURA-202 + AURA-203 + AURA-204 + AURA-205 + AURA-206 + AURA-207 merged; 7 of 7 done.** AURA-101 merged at `95f9df3`. AURA-102 merged at `3657e4f`. AURA-103 merged at `1a35958`. **AURA-104 merged at `44a7fd4`.** **AURA-105 merged at `fae3d62`.** **AURA-106 merged at `dd21edd`.** **AURA-107 (Phase 1 exit gate) merged at `04d3522`** (PR #23; Opus 4.8 phase-exit review **APPROVE**, no blocking issues; feature branch deleted). **AURA-201 (public `/[locale]` layout + header/footer/navigation + minimal next-intl v4 i18n shell + server-only public settings selector) merged at `f17b429`** (PR #25; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch deleted local + remote). **AURA-202 (public properties listing + `GET /api/properties` + `GET /api/properties/featured`) merged at `1d4c514`** (PR #27; merged 2026-06-22; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch deleted). **AURA-203 (public property detail + `GET /api/properties/[slug]` + stakeholder visibility + contact routing + off-plan) merged at `b2f6129`** (PR #29; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch `feature/aura-203-property-detail` deleted). **AURA-204 (public areas overview — active-only areas DAL + `GET /api/areas` + `/[locale]/areas` overview page + public-safe area DTO + D-44 states) merged at `1fe2798`** (PR #31; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch `feature/aura-204-areas-overview` deleted local + remote). **AURA-205 (public legal page read — published-only legal DAL + `GET /api/legal/[slug]` + `/en/privacy` + `/en/terms` + safe Markdown render under D-12) merged at `3d6a7e0`** (PR #33; targeted Opus 4.8 review **APPROVE**, no blocking issues; D-12 merge blocker satisfied; feature branch `feature/aura-205-legal-page-read` deleted local + remote). **AURA-206 (SEO basics + AUTEX `noindex` (D-42) + enable Lighthouse advisory CI) merged at `a106fe8`** (PR #35; `feat: add SEO noindex and Lighthouse advisory`; **Opus review not required per the AURA-206 task block**; required checks green before merge; feature branch `feature/aura-206-seo-noindex-lighthouse` deleted local + remote). **AURA-207 (About page (`/en/about`) + Phase 2 public-page completion) merged at `65cc384`** (PR #37; `feat: add public about page`; **Opus review not required per the AURA-207 task block**; required checks green before merge; feature branch `feature/aura-207-about-page` deleted local + remote). **Phase 3 (Admin Vertical Slice) is now IN PROGRESS — AURA-301 (Admin login + session + role guard wiring) MERGED at `97c9548`** (PR #39; `feat: add admin login and guard wiring`; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks green before merge; feature branch `feature/aura-301-admin-login` deleted local + remote). **AURA-302 (Admin dashboard shell) MERGED at `df4523c`** (PR #41; `feat: add admin dashboard shell`; **Opus review not required per the AURA-302 task block**; required checks green before merge; feature branch `feature/aura-302-admin-dashboard-shell` deleted local + remote). `develop` is the source of truth at `df4523c`. **Phase 2 (Public Website) is COMPLETE (7 of 7); Phase 3 is IN PROGRESS (2 of 7).** The next task is **AURA-303 (Property CRUD admin + publish checklist)** — the third Phase 3 task; not started (read-only discovery only).

---

## Immediate Next Action

**AURA-201 (Public layout + header/footer + i18n shell + server-only public settings selector — the first Phase 2 task) is MERGED at `f17b429`** (PR #25 squash-merged into `develop`; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `quality` / `e2e` / `db-tests` / `analyze (javascript-typescript)` / `CodeQL` green before merge; feature branch `feature/aura-201-public-layout-i18n-shell` deleted local + remote). Delivered: public `/[locale]` layout (header / navigation / footer), minimal next-intl v4 i18n shell (English-only visible UI, RTL-ready direction helper), server-only public settings safe selector (allowlist + per-key Zod + fail-closed defaults), settings-driven footer, Q-13 AUTEX disclosure, and unit/live-DAL/e2e tests. **No migration, no package/`.env`/`config.toml` change, no admin/property/area/legal/lead/WhatsApp code, no AURA-202+ work.** **Phase 2 has started (1 of 7 tasks done).**

**AURA-202 (public properties listing + `GET /api/properties` + `GET /api/properties/featured` — the second Phase 2 task) is MERGED at `1d4c514`** (PR #27 squash-merged; merged 2026-06-22T12:54:55Z; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `quality` / `e2e` / `db-tests` / `analyze (javascript-typescript)` / `CodeQL` green before merge; feature branch deleted). Delivered: a published-only properties DAL (anon server client + RLS public-read boundary + DAL published-only re-assertion + explicit public-safe column allowlist), `GET /api/properties` + `GET /api/properties/featured` (Zod-validated; pagination cap 50 that clamps; generic errors), the `/[locale]/properties` listing page with all D-44 states (reusing the AURA-201 shell), `PropertyCard`, the homepage featured section (fails closed to empty), pure domain query/DTO/format modules, and unit/DAL/security/integration/e2e tests. **No migration, no package/`.env`/`config.toml`/CI change, no admin/detail/stakeholder/contact/lead-WhatsApp/media/areas/legal/SEO/cinematic code, no AURA-203+ work.** **Phase 2 is in progress (2 of 7 done).**

**AURA-203 (public property detail + `GET /api/properties/[slug]` + stakeholder visibility + contact routing + off-plan — the third Phase 2 task) is MERGED at `b2f6129`** (PR #29 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-203-property-detail` deleted local + remote). Delivered: `GET /api/properties/[slug]` (Zod slug; published-only; `400`/`404`/generic `500`; no service role in handler), the `/[locale]/properties/[slug]` server-rendered page with all D-44 states, a public-safe detail DTO + media gallery (no `storage_path`), price-on-application + conditional off-plan block (D-36), a safe `{ name, type }` public stakeholder projection (internal_only + PII excluded; narrow server-only fail-closed service-role selector), contact routing (property override → agency fallback → never stakeholder), and unit/DAL/security/integration/e2e tests. **The AURA-202 listing DAL (`src/dal/properties.dal.ts`) is untouched — a separate `src/dal/property-detail.dal.ts` was added.** **No migration, no package/`.env`/`config.toml`/CI change, no admin/lead/WhatsApp/media-upload/SEO/similar-properties/cinematic code, no AURA-204+ work.** **Phase 2 is in progress (3 of 7 done).**

**AURA-204 (public areas overview + `GET /api/areas` — the fourth Phase 2 task) is MERGED at `1fe2798`** (PR #31 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-204-areas-overview` deleted local + remote). Delivered: an active-only areas DAL (anon server client + RLS public-read boundary + DAL active re-assertion + explicit public-safe column allowlist; no service role; inactive areas hidden), `GET /api/areas` (Zod-validated, no query params, envelope `{ data }`, generic errors, `force-dynamic`), the `/[locale]/areas` overview page with all D-44 states (reusing the AURA-201 shell), a presentational `AreaCard`, and the public-safe area DTO `{ slug, name, description, imageUrl }` (no property counts, no property aggregation). **No migration, no package/`.env`/`config.toml`/CI change, no admin/area-detail/legal/SEO/about code, no AURA-205+ work.** **Phase 2 is in progress (4 of 7 done).**

**AURA-205 (public legal page read + safe Markdown render (D-12) — the fifth Phase 2 task) is MERGED at `3d6a7e0`** (PR #33 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; **D-12 merge blocker satisfied**; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-205-legal-page-read` deleted local + remote). Delivered: a published-only legal DAL (anon server client + RLS public-read boundary + DAL published re-assertion + explicit public-safe column allowlist; no service role; draft/archived hidden), `GET /api/legal/[slug]` (Zod-validated slug; published-only; `400`/`404`/generic `500`; `force-dynamic`), the `/en/privacy` and `/en/terms` server-rendered pages with all D-44 states (reusing the AURA-201 shell), **safe Markdown rendering via `react-markdown` + `rehype-sanitize`** (no `dangerouslySetInnerHTML`, no `rehype-raw`, no unsafe raw HTML path), the public DTO `{ slug, title, content, effectiveDate }` (raw Markdown in DTO; rendered safely), navigation changed from the dead `/legal` link to `Privacy` and `Terms`, and unit/DAL/security/integration/e2e tests. Two **approved** dependencies were added (`react-markdown`, `rehype-sanitize`). **No migration, no `.env`/`config.toml`/CI change, no admin legal editing, no SEO/noindex/Lighthouse, no About page, no AURA-206+ work.** **Phase 2 is in progress (5 of 7 done).**

**AURA-206 (SEO basics + AUTEX `noindex` (D-42) + enable Lighthouse advisory CI — the sixth Phase 2 task) is MERGED at `a106fe8`** (PR #35 squash-merged; **Opus review not required per the AURA-206 task block**; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-206-seo-noindex-lighthouse` deleted local + remote). Delivered: a source-controlled feature config (`src/config/feature-flags.ts`; `publicIndexingEnabled = false` default-`noindex` under D-42; demo-safe `publicSiteUrl = "https://autex.example"`), pure SEO helpers (`src/lib/seo/{metadata,routes}.ts`; robots fails closed to `noindex, nofollow`; no canonical/OG/Twitter), public route metadata on `/en`, `/en/properties`, `/en/properties/[slug]` (generic, **no DAL read**), `/en/areas`, `/en/privacy`, `/en/terms`, a `robots.txt` route (`src/app/robots.ts`; allows crawl, **no `Disallow: /`**, references the sitemap), a `sitemap.xml` route (`src/app/sitemap.ts`; only the 5 existing static public routes; **excludes `/en/about` and dynamic property-detail URLs**; no DAL reads), and the now-enabled **non-blocking Lighthouse advisory CI** (`.github/workflows/lighthouse.yml`; PRs to `develop`; `continue-on-error: true`; `treosh/lighthouse-ci-action`; no npm dependency; no score thresholds; not a required check). Tests: unit (`seo-metadata`, `lighthouse-workflow`), integration (`seo-routes`), and a noindex assertion in the CI-run `smoke.spec.ts`. **No migration, no package/`.env`/`config.toml` change, no DAL/data-boundary change, no admin code, no About page, no real-client indexing, no production deploy config, no branch-protection change, no AURA-207+ work.** **Phase 2 is in progress (6 of 7 done).**

**AURA-207 (About page (`/en/about`) + Phase 2 public-page completion — the seventh and final Phase 2 task) is MERGED at `65cc384`** (PR #37 squash-merged; **Opus review not required per the AURA-207 task block**; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-207-about-page` deleted local + remote). Delivered: the public About page at `/en/about` (`src/app/[locale]/about/page.tsx`, a Server Component reusing the AURA-201 layout shell), static demo-safe `About` i18n content (AUTEX framed as a premium Dubai advisory concept/demo brand — no real brokerage/RERA/license/awards claims), the AURA-206 SEO helper reused via `publicRouteMetadata('about')` so `/en/about` is AUTEX **`noindex` by default** (D-42), the visible AUTEX disclosure reusing the existing `Footer.disclosure` string (Q-13), `/en/about` added to the sitemap (dynamic property-detail URLs still excluded), and updated smoke/unit/integration tests. **No DAL/Supabase/settings read from the page, no new DB/DAL, no migration, no package/`.env`/`config.toml`/CI change, no admin code, no contact/lead form, no WhatsApp tracking, no media upload, no cinematic/GSAP, no real-client indexing, no canonical/OG/Twitter, no branch-protection change.** **Phase 2 is COMPLETE (7 of 7 done).**

**Branch protection (unchanged by AURA-301 / AURA-302):** `db-tests` remains required on `develop` — `develop` required checks are: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, `db-tests`. Neither AURA-301 nor AURA-302 changed branch protection; the Lighthouse advisory job is intentionally non-blocking and is **not** a required check.

**AURA-301 (Admin login + session + role guard wiring — the first Phase 3 task) is MERGED at `97c9548`** (PR #39 squash-merged into `develop`; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-301-admin-login` deleted local + remote). Delivered: `/admin/login` (login only — **no signup, no password reset**), a server-side login action (Zod-validated input), the AURA-106 login rate-limit (5 / 15 min / key; salted-hash key; raw IP in-memory only, never stored/logged), reuse of the AURA-104 guard with post-auth role validation (**auth alone is insufficient** — verified `auth.getUser()` user + `user_profiles` row + role in `super_admin` / `client_admin`; unauthorized signed-in sessions are signed back out), a minimal guarded `/admin` placeholder behind a protected admin layout, `/admin` excluded from next-intl locale routing (`/admin/login` stays non-localized), admin hard `noindex`, and unit/integration/e2e/smoke/security tests (incl. a live-DB gated own-row RLS read). **No dashboard shell/content beyond the placeholder, no CRUD, no migration, no Supabase config, no package, no CI workflow, no branch-protection change, no service-role in client/UI, no raw IP persistence.** **Phase 3 has started (1 of 7 tasks done).**

**AURA-302 (Admin dashboard shell — the second Phase 3 task) is MERGED at `df4523c`** (PR #41 squash-merged into `develop`; **Opus review not required per the AURA-302 task block**; required checks `CodeQL` / `analyze (javascript-typescript)` / `quality` / `e2e` / `db-tests` green before merge; feature branch `feature/aura-302-admin-dashboard-shell` deleted local + remote). Delivered: a guarded `/admin/dashboard` shell under the existing AURA-301 `(protected)` group (lives at `src/app/admin/(protected)/dashboard/**`; **no unguarded `src/app/admin/dashboard/**`**), `/admin` now redirects to `/admin/dashboard`, a separate **non-localized** sidebar + top-bar admin shell (`src/components/admin/**`, static copy, luxury-dark tokens — not the public Header/Footer/Navigation, no next-intl), nav links to the future admin sections (`/admin/properties`, `/admin/leads`, `/admin/areas`, `/admin/settings`, `/admin/legal`), **placeholder panels only**, and unit/security/e2e/smoke tests. **No metrics/aggregation, no real cards, no data reads, no DAL, no Supabase reads, no admin API routes, no CRUD, no service-role/DAL/Supabase/services in the admin UI, no migration, no Supabase config, no package, no CI workflow, no branch-protection change, no placeholder route files for the future sections (their nav links 404 until built).** **Phase 3 is in progress (2 of 7 tasks done).**

**Immediate next action — AURA-303 read-only discovery only.** With AURA-302 merged, the next task is **AURA-303 (Property CRUD admin + publish checklist)** — the third Phase 3 task: admin property create/edit/duplicate/archive with publish-checklist validation and audit logging. It is **not started**. **Do not start AURA-303 implementation directly. Do not create the AURA-303 branch until discovery is complete and the owner approves.** Read-only discovery only; a new session + explicit per-task discovery/planning approval is required before any work begins. (Per the AURA-303 task block, Opus review **is required** — publish/visibility + audit boundary.)

**AURA-301 carry-forwards (still relevant after AURA-302; preserved for future tasks, not actioned at merge):**
1. **Harden login rate-limit IP source** — the login IP is derived from the leftmost `x-forwarded-for` hop (client-spoofable on a proxied platform); prefer a trusted source (`x-real-ip` / rightmost trusted hop). Best folded into AURA-106 (its rule example uses the same pattern).
2. **Decide `/admin` Supabase session-refresh strategy before the real dashboard** — `/admin` is excluded from middleware and there is no session-refresh middleware; the guard's `auth.getUser()` is fail-closed (secure), but refreshed tokens are not re-persisted, which can shorten effective sessions.
3. **Add a seeded-admin happy-path e2e in CI** — the successful-login e2e is gated on `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI; seed an admin so the full cookie→redirect→guard-pass path runs.
4. **Future `/api/admin/*` route handlers must call `requireAdmin()` / `requireSuperAdmin()` individually** — the layout guard protects pages, not Route Handlers.
5. **Dashboard shell/content delivered in AURA-302 (merged `df4523c`).** A seeded-admin happy-path e2e in CI is still outstanding — the authenticated dashboard render is gated behind `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI.
6. **CRUD / media / areas / settings / legal admin remain AURA-303–307.**

**AURA-207 carry-forwards (preserved for future tasks, not actioned at merge):**
1. **Phase 2 public surface is complete** — layout/footer, properties, property detail, areas, legal, SEO/noindex/robots/sitemap/Lighthouse advisory, and the About page are all merged.
2. **`/en/about` exists and is in the sitemap** — dynamic property-detail URLs remain excluded.
3. **About content is static/demo-safe and not admin-editable** — a future task could make it data/settings-driven if required (out of MVP scope).
4. **No DAL/Supabase/settings read from the About page** — content-only; only the D-44 success state is relevant (no loading/error/not-found files).
5. **Real-client indexing remains deferred and requires approval/config** — `/en/about` is `noindex` by default; flipping `publicIndexingEnabled` to `true` is a future source-config change + owner approval.
6. **Canonical / OpenGraph / Twitter remain deferred** — not added for the About page.
7. **Lighthouse remains advisory; hard score gate deferred to AURA-505 / release** — the advisory job is non-blocking and not a required check.
8. **Dynamic property-detail sitemap URLs remain deferred** — the sitemap stays static (no DAL read).

**AURA-206 carry-forwards (preserved for future tasks, not actioned at merge):**
1. **Canonical URLs deferred** — not implemented in AURA-206; add when an SEO canonical strategy is approved.
2. **OpenGraph / Twitter cards deferred** — not implemented in AURA-206.
3. **Real-client indexing deferred and requires approval/config** — `featureFlags.publicIndexingEnabled` stays `false` (AUTEX `noindex` by default, D-42); flipping it to `true` is a deliberate future source-config change + explicit owner approval.
4. **Lighthouse remains advisory; hard score gate deferred to AURA-505 / release** — the advisory job is non-blocking and not a required check; the Desktop > 90 / Mobile > 75 cinematic (80 prod) / CLS < 0.1 hard gate lands at the production release gate.
5. **`/en/about` remains not implemented and belongs to AURA-207** — intentionally excluded from the sitemap until it exists; AURA-207 reuses the AURA-206 SEO metadata helper.
6. **Dynamic property-detail sitemap URLs deferred** — AURA-206 keeps the sitemap static (no DAL read); a future data-driven sitemap decision may add per-property URLs.

**AURA-205 non-blocking carry-forwards (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **Legal page `force-dynamic` comment accuracy** — the legal page comments say they inherit `force-dynamic` from the `[locale]` layout; route-segment config does **not** inherit parent→child, so the comment is inaccurate-but-harmless (actual dynamic behavior is still safe — the DAL reads cookies and the layout has `force-dynamic`). Future cleanup: clarify the comment.
2. **Legal e2e is a liveness smoke** — it does not distinguish article-rendered vs not-found-rendered. Acceptable for AURA-205 (live DAL/security/integration cover data behavior); a future improvement may add a seeded happy-path e2e.
3. **SafeMarkdown payload tests** — add committed `SafeMarkdown` tests for `data:` and `vbscript:` payloads in a future hardening patch.
4. **Default sanitize schema permits remote Markdown images** — acceptable for trusted admin legal content; future hardening may drop images or pin a custom schema if untrusted content ever flows through the renderer.
5. **Empty title JSONB may render an empty `<h1>`** — a content-quality issue, not security; a future validation/admin workflow should prevent this.

**AURA-204 non-blocking carry-forwards (preserved for future tasks, not actioned at merge):**
1. **Inline DAL-error retry affordance** — the `/en/areas` inline caught-DAL-error path renders an inline error without retry; the route `error.tsx` boundary has retry, but the inline caught DAL error does not. Future improvement: either let the DAL error propagate to `error.tsx`, or add a refresh/retry affordance to the inline error.
2. **Area i18n extraction is English-only** — acceptable for the current `/en` MVP, but needs locale-aware extraction when Arabic / more locales are added.
3. **`AreaCard` uses a plain `<img>`** instead of `next/image` — acceptable for AURA-204; revisit in AURA-206 / Lighthouse / performance phase.
4. **AURA-204 docs-sync** now records completion; no status boxes in `docs/TASKS_Project.md` unless the established pattern changes.

**AURA-203 non-blocking carry-forwards (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **CI e2e coverage** — CI's `e2e` job runs `test:smoke` only; `property-detail.spec.ts` (and AURA-202's `properties.spec.ts`) are full-`test:e2e`/local, not run by CI `e2e`. Future follow-up: decide whether CI should run full `npm run test:e2e`.
2. **Detail e2e happy-path** — `property-detail.spec.ts` is data-independent and only verifies the not-found/error graceful states. Future follow-up: add a seeded happy-path detail e2e when the test-data strategy supports it.
3. **FEATURE_SPECS contact-routing drift** — `docs/FEATURE_SPECS.md` had the old 4-step contact priority; **synced in this PR** to the implemented/locked 6-step priority: (1) property.agent_whatsapp (2) property.agent_phone (3) property.agent_email (4) settings.whatsapp / agencyWhatsapp (5) settings.phone / agencyPhone (6) settings.email / agencyEmail. **Never stakeholder.**
4. **Optional stakeholder defense-in-depth** — make the service-role public-stakeholder selector's safety local to the query with an explicit published-parent check. The current control flow is approved and not blocking.
5. **CI ergonomics** — pre-existing: the wait-for-server loop could fail earlier/more clearly. Not an AURA-203 blocker.

**AURA-202 non-blocking carry-forwards (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **FTS index expression/performance mismatch** — DAL search is correct, but the existing GIN index (`to_tsvector('english', coalesce(title_en,''))`) is not used by the query (`to_tsvector('english', title_en)`), so search falls back to a sequential scan. Future migration/performance task; **not** an AURA-202 blocker (the index lives in a pre-existing migration).
2. **RTL badge class** — `PropertyCard` featured badge uses the physical `left-3`; future polish should use the logical `start-3` (the only physical directional class in `src/`; no runtime impact while MVP is English-only).
3. **Static sensitive-token scan completeness** — expand the future security static scan to include `agent_name`, `description`, `payment_plan_summary`. **Do not** add `off_plan` (it is a valid public `market_type` enum/filter value).
4. **E2E CI wiring** — `properties.spec.ts` passes locally but CI's `e2e` job runs the smoke spec only (`test:smoke`); consider wiring full `test:e2e` into CI in a future task.
5. **Unused i18n keys** — `PropertyCard.viewDetails` and `PropertyCard.currency` are currently unused (knip does not scan message keys); remove or use in a future cleanup.
6. **Detail route** — `PropertyCard` links to `/{locale}/properties/{slug}`, but AURA-203 owns that route's implementation. This is expected (dead-until-AURA-203).

**AURA-201 non-blocking carry-forwards (from the targeted Opus review; preserved for future tasks, not actioned at merge):**
1. **Settings selector observability** — `getPublicSettings()` fail-closed branches (`catch` / `if (error)`) swallow errors silently; a misconfigured service-role env or downed DB renders demo defaults with no signal. Add server-side logging/Sentry breadcrumb (defer to observability work, Phase 6).
2. **Stricter phone/WhatsApp validation later** — `agency_phone`/`agency_whatsapp` validate only as non-empty strings (safe at render: WhatsApp strips to digits, phone via `tel:`); tighten when `libphonenumber-js` is wired for lead/contact work (Phase 2–3).
3. **Skip-to-content cleanup** — `Header.skipToContent` message key exists in `en.json` but no skip link is rendered; wire a skip link (a11y) or drop the key.
4. **Future settings caching/revalidate** — `force-dynamic` does a service-role settings read per request with no caching; revisit with `revalidate`/tag-based caching if settings reads become hot.

**Carry-forward / open items still in force:**
- **Live DAL/security/integration tests now run in CI** (AURA-107 `db-tests` job) — the prior "local-only (`SUPABASE_LOCAL_TESTS=1`) until AURA-107" posture from AURA-103/104/105/106 is **resolved**. Local manual runs still use `SUPABASE_LOCAL_TESTS=1` + `supabase start`. The rate-limit service still has **no route consumer yet** — lead/whatsapp/login routes (Phases 3-4) are its first importers; remove `src/services/rate-limit/index.ts` from the Knip `entry` list then.
- **pg_cron is environment-dependent.** The cleanup schedule is registered defensively: where pg_cron is unavailable, the function + index still apply and `public.cleanup_rate_limits()` must be driven by an equivalent external scheduler (A-16 "pg_cron or equivalent"). On hosted Supabase, confirm pg_cron is enabled so the hourly job runs.
- **AURA-106 non-blocking Opus hardening notes (future task, not actioned at merge):** (1) add a defensive `p_limit > 0` / `p_window_seconds > 0` guard inside `consume_rate_limit` (defense-in-depth; only `service_role` calls it with validated config today); (2) tighten the `RATE_LIMIT_SALT` minimum length in `src/lib/validation/env.schema.ts` (currently `z.string().min(1)`, pre-existing from AURA-101); (3) reconfirm/regenerate `src/types/database.ts` from the live stack in a future DB-touching task (the AURA-106 function types were hand-added and verified accurate against the SQL).
- **Live storage catalog/behavioural tests now run in CI** (AURA-107 `db-tests` job; previously local-only). AURA-304 is the first real importer of the media/storage modules — remove their Knip `entry` lines then. **Public-read bucket limitation** (retained URL fetchable after unpublish/archive) is documented + deferred (signed URLs out of MVP).
- **Runner decision (seed-admin, non-blocking follow-up):** executing `scripts/seed-admin.ts` needs a TS runner resolving `@/*` + the `server-only` guard; none added (no `tsx`/`ts-node` in repo). Decide between approving `tsx` + a `seed:admin` script, or a `node --conditions=react-server` + path-alias loader. Pure logic + DB effect are already test-covered. Accepted by Opus as non-blocking at AURA-104 merge.
- **Production `enable_signup = false` (D-40):** hosted-Supabase deployment/config requirement. Local `config.toml` stays `true` (unchanged); the app-layer guard rejects any non-admin session.
- **Minimal-return for anon inserts (AURA-301+):** anon has INSERT but **no SELECT** on `leads` / `whatsapp_clicks`, so those anon inserts must use **minimal-return behavior** (returning the inserted row would fail the RLS read).
- **AURA-107 delivered:** live guard/seed/RLS/storage/rate-limit integration tests now run in CI via the `db-tests` job (Dockerized Supabase stack). The local-only carry-forward is resolved.

Branch protection active on `develop` (verified via API 2026-06-20):
- `quality` — required
- `e2e` — required
- `analyze (javascript-typescript)` — required
- `CodeQL` — required
- **`db-tests` — required** (added to the `develop` rule; AURA-107 Phase 1 exit gate)

GitHub required approvals are disabled for solo-operator mode; required checks remain enforced.

---

## Audit Status — Unchanged

`npm run audit` passes `--audit-level=high` (0 HIGH, 0 CRITICAL).

Remaining 2 moderate findings via `next@15` internal postcss. Documented exception — no action required.

---

## Task Status

### Phase 0 — Complete

| Task | Description | Status |
|---|---|---|
| ~~**AURA-001**~~ | Next.js scaffold | ✅ merged |
| ~~**AURA-002**~~ | ESLint + Prettier quality gates | ✅ merged |
| ~~**AURA-003**~~ | Vitest + Playwright test harness | ✅ merged |
| ~~**AURA-004**~~ | Architecture boundary enforcement | ✅ merged |
| ~~**AURA-005**~~ | Environment schema + config | ✅ merged |
| ~~**AURA-006**~~ | Design tokens + Tailwind pipeline | ✅ merged |
| ~~**AURA-007**~~ | GitHub Actions CI + CodeQL + branch protection | ✅ merged |
| ~~**AURA-008**~~ | First vertical slice — `/`→`/en` redirect + `/en` homepage shell + smoke test | ✅ merged (`be43dab`) |

### Phase 1 — Complete ✅

| Task | Description | Status |
|---|---|---|
| ~~**AURA-101**~~ | Supabase local stack + client/server/service-role helpers | ✅ merged (`95f9df3`) |
| ~~**AURA-102**~~ | Initial migration — core MVP tables | ✅ merged (`3657e4f`) |
| ~~**AURA-103**~~ | RLS policies for all sensitive tables | ✅ merged (`1a35958`) |
| ~~**AURA-104**~~ | Auth guard + super-admin bootstrap | ✅ merged (`44a7fd4`) |
| ~~**AURA-105**~~ | Storage bucket policies + media path strategy | ✅ merged (`fae3d62`) |
| ~~**AURA-106**~~ | Rate-limit service + salted-hash key + TTL cleanup (D-51) | ✅ merged (`dd21edd`) |
| ~~**AURA-107**~~ | DAL/security/integration live tests in CI (Dockerized stack) — Phase 1 exit gate | ✅ merged (`04d3522`) |

### Phase 2 — Public Website — Complete ✅ (7/7)

| Task | Description | Status |
|---|---|---|
| ~~**AURA-201**~~ | Public layout + header/footer + i18n shell + server-only public settings selector | ✅ merged (`f17b429`) |
| ~~**AURA-202**~~ | Properties listing + `GET /api/properties` + featured | ✅ merged (`1d4c514`) |
| ~~**AURA-203**~~ | Property detail + stakeholder visibility | ✅ merged (`b2f6129`) |
| ~~**AURA-204**~~ | Areas overview — DAL + `GET /api/areas` | ✅ merged (`1fe2798`) |
| ~~**AURA-205**~~ | Legal page read — `GET /api/legal/[slug]` + safe Markdown render (D-12) | ✅ merged (`3d6a7e0`) |
| ~~**AURA-206**~~ | SEO basics + AUTEX noindex (D-42) + enable Lighthouse advisory CI | ✅ merged (`a106fe8`) |
| ~~**AURA-207**~~ | About page (`/en/about`) + Phase 2 public-page completion | ✅ merged (`65cc384`) |

### Phase 3 — Admin Vertical Slice — In progress (2/7)

| Task | Description | Status |
|---|---|---|
| ~~**AURA-301**~~ | Admin login + session + role guard wiring | ✅ merged (`97c9548`) — Opus review **APPROVE**, no blockers |
| ~~**AURA-302**~~ | Admin dashboard shell | ✅ merged (`df4523c`) — Opus review not required |
| **AURA-303** | Property CRUD admin + publish checklist | Not started — **next**; read-only discovery only; requires a new session + per-task discovery/planning approval (Opus review **required**) |
| AURA-304 | Media upload — validation, UUID paths | Not started |
| AURA-305 | Areas admin (add/edit/deactivate) | Not started |
| AURA-306 | Settings admin (allowlist + per-key Zod + audit) | Not started |
| AURA-307 | Legal pages admin — draft→publish, versioning, audit (D-10/D-12) — **Phase 3 exit gate** | Not started |

---

## Knip Allowlist — Governance Debt to Pay Down

`knip.jsonc` `ignoreDependencies` is a temporary, no-wildcard allowlist. **Each task that wires a dependency must remove its entry** so the list shrinks to empty:

- ~~**AURA-005** → remove `zod`, `server-only`~~ ✅ done
- ~~**AURA-006** → remove `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`~~ ✅ done
- ~~**AURA-008** → remove `next-intl`~~ ✅ done
- **AURA-006 deferred** → `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` — keep until first component that uses them (Phase 2+)
- ~~**AURA-101** → remove `@supabase/ssr`, `@supabase/supabase-js`~~ ✅ done (merged `95f9df3`)
- **AURA-102+** → remove `src/lib/supabase/client.ts`, `server.ts`, `service-role.ts` Knip entries as DAL callers are added. (AURA-102 is migration-only and adds no DAL caller, so these entries remain. AURA-102 added `ignore: ["src/types/database.ts"]` and `ignoreBinaries: ["supabase"]` for the generated types file + global CLI.)
- **AURA-106 / Phase 3** → remove `resend`
- **Phase 2–3 (forms)** → remove `@hookform/resolvers`, `react-hook-form`, `libphonenumber-js`
- **Phase 2+ (data/state)** → remove `@tanstack/react-query`, `zustand`
- **Phase 5 (motion)** → remove `gsap`, `framer-motion`
- **Observability (Phase 6)** → remove `@sentry/nextjs`, `@vercel/analytics`
- `eslint-config-next`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` — used via FlatCompat but untraceable by Knip; keep until ESLint config is updated.

### Knip `entry` debt
- ~~`env.ts` entry~~ ✅ Removed in AURA-101 — real importer exists via `server.ts` and `service-role.ts`.
- ~~`server.ts` entry~~ ✅ Removed in AURA-104 — now statically imported by `src/services/auth/guard.ts`.
- ~~`service-role.ts` entry~~ ✅ Removed in AURA-201 — now **statically** imported by `src/dal/settings.dal.ts`, reached by the public `[locale]` layout via `getPublicSettings()`.
- `client.ts` entry remains — `client.ts` has no Client Component consumer yet; retain until the first Client Component imports the browser anon helper.
- `src/services/auth/guard.ts`, `src/services/auth/index.ts`, `scripts/seed-admin.ts` entries added in AURA-104 — remove the guard/index entries when the first admin Route Handler / admin layout (AURA-301) imports the guard.
- `src/domain/properties/media.ts`, `src/services/storage/policy.ts` entries added in AURA-105 — remove when the media upload route (AURA-304) becomes their first real importer.
- `src/services/rate-limit/index.ts` entry added in AURA-106 — the server-only rate-limit barrel has no route consumer yet; remove when the first lead/whatsapp/login Route Handler (Phases 3-4) imports it. (`key.ts` is already imported by the unit test; `limit.ts` is reachable via the barrel.)

---

## Notes for AURA-008 (merged ✅)

- Merge commit: `be43dab feat: add localized homepage shell and smoke test`
- PR #9 squash-merged to `develop`. Feature branch deleted.
- Original implementation commit: `6df46d0` (on deleted feature branch, for reference only)
- `/` → `/en` redirect via explicit 301 in `src/middleware.ts` (`NextResponse.redirect(..., 301)`).
- `/en` homepage shell uses all AURA luxury-dark design token classes.
- Playwright smoke unskipped; 2 tests: 301 status + location header check; `/en` loads without error.
- CI `e2e` job active; installs Chromium only; runs `--project=chromium`.
- `develop` branch protection updated: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL` all required.
- `next-intl` removed from Knip allowlist (now genuinely imported).

---

## Notes for AURA-101 (Supabase helpers — MERGED ✅)

- Merge commit: `95f9df3 feat: add Supabase helpers and local stack`
- PR #11 squash-merged to `develop`. Feature branch `feat/aura-101-supabase-stack` deleted.
- Opus 4.8 review: **APPROVE** — no blocking issues; non-blocking notes only (see CURRENT_STATE.md).
- Supabase CLI 2.106.0 (Homebrew) + Docker 29.5.3: local-stack verified — `supabase start/status/stop` PASS; `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (5/5).
- Key decisions:
  - `getServerEnv()` called in `createSupabaseServerClient()` — validates full server env before any Supabase call
  - `CookieOptions` imported from `@supabase/ssr` for explicit `setAll` parameter typing (TypeScript strict mode)
  - service-role.ts first line is `import 'server-only'` — enforced by security test + dep-cruiser

## Notes for AURA-102 (MERGED ✅)

- Merge commit: `3657e4f feat: add initial MVP database migration` (full SHA `3657e4fd1d2686bab6d6dcf95261a2f184ac9787`)
- PR #13 squash-merged to `develop`. Feature branch `feat/aura-102-initial-migration` deleted.
- Opus 4.8 review: **APPROVE** — merge recommendation **YES**, no blocking issues. Post-review `db:types` reproducibility / failure-safety fixes completed before merge.
- Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.
- Summary: 11 MVP tables; 17 native PostgreSQL enums; generated `src/types/database.ts`; failure-safe `db:types` script; RLS enabled on all 11 tables; **0 RLS policies**; no seed data; no auth; no API routes; no UI.
- No `clients` table, no `client_id` (D-05 merge blocker); no raw IP columns in event tables (D-18/D-51).
- Knip helper entries (`client.ts`, `server.ts`, `service-role.ts`) remain — AURA-102 is migration-only and added no DAL caller; remove per helper as DAL callers are added.

## Notes for AURA-103 (RLS policies — MERGED ✅)

- Merge commit: `1a35958 feat: add RLS policies for MVP tables` (full SHA `1a35958ccf658b6918474b5b1d51b6c5de37be75`)
- PR #15 squash-merged to `develop` (now the source of truth). Feature branch `feat/aura-103-rls-policies` deleted.
- Opus 4.8 review: **APPROVE** — merge recommendation **YES**, no blocking issues.
- Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.
- Summary: new RLS migration (AURA-102 init untouched); **3 role-check helper functions** (`current_user_role`/`is_admin`/`is_super_admin`); **36 policies across 10 tables**; **0 policies on `rate_limits`** (service-role only); least-privilege GRANT layer (REVOKE ALL then per-role DML); **no anon policy on `property_stakeholders`** (deferred to AURA-203); **no DELETE policy on `properties`** (hard delete is service-role-only); RLS stays **enabled on all 11 tables**; generated types updated with the 3 helper functions under `Functions`; DAL + security RLS tests added.
- **Carry-forward:** live RLS tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI.
- **Carry-forward for AURA-104:** anon has INSERT but no SELECT on `leads` / `whatsapp_clicks` — the route layer must use **minimal-return behavior** for those anon inserts.

---

## Do Not Do Yet

- ~~Do not start AURA-009 before AURA-008 merges~~ ✅ AURA-008 merged
- ~~Do not start AURA-104 in this session~~ ✅ AURA-104 merged (`44a7fd4`)
- ~~Do not start AURA-105~~ ✅ AURA-105 merged at `fae3d62`
- ~~Do not start AURA-106~~ ✅ AURA-106 merged at `dd21edd`
- ~~Do not start AURA-107~~ ✅ AURA-107 merged at `04d3522` (Phase 1 complete)
- ~~Do not start AURA-201~~ ✅ AURA-201 merged at `f17b429` (Phase 2 started)
- ~~Do not start AURA-202~~ ✅ AURA-202 merged at `1d4c514` (Phase 2 → 2/7)
- ~~Do not start AURA-203~~ ✅ AURA-203 merged at `b2f6129` (Phase 2 → 3/7)
- ~~Do not start AURA-204~~ ✅ AURA-204 merged at `1fe2798` (Phase 2 → 4/7)
- ~~Do not start AURA-205~~ ✅ AURA-205 merged at `3d6a7e0` (Phase 2 → 5/7)
- ~~Do not start AURA-206~~ ✅ AURA-206 merged at `a106fe8` (Phase 2 → 6/7)
- ~~Do not start AURA-207~~ ✅ AURA-207 merged at `65cc384` (Phase 2 → 7/7, **Phase 2 complete**)
- ~~Do not start AURA-301~~ ✅ AURA-301 merged at `97c9548` (Phase 3 → 1/7, **Phase 3 started**)
- ~~Do not start AURA-302~~ ✅ AURA-302 merged at `df4523c` (Phase 3 → 2/7)
- Do not fix audit without explicit dep-change approval
- Do not start AURA-303 implementation directly — AURA-303 (Property CRUD admin + publish checklist; the third Phase 3 task) is **read-only discovery only**; it requires a new session + explicit per-task discovery/planning approval before implementation (Opus review **is required** per the AURA-303 task block — publish/visibility + audit boundary)
- Do not create the AURA-303 branch until discovery is complete and the owner approves
- Do not start any further Phase 3 / admin implementation in this docs-sync session
- Do not enable real-client indexing — `featureFlags.publicIndexingEnabled` stays `false` (AUTEX `noindex` by default, D-42); flipping it needs a future config change + explicit owner approval
- Do not make the Lighthouse advisory job blocking or add it to `develop` branch protection — it is intentionally non-blocking (hard gate deferred to AURA-505 / release)
- Do not modify `develop` branch protection from a code/docs session — branch-protection changes are manual owner actions in GitHub Settings (unchanged by AURA-206; the `db-tests` required check remains in place; the Lighthouse advisory job is not a required check)
- Do not create `.env` / `.env.local` files
- Do not create Stage 2 skills
- Do not auto-merge to `main`
- Do not implement Phase 3 / admin pages or routes without per-task approval (AURA-301+)
- Do not load fonts via next/font without explicit task approval
