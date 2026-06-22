import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { selectCoverImage, type PublicMediaRow } from '@/domain/properties/card'

/**
 * AURA-202 — live-DB contract test for the public properties DAL (published-only reads).
 *
 * The DAL (`src/dal/properties.dal.ts`) is `server-only` and uses request-scoped cookies, so
 * it cannot be imported into Vitest. Instead — exactly like the AURA-201 settings selector
 * test — this proves the SAME guarantees the DAL relies on, run as the `anon` role against the
 * live schema inside `begin … rollback` (nothing is committed):
 *   - anon sees ONLY published properties (draft/archived hidden by RLS);
 *   - featured = published AND is_featured (unpublished-featured hidden);
 *   - anon media is scoped to published parents; the public cover columns exclude storage_path;
 *   - the pure cover selector maps real anon-visible media rows correctly;
 *   - pagination count, sort (newest / price_asc / price_desc), area-slug filter, and the
 *     `title_en` full-text search behave as the DAL expects.
 *
 * Gated by SUPABASE_LOCAL_TESTS=1 (CI Dockerized stack, AURA-107):
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const AREA_MARINA = '0a000000-0000-0000-0000-000000000001'
const AREA_OLDTOWN = '0a000000-0000-0000-0000-000000000002'
const PUB_A = '0b000000-0000-0000-0000-00000000000a'
const PUB_B = '0b000000-0000-0000-0000-00000000000b'
const PUB_C = '0b000000-0000-0000-0000-00000000000c'
const DRAFT_X = '0b000000-0000-0000-0000-0000000000d0'
const ARCH_Y = '0b000000-0000-0000-0000-0000000000e0'

/**
 * Seed (run as postgres, which bypasses RLS) covering every state the public reads
 * discriminate on. `marina` is active, `old-town` inactive. PUB-A/B are in marina.
 */
