import { describe, expect, test } from 'vitest'

// Imports the pure helpers only. Importing the module does NOT trigger the
// `server-only` guard: the service-role client is dynamically imported inside
// main(), which never runs under the test runner (argv[1] is not this file).
import { classifyProfileAction, isValidUuid, parseSeedArgs } from '../../../scripts/seed-admin'

const VALID_UUID = '0b3f1d6e-1c2a-4b8e-9f33-2a1b4c5d6e7f'

describe('seed-admin: isValidUuid (AURA-104)', () => {
  test('accepts canonical UUIDs', () => {
    expect(isValidUuid(VALID_UUID)).toBe(true)
    expect(isValidUuid('11111111-1111-1111-1111-111111111111')).toBe(true)
  })

  test('rejects malformed input', () => {
    expect(isValidUuid('')).toBe(false)
    expect(isValidUuid('not-a-uuid')).toBe(false)
    expect(isValidUuid('0b3f1d6e1c2a4b8e9f332a1b4c5d6e7f')).toBe(false)
    expect(isValidUuid(`${VALID_UUID} `)).toBe(false)
  })
})

describe('seed-admin: parseSeedArgs (AURA-104)', () => {
  test('parses CLI flags (space form)', () => {
    expect(parseSeedArgs(['--user-id', VALID_UUID, '--full-name', 'Jane Operator'])).toEqual({
      userId: VALID_UUID,
      fullName: 'Jane Operator',
    })
  })

  test('parses CLI flags (--key=value form)', () => {
    expect(parseSeedArgs([`--user-id=${VALID_UUID}`, '--full-name=Jane Operator'])).toEqual({
      userId: VALID_UUID,
      fullName: 'Jane Operator',
    })
  })

  test('falls back to SEED_ADMIN_* env when flags are absent', () => {
    expect(
      parseSeedArgs([], { SEED_ADMIN_USER_ID: VALID_UUID, SEED_ADMIN_FULL_NAME: 'Env Operator' })
    ).toEqual({ userId: VALID_UUID, fullName: 'Env Operator' })
  })

  test('CLI flags take precedence over env', () => {
    expect(
      parseSeedArgs(['--user-id', VALID_UUID, '--full-name', 'CLI Wins'], {
        SEED_ADMIN_USER_ID: '99999999-9999-9999-9999-999999999999',
        SEED_ADMIN_FULL_NAME: 'Env Loses',
      })
    ).toEqual({ userId: VALID_UUID, fullName: 'CLI Wins' })
  })

  test('trims surrounding whitespace', () => {
    expect(parseSeedArgs(['--user-id', VALID_UUID, '--full-name', '  Jane  '])).toEqual({
      userId: VALID_UUID,
      fullName: 'Jane',
    })
  })

  test('throws when user id is missing', () => {
    expect(() => parseSeedArgs(['--full-name', 'Jane'])).toThrow(/user id is required/i)
  })

  test('throws when user id is not a UUID', () => {
    expect(() => parseSeedArgs(['--user-id', 'nope', '--full-name', 'Jane'])).toThrow(
      /invalid user id/i
    )
  })

  test('throws when full name is missing', () => {
    expect(() => parseSeedArgs(['--user-id', VALID_UUID])).toThrow(/full name is required/i)
  })

  test('throws when a flag is given without a value', () => {
    expect(() => parseSeedArgs(['--user-id'])).toThrow(/missing value/i)
  })
})

describe('seed-admin: classifyProfileAction — idempotent + fail-closed (AURA-104)', () => {
  test('no existing profile → insert', () => {
    expect(classifyProfileAction(null)).toBe('insert')
    expect(classifyProfileAction(undefined)).toBe('insert')
  })

  test('already super_admin → noop (idempotent)', () => {
    expect(classifyProfileAction('super_admin')).toBe('noop')
  })

  test('existing different role → conflict (fail closed, never auto-promote/demote)', () => {
    expect(classifyProfileAction('client_admin')).toBe('conflict')
    expect(classifyProfileAction('editor')).toBe('conflict')
  })
})
