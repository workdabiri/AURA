import 'server-only'

import { getSupabaseServiceRole } from '@/lib/supabase/service-role'
import type { Json } from '@/types/database'

/**
 * AURA-303 — audit-log writer (append-only, service-role, server-only).
 *
 * `server-only`: this module is the ONLY application write path for `audit_logs` and it
 * uses the RLS-bypassing service-role client. RLS grants `authenticated` NO insert on
 * `audit_logs` (writes are "server-side audited actions only" — see the AURA-103 policies),
 * so the privileged client is required here and MUST never reach the client bundle:
 *   - `import 'server-only'` (build-time guard),
 *   - `no-client-to-service-role` dependency-cruiser rule (service-role is never imported by UI).
 *
 * Append-only from the application's perspective (insert only; no update/delete). Snapshots
 * are curated to a small NON-PII field set (D-38: "avoid unnecessary PII in snapshots") — no
 * lead data, no contact details, no secrets are ever written here.
 */

/** Controlled audit actions emitted by AURA-303 (subset of DATA_MODEL §audit_logs minimums). */
type PropertyAuditAction =
  | 'property_created'
  | 'property_updated'
  | 'property_published'
  | 'property_archived'
  | 'property_duplicated'

interface WriteAuditLogInput {
  /** The acting admin's user id (auth uid), when available. */
  actorUserId: string | null
  /** The acting admin's role (`super_admin` | `client_admin`), or `system`. */
  actorRole: string
  action: PropertyAuditAction
  /** Entity class, e.g. `property`. */
  entityType: string
  /** Affected entity id (the property UUID), or null. */
  entityId: string | null
  beforeSnapshot?: Json | null
  afterSnapshot?: Json | null
  metadata?: Json
}

class AuditLogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuditLogError'
  }
}

/**
 * Append one audit-log row via the service-role client. Throws {@link AuditLogError} on
 * failure so a missing audit is LOUD (a sensitive state change must never silently skip its
 * audit — D-38 merge blocker). Callers perform the state change, then await this.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const supabase = getSupabaseServiceRole()
  const { error } = await supabase.from('audit_logs').insert({
    actor_user_id: input.actorUserId,
    actor_role: input.actorRole,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    before_snapshot: input.beforeSnapshot ?? null,
    after_snapshot: input.afterSnapshot ?? null,
    metadata: input.metadata ?? {},
  })

  if (error) {
    throw new AuditLogError(`Failed to write audit log (${input.action}): ${error.message}`)
  }
}
