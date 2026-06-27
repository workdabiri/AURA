import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { SafeMarkdown } from '@/components/legal/SafeMarkdown'

import { asRole, LOCAL_TESTS } from './rls-test-utils'

/**
 * AURA-205 — public legal page read-boundary security tests (D-12 merge blocker).
 *
 * Three layers:
 *   1. LIVE DB (gated by SUPABASE_LOCAL_TESTS=1): anon can never read draft/archived legal pages
 *      (the shared seed has a published `seed-privacy` and a draft `seed-terms`).
 *   2. SANITIZATION (always runs): the safe Markdown renderer neutralizes script/iframe/event
 *      handlers / `javascript:` URLs.
 *   3. STATIC CODE (always runs): the legal production code never selects `*`, never uses the
 *      service role, the UI/renderer imports no Supabase/DAL/services, no unsafe raw-HTML path
 *      exists (no dangerouslySetInnerHTML / rehype-raw / marked / DOMPurify / innerHTML), and no
 *      admin legal route was added.
 */

// --- Layer 1: live DB anon boundary ---------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-205 legal anon read boundary (live DB)', () => {
  test('anon cannot read a draft legal page (shared seed: seed-terms is draft)', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.legal_pages where slug = 'seed-terms';`,
    })
    expect(r.ok).toBe(true)
    expect(r.out).toBe('0')
  })

  test('anon cannot read any non-published legal page', () => {
    const r = asRole({
      role: 'anon',
      query: `select count(*) from public.legal_pages where status in ('draft','archived');`,
    })
    expect(r.out).toBe('0')
  })

  test('anon reads only published legal pages (shared seed: seed-privacy)', () => {
    const r = asRole({
      role: 'anon',
      query: `select status from public.legal_pages;`,
    })
    // Whatever published rows exist, none is draft/archived.
    expect(r.out.split('\n').every((s) => s.trim() === 'published')).toBe(true)
  })
})

// --- Layer 2: sanitization (no DB) ----------------------------------------------

function renderMd(content: string): string {
  return renderToStaticMarkup(createElement(SafeMarkdown, { content }))
}

describe('AURA-205 safe Markdown renderer neutralizes unsafe HTML (D-12)', () => {
  test('script / iframe / event handlers / javascript: URLs do not survive', () => {
    const dirty =
      '# Heading\n\n<script>alert(1)</script>\n\n<iframe src="https://evil"></iframe>\n\n' +
      '<button onclick="alert(2)">x</button>\n\n[bad](javascript:alert(3))'
    const html = renderMd(dirty)

    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/<iframe/i)
    expect(html).not.toMatch(/<button/i)
    expect(html).not.toMatch(/<[a-z][^>]*\son[a-z]+=/i)
    expect(html).not.toContain('javascript:')
    // The safe Markdown around it still renders.
    expect(html).toMatch(/<h1/i)
  })
})

// --- Layer 3: static code guarantees (no DB) ------------------------------------

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8')
}

/** Strip block + line comments so assertions target executable code only, not prose. */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

const LEGAL_DAL = 'src/dal/legal.dal.ts'
const LEGAL_ROUTE = 'src/app/api/legal/[slug]/route.ts'
const LEGAL_DOMAIN = ['src/domain/legal/legal-page.ts']
const LEGAL_COMPONENTS = [
  'src/components/legal/SafeMarkdown.tsx',
  'src/components/legal/LegalPageView.tsx',
]
const LEGAL_PAGES = ['src/app/[locale]/privacy/page.tsx', 'src/app/[locale]/terms/page.tsx']

const ALL_LEGAL_FILES = [
  LEGAL_DAL,
  LEGAL_ROUTE,
  ...LEGAL_DOMAIN,
  ...LEGAL_COMPONENTS,
  ...LEGAL_PAGES,
]

/** Forbidden unsafe-HTML tokens. NOTE: `rehype-sanitize` is REQUIRED and intentionally allowed. */
const UNSAFE_HTML_TOKENS = [
  'dangerouslySetInnerHTML',
  'rehypeRaw',
  'rehype-raw',
  'marked',
  'DOMPurify',
  'innerHTML',
]

describe('AURA-205 legal code never selects * and never uses the service role', () => {
  test.each(ALL_LEGAL_FILES)('%s never uses select("*")', (file) => {
    expect(codeOnly(readSrc(file))).not.toMatch(/select\(\s*['"`]\*['"`]/)
  })

  test.each(ALL_LEGAL_FILES)('%s never references the service role', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code, `${file} must not reference service-role`).not.toMatch(/service-role/i)
    expect(code).not.toContain('getSupabaseServiceRole')
    expect(code, `${file} must not reference SERVICE_ROLE`).not.toMatch(/SERVICE_ROLE/i)
  })
})

