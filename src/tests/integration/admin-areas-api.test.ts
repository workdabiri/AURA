import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-305 — integration tests for the admin area Route Handlers (route boundary only).
 *
 * The DAL + audit DAL are `server-only` and do live I/O, and the auth guard reads cookies/Auth,
 * so all three are mocked: these tests prove the ROUTE contract — `requireAdmin()` enforcement
 * (401/403), Zod validation (400), image MIME/size validation (400), DAL-result → HTTP-status
 * mapping (409/404/201/200), the audit-log calls on state changes (D-38), and that slug is never
 * forwarded on PATCH (immutable after create). RLS / counts are covered by the gated live suite.
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

vi.mock('@/dal/admin-areas.dal', () => ({
  listAdminAreas: vi.fn(),
  createAdminArea: vi.fn(),
  updateAdminArea: vi.fn(),
}))

vi.mock('@/dal/audit-logs.dal', () => ({ writeAuditLog: vi.fn() }))

import { GET as listGET, POST as createPOST } from '@/app/api/admin/areas/route'
import { PATCH as updatePATCH } from '@/app/api/admin/areas/[id]/route'
import { writeAuditLog } from '@/dal/audit-logs.dal'
import { createAdminArea, listAdminAreas, updateAdminArea } from '@/dal/admin-areas.dal'
import { AuthorizationError, requireAdmin } from '@/services/auth'

const requireAdminMock = vi.mocked(requireAdmin)
const listMock = vi.mocked(listAdminAreas)
const createMock = vi.mocked(createAdminArea)
const updateMock = vi.mocked(updateAdminArea)
const auditMock = vi.mocked(writeAuditLog)

const ADMIN_CTX = {
  userId: 'admin-uid',
  role: 'super_admin' as const,
  profile: { id: 'admin-uid', role: 'super_admin' as const, full_name: 'Seed Super' },
}
const UUID = '0c000000-0000-0000-0000-000000000001'

const AREA_DTO = {
  id: UUID,
  slug: 'dubai-marina',
  name: { en: 'Dubai Marina' },
  description: { en: '' },
  imageUrl: null,
  isActive: true,
  sortOrder: 0,
  createdAt: '2026-06-29T00:00:00Z',
  updatedAt: '2026-06-29T00:00:00Z',
}

function asAdmin() {
  requireAdminMock.mockResolvedValue(ADMIN_CTX)
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}

/** Build a multipart create/update Request from fields + an optional fake image file. */
function formReq(
  url: string,
  method: string,
  fields: Record<string, string>,
  file?: { type: string; size: number }
): Request {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  if (file) fd.set('file', new File([new Uint8Array(file.size)], 'area.jpg', { type: file.type }))
  return new Request(url, { method, body: fd })
}

beforeEach(() => {
  vi.clearAllMocks()
  auditMock.mockResolvedValue()
})

