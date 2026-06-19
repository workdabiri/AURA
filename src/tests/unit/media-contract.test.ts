import { describe, expect, test } from 'vitest'

import {
  ALLOWED_MEDIA_MIME_TYPES,
  buildMediaStoragePath,
  extensionForMime,
  MAX_MEDIA_BYTES,
  MEDIA_BUCKET,
  MEDIA_TYPES,
  validateMediaUpload,
  type MediaPathInput,
} from '@/domain/properties/media'

/**
 * AURA-105 — unit tests for the pure media validation + storage-path contract.
 *
 * Covers the locked decisions: bucket name, 10MB cap (A-15/Q-04), MIME allowlist (A-14),
 * media categories (D-41), and the path strategy
 * `properties/{property_id}/{media_type}/{media_id}.{ext}` with UUID-only components and a
 * server-derived extension (no user-supplied filename, no traversal).
 */

const PROPERTY_ID = '11111111-1111-1111-1111-111111111111'
const MEDIA_ID = '22222222-2222-2222-2222-222222222222'

function validInput(over: Partial<MediaPathInput & { sizeBytes: number }> = {}) {
  return {
    propertyId: PROPERTY_ID,
    mediaId: MEDIA_ID,
    mediaType: 'image' as const,
    mimeType: 'image/jpeg' as const,
    sizeBytes: 1024,
    ...over,
  }
}

describe('AURA-105 media contract constants', () => {
  test('bucket name is property-media', () => {
    expect(MEDIA_BUCKET).toBe('property-media')
  })

  test('max size is exactly 10 MiB (10485760 bytes)', () => {
    expect(MAX_MEDIA_BYTES).toBe(10_485_760)
  })

  test('allowed MIME types are exactly jpeg/png/webp (no video/360)', () => {
    expect([...ALLOWED_MEDIA_MIME_TYPES]).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })

  test('media types are exactly image + floorplan (D-41)', () => {
    expect([...MEDIA_TYPES]).toEqual(['image', 'floorplan'])
  })
})

describe('AURA-105 validateMediaUpload', () => {
  test('accepts jpeg/png/webp under 10MB', () => {
    for (const mimeType of ALLOWED_MEDIA_MIME_TYPES) {
      const r = validateMediaUpload(validInput({ mimeType, sizeBytes: MAX_MEDIA_BYTES - 1 }))
      expect(r.success).toBe(true)
    }
  })

  test('accepts a file exactly at the 10MB cap', () => {
    expect(validateMediaUpload(validInput({ sizeBytes: MAX_MEDIA_BYTES })).success).toBe(true)
  })

  test('accepts the floorplan media type', () => {
    expect(validateMediaUpload(validInput({ mediaType: 'floorplan' })).success).toBe(true)
  })

  test('rejects a file larger than 10MB', () => {
    expect(validateMediaUpload(validInput({ sizeBytes: MAX_MEDIA_BYTES + 1 })).success).toBe(false)
  })

  test('rejects a zero / negative / non-integer size', () => {
    expect(validateMediaUpload(validInput({ sizeBytes: 0 })).success).toBe(false)
    expect(validateMediaUpload(validInput({ sizeBytes: -1 })).success).toBe(false)
    expect(validateMediaUpload(validInput({ sizeBytes: 1.5 })).success).toBe(false)
  })

  test('rejects an unsupported MIME type (gif/video/svg)', () => {
    for (const mimeType of ['image/gif', 'video/mp4', 'image/svg+xml', 'application/pdf']) {
      expect(validateMediaUpload(validInput({ mimeType: mimeType as never })).success).toBe(false)
    }
  })

  test('rejects an invalid media type', () => {
    expect(validateMediaUpload(validInput({ mediaType: 'video' as never })).success).toBe(false)
    expect(validateMediaUpload(validInput({ mediaType: '360' as never })).success).toBe(false)
  })

  test('rejects an invalid property/media UUID', () => {
    expect(validateMediaUpload(validInput({ propertyId: 'not-a-uuid' })).success).toBe(false)
    expect(validateMediaUpload(validInput({ mediaId: '../../etc/passwd' })).success).toBe(false)
  })
})

describe('AURA-105 extensionForMime', () => {
  test('maps each MIME type to its canonical extension', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg')
    expect(extensionForMime('image/png')).toBe('png')
    expect(extensionForMime('image/webp')).toBe('webp')
  })

  test('throws on an unsupported MIME type', () => {
    expect(() => extensionForMime('image/gif' as never)).toThrow()
  })
})

describe('AURA-105 buildMediaStoragePath', () => {
  test('matches the locked template exactly (jpeg)', () => {
    expect(buildMediaStoragePath(validInput())).toBe(
      `properties/${PROPERTY_ID}/image/${MEDIA_ID}.jpg`
    )
  })

  test('uses the floorplan segment and the MIME-derived extension', () => {
    expect(
      buildMediaStoragePath(validInput({ mediaType: 'floorplan', mimeType: 'image/png' }))
    ).toBe(`properties/${PROPERTY_ID}/floorplan/${MEDIA_ID}.png`)
    expect(buildMediaStoragePath(validInput({ mimeType: 'image/webp' }))).toBe(
      `properties/${PROPERTY_ID}/image/${MEDIA_ID}.webp`
    )
  })

  test('output always matches the strict UUID-based shape', () => {
    const path = buildMediaStoragePath(validInput())
    expect(path).toMatch(
      /^properties\/[0-9a-f-]{36}\/(image|floorplan)\/[0-9a-f-]{36}\.(jpg|png|webp)$/
    )
  })

  test('never embeds a user-supplied filename — the extension comes from the MIME only', () => {
    // A spoofed extension on the (ignored) filename has no effect: the path uses MIME->ext.
    const path = buildMediaStoragePath(validInput({ mimeType: 'image/png' }))
    expect(path.endsWith('.png')).toBe(true)
    expect(path).not.toContain('.exe')
    expect(path).not.toContain('passwd')
  })

  test('rejects traversal / slash injection via non-UUID ids', () => {
    expect(() => buildMediaStoragePath(validInput({ mediaId: '../../secret' }))).toThrow()
    expect(() => buildMediaStoragePath(validInput({ propertyId: 'a/b/c' }))).toThrow()
    expect(() => buildMediaStoragePath(validInput({ mediaId: 'not-a-uuid' }))).toThrow()
  })
})
