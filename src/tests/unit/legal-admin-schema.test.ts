import { describe, expect, test } from 'vitest'

import {
  assertSafeLegalMarkdown,
  containsUnsafeLegalHtml,
  isLegalAdminSlug,
  LEGAL_ADMIN_SLUGS,
  LEGAL_PAGE_STATUSES,
  legalCreateSchema,
  legalUpdateSchema,
  nextPublishedVersion,
  toAdminLegalDetail,
  toAdminLegalListItem,
  type AdminLegalPageRow,
} from '@/domain/legal/admin'

/**
 * AURA-307 — pure domain unit tests for the admin legal contract: slug allowlist, create/update
 * grammar, effective-date validation, the D-12 unsafe-HTML guard (Markdown accepted; raw HTML /
 * scripts / event handlers / `javascript:` rejected; `5 < 10` accepted), the version-bump rule,
 * and the admin DTO projectors.
 */

describe('legal admin slug allowlist', () => {
  test('the allowlist is exactly privacy + terms', () => {
    expect(LEGAL_ADMIN_SLUGS).toEqual(['privacy', 'terms'])
  })

  test('accepts only privacy and terms', () => {
    expect(isLegalAdminSlug('privacy')).toBe(true)
    expect(isLegalAdminSlug('terms')).toBe(true)
  })

  test('rejects arbitrary / malformed / non-string slugs', () => {
    expect(isLegalAdminSlug('cookies')).toBe(false)
    expect(isLegalAdminSlug('Privacy')).toBe(false)
    expect(isLegalAdminSlug('')).toBe(false)
    expect(isLegalAdminSlug(undefined)).toBe(false)
    expect(isLegalAdminSlug(42)).toBe(false)
  })
})

describe('legal page statuses', () => {
  test('the lifecycle is draft / published / archived', () => {
    expect(LEGAL_PAGE_STATUSES).toEqual(['draft', 'published', 'archived'])
  })
})

describe('containsUnsafeLegalHtml (D-12 write-time guard)', () => {
  test('accepts ordinary Markdown', () => {
    expect(containsUnsafeLegalHtml('# Heading\n\nSome **bold** and _italic_ text.')).toBe(false)
    expect(containsUnsafeLegalHtml('- one\n- two\n\n1. a\n2. b')).toBe(false)
  })

  test('accepts an ordinary Markdown link (not raw HTML)', () => {
    expect(containsUnsafeLegalHtml('See our [privacy policy](https://example.com/privacy).')).toBe(
      false
    )
  })

  test('accepts comparison text like 5 < 10 and a < b', () => {
    expect(containsUnsafeLegalHtml('If 5 < 10 and 20 > 15 then proceed.')).toBe(false)
    expect(containsUnsafeLegalHtml('a < b and c > d')).toBe(false)
    expect(containsUnsafeLegalHtml('Inequality 5<10 holds.')).toBe(false)
  })

  test('rejects a <script> tag', () => {
    expect(containsUnsafeLegalHtml('Hello <script>alert(1)</script>')).toBe(true)
  })

  test('rejects an <iframe> tag', () => {
    expect(containsUnsafeLegalHtml('<iframe src="https://evil"></iframe>')).toBe(true)
  })

  test('rejects a javascript: protocol in a link', () => {
    expect(containsUnsafeLegalHtml('[bad](javascript:alert(1))')).toBe(true)
  })

  test('rejects inline event handlers', () => {
    expect(containsUnsafeLegalHtml('<button onclick="x()">x</button>')).toBe(true)
    expect(containsUnsafeLegalHtml('text onload= more')).toBe(true)
  })

  test('rejects ordinary raw HTML tags (div / p / img / a / span / style)', () => {
    for (const html of [
      '<div>x</div>',
      '<p>para</p>',
      '<img src="x.png">',
      '<a href="https://x">link</a>',
      '<span>y</span>',
      '<style>.x{}</style>',
    ]) {
      expect(containsUnsafeLegalHtml(html), html).toBe(true)
    }
  })

  test('rejects HTML comments', () => {
    expect(containsUnsafeLegalHtml('intro <!-- hidden --> outro')).toBe(true)
  })

  test('assertSafeLegalMarkdown throws on unsafe, passes on safe', () => {
    expect(() => assertSafeLegalMarkdown('# ok')).not.toThrow()
    expect(() => assertSafeLegalMarkdown('<script>x</script>')).toThrow()
  })
})

