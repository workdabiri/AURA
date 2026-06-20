import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { asRole, catalog, isPermissionDenied, LOCAL_TESTS } from './rls-test-utils'

/**
 * AURA-106 — security tests for the rate-limit functions migration (D-51).
 *
 * Two layers:
 *  1. Static checks (always run, CI-safe): assert the committed migration is hardened
 *     (SECURITY DEFINER + empty search_path), keeps rate_limits service-role-only (no
 *     new policy / anon-auth grant), stores no raw IP, and registers cron defensively.
 *  2. Live catalog + negative tests (gated by SUPABASE_LOCAL_TESTS=1 + running stack):
 *     functions are SECURITY DEFINER, anon/authenticated cannot execute them, and the
 *     rate_limits service-role-only posture is unchanged.
 *
 *   SUPABASE_LOCAL_TESTS=1 npm run test:security
 */

function readRateLimitMigration(): string {
  const dir = path.resolve('supabase/migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('_rate_limit_functions.sql'))
  expect(files.length).toBe(1)
  const [file] = files
  if (!file) throw new Error('AURA-106 rate-limit migration not found')
  return fs.readFileSync(path.join(dir, file), 'utf-8')
}

/** Strip `--` SQL comments so forbidden-token scans inspect DDL, not documentation. */
function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, '')
}

// ---------------------------------------------------------------------------------
// 1. Static migration-file assertions (CI-safe, no DB required)
// ---------------------------------------------------------------------------------

describe('AURA-106 rate-limit migration (static)', () => {
  const raw = readRateLimitMigration()
  const sql = raw.toLowerCase()
  const code = stripSqlComments(sql)

  test('defines consume_rate_limit and cleanup_rate_limits functions', () => {
    expect(code).toContain('create or replace function public.consume_rate_limit')
    expect(code).toContain('create or replace function public.cleanup_rate_limits')
  })

  test('both functions are SECURITY DEFINER with an empty search_path', () => {
    const secdef = (code.match(/security definer/g) ?? []).length
    const searchPath = (code.match(/set search_path = ''/g) ?? []).length
    expect(secdef).toBeGreaterThanOrEqual(2)
    expect(searchPath).toBeGreaterThanOrEqual(2)
  })

  test('creates the expires_at cleanup index', () => {
    expect(code).toContain('create index if not exists rate_limits_expires_at_idx')
    expect(code).toContain('on public.rate_limits (expires_at)')
  })

  test('cleanup deletes ONLY expired rows (expires_at < now())', () => {
    expect(code.replace(/\s+/g, ' ')).toContain(
      'delete from public.rate_limits where expires_at < now()'
    )
  })

  test('revokes function EXECUTE from public and grants only to service_role', () => {
    expect(code).toContain(
      'revoke all on function public.consume_rate_limit(text, text, integer, integer) from public'
    )
    expect(code).toContain('revoke all on function public.cleanup_rate_limits()')
    expect(code).toContain(
      'grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role'
    )
    expect(code).toContain('grant execute on function public.cleanup_rate_limits()')
  })

  test('does NOT add an RLS policy or anon/authenticated table grant on rate_limits', () => {
    expect(code).not.toMatch(/create policy[^;]*rate_limits/)
    expect(code).not.toMatch(/grant[^;]*on table public\.rate_limits to anon/)
    expect(code).not.toMatch(/grant[^;]*on table public\.rate_limits to authenticated/)
  })

  test('stores no raw IP and introduces no client_id / tenant (D-05 / D-18 / D-51)', () => {
    expect(code).not.toMatch(/\bip_address\b/)
    expect(code).not.toMatch(/\braw_ip\b/)
    expect(code).not.toMatch(/\buser_ip\b/)
    expect(code).not.toMatch(/\bclient_ip\b/)
    expect(code).not.toMatch(/\bclient_id\b/)
    expect(code).not.toMatch(/\btenant\b/)
    // The consume function accepts only hash + route + limit + window — no IP parameter.
    expect(code).not.toMatch(/p_ip\b/)
  })

  test('registers pg_cron defensively (guarded, never fails db reset)', () => {
    expect(code).toContain('create extension if not exists pg_cron')
    expect(code).toContain('exception')
    expect(code).toContain('raise notice')
    expect(code).toContain("'aura-rate-limits-cleanup'")
    expect(code).toContain("'0 * * * *'")
    expect(code).toContain("cron.schedule('aura-rate-limits-cleanup'")
  })

  test('documents a rollback that does NOT drop the rate_limits table', () => {
    expect(sql).toContain('drop function if exists public.cleanup_rate_limits()')
    expect(sql).toContain(
      'drop function if exists public.consume_rate_limit(text, text, integer, integer)'
    )
    expect(sql).toContain('drop index if exists public.rate_limits_expires_at_idx')
    // Explicit guard: the table is owned by AURA-102 and must not be dropped here.
    expect(code).not.toContain('drop table')
  })
})

// ---------------------------------------------------------------------------------
// 2. Live catalog + negative tests (require SUPABASE_LOCAL_TESTS=1 + running stack)
// ---------------------------------------------------------------------------------

describe.skipIf(!LOCAL_TESTS)('AURA-106 function hardening (catalog)', () => {
  for (const fn of ['consume_rate_limit', 'cleanup_rate_limits']) {
    test(`${fn} is SECURITY DEFINER`, () => {
      const [secdef] = catalog(
        `select prosecdef from pg_proc where pronamespace='public'::regnamespace and proname='${fn}';`
      )
      expect(secdef).toBe('t')
    })

    test(`${fn} pins an empty search_path`, () => {
      const [proconfig] = catalog(
        `select array_to_string(proconfig, ',') from pg_proc where pronamespace='public'::regnamespace and proname='${fn}';`
      )
      expect(proconfig ?? '').toContain('search_path=')
    })
  }
})

describe.skipIf(!LOCAL_TESTS)('AURA-106 functions are not callable by anon/authenticated', () => {
  test('anon cannot execute cleanup_rate_limits', () => {
    const r = asRole({ role: 'anon', query: 'select public.cleanup_rate_limits();' })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('authenticated cannot execute cleanup_rate_limits', () => {
    const r = asRole({ role: 'authenticated', query: 'select public.cleanup_rate_limits();' })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('anon cannot execute consume_rate_limit', () => {
    const r = asRole({
      role: 'anon',
      query: "select * from public.consume_rate_limit('k', 'lead_submit', 5, 3600);",
    })
    expect(isPermissionDenied(r)).toBe(true)
  })

  test('authenticated cannot execute consume_rate_limit', () => {
    const r = asRole({
      role: 'authenticated',
      query: "select * from public.consume_rate_limit('k', 'lead_submit', 5, 3600);",
    })
    expect(isPermissionDenied(r)).toBe(true)
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-106 rate_limits posture unchanged', () => {
  test('rate_limits still has ZERO policies', () => {
    const [count] = catalog(
      "select count(*) from pg_policies where schemaname='public' and tablename='rate_limits';"
    )
    expect(count).toBe('0')
  })

  test('anon and authenticated still have NO table grants on rate_limits', () => {
    const rows = catalog(
      'select grantee from information_schema.role_table_grants ' +
        "where table_schema='public' and table_name='rate_limits' " +
        "and grantee in ('anon','authenticated');"
    )
    expect(rows).toEqual([])
  })

  test('rate_limits still has no raw IP column', () => {
    const cols = catalog(
      "select column_name from information_schema.columns where table_schema='public' and table_name='rate_limits';"
    )
    expect(cols.some((c) => c.includes('ip'))).toBe(false)
  })
})
