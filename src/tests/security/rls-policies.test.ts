import { describe, expect, test } from 'vitest'

import { asRole, catalog, isPermissionDenied, LOCAL_TESTS, SUPER_ADMIN_ID } from './rls-test-utils'

/**
 * AURA-103 — RLS-layer SECURITY NEGATIVE tests + policy-catalog assertions.
 *
 * Proves the default-deny / public-allowlist boundary the task owns:
 *  - anon cannot read any sensitive table (leads, whatsapp_clicks, user_profiles,
 *    audit_logs, settings, rate_limits, property_stakeholders).
 *  - anon cannot read non-public rows (draft/archived properties, inactive areas,
 *    draft legal pages, media of unpublished properties).
 *  - anon cannot mutate public-readable tables.
 *  - locked decisions hold in the catalog: rate_limits has NO policies, properties has
 *    NO DELETE policy, property_stakeholders has NO anon policy.
 *
 * Application-layer authenticated negatives (session present but no user_profiles row;
 * profile present but no qualifying role) are deferred to AURA-104 by design and are
 * intentionally NOT asserted here.
 *
 * Live checks require a running local stack:
 *   SUPABASE_LOCAL_TESTS=1 npm run test:security
 */

// Tables anon has NO grant on at all → a SELECT must fail with "permission denied".
const ANON_FORBIDDEN_TABLES = [
  'leads',
  'whatsapp_clicks',
  'user_profiles',
  'audit_logs',
  'settings',
  'rate_limits',
  'property_stakeholders',
] as const

// Expected policy count per table (the full AURA-103 matrix).
const EXPECTED_POLICY_COUNTS: Record<string, number> = {
  properties: 4,
  areas: 4,
  legal_pages: 4,
  property_media: 5,
  property_stakeholders: 4,
  leads: 4,
  whatsapp_clicks: 2,
  settings: 3,
  user_profiles: 5,
  audit_logs: 1,
}

describe.skipIf(!LOCAL_TESTS)('AURA-103 RLS policy catalog', () => {
  test('total policy count matches the AURA-103 matrix', () => {
    const total = Object.values(EXPECTED_POLICY_COUNTS).reduce((a, b) => a + b, 0)
    const [count] = catalog("select count(*) from pg_policies where schemaname='public';")
    expect(count).toBe(String(total))
  })

  test('each table has exactly the expected number of policies', () => {
    const rows = catalog(
      "select tablename||'='||count(*) from pg_policies where schemaname='public' group by tablename;"
    )
    const got = Object.fromEntries(rows.map((r) => r.split('=') as [string, string]))
    for (const [table, n] of Object.entries(EXPECTED_POLICY_COUNTS)) {
      expect(got[table]).toBe(String(n))
    }
  })

  test('rate_limits has NO policies (service-role only)', () => {
    const [count] = catalog(
      "select count(*) from pg_policies where schemaname='public' and tablename='rate_limits';"
    )
    expect(count).toBe('0')
  })

  test('properties has NO DELETE policy (locked decision — hard delete default-deny)', () => {
    const [count] = catalog(
      "select count(*) from pg_policies where schemaname='public' and tablename='properties' and cmd='DELETE';"
    )
    expect(count).toBe('0')
  })

  test('property_stakeholders has NO anon policy (locked decision — deferred to AURA-203)', () => {
    const [count] = catalog(
      "select count(*) from pg_policies where schemaname='public' and tablename='property_stakeholders' and roles::text like '%anon%';"
    )
    expect(count).toBe('0')
  })

  test('current_user_role() is SECURITY DEFINER (no recursive RLS)', () => {
    const [secdef] = catalog(
      "select prosecdef from pg_proc where pronamespace='public'::regnamespace and proname='current_user_role';"
    )
    expect(secdef).toBe('t')
  })

  test('anon and authenticated have NO grants on rate_limits (D-51)', () => {
    const rows = catalog(
      'select grantee from information_schema.role_table_grants ' +
        "where table_schema='public' and table_name='rate_limits' " +
        "and grantee in ('anon','authenticated');"
    )
    expect(rows).toEqual([])
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-103 anon cannot read sensitive tables', () => {
  for (const table of ANON_FORBIDDEN_TABLES) {
    test(`anon SELECT ${table} is denied (no grant)`, () => {
      const r = asRole({ role: 'anon', query: `select count(*) from public.${table};` })
      expect(isPermissionDenied(r)).toBe(true)
    })
  }
})

describe.skipIf(!LOCAL_TESTS)('AURA-103 anon cannot read non-public rows', () => {
  test('anon sees zero non-published properties (draft/archived hidden)', () => {
    const r = asRole({
      role: 'anon',
      query: "select count(*) from public.properties where publish_status <> 'published';",
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })

  test('anon sees zero inactive areas', () => {
    const r = asRole({
      role: 'anon',
      query: 'select count(*) from public.areas where is_active = false;',
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })

  test('anon sees zero non-published legal pages', () => {
    const r = asRole({
      role: 'anon',
      query: "select count(*) from public.legal_pages where status <> 'published';",
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })

  test('anon sees zero media for unpublished properties', () => {
    const r = asRole({
      role: 'anon',
      query:
        'select count(*) from public.property_media m ' +
        'join public.properties p on p.id = m.property_id ' +
        "where p.publish_status <> 'published';",
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-103 anon cannot mutate public-readable tables', () => {
  test('anon UPDATE properties is denied', () => {
    const r = asRole({
      role: 'anon',
      query: "update public.properties set is_featured = true where slug = 'seed-pub';",
    })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon DELETE properties is denied', () => {
    const r = asRole({
      role: 'anon',
      query: "delete from public.properties where slug = 'seed-pub';",
    })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon UPDATE areas is denied', () => {
    const r = asRole({
      role: 'anon',
      query: "update public.areas set is_active = false where slug = 'seed-active';",
    })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon UPDATE legal_pages is denied', () => {
    const r = asRole({
      role: 'anon',
      query: "update public.legal_pages set status = 'draft' where slug = 'seed-privacy';",
    })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon DELETE property_media is denied', () => {
    const r = asRole({
      role: 'anon',
      query: 'delete from public.property_media;',
    })
    expect(isPermissionDenied(r)).toBe(true)
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-103 internal stakeholders absent from public reach', () => {
  test('anon cannot SELECT property_stakeholders even when visibility = public', () => {
    // The seed includes a visibility='public' stakeholder; the locked decision is that
    // direct anon table access stays default-deny regardless (projection -> AURA-203).
    const r = asRole({ role: 'anon', query: 'select count(*) from public.property_stakeholders;' })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('a role-claimed admin CAN read stakeholders (positive control)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: 'select count(*) from public.property_stakeholders;',
    })
    expect(r.ok).toBe(true)
    expect(Number(r.out)).toBeGreaterThanOrEqual(1)
  })
})
