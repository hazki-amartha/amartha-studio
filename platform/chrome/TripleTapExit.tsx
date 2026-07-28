// =============================================================================
// TripleTapExit — mobile escape hatch and control panel for fullscreen
// prototypes.
// Below md the shell hides all chrome on /p/ routes, so the prototype fills the
// phone like the real app; triple-tapping anywhere reveals a dialog with the way
// back to the gallery and — mirroring the desktop states panel — the active
// screen's declared states, since mobile has no room for a column beside the
// device. Invisible by design — nothing pollutes a stakeholder demo.
// Desktop is untouched: taps are only counted below the md breakpoint and the
// overlay is md:hidden besides.
// =============================================================================

'use client'

import Link from 'next/link'
import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { getScreenBridge, subscribeScreenBridge } from '@/platform/runtime/bridge'
import type { ScreenState } from '@/platform/types'

/** Max gap between taps for them to count as one triple-tap. */
const TAP_WINDOW_MS = 600
const MOBILE_QUERY = '(max-width: 767px)' // below Tailwind `md`

function getServerSnapshot() {
  return null
}

/**
 * The active screen's states, offered inside the dialog.
 *
 * Same contract as the desktop panel: the platform renders `label` and calls
 * `apply`, and knows nothing about what a state is. Applying closes the dialog —
 * on mobile the prototype IS the whole screen, so there is nothing to see until
 * the overlay is out of the way.
 */
function DialogStates({
  states,
  onApplied,
}: {
  states: ScreenState[]
  onApplied: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-10 font-bold uppercase text-caption">States</span>
      {states.map((state) => (
        <button
          key={state.id}
          type="button"
          onClick={() => {
            state.apply()
            onApplied()
          }}
          className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white px-12 py-8 text-left"
        >
          <span className="text-14 font-bold text-default">{state.label}</span>
          {state.description ? (
            <span className="text-12 text-caption">{state.description}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export function TripleTapExit({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const taps = useRef<number[]>([])
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  const states = bridge?.states ?? []

  const onPointerDown = useCallback(() => {
    if (!window.matchMedia(MOBILE_QUERY).matches) return
    const now = Date.now()
    const recent = taps.current.filter((t) => now - t < TAP_WINDOW_MS)
    recent.push(now)
    if (recent.length >= 3) {
      taps.current = []
      setOpen(true)
    } else {
      taps.current = recent
    }
  }, [])

  return (
    <div className={className} onPointerDown={onPointerDown}>
      {children}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Prototype controls"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-16 md:hidden"
        >
          <div className="flex max-h-full w-full max-w-screen-sm flex-col gap-16 overflow-y-auto rounded-12 bg-neutral-white p-16">
            <div className="flex flex-col gap-4">
              <p className="text-18 font-bold text-default">
                {states.length > 0 ? 'Prototype controls' : 'Exit prototype?'}
              </p>
              <p className="text-14 text-caption">
                {states.length > 0
                  ? 'Put the screen in a state, head back to the Studio gallery, or keep viewing. Triple-tap anywhere to see this again.'
                  : 'Head back to the Studio gallery, or keep viewing. Triple-tap anywhere to see this again.'}
              </p>
            </div>
            {states.length > 0 ? (
              <DialogStates states={states} onApplied={() => setOpen(false)} />
            ) : null}
            <div className="flex flex-col gap-8">
              <Link
                href="/"
                className="rounded-full bg-primary-500 px-20 py-12 text-center text-14 font-bold text-neutral-white"
              >
                Back to gallery
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-20 py-12 text-14 font-bold text-link"
              >
                Keep viewing
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
