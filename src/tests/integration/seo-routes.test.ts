import { describe, expect, test } from 'vitest'

import { featureFlags } from '@/config/feature-flags'
import robots from '@/app/robots'
import sitemap, { PUBLIC_SITEMAP_PATHS } from '@/app/sitemap'

/**
 * AURA-206 — integration tests for the `/robots.txt` and `/sitemap.xml` route handlers.
 *
 * These routes are pure (config-driven, no DAL/DB), so we invoke them directly and assert the
 * output is valid and coherent with the D-42 noindex strategy.
 */

describe('robots route', () => {
  const result = robots()

  test('targets all crawlers', () => {
    expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
  })

  test('does NOT set `Disallow: /` so crawlers can fetch pages and see per-page noindex (D-42)', () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    for (const rule of rules) {
      const disallow = rule.disallow
      const values = disallow === undefined ? [] : Array.isArray(disallow) ? disallow : [disallow]
      expect(values).not.toContain('/')
    }
  })

  test('advertises the sitemap at the demo-safe base URL', () => {
    expect(result.sitemap).toBe(`${featureFlags.publicSiteUrl}/sitemap.xml`)
  })
})

describe('sitemap route', () => {
  const entries = sitemap()
  const urls = entries.map((e) => e.url)
  const base = featureFlags.publicSiteUrl

  test('emits valid entries with absolute URLs on the configured demo-safe host', () => {
    expect(entries.length).toBe(PUBLIC_SITEMAP_PATHS.length)
    for (const entry of entries) {
      expect(typeof entry.url).toBe('string')
      expect(entry.url.startsWith(`${base}/`)).toBe(true)
    }
  })

  test('includes exactly the existing static public routes', () => {
    expect(urls.sort()).toEqual(
      [
        `${base}/en`,
        `${base}/en/properties`,
        `${base}/en/areas`,
        `${base}/en/privacy`,
        `${base}/en/terms`,
      ].sort()
    )
  })

  test('excludes /en/about (AURA-207) and any dynamic property detail URLs', () => {
    expect(urls.some((u) => u.includes('/about'))).toBe(false)
    // Only the listing root `/en/properties` is allowed — never `/en/properties/<slug>`.
    expect(urls.some((u) => /\/en\/properties\/.+/.test(u))).toBe(false)
  })
})
