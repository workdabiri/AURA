import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-305 — admin areas security boundary (static / no DB).
 *
 * Asserts the security-relevant SHAPE of the admin areas surface:
 *   - every `/api/admin/areas*` Route Handler enforces `requireAdmin()` via `withAdmin` (the
 *     layout guard protects PAGES, not handlers — RBAC.md), and never `requireSuperAdmin()`;
 *   - the area routes never import the service-role client (area writes use the admin session);
 *   - the admin-areas DAL + the area-image storage service never use the service role and issue
 *     NO `.delete()` on areas (deactivate = is_active; no hard delete — owner-locked);
 *   - the area-image service is `server-only`;
 *   - no UNGUARDED `src/app/admin/areas/**` exists (admin pages live under `(protected)`);
 *   - the admin UI imports NO service-role / Supabase / DAL / services (merge blocker);
 *   - the PUBLIC areas surface is unchanged (active-only, anon client, no service role) — AURA-204;
 *   - no `clients` / `client_id` / tenant model is reintroduced (D-05 merge blocker).
 *
 * The allow/deny logic itself is covered by the AURA-104 policy unit tests + the gated live RLS
 * suites; the field/slug rules by the AURA-305 domain unit tests.
 */

function read(rel: string): string {
  return fs.readFileSync(path.resolve(rel), 'utf-8')
}

function walk(rel: string): string[] {
  const abs = path.resolve(rel)
  if (!fs.existsSync(abs)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = path.join(rel, entry.name)
    if (entry.isDirectory()) out.push(...walk(childRel))
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(childRel)
  }
  return out
}

const areaApiFiles = walk('src/app/api/admin/areas')
const routeFiles = areaApiFiles.filter((f) => /route\.ts$/.test(f))

