import { describe, expect, test } from 'vitest'

import {
  asRole,
  CLIENT_ADMIN_ID,
  isRlsViolation,
  LOCAL_TESTS,
  NO_PROFILE_ID,
  SUPER_ADMIN_ID,
} from '../security/rls-test-utils'

/**
 * AURA-103 — RLS-layer POSITIVE tests (public allowlist + role-claimed admin reads).
 *
 * Confirms the policies grant exactly the intended access:
 *  - anon can read published properties / active areas / published legal pages /
 *    media of published properties, and can INSERT leads + whatsapp_clicks.
 *  - a role-claimed super_admin reads all statuses, manages users, reads audit logs.
 *  - a role-claimed client_admin manages business tables but cannot manage users or
 *    read audit logs (super_admin-only surfaces).
 *
 * These exercise the RLS boundary via simulated JWT claims. The full application-layer
 * auth guard (session → profile → role → 401/403) is AURA-104.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

describe.skipIf(!LOCAL_TESTS)('AURA-103 anon public allowlist reads', () => {
  test('anon can SELECT published properties (and only those)', () => {
    const visible = asRole({ role: 'anon', query: 'select count(*) from public.properties;' })
    const published = asRole({
      role: 'anon',
      query: "select count(*) from public.properties where publish_status = 'published';",
    })
    expect(visible.ok).toBe(true)
    expect(visible.out).toBe('1')
    expect(published.out).toBe('1')
  })

  test('anon can SELECT active areas (and only those)', () => {
    const r = asRole({ role: 'anon', query: 'select count(*) from public.areas;' })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('1')
  })

  test('anon can SELECT published legal pages (and only those)', () => {
    const r = asRole({ role: 'anon', query: 'select count(*) from public.legal_pages;' })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('1')
  })

  test('anon can SELECT media of published properties only', () => {
    const r = asRole({ role: 'anon', query: 'select count(*) from public.property_media;' })
    expect(r.ok).toBe(true)
    // Seed has media on one published + one draft property; only the published one is visible.
    expect(r.out).toBe('1')
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-103 anon public inserts', () => {
  test('anon can INSERT a lead (no RETURNING — no anon SELECT policy)', () => {
    const r = asRole({
      role: 'anon',
      query:
        "insert into public.leads (name, phone, source) values ('Web Lead', '+19999999999', 'homepage');",
    })
    expect(r.ok).toBe(true)
  })

  test('anon can INSERT a whatsapp_click (no PII columns exist)', () => {
    const r = asRole({
      role: 'anon',
      query: "insert into public.whatsapp_clicks (source) values ('property_detail');",
    })
    expect(r.ok).toBe(true)
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-103 super_admin role-claimed access', () => {
  test('super_admin SELECTs all property statuses', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: 'select count(*) from public.properties;',
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('3')
  })

  test('super_admin SELECTs all user profiles', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: 'select count(*) from public.user_profiles;',
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('2')
  })

  test('super_admin can read audit logs', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: 'select count(*) from public.audit_logs;',
    })
    expect(r.ok).toBe(true)
    expect(Number(r.out)).toBeGreaterThanOrEqual(1)
  })

  test('super_admin can manage users (INSERT a profile for an existing auth user)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: `insert into public.user_profiles (id, role, full_name) values ('${NO_PROFILE_ID}', 'client_admin', 'Provisioned');`,
    })
    expect(r.ok).toBe(true)
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-103 client_admin role-claimed access', () => {
  test('client_admin SELECTs all property statuses', () => {
    const r = asRole({
      role: 'authenticated',
      sub: CLIENT_ADMIN_ID,
      query: 'select count(*) from public.properties;',
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('3')
  })

  test('client_admin can manage business tables (INSERT a draft property)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: CLIENT_ADMIN_ID,
      query:
        'insert into public.properties ' +
        '(reference_number, slug, transaction_type, market_type, property_type, location_label, size_sqft) ' +
        "values ('CA-NEW', 'ca-new', 'rent', 'ready', 'villa', 'Loc', 200);",
    })
    expect(r.ok).toBe(true)
  })

  test('client_admin sees only its OWN user_profiles row (no user management read)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: CLIENT_ADMIN_ID,
      query: 'select count(*) from public.user_profiles;',
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('1')
  })

  test('client_admin CANNOT manage users (INSERT profile blocked by RLS)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: CLIENT_ADMIN_ID,
      query: `insert into public.user_profiles (id, role, full_name) values ('${NO_PROFILE_ID}', 'client_admin', 'Nope');`,
    })
    expect(isRlsViolation(r)).toBe(true)
  })

  test('client_admin CANNOT read audit logs (super_admin-only; RLS filters to zero)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: CLIENT_ADMIN_ID,
      query: 'select count(*) from public.audit_logs;',
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })
})
