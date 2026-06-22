/**
 * AURA-202 — public price/display formatting (pure domain logic).
 *
 * AED-only display in MVP, no FX conversion (A-11). Price-on-application rendering (D-48).
 * PURE TypeScript: NO React, NO Supabase, NO I/O. Business rules live here, not in JSX
 * (architecture rule), so the card component stays presentational and node-testable.
 */

import type { PropertyCardDTO } from '@/domain/properties/card'

/** Stable currency code for MVP (AED only, A-11). */
const DISPLAY_CURRENCY = 'AED'

/** Discriminated result so the UI can choose markup without re-deriving the rule. */
type PriceDisplay =
  | { kind: 'on_application' }
  | { kind: 'amount'; currency: string; amount: number; formatted: string }

/**
 * Group a non-negative integer-ish amount with thousands separators (e.g. 1234567 →
 * "1,234,567"). Uses a fixed `en-US`-style grouping so output is deterministic across
 * runtimes/locales (we render the AED code ourselves; no locale currency symbol).
 */
export function formatAedAmount(amount: number): string {
  const rounded = Math.round(amount)
  const isNegative = rounded < 0
  const digits = Math.abs(rounded).toString()
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return isNegative ? `-${grouped}` : grouped
}

/**
 * Resolve how a card's price should be displayed:
 *   - `price_on_application` (D-48), or a missing price → on-application;
 *   - otherwise an AED amount (A-11), formatted "AED 1,234,567".
 */
export function resolvePriceDisplay(
  card: Pick<PropertyCardDTO, 'price' | 'priceVisibility' | 'currency'>
): PriceDisplay {
  if (card.priceVisibility === 'price_on_application' || card.price === null) {
    return { kind: 'on_application' }
  }

  const currency = card.currency || DISPLAY_CURRENCY
  return {
    kind: 'amount',
    currency,
    amount: card.price,
    formatted: `${currency} ${formatAedAmount(card.price)}`,
  }
}
