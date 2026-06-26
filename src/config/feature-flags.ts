/**
 * Source-controlled feature flags (AURA-206).
 *
 * These are deliberately compile-time constants checked into source — NOT read from
 * environment variables or deployment config. The flagship AUTEX demo deployment must
 * be `noindex` by default (D-42): with `publicIndexingEnabled === false`, every public
 * route emits `noindex` metadata and the sitemap/robots output advertises only a
 * demo-safe reserved host. Enabling real-client indexing is out of AURA-206 scope and
 * requires a deliberate, reviewed source change plus owner approval — never an env flip
 * and never the admin UI.
 */
export const featureFlags = {
  /**
   * When `false` (the default, per D-42), public pages emit `noindex` so the AUTEX demo
   * is never indexed. A real client enables indexing by flipping this to `true` in a
   * reviewed source change — out of scope for AURA-206.
   */
  publicIndexingEnabled: false,
  /**
   * Demo-safe absolute base URL used for `sitemap.xml` / `robots.txt` output. It uses a
   * reserved `.example` domain so no real host is referenced and no deployment/env config
   * is required for the build. A real deployment overrides this in a future approved change.
   */
  publicSiteUrl: 'https://autex.example',
} as const
