import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

import { routing } from '@/lib/i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url), 301)
  }

  return handleI18nRouting(request)
}

export const config = {
  // `admin` is excluded so the non-localized admin surface (`/admin`, `/admin/login`)
  // is never rewritten to a locale prefix by next-intl (AURA-301). API, Next internals,
  // Vercel internals, and files-with-extensions stay excluded as before.
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
