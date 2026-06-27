import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { ADMIN_NAV_ITEMS, AdminNav } from '@/components/admin/AdminNav'
import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel'
import { AdminShell } from '@/components/admin/AdminShell'

/**
 * AURA-302 — admin dashboard shell (presentational, CI-safe).
 *
 * These render the static shell to markup in the node test env (no browser, no seeded
 * admin needed) and assert the shell structure the gated e2e cannot prove in CI:
 * one `<main>` landmark, a labelled nav with links to every future admin section, and
 * placeholder panels that never imply live data.
 */

const FUTURE_SECTIONS = [
  '/admin/properties',
  '/admin/leads',
  '/admin/areas',
  '/admin/settings',
  '/admin/legal',
] as const

describe('admin shell — structure (AURA-302)', () => {
  test('AdminShell renders exactly one <main> landmark wrapping its children', () => {
    const html = renderToStaticMarkup(
      <AdminShell>
        <h1>Dashboard</h1>
      </AdminShell>
    )
    expect(html.match(/<main\b/g) ?? []).toHaveLength(1)
    expect(html).toContain('<h1>Dashboard</h1>')
  })

  test('AdminNav is a labelled <nav> linking to every future admin section', () => {
    const html = renderToStaticMarkup(<AdminNav />)
    expect(html).toMatch(/<nav[^>]*aria-label="Admin"/)
    for (const href of FUTURE_SECTIONS) {
      expect(html, href).toContain(`href="${href}"`)
    }
  })

  test('ADMIN_NAV_ITEMS exposes the dashboard plus the five future sections', () => {
    const hrefs = ADMIN_NAV_ITEMS.map((item) => item.href)
    expect(hrefs).toContain('/admin/dashboard')
    for (const href of FUTURE_SECTIONS) {
      expect(hrefs).toContain(href)
    }
  })

  test('AdminPlaceholderPanel shows a not-yet-available badge and no data', () => {
    const html = renderToStaticMarkup(
      <AdminPlaceholderPanel title="Properties" description="Create, edit, publish listings." />
    )
    expect(html).toContain('Properties')
    expect(html).toMatch(/coming soon/i)
  })
})
