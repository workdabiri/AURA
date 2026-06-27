/**
 * Admin landing (`/admin`) — AURA-301.
 *
 * Minimal guarded placeholder whose only job is to PROVE the session + role guard wires
 * up: reaching this page means the `(protected)` layout authorized the request. The real
 * dashboard shell, navigation, metrics, and any data reads are out of scope here and are
 * owned by AURA-302 onward. Intentionally renders no navigation, cards, or admin data.
 */
export default function AdminHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-sm text-text-secondary">
        You are signed in to the AUTEX Estates Dubai admin area.
      </p>
      <p className="text-sm text-text-secondary">
        The dashboard shell and its content are delivered separately (AURA-302). This page confirms
        the login, session, and role guard are working.
      </p>
    </main>
  )
}
