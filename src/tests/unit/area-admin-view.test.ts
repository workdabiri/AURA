import { describe, expect, test } from 'vitest'

import {
  extractEn,
  toAdminAreaDetail,
  toAdminAreaListItem,
  type AdminAreaRow,
} from '@/domain/areas/admin-view'

/**
 * AURA-305 — pure unit tests for the admin area read projections (no DB, no React).
 *
 * Covers: i18n extraction, the list-item DTO mapping with admin-only property counts, and the
 * edit-form DTO mapping. Internal-only behaviour is structural (the projector reads only the
 * allowlisted keys).
 */

const ROW: AdminAreaRow = {
  id: '0c000000-0000-0000-0000-000000000001',
  slug: 'dubai-marina',
  name: { en: 'Dubai Marina' },
  description: { en: 'Waterfront living' },
  image_url: 'https://cdn/marina.jpg',
  is_active: true,
  sort_order: 2,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-29T00:00:00Z',
}

describe('extractEn', () => {
  test('reads the English value or falls back to empty string', () => {
    expect(extractEn({ en: 'Hi' })).toBe('Hi')
    expect(extractEn({})).toBe('')
    expect(extractEn(null)).toBe('')
    expect(extractEn(['x'])).toBe('')
  })
})

describe('toAdminAreaListItem', () => {
  test('maps fields and the supplied property counts', () => {
    const dto = toAdminAreaListItem(ROW, { totalProperties: 5, publishedProperties: 3 })
    expect(dto).toEqual({
      id: ROW.id,
      slug: 'dubai-marina',
      name: 'Dubai Marina',
      description: 'Waterfront living',
      imageUrl: 'https://cdn/marina.jpg',
      isActive: true,
      sortOrder: 2,
      totalProperties: 5,
      publishedProperties: 3,
      updatedAt: '2026-06-29T00:00:00Z',
    })
  })

  test('defaults counts to zero when an area has no linked properties', () => {
    const dto = toAdminAreaListItem(ROW, { totalProperties: 0, publishedProperties: 0 })
    expect(dto.totalProperties).toBe(0)
    expect(dto.publishedProperties).toBe(0)
  })
})

describe('toAdminAreaDetail', () => {
  test('maps editable fields with i18n kept as { en } and no counts', () => {
    const dto = toAdminAreaDetail({ ...ROW, is_active: false, image_url: null })
    expect(dto).toEqual({
      id: ROW.id,
      slug: 'dubai-marina',
      name: { en: 'Dubai Marina' },
      description: { en: 'Waterfront living' },
      imageUrl: null,
      isActive: false,
      sortOrder: 2,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-29T00:00:00Z',
    })
  })
})