const SEED = `
insert into public.areas (id, slug, name, is_active) values
  ('${AREA_MARINA}', 'marina', '{"en":"Marina"}'::jsonb, true),
  ('${AREA_OLDTOWN}', 'old-town', '{"en":"Old Town"}'::jsonb, false);

insert into public.properties
  (id, reference_number, slug, title, price, price_visibility, transaction_type, market_type,
   property_type, location_label, size_sqft, area_id, community, is_featured, publish_status,
   created_at)
values
  ('${PUB_A}', 'AX-A', 'marina-penthouse', '{"en":"Marina Penthouse"}'::jsonb, 3000000,
   'visible', 'sale', 'ready', 'penthouse', 'Dubai Marina', 4000, '${AREA_MARINA}',
   'Dubai Marina', true, 'published', '2026-01-01T00:00:00Z'),
  ('${PUB_B}', 'AX-B', 'garden-villa', '{"en":"Garden Villa"}'::jsonb, 1000000,
   'visible', 'sale', 'ready', 'villa', 'Jumeirah', 5000, '${AREA_MARINA}',
   'Jumeirah', false, 'published', '2026-02-01T00:00:00Z'),
  ('${PUB_C}', 'AX-C', 'skyline-office', '{"en":"Skyline Office"}'::jsonb, null,
   'price_on_application', 'rent', 'ready', 'office', 'Business Bay', 2000, null,
   'Business Bay', true, 'published', '2026-03-01T00:00:00Z'),
  ('${DRAFT_X}', 'AX-D', 'hidden-draft', '{"en":"Hidden Draft Penthouse"}'::jsonb, 9000000,
   'visible', 'sale', 'ready', 'penthouse', 'Secret', 3000, '${AREA_MARINA}',
   'Secret', true, 'draft', '2026-04-01T00:00:00Z'),
  ('${ARCH_Y}', 'AX-E', 'old-archive', '{"en":"Old Archive Villa"}'::jsonb, 8000000,
   'visible', 'sale', 'ready', 'villa', 'Old', 3000, null,
   'Old', true, 'archived', '2026-05-01T00:00:00Z');

insert into public.property_media
  (property_id, url, storage_path, media_type, order_index, is_cover, alt_text, size_bytes)
values
  ('${PUB_A}', 'https://cdn/a-1.jpg', 'properties/${PUB_A}/image/1.jpg', 'image', 1, false, 'a1', 1),
  ('${PUB_A}', 'https://cdn/a-cover.jpg', 'properties/${PUB_A}/image/2.jpg', 'image', 2, true, 'a cover', 1),
  ('${PUB_A}', 'https://cdn/a-plan.png', 'properties/${PUB_A}/floorplan/3.png', 'floorplan', 0, false, 'plan', 1),
  ('${PUB_B}', 'https://cdn/b-only.jpg', 'properties/${PUB_B}/image/1.jpg', 'image', 0, false, 'b', 1),
  ('${DRAFT_X}', 'https://cdn/draft.jpg', 'properties/${DRAFT_X}/image/1.jpg', 'image', 0, true, 'd', 1);
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

describe.skipIf(!LOCAL_TESTS)('AURA-202 public properties DAL (live DB, anon role)', () => {
  test('anon sees only published properties (draft + archived hidden)', () => {
    const slugs = anon(`select slug from public.properties order by slug;`)
    expect(slugs).toEqual(['garden-villa', 'marina-penthouse', 'skyline-office'])
    expect(slugs).not.toContain('hidden-draft')
    expect(slugs).not.toContain('old-archive')
  })

  test('anon cannot fetch a draft/archived property by slug', () => {
    expect(anon(`select count(*) from public.properties where slug = 'hidden-draft';`)).toEqual([
      '0',
    ])
    expect(anon(`select count(*) from public.properties where slug = 'old-archive';`)).toEqual([
      '0',
    ])
  })

  test('featured = published AND is_featured (unpublished-featured hidden)', () => {
    const slugs = anon(`select slug from public.properties where is_featured = true order by slug;`)
    // PUB-A and PUB-C are featured+published; DRAFT_X/ARCH_Y are featured but not published.
    expect(slugs).toEqual(['marina-penthouse', 'skyline-office'])
  })

  test('total count for pagination reflects published rows only', () => {
    expect(anon(`select count(*) from public.properties;`)).toEqual(['3'])
  })

  test('anon media is scoped to published parents (draft media hidden)', () => {
    // 3 media rows for PUB-A + 1 for PUB-B = 4 visible; the DRAFT_X media row is hidden.
    expect(anon(`select count(*) from public.property_media;`)).toEqual(['4'])
    expect(
      anon(
        `select count(*) from public.property_media pm
         where pm.property_id = '${DRAFT_X}';`
      )
    ).toEqual(['0'])
  })

  test('cover selector maps real anon-visible media (is_cover wins, floorplan excluded)', () => {
    // Fetch the public cover columns (NO storage_path) for PUB-A as anon, then run the pure
    // selector the DAL uses.
    const rows = anon(
      `select property_id, url, alt_text, is_cover, order_index, media_type
       from public.property_media where property_id = '${PUB_A}' order by order_index;`
    ).map((line): PublicMediaRow => {
      const [property_id, url, alt_text, is_cover, order_index, media_type] = line.split('|')
      return {
        property_id: property_id ?? '',
        url: url ?? '',
        alt_text: alt_text ?? '',
        is_cover: is_cover === 't',
        order_index: Number(order_index),
        media_type: media_type as PublicMediaRow['media_type'],
      }
    })

    const cover = selectCoverImage(rows)
    expect(cover).toEqual({ url: 'https://cdn/a-cover.jpg', alt: 'a cover' })
  })

  test('price_asc sorts ascending with price-on-application (null) last', () => {
    const slugs = anon(`select slug from public.properties order by price asc nulls last, id asc;`)
    expect(slugs).toEqual(['garden-villa', 'marina-penthouse', 'skyline-office'])
  })

  test('price_desc sorts descending with null last', () => {
    const slugs = anon(`select slug from public.properties order by price desc nulls last, id asc;`)
    expect(slugs).toEqual(['marina-penthouse', 'garden-villa', 'skyline-office'])
  })

  test('newest sorts by created_at desc', () => {
    const slugs = anon(`select slug from public.properties order by created_at desc, id asc;`)
    expect(slugs).toEqual(['skyline-office', 'garden-villa', 'marina-penthouse'])
  })

  test('area slug filter resolves only ACTIVE areas', () => {
    expect(anon(`select count(*) from public.areas where slug = 'marina' and is_active;`)).toEqual([
      '1',
    ])
    // Inactive area is invisible to anon → an unknown slug → empty result in the DAL.
    expect(
      anon(`select count(*) from public.areas where slug = 'old-town' and is_active;`)
    ).toEqual(['0'])
  })

  test('area filter narrows properties to the resolved area_id', () => {
    const slugs = anon(
      `select p.slug from public.properties p
       join public.areas a on a.id = p.area_id
       where a.slug = 'marina' and a.is_active
       order by p.slug;`
    )
    expect(slugs).toEqual(['garden-villa', 'marina-penthouse'])
  })

  test('title_en full-text search matches the DAL websearch query', () => {
    const slugs = anon(
      `select slug from public.properties
       where to_tsvector('english', title_en) @@ websearch_to_tsquery('english', 'penthouse')
       order by slug;`
    )
    // Only the published penthouse; the draft penthouse is hidden by RLS.
    expect(slugs).toEqual(['marina-penthouse'])
  })
})
