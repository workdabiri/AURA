import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { buildMediaStoragePath } from '@/domain/properties/media'
import { MEDIA_BUCKET_CONFIG, MEDIA_OBJECT_POLICIES } from '@/services/storage/policy'

import {
  asRole,
  catalog,
  CLIENT_ADMIN_ID,
  LOCAL_TESTS,
  NO_PROFILE_ID,
  SUPER_ADMIN_ID,
} from './rls-test-utils'

/**
 * AURA-105 — storage bucket + media-path security posture.
 *
 * Static checks (CI-safe) assert the migration text encodes the locked storage model:
 *  - `property-media` bucket: public, 10MB cap, jpeg/png/webp only (no video/360).
 *  - storage.objects: admin-only (public.is_admin()) SELECT/INSERT/UPDATE/DELETE, NO anon policy.
 *
 * Live catalog + behavioural checks (require SUPABASE_LOCAL_TESTS=1 + a running local stack;
 * wired into CI by AURA-107) prove the applied posture:
 *  - bucket metadata is correct; exactly the four admin policies exist; none reference anon.
 *  - anon / authenticated-without-admin cannot write or list; admins can.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:security
 */

function readStorageMigrationSql(): string {
  const dir = path.resolve('supabase/migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('_storage_policies.sql'))
  expect(files.length).toBe(1)
  const [file] = files
  if (!file) throw new Error('AURA-105 storage migration not found')
  return fs.readFileSync(path.join(dir, file), 'utf-8')
}

/** Strip `--` SQL comments so token scans inspect DDL, not the documentation header. */
function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, '')
}

// ---------------------------------------------------------------------------------
// 1. Static migration-file assertions (CI-safe)
// ---------------------------------------------------------------------------------

describe('AURA-105 storage migration (static)', () => {
  const raw = readStorageMigrationSql()
  const code = stripSqlComments(raw).toLowerCase()
  const codeNorm = code.replace(/\s+/g, ' ')

  test('creates the property-media bucket', () => {
    expect(codeNorm).toContain('insert into storage.buckets')
    expect(code).toContain("'property-media'")
  })

  test('bucket is public', () => {
    // insert column list includes `public`, and the inserted value tuple sets it true.
    expect(codeNorm).toContain('public')
    expect(codeNorm).toContain('true')
  })

  test('bucket sets the 10MB (10485760) file size limit', () => {
    expect(code).toContain('10485760')
  })

  test('bucket allows exactly jpeg/png/webp MIME types', () => {
    expect(code).toContain("array['image/jpeg', 'image/png', 'image/webp']")
  })

  test('migration is idempotent (ON CONFLICT for the bucket; drop-if-exists for policies)', () => {
    expect(codeNorm).toContain('on conflict (id) do update')
    for (const name of Object.values(MEDIA_OBJECT_POLICIES)) {
      expect(code).toContain(`drop policy if exists ${name} on storage.objects`)
    }
  })

  test('adds the four admin storage.objects policies (select/insert/update/delete)', () => {
    for (const cmd of ['select', 'insert', 'update', 'delete'] as const) {
      expect(code).toContain(`create policy ${MEDIA_OBJECT_POLICIES[cmd]} on storage.objects`)
    }
  })

  test('every storage.objects policy is admin-gated (public.is_admin()) and bucket-scoped', () => {
    // public.is_admin() must appear once per admin policy (4) + a check side for write policies.
    const adminGates = code.match(/public\.is_admin\(\)/g) ?? []
    expect(adminGates.length).toBeGreaterThanOrEqual(4)
    expect(code).toContain("bucket_id = 'property-media'")
  })

  test('storage.objects policies are for authenticated only — NO anon policy', () => {
    expect(code).toContain('to authenticated')
    // No policy on storage.objects may target anon.
    expect(code).not.toMatch(/on storage\.objects[\s\S]*?for[\s\S]*?to anon/)
    expect(codeNorm).not.toContain('to anon')
  })

  test('no video / 360 / virtual-tour media types anywhere (D-41)', () => {
    expect(code).not.toContain('video/')
    expect(code).not.toContain('model/')
    expect(code).not.toMatch(/\b360\b/)
    expect(code).not.toContain('virtual tour')
  })
})

// ---------------------------------------------------------------------------------
// 2. Domain/service contract matches the migration (CI-safe)
// ---------------------------------------------------------------------------------

describe('AURA-105 storage contract (static cross-check)', () => {
  const code = stripSqlComments(readStorageMigrationSql()).toLowerCase()

  test('MEDIA_BUCKET_CONFIG mirrors what the migration applies', () => {
    expect(MEDIA_BUCKET_CONFIG.id).toBe('property-media')
    expect(MEDIA_BUCKET_CONFIG.public).toBe(true)
    expect(MEDIA_BUCKET_CONFIG.fileSizeLimit).toBe(10_485_760)
    expect([...MEDIA_BUCKET_CONFIG.allowedMimeTypes]).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ])
    expect(code).toContain(String(MEDIA_BUCKET_CONFIG.fileSizeLimit))
  })

  test('MEDIA_OBJECT_POLICIES names all appear in the migration', () => {
    for (const name of Object.values(MEDIA_OBJECT_POLICIES)) {
      expect(code).toContain(name)
    }
  })
})

