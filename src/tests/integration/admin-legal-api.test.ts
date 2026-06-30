import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-307 — integration tests for the admin legal Route Handlers (route boundary only).
 *
 * The DAL + audit DAL are `server-only` and do live I/O, and the auth guard reads cookies/Auth, so
 * all three are mocked: these tests prove the ROUTE contract — `requireAdmin()` enforcement
 * (401/403), Zod validation (400) incl. the D-12 unsafe-HTML rejection and the slug allowlist,
 * DAL-result → HTTP-status mapping (201/200/404/409), and the audit calls on create/publish/archive
 * (and the ABSENCE of an audit on draft PATCH). RLS / publish atomicity are covered by the gated
 * live suite.
 */

vi.mock('server-only', () => ({}))

vi.mock('@/services/auth', () => {
  class AuthorizationError extends Error {
    status: 401 | 403
    code: string
    constructor(status: 401 | 403, code: string, message: string) {
      super(message)
      this.name = 'AuthorizationError'
      this.status = status
      this.code = code
    }
  }
  return { requireAdmin: vi.fn(), AuthorizationError }
})

vi.mock('@/dal/legal.dal', () => ({
  listAdminLegalPages: vi.fn(),
  createLegalDraft: vi.fn(),
  updateLegalDraft: vi.fn(),
  publishLegalPage: vi.fn(),
  archiveLegalPage: vi.fn(),
}))

vi.mock('@/dal/audit-logs.dal', () => ({ writeAuditLog: vi.fn() }))

import { GET as listGET, POST as createPOST } from '@/app/api/admin/legal/route'
import { PATCH as updatePATCH } from '@/app/api/admin/legal/[id]/route'
import { POST as publishPOST } from '@/app/api/admin/legal/[id]/publish/route'
import { POST as archivePOST } from '@/app/api/admin/legal/[id]/archive/route'
import { writeAuditLog } from '@/dal/audit-logs.dal'
import {
  archiveLegalPage,
  createLegalDraft,
  listAdminLegalPages,
  publishLegalPage,
  updateLegalDraft,
} from '@/dal/legal.dal'
import { AuthorizationError, requireAdmin } from '@/services/auth'

const requireAdminMock = vi.mocked(requireAdmin)
const listMock = vi.mocked(listAdminLegalPages)
const createMock = vi.mocked(createLegalDraft)
const updateMock = vi.mocked(updateLegalDraft)
const publishMock = vi.mocked(publishLegalPage)
const archiveMock = vi.mocked(archiveLegalPage)
const auditMock = vi.mocked(writeAuditLog)

const ADMIN_CTX = {
  userId: 'admin-uid',
  role: 'super_admin' as const,
  profile: { id: 'admin-uid', role: 'super_admin' as const, full_name: 'Seed Super' },
}
const UUID = '0e000000-0000-0000-0000-000000000001'

const DETAIL = {
  id: UUID,
  slug: 'privacy' as const,
  title: 'Privacy Policy',
  content: '# Privacy',
  version: 1,
  status: 'draft' as const,
  effectiveDate: '2026-06-30',
  publishedAt: null,
  createdAt: '2026-06-30T00:00:00Z',
  updatedAt: '2026-06-30T00:00:00Z',
}

function asAdmin() {
  requireAdminMock.mockResolvedValue(ADMIN_CTX)
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}
function jsonReq(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  auditMock.mockResolvedValue()
})

