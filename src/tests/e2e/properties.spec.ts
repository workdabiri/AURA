import { expect, test } from '@playwright/test'

/**
 * AURA-202 — e2e smoke for the public properties listing + homepage featured section.
 *
 * These tests are DATA-INDEPENDENT: they assert the page shell renders gracefully whether or
 * not a seeded DB / env is available (the listing falls back to an empty or error state, and
 * the homepage featured section falls back to its empty copy). Live data behaviour is covered
 * by the DAL / integration / security suites, not here.
 */
test.describe('public properties listing (AURA-202)', () => {
  test('/en/properties loads with heading, filter form, and a result region', async ({ page }) => {
    await page.goto('/en/properties')

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Properties' })).toBeVisible()

    // Filter form is server-rendered (GET form) — its submit control is always present.
    await expect(page.getByRole('button', { name: /apply filters/i })).toBeVisible()
  })

  test('listing degrades gracefully with no seeded data/env (empty or error state)', async ({
    page,
  }) => {
    await page.goto('/en/properties')

    // Whatever the data situation, the page renders one of the D-44 states — never a crash.
    const empty = page.getByText(/no properties match your search/i)
    const error = page.getByText(/couldn't load properties/i)
    const grid = page.getByRole('list', { name: 'Properties' })

    await expect(empty.or(error).or(grid).first()).toBeVisible()
  })

  test('an invalid filter renders the validation state, not a crash', async ({ page }) => {
    await page.goto('/en/properties?sort=not-a-real-sort')

    await expect(page.getByRole('heading', { level: 1, name: 'Properties' })).toBeVisible()
    await expect(page.getByText(/some of your filters are invalid/i)).toBeVisible()
  })
})

test.describe('homepage featured section (AURA-202)', () => {
  test('/en still loads and renders the featured section gracefully', async ({ page }) => {
    await page.goto('/en')

    await expect(page).toHaveURL('/en')
    // Featured heading always renders; the list or the empty fallback copy renders beneath it.
    await expect(page.getByRole('heading', { name: 'Featured properties' })).toBeVisible()
  })
})
