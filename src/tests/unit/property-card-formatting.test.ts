import { describe, expect, test } from 'vitest'

import {
  resolveCoversByProperty,
  selectCoverImage,
  toPropertyCardDTO,
  type PublicMediaRow,
  type PublicPropertyRow,
} from '@/domain/properties/card'
import { formatAedAmount, resolvePriceDisplay } from '@/domain/properties/format'

/**
 * AURA-202 — unit tests for public price/AED formatting + DTO projection (pure, no DB).
 */
describe('formatAedAmount', () => {
  test('groups thousands', () => {
    expect(formatAedAmount(0)).toBe('0')
    expect(formatAedAmount(1000)).toBe('1,000')
    expect(formatAedAmount(1234567)).toBe('1,234,567')
  })

  test('rounds fractional amounts', () => {
    expect(formatAedAmount(1234.6)).toBe('1,235')
  })
})

describe('resolvePriceDisplay (AED-only A-11, D-48)', () => {
  test('visible price renders an AED amount', () => {
    const d = resolvePriceDisplay({ price: 2500000, priceVisibility: 'visible', currency: 'AED' })
    expect(d).toEqual({
      kind: 'amount',
      currency: 'AED',
      amount: 2500000,
      formatted: 'AED 2,500,000',
    })
  })

  test('price_on_application renders as on-application regardless of a stored price', () => {
    const d = resolvePriceDisplay({
      price: 999,
      priceVisibility: 'price_on_application',
      currency: 'AED',
    })
    expect(d).toEqual({ kind: 'on_application' })
  })

  test('a null price renders as on-application', () => {
    const d = resolvePriceDisplay({ price: null, priceVisibility: 'visible', currency: 'AED' })
    expect(d).toEqual({ kind: 'on_application' })
  })
})

const baseRow: PublicPropertyRow = {
  id: 'p1',
  slug: 'sea-view-villa',
  reference_number: 'AX-001',
  title_en: 'Sea View Villa',
  location_label: 'Palm Jumeirah',
  community: 'Palm Jumeirah',
  price: 5000000,
  currency: 'AED',
  price_visibility: 'visible',
  transaction_type: 'sale',
  market_type: 'ready',
  property_type: 'villa',
  availability_status: 'available',
  bedrooms: 4,
  bathrooms: 5,
  size_sqft: 6000,
  is_featured: true,
}

describe('toPropertyCardDTO — projection', () => {
  test('maps allowlisted fields and attaches cover', () => {
    const dto = toPropertyCardDTO(baseRow, { url: 'https://cdn/x.jpg', alt: 'front' })
    expect(dto).toEqual({
      id: 'p1',
      slug: 'sea-view-villa',
      referenceNumber: 'AX-001',
      title: 'Sea View Villa',
      locationLabel: 'Palm Jumeirah',
      community: 'Palm Jumeirah',
      price: 5000000,
      currency: 'AED',
      priceVisibility: 'visible',
      transactionType: 'sale',
      marketType: 'ready',
      propertyType: 'villa',
      availabilityStatus: 'available',
      bedrooms: 4,
      bathrooms: 5,
      sizeSqft: 6000,
      isFeatured: true,
      coverImage: { url: 'https://cdn/x.jpg', alt: 'front' },
    })
  })

  test('null title_en projects to empty string', () => {
    const dto = toPropertyCardDTO({ ...baseRow, title_en: null }, null)
    expect(dto.title).toBe('')
    expect(dto.coverImage).toBeNull()
  })

  test('drops sensitive fields even if present on the raw row (defence in depth)', () => {
    const polluted = {
      ...baseRow,
      address: '17 Private Road',
      external_map_url: 'https://maps/x',
      agent_name: 'Agent Smith',
      agent_phone: '+971500000000',
      agent_whatsapp: '+971500000000',
      agent_email: 'agent@x.com',
      internal_notes: 'secret',
      storage_path: 'properties/p1/image/abc.jpg',
      created_by: 'admin-1',
      updated_by: 'admin-2',
      views_count: 42,
      description: { en: 'long description' },
    } as unknown as PublicPropertyRow

    const dto = toPropertyCardDTO(polluted, null)
    const keys = Object.keys(dto)
    for (const forbidden of [
      'address',
      'external_map_url',
      'agent_name',
      'agent_phone',
      'agent_whatsapp',
      'agent_email',
      'internal_notes',
      'storage_path',
      'created_by',
      'updated_by',
      'views_count',
      'description',
    ]) {
      expect(keys).not.toContain(forbidden)
    }
  })
})

describe('selectCoverImage / resolveCoversByProperty', () => {
  const media = (over: Partial<PublicMediaRow>): PublicMediaRow => ({
    property_id: 'p1',
    url: 'https://cdn/default.jpg',
    alt_text: 'alt',
    is_cover: false,
    order_index: 0,
    media_type: 'image',
    ...over,
  })

  test('prefers an is_cover image', () => {
    const cover = selectCoverImage([
      media({ url: 'a.jpg', order_index: 0, is_cover: false }),
      media({ url: 'b.jpg', order_index: 1, is_cover: true }),
    ])
    expect(cover).toEqual({ url: 'b.jpg', alt: 'alt' })
  })

  test('falls back to the lowest order_index image when no cover flag', () => {
    const cover = selectCoverImage([
      media({ url: 'late.jpg', order_index: 5 }),
      media({ url: 'first.jpg', order_index: 1 }),
    ])
    expect(cover?.url).toBe('first.jpg')
  })

  test('never selects a floorplan as the cover', () => {
    const cover = selectCoverImage([
      media({ url: 'plan.png', media_type: 'floorplan', is_cover: true, order_index: 0 }),
      media({ url: 'photo.jpg', media_type: 'image', order_index: 1 }),
    ])
    expect(cover?.url).toBe('photo.jpg')
  })

  test('returns null when there is no image', () => {
    expect(selectCoverImage([media({ media_type: 'floorplan' })])).toBeNull()
    expect(selectCoverImage([])).toBeNull()
  })

  test('resolveCoversByProperty groups covers per property', () => {
    const covers = resolveCoversByProperty([
      media({ property_id: 'p1', url: 'p1-cover.jpg', is_cover: true }),
      media({ property_id: 'p2', url: 'p2-only.jpg', order_index: 0 }),
      media({ property_id: 'p3', media_type: 'floorplan' }),
    ])
    expect(covers.get('p1')?.url).toBe('p1-cover.jpg')
    expect(covers.get('p2')?.url).toBe('p2-only.jpg')
    expect(covers.has('p3')).toBe(false)
  })
})
