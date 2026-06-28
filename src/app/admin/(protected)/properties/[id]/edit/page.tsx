import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { PropertyForm } from '@/components/admin/PropertyForm'
import { PropertyMediaManager } from '@/components/admin/PropertyMediaManager'
import { PropertyStatusBadge } from '@/components/admin/PropertyStatusBadge'
import { getAdminPropertyById } from '@/dal/admin-properties.dal'
import { listAdminPropertyMedia } from '@/dal/admin-property-media.dal'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Edit property (`/admin/properties/[id]/edit`) — AURA-303 + AURA-304.
 *
 * Inside the guarded `(protected)` group. Loads the property (any status) and its media via the
 * admin DAL (admin session + RLS; no service role) and hydrates the edit form + media manager.
 * Slug + reference number are shown read-only — they are fixed after creation (A-06 / D-47).
 * Publishing, archiving, and all media mutations go through the role-guarded API routes.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit property · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = UUID_RE.test(id) ? await getAdminPropertyById(id) : null
  const media = property ? await listAdminPropertyMedia(property.id) : []

  if (!property) {
    return (
      <AdminShell>
        <div className="flex flex-col gap-2">
          <Link href="/admin/properties" className="text-small text-text-secondary underline">
            ← Properties
          </Link>
          <h1 className="font-display text-h2 text-text-primary">Property not found</h1>
          <p className="text-small text-text-secondary">
            This property does not exist or has been removed.
          </p>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Link href="/admin/properties" className="text-small text-text-secondary underline">
            ← Properties
          </Link>
          <h1 className="font-display text-h2 text-text-primary">Edit property</h1>
          <p className="flex items-center gap-3 text-small text-text-secondary">
            <span className="font-mono">{property.reference_number}</span>
            <span>·</span>
            <span className="font-mono">/{property.slug}</span>
            <PropertyStatusBadge status={property.publish_status} />
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-10">
        <PropertyForm mode="edit" property={property} />
        <PropertyMediaManager
          propertyId={property.id}
          initialMedia={media}
          archived={property.publish_status === 'archived'}
        />
      </div>
    </AdminShell>
  )
}
