'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_BYTES,
  MEDIA_TYPES,
  type AdminMediaDTO,
  type MediaType,
} from '@/domain/properties/media'

/**
 * Admin property media manager — AURA-304 (client component).
 *
 * Single-file upload + per-item alt-text / cover editing + delete-with-confirm. Submits plain
 * `fetch` to the role-guarded `/api/admin/properties/[id]/media*` routes — NO Supabase / DAL /
 * services / storage import (the routes own auth + RLS + storage). Out of scope (AURA-304):
 * multi-file upload, drag/drop, manual reorder, signed-URL UI.
 *
 * D-44 states: empty, loading/busy, success, error, validation, and unauthorized/forbidden.
 */

const ACCEPT = ALLOWED_MEDIA_MIME_TYPES.join(',')
const MAX_MB = Math.round(MAX_MEDIA_BYTES / (1024 * 1024))

type ApiError = { error?: string; code?: string; issues?: { message: string }[] }

/** Map a non-OK response to a single user-facing message (no internal detail). */
async function readError(res: Response): Promise<string> {
  if (res.status === 401 || res.status === 403) {
    return 'Your session is not authorized. Please sign in again.'
  }
  const body = (await res.json().catch(() => ({}))) as ApiError
  if (body.code === 'UNSUPPORTED_TYPE') return 'Unsupported file type. Use JPEG, PNG, or WebP.'
  if (body.code === 'FILE_TOO_LARGE') return `File is too large. The limit is ${MAX_MB}MB.`
  if (body.code === 'NOT_COVER_ELIGIBLE') return 'Only an image can be set as the cover.'
  if (body.code === 'ARCHIVED') return 'Archived properties cannot be edited.'
  if (body.code === 'VALIDATION_ERROR') {
    return body.issues?.[0]?.message ?? 'Please check the media details and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export function PropertyMediaManager({
  propertyId,
  initialMedia,
  archived,
}: {
  propertyId: string
  initialMedia: AdminMediaDTO[]
  archived: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState<AdminMediaDTO[]>(initialMedia)
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function reset() {
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  async function handleUpload(form: HTMLFormElement) {
    reset()
    const fd = new FormData(form)
    // Floorplans can never be a cover — never submit is_cover for them.
    if (mediaType !== 'image') fd.delete('is_cover')

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/media`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        setErrorMsg(await readError(res))
        return
      }
      const body = (await res.json()) as { data: AdminMediaDTO }
      const created = body.data
      setItems((prev) => {
        const next = created.isCover ? prev.map((m) => ({ ...m, isCover: false })) : prev
        return [...next, created]
      })
      setSuccessMsg('Media uploaded.')
      form.reset()
      setMediaType('image')
      router.refresh()
    } catch {
      setErrorMsg('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function patchMedia(mediaId: string, payload: Record<string, unknown>, okMsg: string) {
    reset()
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        setErrorMsg(await readError(res))
        return
      }
      const body = (await res.json()) as { data: AdminMediaDTO }
      const updated = body.data
      setItems((prev) =>
        prev.map((m) =>
          m.id === updated.id ? updated : updated.isCover ? { ...m, isCover: false } : m
        )
      )
      setSuccessMsg(okMsg)
      router.refresh()
    } catch {
      setErrorMsg('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteMedia(mediaId: string) {
    reset()
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/media/${mediaId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setErrorMsg(await readError(res))
        return
      }
      setItems((prev) => prev.filter((m) => m.id !== mediaId))
      setConfirmId(null)
      setSuccessMsg('Media removed.')
      router.refresh()
    } catch {
      setErrorMsg('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-5" aria-busy={busy}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-h3 text-text-primary">Media</h2>
        <p className="text-small text-text-secondary">
          JPEG, PNG, or WebP up to {MAX_MB}MB. One image must be the cover (with alt text) before
          the property can be published.
        </p>
      </div>

      {(errorMsg || successMsg) && (
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
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
        </div>
      )}

      {archived ? (
        <p className="rounded-md border border-border-default bg-surface-card px-4 py-3 text-small text-text-secondary">
          This property is archived. Media cannot be changed.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleUpload(e.currentTarget)
          }}
          className="grid gap-4 rounded-lg border border-border-default bg-surface-card p-5 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-small text-text-secondary">
            <span>File *</span>
            <input
              type="file"
              name="file"
              required
              accept={ACCEPT}
              className="text-small text-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-small text-text-secondary">
            <span>Media type *</span>
            <select
              name="media_type"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as MediaType)}
              className="w-full rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary"
            >
              {MEDIA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-small text-text-secondary sm:col-span-2">
            <span>Alt text *</span>
            <input
              name="alt_text"
              required
              maxLength={300}
              className="w-full rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary"
            />
          </label>
          {mediaType === 'image' && (
            <label className="flex items-center gap-2 text-small text-text-secondary sm:col-span-2">
              <input type="checkbox" name="is_cover" value="true" />
              <span>Set as cover image</span>
            </label>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md border border-border-default bg-surface-card px-5 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
            >
              {busy ? 'Uploading…' : 'Upload media'}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-default bg-surface-card px-4 py-8 text-center text-small text-text-secondary">
          No media yet. Upload an image and set it as the cover to enable publishing.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-card p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.altText}
                className="aspect-video w-full rounded-md object-cover"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border-default px-2 py-0.5 text-caption uppercase tracking-widest text-text-secondary">
                  {m.mediaType}
                </span>
                {m.isCover && (
                  <span className="rounded-full border border-brand-accent/60 px-2 py-0.5 text-caption uppercase tracking-widest text-brand-accent">
                    Cover
                  </span>
                )}
              </div>
              <p className="text-small text-text-secondary">{m.altText}</p>

              {!archived && (
                <div className="mt-auto flex flex-wrap gap-2">
                  {m.mediaType === 'image' && !m.isCover && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patchMedia(m.id, { is_cover: true }, 'Cover updated.')}
                      className="rounded-md border border-border-default px-3 py-1.5 text-caption text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
                    >
                      Set as cover
                    </button>
                  )}
                  {confirmId === m.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-caption text-text-secondary">Remove this media?</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void deleteMedia(m.id)}
                        className="rounded-md border border-border-default px-3 py-1.5 text-caption text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmId(null)}
                        className="text-caption text-text-secondary underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        reset()
                        setConfirmId(m.id)
                      }}
                      className="rounded-md border border-border-default px-3 py-1.5 text-caption text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
