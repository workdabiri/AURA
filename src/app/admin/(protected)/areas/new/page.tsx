import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { AreaForm } from '@/components/admin/AreaForm'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * New area (`/admin/areas/new`) — AURA-305.
 *
 * Inside the guarded `(protected)` group. The form (client island) posts multipart to the
 * role-guarded `POST /api/admin/areas` (fields + optional representative image). Admin is always
 * `noindex` (inherited from the admin root layout).
 */
export const metadata: Metadata = {
  title: 'New area · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

export default function NewAreaPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <Link href="/admin/areas" className="text-small text-text-secondary underline">
          ← Areas
        </Link>
        <h1 className="font-display text-h2 text-text-primary">New area</h1>
        <p className="max-w-2xl text-small text-text-secondary">
          Create a community/area. The slug is set here and is fixed after creation.
        </p>
      </div>
      <div className="mt-6">
        <AreaForm mode="create" />
      </div>
    </AdminShell>
  )
}
