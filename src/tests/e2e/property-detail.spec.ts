import { expect, test } from '@playwright/test'

/**
 * AURA-203 — e2e smoke for the public property detail route.
 *
 * DATA-INDEPENDENT: asserts the route renders its D-44 states gracefully whether or not a
 * seeded DB / env is available. An invalid-pattern slug fails validation BEFORE any DB access,
 * so it deterministically renders the not-found state; an unknown valid-pattern slug renders
 * not-found (DB up) or the error state (DB/env down) — never a crash. Live data behaviour is
 * covered by the DAL / integration / security suites, not here.
 */
test.describe('public property detail (AURA-203)', () => {
  test('an invalid slug renders the not-found state, not a crash', async ({ page }) => {
    // Uppercase fails the slug pattern before any DB call → deterministic not-found.
    await page.goto('/en/properties/INVALID')

    await expect(page.getByRole('heading', { name: /property not found/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /back to all properties/i })).toBeVisible()
  })

  test('an unknown property slug degrades gracefully (not-found or error state)', async ({
    page,
  }) => {
    await page.goto('/en/properties/this-property-does-not-exist-xyz')

    const notFound = page.getByRole('heading', { name: /property not found/i })
    const error = page.getByText(/couldn't load this property/i)

    await expect(notFound.or(error).first()).toBeVisible()
  })
})
