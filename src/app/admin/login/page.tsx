import type { Metadata } from 'next'

import { robotsDirective } from '@/lib/seo/metadata'
import type { LoginErrorCode } from '@/services/auth/login'

import { AdminLoginForm } from './AdminLoginForm'

/**
 * Admin login page — AURA-301. Login ONLY: no signup, no password reset, no public
 * marketing/contact. Static, demo-safe copy (admin is outside the next-intl tree).
 *
 * `error=unauthorized` is set when the guard (or the login action) turns away an
 * authenticated-but-unprivileged session; we surface a single generic message and never
 * the underlying reason.
 */
export const metadata: Metadata = {
  title: 'Admin sign in · AUTEX Estates Dubai',
  robots: robotsDirective(false),
}

// Reads search params and renders a form backed by a server action — never static.
export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const initialError: LoginErrorCode | null = error === 'unauthorized' ? 'unauthorized' : null

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="text-sm text-text-secondary">
          Sign in to manage the AUTEX Estates Dubai demo. Access is restricted to authorized
          administrators.
        </p>
      </div>
      <AdminLoginForm initialError={initialError} />
    </main>
  )
}
