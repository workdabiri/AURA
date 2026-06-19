import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-104 application-layer auth boundary tests (static / no DB).
 *
 * These assert the security-relevant SHAPE of the guard + bootstrap script and the
 * absence of a self-signup path. The allow/deny decision logic is covered by
 * src/tests/unit/auth-policy.test.ts; the real RLS substrate by the gated
 * src/tests/integration/auth-guard.test.ts.
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
    if (entry.isDirectory()) {
      out.push(...walk(childRel))
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(childRel)
    }
  }
  return out
}

describe('admin auth guard — server-only + request-path boundary (AURA-104)', () => {
  const guard = read('src/services/auth/guard.ts')

  test('guard.ts first import line is exactly: import "server-only"', () => {
    expect(guard.split('\n')[0]).toBe("import 'server-only'")
  })

  test('guard authorizes with verified getUser(), never getSession()', () => {
    expect(guard).toMatch(/\.auth\.getUser\(/)
    expect(guard).not.toMatch(/getSession\(/)
  })

  test('request-path guard uses the anon server client, never the privileged client', () => {
    expect(guard).toMatch(/createSupabaseServerClient/)
    // The RLS-bypassing client must NOT be reachable from the request-path guard.
    expect(guard).not.toMatch(/getSupabaseServiceRole/)
    expect(guard).not.toMatch(/lib\/supabase\/service-role/)
  })
})

describe('no self-signup / self-registration path exists (D-40 merge blocker)', () => {
  const surface = [...walk('src/app'), ...walk('src/components')]

  test('no signup/register route or component file under src/app or src/components', () => {
    const offenders = surface.filter((f) => /(sign-?up|register)/i.test(f))
    expect(offenders).toEqual([])
  })

  test('no UI/route code calls signUp() or createUser()', () => {
    for (const file of surface) {
      const content = read(file)
      expect(content, file).not.toMatch(/\.signUp\s*\(/)
      expect(content, file).not.toMatch(/admin\.createUser\s*\(/)
      expect(content, file).not.toMatch(/\.createUser\s*\(/)
    }
  })
})

describe('service-role is never imported by client/UI code (security merge blocker)', () => {
  const surface = [...walk('src/app'), ...walk('src/components')]

  test('no src/app or src/components file imports the service-role helper', () => {
    for (const file of surface) {
      const content = read(file)
      expect(content, file).not.toMatch(/lib\/supabase\/service-role/)
      expect(content, file).not.toMatch(/getSupabaseServiceRole/)
    }
  })

  test('dependency-cruiser still enforces no-client-to-service-role', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../.dependency-cruiser.cjs') as {
      forbidden: Array<{ name: string }>
    }
    expect(config.forbidden.some((r) => r.name === 'no-client-to-service-role')).toBe(true)
  })
})

describe('seed-admin bootstrap script — links existing user only, no signup (D-40)', () => {
  const script = read('scripts/seed-admin.ts')

  test('verifies an existing Auth user via getUserById', () => {
    expect(script).toMatch(/getUserById/)
  })

  test('never creates Auth users or passwords (no createUser / signUp)', () => {
    expect(script).not.toMatch(/admin\.createUser\s*\(/)
    expect(script).not.toMatch(/\.createUser\s*\(/)
    expect(script).not.toMatch(/\.signUp\s*\(/)
  })

  test('uses the privileged server client (operator-only bootstrap path)', () => {
    expect(script).toMatch(/getSupabaseServiceRole/)
  })
})
