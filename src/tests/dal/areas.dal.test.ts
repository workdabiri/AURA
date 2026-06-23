import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { toAreaCardDTO, type PublicAreaRow } from '@/domain/areas/area'

/**
 * AURA-204 — live-DB contract test for the public areas DAL (active-only reads).
 *
 * The DAL (`src/dal/areas.dal.ts`) is `server-only` and uses request-scoped cookies, so it
 * cannot be imported into Vitest. Instead — exactly like the AURA-202 DAL test — this proves
 * the SAME guarantees the DAL relies on, run as the `anon` role against the live schema inside
 * `begin … rollback` (nothing is committed):
 *   - anon sees ONLY active areas (inactive hidden by RLS);
 *   - fixed ordering: `sort_order ASC`, then `slug ASC`;
 *   - the public column subset (slug, name, description, image_url) projects correctly and
 *     never carries id/is_active/sort_order/timestamps into the DTO.
 *
 * Gated by SUPABASE_LOCAL_TESTS=1 (CI Dockerized stack, AURA-107):
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const AREA_MARINA = '0c000000-0000-0000-0000-000000000001'
const AREA_DOWNTOWN = '0c000000-0000-0000-0000-000000000002'
const AREA_PALM = '0c000000-0000-0000-0000-000000000003'
const AREA_HIDDEN = '0c000000-0000-0000-0000-000000000004'

/**
 * Seed (run as postgres, which bypasses RLS). Active areas use sort_order to exercise the
 * `sort_order ASC, slug ASC` tie-break: marina(1) < palm(2,'a-palm') == downtown(2,'b-downtown')
 * so the slug tie-break orders palm before downtown. `secret` is inactive.
 */
const SEED = `
insert into public.areas (id, slug, name, description, image_url, is_active, sort_order) values
  ('${AREA_MARINA}',   'marina',      '{"en":"Marina"}'::jsonb,   '{"en":"Waterfront"}'::jsonb, 'https://cdn/marina.jpg', true,  1),
  ('${AREA_PALM}',     'a-palm',      '{"en":"Palm"}'::jsonb,     '{}'::jsonb,                  null,                     true,  2),
  ('${AREA_DOWNTOWN}', 'b-downtown',  '{"en":"Downtown"}'::jsonb, '{"en":"Central"}'::jsonb,    null,                     true,  2),
  ('${AREA_HIDDEN}',   'secret',      '{"en":"Secret"}'::jsonb,   '{}'::jsonb,                  null,                     false, 0);
`

/** Run a measured query as the anon role inside a rolled-back transaction. */
function anon(measured: string): string[] {
  const script = [
    'begin;',
    SEED,
    'set local role anon;',
    "set local request.jwt.claims = '';",
    measured,
    'rollback;',
  ].join('\n')
  const out = execFileSync(
    'psql',
    [DB_URL, '-q', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', script],
    { encoding: 'utf-8' }
  )
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

describe.skipIf(!LOCAL_TESTS)('AURA-204 public areas DAL (live DB, anon role)', () => {
  test('anon sees only active areas (inactive hidden by RLS)', () => {
    const slugs = anon(`select slug from public.areas order by slug;`)
    expect(slugs).toEqual(['a-palm', 'b-downtown', 'marina'])
    expect(slugs).not.toContain('secret')
  })

  test('anon cannot read an inactive area by slug', () => {
    expect(anon(`select count(*) from public.areas where slug = 'secret';`)).toEqual(['0'])
  })

  test('fixed ordering: sort_order ASC, then slug ASC', () => {
    // Mirrors the DAL `.order('sort_order').order('slug')` clause.
    const slugs = anon(
      `select slug from public.areas where is_active = true
       order by sort_order asc, slug asc;`
    )
    expect(slugs).toEqual(['marina', 'a-palm', 'b-downtown'])
  })

  test('public column subset projects to the DTO and excludes internal fields', () => {
    // Fetch exactly the DAL column allowlist for an active area as anon, then run the projector.
    const rows = anon(
      `select slug, name::text, description::text, coalesce(image_url, '')
       from public.areas where slug = 'marina' and is_active = true;`
    ).map((line): PublicAreaRow => {
      const [slug, name, description, imageUrl] = line.split('|')
      return {
        slug: slug ?? '',
        name: JSON.parse(name ?? '{}'),
        description: JSON.parse(description ?? '{}'),
        image_url: imageUrl ? imageUrl : null,
      }
    })

    const dto = toAreaCardDTO(rows[0] as PublicAreaRow)
    expect(dto).toEqual({
      slug: 'marina',
      name: 'Marina',
      description: 'Waterfront',
      imageUrl: 'https://cdn/marina.jpg',
    })
    expect(Object.keys(dto).sort()).toEqual(['description', 'imageUrl', 'name', 'slug'])
  })
})
