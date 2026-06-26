import type { MetadataRoute } from 'next'

import { featureFlags } from '@/config/feature-flags'

/**
 * `/sitemap.xml` route (AURA-206).
 *
 * Lists ONLY the existing static public routes (AURA-206 owner decision). Deliberately
 * excludes `/en/about` (owned by AURA-207, does not exist yet) and any dynamic property
 * detail URLs (no DAL/database read from metadata — D-42). The base URL is the
 * source-controlled demo-safe `publicSiteUrl`; no env or deployment config is required.
 */
export const dynamic = 'force-static'

/** Existing static public routes included in the sitemap. */
export const PUBLIC_SITEMAP_PATHS = [
  '/en',
  '/en/properties',
  '/en/areas',
  '/en/privacy',
  '/en/terms',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const base = featureFlags.publicSiteUrl
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${base}${path}`,
  }))
}
