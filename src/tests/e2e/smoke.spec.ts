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
