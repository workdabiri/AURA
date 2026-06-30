import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { LegalPageForm } from '@/components/admin/LegalPageForm'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * New legal draft (`/admin/legal/new`) — AURA-307.
 *
 * Inside the guarded `(protected)` group. The form (client island) posts JSON to the role-guarded
 * `POST /api/admin/legal` (slug `privacy` | `terms`, title, Markdown content, effective date). The
 * row is always created as a draft; publishing happens from the list. Admin is always `noindex`.
 */
export const metadata: Metadata = {
  title: 'New legal draft · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

export default function NewLegalPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-2">
        <Link href="/admin/legal" className="text-small text-text-secondary underline">
          ← Legal
        </Link>
        <h1 className="font-display text-h2 text-text-primary">New legal draft</h1>
        <p className="max-w-2xl text-small text-text-secondary">
          Create a Privacy or Terms draft in Markdown. It is saved as a draft until you publish it.
        </p>
      </div>
      <div className="mt-6 max-w-3xl">
        <LegalPageForm mode="create" />
      </div>
    </AdminShell>
  )
}
