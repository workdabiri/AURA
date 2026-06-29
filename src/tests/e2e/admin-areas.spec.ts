import { expect, test } from '@playwright/test'

/**
 * AURA-305 — admin areas E2E.
 *
 * The unauthenticated guard checks run UNCONDITIONALLY (the admin area pages live under the
 * `(protected)` group, so they must redirect to `/admin/login` — RBAC.md). The authenticated
 * create/edit/deactivate flow needs a seeded admin (email + password) + DB, which CI does not
 * have, so it is gated behind ADMIN_E2E_EMAIL / ADMIN_E2E_PASSWORD and skipped otherwise — CI
 * never depends on secrets it lacks (same pattern as admin-properties.spec.ts).
 */

const SAMPLE_UUID = '0d000000-0000-0000-0000-000000000001'

test.describe('admin area pages are guarded (unauthenticated → login)', () => {
  test('/admin/areas redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/areas')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
    await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
  })

  test('/admin/areas/new redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/areas/new')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
  })

  test('/admin/areas/[id]/edit redirects to /admin/login', async ({ page }) => {
    await page.goto(`/admin/areas/${SAMPLE_UUID}/edit`)
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
  })
})

test.describe('authenticated admin area flow (gated — requires a seeded admin)', () => {
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

  test('the areas list renders behind the guard', async ({ page }) => {
    await page.goto('/admin/areas')
    await expect(page.getByRole('heading', { level: 1, name: /areas/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /new area/i })).toBeVisible()
  })

  test('create an area, then land on its edit screen', async ({ page }) => {
    const slug = `e2e-area-${Date.now()}`
    await page.goto('/admin/areas/new')
    await page.locator('input[name="slug"]').fill(slug)
    await page.locator('input[name="name_en"]').fill('E2E Marina')
    await page.getByRole('button', { name: /create area/i }).click()

    await expect(page).toHaveURL(/\/admin\/areas\/[0-9a-f-]+\/edit$/)
    await expect(page.getByRole('heading', { level: 1, name: /edit area/i })).toBeVisible()
    // Slug is read-only on the edit screen (immutable after create).
    await expect(page.locator('input[readonly]')).toHaveValue(slug)
  })

  test('deactivate uses an inline confirmation step', async ({ page }) => {
    await page.goto('/admin/areas')
    const firstDeactivate = page.getByRole('button', { name: /^deactivate$/i }).first()
    await firstDeactivate.click()
    await expect(page.getByText(/deactivate this area\?/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^confirm$/i })).toBeVisible()
  })
})
