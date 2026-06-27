import { describe, expect, test } from 'vitest'

import {
  asRole,
  CLIENT_ADMIN_ID,
  isPermissionDenied,
  LOCAL_TESTS,
  SUPER_ADMIN_ID,
} from '../security/rls-test-utils'

/**
 * AURA-303 — live-DB contract for the ADMIN property writes (the guarantees the admin DAL
 * relies on). The DAL is `server-only` (can't import into Vitest), so — like the AURA-202
 * DAL test — this drives the SAME operations as the seeded super_admin / client_admin roles
 * against the live schema inside `begin … rollback` (nothing committed). RLS (`is_admin()`)
 * is the enforcement boundary; the route's `requireAdmin()` runs first in production.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 *
 * Seed (from rls-test-utils): properties seed-pub (published), seed-draft (draft),
 * seed-arch (archived); media on seed-pub + seed-draft; one audit_logs row.
 */

describe.skipIf(!LOCAL_TESTS)(
  'AURA-303 admin property writes (live DB, role-claimed admin)',
  () => {
    test('admin reads ALL statuses (draft + published + archived)', () => {
      for (const sub of [SUPER_ADMIN_ID, CLIENT_ADMIN_ID]) {
        const r = asRole({
          role: 'authenticated',
          sub,
          query: 'select count(*) from public.properties;',
        })
        expect(r.ok, r.err).toBe(true)
        expect(r.out).toBe('3')
      }
    })

    test('anon still reads ONLY published (draft + archived hidden)', () => {
      const r = asRole({ role: 'anon', query: 'select count(*) from public.properties;' })
      expect(r.out).toBe('1')
    })

    test('admin can INSERT a draft property', () => {
      const r = asRole({
        role: 'authenticated',
        sub: CLIENT_ADMIN_ID,
        query:
          'insert into public.properties ' +
          '(reference_number, slug, transaction_type, market_type, property_type, location_label, size_sqft) ' +
          "values ('AUTEX-90001', 'admin-new-draft', 'sale', 'ready', 'apartment', 'Marina', 1200);",
      })
      expect(r.ok, r.err).toBe(true)
    })

    test('admin can UPDATE editable fields', () => {
      const r = asRole({
        role: 'authenticated',
        sub: SUPER_ADMIN_ID,
        query: "update public.properties set location_label = 'Updated' where slug = 'seed-draft';",
      })
      expect(r.ok, r.err).toBe(true)
    })

    test('admin can PUBLISH a draft (publish_status → published)', () => {
      const r = asRole({
        role: 'authenticated',
        sub: SUPER_ADMIN_ID,
        query:
          "update public.properties set publish_status = 'published', published_at = now() where slug = 'seed-draft';",
      })
      expect(r.ok, r.err).toBe(true)
    })

    test('admin can ARCHIVE (publish_status → archived)', () => {
      const r = asRole({
        role: 'authenticated',
        sub: CLIENT_ADMIN_ID,
        query:
          "update public.properties set publish_status = 'archived', archived_at = now() where slug = 'seed-pub';",
      })
      expect(r.ok, r.err).toBe(true)
    })

    test('HARD DELETE is denied for admin (no delete grant — D-32, archive only)', () => {
      const r = asRole({
        role: 'authenticated',
        sub: SUPER_ADMIN_ID,
        query: "delete from public.properties where slug = 'seed-arch';",
      })
      expect(r.ok).toBe(false)
      expect(isPermissionDenied(r)).toBe(true)
    })

    test('slug uniqueness is enforced (duplicate slug insert fails)', () => {
      const r = asRole({
        role: 'authenticated',
        sub: SUPER_ADMIN_ID,
        query:
          'insert into public.properties ' +
          '(reference_number, slug, transaction_type, market_type, property_type, location_label, size_sqft) ' +
          "values ('AUTEX-90002', 'seed-pub', 'sale', 'ready', 'apartment', 'X', 100);",
      })
      expect(r.ok).toBe(false)
      expect(r.err).toMatch(/duplicate key|unique/i)
    })

    test('reference_number uniqueness is enforced (duplicate reference insert fails)', () => {
      const r = asRole({
        role: 'authenticated',
        sub: SUPER_ADMIN_ID,
        query:
          'insert into public.properties ' +
          '(reference_number, slug, transaction_type, market_type, property_type, location_label, size_sqft) ' +
          "values ('SEED-PUB', 'unique-slug-x', 'sale', 'ready', 'apartment', 'X', 100);",
      })
      expect(r.ok).toBe(false)
      expect(r.err).toMatch(/duplicate key|unique/i)
    })

    test('admin reads media of a DRAFT property (publish-checklist read path)', () => {
      // seed-draft has one media row; anon cannot see it, admin can (property_media_admin_select).
      const admin = asRole({
        role: 'authenticated',
        sub: SUPER_ADMIN_ID,
        query:
          "select count(*) from public.property_media pm join public.properties p on p.id = pm.property_id where p.slug = 'seed-draft';",
      })
      expect(admin.out).toBe('1')
      const anon = asRole({
        role: 'anon',
        query:
          "select count(*) from public.property_media pm join public.properties p on p.id = pm.property_id where p.slug = 'seed-draft';",
      })
      expect(anon.out).toBe('0')
    })

    test('admin CANNOT insert audit_logs directly (service-role-only write — D-38)', () => {
      // authenticated has SELECT-only on audit_logs; the app writes audits via the service role.
      const r = asRole({
        role: 'authenticated',
        sub: SUPER_ADMIN_ID,
        query:
          "insert into public.audit_logs (actor_role, action, entity_type) values ('super_admin', 'property_created', 'property');",
      })
      expect(r.ok).toBe(false)
      expect(isPermissionDenied(r)).toBe(true)
    })
  }
)
