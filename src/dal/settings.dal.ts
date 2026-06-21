import 'server-only'

import {
  PUBLIC_SETTING_KEYS,
  defaultPublicSettings,
  projectPublicSettings,
  type PublicSettings,
} from '@/domain/settings'
import { getSupabaseServiceRole } from '@/lib/supabase/service-role'

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