describe('AURA-205 DAL uses the anon client and re-asserts published-only', () => {
  const dal = codeOnly(readSrc(LEGAL_DAL))

  test('uses the anon server client', () => {
    expect(dal).toContain('createSupabaseServerClient')
  })

  test('re-asserts published-only in code (defence in depth over RLS)', () => {
    expect(dal).toContain("'published'")
  })

  test('queries only legal_pages', () => {
    const fromTargets = [...dal.matchAll(/\.from\(\s*['"`]([a-z_]+)['"`]/g)].map((m) => m[1])
    expect(fromTargets).toEqual(['legal_pages'])
  })
})

describe('AURA-205 no unsafe raw-HTML path exists (D-12)', () => {
  test.each(ALL_LEGAL_FILES)('%s contains no unsafe HTML token', (file) => {
    const code = codeOnly(readSrc(file))
    for (const token of UNSAFE_HTML_TOKENS) {
      expect(code, `${file} must not reference ${token}`).not.toContain(token)
    }
  })

  test('the renderer uses react-markdown + rehype-sanitize', () => {
    const renderer = readSrc('src/components/legal/SafeMarkdown.tsx')
    expect(renderer).toContain('react-markdown')
    expect(renderer).toContain('rehype-sanitize')
  })
})

describe('AURA-205 domain stays pure (no React/Supabase/DAL)', () => {
  test.each(LEGAL_DOMAIN)('%s imports no React/Supabase/DAL', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code).not.toMatch(/from 'react'/)
    expect(code).not.toMatch(/@supabase/)
    expect(code).not.toMatch(/@\/lib\/supabase/)
    expect(code).not.toMatch(/@\/dal\//)
  })
})

describe('AURA-205 UI/renderer imports no Supabase / DAL / services', () => {
  test.each(LEGAL_COMPONENTS)('%s has no forbidden import', (file) => {
    const code = codeOnly(readSrc(file))
    expect(code).not.toMatch(/@supabase/)
    expect(code).not.toMatch(/@\/lib\/supabase/)
    expect(code).not.toMatch(/@\/dal\//)
    expect(code).not.toMatch(/@\/services\//)
    expect(code).not.toMatch(/service-role/i)
  })
})

describe('AURA-205 stays in scope (no admin legal / extra routes added)', () => {
  test('legal route only handles GET and references no admin work', () => {
    const route = codeOnly(readSrc(LEGAL_ROUTE))
    expect(route).toContain('export async function GET')
    expect(route).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)/)
    expect(route).not.toMatch(/admin/i)
  })

  test('no admin legal route directories exist', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/api/admin/legal'))).toBe(false)
    // The admin UI surface (src/app/admin) is introduced by AURA-301 (login only); legal
    // admin is AURA-307. Assert no legal admin route was added here.
    expect(existsSync(resolve(process.cwd(), 'src/app/admin/legal'))).toBe(false)
  })

  test('no /legal index route directory was created', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app/[locale]/legal'))).toBe(false)
  })
})
