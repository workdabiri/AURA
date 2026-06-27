import { expect, test } from '@playwright/test'

/**
 * AURA-301 — admin login + guard E2E.
 *
 * Proves the admin access boundary end-to-end: the login page is login-only and
 * non-localized, and the role guard cannot be bypassed by navigating straight to a
 * protected route. The full successful-login flow needs a seeded admin (email + password)
 * which is NOT available in default CI, so it is gated behind explicit env vars
 * (ADMIN_E2E_EMAIL / ADMIN_E2E_PASSWORD) and skipped otherwise — CI never depends on
 * secrets it does not have. The unauthenticated redirect + no-signup guarantees run
 * unconditionally (and are also covered in the required smoke spec).
 */

test.describe('admin login page', () => {
  test('renders a login-only form: no signup, no password reset', async ({ page }) => {
    await page.goto('/admin/login')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()

    // No self-registration or recovery affordances anywhere on the page (D-40 / scope).
    await expect(page.getByRole('link', { name: /sign ?up|register|create account/i })).toHaveCount(
      0
    )
    await expect(page.getByText(/forgot|reset password/i)).toHaveCount(0)
  })

  test('stays at /admin/login (not locale-prefixed)', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page).toHaveURL(/\/admin\/login$/)
  })
})

test.describe('admin guard cannot be bypassed', () => {
  test('direct navigation to /admin while unauthenticated → /admin/login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
    // The protected landing copy must not have rendered.
    await expect(page.getByText(/signed in to the AUTEX/i)).toHaveCount(0)
  })
})

test.describe('successful admin login (gated — requires a seeded admin)', () => {
  const email = process.env.ADMIN_E2E_EMAIL
  const password = process.env.ADMIN_E2E_PASSWORD

  test.skip(!email || !password, 'Set ADMIN_E2E_EMAIL and ADMIN_E2E_PASSWORD to run')

  test('a seeded admin can sign in and reach /admin', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('input[name="email"]').fill(email!)
    await page.locator('input[name="password"]').fill(password!)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByText(/signed in to the AUTEX/i)).toBeVisible()
  })
})
