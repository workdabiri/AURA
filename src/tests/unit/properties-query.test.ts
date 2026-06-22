import { describe, expect, test } from 'vitest'

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  FEATURED_DEFAULT_LIMIT,
  FEATURED_MAX_LIMIT,
  MAX_LIMIT,
  paginationRange,
  parseFeaturedQuery,
  parseListingQuery,
  SORT_OPTIONS,
  totalPages,
} from '@/domain/properties/query'

/**
 * AURA-202 — unit tests for the public listing/featured query contract (pure, no DB).
 */
describe('parseListingQuery — defaults', () => {
  test('empty input applies page/limit/sort defaults', () => {
    const r = parseListingQuery({})
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.page).toBe(DEFAULT_PAGE)
    expect(r.data.limit).toBe(DEFAULT_LIMIT)
    expect(r.data.sort).toBe(DEFAULT_SORT)
  })
})

describe('parseListingQuery — pagination', () => {
  test('limit > 50 clamps to 50 (A-07), not an error', () => {
    const r = parseListingQuery({ limit: '500' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.limit).toBe(MAX_LIMIT)
  })

  test('limit exactly 50 is preserved', () => {
    const r = parseListingQuery({ limit: '50' })
    expect(r.success && r.data.limit).toBe(50)
  })

  test.each(['0', '-1', 'abc', '1.5'])('invalid limit %s is a validation failure', (limit) => {
    expect(parseListingQuery({ limit }).success).toBe(false)
  })

  test.each(['0', '-3', 'xyz', '2.2'])('invalid page %s is a validation failure', (page) => {
    expect(parseListingQuery({ page }).success).toBe(false)
  })

  test('valid page/limit are coerced to numbers', () => {
    const r = parseListingQuery({ page: '3', limit: '24' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(3)
      expect(r.data.limit).toBe(24)
    }
  })
})

describe('parseListingQuery — price range', () => {
  test('max_price < min_price is invalid', () => {
    expect(parseListingQuery({ min_price: '500', max_price: '100' }).success).toBe(false)
  })

  test('max_price === min_price is valid', () => {
    expect(parseListingQuery({ min_price: '100', max_price: '100' }).success).toBe(true)
  })

  test('negative price is invalid', () => {
    expect(parseListingQuery({ min_price: '-1' }).success).toBe(false)
  })
})

describe('parseListingQuery — sort allowlist', () => {
  test.each([...SORT_OPTIONS])('accepts sort=%s', (sort) => {
    const r = parseListingQuery({ sort })
    expect(r.success && r.data.sort).toBe(sort)
  })

  test('rejects an unknown sort (e.g. title)', () => {
    expect(parseListingQuery({ sort: 'title' }).success).toBe(false)
    expect(parseListingQuery({ sort: 'size_desc' }).success).toBe(false)
  })
})

describe('parseListingQuery — filters', () => {
  test('rejects an out-of-enum transaction_type', () => {
    expect(parseListingQuery({ transaction_type: 'lease' }).success).toBe(false)
  })

  test('rejects an out-of-enum property_type', () => {
    expect(parseListingQuery({ property_type: 'castle' }).success).toBe(false)
  })

  test('rejects a search longer than the bound', () => {
    expect(parseListingQuery({ search: 'x'.repeat(101) }).success).toBe(false)
  })

  test('accepts a bounded search and trims it', () => {
    const r = parseListingQuery({ search: '  penthouse  ' })
    expect(r.success && r.data.search).toBe('penthouse')
  })

  test('accepts a full valid filter set', () => {
    const r = parseListingQuery({
      transaction_type: 'sale',
      market_type: 'off_plan',
      property_type: 'villa',
      area: 'palm-jumeirah',
      community: 'Dubai Marina',
      min_price: '1000000',
      max_price: '5000000',
      bedrooms: '3',
      availability_status: 'available',
      search: 'sea view',
      sort: 'price_asc',
      page: '2',
      limit: '20',
    })
    expect(r.success).toBe(true)
  })
})

describe('paginationRange / totalPages', () => {
  test('page 1 limit 12 => range 0..11', () => {
    expect(paginationRange({ page: 1, limit: 12 })).toEqual({ from: 0, to: 11 })
  })

  test('page 3 limit 20 => range 40..59', () => {
    expect(paginationRange({ page: 3, limit: 20 })).toEqual({ from: 40, to: 59 })
  })

  test('totalPages rounds up', () => {
    expect(totalPages(0, 12)).toBe(0)
    expect(totalPages(13, 12)).toBe(2)
    expect(totalPages(24, 12)).toBe(2)
  })
})

describe('parseFeaturedQuery', () => {
  test('default limit is 6', () => {
    const r = parseFeaturedQuery({})
    expect(r.success && r.data.limit).toBe(FEATURED_DEFAULT_LIMIT)
  })

  test('limit > 12 clamps to 12', () => {
    const r = parseFeaturedQuery({ limit: '100' })
    expect(r.success && r.data.limit).toBe(FEATURED_MAX_LIMIT)
  })

  test.each(['0', '-1', 'abc'])('invalid featured limit %s is a validation failure', (limit) => {
    expect(parseFeaturedQuery({ limit }).success).toBe(false)
  })
})
