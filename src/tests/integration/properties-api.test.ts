import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-202 — integration tests for the public properties API routes.
 *
 * The DAL is `server-only` (cannot be imported into Vitest) AND performs live I/O, so we mock
 * it: these tests exercise the ROUTE boundary — Zod query validation, pagination-cap
 * enforcement, the response envelope, status codes, and generic error mapping — without a DB.
 * Published-only enforcement itself is covered by the live DAL + security suites.
 */
vi.mock('@/dal/properties.dal', () => ({
  listPublishedProperties: vi.fn(),
  listFeaturedProperties: vi.fn(),
}))

import { GET as featuredGET } from '@/app/api/properties/featured/route'
import { GET as listGET } from '@/app/api/properties/route'
import { listFeaturedProperties, listPublishedProperties } from '@/dal/properties.dal'

const mockedList = vi.mocked(listPublishedProperties)
const mockedFeatured = vi.mocked(listFeaturedProperties)

function listRequest(qs = ''): Request {
  return new Request(`http://localhost/api/properties${qs}`)
}
function featuredRequest(qs = ''): Request {
  return new Request(`http://localhost/api/properties/featured${qs}`)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/properties', () => {
  test('200 with pagination envelope on success', async () => {
    mockedList.mockResolvedValue({
      items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as never,
      total: 30,
    })

    const res = await listGET(listRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(3)
    expect(body.pagination).toEqual({ page: 1, limit: 12, total: 30, totalPages: 3 })
  })

  test('200 with empty data array when no matches', async () => {
    mockedList.mockResolvedValue({ items: [], total: 0 })

    const res = await listGET(listRequest('?transaction_type=rent'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.pagination).toEqual({ page: 1, limit: 12, total: 0, totalPages: 0 })
  })

  test('passes validated filters through to the DAL', async () => {
    mockedList.mockResolvedValue({ items: [], total: 0 })

    await listGET(
      listRequest('?transaction_type=sale&property_type=villa&bedrooms=3&sort=price_asc')
    )

    expect(mockedList).toHaveBeenCalledTimes(1)
    expect(mockedList.mock.calls[0]?.[0]).toMatchObject({
      transaction_type: 'sale',
      property_type: 'villa',
      bedrooms: 3,
      sort: 'price_asc',
    })
  })

  test('enforces the pagination cap of 50 (A-07) at the boundary', async () => {
    mockedList.mockResolvedValue({ items: [], total: 0 })

    const res = await listGET(listRequest('?limit=500'))
    expect(res.status).toBe(200)

    expect(mockedList.mock.calls[0]?.[0].limit).toBe(50)
    const body = await res.json()
    expect(body.pagination.limit).toBe(50)
  })

  test('400 on an invalid filter, and the DAL is never called', async () => {
    const res = await listGET(listRequest('?sort=title'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid query parameters' })
    expect(mockedList).not.toHaveBeenCalled()
  })

  test('400 on invalid pagination (limit=0)', async () => {
    const res = await listGET(listRequest('?limit=0'))
    expect(res.status).toBe(400)
    expect(mockedList).not.toHaveBeenCalled()
  })

  test('400 when max_price < min_price', async () => {
    const res = await listGET(listRequest('?min_price=900&max_price=100'))
    expect(res.status).toBe(400)
  })

  test('500 generic error when the DAL throws (no detail leak)', async () => {
    mockedList.mockRejectedValue(new Error('connection refused at 10.0.0.1'))

    const res = await listGET(listRequest())
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})

describe('GET /api/properties/featured', () => {
  test('200 with data array; default limit 6 passed to the DAL', async () => {
    mockedFeatured.mockResolvedValue([{ id: 'f1' }] as never)

    const res = await featuredGET(featuredRequest())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [{ id: 'f1' }] })
    expect(mockedFeatured).toHaveBeenCalledWith(6)
  })

  test('clamps featured limit to a hard max of 12', async () => {
    mockedFeatured.mockResolvedValue([])

    await featuredGET(featuredRequest('?limit=100'))
    expect(mockedFeatured).toHaveBeenCalledWith(12)
  })

  test('400 on invalid featured limit; DAL not called', async () => {
    const res = await featuredGET(featuredRequest('?limit=0'))
    expect(res.status).toBe(400)
    expect(mockedFeatured).not.toHaveBeenCalled()
  })

  test('500 generic error when the DAL throws', async () => {
    mockedFeatured.mockRejectedValue(new Error('boom'))

    const res = await featuredGET(featuredRequest())
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})
