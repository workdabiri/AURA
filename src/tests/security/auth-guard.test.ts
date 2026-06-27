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

describe('admin login surface — AURA-301 auth/security boundary', () => {
  const action = read('src/app/admin/login/actions.ts')
  const form = read('src/app/admin/login/AdminLoginForm.tsx')
  const protectedLayout = read('src/app/admin/(protected)/layout.tsx')
  const adminFiles = walk('src/app/admin')

  test('login action is server-side ("use server")', () => {
    expect(action.split('\n')[0]).toBe("'use server'")
  })

  test('login action uses the anon server client, never the service-role client', () => {
    expect(action).toMatch(/createSupabaseServerClient/)
    expect(action).not.toMatch(/getSupabaseServiceRole/)
    expect(action).not.toMatch(/lib\/supabase\/service-role/)
    expect(action).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  test('login action rate-limits BEFORE attempting sign-in (AURA-106 login rule)', () => {
    expect(action).toMatch(/enforceRateLimit/)
    expect(action).toMatch(/route:\s*'login'/)
    const rlIndex = action.indexOf('enforceRateLimit')
    const signInIndex = action.indexOf('signInWithPassword')
    expect(rlIndex).toBeGreaterThan(-1)
    expect(signInIndex).toBeGreaterThan(-1)
    expect(rlIndex).toBeLessThan(signInIndex)
  })

  test('login action requires an admin role after auth (auth alone is insufficient)', () => {
    // It must consult the AURA-104 guard's resolver, not grant on a bare session.
    expect(action).toMatch(/resolveAdminAccess/)
  })

  test('no signup / self-registration anywhere under the admin tree (D-40)', () => {
    const offenders = adminFiles.filter((f) => /(sign-?up|register)/i.test(f))
    expect(offenders).toEqual([])
    for (const file of adminFiles) {
      const content = read(file)
      expect(content, file).not.toMatch(/\.signUp\s*\(/)
      expect(content, file).not.toMatch(/\.createUser\s*\(/)
    }
  })

  test('login UI (client component) imports no Supabase, service-role, or server env', () => {
    expect(form.split('\n')[0]).toBe("'use client'")
    expect(form).not.toMatch(/@\/lib\/supabase/)
    expect(form).not.toMatch(/getSupabaseServiceRole/)
    expect(form).not.toMatch(/lib\/supabase\/service-role/)
    expect(form).not.toMatch(/@\/lib\/config\/env(?!\.public)/)
  })

  test('protected admin layout enforces the guard server-side (not a client check)', () => {
    expect(protectedLayout).not.toMatch(/'use client'/)
    expect(protectedLayout).toMatch(/getCurrentAdmin/)
    expect(protectedLayout).toMatch(/redirect\(/)
  })

  test('admin tree never logs credentials, tokens, cookies, JWTs, sessions, or IPs', () => {
    const secretLog =
      /console\.(log|info|warn|error|debug)\s*\([^)]*\b(password|token|cookie|jwt|session|ip|secret)\b/i
    for (const file of adminFiles) {
      expect(read(file), file).not.toMatch(secretLog)
    }
  })
})

describe('admin dashboard shell — guarded location + no data boundary (AURA-302)', () => {
  const dashboardPage = 'src/app/admin/(protected)/dashboard/page.tsx'
  const adminIndex = 'src/app/admin/(protected)/page.tsx'
  const adminComponents = walk('src/components/admin')

  test('the dashboard lives UNDER the guarded (protected) group', () => {
    // Inside `(protected)`, so the AURA-301 layout guard wraps it server-side.
    expect(fs.existsSync(path.resolve(dashboardPage))).toBe(true)
  })

  test('no UNGUARDED dashboard route exists outside the (protected) group', () => {
    // A sibling `src/app/admin/dashboard/**` would NOT inherit the `(protected)` layout
    // guard and would be publicly reachable — it must never exist (owner decision #4).
    expect(fs.existsSync(path.resolve('src/app/admin/dashboard'))).toBe(false)
  })

  test('/admin redirects to /admin/dashboard (still inside the guard)', () => {
    expect(read(adminIndex)).toMatch(/redirect\(\s*['"]\/admin\/dashboard['"]\s*\)/)
  })

  test('admin shell components exist and are presentational only', () => {
    expect(adminComponents.length).toBeGreaterThan(0)
    for (const file of adminComponents) {
      const content = read(file)
      // No data layer, no Supabase, no services, no service-role anywhere in admin UI.
      expect(content, file).not.toMatch(/@\/dal\b/)
      expect(content, file).not.toMatch(/@\/services\b/)
      expect(content, file).not.toMatch(/@\/lib\/supabase/)
      expect(content, file).not.toMatch(/getSupabaseServiceRole/)
      expect(content, file).not.toMatch(/createSupabaseServerClient/)
      expect(content, file).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    }
  })

  test('admin shell does NOT reuse the next-intl public layout components', () => {
    // Admin is non-localized: it must not IMPORT next-intl or the public Header/Nav/Footer.
    // (Matches import sources only, so doc-comment mentions of "next-intl" are not flagged.)
    for (const file of adminComponents) {
      const content = read(file)
      expect(content, file).not.toMatch(/from\s+['"]next-intl['"]/)
      expect(content, file).not.toMatch(
        /from\s+['"]@\/components\/layout\/(Header|Navigation|Footer)/
      )
    }
  })

  test('the dashboard page performs no data reads (no DAL / Supabase / services import)', () => {
    const page = read(dashboardPage)
    expect(page).not.toMatch(/@\/dal\b/)
    expect(page).not.toMatch(/@\/services\b/)
    expect(page).not.toMatch(/@\/lib\/supabase/)
    expect(page).not.toMatch(/getSupabaseServiceRole/)
  })
})
