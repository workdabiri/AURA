'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { PublicSettings, SocialLinks } from '@/domain/settings'

/**
 * Admin settings form — AURA-306 (client component).
 *
 * Pages, not modals. Submits a JSON `fetch` to the role-guarded `PATCH /api/admin/settings` —
 * NO Supabase / DAL / services / storage import (the route owns auth + RLS + audit). The seven
 * editable keys are the existing public footer keys; deferred keys (logo/SEO/legal/trust) are not
 * present here.
 *
 * PARTIAL BATCH: only the keys whose values actually CHANGED from the loaded settings are sent, so
 * the route's `settings_updated` audit records exactly the changed key names. Scalar fields cannot
 * be cleared to empty (the per-key schema requires non-empty), so a blank scalar input is treated
 * as "no change". Social links are sent as a whole object (omitting a platform clears it).
 *
 * D-44 states handled: validation (field issues), error (request failure), success, busy/loading,
 * and a friendly "no changes" message when nothing was edited.
 */

interface ValidationIssue {
  path: (string | number)[]
  message: string
}

const SOCIAL_PLATFORMS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/…' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/…' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@…' },
  { key: 'x', label: 'X', placeholder: 'https://x.com/…' },
]

const inputClass =
  'w-full rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary'
const labelClass = 'flex flex-col gap-1 text-small text-text-secondary'

/** Stable JSON for social-link comparison (sorted keys, empty values dropped). */
function normalizeSocial(social: Record<string, string>): string {
  const clean: Record<string, string> = {}
  for (const key of Object.keys(social).sort()) {
    const v = social[key]?.trim()
    if (v) clean[key] = v
  }
  return JSON.stringify(clean)
}

export function SettingsForm({ settings }: { settings: PublicSettings }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  async function submit(form: HTMLFormElement) {
    setBusy(true)
    setIssues([])
    setErrorMsg(null)
    setSuccessMsg(null)
    setInfoMsg(null)

    const source = new FormData(form)
    const read = (name: string) => String(source.get(name) ?? '').trim()

    // Build a partial patch with ONLY the changed keys. Scalars can't be cleared to empty, so a
    // blank input that was already empty/unset is simply not sent.
    const body: Record<string, unknown> = {}
    const scalars: { key: string; field: string; initial: string }[] = [
      { key: 'agency_name', field: 'agency_name', initial: settings.agencyName },
      { key: 'footer_tagline', field: 'footer_tagline', initial: settings.footerTagline },
      { key: 'agency_address', field: 'agency_address', initial: settings.agencyAddress },
      { key: 'agency_phone', field: 'agency_phone', initial: settings.agencyPhone ?? '' },
      { key: 'agency_whatsapp', field: 'agency_whatsapp', initial: settings.agencyWhatsapp ?? '' },
      { key: 'agency_email', field: 'agency_email', initial: settings.agencyEmail ?? '' },
    ]
    for (const { key, field, initial } of scalars) {
      const value = read(field)
      if (value !== '' && value !== initial) body[key] = value
    }

    // Social links: build the whole object from the non-empty platform inputs; send it only when
    // it differs from the loaded value (so adding/changing/removing a link is one batched change).
    const social: Record<string, string> = {}
    for (const { key } of SOCIAL_PLATFORMS) {
      const value = read(`social_${key}`)
      if (value !== '') social[key] = value
    }
    const initialSocial = settings.socialLinks as Record<string, string>
    if (normalizeSocial(social) !== normalizeSocial(initialSocial)) {
      body.social_links = social
    }

    if (Object.keys(body).length === 0) {
      setInfoMsg('No changes to save.')
      setBusy(false)
      return
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const payload = (await res.json().catch(() => ({}))) as {
        code?: string
        issues?: ValidationIssue[]
      }

      if (res.ok) {
        setSuccessMsg('Settings saved.')
        router.refresh()
        return
      }

      if (payload.code === 'VALIDATION_ERROR' && payload.issues) {
        setIssues(payload.issues)
      } else if (payload.code === 'VALIDATION_ERROR') {
        setErrorMsg('Please correct the highlighted fields and try again.')
      } else if (res.status === 401 || res.status === 403) {
        setErrorMsg('Your session is not authorized. Please sign in again.')
      } else {
        setErrorMsg('Could not save the settings. Please try again.')
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
      {(issues.length > 0 || errorMsg || successMsg || infoMsg) && (
        <div className="flex flex-col gap-2" role="status" aria-live="polite">
          {successMsg && (
            <p className="rounded-md border border-brand-accent/50 bg-surface-card px-4 py-3 text-small text-brand-accent">
              {successMsg}
            </p>
          )}
          {infoMsg && (
            <p className="rounded-md border border-border-default bg-surface-card px-4 py-3 text-small text-text-secondary">
              {infoMsg}
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
        <legend className="px-1 font-display text-h3 text-text-primary">Agency</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span>Agency name *</span>
            <input name="agency_name" defaultValue={settings.agencyName} className={inputClass} />
          </label>

          <label className={labelClass}>
            <span>Footer tagline *</span>
            <input
              name="footer_tagline"
              defaultValue={settings.footerTagline}
              className={inputClass}
            />
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            <span>Address *</span>
            <textarea
              name="agency_address"
              rows={2}
              defaultValue={settings.agencyAddress}
              className={inputClass}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface-card p-5">
        <legend className="px-1 font-display text-h3 text-text-primary">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span>Phone</span>
            <input
              name="agency_phone"
              defaultValue={settings.agencyPhone ?? ''}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            <span>WhatsApp</span>
            <input
              name="agency_whatsapp"
              defaultValue={settings.agencyWhatsapp ?? ''}
              className={inputClass}
            />
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            <span>Email</span>
            <input
              name="agency_email"
              type="email"
              defaultValue={settings.agencyEmail ?? ''}
              className={inputClass}
            />
          </label>
        </div>
        <p className="text-caption text-text-secondary">
          Leave a contact field blank to keep its current value — fields cannot be cleared here.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface-card p-5">
        <legend className="px-1 font-display text-h3 text-text-primary">Social links</legend>
        <p className="text-small text-text-secondary">
          Full URLs only. Clearing a field removes that link from the footer.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
            <label key={key} className={labelClass}>
              <span>{label}</span>
              <input
                name={`social_${key}`}
                type="url"
                placeholder={placeholder}
                defaultValue={settings.socialLinks[key] ?? ''}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-border-default bg-surface-card px-5 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
