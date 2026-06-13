import { expect, test } from '@playwright/test'

// docs/TASKS_Project.md AURA-003 Test Plan: "E2E: skipped placeholder spec"
// Exercised in AURA-008 once /en routing and homepage shell exist
test.describe.skip('smoke', () => {
  test('/ redirects to /en', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/en')
  })

  test('/en loads without error', async ({ page }) => {
    await page.goto('/en')
    await expect(page).not.toHaveTitle('Error')
  })
})
