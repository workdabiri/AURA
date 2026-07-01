import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-307 — admin legal security boundary (static / no DB).
 *
 * Asserts the security-relevant SHAPE of the admin legal surface (D-12 merge blocker + RBAC):
 *   - every `/api/admin/legal*` Route Handler enforces `requireAdmin()` via `withAdmin` (the layout
 *     guard protects PAGES, not handlers — RBAC.md), and never `requireSuperAdmin()`;
 *   - the legal routes + admin DAL never import the service-role client (legal admin CRUD uses the
 *     admin session); the only service-role legal path is the audit writer;
 *   - NO admin legal route exports a DELETE handler and the DAL issues no `.delete()` (archive only);
 *   - NO unsafe raw-HTML path is introduced anywhere in the admin legal code — no
 *     `dangerouslySetInnerHTML` / `rehype-raw` / `marked` / `DOMPurify` / `innerHTML` (the ONLY
 *     renderer remains the public `SafeMarkdown`, which uses `rehype-sanitize`);
 *   - no UNGUARDED `src/app/admin/legal/**` exists (admin pages live under `(protected)`);
 *   - the admin legal UI components import NO service-role / Supabase / DAL / services / storage;
 *   - no `clients` / `client_id` / tenant model is reintroduced (D-05 merge blocker).
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

/** Strip comments so token assertions target executable code, not prose. */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

const legalApiFiles = walk('src/app/api/admin/legal')
const routeFiles = legalApiFiles.filter((f) => /route\.ts$/.test(f))

const UNSAFE_HTML_TOKENS = [
  'dangerouslySetInnerHTML',
  'rehypeRaw',
  'rehype-raw',
  'marked',
  'DOMPurify',
  'innerHTML',
]

