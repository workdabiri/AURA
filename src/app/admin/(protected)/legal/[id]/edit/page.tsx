import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { LegalPageForm } from '@/components/admin/LegalPageForm'
import { LegalPageStatusBadge } from '@/components/admin/LegalPageStatusBadge'
import { getAdminLegalPageById } from '@/dal/legal.dal'
import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Edit legal page (`/admin/legal/[id]/edit`) — AURA-307.
 *
 * Inside the guarded `(protected)` group. Loads the legal page (any status) via the admin DAL
 * (admin session + RLS; no service role) and hydrates the form. Slug is shown read-only (fixed
 * after creation). Only DRAFT versions are editable; a published/archived version renders
 * read-only (the form disables its fields). Edits go through `PATCH /api/admin/legal/[id]`.
 *
 * `force-dynamic`: per-request, session-scoped admin data — never statically rendered.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit legal page · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditLegalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = UUID_RE.test(id) ? await getAdminLegalPageById(id) : null

  if (!page) {
    return (
      <AdminShell>
        <div className="flex flex-col gap-2">
          <Link href="/admin/legal" className="text-small text-text-secondary underline">
            ← Legal
          </Link>
          <h1 className="font-display text-h2 text-text-primary">Legal page not found</h1>
          <p className="text-small text-text-secondary">
            This legal page does not exist or has been removed.
          </p>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Link href="/admin/legal" className="text-small text-text-secondary underline">
            ← Legal
          </Link>
          <h1 className="font-display text-h2 text-text-primary">Edit legal page</h1>
          <p className="flex items-center gap-3 text-small text-text-secondary">
            <span className="font-mono">/{page.slug}</span>
            <span>v{page.version}</span>
            <LegalPageStatusBadge status={page.status} />
          </p>
        </div>
      </div>
      <div className="mt-6 max-w-3xl">
        <LegalPageForm mode="edit" page={page} />
      </div>
    </AdminShell>
  )
}
