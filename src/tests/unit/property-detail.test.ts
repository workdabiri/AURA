import { describe, expect, test } from 'vitest'

import {
  isValidSlug,
  projectPublicStakeholders,
  selectDetailMedia,
  toPropertyDetailDTO,
  type PublicDetailMediaRow,
  type PublicDetailPropertyRow,
} from '@/domain/properties/detail'

/**
 * AURA-203 — unit tests for the public property detail DTO projection (pure, no DB).
 */

const agency = { agencyWhatsapp: null, agencyPhone: null, agencyEmail: null }

const baseRow: PublicDetailPropertyRow = {
  id: 'p1',
  slug: 'sea-view-villa',
  reference_number: 'AX-001',
  title_en: 'Sea View Villa',
  description: { en: 'A lovely villa', ar: 'فيلا' },
  price: 5000000,
  currency: 'AED',
  price_visibility: 'visible',
  transaction_type: 'sale',
  market_type: 'ready',
  property_type: 'villa',
  availability_status: 'available',
  rental_period: null,
  community: 'Palm Jumeirah',
  sub_community: 'Frond A',
  building_name: 'Villa 12',
  location_label: 'Palm Jumeirah',
  external_map_url: 'https://maps/x',
  bedrooms: 4,
  bathrooms: 5,
  parking: 2,
  size_sqft: 6000,
  size_sqm: 557,
  furnishing_status: 'furnished',
  amenities: ['Pool', 'Gym', 123],
  rera_number: 'RERA-1',
  permit_number: 'PERMIT-1',
  is_featured: true,
  agent_name: 'Agent',
  agent_phone: '+971 4 100',
  agent_whatsapp: '+971 50 200',
  agent_email: 'a@x.com',
  developer_name: 'Dev Co',
  handover_date: '2027-01-01',
  completion_percentage: 50,
  down_payment_amount: 100000,
  payment_plan_summary: '60/40',
}

describe('toPropertyDetailDTO — projection', () => {
  test('maps allowlisted fields; title_en→title, description.en→description, amenities→string[]', () => {
    const dto = toPropertyDetailDTO(baseRow, [], [], agency)
    expect(dto.title).toBe('Sea View Villa')
    expect(dto.description).toBe('A lovely villa')
    expect(dto.amenities).toEqual(['Pool', 'Gym']) // non-string (123) filtered out
    expect(dto.externalMapUrl).toBe('https://maps/x')
    expect(dto.reraNumber).toBe('RERA-1')
    expect(dto.permitNumber).toBe('PERMIT-1')
    expect(dto.subCommunity).toBe('Frond A')
    expect(dto.priceVisibility).toBe('visible')
  })

  test('null title_en and non-en description project to empty strings', () => {
    const dto = toPropertyDetailDTO(
      { ...baseRow, title_en: null, description: { ar: 'x' } },
      [],
      [],
      agency
    )
    expect(dto.title).toBe('')
    expect(dto.description).toBe('')
  })

  test('resolves a single contact CTA from agent fields without exposing them raw', () => {
    const dto = toPropertyDetailDTO(baseRow, [], [], agency)
    expect(dto.contact.method).toBe('whatsapp')
    expect(dto.contact.source).toBe('property')
    expect(dto.contact.href).toBe('https://wa.me/97150200')
  })

  test('offPlan is null for ready properties', () => {
    expect(toPropertyDetailDTO(baseRow, [], [], agency).offPlan).toBeNull()
  })

  test('offPlan is populated only for off_plan properties', () => {
    const dto = toPropertyDetailDTO({ ...baseRow, market_type: 'off_plan' }, [], [], agency)
    expect(dto.offPlan).toEqual({
      developerName: 'Dev Co',
      handoverDate: '2027-01-01',
      completionPercentage: 50,
      downPaymentAmount: 100000,
      paymentPlanSummary: '60/40',
    })
  })

  test('DTO never exposes sensitive or raw contact/off-plan fields, even if present on the row', () => {
    const polluted = {
      ...baseRow,
      address: '17 Private Road',
      views_count: 99,
      created_by: 'admin-1',
      updated_by: 'admin-2',
      publish_status: 'published',
      area_id: 'area-1',
      storage_path: 'properties/p1/x.jpg',
      internal_notes: 'secret',
    } as unknown as PublicDetailPropertyRow

    const dto = toPropertyDetailDTO(polluted, [], [], agency)
    const keys = Object.keys(dto)
    for (const forbidden of [
      'address',
      'views_count',
      'created_by',
      'updated_by',
      'publish_status',
      'area_id',
      'storage_path',
      'internal_notes',
      'agent_name',
      'agent_phone',
      'agent_whatsapp',
      'agent_email',
      'developer_name',
      'handover_date',
      'completion_percentage',
      'down_payment_amount',
      'payment_plan_summary',
    ]) {
      expect(keys).not.toContain(forbidden)
    }
  })
})

describe('selectDetailMedia', () => {
  const media: PublicDetailMediaRow[] = [
    {
      property_id: 'p1',
      url: 'b.jpg',
      alt_text: 'b',
      media_type: 'image',
      is_cover: false,
      order_index: 2,
      width: null,
      height: null,
    },
    {
      property_id: 'p1',
      url: 'cover.jpg',
      alt_text: 'c',
      media_type: 'image',
      is_cover: true,
      order_index: 5,
      width: 800,
      height: 600,
    },
    {
      property_id: 'p1',
      url: 'plan.png',
      alt_text: 'p',
      media_type: 'floorplan',
      is_cover: false,
      order_index: 0,
      width: null,
      height: null,
    },
  ]

  test('cover first, then ascending order_index; includes images and floorplans', () => {
    const out = selectDetailMedia(media)
    expect(out.map((m) => m.url)).toEqual(['cover.jpg', 'plan.png', 'b.jpg'])
    expect(out[0]?.isCover).toBe(true)
  })

  test('projects only public media fields (never storage_path)', () => {
    const first = selectDetailMedia(media)[0]
    expect(first).toBeDefined()
    expect(Object.keys(first ?? {}).sort()).toEqual(
      ['alt', 'height', 'isCover', 'mediaType', 'orderIndex', 'url', 'width'].sort()
    )
    expect(Object.keys(first ?? {})).not.toContain('storage_path')
  })
})

describe('projectPublicStakeholders', () => {
  test('keeps only name + type, dropping any other field present', () => {
    const out = projectPublicStakeholders([
      { name: 'Acme', type: 'developer', phone: '+9715', internal_notes: 'secret' } as never,
    ])
    expect(out).toEqual([{ name: 'Acme', type: 'developer' }])
  })
})

describe('isValidSlug', () => {
  test.each(['sea-view-villa', 'a', 'abc-123', 'x-2', 'downtown-dubai-tower-5'])(
    'accepts valid slug %s',
    (slug) => expect(isValidSlug(slug)).toBe(true)
  )

  test.each(['', 'UPPER', 'has space', '-leading', 'trailing-', 'a--b', 'sym!', '/etc', 'a/b'])(
    'rejects invalid slug %s',
    (slug) => expect(isValidSlug(slug)).toBe(false)
  )

  test('rejects an over-length slug', () => {
    expect(isValidSlug('a'.repeat(201))).toBe(false)
  })
})
