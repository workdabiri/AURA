import { describe, expect, test } from 'vitest'

import { featureFlags } from '@/config/feature-flags'
import { buildPublicMetadata, publicRobots, robotsDirective } from '@/lib/seo/metadata'
import { publicRouteMetadata, publicRouteSeo, type PublicRouteKey } from '@/lib/seo/routes'

/**
 * AURA-206 — unit tests for the SEO/noindex helpers (pure, no DB, no IO).
 *
 * Default behaviour MUST be `noindex` (D-42); indexable metadata is only ever produced when
 * source config is explicitly set.
 */

describe('feature flags', () => {
  test('publicIndexingEnabled defaults to false (D-42)', () => {
    expect(featureFlags.publicIndexingEnabled).toBe(false)
  })

  test('publicSiteUrl is a demo-safe reserved .example host', () => {
    expect(featureFlags.publicSiteUrl).toBe('https://autex.example')
    expect(featureFlags.publicSiteUrl).toMatch(/\.example$/)
  })
})

describe('robotsDirective', () => {
  test('returns noindex, nofollow when indexing is disabled', () => {
    expect(robotsDirective(false)).toEqual({ index: false, follow: false })
  })

  test('represents an indexable state only when explicitly enabled', () => {
    expect(robotsDirective(true)).toEqual({ index: true, follow: true })
  })
})

describe('publicRobots', () => {
  test('is noindex by default (mirrors the disabled feature flag)', () => {
    expect(publicRobots()).toEqual({ index: false, follow: false })
  })
})

describe('buildPublicMetadata', () => {
  test('carries title, description, and the default-noindex robots directive', () => {
    const meta = buildPublicMetadata({ title: 'T', description: 'D' })
    expect(meta).toEqual({
      title: 'T',
      description: 'D',
      robots: { index: false, follow: false },
    })
  })
})

describe('publicRouteMetadata', () => {
  const keys = Object.keys(publicRouteSeo) as PublicRouteKey[]

  test.each(keys)('route "%s" returns its title/description and noindex robots', (key) => {
    const meta = publicRouteMetadata(key)
    expect(meta.title).toBe(publicRouteSeo[key].title)
    expect(meta.description).toBe(publicRouteSeo[key].description)
    expect(meta.robots).toEqual({ index: false, follow: false })
  })

  test('covers the public routes in scope (home, properties, propertyDetail, areas, about, privacy, terms)', () => {
    expect(keys.sort()).toEqual(
      ['about', 'areas', 'home', 'privacy', 'properties', 'propertyDetail', 'terms'].sort()
    )
  })

  test('the about route (AURA-207) returns its title/description and default-noindex robots', () => {
    const meta = publicRouteMetadata('about')
    expect(meta.title).toBe(publicRouteSeo.about.title)
    expect(meta.description).toBe(publicRouteSeo.about.description)
    expect(meta.robots).toEqual({ index: false, follow: false })
  })
})
