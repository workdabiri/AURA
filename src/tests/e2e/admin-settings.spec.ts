import { expect, test } from '@playwright/test'

/**
 * AURA-306 — admin settings E2E.
 *
 * The unauthenticated guard check runs UNCONDITIONALLY (the admin settings page lives under the
 * `(protected)` group, so it must redirect to `/admin/login` — RBAC.md). The authenticated
 * edit-and-reflect flow needs a seeded admin (email + password) + DB, which CI does not have, so
 * it is gated behind ADMIN_E2E_EMAIL / ADMIN_E2E_PASSWORD and skipped otherwise — CI never depends
 * on secrets it lacks (same pattern as admin-areas.spec.ts).
 */

test.describe('admin settings page is guarded (unauthenticated → login)', () => {
  test('/admin/settings redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
    await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
  })
})

test.describe('authenticated admin settings flow (gated — requires a seeded admin)', () => {
  const email = process.env.ADMIN_E2E_EMAIL
  const password = process.env.ADMIN_E2E_PASSWORD

  test.skip(!email || !password, 'Set ADMIN_E2E_EMAIL and ADMIN_E2E_PASSWORD to run')

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('input[name="email"]').fill(email!)
    await page.locator('input[name="password"]').fill(password!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/dashboard$/)
  })

  test('the settings form renders behind the guard', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { level: 1, name: /settings/i })).toBeVisible()
    await expect(page.locator('input[name="agency_name"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible()
  })

  test('editing the footer tagline saves and is reflected on the public footer', async ({
    page,
  }) => {
    const tagline = `E2E tagline ${Date.now()}`
    await page.goto('/admin/settings')
    await page.locator('input[name="footer_tagline"]').fill(tagline)
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByText(/settings saved/i)).toBeVisible()

    // The public layout is force-dynamic and reads settings per request — no revalidation needed.
    await page.goto('/en')
    await expect(page.getByRole('contentinfo').getByText(tagline)).toBeVisible()
  })
})
