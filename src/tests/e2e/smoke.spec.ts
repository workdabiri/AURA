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

test.describe('public layout (AURA-201)', () => {
  test('renders header, primary nav, main and footer landmarks', async ({ page }) => {
    await page.goto('/en')

    await expect(page.getByRole('banner')).toBeVisible() // <header>
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible() // <nav>
    await expect(page.getByRole('main')).toBeVisible() // <main> (page)
    await expect(page.getByRole('contentinfo')).toBeVisible() // <footer>
  })

  test('footer shows the agency name and the AUTEX public disclosure', async ({ page }) => {
    await page.goto('/en')

    const footer = page.getByRole('contentinfo')
    // With no settings configured, the safe selector renders the demo default.
    await expect(footer).toContainText('AUTEX Estates Dubai')
    // Q-13: AUTEX disclosure is always present on the public site.
    await expect(footer).toContainText(/fictional demonstration brand/i)
  })

  test('sets a localized lang attribute on <html>', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })
})

test.describe('SEO noindex (AURA-206 / D-42)', () => {
  test('/en emits a robots noindex meta tag by default', async ({ page }) => {
    await page.goto('/en')
    // AUTEX is noindex by default: the rendered page must carry
    // `<meta name="robots" content="noindex, ...">`. Data-independent — asserts the SEO
    // metadata only, never page content.
    const robots = page.locator('meta[name="robots"]')
    await expect(robots).toHaveAttribute('content', /noindex/)
  })
})

test.describe('public about page (AURA-207)', () => {
  test('/en/about renders a main landmark, a single visible h1, and the AUTEX disclosure', async ({
    page,
  }) => {
    await page.goto('/en/about')

    const main = page.getByRole('main')
    await expect(main).toBeVisible()

    // Accessible heading structure: exactly one level-1 heading, and it is visible.
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toBeVisible()

    // Q-13: the AUTEX public disclosure is present in the page body (consistent with the
    // footer copy, which reuses the same `Footer.disclosure` string).
    await expect(main).toContainText(/fictional demonstration brand/i)
  })

  test('/en/about is noindex by default (AURA-206 / D-42)', async ({ page }) => {
    await page.goto('/en/about')
    // The static About page reuses the AURA-206 SEO helper, so it emits `noindex` by default.
    const robots = page.locator('meta[name="robots"]')
    await expect(robots).toHaveAttribute('content', /noindex/)
  })
})
