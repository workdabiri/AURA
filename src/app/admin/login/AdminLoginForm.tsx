'use client'

import { useActionState } from 'react'

import type { LoginErrorCode, LoginFormState } from '@/services/auth/login'

import { loginAction } from './actions'

/**
 * Admin login form — AURA-301 (client component, colocated with the route).
 *
 * Drives the {@link loginAction} server action via `useActionState`. It owns ONLY the
 * generic, non-enumerating user-facing copy; the server returns stable codes and never
 * reveals whether an email exists or why auth failed. No signup, no password-reset, no
 * Supabase import, no service-role — it talks to the server action exclusively.
 */

// Generic messages — deliberately vague so none reveals account existence or internal
// detail. Keyed by the stable codes the server action returns.
const ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  validation: 'Enter a valid email and password.',
  invalid_credentials: 'Invalid email or password.',
  rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
  unauthorized: 'This account is not authorized to access the admin area.',
  generic: 'Something went wrong. Please try again.',
}

export function AdminLoginForm({ initialError }: { initialError: LoginErrorCode | null }) {
  const [state, formAction, pending] = useActionState<LoginFormState, FormData>(loginAction, {
    error: initialError,
  })

  const message = state.error ? ERROR_MESSAGES[state.error] : null

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {message ? (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
