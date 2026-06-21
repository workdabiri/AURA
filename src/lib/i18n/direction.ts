/**
 * Locale text-direction helper — AURA-201 (RTL-ready, D-07).
 *
 * Pure and dependency-free. The MVP renders English only (`ltr`), but the RTL
 * locale set is pre-mapped so adding Arabic later flips `<html dir>` with no
 * structural change to the layout. This intentionally does NOT enable Arabic UI.
 */
const RTL_LOCALES = new Set<string>(['ar'])

type TextDirection = 'ltr' | 'rtl'

export function getLocaleDirection(locale: string): TextDirection {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'
}
