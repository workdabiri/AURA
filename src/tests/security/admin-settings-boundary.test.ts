import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-306 — admin settings security boundary (static / no DB).
 *
 * Asserts the security-relevant SHAPE of the admin settings surface:
 *   - the `/api/admin/settings` Route Handler enforces `requireAdmin()` via `withAdmin` (the layout
 *     guard protects PAGES, not handlers — RBAC.md) and never `requireSuperAdmin()` (both admin
 *     roles may edit — owner decision);
 *   - the settings route + helper never import the service-role client (admin writes use the admin
 *     session + RLS);
 *   - the admin settings DAL functions (`getAdminSettings` / `updateAdminSettings`) use the
 *     request-scoped admin client and NEVER the service role, while the PUBLIC selector
 *     (`getPublicSettings`) legitimately keeps the service role — the ONLY service-role path in the
 *     file — and the file issues NO `.delete()` (no settings delete, owner decision);
 *   - the audit writer stays server-only + service-role and gains exactly `settings_updated`;
 *   - no UNGUARDED `src/app/admin/settings/**` exists (the page lives under `(protected)`);
 *   - the SettingsForm client component imports NO service-role / Supabase / DAL / services / storage
 *     (merge blocker) and fetches the guarded route;
 *   - the public footer/selector remain unchanged (AURA-201 regression);
 *   - no `clients` / `client_id` / tenant model is reintroduced (D-05 merge blocker).
 *
 * The allow/deny logic itself is covered by the AURA-104 policy unit tests + the gated live RLS
 * suite; the per-key value rules by the AURA-306 domain unit tests.
 */

function read(rel: string): string {
  return fs.readFileSync(path.resolve(rel), 'utf-8')
}

const ROUTE = 'src/app/api/admin/settings/route.ts'
const HELPER = 'src/app/api/admin/settings/_helpers.ts'
const FORM = 'src/components/admin/SettingsForm.tsx'
const DAL = 'src/dal/settings.dal.ts'
const AUDIT = 'src/dal/audit-logs.dal.ts'

