import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-102 — schema introspection tests for the initial MVP migration.
 *
 * Two layers:
 *  1. Static checks (always run, CI-safe): assert the committed migration SQL
 *     contains the required structures and none of the merge-blocker patterns.
 *  2. Live catalog introspection (gated by SUPABASE_LOCAL_TESTS=1 + `supabase start`):
 *     query the local Postgres catalog via `psql` to prove the applied schema.
 *
 * The CI Dockerized Supabase stack is wired in AURA-107; until then the live layer
 * is skipped (not failed) when SUPABASE_LOCAL_TESTS!=1.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

const MVP_TABLES = [
  'user_profiles',
  'areas',
  'properties',
  'property_media',
  'property_stakeholders',
  'leads',
  'whatsapp_clicks',
  'settings',
  'legal_pages',
  'audit_logs',
  'rate_limits',
] as const

const ENUM_TYPES = [
  'user_role',
  'publish_status',
  'transaction_type',
  'market_type',
  'property_type',
  'availability_status',
  'rental_period',
  'furnishing_status',
  'price_visibility',
  'property_media_type',
  'stakeholder_type',
  'stakeholder_visibility',
  'lead_status',
  'lead_source',
  'lead_priority',
  'preferred_contact_method',
  'legal_page_status',
] as const

const REQUIRED_INDEXES = [
  'legal_pages_slug_published_key',
  'properties_publish_status_is_featured_idx',
  'properties_publish_status_created_at_idx',
  'property_media_property_id_idx',
  'property_stakeholders_property_id_idx',
  'leads_property_id_idx',
  'whatsapp_clicks_property_id_idx',
  'audit_logs_entity_type_entity_id_idx',
  'properties_title_en_fts_idx',
] as const

function readMigrationSql(): string {
  const dir = path.resolve('supabase/migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('_init.sql'))
  expect(files.length).toBe(1)
  const [file] = files
  if (!file) throw new Error('AURA-102 init migration not found')
  return fs.readFileSync(path.join(dir, file), 'utf-8')
}

/** Strip `--` SQL comments so forbidden-token scans inspect DDL, not documentation. */
function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, '')
}

