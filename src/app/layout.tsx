/**
 * Root layout — AURA-201.
 *
 * The App Router requires a root layout, but the localized `[locale]` layout
 * owns <html>/<body>, the `lang`/`dir` attributes, global styles, and the
 * next-intl provider. This root therefore only passes children through. The `/`
 * route redirects to `/en` (middleware) before any markup renders.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
