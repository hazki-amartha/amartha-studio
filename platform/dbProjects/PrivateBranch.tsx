// DB projects · what a private branch's link shows to someone who may not open
// it (./branchAccess.ts) — said plainly, rather than a 404 that looks like a
// typo, and without its name or its designer's.

import Link from 'next/link'

export function PrivateBranch() {
  return (
    <main className="mx-auto flex min-h-full max-w-screen-sm flex-col items-center justify-center gap-16 bg-neutral-50 px-16 text-center dark:bg-ink-950">
      <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">Private branch</span>
      <h1 className="text-24 font-bold text-default dark:text-neutral-50">This branch is private</h1>
      <p className="text-14 text-caption dark:text-neutral-400">
        Only the designer who started it and studio admins can open it. Ask them to share it with the team, or to
        push it to its project.
      </p>
      <Link href="/" className="rounded-full bg-primary-500 px-20 py-12 text-14 font-bold text-neutral-white">
        Back to gallery
      </Link>
    </main>
  )
}
