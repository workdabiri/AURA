import { permanentRedirect } from 'next/navigation'

// Defensive fallback: middleware handles / → /en with 301.
// This fires only if a request bypasses the middleware.
export default function RootPage() {
  permanentRedirect('/en')
}
