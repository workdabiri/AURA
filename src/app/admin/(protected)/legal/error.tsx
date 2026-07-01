'use client'

/**
 * Admin legal error state (`/admin/legal`) — AURA-307 (D-44 error + retry state).
 *
 * Client error boundary for the legal segment. Shows a generic message (no internal detail) and a
 * retry button that re-renders the segment. No Supabase/DAL/services import.
 */
export default function AdminLegalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 py-8 md:px-10" role="alert">
      <h1 className="font-display text-h2 text-text-primary">Something went wrong</h1>
      <p className="mt-2 max-w-xl text-small text-text-secondary">
        We couldn’t load the legal pages. This may be a temporary issue.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md border border-border-default bg-surface-card px-4 py-2 text-small text-text-primary transition-colors hover:bg-surface-overlay"
      >
        Try again
      </button>
    </div>
  )
}
