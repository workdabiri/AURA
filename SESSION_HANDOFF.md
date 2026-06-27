# Session Handoff

**Last Updated:** 2026-06-27
**Branch:** `develop` — source of truth at `df4523c`. **Phase 1 is COMPLETE; Phase 2 (Public Website) is COMPLETE (7 of 7); Phase 3 (Admin Vertical Slice) is IN PROGRESS (2 of 7) — AURA-301 + AURA-302 merged.** **AURA-302 (Admin dashboard shell) MERGED at `df4523c`** (PR #41 squash-merged; `feat: add admin dashboard shell`; **Opus review not required per the AURA-302 task block**; required checks green before merge; feature branch `feature/aura-302-admin-dashboard-shell` deleted local + remote). **AURA-207 (About page (`/en/about`) + Phase 2 public-page completion) MERGED at `65cc384`** (PR #37 squash-merged; `feat: add public about page`; **Opus review not required per the AURA-207 task block**; required checks green before merge; feature branch `feature/aura-207-about-page` deleted local + remote). **AURA-206 (SEO basics + AUTEX `noindex` (D-42) + enable Lighthouse advisory CI) MERGED at `a106fe8`** (PR #35 squash-merged; `feat: add SEO noindex and Lighthouse advisory`; **Opus review not required per the AURA-206 task block**; required checks green before merge; feature branch `feature/aura-206-seo-noindex-lighthouse` deleted local + remote). **AURA-205 (public legal page read — published-only legal DAL + `GET /api/legal/[slug]` + `/en/privacy` + `/en/terms` + safe Markdown render under D-12) MERGED at `3d6a7e0`** (PR #33 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; D-12 merge blocker satisfied; feature branch `feature/aura-205-legal-page-read` deleted local + remote). **AURA-201 (public `/[locale]` layout + header/footer/navigation + minimal next-intl v4 i18n shell + server-only public settings selector) MERGED at `f17b429`** (PR #25 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; feature branch `feature/aura-201-public-layout-i18n-shell` deleted local + remote). **AURA-107 (live DAL/security/integration tests in CI via Dockerized Supabase — Phase 1 exit gate) MERGED at `04d3522`** (PR #23 squash-merged; Opus 4.8 phase-exit review **APPROVE**, merge recommendation **YES**, no blocking issues; feature branch `feature/aura-107-dal-security-ci-harness` deleted). AURA-106 merged at `dd21edd`; AURA-105 at `fae3d62`; AURA-104 at `44a7fd4`; AURA-103 at `1a35958`; AURA-102 at `3657e4f`. **AURA-202 (public properties listing + `GET /api/properties` + featured) MERGED at `1d4c514`** (PR #27 squash-merged; merged 2026-06-22T12:54:55Z; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; feature branch deleted). **AURA-203 (public property detail + `GET /api/properties/[slug]` + stakeholder visibility + contact routing + off-plan) MERGED at `b2f6129`** (PR #29 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; feature branch `feature/aura-203-property-detail` deleted local + remote). **AURA-204 (public areas overview + `GET /api/areas` + `/[locale]/areas` overview page + public-safe area DTO + D-44 states) MERGED at `1fe2798`** (PR #31 squash-merged; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; feature branch `feature/aura-204-areas-overview` deleted local + remote). **AURA-301 (Admin login + session + role guard wiring) — the first Phase 3 (Admin Vertical Slice) task — MERGED at `97c9548`** (PR #39 squash-merged; `feat: add admin login and guard wiring`; targeted Opus 4.8 review **APPROVE**, merge recommendation **YES**, no blocking issues; feature branch `feature/aura-301-admin-login` deleted local + remote). **Next task: AURA-303 (Property CRUD admin + publish checklist) — the third Phase 3 task; not started; read-only discovery only, requires its own per-task discovery/planning approval.**

---

## AURA-302 — MERGED (`df4523c`) — **PHASE 3 (2/7)**

**AURA-302: Admin dashboard shell.** The second Phase 3 (Admin Vertical Slice) task: an authenticated dashboard **shell** behind the existing AURA-301 protected layout — navigation to the future admin sections plus placeholder panels, **with no metrics and no data**. It **consumes** the AURA-301 `(protected)` guard and **introduces no new auth/security/data boundary**. **No migration, no Supabase config, no package change, no CI workflow change, no branch-protection change, no service-role/DAL/Supabase/services in the admin UI, no admin API routes, no CRUD, no metrics/aggregation.**

Merged via PR #41 (squash) into `develop` at `df4523c feat: add admin dashboard shell`. Feature branch `feature/aura-302-admin-dashboard-shell` deleted (local + remote). **Opus review not required per the AURA-302 task block** (consumes the existing protected layout; no new auth/security/data boundary, no migration, no architecture change). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. Current source of truth is `develop` at `df4523c`.

### Implementation summary

- **Guarded `/admin/dashboard`** — `src/app/admin/(protected)/dashboard/page.tsx`: the dashboard shell lives **inside the `(protected)` group**, so the AURA-301 layout guard wraps it server-side (fail-closed); it renders one `<main>`, one `<h1>`, a labelled admin `<nav>`, and placeholder panels. Dynamic route (inherits `force-dynamic` from the protected layout); admin is hard `noindex`.
- **No unguarded route** — there is **no** `src/app/admin/dashboard/**` (that sibling of `(protected)` would not inherit the guard). The dashboard is only ever under `(protected)`.
- **`/admin` redirect** — `src/app/admin/(protected)/page.tsx` now `redirect('/admin/dashboard')` (still inside `(protected)`, so the guard runs first): unauthenticated `/admin` → `/admin/login`; authenticated `/admin` → `/admin/dashboard`.
- **Separate non-localized admin shell** — `src/components/admin/{AdminShell,AdminSidebar,AdminTopBar,AdminNav,AdminPlaceholderPanel}.tsx`: presentational only, static copy, luxury-dark tokens, simple sidebar + top-bar. **Not** the public Header/Footer/Navigation; **no next-intl**; no Supabase/DAL/services/service-role import.
- **Nav links** — `/admin/properties`, `/admin/leads`, `/admin/areas`, `/admin/settings`, `/admin/legal` (plus `/admin/dashboard`). Those target routes are **not implemented** (AURA-303–307) and 404 until built; **no placeholder route files** were created.
- **Placeholder panels only** — static "Coming soon" cards; **no metrics/real cards/aggregation/data reads/live data**. Both `super_admin` and `client_admin` see the same shell.

### Tests / gates summary

- **Tests added/updated:** unit (`admin-shell.test.tsx` — one `<main>`, labelled nav with all five section links, placeholder panels; CI-safe static render), security (`auth-guard.test.ts` — AURA-302 block: guarded location, no unguarded `src/app/admin/dashboard`, `/admin`→`/admin/dashboard` redirect, no DAL/Supabase/services/service-role/next-intl/public-layout in admin UI), e2e/smoke (`admin-login.spec.ts` / `smoke.spec.ts` — unauthenticated `/admin/dashboard` → `/admin/login`; full authenticated dashboard render gated behind `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD`, skipped in CI).
- PR checks green (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`).

### Next safe action

**AURA-303 (Property CRUD admin + publish checklist) — the third Phase 3 task — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-303 implementation** and **do not create the AURA-303 branch** until discovery is complete and the owner approves. Per the AURA-303 task block, **Opus review is required** (publish/visibility + audit boundary).

### Carry-forward / non-blocking (preserved for future tasks, not actioned at merge)

1. **Seeded-admin happy-path e2e in CI** — the full authenticated dashboard render is gated on `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI (same limitation as AURA-301); seed an admin so the cookie → guard → shell-render path runs in CI.
2. **Harden login rate-limit IP source** (AURA-301 carry-forward) — prefer a trusted IP source over the leftmost `x-forwarded-for` hop.
3. **Decide `/admin` Supabase session-refresh strategy** (AURA-301 carry-forward) — `/admin` is excluded from middleware and there is no session-refresh middleware; the guard's `auth.getUser()` is fail-closed but refreshed tokens are not re-persisted.
4. **Future `/api/admin/*` route handlers must call `requireAdmin()` / `requireSuperAdmin()` individually** — the layout guard protects pages, not Route Handlers.

---

## AURA-301 — MERGED (`97c9548`) — **PHASE 3 STARTED (1/7)**

**AURA-301: Admin login + session + role guard wiring.** The first Phase 3 (Admin Vertical Slice) task: the admin login page, server-side session handling, and the role guard wired across `/admin/**`. Reuses the AURA-104 auth guard and the AURA-106 login rate-limit — **no new migration, no Supabase config change, no package change, no CI workflow change, no branch-protection change, no service-role in client/UI, no raw IP persistence/logging, no dashboard shell/content beyond a minimal placeholder, no CRUD.**

Merged via PR #39 (squash) into `develop` at `97c9548 feat: add admin login and guard wiring`. Feature branch `feature/aura-301-admin-login` deleted (local + remote). **Targeted Opus 4.8 review (PR #39): APPROVE, merge recommendation YES, no blocking issues** (four non-blocking follow-ups preserved below). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. Current source of truth is `develop` at `97c9548`.

### Implementation summary

- **`/admin/login`** — `src/app/admin/login/page.tsx` + `AdminLoginForm.tsx` (client component): login **only** — **no signup, no password reset**, no Supabase/service-role import in the client; talks to the server action exclusively; generic, non-enumerating error copy. Admin is hard `noindex`.
- **Server-side login action** — `src/app/admin/login/actions.ts` (`'use server'`): Zod-validate → **rate-limit before any auth attempt** (AURA-106 `login` rule, 5 / 15 min / key; raw IP in-memory only) → `signInWithPassword` (anon server client) → **post-auth role validation** via the AURA-104 guard (`resolveAdminAccess`) — auth alone is insufficient; an authenticated-but-unprivileged session is signed back out and returned a generic `unauthorized`. Errors map to stable generic codes; no password/token/cookie/JWT/IP logging.
- **Role guard reuse (AURA-104)** — `src/services/auth/guard.ts` adds `resolveAdminAccess` (authorize an already-verified user on an existing request client) and `index.ts` re-exports it. Identity is established with verified `auth.getUser()` (never `getSession()`); the `user_profiles` own-row read is RLS-scoped; roles `super_admin` / `client_admin`.
- **`/admin` minimal guarded placeholder** — `src/app/admin/(protected)/page.tsx` behind `src/app/admin/(protected)/layout.tsx`, which enforces the full guard server-side (fail-closed: any guard error → `/admin/login`; `401` → `/admin/login`, `403` → `/admin/login?error=unauthorized`). The login page lives outside the `(protected)` group, so it is never guarded (no redirect loop). `src/app/admin/layout.tsx` owns `<html>`/`<body>` for the non-localized admin subtree and is deliberately unguarded.
- **Middleware** — `src/middleware.ts` adds `admin` to the next-intl matcher exclusion, so `/admin` and `/admin/login` are never rewritten to a locale prefix (`/admin/login` stays `/admin/login`, not `/en/admin/login`).
- **Knip** — `knip.jsonc`: removed the `src/services/auth/guard.ts` entry (now consumed by the protected layout + login action via the barrel); kept the `src/services/auth/index.ts` and `src/services/rate-limit/index.ts` entries (their barrels still re-export not-yet-wired surface for later Phase 3-4 tasks).

### Tests / gates summary

- **Tests added/updated:** unit (`src/tests/unit/admin-login.test.ts` — login schema), integration (`src/tests/integration/admin-login.test.ts` — rate-limit rule + allow/deny contract + live-DB gated own-row RLS read), e2e (`src/tests/e2e/admin-login.spec.ts` — login-only + non-locale-prefixed + guard-not-bypassable + gated happy path), smoke (`src/tests/e2e/smoke.spec.ts` — `/admin/login` loads, `noindex`, unauthenticated `/admin` → login), security (`src/tests/security/auth-guard.test.ts` — AURA-301 boundary block), and the two public-boundary security tests (`legal-public-boundary`, `property-detail-public-boundary`) retargeted away from the now-stale global `src/app/admin` non-existence assertion to the specific `src/app/admin/legal` / `src/app/api/admin` checks.
- PR checks green (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`).

### Opus review summary

- Verdict **APPROVE** · Merge recommendation **YES** · Blocking issues **None**.
- The auth/security boundary was cleared: verified-identity + `user_profiles` + role (auth alone never sufficient), server-side fail-closed guard, service-role sealed server-only, **D-40 no-self-signup satisfied**, and no raw IP persisted (D-18/D-51).

### Next safe action

**AURA-302 (Admin dashboard shell) — the second Phase 3 task — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-302 implementation** and **do not create the AURA-302 branch** until discovery is complete and the owner approves. Per the AURA-302 task block, **Opus review is not required** for AURA-302.

### Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge)

1. **Harden login rate-limit IP source** — the login IP uses the leftmost `x-forwarded-for` hop (client-spoofable on a proxied platform); prefer a trusted source (`x-real-ip` / rightmost trusted hop), best folded into AURA-106 (its rule example uses the same pattern).
2. **Decide `/admin` Supabase session-refresh strategy before the real dashboard** — `/admin` is excluded from middleware and there is no session-refresh middleware; the guard's `auth.getUser()` is fail-closed (secure), but refreshed tokens are not re-persisted, which can shorten effective sessions.
3. **Add a seeded-admin happy-path e2e in CI** — the successful-login e2e is gated on `ADMIN_E2E_EMAIL`/`ADMIN_E2E_PASSWORD` and skipped in CI; seed an admin so the full cookie → redirect → guard-pass path runs.
4. **Future `/api/admin/*` route handlers must call `requireAdmin()` / `requireSuperAdmin()` individually** — the layout guard protects pages, not Route Handlers.

---

## AURA-207 — MERGED (`65cc384`) — **PHASE 2 (7/7) → PHASE 2 COMPLETE**

**AURA-207: About page (`/en/about`) + Phase 2 public-page completion.** The seventh and final Phase 2 task: a static, demo-safe public About page that completes the Phase 2 public surface. Reuses the AURA-201 layout shell and the AURA-206 SEO/`noindex` helper. **No migration, no new DB/DAL, no DAL/Supabase/settings read from the page, no `.env`/`supabase/config.toml`/package/CI change, no admin code, no contact/lead form, no WhatsApp tracking, no media upload, no cinematic/GSAP, no real-client indexing, no canonical/OpenGraph/Twitter, no branch-protection change.**

Merged via PR #37 (squash) into `develop` at `65cc384 feat: add public about page`. Feature branch `feature/aura-207-about-page` deleted (local + remote). **Opus review not required per the AURA-207 task block** (static demo-safe page; no architecture/security/migration/data-boundary decision changed; reuses the D-42 `noindex` helper). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. Current source of truth is `develop` at `65cc384`.

### Implementation summary

- **Public route `/en/about`** — `src/app/[locale]/about/page.tsx`: a **Server Component** reusing the AURA-201 public layout shell. `setRequestLocale(locale)` + `getTranslations`; renders a `<main>` landmark, exactly one `<h1>`, and accessible semantic sections (hero, trust/agency pillars, operating principles, disclosure).
- **Static demo-safe content** — all visible copy from the new `About` namespace in `src/messages/en.json`; AUTEX framed as a premium Dubai real estate advisory **concept/demo brand** (no claim of a real licensed brokerage / RERA / broker license / awards / years in market).
- **No data access** — the page imports only `next`, `next-intl/server`, and the AURA-206 SEO helper (`@/lib/seo/routes`); **no DAL/Supabase/service-role/settings read**. Static → only the D-44 success state is relevant (no `loading`/`error`/`not-found` files).
- **SEO/noindex** — `about` route key added to `src/lib/seo/routes.ts`; page exports `metadata = publicRouteMetadata('about')` → `/en/about` is AUTEX **`noindex` by default** (D-42); no canonical/OG/Twitter.
- **AUTEX disclosure** — visible on-page disclosure reuses the existing **`Footer.disclosure`** string (Q-13), consistent with the footer.
- **Sitemap** — `/en/about` added to `PUBLIC_SITEMAP_PATHS` in `src/app/sitemap.ts`; dynamic property-detail URLs remain excluded; no DAL reads.
- **Tests** — `src/tests/e2e/smoke.spec.ts` (CI-run smoke: `/en/about` loads, `<main>`, single visible `<h1>`, AUTEX disclosure text, `noindex` metadata), `src/tests/unit/seo-metadata.test.ts` (`about` metadata key + default-`noindex`), `src/tests/integration/seo-routes.test.ts` (sitemap includes `/en/about`, still excludes dynamic property-detail URLs).

### Tests / gates summary

- PR checks green (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`).
- Full local gate run green: `lint`, `typecheck`, `format:check`, `test:unit`, `test` (full vitest), `test:e2e` + `test:smoke --project=chromium` (run against the production `next start` server with `CI=1`/`BASE_URL`, matching CI), `unused` (knip), `deps:check`, `build`, `quality`, `audit`. Scope scans clean (no `src/dal`/`src/app/api`/admin/Supabase/migration/CI/package/branch-protection changes).

### Phase 2 status

**COMPLETE (7/7).** The public surface — layout/footer (AURA-201), properties listing + API (AURA-202), property detail (AURA-203), areas overview (AURA-204), legal pages (AURA-205), SEO/`noindex` + robots/sitemap + Lighthouse advisory (AURA-206), and the About page (AURA-207) — is fully merged.

### Next safe action

**AURA-301 (Admin login + session + role guard wiring) — the first Phase 3 (Admin Vertical Slice) task — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-301 implementation** and **do not create the AURA-301 branch** until discovery is complete and the owner approves. AURA-301 wires the AURA-104 auth guard into a login/session/role-guarded admin entry (D-30/D-40) and will require Opus review (auth/security boundary).

### Carry-forward / non-blocking (preserved for future tasks, not actioned at merge)

1. **About content is static and not admin-editable** — a future task could make it data/settings-driven if required (out of MVP scope).
2. **Real-client indexing remains deferred** — `/en/about` is `noindex` by default; flipping `publicIndexingEnabled` to `true` is a future config change + owner approval.
3. **Canonical / OpenGraph / Twitter remain deferred** — not added for the About page.
4. **Dynamic property-detail sitemap URLs remain deferred** — the sitemap stays static (no DAL read).

---

## AURA-206 — MERGED (`a106fe8`) — **PHASE 2 (6/7)**

**AURA-206: SEO basics + AUTEX `noindex` (D-42) + enable Lighthouse advisory CI.** The sixth Phase 2 task: SEO metadata basics, the AUTEX **`noindex`-by-default** posture (D-42), `robots.txt` + `sitemap.xml` routes, and the now-enabled **non-blocking Lighthouse advisory CI**. Reuses the AURA-201 layout shell and the AURA-202–205 patterns. **No migration, no `.env`/`supabase/config.toml` change, no DAL/data-boundary change, no admin code, no About page, no real-client indexing, no production deploy config, no canonical/OpenGraph/Twitter, no npm Lighthouse dependency, no branch-protection change, no AURA-207+ work.**

Merged via PR #35 (squash) into `develop` at `a106fe8 feat: add SEO noindex and Lighthouse advisory`. Feature branch `feature/aura-206-seo-noindex-lighthouse` deleted (local + remote). **Opus review not required per the AURA-206 task block** (no architecture/security/migration/data-boundary decision changed; D-42 `noindex` is a documented locked decision). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. Current source of truth is `develop` at `a106fe8`.

### Implementation summary

- **Source-controlled feature config** — `src/config/feature-flags.ts`: `featureFlags.publicIndexingEnabled = false` (default `noindex`, D-42) + demo-safe `publicSiteUrl = "https://autex.example"` (reserved `.example` host). Compile-time constants in source — **not** env/deployment config.
- **Pure SEO helpers** — `src/lib/seo/metadata.ts` + `src/lib/seo/routes.ts`: build Next.js `Metadata` (title / description / robots); robots **fails closed to `noindex, nofollow`** unless indexing is explicitly enabled. No React/Supabase/DAL/IO. No canonical, no OpenGraph, no Twitter cards.
- **Public route metadata** — `/en`, `/en/properties`, `/en/properties/[slug]` (generic via `generateMetadata`, **no DAL read**), `/en/areas`, `/en/privacy`, `/en/terms`; the `[locale]` layout sets the global default-`noindex` robots.
- **`robots.txt`** — `src/app/robots.ts`: allows crawl (`allow: '/'`, **no `Disallow: /`**, so crawlers can read per-page `noindex`); advertises the sitemap.
- **`sitemap.xml`** — `src/app/sitemap.ts`: only the 5 existing static public routes (`/en`, `/en/properties`, `/en/areas`, `/en/privacy`, `/en/terms`); **excludes `/en/about` and dynamic property-detail URLs**; no DAL reads.
- **Lighthouse advisory CI** — `.github/workflows/lighthouse.yml`: enabled on PRs to `develop`, `continue-on-error: true`, `treosh/lighthouse-ci-action` (no npm dependency), no score thresholds; **non-blocking and not a required check**; hard-gating deferred to release / AURA-505.
- **Tests** — unit (`seo-metadata`, `lighthouse-workflow`), integration (`seo-routes`), and a noindex assertion in the CI-run `smoke.spec.ts`.

### Tests / gates summary

- PR checks green (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`).
- Full local gate run green: `lint`, `typecheck`, `format:check`, `test` (full vitest), `test:e2e`, `unused` (knip), `deps:check`, `build`, `audit`, `quality`. The smoke spec's new noindex assertion passes against the running app.

### Next safe action

**AURA-207 (About page (`/en/about`) + Phase 2 public-page completion) — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-207 implementation** and **do not create the AURA-207 branch** until discovery is complete and the owner approves. **AURA-207 owns `/en/about`** and reuses the AURA-206 SEO metadata helper (AUTEX `noindex` applied via the helper).

### Carry-forward / non-blocking (preserved for future tasks, not actioned at merge)

1. **Canonical URLs deferred** — not implemented in AURA-206.
2. **OpenGraph / Twitter cards deferred** — not implemented in AURA-206.
3. **Real-client indexing deferred and requires approval/config** — `publicIndexingEnabled` stays `false`; flipping it to `true` is a future source-config change + owner approval.
4. **Lighthouse remains advisory; hard score gate deferred to AURA-505 / release** — the advisory job is non-blocking and not a required check.
5. **`/en/about` remains not implemented and belongs to AURA-207** — excluded from the sitemap until it exists.
6. **Dynamic property-detail sitemap URLs deferred** — sitemap stays static (no DAL read) pending a future data-driven decision.

---

## AURA-205 — MERGED (`3d6a7e0`) — **PHASE 2 (5/7)**

**AURA-205: Public legal page read + safe Markdown render (D-12).** The fifth Phase 2 task: the public legal pages (Privacy / Terms) — a **published-only** legal read through an anon-client DAL behind the RLS public-read boundary, a Zod-validated public API route, the `/en/privacy` and `/en/terms` pages (reusing the AURA-201 layout shell) with full D-44 states, and **safe Markdown rendering under the D-12 boundary**. This is the first task to render admin-authored content, so it establishes the public D-12 safe-render path (no unsafe/raw HTML). **No migration, no `.env`/`supabase/config.toml` change, no CI change, no admin legal editing, no SEO/noindex/Lighthouse, no About page, no AURA-206+ work.** Two **approved** dependencies were added (`react-markdown`, `rehype-sanitize`).

Merged via PR #33 (squash) into `develop` at `3d6a7e0 feat: add public legal page read`. Feature branch `feature/aura-205-legal-page-read` deleted (local + remote). **Targeted Opus 4.8 review (PR #33): APPROVE, merge recommendation YES, no blocking issues; D-12 merge blocker satisfied** (five non-blocking carry-forwards preserved below). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. Current source of truth is `develop` at `3d6a7e0`.

### Implementation summary

- **Public published-only legal DAL** — `src/dal/legal.dal.ts` (`import 'server-only'`): reads **published legal pages only** via the **anon server client** + RLS (DAL also re-asserts `status = 'published'` as defence in depth); explicit public-safe column allowlist (never `select('*')`); raw rows never leave the DAL.
- **`GET /api/legal/[slug]`** — `src/app/api/legal/[slug]/route.ts`: Zod-validated slug; published-only; `{ data }` envelope; `400`/`404`/generic `500`; no service role in the handler; `force-dynamic`. Draft/archived/missing → **404 publicly**.
- **`/en/privacy` + `/en/terms`** — server-rendered; call the DAL directly; full D-44 states (loading / error + retry / not-found / success).
- **Safe Markdown render (D-12)** — `SafeMarkdown.tsx` via **`react-markdown` + `rehype-sanitize`**; **no `dangerouslySetInnerHTML`, no `rehype-raw`, no `marked`, no DOMPurify, no unsafe raw HTML path**. `LegalPageView.tsx` is the presentational view.
- **Public DTO fields only** — `slug`, `title`, `content`, `effectiveDate` (`content` is raw Markdown, rendered safely at the render layer).
- **Navigation** changed from the dead `/legal` link to `Privacy` and `Terms`.
- **Tests** — unit (`legal-page`, `safe-markdown`), live-DB DAL (`legal.dal`), security boundary (`legal-public-boundary`), integration (`legal-api`), e2e (`legal`).

### Opus review summary

- Verdict **APPROVE**
- Merge Recommendation **YES**
- Blocking Issues **None**
- **D-12 merge blocker satisfied** — safe Markdown + sanitizer; no raw HTML; no `dangerouslySetInnerHTML`/`rehype-raw`.

### Tests / gates summary

- PR checks green (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`).
- Live-DB DAL / security / integration suites passed per the implementation report (published-only reads; anon cannot read draft/archived legal pages).
- The D-12 adversarial Opus review passed (no raw-HTML render path).

### Public data-boundary summary

- **Anon server client** (not service-role) → RLS scopes anon legal reads to **published** pages → the DAL re-asserts published + an explicit public-safe column allowlist → key-only DTO projection (`{ slug, title, content, effectiveDate }`) → Markdown rendered through `react-markdown` + `rehype-sanitize` (no raw-HTML path).
- **Draft/archived/missing legal pages are never exposed** to the public (→ `404`); no admin/version/status metadata leaks.

### Next safe action

**AURA-206 (SEO basics + AUTEX noindex (D-42) + enable Lighthouse advisory CI) — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-206 implementation** and **do not create the AURA-206 branch** until discovery is complete and the owner approves. AURA-206 owns SEO/noindex/Lighthouse.

### Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge)

1. **Legal page `force-dynamic` comment accuracy** — the legal page comments say they inherit `force-dynamic` from the `[locale]` layout; route-segment config does **not** inherit parent→child, so the comment is inaccurate-but-harmless (actual dynamic behavior is still safe — the DAL reads cookies and the layout has `force-dynamic`). Future cleanup: clarify the comment.
2. **Legal e2e is a liveness smoke** — it does not distinguish article-rendered vs not-found-rendered. Acceptable for AURA-205 (live DAL/security/integration cover data behavior); a future improvement may add a seeded happy-path e2e.
3. **SafeMarkdown payload tests** — add committed `SafeMarkdown` tests for `data:` and `vbscript:` payloads in a future hardening patch.
4. **Default sanitize schema permits remote Markdown images** — acceptable for trusted admin legal content; future hardening may drop images or pin a custom schema if untrusted content ever flows through the renderer.
5. **Empty title JSONB may render an empty `<h1>`** — a content-quality issue, not security; a future validation/admin workflow should prevent this.

---

## AURA-204 — MERGED (`1fe2798`) — **PHASE 2 (4/7)**

**AURA-204: Public areas overview + `GET /api/areas`.** The fourth Phase 2 task: the public areas overview — an **active-only** areas read through an anon-client DAL behind the RLS public-read boundary, a Zod-validated public API route, and the `/[locale]/areas` overview page (reusing the AURA-201 layout shell) with full D-44 states. **No migration, no `package.json`/`package-lock.json` change, no `.env`/`supabase/config.toml` change, no CI change, no admin code, no area detail page, no property counts, no property aggregation, no AURA-205+ work.**

Merged via PR #31 (squash) into `develop` at `1fe2798 feat: add public areas overview`. Feature branch `feature/aura-204-areas-overview` deleted (local + remote). **Targeted Opus 4.8 review (PR #31): APPROVE, merge recommendation YES, no blocking issues** (three non-blocking carry-forwards preserved below). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. Current source of truth is `develop` at `1fe2798`.

### Implementation summary

- **Public active-only areas DAL** — `src/dal/areas.dal.ts` (`import 'server-only'`): reads **active areas only** via the **anon server client** + RLS (DAL also re-asserts active as defence in depth); explicit public-safe column allowlist (never `select('*')`); raw rows never leave the DAL; fixed ordering `sort_order ASC`, then `slug ASC`.
- **`GET /api/areas`** — `src/app/api/areas/route.ts`: Zod-validated; **no query params accepted**; envelope `{ data }`; generic errors only; `force-dynamic`.
- **`/[locale]/areas` overview page** — server-rendered (no client-side data fetch); calls the DAL directly; full D-44 states (loading / empty / error + retry / success); presentational props-only `AreaCard`.
- **Public-safe area DTO** — `{ slug, name, description, imageUrl }` only; no `id`, no `is_active`, no `sort_order`, no timestamps, **no property counts**, **no property aggregation**.
- **Tests** — DAL (active-only), integration (API), security (anon cannot read inactive areas), e2e (areas page).

### Opus review summary

- Verdict **APPROVE**
- Merge Recommendation **YES**
- Blocking Issues **None**

### Checks summary (PR #31 — all required checks green before merge)

- `CodeQL` — pass
- `analyze (javascript-typescript)` — pass
- `quality` — pass
- `e2e` — pass
- `db-tests` — pass

### Tests / gates summary

- PR checks green (`CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`).
- Live-DB DAL / security / integration suites passed per the implementation report (active-only reads; anon cannot read inactive areas).
- The E2E stale-server diagnosis was reviewed and **accepted by Opus** (not a blocker).

### Public data-boundary summary

- **Anon server client** (not service-role) → RLS scopes anon area reads to **active** areas → the DAL re-asserts active + an explicit public-safe column allowlist → key-only DTO projection (`{ slug, name, description, imageUrl }`).
- **Inactive areas are never exposed** to the public; no property counts / aggregation / area detail surface in AURA-204.

### Next safe action

**AURA-205 (Legal page read — `GET /api/legal/[slug]` + safe Markdown render, D-12) — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-205 implementation** and **do not create the AURA-205 branch** until discovery is complete and the owner approves. AURA-205 touches the public legal-content render boundary (D-12 merge blocker — no unsafe/raw HTML) and will require Opus review.

### Carry-forward / non-blocking (preserved for future tasks, not actioned at merge)

1. **Inline DAL-error retry affordance** — the `/en/areas` inline caught-DAL-error path renders an inline error without retry; the route `error.tsx` boundary has retry, but the inline caught error does not. Future improvement: either let the DAL error propagate to `error.tsx`, or add a refresh/retry affordance to the inline error.
2. **Area i18n extraction is English-only** — acceptable for the current `/en` MVP; needs locale-aware extraction when Arabic / more locales are added.
3. **`AreaCard` uses a plain `<img>`** — not `next/image`; acceptable for AURA-204, revisit in AURA-206 / Lighthouse / performance phase.
4. **AURA-204 docs-sync** now records completion; no status boxes in `docs/TASKS_Project.md` unless the established pattern changes.

---

## AURA-203 — MERGED (`b2f6129`) — **PHASE 2 (3/7)**

**AURA-203: Public property detail + `GET /api/properties/[slug]` + stakeholder visibility.** The third Phase 2 task: the public property **detail** surface — a published-only single-property read with a public-safe DTO, media gallery, price-on-application + conditional off-plan block, a safe public stakeholder projection, and locked contact routing — reusing the AURA-201 layout shell. **No migration, no `package.json`/`package-lock.json` change, no `.env`/`supabase/config.toml` change, no CI change, no admin code, no lead/WhatsApp routes, no media upload, no SEO/noindex, no similar properties, no cinematic/GSAP, no AURA-204+ work.** The AURA-202 listing DAL (`src/dal/properties.dal.ts`) is **untouched**; AURA-203 added a **separate** `src/dal/property-detail.dal.ts`.

Merged via PR #29 (squash) into `develop` at `b2f6129 feat: add public property detail route`. Feature branch `feature/aura-203-property-detail` deleted (local + remote). **Targeted Opus 4.8 review (PR #29): APPROVE, merge recommendation YES, no blocking issues** (five non-blocking carry-forwards preserved below). Required checks passed before merge: `CodeQL`, `analyze (javascript-typescript)`, `quality`, `e2e`, `db-tests`. Current source of truth is `develop` at `b2f6129`.

### Implementation summary

- **Public property detail API/page** — `GET /api/properties/[slug]` (Zod slug; `{ data }`; `400`/`404`/generic `500`; no service role in handler; `force-dynamic`) + `/[locale]/properties/[slug]` server-rendered page (calls the DAL directly; no client-side fetch) with full D-44 states (loading / error + retry / not-found / success).
- **Safe stakeholder visibility** — `{ name, type }` only, only for `visibility = public` on a published property; `internal_only` stakeholders and all stakeholder PII never exposed.
- **Contact routing** — property override → agency fallback → never stakeholder; one resolved CTA.
- **Off-plan block** — present only when `market_type = off_plan` (D-36); price-on-application rendering (D-48).
- **Media gallery** — images + floorplans; public CDN `url` only (never `storage_path`); cover-first ordering.
- **Tests** — unit (`property-contact-routing`, `property-detail`), live-DB DAL (`property-detail.dal`), security boundary (`property-detail-public-boundary`), integration (`property-detail-api`), e2e (`property-detail`).

### Opus review summary

- Verdict **APPROVE**
- Merge Recommendation **YES**
- Blocking Issues **None**

### Checks summary (PR #29 — all required checks green before merge)

- `CodeQL` — pass
- `analyze (javascript-typescript)` — pass
- `quality` — pass
- `e2e` — pass
- `db-tests` — pass

### Public data-boundary summary

- **Property/media reads use the anon server client + RLS** (the DAL also re-asserts `publish_status = 'published'`); draft/archived/missing → `404`.
- **Stakeholder selector is server-only, narrow, and fail-closed** — service-role, `select('name, type')`, `visibility='public'`, `[]` on error; `propertyId` always comes from an already-published anon fetch (`property_stakeholders` has no anon policy/grant → this is the only public path).
- **Public stakeholders projected as `{ name, type }`**; internal stakeholders and stakeholder PII (phone/email/whatsapp, registration/license, internal notes) are excluded.
- **Contact never routes to stakeholders** (D-14); the public-safe DTO is key-only and structurally drops any sensitive field (`address`, `views_count`, `created_by`/`updated_by`, timestamps, `publish_status`, `area_id`, `storage_path`, raw `agent_*`).

### Next safe action

**AURA-204 (Areas overview — DAL + `GET /api/areas`) — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-204 implementation** and **do not create the AURA-204 branch** until discovery is complete and the owner approves. AURA-204 likely touches the public areas/listing taxonomy and must still follow read-only discovery first.

### Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge)

1. **CI e2e coverage** — CI's `e2e` job runs `test:smoke` only; `property-detail.spec.ts` (and AURA-202's `properties.spec.ts`) are full-`test:e2e`/local, not run by CI `e2e`. Future follow-up: decide whether CI should run full `npm run test:e2e`.
2. **Detail e2e happy-path** — `property-detail.spec.ts` is data-independent and only verifies the not-found/error graceful states. Future follow-up: add a seeded happy-path detail e2e when the test-data strategy supports it.
3. **FEATURE_SPECS contact-routing drift** — `docs/FEATURE_SPECS.md` had the old 4-step contact priority; **synced in this PR** to the implemented/locked 6-step priority: (1) property.agent_whatsapp (2) property.agent_phone (3) property.agent_email (4) settings.whatsapp / agencyWhatsapp (5) settings.phone / agencyPhone (6) settings.email / agencyEmail. **Never stakeholder.**
4. **Optional stakeholder defense-in-depth** — make the service-role public-stakeholder selector's safety local to the query with an explicit published-parent check. The current control flow is approved and not blocking.
5. **CI ergonomics** — pre-existing: the wait-for-server loop could fail earlier/more clearly. Not an AURA-203 blocker.

---

## AURA-202 — MERGED (`1d4c514`) — **PHASE 2 (2/7)**

**AURA-202: Public properties listing + `GET /api/properties` + `GET /api/properties/featured`.** The first public **data** page: published-only property reads through an anon-client DAL behind the RLS public-read boundary, two Zod-validated public API routes, the `/[locale]/properties` listing page (reusing the AURA-201 layout shell) with full D-44 states, the presentational `PropertyCard`, and the homepage featured section. **No migration, no `package.json`/`package-lock.json` change, no `.env`/`supabase/config.toml` change, no CI change, no admin code, no property detail route/page (AURA-203), no stakeholder projection, no contact routing, no lead/WhatsApp routes, no media upload, no areas overview, no legal pages, no SEO/Lighthouse, no cinematic/GSAP, no AURA-203+ work.**

Merged via PR #27 (squash) into `develop` at `1d4c514 feat: add public properties listing and API` (full SHA `1d4c514399da18249495733c10f4a1b0edf52fc3`; merged **2026-06-22T12:54:55Z**; pre-squash implementation commit `1b05e35`). Feature branch deleted. **Targeted Opus 4.8 review (PR #27): APPROVE, merge recommendation YES, no blocking issues** (six non-blocking carry-forwards preserved below). Required checks passed before merge: `quality`, `e2e`, `db-tests`, `analyze (javascript-typescript)`, `CodeQL`. Current source of truth is `develop` at `1d4c514`.

### Implementation summary (19 files, all under `src/`)

- **`src/dal/properties.dal.ts`** (`import 'server-only'`) — `listPublishedProperties()` (filters/search/sort/pagination, `count: 'exact'`) + `listFeaturedProperties(limit)`. Anon server client only; re-asserts `publish_status = 'published'` (and `is_featured = true` for featured); explicit public-safe column allowlist (never `select('*')`); raw rows never leave the DAL; batched cover-media query (no N+1); `storage_path` never selected.
- **`src/app/api/properties/route.ts`** — `GET /api/properties`; Zod-validated; envelope `{ data, pagination: { page, limit, total, totalPages } }`; pagination default 1/12, hard cap 50 (clamps); 400 on invalid filter/page/limit and `max_price < min_price`; generic errors; `force-dynamic`.
- **`src/app/api/properties/featured/route.ts`** — `GET /api/properties/featured`; Zod-validated `limit` (default 6, hard max 12); envelope `{ data }`; generic errors; `force-dynamic`.
- **`src/app/[locale]/properties/{page,loading,error}.tsx` + `_components/PropertyFilters.tsx`** — Server-Component listing page reading `searchParams` → domain validation → DAL (no API round-trip, no client fetch, no react-query); D-44 loading/empty/validation-error/data-error(+retry)/success; GET-form filters (no client JS, no Supabase).
- **`src/components/real-estate/PropertyCard.tsx`** — presentational, props-only `PropertyCardDTO`; no Supabase/DAL/services import; price via pure domain helpers.
- **`src/app/[locale]/page.tsx`** — homepage featured section; **fails closed** to empty on any DB/env error (no cinematic/GSAP — AURA-502).
- **`src/domain/properties/{query,card,format}.ts`** — pure Zod query contract, public-safe DTO + key-only projector, AED formatting (A-11, D-48); no React/Supabase/DAL imports.
- **`src/messages/en.json`** — `Properties`/`PropertyCard`/`FeaturedProperties`/`ListingStates` namespaces only.
- **Tests** — unit (`properties-query`, `property-card-formatting` incl. sensitive-field-drop projection), live-DB DAL (`properties.dal.test.ts`), security boundary (`properties-public-boundary.test.ts`), integration (`properties-api.test.ts`, DAL mocked), e2e (`properties.spec.ts`, data-independent).

### Opus review summary

- Verdict **APPROVE**
- Merge Recommendation **YES**
- Blocking Issues **None**

### Checks summary (PR #27 — all required checks green before merge)

- `CodeQL` — pass
- `analyze (javascript-typescript)` — pass
- `quality` — pass
- `e2e` — pass
- `db-tests` — pass

### Public data boundary summary

- **Anon server client** (`createSupabaseServerClient()`), **not** service-role — RLS is the enforcement boundary.
- **RLS + DAL published-only re-assertion** — anon RLS scopes reads to published properties / active areas / published-parent media (`property_stakeholders` has no anon policy → default-deny); the DAL also re-asserts `publish_status = 'published'` (and `is_featured = true` for featured) as defence in depth.
- **Explicit public-safe column allowlist** — never `select('*')`; raw rows never leave the DAL; output is a key-only DTO projection that structurally drops extras.
- **No sensitive fields exposed** — `views_count`, `address`, `external_map_url`, `agent_*`, `internal_notes`, `storage_path`, `created_by`/`updated_by`, `description`, and off-plan/payment-plan detail are never selected or projected.

### Next safe action

**AURA-203 (Property detail + stakeholder visibility) — read-only discovery only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. **Do not start AURA-203 implementation** until discovery/planning is complete and the owner approves; do not create the AURA-203 branch until then. AURA-203 likely requires **Opus 4.8 review** (it touches the public property-detail data boundary and stakeholder visibility, D-15/D-16/D-14).

### Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks, not actioned at merge)

1. **FTS index expression/performance mismatch** — DAL search is correct, but the existing GIN index (`to_tsvector('english', coalesce(title_en,''))`) is not used by the query (`to_tsvector('english', title_en)`), so search falls back to a sequential scan. Future migration/performance task; **not** an AURA-202 blocker (the index lives in a pre-existing migration).
2. **RTL badge class** — `PropertyCard` featured badge uses the physical `left-3`; future polish should use the logical `start-3`.
3. **Static sensitive-token scan completeness** — expand the future static scan to include `agent_name`, `description`, `payment_plan_summary`. **Do not** add `off_plan` (it is a valid public enum/filter value).
4. **E2E CI wiring** — `properties.spec.ts` passes locally, but CI's `e2e` job runs the smoke spec only; consider wiring full `test:e2e` into CI in a future task.
5. **Unused i18n keys** — `PropertyCard.viewDetails` and `PropertyCard.currency` are currently unused; remove or use in a future cleanup.
6. **Detail route** — `PropertyCard` links to `/{locale}/properties/{slug}`, but AURA-203 owns that route's implementation. This is expected (dead-until-AURA-203).

---

## AURA-201 — MERGED (`f17b429`) — **PHASE 2 STARTED (1/7)**

**AURA-201: Public layout + header/footer + i18n shell + server-only public settings selector.** First Phase 2 task — the public site shell. Builds the public `/[locale]` layout (header, navigation, footer), a minimal **next-intl v4** i18n shell (English-only visible UI; RTL-ready direction helper), and a **server-only public settings safe selector** backing a settings-driven footer. **No migration, no `package.json`/`package-lock.json` change, no `.env`/`supabase/config.toml` change, no admin code, no property listing/detail, no areas, no legal pages, no lead/WhatsApp implementation, no AURA-202+ work.**

Merged via PR #25 (squash) into `develop` at `f17b429 feat: add public layout and settings-driven footer`. Feature branch `feature/aura-201-public-layout-i18n-shell` deleted (local + remote). **Targeted Opus 4.8 review (PR #25): APPROVE, merge recommendation YES, no blocking issues** (four non-blocking carry-forwards preserved below). Required checks passed before merge: `quality`, `e2e`, `db-tests`, `analyze (javascript-typescript)`, `CodeQL`. Current source of truth is `develop` at `f17b429`.

### What was built (16 files)

- **`src/app/layout.tsx`** — root layout reduced to a **passthrough** (`return children`). The `[locale]` layout now owns `<html>`/`<body>`, `lang`/`dir`, global styles, and the next-intl provider (the canonical next-intl App Router pattern; no double `<html>`/`<body>` — confirmed by build + e2e).
- **`src/app/[locale]/layout.tsx`** — localized layout: `hasLocale(routing.locales, locale)` → `notFound()` on unknown locale; `setRequestLocale(locale)`; `Promise.all([getMessages(), getPublicSettings()])`; renders `<html lang={locale} dir={getLocaleDirection(locale)}>` + `<body>` + `NextIntlClientProvider` + `<Header/>` + page `children` + settings-driven `<Footer settings={…}/>`. `export const dynamic = 'force-dynamic'` (settings read at request time; build never needs a DB).
- **`src/components/layout/{Header,Navigation,Footer}.tsx`** — presentational server components; **no Supabase/DAL/service-role import**. `Footer` receives only the `PublicSettings` DTO as a prop. Q-13 AUTEX disclosure is static UI copy (not DB-driven). `Navigation` links are locale-prefixed to not-yet-built AURA-202+ routes (intentional).
- **`src/dal/settings.dal.ts`** — **`import 'server-only'`** `getPublicSettings()`: service-role client (RLS-bypass, server-only), `select('key, value')` only, `.in('key', PUBLIC_SETTING_KEYS)` allowlist at the query level, projects through `projectPublicSettings`, **fails closed** to `defaultPublicSettings()` on any error. `settings` has no anon RLS policy → this is the only public read path.
- **`src/domain/settings/public-settings.ts` + `index.ts`** — **pure** (no Supabase/`server-only`/I/O): `PUBLIC_SETTING_KEYS` allowlist (7 keys: `agency_name`, `agency_phone`, `agency_email`, `agency_whatsapp`, `agency_address`, `footer_tagline`, `social_links`), `PublicSettings` DTO, `defaultPublicSettings()` (fresh safe demo defaults each call), `projectPublicSettings(rows)` — allowlist filter + per-key Zod (non-empty strings, `.email()`, fixed-platform `social_links` partial that strips unknown platforms); malformed/missing → safe defaults; only `key`+`value` consumed so row metadata (`updated_by`/timestamps) can never leak.
- **`src/i18n/request.ts`** — next-intl v4 `getRequestConfig` (locale resolve + `en` catalog static import). **`next.config.js`** — wires `createNextIntlPlugin('./src/i18n/request.ts')`. **`src/lib/i18n/direction.ts`** — pure `getLocaleDirection` (`ltr`/`rtl`; `ar` pre-mapped; Arabic UI NOT implemented). **`src/messages/en.json`** — Header/Nav/Footer catalog incl. AUTEX disclosure.
- **Tests:** `src/tests/unit/settings-public.test.ts` (pure projector — allowlist exactness, defaults, per-key fail-closed validation, social stripping, metadata/internal-key no-leak); `src/tests/dal/settings.dal.test.ts` (gated `SUPABASE_LOCAL_TESTS=1` live-DB `psql` contract inside `begin … rollback` — proves the allowlist/`key,value`-only/no-metadata guarantees the `server-only` selector relies on, since it cannot be imported into Vitest); `src/tests/e2e/smoke.spec.ts` (extended — banner/nav[Primary]/main/contentinfo landmarks, footer agency name, AUTEX disclosure, `lang=en`/`dir=ltr`).
- **`knip.jsonc`** — removed `src/lib/supabase/service-role.ts` from `entry` (now statically imported by `src/dal/settings.dal.ts`, reached by the public `[locale]` layout via `getPublicSettings()`). No allowlist weakened.

### CI evidence (PR #25 — all required checks green)

`quality` · `e2e` · `db-tests` · `analyze (javascript-typescript)` · `CodeQL` — all **pass**. `db-tests` ran the live DAL selector contract against the Dockerized Supabase stack. PR was OPEN / MERGEABLE / `mergeStateStatus: CLEAN` before squash-merge.

### Carry-forward / non-blocking (from the targeted Opus review; preserved for future tasks)

1. **Settings selector observability** — `getPublicSettings()` fail-closed branches (`catch` / `if (error)`) swallow errors silently; a misconfigured service-role env or downed DB renders demo defaults with no signal. Add server-side logging/Sentry breadcrumb (defer to observability work, Phase 6).
2. **Stricter phone/WhatsApp validation later** — `agency_phone`/`agency_whatsapp` validate only as non-empty strings (safe at render: WhatsApp strips to digits, phone via `tel:`). Tighten when `libphonenumber-js` is wired for lead/contact work (Phase 2–3).
3. **Skip-to-content cleanup** — `Header.skipToContent` message key exists in `en.json` but no skip link is rendered; wire a skip link (a11y) or drop the key.
4. **Future settings caching/revalidate** — `force-dynamic` does a service-role settings read per request with no caching; revisit with `revalidate`/tag-based caching if settings reads become hot.

### Next safe action

**AURA-202 (Properties listing + `GET /api/properties` + featured) — discovery/planning only.** Not started; requires a new session + explicit per-task discovery/planning approval before any work begins. Do not start AURA-202 implementation in the docs-sync session.

---

## AURA-107 — MERGED (`04d3522`) — **PHASE 1 EXIT GATE → PHASE 1 COMPLETE**

**AURA-107: run live Supabase DAL/security/integration tests in CI.** Brings the previously local-only gated suites into CI against a **Dockerized Supabase CLI local stack**. CI/test-infrastructure only — **no product code, no migration, no `package.json`/`package-lock.json`, no `.env`/`supabase/config.toml`/secrets change.** The diff is exactly two files: `.github/workflows/ci.yml` and `src/tests/dal/supabase-smoke.test.ts`.

Merged via PR #23 (squash) into `develop` at `04d3522 ci: run live Supabase DAL and security tests`. Feature branch `feature/aura-107-dal-security-ci-harness` deleted. **Opus 4.8 phase-exit review (PR #23): APPROVE, merge recommendation YES, no blocking issues.** Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, and the new **`db-tests`**. Current source of truth is `develop` at `04d3522`.

### What was built

- **New `db-tests` job** in `.github/workflows/ci.yml` — separate from `quality` (which stays the fast gate and was **not** weakened; its DAL/security/integration steps run static + gated suites that self-skip without `SUPABASE_LOCAL_TESTS=1`). The `db-tests` job: checkout → Node 20 → pin npm `11.12.1` (consistent with `quality`/`e2e`) → `npm ci` → ensure `psql` client present → `supabase/setup-cli@v1` pinned to **`2.106.0`** → `supabase start` → `supabase db reset` (applies all 4 migrations) → `pg_isready` readiness wait (30×2s) → `test:dal` / `test:security` / `test:integration` with `SUPABASE_LOCAL_TESTS=1` → `supabase stop` (`if: always()`, tolerates a never-installed CLI). `timeout-minutes: 15`. Env: `SUPABASE_LOCAL_TESTS=1`, `SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres` (local-default creds; **no secrets, no production resources**).
- **Node-20 smoke-test harness fix** in `src/tests/dal/supabase-smoke.test.ts` — the gated reachability test now proves the local stack is reachable with a raw `fetch` against `/rest/v1/` instead of constructing a `supabase-js` client. `createClient()` eagerly builds a `RealtimeClient` requiring a global `WebSocket`, absent in Node < 22 (CI is Node 20). `createClient` importability is still asserted by the CI-smoke `describe` block, so **no coverage is lost**; the fetch reachability assertion remains. No `ws` dependency added; Node baseline stays 20 across all jobs.

### Live CI evidence (`db-tests` green — run job 82498034393)

- All 4 migrations applied (`20260616183318_init`, `20260617025449_rls_policies`, `20260619201518_storage_policies`, `20260619230918_rate_limit_functions`); Postgres readiness confirmed (`Postgres ready after 1 attempt(s)`); stack stopped cleanly (`Stopped supabase local development setup.`).
- **`test:dal` PASS — 49** (5 files); **`test:security` PASS — 94** (8 files); **`test:integration` PASS — 7** (3 files). **Zero skips in live mode.** Counts match the local pre-PR verification.

### Carry-forward / status

1. **`db-tests` is now a required branch-protection check on `develop`.** Verified via GitHub API on 2026-06-20: `develop` required checks are `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, `db-tests`. **The AURA-107 Phase 1 exit gate is now fully enforced by branch protection.**
2. **Local-only carry-forward resolved.** The AURA-103/104/105/106 "live tests are local-only (`SUPABASE_LOCAL_TESTS=1`) until AURA-107" posture is now satisfied — those suites run live in CI. Local manual runs still use `SUPABASE_LOCAL_TESTS=1` + `supabase start`.
3. **Phase 2 is next.** First task **AURA-201 (Public layout + header/footer + i18n shell)** — not started; requires a new session + per-task discovery/planning approval.

---

## AURA-106 — MERGED (`dd21edd`)

**AURA-106: Rate-limit table + salted-hash key strategy (D-51).** Full server-side rate-limit **service** (not cleanup-only — the authoritative `docs/TASKS_Project.md` task is the whole service): salted-hash key derivation, config-tunable threshold enforcement, and the 24h-TTL cleanup. **Not wired into any route** — lead/whatsapp/login routes consume it in Phases 3-4 (`Out of Scope` per the task). **No `.env`/`supabase/config.toml`/`package-lock.json` change; `rate_limits` table shape, RLS, and grants unchanged.**

Merged via PR #21 (squash) into `develop` at `dd21edd feat: add rate-limit service and TTL cleanup`. Feature branch `feature/aura-106-rate-limit-service` deleted. **Opus 4.8 review (PR #21): APPROVE, merge recommendation YES, no blocking issues** (three non-blocking hardening notes preserved below). Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`. Current source of truth is `develop`.

### What was built

- **`src/services/rate-limit/key.ts`** — PURE (no `server-only`, no env, no I/O), unit-testable: `hashRateLimitKey(salt, ip, route)` = `HMAC-SHA256(salt, `${ip}:${route}`)` hex; `RATE_LIMIT_RULES` (A-03 — `lead_submit` 5/h, `whatsapp_click` 30/h, `login` 5/15min); `getRateLimitRule`/`isRateLimitRoute` (unknown route throws); `RateLimitResult`/`RateLimitRoute`/`RateLimitRule` types. The raw IP is an **in-memory argument only** and never appears in the output.
- **`src/services/rate-limit/limit.ts`** — **`server-only`** runtime: `enforceRateLimit({ route, ip })` reads `RATE_LIMIT_SALT` via `getServerEnv()`, derives the key, calls `consume_rate_limit` through the service-role client, maps the typed `RateLimitResult`. Raw IP never stored/returned/logged.
- **`src/services/rate-limit/index.ts`** — barrel (server-only-tainted; Knip `entry` until a route imports it). Tests import `./key` directly to avoid the `server-only` guard.
- **Migration `supabase/migrations/20260619230918_rate_limit_functions.sql`** (new; existing migrations untouched):
  - `public.consume_rate_limit(p_key_hash text, p_route text, p_limit integer, p_window_seconds integer)` → `(allowed, limit_value, remaining, current_count, reset_at)`. Atomic check-and-increment via `SELECT … FOR UPDATE` + `INSERT … ON CONFLICT DO NOTHING` race handling: no row → insert count=1; window elapsed → reset; under limit → increment; at/over limit → deny (row & `expires_at` untouched). `expires_at` (24h row TTL, A-16) refreshed to `now()+24h` on every allow. Accepts **only** hash+route+limit+window — never an IP.
  - `public.cleanup_rate_limits()` → integer: `delete from public.rate_limits where expires_at < now()`, returns deleted count, idempotent.
  - Both **`SECURITY DEFINER`, `set search_path = ''`** (same hardening as `current_user_role`); EXECUTE revoked from `public`, granted only to `service_role`. **No new RLS policy, no anon/authenticated grant** — `rate_limits` stays service-role-only.
  - `rate_limits_expires_at_idx` on `(expires_at)` for the cleanup sweep.
  - **Guarded** hourly pg_cron job `aura-rate-limits-cleanup` (`'0 * * * *'` → `select public.cleanup_rate_limits();`), wrapped in a `DO` block that catches a missing/unpreloaded pg_cron and degrades to a `NOTICE` so `supabase db reset` never fails; idempotent (unschedule-then-schedule). A-16 "or equivalent": where pg_cron is absent, an external scheduler drives the function.
  - Documented rollback: guarded unschedule → drop both functions → drop index; **never drops the `rate_limits` table** (owned by AURA-102).
- **`src/types/database.ts`** — regenerated (`npm run db:types`): `Functions` gains `consume_rate_limit` + `cleanup_rate_limits` (+16 lines; no table/enum change).
- **Tests:** `src/tests/unit/rate-limit.test.ts` (pure — HMAC determinism same/diff route/diff ip/diff salt, 64-hex, no-raw-IP, A-03 thresholds, unknown-route throws); `src/tests/dal/rate-limit.test.ts` (gated — first-allow, increment-then-deny, denial-doesn't-increment, window reset, result shape, 24h TTL refresh, cleanup deletes-expired/keeps-fresh/idempotent/no-op); `src/tests/security/rate-limit-functions.test.ts` (CI-safe static migration hardening + gated negatives — SECURITY DEFINER, empty search_path, anon/auth cannot execute either function, rate_limits still 0 policies / no anon-auth grants / no IP column).
- **`knip.jsonc`** — added `src/services/rate-limit/index.ts` as `entry`.

### Verification (this branch)

- **Local stack (CLI 2.106.0):** `supabase start` ✓ → `supabase db reset` applies **all 4 migrations clean** ✓ (pg_cron present on this stack → `NOTICE: scheduled hourly pg_cron job aura-rate-limits-cleanup`; cron.job row confirmed) → `SUPABASE_LOCAL_TESTS=1 npm run test:dal` **PASS (5 files, 49)** → `SUPABASE_LOCAL_TESTS=1 npm run test:security` **PASS (8 files, 94)**.
- **Full gates (CI mode):** `npm run quality` **PASS** (lint, typecheck, format:check, `npm run test` 17 files/118 + 97 gated-skips, unused/knip clean, deps:check 0 violations/32 modules, `next build`). `npm run test:unit` **65 PASS**; `npm run test:integration` **PASS (1 + 6 gated-skips)**. `npm run audit` **PASS** (exit 0; 2 moderate `postcss`-via-`next` carry-forward only).
- **Blocker greps clean:** no `.env`/`package-lock.json`/`config.toml` change; no `clients`/`client_id`/tenant (only the D-05 invariant comment); no raw IP (`ip_address`/`user_ip`/`client_ip`/`x-forwarded-for`/`request.ip`/`p_ip`); no new `rate_limits` policy or anon/authenticated grant; no service-role in `src/components`/`src/app`/`src/domain`.

### Carry-forward / open items

1. Live consume/cleanup behavioural + security-negative tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized stack into CI (static migration-text + pure unit tests run in CI now).
2. The rate-limit service has **no route importer yet** — Phases 3-4 (lead/whatsapp/login Route Handlers) are first; remove the `src/services/rate-limit/index.ts` Knip `entry` then.
3. **pg_cron is environment-dependent.** It is preloaded on this local CLI stack (job scheduled), but where unavailable the migration degrades gracefully and `public.cleanup_rate_limits()` must be driven by an equivalent external scheduler (A-16). On hosted Supabase, confirm pg_cron is enabled so the hourly job runs.

### Non-blocking Opus 4.8 hardening notes (preserved for a future task; not actioned at merge)

1. **Defensive DB guard** — add `p_limit > 0` and `p_window_seconds > 0` validation inside `consume_rate_limit`. Today only `service_role` can execute it and the sole caller (`limit.ts`) passes validated `RATE_LIMIT_RULES` values, so this is defense-in-depth only.
2. **Tighten `RATE_LIMIT_SALT` minimum length** in `src/lib/validation/env.schema.ts` (currently `z.string().min(1)`). Pre-existing from AURA-101 — out of AURA-106 scope.
3. **Reconfirm/regenerate database types** in a future DB-touching task — the AURA-106 `consume_rate_limit`/`cleanup_rate_limits` types in `src/types/database.ts` were hand-added and verified accurate against the SQL; regenerate from the live stack when one is available.

---

## AURA-105 — MERGED (`fae3d62`)

**AURA-105: Storage bucket policies + media path strategy.** Configures the Supabase Storage layer for property media: the `property-media` bucket + admin-only `storage.objects` policies, and a pure media validation/storage-path contract for the later upload route. **No upload route/UI (AURA-304), no admin UI, no signed URLs (deferred), no service-role usage, no video/360, no `supabase/config.toml`/`.env`/`package-lock.json` change.**

Merged via PR #19 (squash) into `develop` at `fae3d62 feat: add storage bucket policies and media path strategy`. Feature branch `feature/aura-105-storage-bucket-policies` deleted. **Opus 4.8 review (PR #19): APPROVE, merge recommendation YES, no blocking issues** (6 info-level observations; none blocking). Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

### What was built

- **Migration `supabase/migrations/20260619201518_storage_policies.sql`** (new; AURA-102/103 migrations untouched):
  - Creates/reconciles the **`property-media`** bucket idempotently (`insert ... on conflict (id) do update`): `public = true`, `file_size_limit = 10485760` (10 MiB; A-15/Q-04), `allowed_mime_types = {image/jpeg,image/png,image/webp}` (A-14; D-41 — no video/360).
  - **4 admin-only `storage.objects` policies** — `property_media_objects_admin_{select,insert,update,delete}`, each scoped `bucket_id = 'property-media'` and gated by `public.is_admin()` (AURA-103 helper → super_admin/client_admin). Idempotent via `drop policy if exists` first.
  - **No anon policy** on `storage.objects` → anon cannot list/enumerate or mutate. Public read is served by the bucket `public` flag (direct CDN fetch by UUID path); media *discovery* stays gated by the existing `property_media` table RLS (anon sees rows for published properties only).
  - Documented rollback block + the **known limitation**: a retained public object URL stays fetchable after the property is unpublished/archived (table RLS hides the row, not the object); full revocation needs signed URLs (deferred out of MVP).
- **`src/domain/properties/media.ts`** — PURE contract (no React/Supabase/service-role/I/O): `MEDIA_BUCKET`, `MAX_MEDIA_BYTES = 10_485_760`, `ALLOWED_MEDIA_MIME_TYPES`, `MEDIA_TYPES` (`image`/`floorplan`), `MIME_EXTENSION`; Zod schemas; `validateMediaUpload`; `extensionForMime`; `buildMediaStoragePath` → **`properties/{property_id}/{media_type}/{media_id}.{ext}`** (UUID-only components validated by `z.string().uuid()`; extension derived from MIME; rejects traversal/slash injection/non-UUID; never trusts a user filename).
- **`src/services/storage/policy.ts`** — server-safe storage contract surface: re-exports the bucket/path contract from domain + declares `MEDIA_BUCKET_CONFIG` and `MEDIA_OBJECT_POLICIES` (single source of truth, cross-checked against the migration text by tests). No Supabase/service-role import. (services→domain import; no dependency-cruiser rule forbids it; `deps:check` clean.)
- **Tests:** `src/tests/unit/media-contract.test.ts` (19, CI-safe — constants, validation accept/reject, path template, traversal rejection); `src/tests/security/storage-policies.test.ts` (CI-safe static migration + contract cross-check; gated `SUPABASE_LOCAL_TESTS=1` catalog [bucket metadata, 4 admin policies, no-anon-policy] + behavioural [anon INSERT denied, non-admin INSERT denied, is_admin predicate, admin INSERT/SELECT allowed]).
  - **Gated-coverage note:** behavioural anon UPDATE/DELETE are intentionally omitted — RLS silently filters anon UPDATE to 0 rows, and `storage.protect_delete()` blocks ALL direct SQL DELETEs regardless of role; the anon write/list denial is proven authoritatively by the "no anon policy" catalog assertion + the behavioural anon INSERT denial.
- **`knip.jsonc`** — added `src/domain/properties/media.ts` + `src/services/storage/policy.ts` as `entry` (first real importer = AURA-304; remove then).

### Locked decisions applied (this task, user-approved)

1. Bucket name `property-media`; source of truth = SQL migration under `supabase/migrations/**`.
2. Bucket config: `public = true`, `file_size_limit = 10485760`, `allowed_mime_types = {image/jpeg,image/png,image/webp}`.
3. Media types `image` + `floorplan`; video/360/virtual tours out of MVP (D-41).
4. Path `properties/{property_id}/{media_type}/{media_id}.{ext}`; UUID-only; MIME-derived extension; no user filename trust; reject traversal/slash injection.
5. Public-read bucket; admin-only `storage.objects` write/list via `public.is_admin()`; **no anon policy**; **no service-role used in AURA-105** (the AURA-304 route may later choose a request-scoped admin client or service-role *after* `requireAdmin()`).

### Verification (this branch)

- **Local stack (CLI 2.106.0):** `supabase start` ✓ → `supabase db reset` applies all 3 migrations clean ✓ → `SUPABASE_LOCAL_TESTS=1 npm run test:dal` **PASS (4 files, 41)** → `SUPABASE_LOCAL_TESTS=1 npm run test:security` **PASS (7 files, 74)** → `supabase stop` ✓.
- **Full gates (CI mode):** `npm run quality` **PASS** (lint, typecheck, format:check, `npm run test` 15 files/95 + 80 gated-skips, unused, deps:check 0 violations/28 modules, `next build`). `npm run audit` **PASS** (exit 0; 2 moderate `postcss`-via-`next` carry-forward only).
- **Blocker greps clean:** no `.env`/`package-lock.json`/`config.toml` change; no `clients`/`client_id`/tenant; no raw IP; no real video/360 (only D-41 exclusion comments); no service-role in `src/components`/`src/app`/`src/domain`.

### Carry-forward / open items

1. Live storage catalog/behavioural tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized stack into CI.
2. **AURA-304** (media upload route) is the first real importer of `src/domain/properties/media.ts` + `src/services/storage/policy.ts` — remove their Knip `entry` lines then; the route gates writes with `requireAdmin()` and chooses the storage client there.
3. **Public-read limitation** (retained URL fetchable after unpublish/archive) documented + deferred — full revocation needs signed URLs (out of MVP).
4. Hosted-Supabase note: `storage.objects` policy creation in the migration runs as `postgres` (supported on the platform; superuser locally).

---

## AURA-104 — MERGED (`44a7fd4`)

**AURA-104: Auth + `user_profiles` role checks + admin bootstrap script (D-40).** Implements the application-layer admin authorization guard and the first-`super_admin` bootstrap script, completing the authenticated session/profile/role negatives deferred from AURA-103. **No migration, no `supabase/config.toml` change, no signup route/UI, no API routes, no admin UI.**

Merged via PR #17 (squash) into `develop` at `44a7fd4 feat: add admin auth guard and bootstrap script`. Feature branch `feat/aura-104-auth-rbac` deleted. **Opus 4.8 review (PR #17): APPROVE, merge recommendation YES, no blocking issues** (the non-runnable `scripts/seed-admin.ts` runner decision accepted as a non-blocking follow-up). Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

### What was built

- **Auth guard service (`src/services/auth/`)** — server-only request-path admin authorization:
  - `types.ts` (pure) — `UserRole`, `AdminProfile`, `RoleRequirement`, `AdminContext`, `AccessResult` (discriminated union), `AuthFailureCode`, and the typed `AuthorizationError` (carries `status` 401/403 + stable `code`, maps cleanly to the API `{ error, code }` envelope).
  - `policy.ts` (pure, no `server-only`) — `isAdminRole`, `isSuperAdminRole`, and `evaluateAccess({ userId, profile, requirement })`. Encodes the order that yields the correct 401-vs-403 distinction: no user → 401 `UNAUTHENTICATED`; user but no profile → 403 `NO_PROFILE` (**auth alone is insufficient**); profile but role too low → 403 `INSUFFICIENT_ROLE`; otherwise allowed. Unit-tested directly.
  - `guard.ts` (**`import 'server-only'` first line**) — `getCurrentUser`, `getCurrentAdmin(requirement='admin')`, `requireAdmin`, `requireSuperAdmin`. Uses `createSupabaseServerClient()` (anon, request-scoped) and `supabase.auth.getUser()` (re-validated server-side — **never** the unverified cookie session). Fetches the caller's **own** `user_profiles` row under their session (RLS own-row), then delegates the decision to `evaluateAccess`. **Does not import or use the privileged service-role client.**
  - `index.ts` — public barrel (server-only-tainted; server code imports this; tests import `./policy`/`./types` directly).
  - Role source of truth: `public.user_profiles.role`; allowed admin roles `super_admin`, `client_admin` (D-30).
- **Bootstrap script (`scripts/seed-admin.ts`)** — operator-only first-`super_admin` linker:
  - Links an **existing** Supabase Auth user to a `user_profiles` row with `role = 'super_admin'`. **Does NOT create Auth users or passwords; no self-signup path** (D-40).
  - Inputs: `--user-id <uuid>` / `--full-name <name>` (CLI preferred), with optional `SEED_ADMIN_USER_ID` / `SEED_ADMIN_FULL_NAME` env fallback. These fallbacks are **operator/runtime-only and intentionally NOT added to `src/lib/validation/env.schema.ts`**. Validates UUID + non-empty name.
  - Verifies the Auth user exists via `supabase.auth.admin.getUserById(userId)` before any write.
  - **Idempotent** (already-`super_admin` → no-op success) and **fail-closed** (existing different role → refuses, exits non-zero; never auto-promotes/demotes).
  - Uses `getSupabaseServiceRole()` via a **dynamic import inside `main()`** + a direct-run guard, so unit tests can import the pure helpers without tripping the `server-only` guard or constructing the privileged client. main() runs only on direct invocation.

### Locked decisions applied (this task, user-approved)

1. `supabase/config.toml` **not modified** — local `enable_signup = true` is unchanged. The guard makes signup drift non-dangerous by rejecting any session without a valid admin `user_profiles` row. **Production hosted Supabase must set `enable_signup = false` (D-40)** — a deployment/config requirement documented here and in CURRENT_STATE/NEXT_STEPS.
2. `scripts/seed-admin.ts` is the approved bootstrap artifact (server-only/operator-only; links existing Auth user; no user/password creation).
3. **No dependencies added; `package-lock.json` unchanged.** No TS runner (`tsx`/`ts-node`) exists in the repo. **Runner decision deferred (see Carry-forward)** — no `package.json` run-script was added because executing the file needs a runner that resolves the `@/*` alias and the `server-only` guard.
4. `SEED_ADMIN_*` fallbacks are **not** in the app runtime env schema.
5. Optional audit-domain deny logging **deferred** — no `src/domain/audit/**` created (task spec marks it optional).

### Files

**New:** `src/services/auth/{types,policy,guard,index}.ts`, `scripts/seed-admin.ts`, `src/tests/unit/auth-policy.test.ts`, `src/tests/unit/seed-admin.test.ts`, `src/tests/security/auth-guard.test.ts`, `src/tests/integration/auth-guard.test.ts`, `src/tests/integration/seed-admin.test.ts`.
**Modified:** `knip.jsonc` (removed `src/lib/supabase/server.ts` entry — now statically imported by `guard.ts`; added `guard.ts`, `index.ts`, `scripts/seed-admin.ts` entries; `service-role.ts` + `client.ts` entries retained — service-role is only dynamically imported by the operator script), continuity docs.
**Untouched (verified):** `supabase/config.toml`, `supabase/migrations/**`, `package-lock.json`, `.env` / `.env.local`.

### Tests (how no-self-signup + auth-alone-insufficient are enforced)

- **Unit** (`src/tests/unit/`, no DB): `auth-policy.test.ts` — predicates + `evaluateAccess` for all negatives (401 no-session; 403 no-profile = auth alone insufficient; 403 insufficient-role) and positives (super_admin & client_admin pass `requireAdmin`; super_admin passes `requireSuperAdmin`; client_admin fails it). `seed-admin.test.ts` — `isValidUuid`, `parseSeedArgs` (CLI precedence over env, missing/invalid throws), `classifyProfileAction` (insert/noop/conflict = idempotent + fail-closed).
- **Security** (`src/tests/security/auth-guard.test.ts`, static): `guard.ts` first line is `import 'server-only'`; guard authorizes via `getUser()` and **not** `getSession()`; guard uses the anon server client and **never** `getSupabaseServiceRole`/the service-role module (request-path guard does not use service-role); **no signup/register route or component** under `src/app`/`src/components` and no `signUp()`/`createUser()` call; **service-role not imported by any `src/app`/`src/components` file**; dependency-cruiser still has `no-client-to-service-role`; seed script verifies via `getUserById` and never calls `createUser`/`signUp`.
- **Integration** (`src/tests/integration/`, gated `SUPABASE_LOCAL_TESTS=1`, no DB mocking): `auth-guard.test.ts` drives the guard's exact own-row profile read against the **real RLS substrate** via the AURA-103 psql role-sim harness (rolled-back txn) — super_admin/client_admin read their own role; the no-profile auth user reads nothing → guard 403; anon → 401. `seed-admin.test.ts` proves the upsert DB invariants (exactly one super_admin row; duplicate insert rejected by the PK — the invariant the script guards via `classifyProfileAction`).

### Verification (this branch)

- **Local stack (CLI 2.106.0):** `supabase start` ✓ → `supabase db reset` applies both migrations clean ✓ → `SUPABASE_LOCAL_TESTS=1 npm run test:security` **PASS (6 files, 53)** → `SUPABASE_LOCAL_TESTS=1 npm run test:integration` **PASS (3 files, 7)** → `supabase stop` ✓.
- **Full gates (CI mode):** `npm run quality` **PASS** (lint, typecheck, format:check, `npm run test` 13 files/65 + 68 gated-skips, unused, deps:check 0 violations, `next build` 4 routes). `npm run audit` **PASS** (exit 0; 2 moderate `postcss`-via-`next` carry-forward only).
- **Blocker greps clean:** no `clients`/`client_id`; no raw IP; no service-role in `src/app`/`src/components`; no `signUp()`/`createUser()` call; `package-lock.json` / `.env` / `config.toml` / migrations untouched.

### Carry-forward / open items

1. **Runner decision (action needed, separate):** `scripts/seed-admin.ts` is committed and type-checked but **not yet runnable** — executing it needs a TS runner that resolves the `@/*` path alias and the `server-only` guard (the only no-throw path is the `react-server` resolve condition). No runner is a repo dependency and none was added (locked decision #3). Options for a follow-up: approve `tsx` (devDependency) and add a `seed:admin` npm script, or run via `node` with a path-alias loader + `--conditions=react-server`. The script's pure logic and DB effect are already covered by unit + gated-integration tests.
2. **Production `enable_signup = false` (D-40):** hosted-Supabase deployment/config requirement (local `config.toml` stays `true`). The app-layer guard already rejects any non-admin session, so local signup drift is non-dangerous.
3. Live guard/seed integration tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI (same posture as AURA-102/103).
4. The first admin Route Handler / admin layout (**AURA-301**) will consume `requireAdmin`/`requireSuperAdmin`; remove the `guard.ts` / `index.ts` Knip entries then.

**Opus 4.8 review: APPROVE — merged.** (Historical: AURA-104 was the source of truth at `44a7fd4`.) Superseded by AURA-105 (`fae3d62`) and AURA-106 (`dd21edd`); current source of truth is `develop` at `dd21edd`. **AURA-107 is next — not started; requires its own per-task approval.**

---

## AURA-103 — MERGED (`1a35958`)

**AURA-103: RLS policies for all sensitive MVP tables (+ role-check helpers, least-privilege grants, RLS-layer tests).**

Merged via PR #15 (squash) into `develop` at `1a35958 feat: add RLS policies for MVP tables` (full SHA `1a35958ccf658b6918474b5b1d51b6c5de37be75`); `develop` is now the source of truth. Feature branch `feat/aura-103-rls-policies` deleted. Opus 4.8: **APPROVE**, merge recommendation **YES**, no blocking issues. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

New migration only (AURA-102 init migration untouched).

**Migration:** `supabase/migrations/20260617025449_rls_policies.sql` — adds the RLS policy matrix on top of the AURA-102 default-deny baseline. Documented rollback block in the header (drops policies + helper functions; **RLS stays ENABLED** — never disabled).

**Helper functions (3):**
- `public.current_user_role()` → `public.user_role` — `SECURITY DEFINER`, `STABLE`, `SET search_path = ''`, fully-qualified, reads `public.user_profiles` via `(select auth.uid())`. SECURITY DEFINER is what bypasses RLS on the profile lookup and **prevents recursive RLS**.
- `public.is_admin()` → boolean — `coalesce(role in ('super_admin','client_admin'), false)`; SECURITY INVOKER, STABLE, `search_path=''`.
- `public.is_super_admin()` → boolean — `coalesce(role = 'super_admin', false)`; SECURITY INVOKER, STABLE, `search_path=''`.
- Execution: `REVOKE ALL ... FROM PUBLIC` then `GRANT EXECUTE ... TO authenticated` (anon gets none — no anon policy references them).

**Policies (36 total):** properties 4 · areas 4 · legal_pages 4 · property_media 5 · property_stakeholders 4 · leads 4 · whatsapp_clicks 2 · settings 3 · user_profiles 5 · audit_logs 1. (rate_limits: 0 — service-role only.)
- **Public reads (anon):** published properties, active areas, published legal pages, media of published properties.
- **Public inserts (anon):** leads (`WITH CHECK (true)`), whatsapp_clicks (`WITH CHECK (true)`). No anon SELECT/UPDATE/DELETE on either.
- **Admin (authenticated, `is_admin()`):** properties/areas/legal_pages SELECT/INSERT/UPDATE; property_media + property_stakeholders full CRUD; leads SELECT/INSERT/UPDATE; whatsapp_clicks SELECT; settings SELECT/INSERT/UPDATE.
- **user_profiles:** own-row SELECT (`id = (select auth.uid())`) for any authenticated user; super_admin SELECT/INSERT/UPDATE/DELETE all (`is_super_admin()`). client_admin = own-row only (no user management).
- **audit_logs:** super_admin SELECT only; no INSERT/UPDATE/DELETE policy (writes are service-role only).

**Locked decisions enforced:**
- `property_stakeholders` — **NO anon/public policy** (direct anon access default-deny; column-safe public projection deferred to AURA-203). Verified even with a `visibility='public'` seed row present.
- `properties` — **NO DELETE policy** (hard delete default-deny for anon AND authenticated; service-role-only, outside MVP UI). Same posture applied to leads (no DELETE policy).

**GRANTs (important deviation/finding — flag for Opus):** the AURA-102 baseline grants anon/authenticated/service_role only `Dxt` (TRUNCATE/REFERENCES/TRIGGER) and **NO DML** — so explicit grants are *required* for the policies (and the server-side service role) to function at all. The migration `REVOKE ALL ON TABLE ... FROM anon, authenticated` on all 11 tables (also removing the stray anon/authenticated **TRUNCATE** footgun), then grants least-privilege:
- anon: SELECT on properties/areas/legal_pages/property_media; INSERT on leads/whatsapp_clicks. Nothing else.
- authenticated: per-table DML matching the policies (no DELETE on properties/leads; nothing on rate_limits).
- service_role: SELECT/INSERT/UPDATE/DELETE on all 11 tables — it is the trusted BYPASSRLS server role that performs the "service-role only" operations the matrix relies on (audit_logs writes, rate_limits, any rare hard delete). Without this grant those documented behaviours would be impossible.
- **rate_limits:** NO anon/authenticated grants and NO policies (service-role only). Cleanup/pg_cron is AURA-106.

**Tests:**
- `src/tests/security/rls-test-utils.ts` — shared psql role-simulation harness (not a test file): seeds fixtures + `set local role` + `request.jwt.claims` inside a rolled-back transaction (no committed seed files). `-q` strips command tags so only the measured query output is captured.
- `src/tests/security/rls-policies.test.ts` — RLS-layer **negatives** + policy-catalog assertions (counts per table, rate_limits 0, properties no DELETE, stakeholders no anon, current_user_role SECURITY DEFINER, rate_limits no anon/authenticated grants).
- `src/tests/dal/rls-policies.test.ts` — RLS-layer **positives** (anon allowlist reads/inserts; super_admin all-status + user management + audit; client_admin manages business tables but cannot manage users or read audit logs).
- `src/tests/security/schema-rls.test.ts` — updated: replaced the AURA-102 "0 policies" live assertion with "policies now exist (authored in AURA-103) + rate_limits stays policy-free"; clarified the static init-file guard.
- Application-layer authenticated negatives (session-but-no-profile; profile-but-no-role → 401/403) are intentionally **deferred to AURA-104** and not asserted here.

**Generated types:** `npm run db:types` produced a **small expected diff** in `src/types/database.ts` — the 3 new helper functions now appear under `Functions` (`current_user_role`/`is_admin`/`is_super_admin`). This is correct (the AURA-103 task spec required these helpers); the "byte-identical" expectation in the task brief assumed policies-only, but helper functions necessarily surface in generated types. No table/enum type changes.

**Local verification (CLI 2.106.0):** `supabase db reset` applies both migrations clean from scratch; `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (4 files, 41); `SUPABASE_LOCAL_TESTS=1 npm run test:security` PASS (5 files, 43); `npm run quality` PASS (exit 0); `npm run audit` PASS (2 moderate postcss carry-forward). Blocker greps clean (no `clients`/`client_id`, no raw IP, no rate_limits policy, no anon stakeholder policy, no properties DELETE policy).

**Scope honoured:** no auth flow, no seed users/seed data, no UI, no API routes, no storage policies, no rate-limit cleanup/pg_cron, no AURA-104 work, no `.env`/secrets, no dependency/lockfile change.

**Opus 4.8 review (PR #15): APPROVE — merge recommendation YES, no blocking issues.**

**Carry-forward:** (1) live RLS tests are **local-only** (`SUPABASE_LOCAL_TESTS=1`) until **AURA-107** wires the Dockerized Supabase stack into CI; (2) for **AURA-104**, anon has INSERT but no SELECT on `leads` / `whatsapp_clicks`, so the route layer must use **minimal-return behavior** for those anon inserts; (3) AURA-104 must complete the application-layer authenticated negatives deferred here (session-but-no-profile → blocked; profile-but-no-qualifying-role → 403; valid `super_admin`/`client_admin` → allowed).

---

## AURA-102 — MERGED (`3657e4f`)

**AURA-102: Initial migration — core MVP tables (+ generated types, schema/security tests)**

Merged via PR #13 (squash) into `develop` at `3657e4f feat: add initial MVP database migration` (full SHA `3657e4fd1d2686bab6d6dcf95261a2f184ac9787`). Feature branch deleted. Opus 4.8: **APPROVE**, merge recommendation **YES**, no blocking issues; post-review `db:types` reproducibility / failure-safety fixes completed before merge. Required checks passed before merge: `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`.

Summary: 11 MVP tables; 17 native PostgreSQL enums; generated `src/types/database.ts`; failure-safe `db:types` script; RLS enabled on all 11 tables; **0 RLS policies**; no seed data; no auth; no API routes; no UI.

Files created:

- `supabase/migrations/20260616183318_init.sql` — single initial migration. Creates: 17 native PostgreSQL enum types; the shared `set_updated_at()` trigger function; all 11 MVP tables (`user_profiles`, `areas`, `properties`, `property_media`, `property_stakeholders`, `leads`, `whatsapp_clicks`, `settings`, `legal_pages`, `audit_logs`, `rate_limits`); the generated `properties.title_en` STORED column; the indexing/uniqueness contract (slug/reference_number/areas.slug UNIQUE, partial-unique published-legal-slug, 2 composite property indexes, 5 FK indexes, GIN full-text index); 7 `updated_at` triggers; and `ENABLE ROW LEVEL SECURITY` on all 11 tables. **No RLS policies** (AURA-103), **no seed data**, **no rate_limits cleanup/pg_cron** (AURA-106). Rollback path documented in the file header.
- `src/types/database.ts` — generated by `npm run db:types`. Generated artifact (ignored by Knip/Prettier/ESLint; never hand-edited).
- `src/tests/dal/schema.test.ts` — static migration assertions (CI-safe) + gated `psql` catalog introspection (`SUPABASE_LOCAL_TESTS=1`): tables, enums + values, JSONB columns, generated column, unique constraints, all 9 indexes, partial-unique + GIN method, and D-05 / D-18 / D-51 negative scans.
- `src/tests/security/schema-rls.test.ts` — static + gated: RLS enabled on all 11 tables, **0 policies**, no `clients`/`client_id`, no raw-IP in sensitive tables.

Files modified:

- `package.json` — added failure-safe `db:types` script: `SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-dummy} supabase gen types --local --lang=typescript > /tmp/aura-database-types.ts && mv /tmp/aura-database-types.ts src/types/database.ts`. Generation writes to a temp file and only `mv`s it into place on success, so a failed run never truncates the tracked `src/types/database.ts`. **No dependency / `package-lock.json` change.**
- `knip.jsonc` — added `ignore: ["src/types/database.ts"]` and `ignoreBinaries: ["supabase"]`.
- `.prettierignore`, `eslint.config.mjs` — exclude the generated types file.

Files removed:

- `src/types/.gitkeep` — superseded by `database.ts`.

Locked decisions applied (user-approved for this task):

1. Native PostgreSQL enums for **all** controlled columns (17 enum types — the 9 named in the task plus 8 implied by the data model).
2. `db:types` package script (no lockfile change).
3. CLI-timestamped migration filename via `supabase migration new init`.
4. `rate_limits` table + `expires_at` only — cleanup/pg_cron deferred to AURA-106.
5. Shared `set_updated_at()` trigger function + `updated_at` triggers on the 7 tables whose data-model row marks `updated_at` "Auto".

Implementation notes / deviations:

- **Enum count:** 17 (task listed 17 explicitly; all created). `user_role` references `auth.users(id)` via `user_profiles.id` (standard Supabase pattern).
- **NOT NULL posture:** always-required fields are `NOT NULL`; publish-time requirements (e.g. cover image, `en` title key) are app-layer validations, not DB constraints, per the data model.
- **`legal_pages.content` is JSONB** (structured Markdown / controlled rich text) — there is no raw-HTML column/affordance (D-12).
- **GIN index** built on `to_tsvector('english', coalesce(title_en, ''))` over the generated `title_en` column.
- **`supabase gen types --local` quirk (CLI 2.106.0):** requires `SUPABASE_ACCESS_TOKEN` to be set (any value) to pass a platform-auth pre-check before falling through to the local postgres-meta container. The `db:types` script bakes in `SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-dummy}` to satisfy this, and writes to `/tmp/aura-database-types.ts` then `mv`s it into place so a failed generation never truncates the tracked file. Regeneration still requires a running local stack.
- Schema tests use `psql` (Homebrew, on PATH) for catalog introspection — no new npm dependency. They are gated by `SUPABASE_LOCAL_TESTS=1`; CI (no local stack) runs the static layer only until the Dockerized stack lands in AURA-107.

**No `.env`/secrets. No seed users/data. No auth flow. No RLS policies. No API routes. No UI. No AURA-103/104 work.**

---

## Previous Session (AURA-101 — merged)

**AURA-101: Supabase local stack + client/server/service-role helpers (server-only)**

Files created:

- `supabase/config.toml` — Minimal Supabase CLI local stack config. `project_id = "aura"`. Standard port layout (API 54321, DB 54322, Studio 54323). Auth enabled, anonymous sign-ins disabled. Analytics disabled. No migrations, no seed data, no secrets. Compatible with current Supabase CLI.
- `src/lib/supabase/client.ts` — Browser anon helper. `createBrowserClient` from `@supabase/ssr`. Uses `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`. No `server-only` import. Safe for Client Components.
- `src/lib/supabase/server.ts` — Async server anon helper. `createServerClient` from `@supabase/ssr`. Imports `getServerEnv()` from `@/lib/config/env` (calls it for fail-fast validation; establishes real import path for env.ts). `cookies()` from `next/headers` awaited (Next.js 15 async cookies). Cookie `setAll` typed with `CookieOptions` from `@supabase/ssr`. Request-scoped; no global memoization.
- `src/lib/supabase/service-role.ts` — Service-role server-only helper. First line: `import 'server-only'`. `createClient` from `@supabase/supabase-js`. `SUPABASE_SERVICE_ROLE_KEY` obtained from `getServerEnv()`, never exported. Memoized singleton (singleton is safe: no request-scoped cookies). `auth.autoRefreshToken: false, persistSession: false`.
- `src/tests/security/supabase-boundaries.test.ts` — 4 security tests: (1) service-role.ts first line is exactly `import 'server-only'`; (2) dep-cruiser config has `no-client-to-service-role` rule; (3) rule `from.path` covers `src/components`; (4) rule `to.path` is `^src/lib/supabase/service-role`.
- `src/tests/dal/supabase-smoke.test.ts` — 4 DAL tests (1 skipped in CI): importability smoke for `createBrowserClient`, `createServerClient`, `createClient`; local-stack network test gated by `SUPABASE_LOCAL_TESTS=1`. CI Dockerized stack deferred to AURA-107.

Files modified:

- `knip.jsonc` — Removed `@supabase/ssr` and `@supabase/supabase-js` from `ignoreDependencies` (now genuinely imported). Removed `entry: ["src/lib/config/env.ts"]` (env.ts now has real importers via server.ts and service-role.ts). Added `entry: ["src/lib/supabase/client.ts", "src/lib/supabase/server.ts", "src/lib/supabase/service-role.ts"]` — library modules pending first DAL caller (AURA-102+).
- `CURRENT_STATE.md`, `SESSION_HANDOFF.md` (this file), `NEXT_STEPS.md` — updated to AURA-101 state.

Boundary proof:

- Created temp fixture `src/components/ui/___boundary_probe_delete_me.ts` importing `@/lib/supabase/service-role`.
- `npm run deps:check` failed with 2 errors: `no-ui-to-supabase` + `no-client-to-service-role`.
- Removed fixture. `npm run deps:check` passes clean (0 violations, 21 modules).
- Fixture never committed.

Local Supabase CLI verification:

Supabase CLI 2.106.0 (Homebrew) + Docker 29.5.3: `supabase start` PASS → `supabase status` PASS → `SUPABASE_LOCAL_TESTS=1 npm run test:dal` PASS (5/5) → `supabase stop` PASS. `.gitignore` excludes `supabase/.branches/` and `supabase/.temp/`; runtime artifacts confirmed untracked.

**No dependencies installed. No `package.json` / `package-lock.json` change. No `.env` / `.env.local`. No secrets. No migrations. No auth implementation. No API routes. No AURA-102 work.**

---

## Decisions Applied (this session, user-approved via task spec)

- **`getServerEnv()` called in server.ts factory** — validates server env is complete on every server client creation; memoized so free after first call. Establishes real import path for env.ts (removes Knip entry). ESLint `no-unused-vars` satisfied by the call.
- **`CookieOptions` type import** — explicit type annotation on `setAll` parameter required because TypeScript strict mode + `@supabase/ssr` v0.5.0 doesn't infer it from context.
- **service-role singleton** — safe because the service-role client is not request-scoped (no cookies). Server anon client is NOT memoized (cookies are request-scoped).
- **Knip entries for supabase helpers** — same pattern as `env.ts` in AURA-005: library modules with no application callers yet. Remove in AURA-102+ as DAL functions are added.

---

## Gate Results (AURA-101)

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run test` | PASS — 8 files, 21 tests + 1 skipped |
| `npm run test:unit` | PASS — 8 tests |
| `npm run test:dal` | PASS — 4 tests + 1 skipped (SUPABASE_LOCAL_TESTS=1 gate) |
| `npm run test:security` | PASS — 8 tests |
| `npm run deps:check` | PASS — 0 violations (21 modules) |
| `npm run unused` | PASS |
| `npm run build` | PASS — 4 routes; middleware 44.1 kB |
| `npm run quality` | PASS — composite exit 0 |
| `npm run audit` | PASS — exit 0; 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |

---

## Previous Session (AURA-008 — merged)

**AURA-008: First vertical slice — `/` → `/en` redirect, `/en` homepage shell, Playwright smoke**

Files created:

- `src/middleware.ts` — Explicit HTTP 301 redirect from `/` → `/en` via `NextResponse.redirect(new URL('/en', request.url), 301)`. Delegates all other paths to `next-intl` locale middleware (`createMiddleware(routing)`). Matcher excludes `api`, `_next`, `_vercel`, and static asset paths. `NextRequest` is a type-only import to satisfy `@typescript-eslint/consistent-type-imports`.
- `src/lib/i18n/routing.ts` — next-intl routing config; `defineRouting({ locales: ['en'], defaultLocale: 'en' })`. Wires `next-intl` so it can be removed from Knip allowlist.
- `src/app/[locale]/layout.tsx` — Minimal nested locale layout. Does NOT render `<html>`/`<body>` (root layout owns those). RTL-aware lang/dir attributes deferred to AURA-201.
- `src/app/[locale]/page.tsx` — Minimal luxury-dark homepage shell. Uses all AURA design token Tailwind classes. No data fetching, Supabase, auth, GSAP, CRM, or lead capture.

Files modified:

- `src/app/page.tsx` — Replaced placeholder with defensive `permanentRedirect('/en')` fallback (308). Fires only if a request bypasses the middleware; middleware handles the canonical 301.
- `src/tests/e2e/smoke.spec.ts` — Removed `test.describe.skip`. Added 301 status + `location` header assertions using `request.get('/', { maxRedirects: 0 })`. Added `/en` loads without error test.
- `.github/workflows/ci.yml` — Replaced commented e2e stub with active `e2e` job: checkout → Node 20 → pin npm@11.12.1 → `npm ci` → `npx playwright install --with-deps chromium` → `npm run build` → `npm run start &` → curl wait loop (30×2s) → `npm run test:smoke -- --project=chromium` (`--project=chromium` ensures WebKit is not required in CI).
- `knip.jsonc` — Removed `"next-intl"` from `ignoreDependencies` (now genuinely imported).

Continuity files updated:

- `CURRENT_STATE.md`, `SESSION_HANDOFF.md` (this file), `NEXT_STEPS.md` — updated to AURA-008 state.

**No dependencies installed. No `package.json` / `package-lock.json` change. No `.env` / `.env.local`. No secrets. No Supabase, migrations, auth, admin, CRM, GSAP, deployment config, or AURA-009 work.**

---

## Decisions Applied (this session, user-approved)

- **Explicit 301 via `NextResponse.redirect(..., 301)`** — required by user. `permanentRedirect` (which emits 308) retained as defensive fallback only. `next-intl` middleware-only setup; no `createNextIntlPlugin` needed (no translations used in AURA-008).
- **Chromium-only in CI e2e job** — `npx playwright install --with-deps chromium` + `--project=chromium` flag on smoke step. Local smoke still runs all projects (Chromium + Mobile Safari). CI avoids WebKit download failure.
- **No `createNextIntlPlugin` in `next.config.js`** — middleware-only wiring is sufficient for AURA-008; plugin not needed until message translations are used (Phase 2+).
- **Root layout retains static `lang="en"`** — locale-aware `lang`/`dir` attributes on `<html>` deferred to AURA-201 (RTL support). Correct and safe for Phase 0.
- **`[locale]/layout.tsx` does not wrap `<html>`/`<body>`** — Next.js App Router requires those in the outermost layout only.

---

## Gate Results

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run test` | PASS — 6 files, 14 tests |
| `npm run test:unit` | PASS |
| `npm run test:dal` | PASS |
| `npm run test:integration` | PASS |
| `npm run test:security` | PASS |
| `npm run deps:check` | PASS — 0 violations (15 modules) |
| `npm run unused` | PASS |
| `npm run build` | PASS — 4 routes; middleware 44.1 kB |
| `npm run test:smoke` | PASS — 4/4 (Chromium + Mobile Safari) |
| `npm run test:smoke -- --project=chromium` | PASS — 2/2 |
| `npm run quality` | PASS — composite exit 0 |
| `npm run audit` | PASS — exit 0; 0 HIGH, 0 CRITICAL; 2 moderate postcss carry-forward |

### GitHub CI (PR #9)

| Check | Result |
|---|---|
| `quality` | PASS |
| `e2e` | PASS |
| `analyze (javascript-typescript)` | PASS |
| `CodeQL` | PASS |

### Branch Protection (`develop`)

Required checks now enforced:

```
quality
e2e
analyze (javascript-typescript)
CodeQL
```

GitHub required approvals are disabled for solo-operator mode; status checks remain enforced.

---

## Open Issues (Carry-Forward)

1. **`postcss` moderate** — documented exception via `next@15` internal postcss; passes `--audit-level=high`. Not actionable.
2. **Playwright Node.js deprecation warning** — Playwright internal; not a gate failure.
3. **Knip entries for Supabase helpers** — `client.ts`, `server.ts`, `service-role.ts` declared as Knip entries. Remove each as the first DAL caller is added (AURA-102+).
4. **Remaining Knip allowlist entries** — `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `resend`, forms/query/motion packages remain. Remove per phase schedule.
5. **Opus 4.8 non-blocking note** — `config.toml` local `enable_signup = true` (Supabase default; harmless locally; production must set `false` for D-40 in AURA-104).

---

## Validation Status

**AURA-202 is merged. Phase 2 is in progress (2/7).** Squash-merged PR #27 (`feature/aura-202-properties-listing-api` → `develop`) at `1d4c514` (merged 2026-06-22T12:54:55Z). Feature branch deleted. `develop` is the source of truth — clean and synced with `origin/develop`. GitHub required checks (`quality`, `e2e`, `db-tests`, `analyze (javascript-typescript)`, `CodeQL`) all PASSED before merge. Targeted Opus 4.8 review: **APPROVE**, merge recommendation **YES**, no blocking issues.

**AURA-201 remains merged at `f17b429`** (PR #25; Phase 2 task 1/7). `develop` is the source of truth — clean and synced with `origin/develop`.

**AURA-107 remains merged at `04d3522`; Phase 1 is complete.** AURA-106 at `dd21edd`; AURA-105 at `fae3d62`; AURA-104 at `44a7fd4`; AURA-103 at `1a35958`; AURA-102 at `3657e4f`; AURA-101 at `95f9df3`.

`develop` branch protection active (verified via API 2026-06-20): `quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, `db-tests` all required. **The AURA-107 Phase 1 exit gate is now fully enforced by branch protection.** GitHub required approvals disabled for solo-operator mode.

---

## Next Safe Action

**AURA-202 is merged** into `develop` at `1d4c514` (PR #27; targeted Opus 4.8 review **APPROVE**, no blocking issues; feature branch deleted). **Phase 2 is in progress (2 of 7 tasks done).** `develop` is the current source of truth. **AURA-107 remains merged at `04d3522`; Phase 1 is complete.**

**Branch protection (unchanged by AURA-202):** `db-tests` remains required on `develop` (`quality`, `e2e`, `analyze (javascript-typescript)`, `CodeQL`, `db-tests`). **Next task: AURA-203 (Property detail + stakeholder visibility)** — the third Phase 2 task; **not started**; **read-only discovery only**, requires a new session + explicit per-task discovery/planning approval before any work begins. Do not start AURA-203 implementation in this docs-sync session; do not create the AURA-203 branch until discovery is complete and the owner approves. AURA-203 likely requires Opus 4.8 review (public property-detail data boundary + stakeholder visibility).
