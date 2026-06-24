import { expect, test } from '@playwright/test'

/**
 * AURA-205 — e2e smoke for the public legal pages + navigation links.
 *
 * DATA-INDEPENDENT: asserts the pages render gracefully whether or not a seeded DB / env is
 * available. With no published legal page, the route calls `notFound()` and the not-found state
 * renders (never a crash); with data, the legal article renders. Live data behaviour is covered
 * by the DAL / integration / security suites, not here.
 */
test.describe('public legal pages (AURA-205)', () => {
  test('/en/privacy renders a main region and a D-44 state (never crashes)', async ({ page }) => {
    await page.goto('/en/privacy')

    await expect(page.getByRole('main')).toBeVisible()
    // Either the legal article heading (data present), the not-found state, or the error state.
    const notFound = page.getByRole('heading', { name: /page not available/i })
    const error = page.getByText(/couldn't load this page/i)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(notFound.or(error).or(heading).first()).toBeVisible()
  })

  test('/en/terms renders a main region and a D-44 state (never crashes)', async ({ page }) => {
    await page.goto('/en/terms')

    await expect(page.getByRole('main')).toBeVisible()
    const notFound = page.getByRole('heading', { name: /page not available/i })
    const error = page.getByText(/couldn't load this page/i)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(notFound.or(error).or(heading).first()).toBeVisible()
  })
})

test.describe('navigation legal links (AURA-205)', () => {
  test('nav links point to /en/privacy and /en/terms, not the dead /legal path', async ({
    page,
  }) => {
    await page.goto('/en')

    const privacy = page.getByRole('link', { name: 'Privacy', exact: true })
    const terms = page.getByRole('link', { name: 'Terms', exact: true })

    await expect(privacy).toHaveAttribute('href', '/en/privacy')
    await expect(terms).toHaveAttribute('href', '/en/terms')

    // The old single "Legal" nav link is gone.
    await expect(page.getByRole('link', { name: 'Legal', exact: true })).toHaveCount(0)
  })
})
