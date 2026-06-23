import { describe, expect, test } from 'vitest'

import { extractEn, toAreaCardDTO, type PublicAreaRow } from '@/domain/areas/area'

/**
 * AURA-204 — unit tests for the pure public area DTO projector (no DB, no I/O).
 *
 * Proves: English extraction from i18n JSONB, empty/missing/invalid fallback to '', exact DTO
 * shape, and that extra/internal fields are structurally dropped (id, is_active, sort_order,
 * created_at, updated_at, raw JSONB, property-derived data never leave the boundary).
 */

describe('extractEn', () => {
  test('returns the English value from an i18n JSONB object', () => {
    expect(extractEn({ en: 'Dubai Marina', ar: 'دبي مارينا' })).toBe('Dubai Marina')
  })

  test('returns empty string when the `en` key is absent', () => {
    expect(extractEn({ ar: 'دبي مارينا' })).toBe('')
    expect(extractEn({})).toBe('')
  })

  test('returns empty string for missing/invalid JSONB (null, undefined, array, primitive)', () => {
    expect(extractEn(null)).toBe('')
    expect(extractEn(undefined)).toBe('')
    expect(extractEn([])).toBe('')
    expect(extractEn(['en'])).toBe('')
    expect(extractEn('Marina')).toBe('')
    expect(extractEn(42)).toBe('')
  })

  test('returns empty string when `en` is present but not a string', () => {
    expect(extractEn({ en: 123 })).toBe('')
    expect(extractEn({ en: null })).toBe('')
  })
})

describe('toAreaCardDTO', () => {
  test('projects exactly slug, name, description, imageUrl', () => {
    const dto = toAreaCardDTO({
      slug: 'marina',
      name: { en: 'Marina' },
      description: { en: 'Waterfront living.' },
      image_url: 'https://cdn/marina.jpg',
    })

    expect(dto).toEqual({
      slug: 'marina',
      name: 'Marina',
      description: 'Waterfront living.',
      imageUrl: 'https://cdn/marina.jpg',
    })
  })

  test('maps a null image_url to imageUrl: null', () => {
    const dto = toAreaCardDTO({
      slug: 'old-town',
      name: { en: 'Old Town' },
      description: {},
      image_url: null,
    })
    expect(dto.imageUrl).toBeNull()
    expect(dto.description).toBe('')
  })

  test('structurally drops extra/internal fields and raw JSONB', () => {
    // Simulate a row that carries forbidden columns (e.g. from a future `select` mistake).
    const rowWithExtras = {
      slug: 'marina',
      name: { en: 'Marina' },
      description: { en: 'Desc' },
      image_url: null,
      id: 'uuid-1234',
      is_active: true,
      sort_order: 3,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
      property_count: 99,
    } as unknown as PublicAreaRow

    const dto = toAreaCardDTO(rowWithExtras)

    expect(Object.keys(dto).sort()).toEqual(['description', 'imageUrl', 'name', 'slug'])
    const leaked = dto as unknown as Record<string, unknown>
    expect(leaked.id).toBeUndefined()
    expect(leaked.isActive).toBeUndefined()
    expect(leaked.is_active).toBeUndefined()
    expect(leaked.sortOrder).toBeUndefined()
    expect(leaked.sort_order).toBeUndefined()
    expect(leaked.createdAt).toBeUndefined()
    expect(leaked.created_at).toBeUndefined()
    expect(leaked.updatedAt).toBeUndefined()
    expect(leaked.updated_at).toBeUndefined()
    expect(leaked.propertyCount).toBeUndefined()
    expect(leaked.property_count).toBeUndefined()
    // name/description are extracted strings, never the raw JSONB objects.
    expect(typeof dto.name).toBe('string')
    expect(typeof dto.description).toBe('string')
  })
})
