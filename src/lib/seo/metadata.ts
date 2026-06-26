import type { Metadata } from 'next'

import { featureFlags } from '@/config/feature-flags'

/**
 * SEO metadata helpers (AURA-206).
 *
 * Pure TypeScript — no React, no Supabase, no DAL, no IO. These helpers build Next.js
 * `Metadata` objects (title / description / robots) for the public routes. The robots
 * directive FAILS CLOSED to `noindex` (D-42): indexing is only ever emitted when the
 * source-controlled `publicIndexingEnabled` flag is explicitly `true`. AURA-206 scope is
 * title + description + robots only — no canonical URLs, no OpenGraph, no Twitter cards.
 */

type Robots = NonNullable<Metadata['robots']>

/**
 * Pure robots directive for a given indexing state. `noindex, nofollow` when indexing is
 * disabled, `index, follow` when explicitly enabled. Kept as a standalone pure function so
 * both branches are trivially unit-testable without touching global config.
 */
export function robotsDirective(indexingEnabled: boolean): Robots {
  return indexingEnabled ? { index: true, follow: true } : { index: false, follow: false }
}

/**
 * Robots directive for public routes, derived from the source-controlled feature flag.
 * Defaults to `noindex` because `featureFlags.publicIndexingEnabled` defaults to `false`.
 */
export function publicRobots(): Robots {
  return robotsDirective(featureFlags.publicIndexingEnabled)
}

export interface PublicPageSeo {
  title: string
  description: string
}

/**
 * Build a public route's `Metadata`: route-appropriate title + description, plus the
 * default-`noindex` robots directive. Used by the public page metadata exports.
 */
export function buildPublicMetadata({ title, description }: PublicPageSeo): Metadata {
  return {
    title,
    description,
    robots: publicRobots(),
  }
}
