import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * AURA-306 — integration tests for the admin settings Route Handler (route boundary only).
 *
 * The DAL + audit DAL are `server-only` and do live I/O, and the auth guard reads cookies/Auth, so
 * all three are mocked: these tests prove the ROUTE contract — `requireAdmin()` enforcement
 * (401/403), Zod validation against the editable allowlist (400 on unknown key / invalid email /
 * invalid social URL / empty patch), partial-batch writes (one or many keys), the `settings_updated`
 * audit call, and that audit metadata carries the changed key NAMES only (never values). RLS is
 * covered by the gated live suite. The domain schema is pure and intentionally NOT mocked.
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

vi.mock('@/dal/settings.dal', () => ({
  getAdminSettings: vi.fn(),
  updateAdminSettings: vi.fn(),
}))

vi.mock('@/dal/audit-logs.dal', () => ({ writeAuditLog: vi.fn() }))

import { GET as settingsGET, PATCH as settingsPATCH } from '@/app/api/admin/settings/route'
import { getAdminSettings, updateAdminSettings } from '@/dal/settings.dal'
import { writeAuditLog } from '@/dal/audit-logs.dal'
import { AuthorizationError, requireAdmin } from '@/services/auth'

const requireAdminMock = vi.mocked(requireAdmin)
const getMock = vi.mocked(getAdminSettings)
const updateMock = vi.mocked(updateAdminSettings)
const auditMock = vi.mocked(writeAuditLog)

const ADMIN_CTX = {
  userId: 'admin-uid',
  role: 'client_admin' as const,
  profile: { id: 'admin-uid', role: 'client_admin' as const, full_name: 'Seed Admin' },
}

const SETTINGS_DTO = {
  agencyName: 'AUTEX Estates Dubai',
  agencyPhone: null,
  agencyEmail: null,
  agencyWhatsapp: null,
  agencyAddress: 'Dubai, UAE',
  footerTagline: 'Exclusive properties.',
  socialLinks: {},
}

function asAdmin() {
  requireAdminMock.mockResolvedValue(ADMIN_CTX)
}

function jsonReq(body: unknown): Request {
  return new Request('http://localhost/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  auditMock.mockResolvedValue()
  getMock.mockResolvedValue(SETTINGS_DTO)
})

describe('admin guard enforced in the handler (RBAC.md — layout guard does not cover routes)', () => {
  test('unauthenticated GET → 401, DAL never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(401, 'UNAUTHENTICATED', 'x'))
    const res = await settingsGET()
    expect(res.status).toBe(401)
    expect(getMock).not.toHaveBeenCalled()
  })

  test('authenticated but no-role PATCH → 403, update + audit never called', async () => {
    requireAdminMock.mockRejectedValue(new AuthorizationError(403, 'NO_PROFILE', 'x'))
    const res = await settingsPATCH(jsonReq({ agency_name: 'X' }))
    expect(res.status).toBe(403)
    expect(updateMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/settings', () => {
  test('200 returns the editable settings DTO (allowed keys only)', async () => {
    asAdmin()
    const res = await settingsGET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(SETTINGS_DTO)
  })
})

describe('PATCH /api/admin/settings — validation', () => {
  test('400 on invalid JSON', async () => {
    asAdmin()
    const res = await settingsPATCH(
      new Request('http://localhost/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_JSON')
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('400 on an empty patch; update + audit not called', async () => {
    asAdmin()
    const res = await settingsPATCH(jsonReq({}))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
    expect(updateMock).not.toHaveBeenCalled()
    expect(auditMock).not.toHaveBeenCalled()
  })

  test('400 on an unknown / deferred key', async () => {
    asAdmin()
    for (const body of [{ not_a_key: 'x' }, { logo_url: 'https://x/y.png' }]) {
      const res = await settingsPATCH(jsonReq(body))
      expect(res.status).toBe(400)
      expect((await res.json()).code).toBe('VALIDATION_ERROR')
    }
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('400 on an invalid email', async () => {
    asAdmin()
    const res = await settingsPATCH(jsonReq({ agency_email: 'nope' }))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  test('400 on an invalid social URL', async () => {
    asAdmin()
    const res = await settingsPATCH(jsonReq({ social_links: { instagram: 'not-a-url' } }))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/admin/settings — writes + audit', () => {
  test('200 updates a single key and emits settings_updated', async () => {
    asAdmin()
    updateMock.mockResolvedValue(['agency_name'])
    const res = await settingsPATCH(jsonReq({ agency_name: 'AUTEX Estates' }))
    expect(res.status).toBe(200)

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(updateMock.mock.calls[0]?.[0]).toEqual([{ key: 'agency_name', value: 'AUTEX Estates' }])
    expect(updateMock.mock.calls[0]?.[1]).toBe('admin-uid')

    expect(auditMock).toHaveBeenCalledTimes(1)
    expect(auditMock.mock.calls[0]?.[0]).toMatchObject({
      action: 'settings_updated',
      entityType: 'settings',
      entityId: null,
    })
  })

  test('200 updates multiple keys at once (partial batch)', async () => {
    asAdmin()
    updateMock.mockResolvedValue(['agency_name', 'agency_phone', 'footer_tagline'])
    const res = await settingsPATCH(
      jsonReq({
        agency_name: 'AUTEX',
        agency_phone: '+971 4 000 0000',
        footer_tagline: 'Exclusive.',
      })
    )
    expect(res.status).toBe(200)
    const rows = updateMock.mock.calls[0]?.[0] as { key: string }[]
    expect(rows.map((r) => r.key)).toEqual(['agency_name', 'agency_phone', 'footer_tagline'])
  })

  test('audit metadata records changed key NAMES only — no values', async () => {
    asAdmin()
    updateMock.mockResolvedValue(['agency_phone', 'agency_email'])
    await settingsPATCH(jsonReq({ agency_phone: '+971 4 111 2222', agency_email: 'a@b.com' }))

    const metadata = auditMock.mock.calls[0]?.[0].metadata as Record<string, unknown>
    expect(metadata).toEqual({ changed_keys: ['agency_phone', 'agency_email'] })
    // Hard assertion: no value of any changed setting appears in the audit metadata.
    const serialized = JSON.stringify(metadata)
    expect(serialized).not.toContain('+971 4 111 2222')
    expect(serialized).not.toContain('a@b.com')
  })

  test('updates social_links as a whole object (empty object clears all)', async () => {
    asAdmin()
    updateMock.mockResolvedValue(['social_links'])
    const res = await settingsPATCH(jsonReq({ social_links: {} }))
    expect(res.status).toBe(200)
    expect(updateMock.mock.calls[0]?.[0]).toEqual([{ key: 'social_links', value: {} }])
  })
})