describe('every admin legal Route Handler enforces the admin guard (RBAC.md)', () => {
  test('the four route files exist (collection + item + publish + archive)', () => {
    expect(routeFiles.length).toBe(4)
    for (const f of [
      'src/app/api/admin/legal/route.ts',
      'src/app/api/admin/legal/[id]/route.ts',
      'src/app/api/admin/legal/[id]/publish/route.ts',
      'src/app/api/admin/legal/[id]/archive/route.ts',
    ]) {
      expect(fs.existsSync(path.resolve(f)), f).toBe(true)
    }
  })

  test('each route file runs its handler through withAdmin (→ requireAdmin)', () => {
    for (const file of routeFiles) {
      expect(read(file), file).toMatch(/withAdmin\(/)
    }
  })

  test('the shared helper calls requireAdmin and NOT requireSuperAdmin (both admin roles)', () => {
    const helper = read('src/app/api/admin/legal/_helpers.ts')
    expect(helper).toMatch(/requireAdmin\(\)/)
    expect(helper).not.toMatch(/requireSuperAdmin/)
  })

  test('no admin legal file references requireSuperAdmin (in code)', () => {
    for (const file of legalApiFiles) {
      expect(codeOnly(read(file)), file).not.toMatch(/requireSuperAdmin/)
    }
  })

  test('legal routes never import the service-role client (admin CRUD uses the admin session)', () => {
    for (const file of legalApiFiles) {
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

  test('no admin legal route exports a DELETE handler (no hard delete)', () => {
    for (const file of routeFiles) {
      const content = read(file)
      expect(content, file).not.toMatch(/export\s+(async\s+)?function\s+DELETE/)
      expect(content, file).not.toMatch(/export\s+const\s+DELETE/)
    }
  })
})

describe('admin legal DAL — server-only, admin session, no service role, no hard delete', () => {
  const dal = read('src/dal/legal.dal.ts')

  test('the legal DAL is server-only and uses the request-scoped admin client', () => {
    expect(dal.split('\n')[0]).toBe("import 'server-only'")
    expect(dal).toMatch(/createSupabaseServerClient/)
  })

  test('the legal DAL never uses the service role', () => {
    expect(dal).not.toMatch(/getSupabaseServiceRole/)
    expect(dal).not.toMatch(/lib\/supabase\/service-role/)
    expect(codeOnly(dal)).not.toMatch(/SERVICE_ROLE/i)
  })

  test('the legal DAL never issues a .delete() (archive only, never hard delete)', () => {
    expect(dal).not.toMatch(/\.delete\(/)
  })

  test('the legal DAL never selects * (public + admin both use explicit allowlists)', () => {
    expect(codeOnly(dal)).not.toMatch(/select\(\s*['"`]\*['"`]/)
  })
})

describe('no unsafe raw-HTML path introduced in admin legal code (D-12)', () => {
  const adminLegalFiles = [
    ...legalApiFiles,
    'src/domain/legal/admin.ts',
    'src/dal/legal.dal.ts',
    'src/components/admin/LegalPageForm.tsx',
    'src/components/admin/LegalPageRowActions.tsx',
    'src/components/admin/LegalPageStatusBadge.tsx',
    ...walk('src/app/admin/(protected)/legal'),
  ]

  test.each(adminLegalFiles)('%s contains no unsafe HTML token', (file) => {
    const code = codeOnly(read(file))
    for (const token of UNSAFE_HTML_TOKENS) {
      expect(code, `${file} must not reference ${token}`).not.toContain(token)
    }
  })

  test('the public SafeMarkdown renderer is unchanged (react-markdown + rehype-sanitize)', () => {
    const renderer = read('src/components/legal/SafeMarkdown.tsx')
    expect(renderer).toContain('react-markdown')
    expect(renderer).toContain('rehype-sanitize')
    // Code-only (the file's docstring legitimately NAMES the forbidden tokens to explain why
    // they are absent); the renderer must not actually USE them.
    const rendererCode = codeOnly(renderer)
    expect(rendererCode).not.toContain('dangerouslySetInnerHTML')
    expect(rendererCode).not.toContain('rehype-raw')
  })

  test('the admin form previews content through SafeMarkdown only (no second renderer)', () => {
    const form = read('src/components/admin/LegalPageForm.tsx')
    expect(form).toMatch(/SafeMarkdown/)
  })
})

describe('audit writer still server-only + service-role; legal actions added (D-38)', () => {
  const audit = read('src/dal/audit-logs.dal.ts')

  test('first import line is exactly: import "server-only"', () => {
    expect(audit.split('\n')[0]).toBe("import 'server-only'")
  })

  test('the controlled action union includes the three legal actions and NOT legal_page_updated', () => {
    expect(audit).toMatch(/legal_page_created/)
    expect(audit).toMatch(/legal_page_published/)
    expect(audit).toMatch(/legal_page_archived/)
    // Code-only: the docstring explains that legal_page_updated is intentionally excluded, so the
    // token may appear in prose; it must never appear in the executable action union.
    expect(codeOnly(audit)).not.toMatch(/legal_page_updated/)
  })

  test('append-only: inserts, never updates or deletes audit rows', () => {
    expect(audit).toMatch(/\.insert\(/)
    expect(audit).not.toMatch(/\.update\(/)
    expect(audit).not.toMatch(/\.delete\(/)
  })
})

describe('no UNGUARDED admin legal route outside the (protected) group', () => {
  test('src/app/admin/legal does NOT exist (would bypass the layout guard)', () => {
    expect(fs.existsSync(path.resolve('src/app/admin/legal'))).toBe(false)
  })

  test('the guarded legal pages DO live under (protected)', () => {
    for (const f of [
      'src/app/admin/(protected)/legal/page.tsx',
      'src/app/admin/(protected)/legal/new/page.tsx',
      'src/app/admin/(protected)/legal/[id]/edit/page.tsx',
    ]) {
      expect(fs.existsSync(path.resolve(f)), f).toBe(true)
    }
  })
})

describe('admin legal UI never imports service-role / Supabase / DAL / services (merge blocker)', () => {
  const legalComponents = [
    'LegalPageForm.tsx',
    'LegalPageRowActions.tsx',
    'LegalPageStatusBadge.tsx',
  ].map((f) => `src/components/admin/${f}`)

  test('the legal components are presentational — no data-layer imports', () => {
    for (const file of legalComponents) {
      const content = read(file)
      expect(content, file).not.toMatch(/@\/dal\b/)
      expect(content, file).not.toMatch(/@\/services\b/)
      expect(content, file).not.toMatch(/@\/lib\/supabase/)
      expect(content, file).not.toMatch(/getSupabaseServiceRole/)
      expect(content, file).not.toMatch(/createSupabaseServerClient/)
      expect(content, file).not.toMatch(/@supabase/)
    }
  })

  test('the mutating legal components are client components that fetch the guarded routes', () => {
    for (const f of ['LegalPageForm.tsx', 'LegalPageRowActions.tsx']) {
      const content = read(`src/components/admin/${f}`)
      expect(content.split('\n')[0]).toBe("'use client'")
      expect(content).toMatch(/fetch\(/)
    }
  })
})

describe('no clients / client_id / tenant model reintroduced (D-05 merge blocker)', () => {
  const aura307Files = [
    'src/domain/legal/admin.ts',
    'src/dal/legal.dal.ts',
    ...legalApiFiles,
    ...walk('src/app/admin/(protected)/legal'),
    'src/components/admin/LegalPageForm.tsx',
    'src/components/admin/LegalPageRowActions.tsx',
    'src/components/admin/LegalPageStatusBadge.tsx',
  ]

  test('no client_id column, tenant id, or tenant routing token appears', () => {
    for (const file of aura307Files) {
      const content = read(file)
      expect(content, file).not.toMatch(/\bclient_id\b/)
      expect(content, file).not.toMatch(/\btenant_id\b/)
      expect(content, file).not.toMatch(/\btenantId\b/)
    }
  })
})