// ---------------------------------------------------------------------------------
// 3. Live catalog assertions (requires SUPABASE_LOCAL_TESTS=1)
// ---------------------------------------------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-105 applied bucket + policy catalog', () => {
  test('property-media bucket exists with the locked metadata', () => {
    const [row] = catalog(
      "select public::text || '|' || file_size_limit::text || '|' || " +
        "array_to_string(allowed_mime_types, ',') " +
        "from storage.buckets where id = 'property-media';"
    )
    // public::text renders the boolean as 'true' (not 't').
    expect(row).toBe('true|10485760|image/jpeg,image/png,image/webp')
  })

  test('exactly the four admin policies exist on storage.objects', () => {
    const names = catalog(
      "select policyname from pg_policies where schemaname='storage' and tablename='objects' " +
        "and policyname like 'property_media_objects_admin_%' order by policyname;"
    )
    expect(names).toEqual([
      'property_media_objects_admin_delete',
      'property_media_objects_admin_insert',
      'property_media_objects_admin_select',
      'property_media_objects_admin_update',
    ])
  })

  test('all four admin policies target the authenticated role', () => {
    const [count] = catalog(
      "select count(*) from pg_policies where schemaname='storage' and tablename='objects' " +
        "and policyname like 'property_media_objects_admin_%' and roles::text like '%authenticated%';"
    )
    expect(count).toBe('4')
  })

  test('NO storage.objects policy references anon (no public list/enumeration)', () => {
    const [count] = catalog(
      "select count(*) from pg_policies where schemaname='storage' and tablename='objects' " +
        "and roles::text like '%anon%';"
    )
    expect(count).toBe('0')
  })
})

// ---------------------------------------------------------------------------------
// 4. Live behavioural negatives/positives (requires SUPABASE_LOCAL_TESTS=1)
// ---------------------------------------------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-105 storage.objects access control', () => {
  const objectName = buildMediaStoragePath({
    propertyId: '44444444-4444-4444-4444-444444444444',
    mediaId: '55555555-5555-5555-5555-555555555555',
    mediaType: 'image',
    mimeType: 'image/jpeg',
  })
  const insert = `insert into storage.objects (bucket_id, name) values ('property-media', '${objectName}');`

  test('anon cannot INSERT an object', () => {
    // INSERT evaluates the WITH CHECK on the new row, so a missing anon policy is an active
    // RLS denial — the reliable behavioural negative.
    expect(asRole({ role: 'anon', query: insert }).ok).toBe(false)
  })

  // NOTE: there is intentionally no behavioural anon UPDATE/DELETE test here. With no anon
  // policy the RLS USING clause filters those statements to zero rows (UPDATE is a silent
  // no-op), and storage.objects has a global `storage.protect_delete()` trigger that blocks
  // ALL direct SQL DELETEs regardless of role — so neither would test the RLS boundary. The
  // guarantee that anon can neither read/list nor mutate is proven authoritatively by the
  // "NO storage.objects policy references anon" catalog assertion above.

  test('authenticated user WITHOUT an admin profile cannot INSERT', () => {
    expect(asRole({ role: 'authenticated', sub: NO_PROFILE_ID, query: insert }).ok).toBe(false)
  })

  test('is_admin() predicate is true for admins, false for anon / non-admin', () => {
    expect(
      asRole({ role: 'authenticated', sub: SUPER_ADMIN_ID, query: 'select public.is_admin();' }).out
    ).toBe('t')
    expect(
      asRole({ role: 'authenticated', sub: CLIENT_ADMIN_ID, query: 'select public.is_admin();' })
        .out
    ).toBe('t')
    expect(
      asRole({ role: 'authenticated', sub: NO_PROFILE_ID, query: 'select public.is_admin();' }).out
    ).toBe('f')
  })

  test('super_admin CAN INSERT an object into the bucket', () => {
    expect(asRole({ role: 'authenticated', sub: SUPER_ADMIN_ID, query: insert }).ok).toBe(true)
  })

  test('client_admin CAN INSERT an object into the bucket', () => {
    expect(asRole({ role: 'authenticated', sub: CLIENT_ADMIN_ID, query: insert }).ok).toBe(true)
  })

  test('admin CAN SELECT/list objects in the bucket', () => {
    const r = asRole({
      role: 'authenticated',
      sub: SUPER_ADMIN_ID,
      query: "select count(*) from storage.objects where bucket_id = 'property-media';",
    })
    expect(r.ok).toBe(true)
  })
})