describe('legalCreateSchema', () => {
  const valid = {
    slug: 'privacy',
    title: 'Privacy Policy',
    content: '# Privacy\n\nWe respect your data.',
    effective_date: '2026-01-01',
  }

  test('accepts a valid create payload', () => {
    expect(legalCreateSchema.safeParse(valid).success).toBe(true)
  })

  test('rejects a non-allowlisted slug', () => {
    expect(legalCreateSchema.safeParse({ ...valid, slug: 'cookies' }).success).toBe(false)
  })

  test('rejects an empty title or content', () => {
    expect(legalCreateSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false)
    expect(legalCreateSchema.safeParse({ ...valid, content: '' }).success).toBe(false)
  })

  test('rejects unsafe HTML content', () => {
    expect(
      legalCreateSchema.safeParse({ ...valid, content: 'Hi <script>alert(1)</script>' }).success
    ).toBe(false)
  })

  test('accepts comparison content like 5 < 10', () => {
    expect(
      legalCreateSchema.safeParse({ ...valid, content: 'When 5 < 10 we proceed.' }).success
    ).toBe(true)
  })

  test('rejects a malformed effective_date', () => {
    expect(legalCreateSchema.safeParse({ ...valid, effective_date: '01/01/2026' }).success).toBe(
      false
    )
    expect(legalCreateSchema.safeParse({ ...valid, effective_date: '2026-13-40' }).success).toBe(
      false
    )
  })
})

describe('legalUpdateSchema', () => {
  test('accepts a partial draft patch', () => {
    expect(legalUpdateSchema.safeParse({ title: 'New title' }).success).toBe(true)
    expect(legalUpdateSchema.safeParse({ content: '# updated' }).success).toBe(true)
    expect(legalUpdateSchema.safeParse({ effective_date: '2026-02-02' }).success).toBe(true)
  })

  test('rejects an empty patch', () => {
    expect(legalUpdateSchema.safeParse({}).success).toBe(false)
  })

  test('rejects unsafe HTML in a content update', () => {
    expect(legalUpdateSchema.safeParse({ content: '<img src=x onerror=alert(1)>' }).success).toBe(
      false
    )
  })

  test('does not accept slug or status (immutable / state-managed)', () => {
    const parsed = legalUpdateSchema.safeParse({ title: 'x', slug: 'terms', status: 'published' })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect('slug' in parsed.data).toBe(false)
      expect('status' in parsed.data).toBe(false)
    }
  })
})

describe('nextPublishedVersion', () => {
  test('starts at 1 when there are no versions', () => {
    expect(nextPublishedVersion([])).toBe(1)
  })

  test('is max + 1 otherwise', () => {
    expect(nextPublishedVersion([1])).toBe(2)
    expect(nextPublishedVersion([1, 2, 1])).toBe(3)
    expect(nextPublishedVersion([3, 1, 2])).toBe(4)
  })
})

describe('admin legal projectors', () => {
  const row: AdminLegalPageRow = {
    id: 'uuid-1',
    slug: 'privacy',
    title: { en: 'Privacy Policy' },
    content: { en: '# Privacy' },
    version: 2,
    effective_date: '2026-01-01',
    status: 'published',
    last_updated_by: 'admin-uuid',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    published_at: '2026-01-02T00:00:00Z',
  }

  test('list item carries no body and no internal actor id', () => {
    const dto = toAdminLegalListItem(row)
    expect(dto).toEqual({
      id: 'uuid-1',
      slug: 'privacy',
      title: 'Privacy Policy',
      version: 2,
      status: 'published',
      effectiveDate: '2026-01-01',
      publishedAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    })
    expect(dto).not.toHaveProperty('content')
    expect(dto).not.toHaveProperty('last_updated_by')
  })

  test('detail carries the English title + body and never the raw actor id', () => {
    const dto = toAdminLegalDetail(row)
    expect(dto.title).toBe('Privacy Policy')
    expect(dto.content).toBe('# Privacy')
    expect(dto.version).toBe(2)
    expect(dto.status).toBe('published')
    expect(dto).not.toHaveProperty('last_updated_by')
  })
})
