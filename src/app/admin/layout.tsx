import type { Metadata } from 'next'

import '@/styles/tokens.css'
import '@/styles/globals.css'

import { robotsDirective } from '@/lib/seo/metadata'

/**
 * Admin root layout — AURA-301.
 *
 * Owns <html>/<body> for the NON-localized `/admin` subtree (the public `[locale]`
 * layout owns them for the localized tree; the App Router root layout only passes
 * children through). This shell is deliberately UNGUARDED so it can wrap BOTH the
 * public login page (`/admin/login`) and the guarded area (`/admin`) without a redirect
 * loop — the session+role guard lives in the nested `(protected)` layout.
 *
 * Admin is ALWAYS `noindex, nofollow` — hard-coded, NOT derived from the public indexing
 * flag — so the admin surface can never be indexed even if public indexing is enabled.
 */
export const metadata: Metadata = {
  title: 'Admin · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <div className="flex min-h-screen flex-col bg-surface-page text-text-primary">
          {children}
        </div>
      </body>
    </html>
  )
}
