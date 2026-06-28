import { describe, expect, test } from 'vitest'

import {
  canBeCover,
  mediaCreateFieldsSchema,
  mediaPatchSchema,
  toAdminMediaDTO,
  type AdminMediaRow,
} from '@/domain/properties/media'
import { summarizeCoverMedia, evaluatePublishChecklist } from '@/domain/properties/publish'

/**
 * AURA-304 — unit tests for the admin media-manager domain contract + the publish-cover
 * regression (AURA-303 must not be weakened): only an image can be a cover, a floorplan never;
 * exactly one cover with alt text is required to publish.
 */

describe('AURA-304 canBeCover (only an image may be a cover)', () => {
  test('image is cover-eligible', () => {
    expect(canBeCover('image')).toBe(true)
  })
  test('floorplan is NOT cover-eligible', () => {
    expect(canBeCover('floorplan')).toBe(false)
  })
})

describe('AURA-304 mediaCreateFieldsSchema', () => {
  test('accepts an image with alt text and is_cover', () => {
    const r = mediaCreateFieldsSchema.safeParse({
      media_type: 'image',
      alt_text: 'Marina view',
      is_cover: true,
    })
    expect(r.success).toBe(true)
  })

  test('defaults is_cover to false when omitted', () => {
    const r = mediaCreateFieldsSchema.safeParse({ media_type: 'image', alt_text: 'x' })
    expect(r.success && r.data.is_cover).toBe(false)
  })

  test('rejects a floorplan set as cover', () => {
    const r = mediaCreateFieldsSchema.safeParse({
      media_type: 'floorplan',
      alt_text: 'Plan',
      is_cover: true,
    })
    expect(r.success).toBe(false)
  })

  test('rejects empty / whitespace-only alt text', () => {
    expect(mediaCreateFieldsSchema.safeParse({ media_type: 'image', alt_text: '' }).success).toBe(
      false
    )
    expect(
      mediaCreateFieldsSchema.safeParse({ media_type: 'image', alt_text: '   ' }).success
    ).toBe(false)
  })

  test('rejects an invalid media type (no video/360)', () => {
    expect(mediaCreateFieldsSchema.safeParse({ media_type: 'video', alt_text: 'x' }).success).toBe(
      false
    )
  })

  test('trims alt text', () => {
    const r = mediaCreateFieldsSchema.safeParse({ media_type: 'image', alt_text: '  hi  ' })
    expect(r.success && r.data.alt_text).toBe('hi')
  })
})

describe('AURA-304 mediaPatchSchema', () => {
  test('requires at least one field', () => {
    expect(mediaPatchSchema.safeParse({}).success).toBe(false)
  })
  test('accepts alt_text only', () => {
    expect(mediaPatchSchema.safeParse({ alt_text: 'new' }).success).toBe(true)
  })
  test('accepts is_cover only (true or false)', () => {
    expect(mediaPatchSchema.safeParse({ is_cover: true }).success).toBe(true)
    expect(mediaPatchSchema.safeParse({ is_cover: false }).success).toBe(true)
  })
  test('rejects empty alt_text when present', () => {
    expect(mediaPatchSchema.safeParse({ alt_text: '  ' }).success).toBe(false)
  })
})

describe('AURA-304 toAdminMediaDTO (never exposes storage_path)', () => {
  const row: AdminMediaRow = {
    id: 'm1',
    property_id: 'p1',
    url: 'https://cdn/x.jpg',
    media_type: 'image',
    order_index: 2,
    is_cover: true,
    alt_text: 'Front',
    width: null,
    height: null,
    size_bytes: 1234,
    created_at: '2026-06-28T00:00:00Z',
  }

  test('maps to camelCase DTO', () => {
    expect(toAdminMediaDTO(row)).toEqual({
      id: 'm1',
      propertyId: 'p1',
      url: 'https://cdn/x.jpg',
      mediaType: 'image',
      orderIndex: 2,
      isCover: true,
      altText: 'Front',
      width: null,
      height: null,
      sizeBytes: 1234,
      createdAt: '2026-06-28T00:00:00Z',
    })
  })

  test('the DTO has no storage_path key', () => {
    expect(Object.keys(toAdminMediaDTO(row))).not.toContain('storage_path')
  })
})

// ---------------------------------------------------------------------------------
// Publish-cover regression — AURA-304 must not weaken AURA-303's publish gate.
// ---------------------------------------------------------------------------------

const PUBLISHABLE = {
  title: { en: 'Marina Apartment' },
  description: { en: 'A nice apartment.' },
  transaction_type: 'sale',
  market_type: 'ready',
  property_type: 'apartment',
  availability_status: 'available',
  price_visibility: 'visible',
  rental_period: null,
  price: 1_000_000,
  location_label: 'Dubai Marina',
  bedrooms: 2,
}

function failureCodes(media: { media_type: string; is_cover: boolean; alt_text: string | null }[]) {
  const result = evaluatePublishChecklist(PUBLISHABLE, summarizeCoverMedia(media))
  return result.failures.map((f) => f.code)
}

describe('AURA-304 publish-cover regression', () => {
  test('no media → cover_image_required', () => {
    expect(failureCodes([])).toContain('cover_image_required')
  })

  test('cover image WITHOUT alt text → cover_image_alt_text_required', () => {
    const codes = failureCodes([{ media_type: 'image', is_cover: true, alt_text: '' }])
    expect(codes).toContain('cover_image_alt_text_required')
    expect(codes).not.toContain('cover_image_required')
  })

  test('a floorplan marked is_cover is NOT accepted as the image cover', () => {
    const codes = failureCodes([{ media_type: 'floorplan', is_cover: true, alt_text: 'Plan' }])
    expect(codes).toContain('cover_image_required')
  })

  test('cover image WITH alt text satisfies the media gate (no media failures)', () => {
    const codes = failureCodes([{ media_type: 'image', is_cover: true, alt_text: 'Front view' }])
    expect(codes).not.toContain('cover_image_required')
    expect(codes).not.toContain('cover_image_alt_text_required')
  })
})
