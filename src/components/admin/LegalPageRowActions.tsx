'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { LegalPageStatus } from '@/domain/legal/admin'

/**
 * Admin legal row actions — AURA-307 (client component).
 *
 * Edit (drafts only) + Publish (drafts) + Archive (drafts/published), each via a plain `fetch` to
 * the role-guarded `/api/admin/legal/[id]/*` routes — NO Supabase / DAL / services import (the
 * routes own auth + RLS + audit). There is NO hard delete; archiving is the only removal. Publish
 * and archive use a two-step inline confirmation (owner pattern — no modal). After a change the
 * router refreshes the list.
 */
export function LegalPageRowActions({ id, status }: { id: string; status: LegalPageStatus }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<'publish' | 'archive' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function act(action: 'publish' | 'archive') {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/legal/${id}/${action}`, { method: 'POST' })
      if (!res.ok) {
        setError(
          action === 'publish'
            ? 'Could not publish this version.'
            : 'Could not archive this version.'
        )
        return
      }
      setConfirming(null)
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
        {status === 'draft' && (
          <Link href={`/admin/legal/${id}/edit`} className={actionClass}>
            Edit
          </Link>
        )}
        {status === 'draft' && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming('publish')}
            disabled={busy}
            className={actionClass}
          >
            Publish
          </button>
        )}
        {status !== 'archived' && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming('archive')}
            disabled={busy}
            className={actionClass}
          >
            Archive
          </button>
        )}
        {status === 'archived' && (
          <span className="text-caption uppercase tracking-widest text-text-secondary opacity-70">
            Archived
          </span>
        )}
      </div>

      {confirming && (
        <div
          role="group"
          aria-label={`Confirm ${confirming}`}
          className="flex items-center gap-2 rounded-md border border-border-default bg-surface-overlay px-2.5 py-1.5"
        >
          <span className="text-caption text-text-secondary">
            {confirming === 'publish' ? 'Publish this version?' : 'Archive this version?'}
          </span>
          <button
            type="button"
            onClick={() => void act(confirming)}
            disabled={busy}
            className={actionClass}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirming(null)}
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
