import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-304 — integration tests for the admin media Route Handlers (route boundary only).
 *
 * The DAL is `server-only` and does live storage + DB I/O, and the auth guard reads cookies/Auth,
 * so both are mocked: these tests prove the ROUTE contract — `requireAdmin()` enforcement
 * (401/403), UUID path validation (404), file MIME/size + body validation (400), DAL-result →
 * HTTP-status mapping (404/409/201/200), and generic error envelopes. RLS + storage behaviour are
 * covered by the gated live DAL suite.
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

vi.mock('@/dal/admin-property-media.dal', () => ({
  createPropertyMedia: vi.fn(),
  updatePropertyMedia: vi.fn(),
  deletePropertyMedia: vi.fn(),
  listAdminPropertyMedia: vi.fn(),
}))

import { POST as mediaPOST } from '@/app/api/admin/properties/[id]/media/route'
import {
  PATCH as mediaPATCH,
  DELETE as mediaDELETE,
} from '@/app/api/admin/properties/[id]/media/[mediaId]/route'
import {
  createPropertyMedia,
  deletePropertyMedia,
  updatePropertyMedia,
} from '@/dal/admin-property-media.dal'
import { AuthorizationError, requireAdmin } from '@/services/auth'

const requireAdminMock = vi.mocked(requireAdmin)
const createMock = vi.mocked(createPropertyMedia)
const updateMock = vi.mocked(updatePropertyMedia)
const deleteMock = vi.mocked(deletePropertyMedia)

const ADMIN_CTX = {
  userId: 'admin-uid',
  role: 'super_admin' as const,
  profile: { id: 'admin-uid', role: 'super_admin' as const, full_name: 'Seed Super' },
}
const PID = '0b000000-0000-0000-0000-00000000000a'
const MID = '0c000000-0000-0000-0000-00000000000b'

const DTO = {
  id: MID,
  propertyId: PID,
  url: 'https://cdn/x.jpg',
  mediaType: 'image' as const,
  orderIndex: 0,
  isCover: true,
  altText: 'Front',
  width: null,
  height: null,
  sizeBytes: 10,
  createdAt: '2026-06-28T00:00:00Z',
}

function asAdmin() {
  requireAdminMock.mockResolvedValue(ADMIN_CTX)
}
function pctx(id: string) {
  return { params: Promise.resolve({ id }) }
}
function mctx(id: string, mediaId: string) {
  return { params: Promise.resolve({ id, mediaId }) }
}

/** Build a multipart upload Request from a fake file + fields. */
function uploadReq(
  id: string,
  opts: {
    type?: string
    size?: number
    mediaType?: string
    altText?: string
    isCover?: boolean
  } = {}
): Request {
  const type = opts.type ?? 'image/jpeg'
  const size = opts.size ?? 1024
  const fd = new FormData()
  fd.set('file', new File([new Uint8Array(size)], 'photo.jpg', { type }))
  if (opts.mediaType !== null) fd.set('media_type', opts.mediaType ?? 'image')
  if (opts.altText !== null) fd.set('alt_text', opts.altText ?? 'Front view')
  if (opts.isCover) fd.set('is_cover', 'true')
  return new Request(`http://localhost/api/admin/properties/${id}/media`, {
    method: 'POST',
    body: fd,
  })
}
function jsonReq(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('admin guard enforced in every media handler (RBAC.md)', () => {
  test('unauthenticated POST → 401, DAL never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await mediaPOST(uploadReq(PID), pctx(PID))
    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  test('no-role PATCH → 403, DAL never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(403, 'NO_PROFILE', 'x'))
    const res = await mediaPATCH(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'PATCH', {
        alt_text: 'x',
      }),
      mctx(PID, MID)
    )
    expect(res.status).toBe(403)
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('unauthenticated DELETE → 401', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await mediaDELETE(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'DELETE'),
      mctx(PID, MID)
    )
    expect(res.status).toBe(401)
    expect(deleteMock).not.toHaveBeenCalled()
  })
})

