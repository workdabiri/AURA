import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-303 — integration tests for the admin property Route Handlers (route boundary only).
 *
 * The DAL + audit DAL are `server-only` and do live I/O, and the auth guard reads cookies/Auth,
 * so all three are mocked: these tests prove the ROUTE contract — `requireAdmin()` enforcement
 * (401/403), Zod validation (400), DAL-result → HTTP-status mapping, the audit-log calls on
 * state changes (D-38), and generic error envelopes. RLS / publish completeness themselves are
 * covered by the gated live DAL suite + the domain unit tests.
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

vi.mock('@/dal/admin-properties.dal', () => ({
  listAdminProperties: vi.fn(),
  createAdminProperty: vi.fn(),
  updateAdminProperty: vi.fn(),
  archiveAdminProperty: vi.fn(),
  duplicateAdminProperty: vi.fn(),
}))

vi.mock('@/dal/audit-logs.dal', () => ({ writeAuditLog: vi.fn() }))

import { GET as listGET, POST as createPOST } from '@/app/api/admin/properties/route'
import { PATCH as updatePATCH } from '@/app/api/admin/properties/[id]/route'
import { POST as duplicatePOST } from '@/app/api/admin/properties/[id]/duplicate/route'
import { PATCH as archivePATCH } from '@/app/api/admin/properties/[id]/archive/route'
import { writeAuditLog } from '@/dal/audit-logs.dal'
import {
  archiveAdminProperty,
  createAdminProperty,
  duplicateAdminProperty,
  listAdminProperties,
  updateAdminProperty,
} from '@/dal/admin-properties.dal'
import { AuthorizationError, requireAdmin } from '@/services/auth'

const requireAdminMock = vi.mocked(requireAdmin)
const listMock = vi.mocked(listAdminProperties)
const createMock = vi.mocked(createAdminProperty)
const updateMock = vi.mocked(updateAdminProperty)
const archiveMock = vi.mocked(archiveAdminProperty)
const duplicateMock = vi.mocked(duplicateAdminProperty)
const auditMock = vi.mocked(writeAuditLog)

const ADMIN_CTX = {
  userId: 'admin-uid',
  role: 'super_admin' as const,
  profile: { id: 'admin-uid', role: 'super_admin' as const, full_name: 'Seed Super' },
}
const UUID = '0b000000-0000-0000-0000-00000000000a'

