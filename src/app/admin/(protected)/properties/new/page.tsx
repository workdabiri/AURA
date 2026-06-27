import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { PropertyForm } from '@/components/admin/PropertyForm'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * New property (`/admin/properties/new`) — AURA-303.
 *
 * Inside the guarded `(protected)` group. Creates a DRAFT only (publishing happens later from
 * the edit page, once the checklist passes). The form (client island) posts to the role-guarded
 * `POST /api/admin/properties`. Admin is always `noindex` (inherited from the admin root layout).
 */
export const metadata: Metadata = {
  title: 'New property · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

export default function NewPropertyPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <Link href="/admin/properties" className="text-small text-text-secondary underline">
          ← Properties
        </Link>
        <h1 className="font-display text-h2 text-text-primary">New property</h1>
        <p className="max-w-2xl text-small text-text-secondary">
          Create a draft listing. You can publish it from the edit screen once the publish checklist
          passes (a cover image with alt text is added in a later step).
        </p>
      </div>
      <div className="mt-6">
        <PropertyForm mode="create" />
      </div>
    </AdminShell>
  )
}
