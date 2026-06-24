import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-205 — integration tests for `GET /api/legal/[slug]`.
 *
 * The DAL is `server-only` + live I/O, so we mock it: these tests exercise the ROUTE boundary —
 * public slug validation, status codes, the response envelope, and generic error mapping —
 * without a DB. Published-only enforcement + sanitization are covered by the live DAL + security
 * + renderer suites.
 */
vi.mock('@/dal/legal.dal', () => ({
  getPublishedLegalPage: vi.fn(),
}))

import { GET } from '@/app/api/legal/[slug]/route'
import { getPublishedLegalPage } from '@/dal/legal.dal'

const mocked = vi.mocked(getPublishedLegalPage)

function request(): Request {
  return new Request('http://localhost/api/legal/x')
}
function context(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/legal/[slug]', () => {
  test('200 with { data } for a published privacy page', async () => {
    mocked.mockResolvedValue({
      slug: 'privacy',
      title: 'Privacy Policy',
      content: '# Privacy',
      effectiveDate: '2026-01-01',
    })

    const res = await GET(request(), context('privacy'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toEqual({
      slug: 'privacy',
      title: 'Privacy Policy',
      content: '# Privacy',
      effectiveDate: '2026-01-01',
    })
    expect(mocked).toHaveBeenCalledWith('privacy')
  })

  test('200 with { data } for a published terms page', async () => {
    mocked.mockResolvedValue({
      slug: 'terms',
      title: 'Terms',
      content: '# Terms',
      effectiveDate: '2026-02-01',
    })

    const res = await GET(request(), context('terms'))
    expect(res.status).toBe(200)
    expect((await res.json()).data.slug).toBe('terms')
    expect(mocked).toHaveBeenCalledWith('terms')
  })

  test('404 when the DAL returns null (missing/draft/archived)', async () => {
    mocked.mockResolvedValue(null)

    const res = await GET(request(), context('privacy'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  test('404 for an unsupported slug; the DAL is never called', async () => {
    const res = await GET(request(), context('cookies'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(mocked).not.toHaveBeenCalled()
  })

  test('404 for a malformed slug; the DAL is never called', async () => {
    const res = await GET(request(), context('Privacy Policy!'))
    expect(res.status).toBe(404)
    expect(mocked).not.toHaveBeenCalled()
  })

  test('500 generic error when the DAL throws (no detail leak)', async () => {
    mocked.mockRejectedValue(new Error('connection refused at 10.0.0.1'))

    const res = await GET(request(), context('privacy'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })

  test('response never carries internal legal fields', async () => {
    mocked.mockResolvedValue({
      slug: 'terms',
      title: 'Terms',
      content: '# Terms',
      effectiveDate: '2026-02-01',
    })

    const body = await (await GET(request(), context('terms'))).json()
    for (const leaked of [
      'id',
      'status',
      'version',
      'last_updated_by',
      'lastUpdatedBy',
      'created_at',
      'createdAt',
      'updated_at',
      'updatedAt',
      'published_at',
      'publishedAt',
    ]) {
      expect(body.data).not.toHaveProperty(leaked)
    }
    expect(Object.keys(body.data).sort()).toEqual(['content', 'effectiveDate', 'slug', 'title'])
  })
})
