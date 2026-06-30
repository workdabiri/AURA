import { expect, test } from '@playwright/test'

/**
 * AURA-307 — admin legal E2E.
 *
 * The unauthenticated guard checks run UNCONDITIONALLY (the admin legal pages live under the
 * `(protected)` group, so they must redirect to `/admin/login` — RBAC.md). The authenticated
 * create/publish/archive flow needs a seeded admin (email + password) + DB, which CI does not
 * have, so it is gated behind ADMIN_E2E_EMAIL / ADMIN_E2E_PASSWORD and skipped otherwise (same
 * pattern as admin-areas.spec.ts). The public published-only boundary is also re-checked.
 */

const SAMPLE_UUID = '0e000000-0000-0000-0000-000000000001'

test.describe('admin legal pages are guarded (unauthenticated → login)', () => {
  test('/admin/legal redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/legal')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
    await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
  })

  test('/admin/legal/new redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/legal/new')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
  })

  test('/admin/legal/[id]/edit redirects to /admin/login', async ({ page }) => {
    await page.goto(`/admin/legal/${SAMPLE_UUID}/edit`)
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
  })
})

test.describe('public legal pages remain published-only (regression)', () => {
  test('an unknown legal slug 404s and never leaks admin content', async ({ page }) => {
    const res = await page.goto('/en/cookies')
    expect(res?.status()).toBe(404)
  })
})

test.describe('authenticated admin legal flow (gated — requires a seeded admin)', () => {
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

  test('the legal list renders behind the guard', async ({ page }) => {
    await page.goto('/admin/legal')
    await expect(page.getByRole('heading', { level: 1, name: /legal/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /new draft/i })).toBeVisible()
  })

  test('create a draft, then land on its edit screen', async ({ page }) => {
    await page.goto('/admin/legal/new')
    await page.locator('select[name="slug"]').selectOption('privacy')
    await page.locator('input[name="title"]').fill('Privacy Policy (E2E)')
    await page.locator('textarea[name="content"]').fill('# Privacy\n\nWe respect your data.')
    await page.getByRole('button', { name: /create draft/i }).click()

    await expect(page).toHaveURL(/\/admin\/legal\/[0-9a-f-]+\/edit$/)
    await expect(page.getByRole('heading', { level: 1, name: /edit legal page/i })).toBeVisible()
  })

  test('publish uses an inline confirmation step', async ({ page }) => {
    await page.goto('/admin/legal')
    const firstPublish = page.getByRole('button', { name: /^publish$/i }).first()
    await firstPublish.click()
    await expect(page.getByText(/publish this version\?/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^confirm$/i })).toBeVisible()
  })

  test('archive uses an inline confirmation step', async ({ page }) => {
    await page.goto('/admin/legal')
    const firstArchive = page.getByRole('button', { name: /^archive$/i }).first()
    await firstArchive.click()
    await expect(page.getByText(/archive this version\?/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^confirm$/i })).toBeVisible()
  })
})
