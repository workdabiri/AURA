import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-204 — integration tests for the public areas API route.
 *
 * The DAL is `server-only` (cannot be imported into Vitest) AND performs live I/O, so we mock
 * it: these tests exercise the ROUTE boundary — the `{ data }` envelope, strict no-query-param
 * validation, status codes, and generic error mapping — without a DB. Active-only enforcement
 * itself is covered by the live DAL + security suites.
 */
vi.mock('@/dal/areas.dal', () => ({
  listActiveAreas: vi.fn(),
}))

import { GET } from '@/app/api/areas/route'
import { listActiveAreas } from '@/dal/areas.dal'

const mockedList = vi.mocked(listActiveAreas)

function areasRequest(qs = ''): Request {
  return new Request(`http://localhost/api/areas${qs}`)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/areas', () => {
  test('200 with a { data } envelope of active areas on success', async () => {
    mockedList.mockResolvedValue([
      { slug: 'marina', name: 'Marina', description: 'Waterfront', imageUrl: null },
      { slug: 'downtown', name: 'Downtown', description: '', imageUrl: 'https://cdn/d.jpg' },
    ])

    const res = await GET(areasRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual({
      data: [
        { slug: 'marina', name: 'Marina', description: 'Waterfront', imageUrl: null },
        { slug: 'downtown', name: 'Downtown', description: '', imageUrl: 'https://cdn/d.jpg' },
      ],
    })
    expect(mockedList).toHaveBeenCalledTimes(1)
  })

  test('200 with an empty data array when there are no active areas', async () => {
    mockedList.mockResolvedValue([])

    const res = await GET(areasRequest())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [] })
  })

  test('400 on any query param (no params supported in AURA-204); DAL not called', async () => {
    const res = await GET(areasRequest('?sort=name'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid query parameters' })
    expect(mockedList).not.toHaveBeenCalled()
  })

  test('400 on a pagination-style param too (strict contract)', async () => {
    const res = await GET(areasRequest('?page=2&limit=10'))
    expect(res.status).toBe(400)
    expect(mockedList).not.toHaveBeenCalled()
  })

  test('500 generic error when the DAL throws (no detail leak)', async () => {
    mockedList.mockRejectedValue(new Error('connection refused at 10.0.0.1'))

    const res = await GET(areasRequest())
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})
