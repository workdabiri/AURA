import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { AreaForm } from '@/components/admin/AreaForm'
import { AreaStatusBadge } from '@/components/admin/AreaStatusBadge'
import { getAdminAreaById } from '@/dal/admin-areas.dal'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Edit area (`/admin/areas/[id]/edit`) — AURA-305.
 *
 * Inside the guarded `(protected)` group. Loads the area (any active state) via the admin DAL
 * (admin session + RLS; no service role) and hydrates the edit form. Slug is shown read-only —
 * it is fixed after creation. Field edits, image replacement, and deactivate/reactivate all go
 * through the role-guarded `PATCH /api/admin/areas/[id]` route.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit area · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditAreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const area = UUID_RE.test(id) ? await getAdminAreaById(id) : null

  if (!area) {
    return (
      <AdminShell>
        <div className="flex flex-col gap-2">
          <Link href="/admin/areas" className="text-small text-text-secondary underline">
            ← Areas
          </Link>
          <h1 className="font-display text-h2 text-text-primary">Area not found</h1>
          <p className="text-small text-text-secondary">
            This area does not exist or has been removed.
          </p>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Link href="/admin/areas" className="text-small text-text-secondary underline">
            ← Areas
          </Link>
          <h1 className="font-display text-h2 text-text-primary">Edit area</h1>
          <p className="flex items-center gap-3 text-small text-text-secondary">
            <span className="font-mono">/{area.slug}</span>
            <AreaStatusBadge isActive={area.isActive} />
          </p>
        </div>
      </div>
      <div className="mt-6">
        <AreaForm mode="edit" area={area} />
      </div>
    </AdminShell>
  )
}
