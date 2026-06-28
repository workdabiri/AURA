import { describe, expect, test } from 'vitest'

import { propertyCreateSchema, propertyUpdateSchema } from '@/domain/properties/admin'

/**
 * AURA-303 — admin create/update Zod schemas (D-36 taxonomy, off-plan consistency, slug
 * derivability, and the structural slug/reference immutability of the update schema).
 */

const minimalCreate = {
  title: { en: 'Marina Apartment' },
  transaction_type: 'sale',
  market_type: 'ready',
  property_type: 'apartment',
  location_label: 'Dubai Marina',
  size_sqft: 1200,
}

describe('propertyCreateSchema', () => {
  test('accepts the minimal required draft shape', () => {
    const r = propertyCreateSchema.safeParse(minimalCreate)
    expect(r.success).toBe(true)
  })

  test('rejects a missing title (slug source)', () => {
    const { title: _t, ...noTitle } = minimalCreate
    void _t
    expect(propertyCreateSchema.safeParse(noTitle).success).toBe(false)
  })

  test('rejects a title that yields no usable slug', () => {
    const r = propertyCreateSchema.safeParse({ ...minimalCreate, title: { en: '!!!' } })
    expect(r.success).toBe(false)
  })

  test('rejects an invalid taxonomy value (no overloaded status — D-36)', () => {
    expect(
      propertyCreateSchema.safeParse({ ...minimalCreate, property_type: 'mansion' }).success
    ).toBe(false)
    expect(
      propertyCreateSchema.safeParse({ ...minimalCreate, transaction_type: 'lease' }).success
    ).toBe(false)
  })

  test('rejects off-plan fields on a ready property (D-36)', () => {
    const r = propertyCreateSchema.safeParse({
      ...minimalCreate,
      market_type: 'ready',
      developer_name: 'Emaar',
    })
    expect(r.success).toBe(false)
  })

  test('allows off-plan fields when market_type is off_plan', () => {
    const r = propertyCreateSchema.safeParse({
      ...minimalCreate,
      market_type: 'off_plan',
      developer_name: 'Emaar',
      handover_date: '2027-06-30',
    })
    expect(r.success).toBe(true)
  })

  test('normalises a reference-number override to uppercase', () => {
    const r = propertyCreateSchema.safeParse({ ...minimalCreate, reference_number: 'aux-7' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.reference_number).toBe('AUX-7')
  })
})

describe('propertyUpdateSchema — slug/reference immutability is structural (A-06)', () => {
  test('an empty patch is valid (all fields optional)', () => {
    expect(propertyUpdateSchema.safeParse({}).success).toBe(true)
  })

  test('accepts a publish intent flag', () => {
    const r = propertyUpdateSchema.safeParse({ publish: true })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.publish).toBe(true)
  })

  test('silently drops slug / reference_number / publish_status — they can never be set here', () => {
    const r = propertyUpdateSchema.safeParse({
      slug: 'new-slug',
      reference_number: 'HACK-1',
      publish_status: 'published',
      location_label: 'Updated',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data).not.toHaveProperty('slug')
      expect(r.data).not.toHaveProperty('reference_number')
      expect(r.data).not.toHaveProperty('publish_status')
      expect(r.data.location_label).toBe('Updated')
    }
  })

  test('rejects off-plan fields when the patch sets market_type to ready', () => {
    const r = propertyUpdateSchema.safeParse({ market_type: 'ready', handover_date: '2027-01-01' })
    expect(r.success).toBe(false)
  })
})
