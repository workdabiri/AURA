import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-304 — admin media upload/update/delete security boundary (static / no DB).
 *
 * Asserts the security-relevant SHAPE of the media surface:
 *   - every `…/media*` Route Handler enforces `requireAdmin()` (via `withAdmin`) + imports Zod;
 *   - no media route, DAL, storage service, or UI component touches the service-role client;
 *   - the storage service + DAL are `server-only`;
 *   - the media manager UI imports NO Supabase / DAL / services / storage (mutates only via fetch);
 *   - NO signed-URL / CDN-revocation implementation (public-read bucket — AURA-105);
 *   - NO video / 360 / virtual-tour support (D-41).
 *
 * The allow/deny logic + live RLS/storage behaviour are covered by the AURA-104 policy tests and
 * the gated live DAL suite; this file locks the static posture so a regression fails CI.
 */

function read(rel: string): string {
  return fs.readFileSync(path.resolve(rel), 'utf-8')
}

const MEDIA_ROUTES = [
  'src/app/api/admin/properties/[id]/media/route.ts',
  'src/app/api/admin/properties/[id]/media/[mediaId]/route.ts',
]
const STORAGE_SERVICE = 'src/services/storage/property-media.ts'
const MEDIA_DAL = 'src/dal/admin-property-media.dal.ts'
const MEDIA_UI = 'src/components/admin/PropertyMediaManager.tsx'

describe('every media Route Handler is admin-guarded + validated', () => {
  test('both media route files exist', () => {
    for (const f of MEDIA_ROUTES) expect(fs.existsSync(path.resolve(f)), f).toBe(true)
  })

  test('each route runs its handler through withAdmin (→ requireAdmin)', () => {
    for (const f of MEDIA_ROUTES) expect(read(f), f).toMatch(/withAdmin\(/)
  })

  test('each route imports zod (api-route-requires-validation)', () => {
    for (const f of MEDIA_ROUTES) expect(read(f), f).toMatch(/from 'zod'/)
  })

  test('the [mediaId] route exposes PATCH and DELETE (media delete is allowed — AURA-304)', () => {
    const content = read(MEDIA_ROUTES[1]!)
    expect(content).toMatch(/export\s+async\s+function\s+PATCH/)
    expect(content).toMatch(/export\s+async\s+function\s+DELETE/)
  })
})

describe('no service-role anywhere in the media stack (uses the admin session + RLS)', () => {
  for (const f of [...MEDIA_ROUTES, STORAGE_SERVICE, MEDIA_DAL, MEDIA_UI]) {
    test(`${f} never references the service-role client`, () => {
      const content = read(f)
      expect(content, f).not.toMatch(/getSupabaseServiceRole/)
      expect(content, f).not.toMatch(/lib\/supabase\/service-role/)
      expect(content, f).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    })
  }
})

describe('storage service + DAL are server-only', () => {
  test('storage service first import line is exactly: import "server-only"', () => {
    expect(read(STORAGE_SERVICE).split('\n')[0]).toBe("import 'server-only'")
  })
  test('media DAL first import line is exactly: import "server-only"', () => {
    expect(read(MEDIA_DAL).split('\n')[0]).toBe("import 'server-only'")
  })
})

describe('media manager UI is presentational (mutates only via fetch)', () => {
  const ui = read(MEDIA_UI)
  test("is a client component ('use client')", () => {
    expect(ui.split('\n')[0]).toBe("'use client'")
  })
  test('imports no DAL / services / storage / Supabase', () => {
    expect(ui).not.toMatch(/@\/dal\b/)
    expect(ui).not.toMatch(/@\/services\b/)
    expect(ui).not.toMatch(/@\/lib\/supabase/)
    expect(ui).not.toMatch(/createSupabaseServerClient/)
  })
  test('mutates via fetch to the role-guarded API routes', () => {
    expect(ui).toMatch(/fetch\(/)
  })
})

describe('no signed URLs / CDN revocation (public-read bucket — AURA-105)', () => {
  for (const f of [...MEDIA_ROUTES, STORAGE_SERVICE, MEDIA_DAL]) {
    test(`${f} does not implement signed URLs`, () => {
      const content = read(f)
      expect(content, f).not.toMatch(/createSignedUrl/)
      expect(content, f).not.toMatch(/createSignedUploadUrl/)
    })
  }
})

describe('no video / 360 / virtual-tour media support (D-41)', () => {
  for (const f of [...MEDIA_ROUTES, STORAGE_SERVICE, MEDIA_DAL, MEDIA_UI]) {
    test(`${f} contains no video/360/virtual-tour tokens`, () => {
      const content = read(f).toLowerCase()
      expect(content, f).not.toMatch(/video\//)
      expect(content, f).not.toMatch(/model\//)
      expect(content, f).not.toMatch(/\b360\b/)
      expect(content, f).not.toMatch(/virtual tour/)
    })
  }
})

describe('media DTO + reads never expose storage_path publicly', () => {
  test('the admin media column allowlist excludes storage_path', () => {
    const dal = read(MEDIA_DAL)
    // The DTO projection (ADMIN_MEDIA_COLUMNS) must not select storage_path; storage_path is read
    // only into the minimal delete-target projection, never the DTO returned to the UI.
    const match = /ADMIN_MEDIA_COLUMNS\s*=\s*'([^']*)'/.exec(dal)
    expect(match, 'ADMIN_MEDIA_COLUMNS literal not found').not.toBeNull()
    expect(match![1]).not.toMatch(/storage_path/)
    expect(match![1]).toMatch(/url/)
  })
})
