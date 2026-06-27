import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { asRole, isPermissionDenied, LOCAL_TESTS } from './rls-test-utils'

/**
 * AURA-203 — public property detail read-boundary security tests.
 *
 * Two layers:
 *   1. LIVE DB (gated by SUPABASE_LOCAL_TESTS=1): anon can never read draft/archived properties,
 *      can never read `property_stakeholders` AT ALL (even a `visibility='public'` row — the
 *      shared seed has one), and can never read media of an unpublished property.
 *   2. STATIC CODE (always runs): the AURA-203 detail production code never selects `*`, never
 *      references sensitive columns, the service role appears ONLY in the DAL's narrow stakeholder
 *      selector (never in routes/domain/components), the stakeholder projection is `name,type`
 *      only, contact routing never touches stakeholders, the UI imports no Supabase/DAL/services,
 *      and no lead/WhatsApp/admin routes were added.
 */

// --- Layer 1: live DB anon boundary ---------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-203 detail anon read boundary (live DB)', () => {
  test('anon cannot read draft or archived properties', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.properties where publish_status in ('draft','archived');`,
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })

  test('anon cannot SELECT property_stakeholders at all (even a visibility=public row)', () => {
    // The shared seed inserts a `visibility='public'` stakeholder on the published property;
    // anon still has no grant/policy, so the only public path is the DAL service-role selector.
    const r = asRole({ role: 'anon', query: `select count(*) from public.property_stakeholders;` })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon cannot read media belonging to a draft property', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.property_media pm
              join public.properties p on p.id = pm.property_id
              where p.slug = 'seed-draft';`,
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

const DETAIL_DAL = 'src/dal/property-detail.dal.ts'
const DETAIL_ROUTE = 'src/app/api/properties/[slug]/route.ts'
const DETAIL_DOMAIN = ['src/domain/properties/detail.ts', 'src/domain/properties/contact.ts']
const DETAIL_COMPONENTS = [
  'src/components/real-estate/PropertyDetailHero.tsx',
  'src/components/real-estate/PropertyMediaGallery.tsx',
  'src/components/real-estate/PropertySpecs.tsx',
  'src/components/real-estate/PropertyContactCard.tsx',
  'src/components/real-estate/PropertyOffPlanBlock.tsx',
  'src/components/real-estate/PropertyStakeholders.tsx',
]

/** Sensitive tokens forbidden in detail code. NOTE: `agent_*` is intentionally allowed in the
 * DAL/domain for contact routing, so it is NOT in this list (it is never surfaced raw). */
const FORBIDDEN_DETAIL_TOKENS = [
  'address',
  'views_count',
  'created_by',
  'updated_by',
  'storage_path',
  'internal_notes',
  'registration_or_license',
]

const ALL_DETAIL_PRODUCTION_FILES = [
  DETAIL_DAL,
  DETAIL_ROUTE,
  ...DETAIL_DOMAIN,
  ...DETAIL_COMPONENTS,
]

describe('AURA-203 detail code never selects * or references sensitive columns', () => {
  test.each(ALL_DETAIL_PRODUCTION_FILES)('%s never uses select("*")', (file) => {
    expect(codeOnly(readSrc(file))).not.toMatch(/select\(\s*['"`]\*['"`]/)
  })

  test.each(ALL_DETAIL_PRODUCTION_FILES)('%s has no forbidden sensitive token', (file) => {
    const code = codeOnly(readSrc(file))
    for (const token of FORBIDDEN_DETAIL_TOKENS) {
      expect(code, `${file} must not reference ${token}`).not.toContain(token)
    }
  })
})

describe('AURA-203 service role is narrowly scoped to the DAL stakeholder selector', () => {
  test('the detail DAL uses the anon server client for property/media reads', () => {
    expect(codeOnly(readSrc(DETAIL_DAL))).toContain('createSupabaseServerClient')
  })

  test('the detail DAL uses the service role only for the stakeholder selector', () => {
    const dal = codeOnly(readSrc(DETAIL_DAL))
    expect(dal).toContain('getSupabaseServiceRole')
    const stakeholderQueries = dal.match(/\.from\(\s*['"`]property_stakeholders['"`]\s*\)/g) ?? []
    expect(stakeholderQueries.length).toBe(1)
    expect(dal).toContain("select('name, type')")
  })

  test('routes, domain, and components NEVER reference the service role', () => {
    for (const file of [DETAIL_ROUTE, ...DETAIL_DOMAIN, ...DETAIL_COMPONENTS]) {
      const code = codeOnly(readSrc(file))
      expect(code, `${file} must not reference service-role`).not.toMatch(/service-role/i)
      expect(code, `${file} must not use getSupabaseServiceRole`).not.toContain(
        'getSupabaseServiceRole'
      )
      expect(code, `${file} must not reference SERVICE_ROLE`).not.toMatch(/SERVICE_ROLE/i)
    }
  })
})

describe('AURA-203 contact routing never touches stakeholders', () => {
  test('contact domain code makes no reference to stakeholders', () => {
    expect(codeOnly(readSrc('src/domain/properties/contact.ts'))).not.toMatch(/stakeholder/i)
  })
})

describe('AURA-203 domain stays pure (no Supabase/DAL)', () => {
  test.each(DETAIL_DOMAIN)('%s imports no Supabase/DAL', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code).not.toMatch(/@supabase/)
    expect(code).not.toMatch(/@\/lib\/supabase/)
    expect(code).not.toMatch(/@\/dal\//)
  })
})

describe('AURA-203 UI components import no Supabase / DAL / services', () => {
  test.each(DETAIL_COMPONENTS)('%s has no forbidden import', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code).not.toMatch(/@supabase/)
    expect(code).not.toMatch(/@\/lib\/supabase/)
    expect(code).not.toMatch(/@\/dal\//)
    expect(code).not.toMatch(/@\/services\//)
    expect(code).not.toMatch(/service-role/i)
  })
})

describe('AURA-203 stays in scope (no lead/WhatsApp/admin routes added)', () => {
  test('detail route only handles GET and references no lead/whatsapp/admin work', () => {
    const route = codeOnly(readSrc(DETAIL_ROUTE))
    expect(route).toContain('export async function GET')
    expect(route).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)/)
    expect(route).not.toMatch(/lead|whatsapp|admin/i)
  })

  test('no lead / WhatsApp public route directories exist (Phase 4)', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/api/leads'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'src/app/api/whatsapp-clicks'))).toBe(false)
    // Admin API routes (`src/app/api/admin`) are introduced by AURA-303 (property CRUD), not by
    // this public detail task; the assertion that matters here is that the PUBLIC properties
    // surface still hosts no admin handlers nested under it.
    expect(existsSync(resolve(process.cwd(), 'src/app/api/properties/admin'))).toBe(false)
  })
})
