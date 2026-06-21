import { describe, expect, test } from 'vitest'

import {
  PUBLIC_SETTING_KEYS,
  defaultPublicSettings,
  projectPublicSettings,
  type PublicSettings,
} from '@/domain/settings'

/**
 * AURA-201 — pure unit tests for the public settings projector (A-09 allowlist).
 *
 * These assert the security-critical transformation: only allowlisted keys are
 * surfaced, values are validated per key, malformed/missing values fail closed
 * to safe defaults, and no metadata can ever leak.
 */
describe('defaultPublicSettings', () => {
  test('returns the safe demo defaults', () => {
    expect(defaultPublicSettings()).toEqual<PublicSettings>({
      agencyName: 'AUTEX Estates Dubai',
      agencyPhone: null,
      agencyEmail: null,
      agencyWhatsapp: null,
      agencyAddress: 'Dubai, UAE',
      footerTagline: 'Exclusive properties. Exceptional service.',
      socialLinks: {},
    })
  })

  test('returns a fresh object each call (no shared mutable state)', () => {
    const a = defaultPublicSettings()
    const b = defaultPublicSettings()
    expect(a).not.toBe(b)
    expect(a.socialLinks).not.toBe(b.socialLinks)
  })
})

describe('projectPublicSettings — allowlist', () => {
  test('empty input yields defaults', () => {
    expect(projectPublicSettings([])).toEqual(defaultPublicSettings())
  })

  test('only the seven approved keys exist on the output', () => {
    const out = projectPublicSettings([])
    expect(Object.keys(out).sort()).toEqual(
      [
        'agencyAddress',
        'agencyEmail',
        'agencyName',
        'agencyPhone',
        'agencyWhatsapp',
        'footerTagline',
        'socialLinks',
      ].sort()
    )
  })

  test('the approved key list is exactly the seven owner-approved keys', () => {
    expect([...PUBLIC_SETTING_KEYS].sort()).toEqual(
      [
        'agency_name',
        'agency_phone',
        'agency_email',
        'agency_whatsapp',
        'agency_address',
        'footer_tagline',
        'social_links',
      ].sort()
    )
  })

  test('unknown / internal keys are ignored (never surfaced)', () => {
    const out = projectPublicSettings([
      { key: 'agency_name', value: 'Mapped Agency' },
      { key: 'internal_secret', value: 'top-secret' },
      { key: 'admin_only_flag', value: true },
      { key: 'updated_by', value: 'a-user-id' },
      { key: 'service_role_key', value: 'leaked' },
    ])
    expect(out.agencyName).toBe('Mapped Agency')
    expect(JSON.stringify(out)).not.toContain('top-secret')
    expect(JSON.stringify(out)).not.toContain('leaked')
    expect(JSON.stringify(out)).not.toContain('a-user-id')
  })

  test('row metadata on the input is never copied onto the output', () => {
    const out = projectPublicSettings([
      { key: 'agency_name', value: 'Agency', updated_by: 'admin-123' } as never,
    ])
    expect(Object.keys(out)).not.toContain('updated_by')
    expect(Object.keys(out)).not.toContain('key')
    expect(Object.keys(out)).not.toContain('value')
  })
})

describe('projectPublicSettings — per-key validation (fail closed)', () => {
  test('maps valid values across all keys', () => {
    const out = projectPublicSettings([
      { key: 'agency_name', value: 'AUTEX Live' },
      { key: 'agency_phone', value: '+971 4 123 4567' },
      { key: 'agency_email', value: 'hello@autex.example' },
      { key: 'agency_whatsapp', value: '+971501234567' },
      { key: 'agency_address', value: 'Downtown, Dubai' },
      { key: 'footer_tagline', value: 'Beyond the skyline.' },
      { key: 'social_links', value: { instagram: 'https://instagram.com/autex' } },
    ])
    expect(out).toEqual<PublicSettings>({
      agencyName: 'AUTEX Live',
      agencyPhone: '+971 4 123 4567',
      agencyEmail: 'hello@autex.example',
      agencyWhatsapp: '+971501234567',
      agencyAddress: 'Downtown, Dubai',
      footerTagline: 'Beyond the skyline.',
      socialLinks: { instagram: 'https://instagram.com/autex' },
    })
  })

  test('empty/blank required strings fall back to defaults', () => {
    const out = projectPublicSettings([
      { key: 'agency_name', value: '   ' },
      { key: 'agency_address', value: '' },
      { key: 'footer_tagline', value: 42 },
    ])
    const d = defaultPublicSettings()
    expect(out.agencyName).toBe(d.agencyName)
    expect(out.agencyAddress).toBe(d.agencyAddress)
    expect(out.footerTagline).toBe(d.footerTagline)
  })

  test('malformed email is rejected to null', () => {
    expect(
      projectPublicSettings([{ key: 'agency_email', value: 'not-an-email' }]).agencyEmail
    ).toBeNull()
  })

  test('present-but-invalid optional contact fields become null', () => {
    const out = projectPublicSettings([
      { key: 'agency_phone', value: '' },
      { key: 'agency_whatsapp', value: 123 },
    ])
    expect(out.agencyPhone).toBeNull()
    expect(out.agencyWhatsapp).toBeNull()
  })

  test('trims surrounding whitespace on accepted strings', () => {
    expect(projectPublicSettings([{ key: 'agency_name', value: '  Spaced  ' }]).agencyName).toBe(
      'Spaced'
    )
  })
})

describe('projectPublicSettings — social_links', () => {
  test('keeps known platforms and strips unknown ones', () => {
    const out = projectPublicSettings([
      {
        key: 'social_links',
        value: {
          instagram: 'https://instagram.com/autex',
          linkedin: 'https://linkedin.com/company/autex',
          tiktok: 'https://tiktok.com/@autex',
        },
      },
    ])
    expect(out.socialLinks).toEqual({
      instagram: 'https://instagram.com/autex',
      linkedin: 'https://linkedin.com/company/autex',
    })
  })

  test('a malformed social_links value fails closed to empty', () => {
    expect(
      projectPublicSettings([{ key: 'social_links', value: 'https://nope' }]).socialLinks
    ).toEqual({})
    expect(
      projectPublicSettings([{ key: 'social_links', value: { instagram: 'not-a-url' } }])
        .socialLinks
    ).toEqual({})
  })
})
