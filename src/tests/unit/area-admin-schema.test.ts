import { describe, expect, test } from 'vitest'

import {
  areaCreateSchema,
  areaUpdateSchema,
  buildAreaImagePath,
  buildAreaUpdatePayload,
  ALLOWED_AREA_IMAGE_MIME_TYPES,
  AREA_IMAGE_BUCKET,
  AREA_IMAGE_MAX_BYTES,
} from '@/domain/areas/admin'

/**
 * AURA-305 — pure unit tests for the admin area write contract (no DB, no React, no I/O).
 *
 * Covers: create/update schema validation, slug grammar, the create defaults (sort_order/
 * is_active), the slug-immutability guarantee on update (PATCH excludes slug — both at the
 * schema layer and the payload-builder backstop), and the server-built UUID image path.
 */

const AREA_UUID = '0c000000-0000-0000-0000-000000000001'
const IMAGE_UUID = '0c000000-0000-0000-0000-0000000000a1'

describe('areaCreateSchema', () => {
  test('accepts a valid area and applies defaults (sort_order 0, is_active true)', () => {
    const parsed = areaCreateSchema.parse({
      slug: 'dubai-marina',
      name: { en: 'Dubai Marina' },
    })
    expect(parsed.slug).toBe('dubai-marina')
    expect(parsed.name.en).toBe('Dubai Marina')
    expect(parsed.sort_order).toBe(0)
    expect(parsed.is_active).toBe(true)
  })

  test('lowercases the slug and rejects an invalid slug grammar', () => {
    expect(areaCreateSchema.parse({ slug: 'Dubai-Marina', name: { en: 'X' } }).slug).toBe(
      'dubai-marina'
    )
    expect(areaCreateSchema.safeParse({ slug: 'bad slug!', name: { en: 'X' } }).success).toBe(false)
    expect(areaCreateSchema.safeParse({ slug: '-leading', name: { en: 'X' } }).success).toBe(false)
  })

  test('requires a non-empty English name', () => {
    expect(areaCreateSchema.safeParse({ slug: 'marina', name: { en: '' } }).success).toBe(false)
    expect(areaCreateSchema.safeParse({ slug: 'marina' }).success).toBe(false)
  })

  test('accepts an optional description and an explicit is_active=false / sort_order', () => {
    const parsed = areaCreateSchema.parse({
      slug: 'palm',
      name: { en: 'Palm' },
      description: { en: 'Iconic island' },
      sort_order: 5,
      is_active: false,
    })
    expect(parsed.description).toEqual({ en: 'Iconic island' })
    expect(parsed.sort_order).toBe(5)
    expect(parsed.is_active).toBe(false)
  })

  test('rejects a negative sort_order', () => {
    expect(
      areaCreateSchema.safeParse({ slug: 'm', name: { en: 'M' }, sort_order: -1 }).success
    ).toBe(false)
  })
})

describe('areaUpdateSchema — slug is excluded (immutable after create)', () => {
  test('all fields optional; a lone is_active toggle is valid', () => {
    expect(areaUpdateSchema.parse({ is_active: false })).toEqual({ is_active: false })
  })

  test('a slug provided in a PATCH body is stripped by the schema', () => {
    const parsed = areaUpdateSchema.parse({
      slug: 'attempted-new-slug',
      name: { en: 'Renamed' },
    } as Record<string, unknown>)
    expect('slug' in parsed).toBe(false)
    expect(parsed.name).toEqual({ en: 'Renamed' })
  })
})

describe('buildAreaUpdatePayload — immutability backstop', () => {
  test('strips slug / image_url / id / timestamps even if present', () => {
    const out = buildAreaUpdatePayload({
      slug: 'hacked',
      image_url: 'https://evil/x.jpg',
      id: 'x',
      created_at: 't',
      updated_at: 't',
      name: { en: 'Keep' },
      sort_order: 3,
    })
    expect(out).toEqual({ name: { en: 'Keep' }, sort_order: 3 })
  })

  test('skips undefined fields (partial patch leaves them untouched)', () => {
    expect(buildAreaUpdatePayload({ is_active: true, name: undefined })).toEqual({
      is_active: true,
    })
  })
})

describe('buildAreaImagePath — server-built UUID path', () => {
  test('builds areas/{areaId}/{imageId}.{ext} with a MIME-derived extension', () => {
    expect(
      buildAreaImagePath({ areaId: AREA_UUID, imageId: IMAGE_UUID, mimeType: 'image/jpeg' })
    ).toBe(`areas/${AREA_UUID}/${IMAGE_UUID}.jpg`)
    expect(
      buildAreaImagePath({ areaId: AREA_UUID, imageId: IMAGE_UUID, mimeType: 'image/webp' })
    ).toBe(`areas/${AREA_UUID}/${IMAGE_UUID}.webp`)
  })

  test('throws on a non-UUID component (no traversal / slash injection)', () => {
    expect(() =>
      buildAreaImagePath({ areaId: '../etc', imageId: IMAGE_UUID, mimeType: 'image/png' })
    ).toThrow()
    expect(() =>
      buildAreaImagePath({ areaId: AREA_UUID, imageId: 'a/b', mimeType: 'image/png' })
    ).toThrow()
  })

  test('rejects an unsupported MIME type', () => {
    expect(() =>
      buildAreaImagePath({
        areaId: AREA_UUID,
        imageId: IMAGE_UUID,
        mimeType: 'image/gif' as never,
      })
    ).toThrow()
  })
})

describe('area image constants reuse the AURA-105 media contract', () => {
  test('bucket / size / MIME match the property-media contract', () => {
    expect(AREA_IMAGE_BUCKET).toBe('property-media')
    expect(AREA_IMAGE_MAX_BYTES).toBe(10_485_760)
    expect([...ALLOWED_AREA_IMAGE_MIME_TYPES]).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })
})
