import { describe, expect, test } from 'vitest'

import {
  buildDuplicateInsert,
  buildUpdatePayload,
  canArchive,
  canEditProperty,
  canMutateSlug,
  canPublish,
  formatReferenceNumber,
  referenceNumberOverrideSchema,
  slugifyTitleEn,
  withSlugSuffix,
  type DuplicateSourceRow,
} from '@/domain/properties/admin'

/**
 * AURA-303 — admin property domain: reference number (D-47/A-05), slug (A-06), lifecycle
 * rules (D-32), the update-payload immutability backstop, and the duplicate projection.
 * Pure logic — no DB, no mocks.
 */

describe('reference number generation (D-47 / A-05)', () => {
  test('formats as PREFIX-padded sequence (default AUTEX, width 5)', () => {
    expect(formatReferenceNumber(1)).toBe('AUTEX-00001')
    expect(formatReferenceNumber(41)).toBe('AUTEX-00041')
    expect(formatReferenceNumber(123456)).toBe('AUTEX-123456')
  })

  test('honours a custom prefix', () => {
    expect(formatReferenceNumber(7, 'DEMO')).toBe('DEMO-00007')
  })

  test('override schema uppercases and accepts alphanumerics + single hyphens', () => {
    expect(referenceNumberOverrideSchema.parse('aux-100')).toBe('AUX-100')
    expect(referenceNumberOverrideSchema.safeParse('A B').success).toBe(false)
    expect(referenceNumberOverrideSchema.safeParse('A--B').success).toBe(false)
    expect(referenceNumberOverrideSchema.safeParse('aa').success).toBe(false) // < min length 3
  })
})

describe('slug derivation (A-06)', () => {
  test('lowercases, hyphenates, and trims', () => {
    expect(slugifyTitleEn('Marina Penthouse')).toBe('marina-penthouse')
    expect(slugifyTitleEn('  Luxury  Villa!! ')).toBe('luxury-villa')
    expect(slugifyTitleEn('Café Düsseldorf')).toBe('cafe-dusseldorf')
  })

  test('returns empty string when nothing usable remains', () => {
    expect(slugifyTitleEn('!!!')).toBe('')
    expect(slugifyTitleEn('   ')).toBe('')
  })

  test('withSlugSuffix appends only for n > 1', () => {
    expect(withSlugSuffix('marina-penthouse', 1)).toBe('marina-penthouse')
    expect(withSlugSuffix('marina-penthouse', 2)).toBe('marina-penthouse-2')
    expect(withSlugSuffix('marina-penthouse', 7)).toBe('marina-penthouse-7')
  })
})

describe('lifecycle rules (D-32)', () => {
  test('canMutateSlug: only while draft (immutable after publish — A-06)', () => {
    expect(canMutateSlug('draft')).toBe(true)
    expect(canMutateSlug('published')).toBe(false)
    expect(canMutateSlug('archived')).toBe(false)
  })

  test('canPublish: only from draft (no unpublish, no re-publish)', () => {
    expect(canPublish('draft')).toBe(true)
    expect(canPublish('published')).toBe(false)
    expect(canPublish('archived')).toBe(false)
  })

  test('canArchive: from draft or published, never an archived row', () => {
    expect(canArchive('draft')).toBe(true)
    expect(canArchive('published')).toBe(true)
    expect(canArchive('archived')).toBe(false)
  })

  test('canEditProperty: anything except archived', () => {
    expect(canEditProperty('draft')).toBe(true)
    expect(canEditProperty('published')).toBe(true)
    expect(canEditProperty('archived')).toBe(false)
  })
})

describe('buildUpdatePayload — immutability backstop (A-06 / D-32)', () => {
  test('strips slug, reference_number, publish_status, and ownership/lifecycle keys', () => {
    const out = buildUpdatePayload(
      {
        slug: 'hacked-slug',
        reference_number: 'HACK-1',
        publish_status: 'published',
        published_at: '2026-01-01',
        archived_at: '2026-01-01',
        id: 'x',
        title_en: 'x',
        views_count: 999,
        created_by: 'someone',
        created_at: '2026-01-01',
        // a legitimately editable field survives:
        location_label: 'Dubai Marina',
        bedrooms: 2,
      },
      'admin-uid'
    )
    expect(out).not.toHaveProperty('slug')
    expect(out).not.toHaveProperty('reference_number')
    expect(out).not.toHaveProperty('publish_status')
    expect(out).not.toHaveProperty('published_at')
    expect(out).not.toHaveProperty('archived_at')
    expect(out).not.toHaveProperty('views_count')
    expect(out).not.toHaveProperty('created_by')
    expect(out.location_label).toBe('Dubai Marina')
    expect(out.bedrooms).toBe(2)
    expect(out.updated_by).toBe('admin-uid')
  })

  test('omits undefined fields but keeps explicit nulls', () => {
    const out = buildUpdatePayload({ community: null, price: undefined }, null)
    expect(out).toHaveProperty('community', null)
    expect(out).not.toHaveProperty('price')
    expect(out.updated_by).toBeNull()
  })
})

describe('buildDuplicateInsert — duplicate projection (API_SPEC)', () => {
  const source: DuplicateSourceRow = {
    title: { en: 'Marina Penthouse' },
    description: { en: 'Lovely' },
    transaction_type: 'sale',
    market_type: 'ready',
    property_type: 'penthouse',
    availability_status: 'available',
    price_visibility: 'visible',
    rental_period: null,
    furnishing_status: 'furnished',
    price: 3000000,
    location_label: 'Dubai Marina',
    community: 'Marina',
    sub_community: null,
    building_name: null,
    address: 'Secret 12',
    external_map_url: null,
    bedrooms: 3,
    bathrooms: 4,
    parking: 2,
    size_sqft: 4000,
    size_sqm: null,
    amenities: ['pool'],
    rera_number: null,
    permit_number: null,
    agent_name: null,
    agent_phone: null,
    agent_whatsapp: null,
    agent_email: null,
    developer_name: null,
    handover_date: null,
    completion_percentage: null,
    down_payment_amount: null,
    payment_plan_summary: null,
    is_featured: true,
  }

  test('copies editable fields, forces draft + new slug/reference, drops views/timestamps/featured', () => {
    const out = buildDuplicateInsert(source, {
      slug: 'marina-penthouse-2',
      reference_number: 'AUTEX-00099',
      actorUserId: 'admin-uid',
    })

    expect(out.publish_status).toBe('draft')
    expect(out.slug).toBe('marina-penthouse-2')
    expect(out.reference_number).toBe('AUTEX-00099')
    expect(out.is_featured).toBe(false) // never carry "featured" onto an unfinished duplicate
    expect(out.created_by).toBe('admin-uid')
    expect(out.updated_by).toBe('admin-uid')
    // editable fields copied
    expect(out.price).toBe(3000000)
    expect(out.bedrooms).toBe(3)
    expect(out.amenities).toEqual(['pool'])
    // never copies identity / counters / timestamps
    expect(out).not.toHaveProperty('id')
    expect(out).not.toHaveProperty('views_count')
    expect(out).not.toHaveProperty('created_at')
    expect(out).not.toHaveProperty('published_at')
    expect(out).not.toHaveProperty('archived_at')
  })
})