describe('every admin area Route Handler enforces the admin guard (RBAC.md)', () => {
  test('the two route files exist (collection + item)', () => {
    expect(routeFiles.length).toBe(2)
    expect(fs.existsSync(path.resolve('src/app/api/admin/areas/route.ts'))).toBe(true)
    expect(fs.existsSync(path.resolve('src/app/api/admin/areas/[id]/route.ts'))).toBe(true)
  })

  test('each route file runs its handler through withAdmin (→ requireAdmin)', () => {
    for (const file of routeFiles) {
      expect(read(file), file).toMatch(/withAdmin\(/)
    }
  })

  test('the shared helper calls requireAdmin and NOT requireSuperAdmin (both admin roles)', () => {
    const helper = read('src/app/api/admin/areas/_helpers.ts')
    expect(helper).toMatch(/requireAdmin\(\)/)
    expect(helper).not.toMatch(/requireSuperAdmin\(/)
  })

  test('route handlers never import the service-role client (area writes use the admin session)', () => {
    for (const file of [...routeFiles, 'src/app/api/admin/areas/_helpers.ts']) {
      const content = read(file)
      expect(content, file).not.toMatch(/getSupabaseServiceRole/)
      expect(content, file).not.toMatch(/lib\/supabase\/service-role/)
      expect(content, file).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    }
  })

  test('every route module imports zod (api-route-requires-validation)', () => {
    for (const file of routeFiles) {
      expect(read(file), file).toMatch(/from 'zod'/)
    }
  })

  test('no admin area route exports a DELETE handler (no hard delete)', () => {
    for (const file of routeFiles) {
      const content = read(file)
      expect(content, file).not.toMatch(/export\s+(async\s+)?function\s+DELETE/)
      expect(content, file).not.toMatch(/export\s+const\s+DELETE/)
    }
  })
})

describe('admin-areas DAL + area-image service — no service role, no hard delete', () => {
  const dal = read('src/dal/admin-areas.dal.ts')
  const storage = read('src/services/storage/area-image.ts')

  test('admin-areas DAL is server-only and uses the request-scoped admin client', () => {
    expect(dal.split('\n')[0]).toBe("import 'server-only'")
    expect(dal).toMatch(/createSupabaseServerClient/)
  })

  test('admin-areas DAL never uses the service role', () => {
    expect(dal).not.toMatch(/getSupabaseServiceRole/)
    expect(dal).not.toMatch(/lib\/supabase\/service-role/)
  })

  test('admin-areas DAL never issues a .delete() (deactivate via is_active, never hard delete)', () => {
    expect(dal).not.toMatch(/\.delete\(/)
  })

  test('area-image storage service is server-only and never uses the service role', () => {
    expect(storage.split('\n')[0]).toBe("import 'server-only'")
    expect(storage).not.toMatch(/getSupabaseServiceRole/)
    expect(storage).not.toMatch(/lib\/supabase\/service-role/)
  })
})

describe('audit writer still server-only + service-role; area actions added (D-38)', () => {
  const audit = read('src/dal/audit-logs.dal.ts')

  test('first import line is exactly: import "server-only"', () => {
    expect(audit.split('\n')[0]).toBe("import 'server-only'")
  })

  test('the controlled action union includes the area actions', () => {
    expect(audit).toMatch(/area_created/)
    expect(audit).toMatch(/area_updated/)
  })

  test('append-only: inserts, never updates or deletes audit rows', () => {
    expect(audit).toMatch(/\.insert\(/)
    expect(audit).not.toMatch(/\.update\(/)
    expect(audit).not.toMatch(/\.delete\(/)
  })
})

describe('no UNGUARDED admin areas route outside the (protected) group', () => {
  test('src/app/admin/areas does NOT exist (would bypass the layout guard)', () => {
    expect(fs.existsSync(path.resolve('src/app/admin/areas'))).toBe(false)
  })

  test('the guarded areas pages DO live under (protected)', () => {
    expect(fs.existsSync(path.resolve('src/app/admin/(protected)/areas/page.tsx'))).toBe(true)
    expect(fs.existsSync(path.resolve('src/app/admin/(protected)/areas/new/page.tsx'))).toBe(true)
    expect(fs.existsSync(path.resolve('src/app/admin/(protected)/areas/[id]/edit/page.tsx'))).toBe(
      true
    )
  })
})

describe('admin area UI never imports service-role / Supabase / DAL / services (merge blocker)', () => {
  const areaComponents = ['AreaForm.tsx', 'AreaRowActions.tsx', 'AreaStatusBadge.tsx'].map(
    (f) => `src/components/admin/${f}`
  )

  test('the area components are presentational — no data-layer imports', () => {
    for (const file of areaComponents) {
      const content = read(file)
      expect(content, file).not.toMatch(/@\/dal\b/)
      expect(content, file).not.toMatch(/@\/services\b/)
      expect(content, file).not.toMatch(/@\/lib\/supabase/)
      expect(content, file).not.toMatch(/getSupabaseServiceRole/)
      expect(content, file).not.toMatch(/createSupabaseServerClient/)
    }
  })

  test('the mutating area components are client components that fetch the guarded routes', () => {
    for (const f of ['AreaForm.tsx', 'AreaRowActions.tsx']) {
      const content = read(`src/components/admin/${f}`)
      expect(content.split('\n')[0]).toBe("'use client'")
      expect(content).toMatch(/fetch\(/)
    }
  })
})

describe('public areas surface unchanged (AURA-204 regression)', () => {
  const publicDal = read('src/dal/areas.dal.ts')

  test('public areas DAL still re-asserts is_active and uses the anon server client', () => {
    expect(publicDal).toMatch(/\.eq\('is_active', true\)/)
    expect(publicDal).toMatch(/createSupabaseServerClient/)
  })

  test('public areas DAL never uses the service role and never reads property counts', () => {
    expect(publicDal).not.toMatch(/getSupabaseServiceRole/)
    expect(publicDal).not.toMatch(/from\('properties'\)/)
  })

  test('public GET /api/areas route is untouched and admin-free', () => {
    const route = read('src/app/api/areas/route.ts')
    expect(route).not.toMatch(/requireAdmin/)
    expect(route).not.toMatch(/admin-areas/)
  })
})

describe('no clients / client_id / tenant model reintroduced (D-05 merge blocker)', () => {
  const aura305Files = [
    'src/domain/areas/admin.ts',
    'src/domain/areas/admin-view.ts',
    'src/dal/admin-areas.dal.ts',
    'src/services/storage/area-image.ts',
    ...walk('src/app/api/admin/areas'),
    ...walk('src/app/admin/(protected)/areas'),
    'src/components/admin/AreaForm.tsx',
    'src/components/admin/AreaRowActions.tsx',
    'src/components/admin/AreaStatusBadge.tsx',
  ]

  test('no client_id column, tenant id, or tenant routing token appears', () => {
    for (const file of aura305Files) {
      const content = read(file)
      expect(content, file).not.toMatch(/\bclient_id\b/)
      expect(content, file).not.toMatch(/\btenant_id\b/)
      expect(content, file).not.toMatch(/\btenantId\b/)
    }
  })
})
