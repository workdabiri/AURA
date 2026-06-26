import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { toLegalPageDTO, type PublicLegalPageRow } from '@/domain/legal/legal-page'

/**
 * AURA-205 — live-DB contract test for the public legal page DAL (published-only reads).
 *
 * The DAL (`src/dal/legal.dal.ts`) is `server-only` and uses request-scoped cookies, so it cannot
 * be imported into Vitest. Instead — exactly like the AURA-202/203/204 DAL tests — this proves the
 * SAME guarantees the DAL relies on, run as the `anon` role against the live schema inside
 * `begin … rollback` (nothing is committed):
 *   - anon sees ONLY published legal pages (draft/archived hidden by RLS);
 *   - the public column subset (slug, title, content, effective_date) projects correctly and
 *     never carries id/status/version/last_updated_by/timestamps into the DTO;
 *   - `content` survives as raw Markdown (rendered safely at the render layer, not here).
 *
 * Gated by SUPABASE_LOCAL_TESTS=1 (CI Dockerized stack, AURA-107):
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const PRIV_PUB = '0d000000-0000-0000-0000-0000000000a1'
const TERMS_PUB = '0d000000-0000-0000-0000-0000000000a2'
const PRIV_DRAFT = '0d000000-0000-0000-0000-0000000000d1'
const TERMS_ARCH = '0d000000-0000-0000-0000-0000000000e1'

/**
 * Seed (run as postgres, bypasses RLS). The partial unique index `legal_pages_slug_published_key`
 * allows a draft 'privacy' alongside the published 'privacy', and an archived 'terms' alongside
 * the published 'terms' — exactly the states anon RLS must discriminate.
 */
const SEED = `
insert into public.legal_pages (id, slug, title, content, effective_date, status, version) values
  ('${PRIV_PUB}', 'privacy', '{"en":"Privacy Policy"}'::jsonb,
   '{"en":"# Privacy\\n\\nWe respect your **data**."}'::jsonb, '2026-01-01', 'published', 1),
  ('${TERMS_PUB}', 'terms', '{"en":"Terms of Service"}'::jsonb,
   '{"en":"# Terms\\n\\nUse responsibly."}'::jsonb, '2026-02-01', 'published', 1),
  ('${PRIV_DRAFT}', 'privacy', '{"en":"Draft Privacy"}'::jsonb, '{"en":"hidden draft"}'::jsonb,
   '2026-03-01', 'draft', 2),
  ('${TERMS_ARCH}', 'terms', '{"en":"Old Terms"}'::jsonb, '{"en":"archived"}'::jsonb,
   '2025-01-01', 'archived', 1);
`

/** Run a measured query as the anon role (the DAL's read path). */
function anon(measured: string): string[] {
  return runScript([
    'begin;',
    SEED,
    'set local role anon;',
    "set local request.jwt.claims = '';",
    measured,
    'rollback;',
  ])
}

function runScript(lines: string[]): string[] {
  const out = execFileSync(
    'psql',
    [DB_URL, '-q', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', lines.join('\n')],
    { encoding: 'utf-8' }
  )
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

describe.skipIf(!LOCAL_TESTS)('AURA-205 legal page DAL (live DB)', () => {
  test('anon resolves the published privacy page by slug + published status', () => {
    expect(
      anon(`select slug from public.legal_pages where slug = 'privacy' and status = 'published';`)
    ).toEqual(['privacy'])
  })

  test('anon resolves the published terms page by slug + published status', () => {
    expect(
      anon(`select slug from public.legal_pages where slug = 'terms' and status = 'published';`)
    ).toEqual(['terms'])
  })

  test('anon cannot see any draft legal page (→ DAL returns null for it)', () => {
    expect(anon(`select count(*) from public.legal_pages where status = 'draft';`)).toEqual(['0'])
  })

  test('anon cannot see any archived legal page (→ DAL returns null for it)', () => {
    expect(anon(`select count(*) from public.legal_pages where status = 'archived';`)).toEqual([
      '0',
    ])
  })

  test('anon sees exactly one row per public slug (only the published one)', () => {
    expect(anon(`select count(*) from public.legal_pages where slug = 'privacy';`)).toEqual(['1'])
    expect(anon(`select count(*) from public.legal_pages where slug = 'terms';`)).toEqual(['1'])
  })

  test('a non-existent slug yields nothing (→ DAL returns null)', () => {
    expect(anon(`select count(*) from public.legal_pages where slug = 'cookies';`)).toEqual(['0'])
  })

  test('the public columns are anon-readable and the English JSONB extracts correctly', () => {
    // Read the public-safe columns as scalars (content collapsed to one line for the -A/-t
    // harness, which is line-oriented). This proves anon can read the exact subset the DAL
    // selects and that `->>'en'` resolves the English value, including raw Markdown markers.
    const [slug] = anon(
      `select slug from public.legal_pages where slug = 'privacy' and status = 'published';`
    )
    const [title] = anon(
      `select title->>'en' from public.legal_pages where slug = 'privacy' and status = 'published';`
    )
    const [effective] = anon(
      `select effective_date::text from public.legal_pages where slug = 'privacy' and status = 'published';`
    )
    const [content] = anon(
      `select replace(content->>'en', chr(10), ' ') from public.legal_pages where slug = 'privacy' and status = 'published';`
    )

    expect(slug).toBe('privacy')
    expect(title).toBe('Privacy Policy')
    expect(effective).toBe('2026-01-01')
    // Raw Markdown markers (`#`, `**`) survive — content is never pre-rendered to HTML.
    expect(content).toContain('# Privacy')
    expect(content).toContain('**data**')
  })

  test('the pure projector keeps only the public allowlist (no internal fields leak)', () => {
    // Feed a dirty row (extra internal fields) through the projector the DAL uses; the output
    // carries ONLY the four public keys, regardless of what the DB row contains.
    const row = {
      slug: 'privacy',
      title: { en: 'Privacy Policy' },
      content: { en: '# Privacy' },
      effective_date: '2026-01-01',
      id: 'uuid',
      status: 'published',
      version: 1,
      last_updated_by: 'admin',
      created_at: 'ts',
    } as unknown as PublicLegalPageRow
    const dto = toLegalPageDTO(row)

    expect(Object.keys(dto as object).sort()).toEqual(['content', 'effectiveDate', 'slug', 'title'])
    for (const internal of ['id', 'status', 'version', 'last_updated_by', 'created_at']) {
      expect(dto as object).not.toHaveProperty(internal)
    }
  })
})
