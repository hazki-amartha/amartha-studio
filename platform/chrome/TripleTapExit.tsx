// =============================================================================
// TripleTapExit — mobile escape hatch for fullscreen prototypes.
// Below md the shell hides all chrome on /p/ routes, so the prototype fills the
// phone like the real app; triple-tapping anywhere reveals an exit dialog back
// to the gallery. Invisible by design — nothing pollutes a stakeholder demo.
// Desktop is untouched: taps are only counted below the md breakpoint and the
// overlay is md:hidden besides.
// =============================================================================

'use client'

import Link from 'next/link'
import { useCallback, useRef, useState, type ReactNode } from 'react'

/** Max gap between taps for them to count as one triple-tap. */
const TAP_WINDOW_MS = 600
const MOBILE_QUERY = '(max-width: 767px)' // below Tailwind `md`

export function TripleTapExit({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const taps = useRef<number[]>([])

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
          aria-label="Exit prototype"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-16 md:hidden"
        >
          <div className="flex w-full max-w-screen-sm flex-col gap-16 rounded-12 bg-neutral-white p-16">
            <div className="flex flex-col gap-4">
              <p className="text-18 font-bold text-default">Exit prototype?</p>
              <p className="text-14 text-caption">
                Head back to the Studio gallery, or keep viewing. Triple-tap anywhere to see this
                again.
              </p>
            </div>
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