describe('the admin settings Route Handler enforces the admin guard (RBAC.md)', () => {
  test('the route + helper files exist', () => {
    expect(fs.existsSync(path.resolve(ROUTE))).toBe(true)
    expect(fs.existsSync(path.resolve(HELPER))).toBe(true)
  })

  test('the route runs its handlers through withAdmin (→ requireAdmin)', () => {
    expect(read(ROUTE)).toMatch(/withAdmin\(/)
  })

  test('the helper calls requireAdmin and NOT requireSuperAdmin (both admin roles)', () => {
    const helper = read(HELPER)
    expect(helper).toMatch(/requireAdmin\(\)/)
    expect(helper).not.toMatch(/requireSuperAdmin\(/)
  })

  test('route is admin-only and never calls requireSuperAdmin', () => {
    expect(read(ROUTE)).not.toMatch(/requireSuperAdmin\(/)
  })

  test('route + helper never import the service-role client (writes use the admin session)', () => {
    for (const file of [ROUTE, HELPER]) {
      const content = read(file)
      expect(content, file).not.toMatch(/getSupabaseServiceRole/)
      expect(content, file).not.toMatch(/lib\/supabase\/service-role/)
      expect(content, file).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    }
  })

  test('the route module imports zod (api-route-requires-validation)', () => {
    expect(read(ROUTE)).toMatch(/from 'zod'/)
  })

  test('the route exports GET + PATCH only — no DELETE handler (no settings delete)', () => {
    const content = read(ROUTE)
    expect(content).toMatch(/export\s+async\s+function\s+GET/)
    expect(content).toMatch(/export\s+async\s+function\s+PATCH/)
    expect(content).not.toMatch(/export\s+(async\s+)?function\s+DELETE/)
    expect(content).not.toMatch(/export\s+const\s+DELETE/)
  })
})

describe('settings DAL — admin path uses the admin session; service role stays public-only', () => {
  const dal = read(DAL)
  // The admin read/write live AFTER the public selector; isolate that region for the service-role
  // assertion so the public selector's legitimate service-role use is not misread as an admin one.
  const adminRegion = dal.slice(dal.indexOf('export async function getAdminSettings'))

  test('the DAL is server-only', () => {
    expect(dal.split('\n')[0]).toBe("import 'server-only'")
  })

  test('the admin read/write region uses the request-scoped admin client', () => {
    expect(adminRegion).toMatch(/getAdminSettings/)
    expect(adminRegion).toMatch(/updateAdminSettings/)
    expect(adminRegion).toMatch(/createSupabaseServerClient/)
  })

  test('the admin read/write region NEVER uses the service role', () => {
    expect(adminRegion).not.toMatch(/getSupabaseServiceRole/)
    expect(adminRegion).not.toMatch(/lib\/supabase\/service-role/)
  })

  test('the DAL issues NO .delete() (no settings delete path — owner decision)', () => {
    expect(dal).not.toMatch(/\.delete\(/)
  })

  test('the public selector still uses the service role + the public allowlist (AURA-201)', () => {
    expect(dal).toMatch(/export async function getPublicSettings/)
    expect(dal).toMatch(/getSupabaseServiceRole/)
    expect(dal).toMatch(/PUBLIC_SETTING_KEYS/)
  })
})

describe('audit writer still server-only + service-role; settings action added (D-38)', () => {
  const audit = read(AUDIT)

  test('first import line is exactly: import "server-only"', () => {
    expect(audit.split('\n')[0]).toBe("import 'server-only'")
  })

  test('the controlled action union includes settings_updated (and not the wrong spelling)', () => {
    expect(audit).toMatch(/settings_updated/)
    expect(audit).not.toMatch(/'setting_updated'/)
  })

  test('append-only: inserts, never updates or deletes audit rows', () => {
    expect(audit).toMatch(/\.insert\(/)
    expect(audit).not.toMatch(/\.update\(/)
    expect(audit).not.toMatch(/\.delete\(/)
  })
})

describe('no UNGUARDED admin settings route outside the (protected) group', () => {
  test('src/app/admin/settings does NOT exist (would bypass the layout guard)', () => {
    expect(fs.existsSync(path.resolve('src/app/admin/settings'))).toBe(false)
  })

  test('the guarded settings page DOES live under (protected)', () => {
    expect(fs.existsSync(path.resolve('src/app/admin/(protected)/settings/page.tsx'))).toBe(true)
  })
})

describe('SettingsForm never imports service-role / Supabase / DAL / services / storage', () => {
  const content = read(FORM)

  test('the form is presentational — no data-layer imports', () => {
    expect(content).not.toMatch(/@\/dal\b/)
    expect(content).not.toMatch(/@\/services\b/)
    expect(content).not.toMatch(/@\/lib\/supabase/)
    expect(content).not.toMatch(/@supabase/)
    expect(content).not.toMatch(/getSupabaseServiceRole/)
    expect(content).not.toMatch(/createSupabaseServerClient/)
    expect(content).not.toMatch(/@\/services\/storage/)
  })

  test('the form is a client component that fetches the guarded route', () => {
    expect(content.split('\n')[0]).toBe("'use client'")
    expect(content).toMatch(/fetch\('\/api\/admin\/settings'/)
  })
})

describe('public settings surface unchanged (AURA-201 regression)', () => {
  test('the public footer still receives settings as a prop — no data-layer import', () => {
    const footer = read('src/components/layout/Footer.tsx')
    expect(footer).not.toMatch(/@\/dal\b/)
    expect(footer).not.toMatch(/@\/lib\/supabase/)
    expect(footer).not.toMatch(/getSupabaseServiceRole/)
  })
})

describe('no clients / client_id / tenant model reintroduced (D-05 merge blocker)', () => {
  const aura306Files = [
    'src/domain/settings/admin.ts',
    DAL,
    ROUTE,
    HELPER,
    'src/app/admin/(protected)/settings/page.tsx',
    FORM,
  ]

  test('no client_id column, tenant id, or tenant routing token appears', () => {
    for (const file of aura306Files) {
      const content = read(file)
      expect(content, file).not.toMatch(/\bclient_id\b/)
      expect(content, file).not.toMatch(/\btenant_id\b/)
      expect(content, file).not.toMatch(/\btenantId\b/)
    }
  })
})
