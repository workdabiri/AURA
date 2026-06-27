import type { ReactNode } from 'react'

import { AdminSidebar } from './AdminSidebar'
import { AdminTopBar } from './AdminTopBar'

/**
 * Admin shell — AURA-302.
 *
 * The non-localized admin layout chrome: sidebar + top bar + a single `<main>` content
 * region that wraps `children`. Presentational only — it owns no auth logic. Access is
 * enforced by the AURA-301 `(protected)` layout guard that wraps every admin page; this
 * shell must only ever be rendered by pages already inside that guarded group.
 *
 * Exactly one `<main>` landmark is rendered here, so pages pass their `<h1>` + content as
 * children and never declare their own `<main>`.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  )
}
