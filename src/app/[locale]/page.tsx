export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface-page text-text-primary">
      <section
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        aria-label="Hero"
      >
        <p className="mb-4 font-sans text-caption uppercase tracking-widest text-brand-secondary">
          Dubai Luxury Real Estate
        </p>
        <h1 className="font-display text-display text-text-primary">AUTEX Estates</h1>
        <p className="mt-6 max-w-prose text-body text-text-secondary">
          Exclusive Properties. Exceptional Service.
        </p>
      </section>
    </main>
  )
}
