import { expect, test } from '@playwright/test'

/**
 * AURA-304 — admin property media E2E.
 *
 * The unauthenticated guard check runs UNCONDITIONALLY: the media API is admin-only, so an
 * anonymous request must be rejected (never 2xx). The authenticated upload → set-cover →
 * publishable → delete flow needs a seeded admin + a running storage stack, which CI lacks, so it
 * is gated behind ADMIN_E2E_EMAIL / ADMIN_E2E_PASSWORD and skipped otherwise (same pattern as the
 * other admin specs).
 */

const SAMPLE_UUID = '0b000000-0000-0000-0000-00000000000a'

// A tiny valid-enough PNG payload (header bytes); the route validates declared MIME + size.
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
])

test.describe('admin media surface is guarded (unauthenticated)', () => {
  test('the edit page (media manager) redirects to login', async ({ page }) => {
    await page.goto(`/admin/properties/${SAMPLE_UUID}/edit`)
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/)
  })

  test('an unauthenticated media upload is rejected (never 2xx)', async ({ request }) => {
    const res = await request.post(`/api/admin/properties/${SAMPLE_UUID}/media`, {
      multipart: {
        file: { name: 'x.png', mimeType: 'image/png', buffer: PNG_BYTES },
        media_type: 'image',
        alt_text: 'nope',
      },
    })
    expect(res.ok()).toBeFalsy()
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('authenticated admin media flow (gated — requires a seeded admin + storage)', () => {
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

  test('upload an image with alt, set it as cover, then make publish satisfiable', async ({
    page,
  }) => {
    // Create a fresh draft to work against.
    await page.goto('/admin/properties/new')
    await page.locator('input[name="title_en"]').fill('E2E Media Apartment')
    await page.locator('input[name="location_label"]').fill('Dubai Marina')
    await page.locator('input[name="size_sqft"]').fill('1200')
    await page.getByRole('button', { name: /create draft/i }).click()
    await expect(page).toHaveURL(/\/admin\/properties\/[0-9a-f-]+\/edit$/)

    // Empty state then upload one image with alt text, set as cover.
    await expect(page.getByText(/no media yet/i)).toBeVisible()
    await page.locator('input[name="file"]').setInputFiles({
      name: 'cover.png',
      mimeType: 'image/png',
      buffer: PNG_BYTES,
    })
    await page.locator('input[name="alt_text"]').fill('Living room')
    await page.getByRole('checkbox', { name: /set as cover/i }).check()
    await page.getByRole('button', { name: /upload media/i }).click()

    await expect(page.getByText('Media uploaded.')).toBeVisible()
    await expect(page.getByText(/^cover$/i)).toBeVisible()

    // With a cover image + alt text, publishing is no longer blocked by the media gate.
    await page.getByRole('button', { name: /save & publish/i }).click()
    await expect(
      page.getByText(/cover image is required|cover image requires alt text/i)
    ).toHaveCount(0)
  })

  test('delete media uses an inline confirmation step', async ({ page }) => {
    await page.goto('/admin/properties/new')
    await page.locator('input[name="title_en"]').fill('E2E Media Delete')
    await page.locator('input[name="location_label"]').fill('Dubai Marina')
    await page.locator('input[name="size_sqft"]').fill('900')
    await page.getByRole('button', { name: /create draft/i }).click()
    await expect(page).toHaveURL(/\/admin\/properties\/[0-9a-f-]+\/edit$/)

    await page.locator('input[name="file"]').setInputFiles({
      name: 'plan.png',
      mimeType: 'image/png',
      buffer: PNG_BYTES,
    })
    await page.locator('input[name="alt_text"]').fill('Floor plan')
    await page.getByRole('button', { name: /upload media/i }).click()
    await expect(page.getByText('Media uploaded.')).toBeVisible()

    await page
      .getByRole('button', { name: /^remove$/i })
      .first()
      .click()
    await expect(page.getByText(/remove this media\?/i)).toBeVisible()
    await page.getByRole('button', { name: /^confirm$/i }).click()
    await expect(page.getByText('Media removed.')).toBeVisible()
  })
})
