import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { asRole, isPermissionDenied, LOCAL_TESTS } from './rls-test-utils'

/**
 * AURA-202 — public properties read-boundary security tests.
 *
 * Two layers:
 *   1. LIVE DB (gated by SUPABASE_LOCAL_TESTS=1, via the shared rls-test-utils anon harness):
 *      anon can never read draft/archived properties (featured or not), can never read
 *      property_stakeholders at all, and can never read media of an unpublished property.
 *   2. STATIC CODE (always runs): the AURA-202 production listing/API/card/DAL code never
 *      selects `*`, never references sensitive columns, never queries property_stakeholders,
 *      never uses the service role, and the UI never imports Supabase/DAL/services.
 *
 * The public data-exposure boundary is the reason AURA-202 requires an Opus 4.8 review.
 */

// --- Layer 1: live DB anon boundary ---------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-202 anon read boundary (live DB)', () => {
  test('anon cannot read draft or archived properties (incl. featured ones)', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.properties where publish_status in ('draft','archived');`,
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })

  test('anon listing returns only published rows', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.properties;`,
    })
    // The shared seed has exactly one published property (seed-pub).
    expect(r.out).toBe('1')
  })

  test('anon cannot SELECT property_stakeholders at all (no anon grant/policy)', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.property_stakeholders;`,
    })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon cannot read media belonging to a draft property', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.property_media pm
              join public.properties p on p.id = pm.property_id
              where p.slug = 'seed-draft';`,
    })
    // RLS hides the draft property AND its media → the join yields nothing.
    expect(r.out).toBe('0')
  })

  test('anon media is scoped to the published parent only', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.property_media;`,
    })
    // Seed inserts media for seed-pub (published) + seed-draft (draft); anon sees only the former.
    expect(r.out).toBe('1')
  })
})

// --- Layer 2: static code guarantees (no DB) ------------------------------------

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8')
}

/** Strip block + line comments so assertions target executable code only, not prose. */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

const SENSITIVE_TOKENS = [
  'property_stakeholders',
  'agent_phone',
  'agent_whatsapp',
  'agent_email',
  'internal_notes',
  'storage_path',
  'created_by',
  'updated_by',
  'views_count',
  'address',
  'external_map_url',
]

const PRODUCTION_DATA_FILES = [
  'src/dal/properties.dal.ts',
  'src/app/api/properties/route.ts',
  'src/app/api/properties/featured/route.ts',
  'src/domain/properties/card.ts',
  'src/domain/properties/query.ts',
  'src/domain/properties/format.ts',
]

describe('AURA-202 production code never references sensitive columns', () => {
  test.each(PRODUCTION_DATA_FILES)('%s code has no sensitive column token', (file) => {
    const code = codeOnly(readSrc(file))
    for (const token of SENSITIVE_TOKENS) {
      expect(code, `${file} must not reference ${token} in code`).not.toContain(token)
    }
  })

  test.each(PRODUCTION_DATA_FILES)('%s never uses select("*")', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code).not.toMatch(/select\(\s*['"`]\*['"`]/)
  })
})

describe('AURA-202 DAL never uses the service role and queries only public tables', () => {
  const dal = codeOnly(readSrc('src/dal/properties.dal.ts'))

  test('no service-role import or accessor', () => {
    expect(dal).not.toMatch(/service-role/i)
    expect(dal).not.toContain('getSupabaseServiceRole')
    expect(dal).not.toMatch(/SERVICE_ROLE/i)
  })

  test('uses the anon server client', () => {
    expect(dal).toContain('createSupabaseServerClient')
  })

  test('only queries properties / property_media / areas (never stakeholders/leads/etc.)', () => {
    const fromTargets = [...dal.matchAll(/\.from\(\s*['"`]([a-z_]+)['"`]/g)].map((m) => m[1])
    const allowed = new Set(['properties', 'property_media', 'areas'])
    for (const target of fromTargets) {
      expect(allowed.has(target as string), `unexpected .from('${target}')`).toBe(true)
    }
    expect(fromTargets.length).toBeGreaterThan(0)
  })

  test('re-asserts published-only in code (defence in depth over RLS)', () => {
    expect(dal).toContain("'published'")
  })
})

describe('AURA-202 UI never imports Supabase / DAL / services', () => {
  const uiFiles = [
    'src/components/real-estate/PropertyCard.tsx',
    'src/app/[locale]/properties/_components/PropertyFilters.tsx',
  ]

  test.each(uiFiles)('%s has no forbidden import', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code).not.toMatch(/@supabase/)
    expect(code).not.toMatch(/@\/lib\/supabase/)
    expect(code).not.toMatch(/@\/dal\//)
    expect(code).not.toMatch(/@\/services\//)
    expect(code).not.toMatch(/service-role/i)
  })
})