describe('POST media upload', () => {
  test('201 with the created media DTO', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: true, media: DTO })
    const res = await mediaPOST(uploadReq(PID, { isCover: true }), pctx(PID))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe(MID)
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock.mock.calls[0]?.[0]).toMatchObject({
      propertyId: PID,
      mediaType: 'image',
      mimeType: 'image/jpeg',
      altText: 'Front view',
      isCover: true,
    })
  })

  test('404 on a non-UUID property id; DAL not called', async () => {
    asAdmin()
    const res = await mediaPOST(uploadReq('not-a-uuid'), pctx('not-a-uuid'))
    expect(res.status).toBe(404)
    expect(createMock).not.toHaveBeenCalled()
  })

  test('400 on an unsupported file type', async () => {
    asAdmin()
    const res = await mediaPOST(uploadReq(PID, { type: 'image/gif' }), pctx(PID))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('UNSUPPORTED_TYPE')
    expect(createMock).not.toHaveBeenCalled()
  })

  test('400 on an oversized file (> 10MB)', async () => {
    asAdmin()
    const res = await mediaPOST(uploadReq(PID, { size: 10_485_761 }), pctx(PID))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('FILE_TOO_LARGE')
    expect(createMock).not.toHaveBeenCalled()
  })

  test('400 when alt text is missing', async () => {
    asAdmin()
    const res = await mediaPOST(uploadReq(PID, { altText: '   ' }), pctx(PID))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
    expect(createMock).not.toHaveBeenCalled()
  })

  test('400 when a floorplan is marked as cover', async () => {
    asAdmin()
    const fd = new FormData()
    fd.set('file', new File([new Uint8Array(8)], 'p.png', { type: 'image/png' }))
    fd.set('media_type', 'floorplan')
    fd.set('alt_text', 'Plan')
    fd.set('is_cover', 'true')
    const req = new Request(`http://localhost/api/admin/properties/${PID}/media`, {
      method: 'POST',
      body: fd,
    })
    const res = await mediaPOST(req, pctx(PID))
    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  test('404 when the DAL reports the property is missing', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await mediaPOST(uploadReq(PID), pctx(PID))
    expect(res.status).toBe(404)
  })

  test('409 when the DAL reports the property is archived', async () => {
    asAdmin()
    createMock.mockResolvedValue({ ok: false, reason: 'archived' })
    const res = await mediaPOST(uploadReq(PID), pctx(PID))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('ARCHIVED')
  })
})

describe('PATCH media (alt / cover)', () => {
  test('200 updating alt text', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: true, media: { ...DTO, altText: 'New' } })
    const res = await mediaPATCH(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'PATCH', {
        alt_text: 'New',
      }),
      mctx(PID, MID)
    )
    expect(res.status).toBe(200)
    expect((await res.json()).data.altText).toBe('New')
  })

  test('400 on an empty patch body', async () => {
    asAdmin()
    const res = await mediaPATCH(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'PATCH', {}),
      mctx(PID, MID)
    )
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('400 when setting a floorplan as cover (DAL → not_cover_eligible)', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'not_cover_eligible' })
    const res = await mediaPATCH(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'PATCH', {
        is_cover: true,
      }),
      mctx(PID, MID)
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('NOT_COVER_ELIGIBLE')
  })

  test('404 when media not found / not on this property', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await mediaPATCH(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'PATCH', {
        is_cover: false,
      }),
      mctx(PID, MID)
    )
    expect(res.status).toBe(404)
  })

  test('409 when the property is archived', async () => {
    asAdmin()
    updateMock.mockResolvedValue({ ok: false, reason: 'archived' })
    const res = await mediaPATCH(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'PATCH', {
        alt_text: 'x',
      }),
      mctx(PID, MID)
    )
    expect(res.status).toBe(409)
  })

  test('404 on a non-UUID media id', async () => {
    asAdmin()
    const res = await mediaPATCH(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/bad`, 'PATCH', { alt_text: 'x' }),
      mctx(PID, 'bad')
    )
    expect(res.status).toBe(404)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('DELETE media', () => {
  test('200 on success', async () => {
    asAdmin()
    deleteMock.mockResolvedValue({ ok: true })
    const res = await mediaDELETE(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'DELETE'),
      mctx(PID, MID)
    )
    expect(res.status).toBe(200)
    expect((await res.json()).data.deleted).toBe(true)
  })

  test('404 when the media does not exist', async () => {
    asAdmin()
    deleteMock.mockResolvedValue({ ok: false, reason: 'not_found' })
    const res = await mediaDELETE(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'DELETE'),
      mctx(PID, MID)
    )
    expect(res.status).toBe(404)
  })

  test('409 when the property is archived', async () => {
    asAdmin()
    deleteMock.mockResolvedValue({ ok: false, reason: 'archived' })
    const res = await mediaDELETE(
      jsonReq(`http://localhost/api/admin/properties/${PID}/media/${MID}`, 'DELETE'),
      mctx(PID, MID)
    )
    expect(res.status).toBe(409)
  })
})
