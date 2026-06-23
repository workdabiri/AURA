import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { asRole, LOCAL_TESTS } from './rls-test-utils'

/**
 * AURA-204 — public areas read-boundary security tests.
 *
 * Two layers:
 *   1. LIVE DB (gated by SUPABASE_LOCAL_TESTS=1, via the shared rls-test-utils anon harness —
 *      whose seed inserts one active (`seed-active`) and one inactive (`seed-inactive`) area):
 *      anon can read ONLY active areas; an inactive area is never visible.
 *   2. STATIC CODE (always runs): the AURA-204 areas DAL/domain/API/UI code never selects `*`,
 *      never uses the service role, queries ONLY the `areas` table (never `properties` — no
 *      property-derived data), re-asserts `is_active`, the domain projector is pure, the area
 *      card UI imports no Supabase/DAL/services, and no admin/area-management route was added.
 *
 * The public data-exposure boundary is the reason AURA-204 requires an Opus 4.8 review.
 */

// --- Layer 1: live DB anon boundary ---------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-204 anon areas read boundary (live DB)', () => {
  test('anon cannot read inactive areas', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.areas where is_active = false;`,
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })

  test('anon sees only active areas', () => {
    const r = asRole({ role: 'anon', query: `select count(*) from public.areas;` })
    // The shared seed has exactly one active area (seed-active); seed-inactive is hidden.
    expect(r.out).toBe('1')
  })

  test('anon cannot read the inactive area by slug', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.areas where slug = 'seed-inactive';`,
    })
    expect(r.out).toBe('0')
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

const AREA_DATA_FILES = [
  'src/dal/areas.dal.ts',
  'src/domain/areas/area.ts',
  'src/app/api/areas/route.ts',
]

describe('AURA-204 production code never uses select("*")', () => {
  test.each(AREA_DATA_FILES)('%s never uses select("*")', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code).not.toMatch(/select\(\s*['"`]\*['"`]/)
  })
})

describe('AURA-204 DAL: no service role, anon client only, areas-only, active re-asserted', () => {
  const dal = codeOnly(readSrc('src/dal/areas.dal.ts'))

  test('no service-role import or accessor', () => {
    expect(dal).not.toMatch(/service-role/i)
    expect(dal).not.toContain('getSupabaseServiceRole')
    expect(dal).not.toMatch(/SERVICE_ROLE/i)
  })

  test('uses the anon server client', () => {
    expect(dal).toContain('createSupabaseServerClient')
  })

  test('queries ONLY the areas table (no property-derived data)', () => {
    const fromTargets = [...dal.matchAll(/\.from\(\s*['"`]([a-z_]+)['"`]/g)].map((m) => m[1])
    expect(fromTargets).toEqual(['areas'])
    expect(dal).not.toContain('properties')
  })

  test('re-asserts is_active in code (defence in depth over RLS)', () => {
    expect(dal).toContain("'is_active'")
  })

  test('does not aggregate or count properties', () => {
    expect(dal).not.toMatch(/count/i)
    expect(dal).not.toMatch(/property_count/i)
  })
})

describe('AURA-204 domain projector is pure (no React / Supabase / DAL / IO)', () => {
  const domain = codeOnly(readSrc('src/domain/areas/area.ts'))

  test('no React / Supabase / DAL / service imports', () => {
    expect(domain).not.toMatch(/from\s+['"]react['"]/)
    expect(domain).not.toMatch(/@supabase/)
    expect(domain).not.toMatch(/@\/lib\/supabase/)
    expect(domain).not.toMatch(/@\/dal\//)
    expect(domain).not.toMatch(/@\/services\//)
  })

  test('exposes no property-derived field', () => {
    expect(domain).not.toMatch(/property/i)
  })
})

describe('AURA-204 area card UI never imports Supabase / DAL / services', () => {
  const card = codeOnly(readSrc('src/app/[locale]/areas/_components/AreaCard.tsx'))

  test('AreaCard has no forbidden import', () => {
    expect(card).not.toMatch(/@supabase/)
    expect(card).not.toMatch(/@\/lib\/supabase/)
    expect(card).not.toMatch(/@\/dal\//)
    expect(card).not.toMatch(/@\/services\//)
    expect(card).not.toMatch(/service-role/i)
  })
})

describe('AURA-204 added no admin / area-management route', () => {
  test('no admin areas route directory exists', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/api/admin/areas'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'src/app/[locale]/admin'))).toBe(false)
  })

  test('no area detail route exists (informational overview only)', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/[locale]/areas/[slug]'))).toBe(false)
  })
})
