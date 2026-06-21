import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import {
  PUBLIC_SETTING_KEYS,
  defaultPublicSettings,
  projectPublicSettings,
} from '@/domain/settings'

/**
 * AURA-201 — live-DB contract test for the public settings safe selector (A-09).
 *
 * The selector (`src/dal/settings.dal.ts`) is `server-only`, so it cannot be
 * imported into Vitest. Instead this proves the SAME guarantees the selector
 * relies on, against the live `settings` table, inside `begin … rollback` so
 * nothing is committed:
 *   - the allowlist query returns ONLY approved keys (internal keys excluded),
 *   - the projection selects ONLY `key, value` (no `updated_by`/metadata),
 *   - feeding the real rows to `projectPublicSettings` yields the public DTO,
 *   - an empty table yields safe defaults.
 *
 * Gated by SUPABASE_LOCAL_TESTS=1 (CI Dockerized stack, AURA-107):
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const ALLOWLIST_SQL = `array[${PUBLIC_SETTING_KEYS.map((k) => `'${k}'`).join(',')}]::text[]`

/** Run a SQL script (as postgres) and return trimmed non-empty output lines. */
function sql(script: string): string[] {
  const out = execFileSync(
    'psql',
    [DB_URL, '-q', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', script],
    { encoding: 'utf-8' }
  )
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

// A representative mix: allowlisted keys + non-allowlisted/internal keys.
const SEED = `
  insert into public.settings (key, value) values
    ('agency_name',    '"AUTEX Live Test Estates"'::jsonb),
    ('agency_email',   '"hello@autex.example"'::jsonb),
    ('agency_address', '"Downtown, Dubai"'::jsonb),
    ('social_links',   '{"instagram":"https://instagram.com/autex","tiktok":"https://tiktok.com/@x"}'::jsonb),
    ('internal_secret','"top-secret"'::jsonb),
    ('admin_only_flag','true'::jsonb);
`

describe.skipIf(!LOCAL_TESTS)('AURA-201 public settings safe selector (live DB)', () => {
  test('the allowlist query returns only approved keys (internal keys excluded)', () => {
    const out = sql(`
      begin;
      ${SEED}
      select key from public.settings where key = any(${ALLOWLIST_SQL}) order by key;
      rollback;
    `)
    expect(out).toEqual(['agency_address', 'agency_email', 'agency_name', 'social_links'])
    expect(out).not.toContain('internal_secret')
    expect(out).not.toContain('admin_only_flag')
  })

  test('the projection selects only key + value (no metadata leaks)', () => {
    const out = sql(`
      begin;
      ${SEED}
      select coalesce(json_agg(json_build_object('key', key, 'value', value) order by key), '[]')
      from public.settings where key = any(${ALLOWLIST_SQL});
      rollback;
    `)
    const rows = JSON.parse(out[0] ?? '[]') as { key: string; value: unknown }[]
    // Every returned object exposes exactly key + value — never updated_by/updated_at.
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(['key', 'value'])
    }
    expect(JSON.stringify(rows)).not.toContain('updated_by')
    expect(JSON.stringify(rows)).not.toContain('updated_at')
  })

  test('projecting the live rows yields the public DTO (unknown platform stripped)', () => {
    const out = sql(`
      begin;
      ${SEED}
      select coalesce(json_agg(json_build_object('key', key, 'value', value) order by key), '[]')
      from public.settings where key = any(${ALLOWLIST_SQL});
      rollback;
    `)
    const rows = JSON.parse(out[0] ?? '[]') as { key: string; value: unknown }[]
    const dto = projectPublicSettings(rows)

    expect(dto.agencyName).toBe('AUTEX Live Test Estates')
    expect(dto.agencyEmail).toBe('hello@autex.example')
    expect(dto.agencyAddress).toBe('Downtown, Dubai')
    expect(dto.socialLinks).toEqual({ instagram: 'https://instagram.com/autex' })
    // Keys never seeded fall back to safe defaults.
    expect(dto.agencyPhone).toBeNull()
    expect(dto.agencyWhatsapp).toBeNull()
    expect(dto.footerTagline).toBe(defaultPublicSettings().footerTagline)
  })

  test('an empty settings table yields safe defaults', () => {
    const out = sql(`
      begin;
      select coalesce(json_agg(json_build_object('key', key, 'value', value)), '[]')
      from public.settings where key = any(${ALLOWLIST_SQL});
      rollback;
    `)
    const rows = JSON.parse(out[0] ?? '[]') as { key: string; value: unknown }[]
    expect(rows).toEqual([])
    expect(projectPublicSettings(rows)).toEqual(defaultPublicSettings())
  })
})
