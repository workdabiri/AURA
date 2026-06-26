import type { Metadata } from 'next'

import { buildPublicMetadata, type PublicPageSeo } from './metadata'

/**
 * Per-route SEO copy for the public pages (AURA-206).
 *
 * Generic, static English copy for the single `en` locale — deliberately NOT data-driven:
 * metadata must never query the DAL/database (D-42 / AURA-206 owner decision). Property
 * detail copy is intentionally generic (no per-property DAL read). Each entry feeds the
 * default-`noindex` `buildPublicMetadata` helper.
 */
export const publicRouteSeo = {
  home: {
    title: 'AUTEX Estates Dubai — Luxury Real Estate',
    description: 'Exclusive Dubai luxury real estate. Exceptional properties, exceptional service.',
  },
  properties: {
    title: 'Properties | AUTEX Estates Dubai',
    description: 'Browse our curated collection of luxury properties across Dubai.',
  },
  propertyDetail: {
    title: 'Property | AUTEX Estates Dubai',
    description: 'Discover the details of this luxury Dubai property.',
  },
  areas: {
    title: 'Areas | AUTEX Estates Dubai',
    description: 'Explore the prime Dubai neighbourhoods where we list luxury properties.',
  },
  about: {
    title: 'About | AUTEX Estates Dubai',
    description:
      'About AUTEX Estates Dubai — a premium Dubai real estate advisory demo built to showcase the AURA website engine.',
  },
  privacy: {
    title: 'Privacy Policy | AUTEX Estates Dubai',
    description: 'How AUTEX Estates Dubai handles and protects your personal information.',
  },
  terms: {
    title: 'Terms of Service | AUTEX Estates Dubai',
    description: 'The terms that govern your use of the AUTEX Estates Dubai website.',
  },
} as const satisfies Record<string, PublicPageSeo>

export type PublicRouteKey = keyof typeof publicRouteSeo

/**
 * Resolve the full `Metadata` (title + description + default-`noindex` robots) for a
 * public route key. Consumed by the public route `metadata` / `generateMetadata` exports.
 */
export function publicRouteMetadata(key: PublicRouteKey): Metadata {
  return buildPublicMetadata(publicRouteSeo[key])
}
