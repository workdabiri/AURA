import { describe, expect, test } from 'vitest'

import { asRole, CLIENT_ADMIN_ID, LOCAL_TESTS, SUPER_ADMIN_ID } from '../security/rls-test-utils'

/**
 * AURA-304 — live `property_media` RLS for the admin media lifecycle (gated).
 *
 * Requires SUPABASE_LOCAL_TESTS=1 + a running local stack (wired into CI by AURA-107); skipped
 * otherwise so CI never depends on a stack it lacks. Proves the table-level guarantees the media
 * DAL relies on (the DAL runs under the caller's own admin session — NO service role):
 *   - admins (super_admin + client_admin) can INSERT / UPDATE / DELETE media;
 *   - anon can do NONE of those;
 *   - anon can SELECT media ONLY when the parent property is published (draft media stays hidden);
 *   - admins can SELECT media of any status.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const PUB_MEDIA_ID = (slug: string) =>
  `(select pm.id from public.property_media pm join public.properties p on p.id = pm.property_id where p.slug = '${slug}' limit 1)`

const PROP_ID = (slug: string) => `(select id from public.properties where slug = '${slug}')`

describe.skipIf(!LOCAL_TESTS)('AURA-304 property_media RLS — public reads', () => {
  test('anon SEES media of a PUBLISHED property', () => {
    const r = asRole({
      role: 'anon',
      query:
        "select count(*) from public.property_media pm join public.properties p on p.id = pm.property_id where p.slug = 'seed-pub';",
    })
    expect(r.out).toBe('1')
  })

  test('anon does NOT see media of a DRAFT property', () => {
    const r = asRole({
      role: 'anon',
      query:
        "select count(*) from public.property_media pm join public.properties p on p.id = pm.property_id where p.slug = 'seed-draft';",
    })
    expect(r.out).toBe('0')
  })

  test('admin sees media of a DRAFT property', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query:
        "select count(*) from public.property_media pm join public.properties p on p.id = pm.property_id where p.slug = 'seed-draft';",
    })
    expect(r.out).toBe('1')
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-304 property_media RLS — admin writes', () => {
  const insertFor = (slug: string) =>
    `insert into public.property_media (property_id, url, storage_path, media_type, size_bytes) ` +
    `values (${PROP_ID(slug)}, 'https://x/y', 'properties/x/image/z.jpg', 'image', 1);`

  test('super_admin CAN insert media', () => {
    expect(
      asRole({ role: 'authenticated', sub: SUPER_ADMIN_ID, query: insertFor('seed-pub') }).ok
    ).toBe(true)
  })

  test('client_admin CAN insert media', () => {
    expect(
      asRole({ role: 'authenticated', sub: CLIENT_ADMIN_ID, query: insertFor('seed-pub') }).ok
    ).toBe(true)
  })

  test('admin CAN update media (e.g. set is_cover)', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: `update public.property_media set is_cover = true where id = ${PUB_MEDIA_ID('seed-pub')};`,
    })
    expect(r.ok).toBe(true)
  })

  test('admin CAN delete media', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: `delete from public.property_media where id = ${PUB_MEDIA_ID('seed-pub')};`,
    })
    expect(r.ok).toBe(true)
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-304 property_media RLS — anon cannot mutate', () => {
  test('anon CANNOT insert media', () => {
    const r = asRole({
      role: 'anon',
      query:
        `insert into public.property_media (property_id, url, storage_path, media_type, size_bytes) ` +
        `values (${PROP_ID('seed-pub')}, 'https://x/y', 'p/x/image/z.jpg', 'image', 1);`,
    })
    expect(r.ok).toBe(false)
  })

  test('anon CANNOT update media', () => {
    const r = asRole({
      role: 'anon',
      query: `update public.property_media set is_cover = true where id = ${PUB_MEDIA_ID('seed-pub')};`,
    })
    expect(r.ok).toBe(false)
  })

  test('anon CANNOT delete media', () => {
    const r = asRole({
      role: 'anon',
      query: `delete from public.property_media where id = ${PUB_MEDIA_ID('seed-pub')};`,
    })
    expect(r.ok).toBe(false)
  })
})