function asAdmin() {
  requireAdminMock.mockResolvedValue(ADMIN_CTX)
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}
function jsonReq(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const validCreate = {
  title: { en: 'Marina Apartment' },
  transaction_type: 'sale',
  market_type: 'ready',
  property_type: 'apartment',
  location_label: 'Dubai Marina',
  size_sqft: 1200,
}

beforeEach(() => {
  vi.clearAllMocks()
  auditMock.mockResolvedValue()
})

describe('admin guard enforced in the handler (RBAC.md — layout guard does not cover routes)', () => {
  test('unauthenticated GET → 401, DAL never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await listGET(new Request('http://localhost/api/admin/properties'))
    expect(res.status).toBe(401)
    expect(listMock).not.toHaveBeenCalled()
  })

  test('authenticated but no-role GET → 403, DAL never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(403, 'NO_PROFILE', 'x'))
    const res = await listGET(new Request('http://localhost/api/admin/properties'))
    expect(res.status).toBe(403)
    expect(listMock).not.toHaveBeenCalled()
  })

  test('unauthenticated POST create → 401, create + audit never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/properties', 'POST', validCreate)
    )
    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('unauthenticated archive → 401', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await archivePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}/archive`, 'PATCH'),
      ctx(UUID)
    )
    expect(res.status).toBe(401)
    expect(archiveMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/properties', () => {
  test('200 with all-statuses data + pagination envelope', async () => {
    asAdmin()
    listMock.mockResolvedValue({ items: [{ id: 'a' }] as never, total: 1 })
    const res = await listGET(new Request('http://localhost/api/admin/properties?status=draft'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.pagination).toMatchObject({ page: 1, total: 1 })
    expect(listMock.mock.calls[0]?.[0]).toMatchObject({ status: 'draft' })
  })

  test('400 on an invalid status filter', async () => {
    asAdmin()
    const res = await listGET(new Request('http://localhost/api/admin/properties?status=bogus'))
    expect(res.status).toBe(400)
    expect(listMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/properties (create draft)', () => {
  test('400 on invalid body; create + audit not called', async () => {
    asAdmin()
    const res = await createPOST(jsonReq('http://localhost/api/admin/properties', 'POST', {}))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
    expect(createMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('201 on success + writes property_created audit', async () => {
    asAdmin()
    createMock.mockResolvedValue({
      ok: true,
      id: UUID,
      slug: 'marina-apartment',
      reference_number: 'AUTEX-00001',
      publish_status: 'draft',
    })
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/properties', 'POST', validCreate)
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.reference_number).toBe('AUTEX-00001')
    expect(auditMock).toHaveBeenCalledTimes(1)
    expect(auditMock.mock.calls[0]?.[0]).toMatchObject({
      action: 'property_created',
      entityType: 'property',
      entityId: UUID,
      actorUserId: 'admin-uid',
    })
  })

  test('409 when an overridden reference number conflicts', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: false, reason: 'reference_conflict' })
    const res = await createPOST(
      jsonReq('http://localhost/api/admin/properties', 'POST', {
        ...validCreate,
        reference_number: 'AUTEX-00001',
      })
    )
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('REFERENCE_CONFLICT')
    expect(auditMock).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/admin/properties/[id] (update + publish)', () => {
  test('404 on a non-UUID id', async () => {
    asAdmin()
    const res = await updatePATCH(
      jsonReq('http://localhost/api/admin/properties/not-a-uuid', 'PATCH', {}),
      ctx('not-a-uuid')
    )
    expect(res.status).toBe(404)
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('400 with checklist failures when publish is blocked', async () => {
    asAdmin()
    updateMock.mockResolvedValue({
      ok: false,
      reason: 'checklist',
      failures: [
        { code: 'cover_image_required', message: 'A cover image is required to publish.' },
      ],
    })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}`, 'PATCH', { publish: true }),
      ctx(UUID)
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('PUBLISH_CHECKLIST')
    expect(body.failures[0].code).toBe('cover_image_required')
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('404 when the property does not exist', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}`, 'PATCH', {}),
      ctx(UUID)
    )
    expect(res.status).toBe(404)
  })

  test('409 when editing an archived property', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'archived' })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}`, 'PATCH', { location_label: 'x' }),
      ctx(UUID)
    )
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('ARCHIVED')
  })

  test('200 on a plain save → one property_updated audit', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: true, published: false, status: 'draft' })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}`, 'PATCH', { location_label: 'x' }),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    expect(auditMock).toHaveBeenCalledTimes(1)
    expect(auditMock.mock.calls[0]?.[0]).toMatchObject({ action: 'property_updated' })
  })

  test('200 on publish → property_updated AND property_published audits', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: true, published: true, status: 'published' })
    const res = await updatePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}`, 'PATCH', { publish: true }),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    const actions = auditMock.mock.calls.map((c) => c[0].action)
    expect(actions).toEqual(['property_updated', 'property_published'])
  })
})

describe('PATCH /api/admin/properties/[id]/archive', () => {
  test('200 + property_archived audit', async () => {
    asAdmin()
    archiveMock.mockResolvedValue({ ok: true, previousStatus: 'published' })
    const res = await archivePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}/archive`, 'PATCH'),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    expect((await res.json()).data.status).toBe('archived')
    expect(auditMock.mock.calls[0]?.[0]).toMatchObject({ action: 'property_archived' })
  })

  test('409 when not archivable (already archived)', async () => {
    asAdmin()
    archiveMock.mockResolvedValue({ ok: false, reason: 'not_archivable' })
    const res = await archivePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}/archive`, 'PATCH'),
      ctx(UUID)
    )
    expect(res.status).toBe(409)
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('404 when the property does not exist', async () => {
    asAdmin()
    archiveMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await archivePATCH(
      jsonReq(`http://localhost/api/admin/properties/${UUID}/archive`, 'PATCH'),
      ctx(UUID)
    )
    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/properties/[id]/duplicate', () => {
  test('201 with the new draft + property_duplicated audit', async () => {
    asAdmin()
    duplicateMock.mockResolvedValue({
      ok: true,
      id: 'new-id',
      slug: 'marina-apartment-2',
      reference_number: 'AUTEX-00002',
    })
    const res = await duplicatePOST(
      jsonReq(`http://localhost/api/admin/properties/${UUID}/duplicate`, 'POST'),
      ctx(UUID)
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('new-id')
    expect(auditMock.mock.calls[0]?.[0]).toMatchObject({
      action: 'property_duplicated',
      entityId: 'new-id',
    })
  })

  test('404 when the source does not exist', async () => {
    asAdmin()
    duplicateMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await duplicatePOST(
      jsonReq(`http://localhost/api/admin/properties/${UUID}/duplicate`, 'POST'),
      ctx(UUID)
    )
    expect(res.status).toBe(404)
    expect(auditMock).not.toHaveBeenCalled()
  })
})
