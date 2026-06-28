'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { PublishStatus } from '@/domain/properties/admin'

/**
 * Admin property row actions — AURA-303 (client component).
 *
 * Edit (link), Duplicate, and Archive for one row. Archive uses a two-step inline confirmation
 * (D-44: destructive actions require confirmation) — NOT a native dialog — so the flow is
 * testable and accessible. Mutations are plain `fetch` calls to the role-guarded
 * `/api/admin/properties/*` routes: NO Supabase / DAL / services import here (the route
 * handlers own auth + RLS + audit). After a successful change the router refreshes the list.
 */
export function PropertyRowActions({ id, status }: { id: string; status: PublishStatus }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function duplicate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/properties/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        setError('Could not duplicate this property.')
        return
      }
      const body = (await res.json()) as { data: { id: string } }
      router.push(`/admin/properties/${body.data.id}/edit`)
    } catch {
      setError('Could not duplicate this property.')
    } finally {
      setBusy(false)
    }
  }

  async function archive() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/properties/${id}/archive`, { method: 'PATCH' })
      if (!res.ok) {
        setError('Could not archive this property.')
        return
      }
      setConfirmingArchive(false)
      router.refresh()
    } catch {
      setError('Could not archive this property.')
    } finally {
      setBusy(false)
    }
  }

  const actionClass =
    'rounded-md border border-border-default px-2.5 py-1 text-caption uppercase tracking-widest text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary disabled:opacity-50'

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={`/admin/properties/${id}/edit`} className={actionClass}>
          Edit
        </Link>
        <button
          type="button"
          onClick={() => void duplicate()}
          disabled={busy}
          className={actionClass}
        >
          Duplicate
        </button>
        {status !== 'archived' && !confirmingArchive && (
          <button
            type="button"
            onClick={() => setConfirmingArchive(true)}
            disabled={busy}
            className={actionClass}
          >
            Archive
          </button>
        )}
      </div>

      {confirmingArchive && (
        <div
          role="group"
          aria-label="Confirm archive"
          className="flex items-center gap-2 rounded-md border border-border-default bg-surface-overlay px-2.5 py-1.5"
        >
          <span className="text-caption text-text-secondary">Archive this property?</span>
          <button
            type="button"
            onClick={() => void archive()}
            disabled={busy}
            className={actionClass}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmingArchive(false)}
            disabled={busy}
            className={actionClass}
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-caption text-brand-accent">
          {error}
        </p>
      )}
    </div>
  )
}
