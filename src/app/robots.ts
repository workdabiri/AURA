import type { MetadataRoute } from 'next'

import { featureFlags } from '@/config/feature-flags'

/**
 * `/robots.txt` route (AURA-206).
 *
 * D-42 strategy: the AUTEX demo is kept out of search indexes via PER-PAGE `noindex`
 * metadata, NOT via a blanket `Disallow: /`. We deliberately ALLOW crawling here — a full
 * disallow would stop crawlers before they ever fetch a page and read its `noindex`
 * directive, which is the opposite of what we want. The sitemap is advertised for
 * completeness; it lists only existing static public routes.
 *
 * Static output, no env or deployment config: the base URL comes from the source-controlled
 * demo-safe `publicSiteUrl` flag.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${featureFlags.publicSiteUrl}/sitemap.xml`,
  }
}
