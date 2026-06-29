import { describe, expect, test } from 'vitest'

import {
  EDITABLE_SETTING_KEYS,
  isEditableSettingKey,
  settingsPatchSchema,
  toSettingRows,
} from '@/domain/settings/admin'
import { PUBLIC_SETTING_KEYS } from '@/domain/settings/public-settings'

/**
 * AURA-306 — pure unit tests for the admin settings write contract (no DB, no React, no I/O).
 *
 * Covers: the exact editable allowlist, unknown/deferred key rejection, per-key value validation
 * (non-empty strings, valid email, known social-platform URLs), the partial-batch + empty-patch
 * rules, and the `toSettingRows` allowlist backstop.
 */

const DEFERRED_KEYS = [
  'logo_url',
  'seo_title',
  'seo_description',
  'office_registration_number',
  'broker_license_number',
  'years_in_market',
  'verified_badge_enabled',
  'footer_content',
  'footer_links',
  'contact_us_content',
]

describe('EDITABLE_SETTING_KEYS — exact allowlist', () => {
  test('is exactly the seven owner-approved keys, in order', () => {
    expect([...EDITABLE_SETTING_KEYS]).toEqual([
      'agency_name',
      'agency_phone',
      'agency_email',
      'agency_whatsapp',
      'agency_address',
      'footer_tagline',
      'social_links',
    ])
  })

  test('equals the public allowlist (no rename, no extra keys — owner decision)', () => {
    expect([...EDITABLE_SETTING_KEYS].sort()).toEqual([...PUBLIC_SETTING_KEYS].sort())
  })

  test('contains NONE of the deferred keys', () => {
    for (const key of DEFERRED_KEYS) {
      expect(EDITABLE_SETTING_KEYS).not.toContain(key)
      expect(isEditableSettingKey(key)).toBe(false)
    }
  })

  test('isEditableSettingKey recognises every allowed key', () => {
    for (const key of EDITABLE_SETTING_KEYS) expect(isEditableSettingKey(key)).toBe(true)
  })
})

describe('settingsPatchSchema — unknown / deferred keys', () => {
  test('rejects an unknown key (strict)', () => {
    const r = settingsPatchSchema.safeParse({ agency_name: 'AUTEX', not_a_key: 'x' })
    expect(r.success).toBe(false)
  })

  test('rejects every deferred key', () => {
    for (const key of DEFERRED_KEYS) {
      const r = settingsPatchSchema.safeParse({ [key]: 'whatever' })
      expect(r.success, key).toBe(false)
    }
  })

  test('rejects an empty patch ({} → invalid)', () => {
    expect(settingsPatchSchema.safeParse({}).success).toBe(false)
  })
})

describe('settingsPatchSchema — per-key value validation', () => {
  test('accepts a single allowed key (partial batch of one)', () => {
    const r = settingsPatchSchema.safeParse({ agency_name: 'AUTEX Estates' })
    expect(r.success).toBe(true)
  })

  test('accepts multiple allowed keys at once', () => {
    const r = settingsPatchSchema.safeParse({
      agency_name: 'AUTEX',
      agency_phone: '+971 4 000 0000',
      footer_tagline: 'Exclusive properties.',
    })
    expect(r.success).toBe(true)
  })

  test('trims string values', () => {
    const r = settingsPatchSchema.parse({ agency_name: '  AUTEX  ' })
    expect(r.agency_name).toBe('AUTEX')
  })

  test('rejects an empty / whitespace string for a required scalar', () => {
    expect(settingsPatchSchema.safeParse({ agency_name: '' }).success).toBe(false)
    expect(settingsPatchSchema.safeParse({ agency_name: '   ' }).success).toBe(false)
    expect(settingsPatchSchema.safeParse({ footer_tagline: '' }).success).toBe(false)
  })

  test('validates email', () => {
    expect(settingsPatchSchema.safeParse({ agency_email: 'hello@autex.ae' }).success).toBe(true)
    expect(settingsPatchSchema.safeParse({ agency_email: 'not-an-email' }).success).toBe(false)
    expect(settingsPatchSchema.safeParse({ agency_email: '' }).success).toBe(false)
  })
})

describe('settingsPatchSchema — social_links', () => {
  test('accepts an empty object (clears all links)', () => {
    expect(settingsPatchSchema.safeParse({ social_links: {} }).success).toBe(true)
  })

  test('accepts known platforms with valid URLs', () => {
    const r = settingsPatchSchema.safeParse({
      social_links: { instagram: 'https://instagram.com/autex', x: 'https://x.com/autex' },
    })
    expect(r.success).toBe(true)
  })

  test('rejects an invalid platform URL', () => {
    expect(
      settingsPatchSchema.safeParse({ social_links: { instagram: 'not-a-url' } }).success
    ).toBe(false)
  })

  test('strips unknown platform keys (mirrors the public projector)', () => {
    const r = settingsPatchSchema.parse({
      social_links: { instagram: 'https://instagram.com/autex', tiktok: 'https://tiktok.com/@x' },
    } as Record<string, unknown>)
    expect(r.social_links).toEqual({ instagram: 'https://instagram.com/autex' })
  })
})

describe('toSettingRows — allowlist backstop', () => {
  test('returns rows in allowlist order for the provided keys', () => {
    const rows = toSettingRows({ footer_tagline: 'Tag', agency_name: 'AUTEX' })
    expect(rows).toEqual([
      { key: 'agency_name', value: 'AUTEX' },
      { key: 'footer_tagline', value: 'Tag' },
    ])
  })

  test('drops undefined values', () => {
    expect(toSettingRows({ agency_name: 'AUTEX', agency_phone: undefined })).toEqual([
      { key: 'agency_name', value: 'AUTEX' },
    ])
  })

  test('ignores any non-allowlisted key even if present', () => {
    const rows = toSettingRows({ agency_name: 'AUTEX', logo_url: 'x', not_a_key: 'y' })
    expect(rows).toEqual([{ key: 'agency_name', value: 'AUTEX' }])
  })

  test('returns an empty array for an all-undefined / empty input', () => {
    expect(toSettingRows({})).toEqual([])
  })
})
