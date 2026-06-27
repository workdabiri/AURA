'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'

import {
  FURNISHING_STATUSES,
  PRICE_VISIBILITIES,
  RENTAL_PERIODS,
  type PublishStatus,
} from '@/domain/properties/admin'
import type { AdminPropertyDetailDTO } from '@/domain/properties/admin-view'
import type { PublishChecklistFailure } from '@/domain/properties/publish'
import {
  AVAILABILITY_STATUSES,
  MARKET_TYPES,
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
} from '@/domain/properties/query'

/**
 * Admin property create/edit form — AURA-303 (client component).
 *
 * Pages, not modals. Reuses the admin shell from its parent page. Submits plain `fetch`
 * requests to the role-guarded `/api/admin/properties*` routes — NO Supabase / DAL / services
 * import (the routes own auth + RLS + audit). Field option lists come from the pure domain
 * taxonomy (D-36). Slug + reference number are server-managed and never edited here (A-06 /
 * D-47). Media upload is out of scope (AURA-304) — this form only edits property fields.
 *
 * D-44 states handled: validation (field issues + publish checklist), error (request failure),
 * success, and a busy/loading state on every submit.
 */

type Mode = 'create' | 'edit'

interface ValidationIssue {
  path: (string | number)[]
  message: string
}

function strOrNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function numOrNull(value: FormDataEntryValue | null): number | null {
  const s = strOrNull(value)
  if (s == null) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Build the JSON payload the API expects from the form's current values. */
function buildPayload(
  form: HTMLFormElement,
  mode: Mode,
  marketType: string
): Record<string, unknown> {
  const fd = new FormData(form)
  const titleEn = String(fd.get('title_en') ?? '').trim()
  const descEn = String(fd.get('description_en') ?? '').trim()
  const amenities = String(fd.get('amenities') ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a.length > 0)

  const isOffPlan = marketType === 'off_plan'

  const payload: Record<string, unknown> = {
    title: { en: titleEn },
    description: descEn ? { en: descEn } : undefined,
    transaction_type: fd.get('transaction_type'),
    market_type: fd.get('market_type'),
    property_type: fd.get('property_type'),
    availability_status: fd.get('availability_status'),
    price_visibility: fd.get('price_visibility'),
    rental_period: strOrNull(fd.get('rental_period')),
    furnishing_status: fd.get('furnishing_status'),
    price: numOrNull(fd.get('price')),
    location_label: String(fd.get('location_label') ?? '').trim(),
    community: strOrNull(fd.get('community')),
    sub_community: strOrNull(fd.get('sub_community')),
    building_name: strOrNull(fd.get('building_name')),
    address: strOrNull(fd.get('address')),
    external_map_url: strOrNull(fd.get('external_map_url')),
    bedrooms: numOrNull(fd.get('bedrooms')),
    bathrooms: numOrNull(fd.get('bathrooms')),
    parking: numOrNull(fd.get('parking')),
    size_sqft: numOrNull(fd.get('size_sqft')),
    size_sqm: numOrNull(fd.get('size_sqm')),
    amenities,
    rera_number: strOrNull(fd.get('rera_number')),
    permit_number: strOrNull(fd.get('permit_number')),
    agent_name: strOrNull(fd.get('agent_name')),
    agent_phone: strOrNull(fd.get('agent_phone')),
    agent_whatsapp: strOrNull(fd.get('agent_whatsapp')),
    agent_email: strOrNull(fd.get('agent_email')),
    // Off-plan fields are only sent (and only allowed) when market_type is off_plan (D-36);
    // otherwise they are explicitly cleared to null.
    developer_name: isOffPlan ? strOrNull(fd.get('developer_name')) : null,
    handover_date: isOffPlan ? strOrNull(fd.get('handover_date')) : null,
    completion_percentage: isOffPlan ? numOrNull(fd.get('completion_percentage')) : null,
    down_payment_amount: isOffPlan ? numOrNull(fd.get('down_payment_amount')) : null,
    payment_plan_summary: isOffPlan ? strOrNull(fd.get('payment_plan_summary')) : null,
    is_featured: fd.get('is_featured') === 'on',
  }

  if (mode === 'create') {
    const ref = strOrNull(fd.get('reference_number'))
    if (ref) payload.reference_number = ref
  }

  return payload
}

// --- Small field primitives ------------------------------------------------------

const inputClass =
  'w-full rounded-md border border-border-default bg-surface-page px-3 py-2 text-small text-text-primary'
const labelClass = 'flex flex-col gap-1 text-small text-text-secondary'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface-card p-5">
      <legend className="px-1 font-display text-h3 text-text-primary">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Options({ values }: { values: readonly string[] }) {
  return (
    <>
      {values.map((v) => (
        <option key={v} value={v}>
          {v.replace(/_/g, ' ')}
        </option>
      ))}
    </>
  )
}

// --- The form --------------------------------------------------------------------

export function PropertyForm({
  mode,
  property,
}: {
  mode: Mode
  property?: AdminPropertyDetailDTO
}) {
  const router = useRouter()
  const [marketType, setMarketType] = useState<string>(property?.market_type ?? 'ready')
  const [busy, setBusy] = useState(false)
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [checklist, setChecklist] = useState<PublishChecklistFailure[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const status: PublishStatus | null = property?.publish_status ?? null
  const canPublish = mode === 'edit' && status === 'draft'

  async function submit(form: HTMLFormElement, publishIntent: boolean) {
    setBusy(true)
    setIssues([])
    setChecklist([])
    setErrorMsg(null)
    setSuccessMsg(null)

    const payload = buildPayload(form, mode, marketType)
    if (publishIntent) payload.publish = true

    try {
      const url =
        mode === 'create' ? '/api/admin/properties' : `/api/admin/properties/${property!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const body = (await res.json().catch(() => ({}))) as {
        data?: { id?: string }
        code?: string
        issues?: ValidationIssue[]
        failures?: PublishChecklistFailure[]
      }

      if (res.ok) {
        if (mode === 'create' && body.data?.id) {
          router.push(`/admin/properties/${body.data.id}/edit`)
          return
        }
        setSuccessMsg(publishIntent ? 'Property published.' : 'Changes saved.')
        router.refresh()
        return
      }

      if (body.code === 'VALIDATION_ERROR' && body.issues) {
        setIssues(body.issues)
      } else if (body.code === 'PUBLISH_CHECKLIST' && body.failures) {
        setChecklist(body.failures)
      } else if (body.code === 'REFERENCE_CONFLICT') {
        setErrorMsg('That reference number is already in use. Choose another or leave it blank.')
      } else if (body.code === 'ARCHIVED') {
        setErrorMsg('Archived properties cannot be edited.')
      } else if (res.status === 401 || res.status === 403) {
        setErrorMsg('Your session is not authorized. Please sign in again.')
      } else {
        setErrorMsg('Could not save the property. Please try again.')
      }
    } catch {
      setErrorMsg('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const v = property

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit(e.currentTarget, false)
      }}
      className="flex flex-col gap-6"
      aria-busy={busy}
      noValidate
    >
      {(issues.length > 0 || checklist.length > 0 || errorMsg || successMsg) && (
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
          {checklist.length > 0 && (
            <div
              role="alert"
              className="rounded-md border border-border-default bg-surface-card px-4 py-3 text-small text-text-primary"
            >
              <p className="mb-1 font-medium">This property is not ready to publish:</p>
              <ul className="list-inside list-disc text-text-secondary">
                {checklist.map((f) => (
                  <li key={f.code}>{f.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Section title="Basics">
        <Field label="Title (English) *">
          <input name="title_en" required defaultValue={v?.title.en ?? ''} className={inputClass} />
        </Field>
        {mode === 'create' && (
          <Field label="Reference number (optional override)">
            <input name="reference_number" placeholder="AUTEX-00001" className={inputClass} />
          </Field>
        )}
        <label className={`${labelClass} sm:col-span-2`}>
          <span>Description (English)</span>
          <textarea
            name="description_en"
            rows={4}
            defaultValue={v?.description.en ?? ''}
            className={inputClass}
          />
        </label>
        <Field label="Transaction type *">
          <select
            name="transaction_type"
            defaultValue={v?.transaction_type ?? 'sale'}
            className={inputClass}
          >
            <Options values={TRANSACTION_TYPES} />
          </select>
        </Field>
        <Field label="Market type *">
          <select
            name="market_type"
            value={marketType}
            onChange={(e) => setMarketType(e.target.value)}
            className={inputClass}
          >
            <Options values={MARKET_TYPES} />
          </select>
        </Field>
        <Field label="Property type *">
          <select
            name="property_type"
            defaultValue={v?.property_type ?? 'apartment'}
            className={inputClass}
          >
            <Options values={PROPERTY_TYPES} />
          </select>
        </Field>
        <Field label="Availability status">
          <select
            name="availability_status"
            defaultValue={v?.availability_status ?? 'available'}
            className={inputClass}
          >
            <Options values={AVAILABILITY_STATUSES} />
          </select>
        </Field>
        <label className="flex items-center gap-2 text-small text-text-secondary">
          <input type="checkbox" name="is_featured" defaultChecked={v?.is_featured ?? false} />
          <span>Featured on homepage</span>
        </label>
      </Section>

      <Section title="Pricing (AED)">
        <Field label="Price visibility">
          <select
            name="price_visibility"
            defaultValue={v?.price_visibility ?? 'visible'}
            className={inputClass}
          >
            <Options values={PRICE_VISIBILITIES} />
          </select>
        </Field>
        <Field label="Price (AED)">
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={v?.price ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Rental period (for rentals)">
          <select name="rental_period" defaultValue={v?.rental_period ?? ''} className={inputClass}>
            <option value="">—</option>
            <Options values={RENTAL_PERIODS} />
          </select>
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Location label *">
          <input
            name="location_label"
            required
            defaultValue={v?.location_label ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Community">
          <input name="community" defaultValue={v?.community ?? ''} className={inputClass} />
        </Field>
        <Field label="Sub-community">
          <input
            name="sub_community"
            defaultValue={v?.sub_community ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Building name">
          <input
            name="building_name"
            defaultValue={v?.building_name ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Address (internal)">
          <input name="address" defaultValue={v?.address ?? ''} className={inputClass} />
        </Field>
        <Field label="External map URL">
          <input
            name="external_map_url"
            defaultValue={v?.external_map_url ?? ''}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Specifications">
        <Field label="Bedrooms (required for residential)">
          <input
            name="bedrooms"
            type="number"
            min="0"
            step="1"
            defaultValue={v?.bedrooms ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Bathrooms">
          <input
            name="bathrooms"
            type="number"
            min="0"
            step="1"
            defaultValue={v?.bathrooms ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Parking">
          <input
            name="parking"
            type="number"
            min="0"
            step="1"
            defaultValue={v?.parking ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Size (sqft) *">
          <input
            name="size_sqft"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={v?.size_sqft ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Size (sqm)">
          <input
            name="size_sqm"
            type="number"
            min="0"
            step="1"
            defaultValue={v?.size_sqm ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Furnishing status">
          <select
            name="furnishing_status"
            defaultValue={v?.furnishing_status ?? 'unknown'}
            className={inputClass}
          >
            <Options values={FURNISHING_STATUSES} />
          </select>
        </Field>
        <label className={`${labelClass} sm:col-span-2`}>
          <span>Amenities (comma-separated)</span>
          <input
            name="amenities"
            defaultValue={(v?.amenities ?? []).join(', ')}
            className={inputClass}
          />
        </label>
      </Section>

      <Section title="Compliance">
        <Field label="RERA number">
          <input name="rera_number" defaultValue={v?.rera_number ?? ''} className={inputClass} />
        </Field>
        <Field label="Permit number">
          <input
            name="permit_number"
            defaultValue={v?.permit_number ?? ''}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Contact override (optional)">
        <Field label="Agent name">
          <input name="agent_name" defaultValue={v?.agent_name ?? ''} className={inputClass} />
        </Field>
        <Field label="Agent phone">
          <input name="agent_phone" defaultValue={v?.agent_phone ?? ''} className={inputClass} />
        </Field>
        <Field label="Agent WhatsApp">
          <input
            name="agent_whatsapp"
            defaultValue={v?.agent_whatsapp ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Agent email">
          <input
            name="agent_email"
            type="email"
            defaultValue={v?.agent_email ?? ''}
            className={inputClass}
          />
        </Field>
      </Section>

      {marketType === 'off_plan' && (
        <Section title="Off-plan details">
          <Field label="Developer name">
            <input
              name="developer_name"
              defaultValue={v?.developer_name ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Handover date (YYYY-MM-DD)">
            <input
              name="handover_date"
              placeholder="2027-06-30"
              defaultValue={v?.handover_date ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Completion %">
            <input
              name="completion_percentage"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={v?.completion_percentage ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Down payment (AED)">
            <input
              name="down_payment_amount"
              type="number"
              min="0"
              step="1"
              defaultValue={v?.down_payment_amount ?? ''}
              className={inputClass}
            />
          </Field>
          <label className={`${labelClass} sm:col-span-2`}>
            <span>Payment plan summary</span>
            <textarea
              name="payment_plan_summary"
              rows={3}
              defaultValue={v?.payment_plan_summary ?? ''}
              className={inputClass}
            />
          </label>
        </Section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-border-default bg-surface-card px-5 py-2.5 text-small font-medium text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
        >
          {busy ? 'Saving…' : mode === 'create' ? 'Create draft' : 'Save changes'}
        </button>
        {canPublish && (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              const form = e.currentTarget.form
              if (form) void submit(form, true)
            }}
            className="rounded-md border border-brand-accent/60 bg-surface-card px-5 py-2.5 text-small font-medium text-brand-accent transition-colors hover:bg-surface-overlay disabled:opacity-50"
          >
            {busy ? 'Publishing…' : 'Save & publish'}
          </button>
        )}
        {mode === 'edit' && (
          <span className="text-caption uppercase tracking-widest text-text-secondary">
            Slug and reference number are fixed after creation.
          </span>
        )}
      </div>
    </form>
  )
}
