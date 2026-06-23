import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-203 — integration tests for `GET /api/properties/[slug]`.
 *
 * The DAL is `server-only` + live I/O, so we mock it: these tests exercise the ROUTE boundary
 * — slug validation, status codes, the response envelope, and generic error mapping — without a
 * DB. Published-only enforcement + stakeholder safety are covered by the live DAL + security suites.
 */
vi.mock('@/dal/property-detail.dal', () => ({
  getPublishedPropertyBySlug: vi.fn(),
}))

import { GET } from '@/app/api/properties/[slug]/route'
import { getPublishedPropertyBySlug } from '@/dal/property-detail.dal'

const mocked = vi.mocked(getPublishedPropertyBySlug)

function request(): Request {
  return new Request('http://localhost/api/properties/x')
}
function context(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/properties/[slug]', () => {
  test('200 with { data } on success', async () => {
    mocked.mockResolvedValue({
      id: 'p1',
      slug: 'sea-view-villa',
      offPlan: null,
      publicStakeholders: [],
    } as never)

    const res = await GET(request(), context('sea-view-villa'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.slug).toBe('sea-view-villa')
    expect(mocked).toHaveBeenCalledWith('sea-view-villa')
  })

  test('404 when the DAL returns null (missing/draft/archived)', async () => {
    mocked.mockResolvedValue(null)

    const res = await GET(request(), context('ghost-property'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  test('400 on an invalid slug; the DAL is never called', async () => {
    const res = await GET(request(), context('Invalid Slug!'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid slug' })
    expect(mocked).not.toHaveBeenCalled()
  })

  test('400 on an empty slug', async () => {
    const res = await GET(request(), context(''))
    expect(res.status).toBe(400)
    expect(mocked).not.toHaveBeenCalled()
  })

  test('500 generic error when the DAL throws (no detail leak)', async () => {
    mocked.mockRejectedValue(new Error('connection refused at 10.0.0.1'))

    const res = await GET(request(), context('sea-view-villa'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })

  test('passes through the offPlan + publicStakeholders shape unchanged', async () => {
    mocked.mockResolvedValue({
      slug: 'off-plan-tower',
      offPlan: {
        developerName: 'Dev Co',
        handoverDate: null,
        completionPercentage: null,
        downPaymentAmount: null,
        paymentPlanSummary: null,
      },
      publicStakeholders: [{ name: 'Acme', type: 'developer' }],
    } as never)

    const res = await GET(request(), context('off-plan-tower'))
    const body = await res.json()
    expect(body.data.offPlan.developerName).toBe('Dev Co')
    expect(body.data.publicStakeholders).toEqual([{ name: 'Acme', type: 'developer' }])
  })
})
