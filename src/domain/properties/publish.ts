/**
 * AURA-303 — property publish checklist (pure domain logic).
 *
 * Encodes the "Publish validation rules" from DATA_MODEL (§properties) + the AURA-303 task:
 * a property may move draft → published ONLY when every required field is complete and at
 * least one cover image with alt text exists. PURE TypeScript: NO React, NO Supabase, NO DAL,
 * NO I/O, NO `server-only`. Evaluated by the DAL/route at publish time against the MERGED
 * record (current row + pending patch) and a summary of the property's existing media rows.
 *
 * Media is NOT uploaded here (that is AURA-304) — the checklist only READS whether a valid
 * cover image already exists in `property_media`.
 *
 * Locked decisions: D-09 (bedrooms by type), D-36 (taxonomy + off-plan display), D-44 (the
 * UI renders these failures as a validation state), D-48 (price visibility).
 */

import {
  AVAILABILITY_STATUSES,
  MARKET_TYPES,
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
} from '@/domain/properties/query'
import { OFF_PLAN_FIELDS, PRICE_VISIBILITIES, RENTAL_PERIODS } from '@/domain/properties/admin'

/** Residential property types — `bedrooms` is required to publish these; office/plot/retail/
 * warehouse may stay null (D-09). */
const RESIDENTIAL_PROPERTY_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse'] as const

/** True when `bedrooms` must be present for this property type to publish (D-09). */
export function isResidentialType(propertyType: string): boolean {
  return (RESIDENTIAL_PROPERTY_TYPES as readonly string[]).includes(propertyType)
}

/** The merged property fields the checklist inspects (current row + pending patch). */
export interface PublishCandidate {
  title: unknown
  description: unknown
  transaction_type: string
  market_type: string
  property_type: string
  availability_status: string
  price_visibility: string
  rental_period: string | null
  price: number | null
  location_label: string | null
  bedrooms: number | null
  developer_name?: string | null
  handover_date?: string | null
  completion_percentage?: number | null
  down_payment_amount?: number | null
  payment_plan_summary?: string | null
}

/** Minimal media row shape the cover summary needs. */
export interface PublishMediaRow {
  media_type: string
  is_cover: boolean
  alt_text: string | null
}

/** Whether a usable cover image exists, and whether it has non-empty alt text. */
export interface CoverMediaSummary {
  hasImageCover: boolean
  coverAltTextPresent: boolean
}

/** One failed checklist item — a stable `code` + human message for the D-44 validation UI. */
export interface PublishChecklistFailure {
  code: string
  message: string
}

interface PublishChecklistResult {
  ok: boolean
  failures: PublishChecklistFailure[]
}

/** Extract the English string from an i18n JSONB value; '' when absent. */
function extractEn(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = (value as Record<string, unknown>).en
    if (typeof en === 'string') return en.trim()
  }
  return ''
}

/**
 * Summarise a property's media rows into the cover facts the checklist needs: an image (never
 * a floorplan) flagged `is_cover`, and whether that cover carries non-empty alt text.
 */
export function summarizeCoverMedia(media: readonly PublishMediaRow[]): CoverMediaSummary {
  const imageCovers = media.filter((m) => m.media_type === 'image' && m.is_cover)
  const hasImageCover = imageCovers.length > 0
  const coverAltTextPresent =
    hasImageCover &&
    imageCovers.some((m) => typeof m.alt_text === 'string' && m.alt_text.trim() !== '')
  return { hasImageCover, coverAltTextPresent }
}

/**
 * Evaluate the publish checklist against a merged candidate + its cover-media summary.
 * Returns `{ ok, failures }`; `ok` is true only when `failures` is empty.
 */
export function evaluatePublishChecklist(
  candidate: PublishCandidate,
  cover: CoverMediaSummary
): PublishChecklistResult {
  const failures: PublishChecklistFailure[] = []
  const fail = (code: string, message: string) => failures.push({ code, message })

  // --- Required English content ---
  if (extractEn(candidate.title) === '') {
    fail('title_en_required', 'An English title is required to publish.')
  }
  if (extractEn(candidate.description) === '') {
    fail('description_en_required', 'An English description is required to publish.')
  }
  if (!candidate.location_label || candidate.location_label.trim() === '') {
    fail('location_label_required', 'A location label is required to publish.')
  }

  // --- Taxonomy validity (belt-and-suspenders; the schema already constrains these) ---
  if (!(TRANSACTION_TYPES as readonly string[]).includes(candidate.transaction_type)) {
    fail('transaction_type_invalid', 'A valid transaction type is required.')
  }
  if (!(MARKET_TYPES as readonly string[]).includes(candidate.market_type)) {
    fail('market_type_invalid', 'A valid market type is required.')
  }
  if (!(PROPERTY_TYPES as readonly string[]).includes(candidate.property_type)) {
    fail('property_type_invalid', 'A valid property type is required.')
  }
  if (!(AVAILABILITY_STATUSES as readonly string[]).includes(candidate.availability_status)) {
    fail('availability_status_invalid', 'A valid availability status is required.')
  }
  if (!(PRICE_VISIBILITIES as readonly string[]).includes(candidate.price_visibility)) {
    fail('price_visibility_invalid', 'A valid price visibility is required.')
  }

  // --- Price rules (D-48) ---
  if (
    candidate.price_visibility === 'visible' &&
    (candidate.price === null || candidate.price === undefined)
  ) {
    fail('price_required_when_visible', 'A price is required when price visibility is "visible".')
  }

  // --- Rental period for a visibly-priced rental (Q-10) ---
  if (
    candidate.transaction_type === 'rent' &&
    candidate.price_visibility === 'visible' &&
    (candidate.rental_period === null ||
      candidate.rental_period === undefined ||
      !(RENTAL_PERIODS as readonly string[]).includes(candidate.rental_period))
  ) {
    fail('rental_period_required', 'A rental period is required for a visibly-priced rental.')
  }

  // --- Bedrooms by type (D-09) ---
  if (
    isResidentialType(candidate.property_type) &&
    (candidate.bedrooms === null || candidate.bedrooms === undefined)
  ) {
    fail('bedrooms_required_for_residential', 'Bedrooms are required for this property type.')
  }

  // --- Off-plan field consistency (D-36) ---
  if (candidate.market_type !== 'off_plan') {
    const present = OFF_PLAN_FIELDS.some((field) => {
      const v = (candidate as unknown as Record<string, unknown>)[field]
      return v !== undefined && v !== null && v !== ''
    })
    if (present) {
      fail(
        'off_plan_fields_not_allowed',
        'Off-plan fields are only allowed when the market type is off-plan.'
      )
    }
  }

  // --- Media: at least one cover image with alt text ---
  if (!cover.hasImageCover) {
    fail('cover_image_required', 'A cover image is required to publish.')
  } else if (!cover.coverAltTextPresent) {
    fail('cover_image_alt_text_required', 'The cover image requires alt text to publish.')
  }

  return { ok: failures.length === 0, failures }
}
