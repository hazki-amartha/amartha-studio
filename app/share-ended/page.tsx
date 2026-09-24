// Where a revoked, expired or mistyped share link lands.

export default function ShareEndedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-neutral-50 px-16 text-center dark:bg-ink-950">
      <h1 className="text-20 font-bold text-default dark:text-neutral-50">This link no longer works</h1>
      <p className="text-14 text-caption dark:text-neutral-400">
        It was turned off or has expired. Ask whoever sent it for a new one.
      </p>
      <a href="/auth/start" className="text-14 font-bold text-link">
        Have an Amartha account? Sign in
      </a>
    </main>
  )
}
