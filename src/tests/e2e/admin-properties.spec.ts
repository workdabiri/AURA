import { expect, test } from '@playwright/test'

/**
 * AURA-303 — admin property CRUD E2E.
 *
 * The unauthenticated guard checks run UNCONDITIONALLY (the admin property pages live under the
 * `(protected)` group, so they must redirect to `/admin/login` — RBAC.md). The authenticated
 * create/publish/archive flow needs a seeded admin (email + password) + DB, which CI does not
 * have, so it is gated behind ADMIN_E2E_EMAIL / ADMIN_E2E_PASSWORD and skipped otherwise — CI
 * never depends on secrets it lacks (same pattern as admin-login.spec.ts).
 */

const SAMPLE_UUID = '0b000000-0000-0000-0000-00000000000a'

test.describe('admin property pages are guarded (unauthenticated → login)', () => {
  test('/admin/properties redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/properties')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
    await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
  })

  test('/admin/properties/new redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/properties/new')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
  })

  test('/admin/properties/[id]/edit redirects to /admin/login', async ({ page }) => {
    await page.goto(`/admin/properties/${SAMPLE_UUID}/edit`)
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
  })
})

test.describe('authenticated admin property flow (gated — requires a seeded admin)', () => {
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

  test('the properties list renders behind the guard', async ({ page }) => {
    await page.goto('/admin/properties')
    await expect(page.getByRole('heading', { level: 1, name: /properties/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /new property/i })).toBeVisible()
  })

  test('create a draft, then a blocked publish shows the checklist', async ({ page }) => {
    await page.goto('/admin/properties/new')
    await page.locator('input[name="title_en"]').fill('E2E Draft Apartment')
    await page.locator('input[name="location_label"]').fill('Dubai Marina')
    await page.locator('input[name="size_sqft"]').fill('1200')
    await page.getByRole('button', { name: /create draft/i }).click()

    // Lands on the edit screen for the new draft.
    await expect(page).toHaveURL(/\/admin\/properties\/[0-9a-f-]+\/edit$/)
    await expect(page.getByRole('heading', { level: 1, name: /edit property/i })).toBeVisible()

    // Publishing is blocked until a cover image with alt text exists (media is AURA-304).
    await page.getByRole('button', { name: /save & publish/i }).click()
    await expect(page.getByText(/not ready to publish/i)).toBeVisible()
  })

  test('archive uses an inline confirmation step', async ({ page }) => {
    await page.goto('/admin/properties')
    const firstArchive = page.getByRole('button', { name: /^archive$/i }).first()
    await firstArchive.click()
    await expect(page.getByText(/archive this property\?/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^confirm$/i })).toBeVisible()
  })
})
