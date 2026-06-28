import { describe, expect, test } from 'vitest'

import {
  evaluatePublishChecklist,
  isResidentialType,
  summarizeCoverMedia,
  type CoverMediaSummary,
  type PublishCandidate,
} from '@/domain/properties/publish'

/**
 * AURA-303 — publish checklist (DATA_MODEL §properties publish rules; D-09/D-36/D-48).
 * Pure logic — no DB.
 */

/** A fully publish-ready ready-market apartment. */
function validCandidate(overrides: Partial<PublishCandidate> = {}): PublishCandidate {
  return {
    title: { en: 'Marina Apartment' },
    description: { en: 'A bright two-bed.' },
    transaction_type: 'sale',
    market_type: 'ready',
    property_type: 'apartment',
    availability_status: 'available',
    price_visibility: 'visible',
    rental_period: null,
    price: 1500000,
    location_label: 'Dubai Marina',
    bedrooms: 2,
    developer_name: null,
    handover_date: null,
    completion_percentage: null,
    down_payment_amount: null,
    payment_plan_summary: null,
    ...overrides,
  }
}

const goodCover: CoverMediaSummary = { hasImageCover: true, coverAltTextPresent: true }

function codes(candidate: PublishCandidate, cover: CoverMediaSummary = goodCover): string[] {
  return evaluatePublishChecklist(candidate, cover).failures.map((f) => f.code)
}

describe('summarizeCoverMedia', () => {
  test('an image flagged is_cover with alt text → present', () => {
    const s = summarizeCoverMedia([
      { media_type: 'image', is_cover: true, alt_text: 'Living room' },
      { media_type: 'image', is_cover: false, alt_text: '' },
    ])
    expect(s).toEqual({ hasImageCover: true, coverAltTextPresent: true })
  })

  test('a floorplan cover does NOT count as an image cover', () => {
    const s = summarizeCoverMedia([{ media_type: 'floorplan', is_cover: true, alt_text: 'Plan' }])
    expect(s.hasImageCover).toBe(false)
  })

  test('cover image with empty alt → hasImageCover but no alt', () => {
    const s = summarizeCoverMedia([{ media_type: 'image', is_cover: true, alt_text: '   ' }])
    expect(s).toEqual({ hasImageCover: true, coverAltTextPresent: false })
  })
})

describe('evaluatePublishChecklist', () => {
  test('a complete candidate with a valid cover passes', () => {
    expect(evaluatePublishChecklist(validCandidate(), goodCover)).toEqual({
      ok: true,
      failures: [],
    })
  })

  test('requires English title, description, and location label', () => {
    expect(codes(validCandidate({ title: { en: '' } }))).toContain('title_en_required')
    expect(codes(validCandidate({ description: {} }))).toContain('description_en_required')
    expect(codes(validCandidate({ location_label: '' }))).toContain('location_label_required')
  })

  test('price is required when price_visibility = visible (D-48)', () => {
    expect(codes(validCandidate({ price: null }))).toContain('price_required_when_visible')
    // price_on_application may omit price
    expect(
      codes(validCandidate({ price: null, price_visibility: 'price_on_application' }))
    ).not.toContain('price_required_when_visible')
  })

  test('rental period required for a visibly-priced rental (Q-10)', () => {
    expect(codes(validCandidate({ transaction_type: 'rent', rental_period: null }))).toContain(
      'rental_period_required'
    )
    expect(
      codes(validCandidate({ transaction_type: 'rent', rental_period: 'yearly' }))
    ).not.toContain('rental_period_required')
    // price_on_application rental does not require a cadence
    expect(
      codes(
        validCandidate({
          transaction_type: 'rent',
          price: null,
          price_visibility: 'price_on_application',
          rental_period: null,
        })
      )
    ).not.toContain('rental_period_required')
  })

  test('bedrooms required for residential types, optional otherwise (D-09)', () => {
    expect(isResidentialType('apartment')).toBe(true)
    expect(isResidentialType('office')).toBe(false)

    expect(codes(validCandidate({ property_type: 'apartment', bedrooms: null }))).toContain(
      'bedrooms_required_for_residential'
    )
    // office/plot/retail/warehouse may publish with null bedrooms
    expect(codes(validCandidate({ property_type: 'office', bedrooms: null }))).not.toContain(
      'bedrooms_required_for_residential'
    )
    expect(codes(validCandidate({ property_type: 'plot', bedrooms: null }))).not.toContain(
      'bedrooms_required_for_residential'
    )
  })

  test('off-plan fields are rejected on a ready property, allowed on off_plan (D-36)', () => {
    expect(codes(validCandidate({ market_type: 'ready', developer_name: 'Emaar' }))).toContain(
      'off_plan_fields_not_allowed'
    )
    expect(
      codes(validCandidate({ market_type: 'off_plan', developer_name: 'Emaar' }))
    ).not.toContain('off_plan_fields_not_allowed')
  })

  test('requires a cover image with alt text', () => {
    expect(codes(validCandidate(), { hasImageCover: false, coverAltTextPresent: false })).toContain(
      'cover_image_required'
    )
    expect(codes(validCandidate(), { hasImageCover: true, coverAltTextPresent: false })).toContain(
      'cover_image_alt_text_required'
    )
  })

  test('aggregates multiple failures and reports ok=false', () => {
    const result = evaluatePublishChecklist(
      validCandidate({ title: { en: '' }, price: null, bedrooms: null }),
      { hasImageCover: false, coverAltTextPresent: false }
    )
    expect(result.ok).toBe(false)
    expect(result.failures.length).toBeGreaterThanOrEqual(3)
  })
})
