import { expect, test } from '@playwright/test'

/**
 * AURA-204 — e2e smoke for the public areas overview.
 *
 * DATA-INDEPENDENT: asserts the page shell renders gracefully whether or not a seeded DB / env
 * is available (the overview falls back to its empty or error state). Live data behaviour is
 * covered by the DAL / integration / security suites, not here.
 */
test.describe('public areas overview (AURA-204)', () => {
  test('/en/areas loads with a heading and a content region', async ({ page }) => {
    await page.goto('/en/areas')

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Areas' })).toBeVisible()
  })

  test('overview degrades gracefully with no seeded data/env (empty/error/grid)', async ({
    page,
  }) => {
    await page.goto('/en/areas')

    // Whatever the data situation, the page renders one of the D-44 states — never a crash.
    const empty = page.getByText(/areas will appear here soon/i)
    const error = page.getByText(/couldn't load areas/i)
    const grid = page.getByRole('list', { name: 'Areas' })

    await expect(empty.or(error).or(grid).first()).toBeVisible()
  })
})