/** Run a single-statement SQL query and return non-empty trimmed result lines. */
function psql(sql: string): string[] {
  const out = execFileSync('psql', [DB_URL, '-t', '-A', '-F', '|', '-c', sql], {
    encoding: 'utf-8',
  })
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

// ---------------------------------------------------------------------------------
// 1. Static migration-file assertions (CI-safe, no DB required)
// ---------------------------------------------------------------------------------

describe('AURA-102 migration SQL (static)', () => {
  const sql = readMigrationSql().toLowerCase()
  const code = stripSqlComments(sql)

  test('creates all 11 MVP tables', () => {
    for (const table of MVP_TABLES) {
      expect(sql).toContain(`create table public.${table}`)
    }
  })

  test('declares all 17 enum types', () => {
    for (const enumType of ENUM_TYPES) {
      expect(sql).toContain(`create type public.${enumType} as enum`)
    }
  })

  test('defines the generated title_en column', () => {
    expect(sql).toContain('title_en')
    expect(sql).toContain("generated always as (title ->> 'en') stored")
  })

  test('enables RLS on every MVP table', () => {
    const normalized = sql.replace(/\s+/g, ' ')
    for (const table of MVP_TABLES) {
      expect(normalized).toContain(`alter table public.${table} enable row level security`)
    }
    const enableCount = (sql.match(/enable row level security/g) ?? []).length
    expect(enableCount).toBe(MVP_TABLES.length)
  })

  test('contains no `clients` table or `client_id` column (D-05)', () => {
    expect(code).not.toContain('create table public.clients')
    expect(code).not.toMatch(/\bclient_id\b/)
  })

  test('contains no raw IP / user-agent columns (D-18 / D-51)', () => {
    expect(code).not.toMatch(/\bip_address\b/)
    expect(code).not.toMatch(/\braw_ip\b/)
    expect(code).not.toMatch(/\buser_agent\b/)
  })
})

// ---------------------------------------------------------------------------------
// 2. Live catalog introspection (requires SUPABASE_LOCAL_TESTS=1 + running stack)
// ---------------------------------------------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-102 applied schema (local Postgres catalog)', () => {
  test('all 11 MVP tables exist in public', () => {
    const tables = psql(
      "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE';"
    )
    for (const table of MVP_TABLES) {
      expect(tables).toContain(table)
    }
  })

  test('all 17 enum types exist', () => {
    const enums = psql(
      "select typname from pg_type where typtype='e' and typnamespace='public'::regnamespace;"
    )
    for (const enumType of ENUM_TYPES) {
      expect(enums).toContain(enumType)
    }
  })

  test('publish_status enum has exactly the locked values (D-36)', () => {
    const values = psql(
      "select e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='publish_status' order by e.enumsortorder;"
    )
    expect(values).toEqual(['draft', 'published', 'archived'])
  })

  test('lead_status enum has exactly the locked values (D-37)', () => {
    const values = psql(
      "select e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='lead_status' order by e.enumsortorder;"
    )
    expect(values).toEqual([
      'new',
      'contacted',
      'qualified',
      'unqualified',
      'won',
      'lost',
      'archived',
    ])
  })

  test('required JSONB/i18n columns are jsonb', () => {
    const rows = psql(
      "select table_name||'.'||column_name from information_schema.columns " +
        "where table_schema='public' and data_type='jsonb';"
    )
    const expected = [
      'properties.title',
      'properties.description',
      'properties.amenities',
      'areas.name',
      'areas.description',
      'legal_pages.title',
      'legal_pages.content',
      'settings.value',
      'audit_logs.before_snapshot',
      'audit_logs.after_snapshot',
      'audit_logs.metadata',
    ]
    for (const col of expected) {
      expect(rows).toContain(col)
    }
  })

  test('properties.title_en is a STORED generated column', () => {
    const rows = psql(
      'select is_generated from information_schema.columns ' +
        "where table_schema='public' and table_name='properties' and column_name='title_en';"
    )
    expect(rows).toEqual(['ALWAYS'])
  })

  test('required unique constraints exist (properties.slug, reference_number, areas.slug)', () => {
    const rows = psql(
      "select conrelid::regclass::text||':'||a.attname from pg_constraint c " +
        'join unnest(c.conkey) as k(attnum) on true ' +
        'join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum ' +
        "where c.contype='u' and c.connamespace='public'::regnamespace;"
    )
    expect(rows).toContain('properties:slug')
    expect(rows).toContain('properties:reference_number')
    expect(rows).toContain('areas:slug')
  })

  test('all required indexes exist', () => {
    const indexes = psql("select indexname from pg_indexes where schemaname='public';")
    for (const idx of REQUIRED_INDEXES) {
      expect(indexes).toContain(idx)
    }
  })

  test('legal_pages published-slug index is a PARTIAL unique index', () => {
    const indexDef = (
      psql(
        "select indexdef from pg_indexes where schemaname='public' and indexname='legal_pages_slug_published_key';"
      )[0] ?? ''
    ).toLowerCase()
    expect(indexDef).toContain('unique index')
    expect(indexDef).toContain("where (status = 'published'")
  })

  test('properties full-text index uses the GIN method', () => {
    const rows = psql(
      'select am.amname from pg_class i ' +
        'join pg_index ix on ix.indexrelid=i.oid ' +
        'join pg_am am on am.oid=i.relam ' +
        "where i.relname='properties_title_en_fts_idx';"
    )
    expect(rows).toEqual(['gin'])
  })

  test('no `clients` table exists (D-05)', () => {
    const rows = psql(
      "select table_name from information_schema.tables where table_schema='public' and table_name='clients';"
    )
    expect(rows).toEqual([])
  })

  test('no `client_id` column exists in any public table (D-05)', () => {
    const rows = psql(
      "select table_name from information_schema.columns where table_schema='public' and column_name='client_id';"
    )
    expect(rows).toEqual([])
  })

  test('no raw IP / user-agent columns in event/analytics/rate-limit tables (D-18 / D-51)', () => {
    const rows = psql(
      "select table_name||'.'||column_name from information_schema.columns " +
        "where table_schema='public' " +
        "and table_name in ('whatsapp_clicks','rate_limits','audit_logs') " +
        "and (column_name ilike '%ip%' or column_name ilike '%user_agent%');"
    )
    expect(rows).toEqual([])
  })

  test('rate_limits stores key_hash + expires_at and NO ip column (D-51)', () => {
    const cols = psql(
      "select column_name from information_schema.columns where table_schema='public' and table_name='rate_limits';"
    )
    expect(cols).toContain('key_hash')
    expect(cols).toContain('expires_at')
    expect(cols.some((c) => c.includes('ip'))).toBe(false)
  })

  test('whatsapp_clicks has no phone/email/PII columns (D-18)', () => {
    const cols = psql(
      "select column_name from information_schema.columns where table_schema='public' and table_name='whatsapp_clicks';"
    )
    for (const forbidden of ['phone', 'email', 'ip_address', 'user_agent']) {
      expect(cols).not.toContain(forbidden)
    }
  })
})
