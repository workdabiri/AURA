'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { SafeMarkdown } from '@/components/legal/SafeMarkdown'
import {
  containsUnsafeLegalHtml,
  LEGAL_ADMIN_SLUGS,
  type AdminLegalPageDetailDTO,
} from '@/domain/legal/admin'

/**
 * Admin legal create/edit form — AURA-307 (client component).
 *
 * Pages, not modals. Submits a JSON `fetch` to the role-guarded `/api/admin/legal*` routes — NO
 * Supabase / DAL / services / storage import (the routes own auth + RLS + audit). Content is a
 * MARKDOWN TEXTAREA only (no rich-text / raw-HTML editor); the optional preview reuses the public
 * `SafeMarkdown` renderer (no `dangerouslySetInnerHTML`, no `rehype-raw`). Write-time HTML safety is
 * enforced by the API + domain (D-12); this client also blocks an obviously-unsafe submission early.
 *
 *   - Slug is selectable ONLY in create mode (`privacy` | `terms`); in edit mode it is read-only.
 *   - Only DRAFT rows are editable — a published/archived version renders read-only (publish/
 *     archive happen from the list row actions; a new draft is created to make changes).
 *
 * D-44 states handled: validation (field issues), error (request failure), success, busy/loading.
 */

type Mode = 'create' | 'edit'

interface ValidationIssue {
  path: (string | number)[]
  message: string
}

const inputClass =
  'w-full rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary'
const labelClass = 'flex flex-col gap-1 text-small text-text-secondary'

/** Today's date as `YYYY-MM-DD` for the create-mode default effective date. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LegalPageForm({ mode, page }: { mode: Mode; page?: AdminLegalPageDetailDTO }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [content, setContent] = useState(page?.content ?? '')

  const readOnly = mode === 'edit' && page?.status !== 'draft'

  async function submit(form: HTMLFormElement) {
    setBusy(true)
    setIssues([])
    setErrorMsg(null)
    setSuccessMsg(null)

    const source = new FormData(form)
    const read = (name: string) => String(source.get(name) ?? '').trim()

    // Early client-side D-12 guard (the API + domain are the authoritative check).
    if (containsUnsafeLegalHtml(content)) {
      setBusy(false)
      setErrorMsg('Content must be Markdown only — raw HTML (tags, scripts) is not allowed.')
      return
    }

    try {
      let url: string
      let method: string
      let body: Record<string, unknown>

      if (mode === 'create') {
        url = '/api/admin/legal'
        method = 'POST'
        body = {
          slug: read('slug'),
          title: read('title'),
          content,
          effective_date: read('effective_date'),
        }
      } else {
        url = `/api/admin/legal/${page!.id}`
        method = 'PATCH'
        body = {
          title: read('title'),
          content,
          effective_date: read('effective_date'),
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const payload = (await res.json().catch(() => ({}))) as {
        data?: { id?: string }
        code?: string
        issues?: ValidationIssue[]
      }

      if (res.ok) {
        if (mode === 'create' && payload.data?.id) {
          router.push(`/admin/legal/${payload.data.id}/edit`)
          return
        }
        setSuccessMsg('Changes saved.')
        router.refresh()
        return
      }

      if (payload.code === 'VALIDATION_ERROR' && payload.issues) {
        setIssues(payload.issues)
      } else if (payload.code === 'VALIDATION_ERROR') {
        setErrorMsg('Please correct the highlighted fields and try again.')
      } else if (payload.code === 'NOT_DRAFT') {
        setErrorMsg('Only draft legal pages can be edited.')
      } else if (res.status === 401 || res.status === 403) {
        setErrorMsg('Your session is not authorized. Please sign in again.')
      } else if (res.status === 404) {
        setErrorMsg('This legal page no longer exists.')
      } else {
        setErrorMsg('Could not save the legal page. Please try again.')
      }
    } catch {
      setErrorMsg('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!readOnly) void submit(e.currentTarget)
      }}
      className="flex flex-col gap-6"
      aria-busy={busy}
      noValidate
    >
      {readOnly && (
        <p
          role="status"
          className="rounded-md border border-border-default bg-surface-card px-4 py-3 text-small text-text-secondary"
        >
          This {page?.status} version is read-only. Create a new draft to make changes.
        </p>
      )}

      {(issues.length > 0 || errorMsg || successMsg) && (
        <div className="flex flex-col gap-2" role="status" aria-live="polite">
          {successMsg && (
            <p className="rounded-md border border-brand-accent/50 bg-surface-card px-4 py-3 text-small text-brand-accent">
              {successMsg}
            </p>
          )}
          {errorMsg && (
            <p
              role="alert"
              className="rounded-md border border-border-default bg-surface-card px-4 py-3 text-small text-text-primary"
            >
              {errorMsg}
            </p>
          )}
          {issues.length > 0 && (
            <div
              role="alert"
              className="rounded-md border border-border-default bg-surface-card px-4 py-3 text-small text-text-primary"
            >
              <p className="mb-1 font-medium">Please correct the following:</p>
              <ul className="list-inside list-disc text-text-secondary">
                {issues.map((i, idx) => (
                  <li key={idx}>
                    {i.path.length > 0 ? `${i.path.join('.')}: ` : ''}
                    {i.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <fieldset
        disabled={readOnly}
        className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface-card p-5"
      >
        <legend className="px-1 font-display text-h3 text-text-primary">Legal page</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {mode === 'create' ? (
            <label className={labelClass}>
              <span>Page *</span>
              <select name="slug" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Select a page…
                </option>
                {LEGAL_ADMIN_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={labelClass}>
              <span>Page (fixed after creation)</span>
              <input
                value={page?.slug ?? ''}
                readOnly
                disabled
                className={`${inputClass} font-mono opacity-70`}
              />
            </label>
          )}

          <label className={labelClass}>
            <span>Effective date *</span>
            <input
              name="effective_date"
              type="date"
              required
              defaultValue={page?.effectiveDate ?? todayIso()}
              className={inputClass}
            />
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            <span>Title *</span>
            <input name="title" required defaultValue={page?.title ?? ''} className={inputClass} />
          </label>
        </div>
      </fieldset>

      <fieldset
        disabled={readOnly}
        className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface-card p-5"
      >
        <legend className="px-1 font-display text-h3 text-text-primary">Content (Markdown)</legend>
        <p className="text-small text-text-secondary">
          Markdown only. Raw HTML (tags, scripts, event handlers) is rejected.
        </p>
        <label className={labelClass}>
          <span>Body *</span>
          <textarea
            name="content"
            required
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </label>
        <div>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="rounded-md border border-border-default px-3 py-1.5 text-caption uppercase tracking-widest text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
          >
            {preview ? 'Hide preview' : 'Show preview'}
          </button>
        </div>
        {preview && (
          <div className="rounded-md border border-border-default bg-surface-page p-4">
            <SafeMarkdown content={content} />
          </div>
        )}
      </fieldset>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md border border-border-default bg-surface-card px-5 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
          >
            {busy ? 'Saving…' : mode === 'create' ? 'Create draft' : 'Save changes'}
          </button>
          {mode === 'create' && (
            <span className="text-caption uppercase tracking-widest text-text-secondary">
              Created as a draft — publish from the list.
            </span>
          )}
        </div>
      )}
    </form>
  )
}
