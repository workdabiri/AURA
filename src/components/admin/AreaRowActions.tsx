'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Admin area row actions — AURA-305 (client component).
 *
 * Edit (link) plus a status toggle: for an ACTIVE row, Deactivate uses a two-step inline
 * confirmation (owner-locked — no modal); for an INACTIVE row, Reactivate is a single action
 * (reactivation is non-destructive). Mutations are plain `fetch` PATCHes (multipart) to the
 * role-guarded `/api/admin/areas/[id]` route: NO Supabase / DAL / services import here (the route
 * owns auth + RLS + audit). There is NO hard delete. After a change the router refreshes the list.
 */
export function AreaRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function setActive(next: boolean) {
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('is_active', next ? 'true' : 'false')
      const res = await fetch(`/api/admin/areas/${id}`, { method: 'PATCH', body: fd })
      if (!res.ok) {
        setError(next ? 'Could not reactivate this area.' : 'Could not deactivate this area.')
        return
      }
      setConfirmingDeactivate(false)
      router.refresh()
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const actionClass =
    'rounded-md border border-border-default px-2.5 py-1 text-caption uppercase tracking-widest text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary disabled:opacity-50'

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={`/admin/areas/${id}/edit`} className={actionClass}>
          Edit
        </Link>
        {isActive ? (
          !confirmingDeactivate && (
            <button
              type="button"
              onClick={() => setConfirmingDeactivate(true)}
              disabled={busy}
              className={actionClass}
            >
              Deactivate
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => void setActive(true)}
            disabled={busy}
            className={actionClass}
          >
            Reactivate
          </button>
        )}
      </div>

      {confirmingDeactivate && (
        <div
          role="group"
          aria-label="Confirm deactivate"
          className="flex items-center gap-2 rounded-md border border-border-default bg-surface-overlay px-2.5 py-1.5"
        >
          <span className="text-caption text-text-secondary">Deactivate this area?</span>
          <button
            type="button"
            onClick={() => void setActive(false)}
            disabled={busy}
            className={actionClass}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDeactivate(false)}
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
