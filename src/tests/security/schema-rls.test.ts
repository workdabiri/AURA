import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-102 — security assertions for the initial MVP migration.
 *
 * Proves the security posture this task is responsible for:
 *  - RLS is ENABLED on all 11 MVP tables (default-deny until AURA-103 policies).
 *  - NO RLS policies are created yet (policies are AURA-103, not AURA-102).
 *  - No `clients` table / `client_id` column (D-05).
 *  - No raw IP storage in whatsapp_clicks / rate_limits / audit_logs (D-18 / D-51).
 *
 * Static checks run in CI. Live catalog checks require SUPABASE_LOCAL_TESTS=1 and a
 * running local stack (CI Dockerized stack is AURA-107):
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:security
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

const SENSITIVE_EVENT_TABLES = ['whatsapp_clicks', 'rate_limits', 'audit_logs'] as const

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
// 1. Static migration-file security assertions (CI-safe)
// ---------------------------------------------------------------------------------

describe('AURA-102 migration security posture (static)', () => {
  const sql = readMigrationSql().toLowerCase()
  const code = stripSqlComments(sql)

  test('enables RLS on all 11 MVP tables', () => {
    const normalized = sql.replace(/\s+/g, ' ')
    for (const table of MVP_TABLES) {
      expect(normalized).toContain(`alter table public.${table} enable row level security`)
    }
  })

  test('creates NO RLS policies (policies belong to AURA-103)', () => {
    expect(code).not.toContain('create policy')
  })

  test('no `clients` table / `client_id` column (D-05)', () => {
    expect(code).not.toContain('create table public.clients')
    expect(code).not.toMatch(/\bclient_id\b/)
  })

  test('no raw IP / user-agent column anywhere (D-18 / D-51)', () => {
    expect(code).not.toMatch(/\bip_address\b/)
    expect(code).not.toMatch(/\braw_ip\b/)
    expect(code).not.toMatch(/\buser_agent\b/)
  })
})

// ---------------------------------------------------------------------------------
// 2. Live catalog security checks (requires SUPABASE_LOCAL_TESTS=1)
// ---------------------------------------------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-102 applied security posture (local Postgres catalog)', () => {
  test('RLS is enabled on all 11 MVP tables', () => {
    const rlsTables = psql(
      'select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace ' +
        "where n.nspname='public' and c.relkind='r' and c.relrowsecurity=true;"
    )
    for (const table of MVP_TABLES) {
      expect(rlsTables).toContain(table)
    }
  })

  test('every MVP table has relrowsecurity = true (none left disabled)', () => {
    const disabled = psql(
      'select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace ' +
        "where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false " +
        "and c.relname = any (array['" +
        MVP_TABLES.join("','") +
        "']);"
    )
    expect(disabled).toEqual([])
  })

  test('NO RLS policies exist yet (AURA-103 owns policies)', () => {
    const count = psql("select count(*) from pg_policies where schemaname='public';")
    expect(count).toEqual(['0'])
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

  test('no raw IP / user-agent columns in sensitive event tables (D-18 / D-51)', () => {
    const rows = psql(
      "select table_name||'.'||column_name from information_schema.columns " +
        "where table_schema='public' " +
        `and table_name in ('${SENSITIVE_EVENT_TABLES.join("','")}') ` +
        "and (column_name ilike '%ip%' or column_name ilike '%user_agent%');"
    )
    expect(rows).toEqual([])
  })
})
