'use client'

// Standalone harness for the chat panel replay (STUDIO-EDITING-PLAN C2).
// Deliberately NOT wired into the shell's mode switch: this exists to answer one
// question — does a four-minute turn read as progress or as a hang — and mounting
// it in the shell would mean touching chrome that the design-mode work is in.

import { ChatPanel, RECORDED_TURN, longestGapMs } from '@/platform/chat'

export default function ChatReplayPage() {
  const gap = longestGapMs(RECORDED_TURN)
  const after = RECORDED_TURN.events[gap.afterIndex]

  return (
    <main className="flex min-h-screen justify-center bg-neutral-50 px-16 py-24 dark:bg-ink-950">
      <div className="mx-auto flex w-full gap-24">
        <section className="hidden flex-1 lg:block">
          <h1 className="text-20 font-bold text-ink-900 dark:text-neutral-white">
            Chat panel — recorded turn
          </h1>
          <p className="mt-8 text-14 font-regular text-neutral-700 dark:text-neutral-200">
            Real timings from Spike A run 3: Opus 5 in a Vercel Sandbox adding a
            homepage option to afin-linear. No API key is used — the events are
            replayed from what was measured.
          </p>
          <dl className="mt-16 grid grid-cols-2 gap-12">
            {[
              ['Turn length', `${(RECORDED_TURN.durationMs / 1000).toFixed(0)}s`],
              ['Cost', `$${RECORDED_TURN.costUsd.toFixed(2)}`],
              ['Agent steps', String(RECORDED_TURN.turns)],
              ['Longest silence', `${(gap.ms / 1000).toFixed(0)}s`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-12 bg-neutral-white px-12 py-8 dark:bg-ink-900">
                <dt className="text-12 font-regular text-neutral-600">{label}</dt>
                <dd className="text-16 font-bold text-ink-900 dark:text-neutral-white">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-16 text-14 font-regular text-neutral-600">
            The {(gap.ms / 1000).toFixed(0)}-second silence falls after{' '}
            <span className="font-bold">
              {after?.kind === 'tool' ? after.detail : 'the opening reply'}
            </span>
            . Watch that stretch at 1× — it is the moment the panel has to survive.
          </p>
        </section>

        <section className="h-screen w-full max-w-sm overflow-hidden rounded-16 border border-neutral-200 dark:border-ink-700">
          <ChatPanel turn={RECORDED_TURN} />
        </section>
      </div>
    </main>
  )
}
