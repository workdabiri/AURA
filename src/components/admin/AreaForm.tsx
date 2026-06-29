'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { AdminAreaDetailDTO } from '@/domain/areas/admin-view'
import { ALLOWED_AREA_IMAGE_MIME_TYPES, AREA_IMAGE_MAX_BYTES } from '@/domain/areas/admin'

/**
 * Admin area create/edit form — AURA-305 (client component).
 *
 * Pages, not modals. Submits a multipart `fetch` to the role-guarded `/api/admin/areas*` routes —
 * NO Supabase / DAL / services / storage import (the routes own auth + RLS + audit + storage).
 *
 *   - Slug is editable ONLY in create mode; in edit mode it is shown read-only (immutable).
 *   - One representative area image (optional). Upload replaces the existing image on edit.
 *   - `sort_order` (default 0) + `is_active` are exposed; no drag/drop, no gallery, no multi-file.
 *
 * D-44 states handled: validation (field issues), error (request failure), success, busy/loading.
 */

type Mode = 'create' | 'edit'

interface ValidationIssue {
  path: (string | number)[]
  message: string
}

const ACCEPT = ALLOWED_AREA_IMAGE_MIME_TYPES.join(',')
const MAX_MB = Math.round(AREA_IMAGE_MAX_BYTES / (1024 * 1024))

const inputClass =
  'w-full rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary'
const labelClass = 'flex flex-col gap-1 text-small text-text-secondary'

export function AreaForm({ mode, area }: { mode: Mode; area?: AdminAreaDetailDTO }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function submit(form: HTMLFormElement) {
    setBusy(true)
    setIssues([])
    setErrorMsg(null)
    setSuccessMsg(null)

    // Build the multipart body explicitly so transport types are unambiguous (e.g. is_active).
    const source = new FormData(form)
    const fd = new FormData()
    if (mode === 'create') fd.set('slug', String(source.get('slug') ?? '').trim())
    fd.set('name_en', String(source.get('name_en') ?? '').trim())
    fd.set('description_en', String(source.get('description_en') ?? '').trim())
    fd.set('sort_order', String(source.get('sort_order') ?? '0').trim() || '0')
    fd.set('is_active', source.get('is_active') === 'on' ? 'true' : 'false')
    const file = source.get('file')
    if (file instanceof File && file.size > 0) fd.set('file', file)

    try {
      const url = mode === 'create' ? '/api/admin/areas' : `/api/admin/areas/${area!.id}`
      const res = await fetch(url, { method: mode === 'create' ? 'POST' : 'PATCH', body: fd })

      const body = (await res.json().catch(() => ({}))) as {
        data?: { id?: string }
        code?: string
        issues?: ValidationIssue[]
      }

      if (res.ok) {
        if (mode === 'create' && body.data?.id) {
          router.push(`/admin/areas/${body.data.id}/edit`)
          return
        }
        setSuccessMsg('Changes saved.')
        router.refresh()
        return
      }

      if (body.code === 'VALIDATION_ERROR' && body.issues) {
        setIssues(body.issues)
      } else if (body.code === 'SLUG_CONFLICT') {
        setErrorMsg('That slug is already in use. Choose another.')
      } else if (body.code === 'UNSUPPORTED_TYPE') {
        setErrorMsg('Unsupported image type. Use JPEG, PNG, or WebP.')
      } else if (body.code === 'FILE_TOO_LARGE') {
        setErrorMsg(`The image is too large. The limit is ${MAX_MB}MB.`)
      } else if (res.status === 401 || res.status === 403) {
        setErrorMsg('Your session is not authorized. Please sign in again.')
      } else if (res.status === 404) {
        setErrorMsg('This area no longer exists.')
      } else {
        setErrorMsg('Could not save the area. Please try again.')
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
        void submit(e.currentTarget)
      }}
      className="flex flex-col gap-6"
      aria-busy={busy}
      noValidate
    >
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

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface-card p-5">
        <legend className="px-1 font-display text-h3 text-text-primary">Area details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {mode === 'create' ? (
            <label className={labelClass}>
              <span>Slug *</span>
              <input name="slug" required placeholder="dubai-marina" className={inputClass} />
            </label>
          ) : (
            <label className={labelClass}>
              <span>Slug (fixed after creation)</span>
              <input
                value={area?.slug ?? ''}
                readOnly
                disabled
                className={`${inputClass} font-mono opacity-70`}
              />
            </label>
          )}

          <label className={labelClass}>
            <span>Name (English) *</span>
            <input
              name="name_en"
              required
              defaultValue={area?.name.en ?? ''}
              className={inputClass}
            />
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            <span>Description (English)</span>
            <textarea
              name="description_en"
              rows={4}
              defaultValue={area?.description.en ?? ''}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            <span>Sort order</span>
            <input
              name="sort_order"
              type="number"
              min="0"
              step="1"
              defaultValue={area?.sortOrder ?? 0}
              className={inputClass}
            />
          </label>

          <label className="flex items-center gap-2 text-small text-text-secondary">
            <input type="checkbox" name="is_active" defaultChecked={area ? area.isActive : true} />
            <span>Active (visible on the public site)</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface-card p-5">
        <legend className="px-1 font-display text-h3 text-text-primary">
          Representative image
        </legend>
        <p className="text-small text-text-secondary">
          One image for the area or community (e.g. a Dubai Marina skyline). JPEG, PNG, or WebP up
          to {MAX_MB}MB. {mode === 'edit' ? 'Uploading a new image replaces the current one.' : ''}
        </p>
        {area?.imageUrl && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={area.imageUrl}
              alt={`Current image for ${area.name.en || area.slug}`}
              className="aspect-video w-48 rounded-md object-cover"
            />
            <span className="text-caption uppercase tracking-widest text-text-secondary">
              Current image
            </span>
          </div>
        )}
        <label className={labelClass}>
          <span>{mode === 'edit' && area?.imageUrl ? 'Replace image' : 'Upload image'}</span>
          <input type="file" name="file" accept={ACCEPT} className="text-small text-text-primary" />
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-border-default bg-surface-card px-5 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
        >
          {busy ? 'Saving…' : mode === 'create' ? 'Create area' : 'Save changes'}
        </button>
        {mode === 'edit' && (
          <span className="text-caption uppercase tracking-widest text-text-secondary">
            Slug is fixed after creation.
          </span>
        )}
      </div>
    </form>
  )
}
