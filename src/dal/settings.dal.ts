import 'server-only'

import {
  EDITABLE_SETTING_KEYS,
  PUBLIC_SETTING_KEYS,
  defaultPublicSettings,
  projectPublicSettings,
  type PublicSettings,
  type SettingRow,
} from '@/domain/settings'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseServiceRole } from '@/lib/supabase/service-role'
import type { Json } from '@/types/database'

/**
 * Public settings safe selector — AURA-201 (A-09).
 *
 * `server-only`: uses the service-role client, which bypasses RLS and must never
 * reach the client bundle. The `settings` table has no anon policy, so this is
 * the only public read path — and it is deliberately narrow:
 *   - selects ONLY `key, value` (never `updated_by` or timestamps),
 *   - filters to the public allowlist at the query level (defence in depth),
 *   - projects through `projectPublicSettings` (allowlist + per-key Zod),
 *   - FAILS CLOSED: any error (missing env, stack down, malformed data) returns
 *     safe defaults rather than throwing into a public page.
 *
 * No raw rows are ever returned to callers — only the typed public DTO.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const supabase = getSupabaseServiceRole()
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [...PUBLIC_SETTING_KEYS])

    if (error || !data) {
      return defaultPublicSettings()
    }

    return projectPublicSettings(data as { key: string; value: unknown }[])
  } catch {
    return defaultPublicSettings()
  }
}

/**
 * AURA-306 — ADMIN settings read + write (server-only).
 *
 * SECURITY POSTURE (owner-locked, AURA-306): the admin read/write below use the request-scoped
 * ANON server client under the CALLER'S OWN admin session — NEVER the service role. The
 * `settings_admin_select/insert/update` RLS policies (gated on `public.is_admin()`) are the
 * boundary; the route's `requireAdmin()` runs first. The ONLY service-role path in this file is
 * `getPublicSettings` above (the public safe selector); the only other service-role path in
 * AURA-306 is the audit writer (`audit-logs.dal.ts`).
 *
 *   - Explicit column allowlist (`key, value`) — never `select('*')`, never row metadata.
 *   - Reads/writes are restricted to the editable allowlist (`EDITABLE_SETTING_KEYS`) — unknown /
 *     deferred keys can never reach the DB. The strict route schema rejects them first; the DAL's
 *     allowlist filter (via `toSettingRows` upstream + the `.in(...)` read filter) is defence in
 *     depth.
 *   - NO delete path exists: no DELETE policy on `settings`, and this file issues no row deletion.
 *   - `updated_by` is server-set to the acting admin; `updated_at` is DB-managed (the
 *     `settings_set_updated_at` trigger fires on update; insert uses the column default).
 */

class AdminSettingsDalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminSettingsDalError'
  }
}

/** Admin setting columns. NEVER `*`; never `updated_by` / `updated_at` (not surfaced to the UI). */
const ADMIN_SETTING_COLUMNS = 'key, value'

/**
 * Read the editable settings for the admin form. Restricted to the editable allowlist at the query
 * level, then projected through the SAME public projector (`projectPublicSettings`) so the typed,
 * allowlisted DTO — and its safe defaults for an unconfigured DB — is identical to what the public
 * footer renders. Returns ONLY allowed keys; no row metadata is ever read.
 */
export async function getAdminSettings(): Promise<PublicSettings> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('settings')
    .select(ADMIN_SETTING_COLUMNS)
    .in('key', [...EDITABLE_SETTING_KEYS])

  if (error) {
    throw new AdminSettingsDalError(`Failed to read admin settings: ${error.message}`)
  }

  return projectPublicSettings((data ?? []) as { key: string; value: unknown }[])
}

/**
 * Upsert the provided editable settings (partial batch). `rows` come from the domain
 * `toSettingRows` helper (already validated + allowlisted); this re-filters to the editable
 * allowlist as a final backstop so a non-allowlisted key can NEVER be written. Each row is keyed
 * by `key` (the PK), so `upsert(onConflict: 'key')` inserts a new key or updates an existing one.
 * Returns the keys actually written (for the route's audit metadata).
 */
export async function updateAdminSettings(
  rows: SettingRow[],
  actorUserId: string | null
): Promise<string[]> {
  const allow = new Set<string>(EDITABLE_SETTING_KEYS)
  const payload = rows
    .filter((row) => allow.has(row.key))
    .map((row) => ({ key: row.key, value: row.value as Json, updated_by: actorUserId }))

  if (payload.length === 0) {
    // The route rejects an empty patch before this; treat a defensive empty payload as a no-op.
    return []
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'key' })

  if (error) {
    throw new AdminSettingsDalError(`Failed to update settings: ${error.message}`)
  }

  return payload.map((row) => row.key)
}