describe('admin guard enforced in every legal handler (RBAC.md)', () => {
  test('unauthenticated GET → 401, DAL never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await listGET()
    expect(res.status).toBe(401)
    expect(listMock).not.toHaveBeenCalled()
  })

  test('authenticated no-role POST → 403, create + audit never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(403, 'NO_PROFILE', 'x'))
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/legal', 'POST', {
        slug: 'privacy',
        title: 'P',
        content: '# P',
      })
    )
    expect(res.status).toBe(403)
    expect(createMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('unauthenticated publish → 401', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await publishPOST(new Request('http://localhost', { method: 'POST' }), ctx(UUID))
    expect(res.status).toBe(401)
    expect(publishMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/legal', () => {
  test('200 lists all versions/statuses', async () => {
    asAdmin()
    listMock.mockResolvedValue([
      {
        id: UUID,
        slug: 'privacy',
        title: 'Privacy',
        version: 2,
        status: 'published',
        effectiveDate: '2026-01-01',
        publishedAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ])
    const res = await listGET()
    expect(res.status).toBe(200)
    expect((await res.json()).data).toHaveLength(1)
  })
})

describe('POST /api/admin/legal (create draft)', () => {
  test('201 on success + writes legal_page_created audit (slug/status/version only)', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: true, page: DETAIL })
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/legal', 'POST', {
        slug: 'privacy',
        title: 'Privacy Policy',
        content: '# Privacy',
        effective_date: '2026-06-30',
      })
    )
    expect(res.status).toBe(201)
    expect((await res.json()).data.slug).toBe('privacy')
    expect(auditMock).toHaveBeenCalledTimes(1)
    const audit = auditMock.mock.calls[0]?.[0]
    expect(audit).toMatchObject({
      action: 'legal_page_created',
      entityType: 'legal_page',
      entityId: UUID,
    })
    expect(audit?.metadata).toEqual({ slug: 'privacy', status: 'draft', version: 1 })
    // The audit must never carry the title/body.
    expect(JSON.stringify(audit?.metadata)).not.toContain('Privacy Policy')
  })

  test('defaults effective_date to today when omitted', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: true, page: DETAIL })
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/legal', 'POST', {
        slug: 'terms',
        title: 'Terms',
        content: '# Terms',
      })
    )
    expect(res.status).toBe(201)
    const arg = createMock.mock.calls[0]?.[0]
    expect(arg?.effective_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('400 on a non-allowlisted slug; create + audit not called', async () => {
    asAdmin()
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/legal', 'POST', {
        slug: 'cookies',
        title: 'Cookies',
        content: '# Cookies',
      })
    )
    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('400 on unsafe/raw HTML content; create + audit not called (D-12)', async () => {
    asAdmin()
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/legal', 'POST', {
        slug: 'privacy',
        title: 'Privacy',
        content: 'Hi <script>alert(1)</script>',
      })
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
    expect(createMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('400 on invalid JSON body', async () => {
    asAdmin()
    const res = await createPOST(
      new Request('http://localhost/api/admin/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
    )
    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/admin/legal/[id] (update draft — NOT audited)', () => {
  test('200 updates a draft and writes NO audit', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: true, page: { ...DETAIL, title: 'Renamed' } })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/legal/${UUID}`, 'PATCH', { title: 'Renamed' }),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    expect((await res.json()).data.title).toBe('Renamed')
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('404 on a non-UUID id', async () => {
    asAdmin()
    const res = await updatePATCH(
      jsonReq('http://localhost/api/admin/legal/not-a-uuid', 'PATCH', { title: 'X' }),
      ctx('not-a-uuid')
    )
    expect(res.status).toBe(404)
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('409 when the row is not a draft (published/archived immutable)', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'not_draft' })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/legal/${UUID}`, 'PATCH', { title: 'X' }),
      ctx(UUID)
    )
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('NOT_DRAFT')
  })

  test('404 when the row does not exist', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/legal/${UUID}`, 'PATCH', { title: 'X' }),
      ctx(UUID)
    )
    expect(res.status).toBe(404)
  })

  test('400 on unsafe content in a draft update', async () => {
    asAdmin()
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/legal/${UUID}`, 'PATCH', {
        content: '<iframe src="x"></iframe>',
      }),
      ctx(UUID)
    )
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/legal/[id]/publish', () => {
  test('200 publishes a draft and writes legal_page_published with version transition', async () => {
    asAdmin()
    publishMock.mockResolvedValue({
      ok: true,
      page: { ...DETAIL, status: 'published', version: 2, publishedAt: '2026-06-30T01:00:00Z' },
      archivedPreviousVersion: 1,
    })
    const res = await publishPOST(new Request('http://localhost', { method: 'POST' }), ctx(UUID))
    expect(res.status).toBe(200)
    const audit = auditMock.mock.calls[0]?.[0]
    expect(audit).toMatchObject({ action: 'legal_page_published', entityType: 'legal_page' })
    expect(audit?.metadata).toEqual({
      slug: 'privacy',
      from: 'draft',
      to: 'published',
      version: 2,
      archived_previous_version: 1,
    })
  })

  test('409 when the selected row is not a draft', async () => {
    asAdmin()
    publishMock.mockResolvedValue({ ok: false, reason: 'not_draft' })
    const res = await publishPOST(new Request('http://localhost', { method: 'POST' }), ctx(UUID))
    expect(res.status).toBe(409)
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('404 when the row does not exist', async () => {
    asAdmin()
    publishMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await publishPOST(new Request('http://localhost', { method: 'POST' }), ctx(UUID))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/legal/[id]/archive', () => {
  test('200 archives and writes legal_page_archived', async () => {
    asAdmin()
    archiveMock.mockResolvedValue({
      ok: true,
      page: { ...DETAIL, status: 'archived' },
      previousStatus: 'published',
    })
    const res = await archivePOST(new Request('http://localhost', { method: 'POST' }), ctx(UUID))
    expect(res.status).toBe(200)
    const audit = auditMock.mock.calls[0]?.[0]
    expect(audit).toMatchObject({ action: 'legal_page_archived', entityType: 'legal_page' })
    expect(audit?.metadata).toEqual({
      slug: 'privacy',
      from: 'published',
      to: 'archived',
      version: 1,
    })
  })

  test('409 when already archived', async () => {
    asAdmin()
    archiveMock.mockResolvedValue({ ok: false, reason: 'already_archived' })
    const res = await archivePOST(new Request('http://localhost', { method: 'POST' }), ctx(UUID))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('ALREADY_ARCHIVED')
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('404 when the row does not exist', async () => {
    asAdmin()
    archiveMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await archivePOST(new Request('http://localhost', { method: 'POST' }), ctx(UUID))
    expect(res.status).toBe(404)
  })
})
