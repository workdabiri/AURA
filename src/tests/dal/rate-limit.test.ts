import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

/**
 * AURA-106 — behavioural tests for the rate-limit DB functions (D-51).
 *
 * Exercises public.consume_rate_limit (atomic check-and-increment, window reset, deny
 * over limit) and public.cleanup_rate_limits (delete expired, keep fresh, idempotent)
 * against the live local stack. Every case runs inside a single `begin … rollback`, so
 * nothing is committed and runs are repeatable.
 *
 * Gated by SUPABASE_LOCAL_TESTS=1 (CI Dockerized stack is AURA-107):
 *   SUPABASE_LOCAL_TESTS=1 npm run test:dal
 */

const LOCAL_TESTS = process.env.SUPABASE_LOCAL_TESTS === '1'
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

/** Run a transactional SQL script (as postgres) and return non-empty output lines. */
function tx(script: string): string[] {
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

describe.skipIf(!LOCAL_TESTS)('AURA-106 consume_rate_limit', () => {
  test('first request is allowed with remaining = limit - 1', () => {
    const out = tx(`
      begin;
      select allowed::text || ',' || remaining::text || ',' || current_count::text
      from public.consume_rate_limit('rl-first', 'lead_submit', 5, 3600);
      rollback;
    `)
    expect(out).toEqual(['true,4,1'])
  })

  test('increments within the limit, then denies over it', () => {
    const out = tx(`
      begin;
      select allowed::text || ',' || remaining::text from public.consume_rate_limit('rl-burst', 'lead_submit', 3, 3600);
      select allowed::text || ',' || remaining::text from public.consume_rate_limit('rl-burst', 'lead_submit', 3, 3600);
      select allowed::text || ',' || remaining::text from public.consume_rate_limit('rl-burst', 'lead_submit', 3, 3600);
      select allowed::text || ',' || remaining::text from public.consume_rate_limit('rl-burst', 'lead_submit', 3, 3600);
      rollback;
    `)
    expect(out).toEqual(['true,2', 'true,1', 'true,0', 'false,0'])
  })

  test('a denied request does not increment count further', () => {
    const out = tx(`
      begin;
      do $$ begin
        perform public.consume_rate_limit('rl-deny', 'login', 1, 900);
        perform public.consume_rate_limit('rl-deny', 'login', 1, 900);
        perform public.consume_rate_limit('rl-deny', 'login', 1, 900);
      end $$;
      select count::text from public.rate_limits where key_hash = 'rl-deny';
      rollback;
    `)
    // count stays at 1 (the limit) — denials do not increment.
    expect(out).toEqual(['1'])
  })

  test('an expired window resets the count to 1 and re-allows', () => {
    const out = tx(`
      begin;
      insert into public.rate_limits (key_hash, route, count, window_start, expires_at)
      values ('rl-expired', 'login', 5, now() - interval '1 hour', now() + interval '24 hours');
      -- window is 15 min (900s); window_start is 1 hour ago => expired => reset.
      select allowed::text || ',' || current_count::text
      from public.consume_rate_limit('rl-expired', 'login', 5, 900);
      rollback;
    `)
    expect(out).toEqual(['true,1'])
  })

  test('result exposes limit / remaining / reset_at without any raw IP', () => {
    const out = tx(`
      begin;
      select limit_value::text || ',' || remaining::text || ',' || (reset_at > now())::text
      from public.consume_rate_limit('rl-shape', 'whatsapp_click', 30, 3600);
      rollback;
    `)
    expect(out).toEqual(['30,29,true'])
  })

  test('refreshes the 24h expires_at TTL on an allowed request', () => {
    const out = tx(`
      begin;
      do $$ begin perform public.consume_rate_limit('rl-ttl', 'login', 5, 900); end $$;
      -- expires_at should be ~24h out (well beyond the 15-minute rate window).
      select (expires_at > now() + interval '23 hours')::text
      from public.rate_limits where key_hash = 'rl-ttl';
      rollback;
    `)
    expect(out).toEqual(['true'])
  })
})

describe.skipIf(!LOCAL_TESTS)('AURA-106 cleanup_rate_limits', () => {
  test('deletes expired rows, keeps fresh rows, and is idempotent', () => {
    const out = tx(`
      begin;
      insert into public.rate_limits (key_hash, route, count, window_start, expires_at) values
        ('cl-exp1', 'login', 1, now(), now() - interval '1 minute'),
        ('cl-exp2', 'login', 1, now(), now() - interval '1 hour'),
        ('cl-fresh', 'login', 1, now(), now() + interval '1 hour');
      select public.cleanup_rate_limits();
      select count(*) from public.rate_limits where key_hash in ('cl-exp1','cl-exp2');
      select count(*) from public.rate_limits where key_hash = 'cl-fresh';
      select public.cleanup_rate_limits();
      rollback;
    `)
    // first cleanup deletes 2 expired; expired gone (0); fresh remains (1); 2nd cleanup deletes 0.
    expect(out).toEqual(['2', '0', '1', '0'])
  })

  test('deletes nothing when no rows are expired', () => {
    const out = tx(`
      begin;
      insert into public.rate_limits (key_hash, route, count, window_start, expires_at) values
        ('cl-fresh-a', 'login', 1, now(), now() + interval '2 hours'),
        ('cl-fresh-b', 'login', 1, now(), now() + interval '5 hours');
      select public.cleanup_rate_limits();
      rollback;
    `)
    expect(out).toEqual(['0'])
  })
})
