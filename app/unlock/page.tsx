import type { Metadata } from 'next'
import { UnlockForm } from './UnlockForm'

export const metadata: Metadata = {
  title: 'Unlock · Prototype Studio',
  description: 'Enter the shared password to view Prototype Studio prototypes.',
}

export default function UnlockPage({
  searchParams,
}: {
  searchParams: { next?: string | string[] }
}) {
  const next = typeof searchParams.next === 'string' ? searchParams.next : undefined

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-16 py-48">
      <div className="flex w-full max-w-screen-sm flex-col gap-24 rounded-16 border border-default bg-neutral-white p-24">
        <div className="flex flex-col gap-8">
          <h1 className="text-24 font-bold text-default">Prototype Studio</h1>
          <p className="text-14 text-caption">
            This studio is private. Enter the shared password to continue.
          </p>
        </div>
        <UnlockForm next={next} />
      </div>
    </main>
  )
}