describe('admin guard enforced in the handler (RBAC.md — layout guard does not cover routes)', () => {
  test('unauthenticated GET → 401, DAL never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await listGET()
    expect(res.status).toBe(401)
    expect(listMock).not.toHaveBeenCalled()
  })

  test('authenticated but no-role POST → 403, create + audit never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(403, 'NO_PROFILE', 'x'))
    const res = await createPOST(
      formReq('http://localhost/api/admin/areas', 'POST', {
        slug: 'marina',
        name_en: 'Marina',
      })
    )
    expect(res.status).toBe(403)
    expect(createMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('unauthenticated PATCH → 401', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await updatePATCH(
      formReq(`http://localhost/api/admin/areas/${UUID}`, 'PATCH', { is_active: 'false' }),
      ctx(UUID)
    )
    expect(res.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/areas', () => {
  test('200 returns active + inactive areas with counts', async () => {
    asAdmin()
    listMock.mockResolvedValue([
      { ...AREA_DTO, totalProperties: 4, publishedProperties: 2 } as never,
    ])
    const res = await listGET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({ totalProperties: 4, publishedProperties: 2 })
  })
})

describe('POST /api/admin/areas (create)', () => {
  test('201 on success + writes area_created audit', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: true, area: AREA_DTO })
    const res = await createPOST(
      formReq('http://localhost/api/admin/areas', 'POST', {
        slug: 'dubai-marina',
        name_en: 'Dubai Marina',
        sort_order: '0',
        is_active: 'true',
      })
    )
    expect(res.status).toBe(201)
    expect((await res.json()).data.slug).toBe('dubai-marina')
    expect(auditMock).toHaveBeenCalledTimes(1)
    expect(auditMock.mock.calls[0]?.[0]).toMatchObject({
      action: 'area_created',
      entityType: 'area',
      entityId: UUID,
    })
  })

  test('400 on an invalid slug; create + audit not called', async () => {
    asAdmin()
    const res = await createPOST(
      formReq('http://localhost/api/admin/areas', 'POST', {
        slug: 'bad slug!',
        name_en: 'Marina',
      })
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
    expect(createMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('400 on a missing name', async () => {
    asAdmin()
    const res = await createPOST(
      formReq('http://localhost/api/admin/areas', 'POST', { slug: 'marina' })
    )
    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  test('400 on an unsupported image MIME type', async () => {
    asAdmin()
    const res = await createPOST(
      formReq(
        'http://localhost/api/admin/areas',
        'POST',
        { slug: 'marina', name_en: 'Marina' },
        { type: 'image/gif', size: 1024 }
      )
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('UNSUPPORTED_TYPE')
    expect(createMock).not.toHaveBeenCalled()
  })

  test('400 on an image over the 10MB limit', async () => {
    asAdmin()
    const res = await createPOST(
      formReq(
        'http://localhost/api/admin/areas',
        'POST',
        { slug: 'marina', name_en: 'Marina' },
        { type: 'image/jpeg', size: 10_485_761 }
      )
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('FILE_TOO_LARGE')
    expect(createMock).not.toHaveBeenCalled()
  })

  test('409 when the slug already exists', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: false, reason: 'slug_conflict' })
    const res = await createPOST(
      formReq('http://localhost/api/admin/areas', 'POST', {
        slug: 'dubai-marina',
        name_en: 'Dubai Marina',
      })
    )
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('SLUG_CONFLICT')
    expect(auditMock).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/admin/areas/[id] (edit / deactivate / reactivate)', () => {
  test('404 on a non-UUID id', async () => {
    asAdmin()
    const res = await updatePATCH(
      formReq('http://localhost/api/admin/areas/not-a-uuid', 'PATCH', { name_en: 'X' }),
      ctx('not-a-uuid')
    )
    expect(res.status).toBe(404)
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('a slug field in the PATCH body is NOT forwarded to the DAL (immutable)', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: true, area: AREA_DTO, previousActive: true })
    const res = await updatePATCH(
      formReq(`http://localhost/api/admin/areas/${UUID}`, 'PATCH', {
        slug: 'attempted-new-slug',
        name_en: 'Renamed',
      }),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    const patchArg = updateMock.mock.calls[0]?.[1] as Record<string, unknown>
    expect('slug' in patchArg).toBe(false)
    expect(patchArg.name).toEqual({ en: 'Renamed' })
  })

  test('200 edits fields → one area_updated audit (no active_change metadata)', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: true, area: AREA_DTO, previousActive: true })
    const res = await updatePATCH(
      formReq(`http://localhost/api/admin/areas/${UUID}`, 'PATCH', { name_en: 'Renamed' }),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    expect(auditMock).toHaveBeenCalledTimes(1)
    const audit = auditMock.mock.calls[0]?.[0]
    expect(audit).toMatchObject({ action: 'area_updated', entityType: 'area', entityId: UUID })
    expect(audit?.metadata).toEqual({})
  })

  test('200 deactivate → area_updated audit with active_change=deactivated', async () => {
    asAdmin()
    updateMock.mockResolvedValue({
      ok: true,
      area: { ...AREA_DTO, isActive: false },
      previousActive: true,
    })
    const res = await updatePATCH(
      formReq(`http://localhost/api/admin/areas/${UUID}`, 'PATCH', { is_active: 'false' }),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    expect(auditMock.mock.calls[0]?.[0].metadata).toEqual({ active_change: 'deactivated' })
  })

  test('200 reactivate → area_updated audit with active_change=reactivated', async () => {
    asAdmin()
    updateMock.mockResolvedValue({
      ok: true,
      area: { ...AREA_DTO, isActive: true },
      previousActive: false,
    })
    const res = await updatePATCH(
      formReq(`http://localhost/api/admin/areas/${UUID}`, 'PATCH', { is_active: 'true' }),
      ctx(UUID)
    )
    expect(res.status).toBe(200)
    expect(auditMock.mock.calls[0]?.[0].metadata).toEqual({ active_change: 'reactivated' })
  })

  test('404 when the area does not exist', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await updatePATCH(
      formReq(`http://localhost/api/admin/areas/${UUID}`, 'PATCH', { name_en: 'X' }),
      ctx(UUID)
    )
    expect(res.status).toBe(404)
    expect(auditMock).not.toHaveBeenCalled()
  })
})
