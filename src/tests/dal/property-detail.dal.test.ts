import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { selectDetailMedia, type PublicDetailMediaRow } from '@/domain/properties/detail'

/**
 * AURA-203 — live-DB contract test for the public property detail DAL.
 *
 * The DAL (`src/dal/property-detail.dal.ts`) is `server-only` + request-scoped, so it cannot be
 * imported into Vitest. Instead — exactly like the AURA-202 listing DAL test — this proves the
 * SAME guarantees the DAL relies on, run inside `begin … rollback` (nothing is committed):
 *   - property + media reads as the `anon` role (RLS published-only, the DAL's read path);
 *   - the public-stakeholder safe selector as the service role (RLS bypass) with the DAL's exact
 *     filter (`property_id` + `visibility='public'`) projecting `name,type` only;
 *   - draft/archived/unknown slugs are invisible to anon → the DAL returns null;
 *   - a public stakeholder on an UNPUBLISHED property is never exposed, because the anon property
 *     fetch returns nothing first (so the selector is never invoked for it).
 *
 * Gated by SUPABASE_LOCAL_TESTS=1 (CI Dockerized stack, AURA-107):
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const PUB = '0c000000-0000-0000-0000-0000000000a1'
const PUB_OFF = '0c000000-0000-0000-0000-0000000000a2'
const DRAFT = '0c000000-0000-0000-0000-0000000000d1'
const ARCH = '0c000000-0000-0000-0000-0000000000e1'

/** Seed (run as postgres, bypasses RLS) covering every state the detail reads discriminate on. */
const SEED = `
insert into public.properties
  (id, reference_number, slug, title, description, transaction_type, market_type, property_type,
   location_label, size_sqft, publish_status, agent_whatsapp)
values
  ('${PUB}', 'AX-DET-1', 'detail-villa', '{"en":"Detail Villa"}'::jsonb, '{"en":"Nice villa"}'::jsonb,
   'sale', 'ready', 'villa', 'Palm Jumeirah', 6000, 'published', '+971500000001'),
  ('${PUB_OFF}', 'AX-DET-2', 'detail-offplan', '{"en":"Off Plan Tower"}'::jsonb, '{}'::jsonb,
   'sale', 'off_plan', 'apartment', 'Downtown', 900, 'published', null),
  ('${DRAFT}', 'AX-DET-3', 'detail-draft', '{"en":"Hidden Draft"}'::jsonb, '{}'::jsonb,
   'sale', 'ready', 'villa', 'Secret', 1000, 'draft', null),
  ('${ARCH}', 'AX-DET-4', 'detail-arch', '{"en":"Old Archive"}'::jsonb, '{}'::jsonb,
   'sale', 'ready', 'villa', 'Old', 1000, 'archived', null);

insert into public.property_media
  (property_id, url, storage_path, media_type, order_index, is_cover, alt_text, size_bytes)
values
  ('${PUB}', 'https://cdn/cover.jpg', 'media/${PUB}/cover.jpg', 'image', 1, true, 'cover', 1),
  ('${PUB}', 'https://cdn/photo.jpg', 'media/${PUB}/photo.jpg', 'image', 2, false, 'photo', 1),
  ('${PUB}', 'https://cdn/plan.png', 'media/${PUB}/plan.png', 'floorplan', 0, false, 'plan', 1),
  ('${DRAFT}', 'https://cdn/draft.jpg', 'media/${DRAFT}/d.jpg', 'image', 0, true, 'd', 1);

insert into public.property_stakeholders
  (property_id, name, type, phone, email, whatsapp, registration_or_license, internal_notes, visibility)
values
  ('${PUB}', 'Public Dev', 'developer', '+9715', 'dev@x.com', '+9715', 'LIC-1', 'secret', 'public'),
  ('${PUB}', 'Secret Owner', 'owner', '+9716', 'owner@x.com', '+9716', 'LIC-2', 'hidden', 'internal_only'),
  ('${DRAFT}', 'Draft Public Dev', 'developer', null, null, null, null, null, 'public');
`

/** Run a measured query as the anon role (the DAL's property/media read path). */
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

