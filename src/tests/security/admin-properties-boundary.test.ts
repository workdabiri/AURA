import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-303 — admin property CRUD security boundary (static / no DB).
 *
 * Asserts the security-relevant SHAPE of the admin property surface:
 *   - every `/api/admin/properties*` Route Handler enforces `requireAdmin()` (the layout guard
 *     protects PAGES, not handlers — RBAC.md);
 *   - no UNGUARDED `src/app/admin/properties/**` exists (admin pages live under `(protected)`);
 *   - the admin UI imports NO service-role / Supabase / DAL / services (service-role stays
 *     server-only — security merge blocker);
 *   - the audit writer is server-only and uses the service-role client;
 *   - NO hard-delete endpoint or DAL delete (D-32: archive, never delete);
 *   - no `clients` / `client_id` / tenant model is reintroduced (D-05 merge blocker).
 *
 * The allow/deny logic itself is covered by the AURA-104 policy unit tests + the gated live
 * RLS suites; the publish/lifecycle rules by the AURA-303 domain unit tests.
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

const adminPropertyApiFiles = walk('src/app/api/admin/properties')
const routeFiles = adminPropertyApiFiles.filter((f) => /route\.ts$/.test(f))
// AURA-304 added two `…/media*` routes that legitimately expose DELETE (media hard-delete is
// allowed). The CRUD-lifecycle routes below remain delete-free (D-32: archive, never delete).
const crudRouteFiles = routeFiles.filter((f) => !f.includes(`${path.sep}media${path.sep}`))

describe('every admin property Route Handler enforces the admin guard (RBAC.md)', () => {
  test('the four CRUD-lifecycle route files exist (list/create, update, duplicate, archive)', () => {
    expect(crudRouteFiles.length).toBe(4)
  })

  test('each route file runs its handler through withAdmin (→ requireAdmin)', () => {
    for (const file of routeFiles) {
      expect(read(file), file).toMatch(/withAdmin\(/)
    }
  })

  test('the shared helper calls requireAdmin (NOT a client-only check)', () => {
    const helper = read('src/app/api/admin/properties/_helpers.ts')
    expect(helper).toMatch(/requireAdmin\(\)/)
    // Both MVP admin roles may manage properties — must NOT CALL super_admin-only gating
    // (a doc-comment mention is fine; a call `requireSuperAdmin(` is not).
    expect(helper).not.toMatch(/requireSuperAdmin\(/)
  })

  test('route handlers never import the service-role client (property writes use the admin session)', () => {
    for (const file of routeFiles) {
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
})

describe('no UNGUARDED admin properties route outside the (protected) group', () => {
  test('src/app/admin/properties does NOT exist (would bypass the layout guard)', () => {
    expect(fs.existsSync(path.resolve('src/app/admin/properties'))).toBe(false)
  })

  test('the guarded properties pages DO live under (protected)', () => {
    expect(fs.existsSync(path.resolve('src/app/admin/(protected)/properties/page.tsx'))).toBe(true)
    expect(fs.existsSync(path.resolve('src/app/admin/(protected)/properties/new/page.tsx'))).toBe(
      true
    )
    expect(
      fs.existsSync(path.resolve('src/app/admin/(protected)/properties/[id]/edit/page.tsx'))
    ).toBe(true)
  })
})

describe('admin UI never imports service-role / Supabase / DAL / services (merge blocker)', () => {
  const adminComponents = walk('src/components/admin')

  test('admin components are presentational — no data-layer imports', () => {
    for (const file of adminComponents) {
      const content = read(file)
      expect(content, file).not.toMatch(/@\/dal\b/)
      expect(content, file).not.toMatch(/@\/services\b/)
      expect(content, file).not.toMatch(/@\/lib\/supabase/)
      expect(content, file).not.toMatch(/getSupabaseServiceRole/)
      expect(content, file).not.toMatch(/createSupabaseServerClient/)
      expect(content, file).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    }
  })

  test('client components mutate only via fetch to the role-guarded API routes', () => {
    const form = read('src/components/admin/PropertyForm.tsx')
    const actions = read('src/components/admin/PropertyRowActions.tsx')
    expect(form.split('\n')[0]).toBe("'use client'")
    expect(actions.split('\n')[0]).toBe("'use client'")
    expect(form).toMatch(/fetch\(/)
    expect(actions).toMatch(/fetch\(/)
  })
})

describe('audit writer — append-only, server-only, service-role (D-38)', () => {
  const audit = read('src/dal/audit-logs.dal.ts')

  test('first import line is exactly: import "server-only"', () => {
    expect(audit.split('\n')[0]).toBe("import 'server-only'")
  })

  test('uses the service-role client (RLS grants authenticated no audit insert)', () => {
    expect(audit).toMatch(/getSupabaseServiceRole/)
  })

  test('append-only: inserts, never updates or deletes audit rows', () => {
    expect(audit).toMatch(/\.insert\(/)
    expect(audit).not.toMatch(/\.update\(/)
    expect(audit).not.toMatch(/\.delete\(/)
  })
})

describe('no hard delete of PROPERTIES (D-32: archive, never delete)', () => {
  test('no property CRUD-lifecycle route exports a DELETE handler', () => {
    // The media routes (AURA-304) DELETE media objects/rows, which is allowed; the property
    // lifecycle routes must still never hard-delete a property.
    for (const file of crudRouteFiles) {
      const content = read(file)
      expect(content, file).not.toMatch(/export\s+(async\s+)?function\s+DELETE/)
      expect(content, file).not.toMatch(/export\s+const\s+DELETE/)
    }
  })

  test('the admin + public property DALs never issue a delete (removal is publish_status = archived)', () => {
    expect(read('src/dal/admin-properties.dal.ts')).not.toMatch(/\.delete\(/)
    expect(read('src/dal/properties.dal.ts')).not.toMatch(/\.delete\(/)
  })
})

describe('no clients / client_id / tenant model reintroduced (D-05 merge blocker)', () => {
  const aura303Files = [
    'src/domain/properties/admin.ts',
    'src/domain/properties/publish.ts',
    'src/domain/properties/admin-view.ts',
    'src/dal/audit-logs.dal.ts',
    'src/dal/admin-properties.dal.ts',
    ...walk('src/app/api/admin'),
    ...walk('src/app/admin/(protected)/properties'),
    'src/components/admin/PropertyForm.tsx',
    'src/components/admin/PropertyRowActions.tsx',
    'src/components/admin/PropertyStatusBadge.tsx',
  ]

  test('no client_id column, tenant id, or tenant routing token appears', () => {
    for (const file of aura303Files) {
      const content = read(file)
      expect(content, file).not.toMatch(/\bclient_id\b/)
      expect(content, file).not.toMatch(/\btenant_id\b/)
      expect(content, file).not.toMatch(/\btenantId\b/)
    }
  })
})
