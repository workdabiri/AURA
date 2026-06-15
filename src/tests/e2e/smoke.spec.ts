import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test('/ redirects to /en with 301', async ({ request, page }) => {
    const response = await request.get('/', { maxRedirects: 0 })

    expect(response.status()).toBe(301)
    expect(response.headers().location).toContain('/en')

    await page.goto('/')
    await expect(page).toHaveURL('/en')
  })

  test('/en loads without error', async ({ page }) => {
    await page.goto('/en')
    await expect(page).not.toHaveTitle('Error')
  })
})
