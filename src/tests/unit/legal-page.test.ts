import { describe, expect, test } from 'vitest'

import {
  extractEn,
  isPublicLegalSlug,
  PUBLIC_LEGAL_SLUGS,
  toLegalPageDTO,
  type PublicLegalPageRow,
} from '@/domain/legal/legal-page'

/**
 * AURA-205 — pure domain unit tests for the public legal page DTO + projection.
 *
 * Covers: public slug validation, English JSONB extraction (+ fallback), the projector's exact
 * allowlist, and the structural dropping of any extra/internal field present on the input row.
 */

describe('isPublicLegalSlug', () => {
  test('accepts only the public allowlist', () => {
    expect(PUBLIC_LEGAL_SLUGS).toEqual(['privacy', 'terms'])
    expect(isPublicLegalSlug('privacy')).toBe(true)
    expect(isPublicLegalSlug('terms')).toBe(true)
  })

  test('rejects unsupported, malformed, and non-string slugs', () => {
    expect(isPublicLegalSlug('cookies')).toBe(false)
    expect(isPublicLegalSlug('Privacy')).toBe(false)
    expect(isPublicLegalSlug('')).toBe(false)
    expect(isPublicLegalSlug('privacy ')).toBe(false)
    expect(isPublicLegalSlug(undefined)).toBe(false)
    expect(isPublicLegalSlug(null)).toBe(false)
    expect(isPublicLegalSlug(42)).toBe(false)
  })
})

describe('extractEn', () => {
  test('returns the English string from an i18n JSONB object', () => {
    expect(extractEn({ en: 'Hello', ar: 'مرحبا' })).toBe('Hello')
  })

  test('falls back to empty string for missing/invalid/non-object JSONB', () => {
    expect(extractEn({})).toBe('')
    expect(extractEn({ ar: 'only arabic' })).toBe('')
    expect(extractEn({ en: 123 })).toBe('')
    expect(extractEn(null)).toBe('')
    expect(extractEn(undefined)).toBe('')
    expect(extractEn('a raw string')).toBe('')
    expect(extractEn(['en'])).toBe('')
  })
})

describe('toLegalPageDTO', () => {
  const baseRow: PublicLegalPageRow = {
    slug: 'privacy',
    title: { en: 'Privacy Policy' },
    content: { en: '# Privacy\n\nWe respect your data.' },
    effective_date: '2026-01-01',
  }

  test('projects the exact public DTO shape', () => {
    const dto = toLegalPageDTO(baseRow)
    expect(dto).toEqual({
      slug: 'privacy',
      title: 'Privacy Policy',
      content: '# Privacy\n\nWe respect your data.',
      effectiveDate: '2026-01-01',
    })
  })

  test('returns raw Markdown content unchanged (not pre-rendered)', () => {
    const dto = toLegalPageDTO({
      ...baseRow,
      content: { en: '**bold** and [link](https://x.com)' },
    })
    expect(dto?.content).toBe('**bold** and [link](https://x.com)')
  })

  test('falls back to empty strings for missing/invalid title, content, effective_date', () => {
    const dto = toLegalPageDTO({
      slug: 'terms',
      title: {},
      content: { en: 99 },
      effective_date: null,
    })
    expect(dto).toEqual({ slug: 'terms', title: '', content: '', effectiveDate: '' })
  })

  test('returns null for a non-public slug', () => {
    expect(toLegalPageDTO({ ...baseRow, slug: 'cookies' })).toBeNull()
    expect(toLegalPageDTO({ ...baseRow, slug: 'admin' })).toBeNull()
  })

  test('structurally drops any extra/internal field present on the input row', () => {
    const dirty = {
      ...baseRow,
      id: 'uuid-1',
      status: 'published',
      version: 3,
      last_updated_by: 'admin-uuid',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
      published_at: '2026-01-01T00:00:00Z',
    } as unknown as PublicLegalPageRow
    const dto = toLegalPageDTO(dirty)

    expect(dto).not.toBeNull()
    expect(Object.keys(dto as object).sort()).toEqual(['content', 'effectiveDate', 'slug', 'title'])
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
      expect(dto as object).not.toHaveProperty(leaked)
    }
  })
})
