/**
 * scripts/seed-admin.ts — first-`super_admin` bootstrap (AURA-104, D-40).
 *
 * OPERATOR-ONLY. This links an ALREADY-EXISTING Supabase Auth user to a
 * `public.user_profiles` row with role `super_admin`. It constructs the privileged
 * server client (which bypasses RLS) and therefore must only ever run in a trusted
 * operator/server environment — never in the browser and never in the request path.
 *
 * It does NOT:
 *   - create Supabase Auth users or passwords,
 *   - expose any self-signup / self-registration path (D-40 merge blocker).
 *
 * Behaviour:
 *   - The Auth user must already exist (create it manually in Supabase Auth first).
 *     Existence is verified via the admin API before any write.
 *   - Idempotent: re-running for a user who is already `super_admin` is a no-op success.
 *   - Fail-closed: if a profile already exists with a DIFFERENT role, it refuses and
 *     exits non-zero (no silent promotion/demotion).
 *
 * Inputs (CLI flags preferred; env fallback for non-interactive operator runs):
 *   --user-id   <uuid>     (fallback: SEED_ADMIN_USER_ID)
 *   --full-name <name>     (fallback: SEED_ADMIN_FULL_NAME)
 *   Flags also accept the `--key=value` form. The SEED_ADMIN_* fallbacks are
 *   operator/runtime-only and are intentionally NOT part of the application env
 *   schema (src/lib/validation/env.schema.ts).
 *
 * RUNNING IT — runner decision pending: executing this file needs a TypeScript
 * runner that resolves the `@/*` path alias AND the `server-only`-guarded server
 * helper (e.g. a loader that sets the `react-server` resolve condition). No such
 * runner is currently a repo dependency (no tsx/ts-node), and none is added here.
 * See SESSION_HANDOFF.md (AURA-104) for the tracked runner decision.
 */
import { fileURLToPath } from 'node:url'

export interface SeedAdminArgs {
  userId: string
  fullName: string
}

export type ProfileAction = 'insert' | 'noop' | 'conflict'

// Accepts any canonically-formatted UUID (8-4-4-4-12 hex). We reject only
// obviously-malformed input; we do not enforce a specific UUID version.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/**
 * Parse operator inputs. CLI flags take precedence over the SEED_ADMIN_* env
 * fallbacks. Throws a descriptive error on missing/invalid input.
 */
export function parseSeedArgs(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>> = {}
): SeedAdminArgs {
  const flags = new Map<string, string>()

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === '--user-id' || token === '--full-name') {
      const value = argv[i + 1]
      if (value === undefined) {
        throw new Error(`Missing value for ${token}.`)
      }
      flags.set(token, value)
      i++
    } else if (token?.startsWith('--user-id=')) {
      flags.set('--user-id', token.slice('--user-id='.length))
    } else if (token?.startsWith('--full-name=')) {
      flags.set('--full-name', token.slice('--full-name='.length))
    }
  }

  const userId = (flags.get('--user-id') ?? env.SEED_ADMIN_USER_ID ?? '').trim()
  const fullName = (flags.get('--full-name') ?? env.SEED_ADMIN_FULL_NAME ?? '').trim()

  if (!userId) {
    throw new Error('A user id is required: pass --user-id <uuid> (or set SEED_ADMIN_USER_ID).')
  }
  if (!isValidUuid(userId)) {
    // Do not echo the value: it can derive from CLI/env and must not be logged in
    // clear text (CodeQL js/clear-text-logging treats process-env values as sensitive).
    throw new Error('Invalid user id: expected a UUID.')
  }
  if (!fullName) {
    throw new Error(
      'A full name is required: pass --full-name <name> (or set SEED_ADMIN_FULL_NAME).'
    )
  }

  return { userId, fullName }
}

/**
 * Decide what to do given any existing profile role:
 *   - none          → insert a new super_admin profile
 *   - super_admin   → no-op (idempotent success)
 *   - other role    → conflict (fail closed; never auto-promote/demote)
 */
export function classifyProfileAction(existingRole: string | null | undefined): ProfileAction {
  if (existingRole === null || existingRole === undefined) {
    return 'insert'
  }
  if (existingRole === 'super_admin') {
    return 'noop'
  }
  return 'conflict'
}

async function main(): Promise<void> {
  const args = parseSeedArgs(process.argv.slice(2), process.env)

  // Dynamic import so this module can be imported by unit tests WITHOUT evaluating
  // the `server-only`-guarded helper. The privileged client is only constructed
  // here, on the operator run path.
  const { getSupabaseServiceRole } = await import('@/lib/supabase/service-role')
  const supabase = getSupabaseServiceRole()

  // 1. Verify the Auth user exists. We NEVER create it here (no signup, D-40).
  const { data: userResult, error: userError } = await supabase.auth.admin.getUserById(args.userId)
  if (userError || !userResult?.user) {
    // Identifiers are not echoed (they may be env-derived; avoid clear-text logging).
    throw new Error(
      'No Supabase Auth user found for the provided id. ' +
        'Create the user in Supabase Auth first — this script never creates users.'
    )
  }

  // 2. Inspect any existing profile and decide, fail-closed.
  const { data: existing, error: readError } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', args.userId)
    .maybeSingle<{ id: string; role: string }>()
  if (readError) {
    throw new Error(`Failed to read existing profile: ${readError.message}`)
  }

  const action = classifyProfileAction(existing?.role ?? null)

  if (action === 'noop') {
    console.log('✓ Target user is already super_admin — no changes made.')
    return
  }
  if (action === 'conflict') {
    // `existing.role` is DB-derived (not env) and safe to surface; the id is not echoed.
    throw new Error(
      `Refusing to modify the target profile: its existing role is "${existing?.role}", ` +
        `not super_admin. This script will not change a non-super_admin profile.`
    )
  }

  // 3. action === 'insert' → create the super_admin profile.
  const { error: insertError } = await supabase
    .from('user_profiles')
    .insert({ id: args.userId, role: 'super_admin', full_name: args.fullName })
  if (insertError) {
    throw new Error(`Failed to create super_admin profile: ${insertError.message}`)
  }

  console.log('✓ Created super_admin profile for the target user.')
}

// Run only when invoked directly (e.g. `node scripts/seed-admin.ts ...` via a TS
// runner). When imported by a test, argv[1] is the test runner, so main() — and the
// dynamic server-only import inside it — never runs.
const isDirectRun =
  typeof process.argv[1] === 'string' && process.argv[1] === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
