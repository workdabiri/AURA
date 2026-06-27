import Link from 'next/link'

/**
 * Admin primary navigation — AURA-302.
 *
 * Presentational, NON-localized admin nav (admin lives outside the next-intl `[locale]`
 * tree, so it deliberately does NOT reuse the public `Navigation`/`Header`). Links point at
 * the future admin sections (AURA-303–307); those routes do not exist yet and will 404
 * until their tasks land — that is expected for the shell. `prefetch={false}` so the not-
 * yet-built targets are never prefetched. No data, no Supabase/DAL/services import.
 */
export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Properties', href: '/admin/properties' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Areas', href: '/admin/areas' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'Legal', href: '/admin/legal' },
] as const

export function AdminNav() {
  return (
    <nav aria-label="Admin" className="px-3 py-4">
      <ul className="flex flex-wrap gap-1 md:flex-col md:flex-nowrap">
        {ADMIN_NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              className="block rounded-md px-3 py-2 text-small text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