/** Run a measured query as postgres (RLS bypass — models the service-role stakeholder selector). */
function serviceRole(measured: string): string[] {
  return runScript(['begin;', SEED, measured, 'rollback;'])
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

describe.skipIf(!LOCAL_TESTS)('AURA-203 property detail DAL (live DB)', () => {
  test('anon resolves a published property by slug', () => {
    expect(anon(`select slug from public.properties where slug = 'detail-villa';`)).toEqual([
      'detail-villa',
    ])
  })

  test('anon cannot resolve a draft property by slug (→ DAL returns null)', () => {
    expect(anon(`select count(*) from public.properties where slug = 'detail-draft';`)).toEqual([
      '0',
    ])
  })

  test('anon cannot resolve an archived property by slug (→ DAL returns null)', () => {
    expect(anon(`select count(*) from public.properties where slug = 'detail-arch';`)).toEqual([
      '0',
    ])
  })

  test('anon cannot resolve an unknown slug (→ DAL returns null)', () => {
    expect(anon(`select count(*) from public.properties where slug = 'does-not-exist';`)).toEqual([
      '0',
    ])
  })

  test('anon reads the published media gallery (images + floorplan), ordered', () => {
    const types = anon(
      `select media_type from public.property_media where property_id = '${PUB}' order by order_index;`
    )
    // plan(order 0, floorplan), cover(order 1, image), photo(order 2, image)
    expect(types).toEqual(['floorplan', 'image', 'image'])
  })

  test('the pure media selector orders cover-first and exposes no storage_path', () => {
    const rows = anon(
      `select property_id, url, alt_text, media_type, is_cover, order_index, coalesce(width::text,''), coalesce(height::text,'')
       from public.property_media where property_id = '${PUB}' order by order_index;`
    ).map((line): PublicDetailMediaRow => {
      const [property_id, url, alt_text, media_type, is_cover, order_index, width, height] =
        line.split('|')
      return {
        property_id: property_id ?? '',
        url: url ?? '',
        alt_text: alt_text ?? '',
        media_type: media_type as PublicDetailMediaRow['media_type'],
        is_cover: is_cover === 't',
        order_index: Number(order_index),
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
      }
    })
    const out = selectDetailMedia(rows)
    expect(out[0]?.url).toBe('https://cdn/cover.jpg')
    expect(out.map((m) => m.mediaType)).toEqual(['image', 'floorplan', 'image'])
    for (const item of out) {
      expect(Object.keys(item)).not.toContain('storage_path')
    }
  })

  test('service-role stakeholder selector returns only public name+type (internal_only excluded)', () => {
    const rows = serviceRole(
      `select name || '|' || type from public.property_stakeholders
       where property_id = '${PUB}' and visibility = 'public' order by name;`
    )
    expect(rows).toEqual(['Public Dev|developer'])
  })

  test('the published property has a hidden internal_only stakeholder that the selector skips', () => {
    expect(
      serviceRole(`select count(*) from public.property_stakeholders where property_id = '${PUB}';`)
    ).toEqual(['2'])
    expect(
      serviceRole(
        `select count(*) from public.property_stakeholders where property_id = '${PUB}' and visibility = 'public';`
      )
    ).toEqual(['1'])
  })

  test('a public stakeholder on a DRAFT property is never reached (anon property fetch is null first)', () => {
    // The selector itself (service role) would return it if invoked with the draft id...
    expect(
      serviceRole(
        `select count(*) from public.property_stakeholders where property_id = '${DRAFT}' and visibility = 'public';`
      )
    ).toEqual(['1'])
    // ...but the DAL never invokes it for a draft, because the anon property fetch returns nothing.
    expect(anon(`select count(*) from public.properties where slug = 'detail-draft';`)).toEqual([
      '0',
    ])
  })

  test('off-plan market_type is readable only for the off-plan property', () => {
    expect(
      anon(`select market_type from public.properties where slug = 'detail-offplan';`)
    ).toEqual(['off_plan'])
    expect(anon(`select market_type from public.properties where slug = 'detail-villa';`)).toEqual([
      'ready',
    ])
  })

  test('anon can read the contact override field used for routing (agent_whatsapp)', () => {
    expect(
      anon(`select agent_whatsapp from public.properties where slug = 'detail-villa';`)
    ).toEqual(['+971500000001'])
  })
})
