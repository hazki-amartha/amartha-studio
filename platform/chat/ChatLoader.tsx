'use client'

// The Vocus mark's looping liquid Lottie (public/chat/loader.json, copied from
// amartha-vocus): centred in the panel while Chat reaches Claude, and small
// under the transcript while a turn runs. The player and the animation load lazily, so nothing is paid until
// Chat actually opens; reduced motion, or a failed load, leaves just the words.

import { useEffect, useRef, useState } from 'react'

/** Below this, the wait isn't worth a loader — Chat just appears. */
const SHOW_AFTER_MS = 300
/** Once shown, the loader stays at least this long so it never blinks. */
const MIN_SHOWN_MS = 800

/** Whether to show the loader for a wait that is `loading`: not for a quick
 *  one, and never for a blink — a shown loader outlives the wait if needed. */
export function useLoaderVisible(loading: boolean) {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)

  useEffect(() => {
    if (loading && !visible) {
      const t = setTimeout(() => {
        shownAt.current = Date.now()
        setVisible(true)
      }, SHOW_AFTER_MS)
      return () => clearTimeout(t)
    }
    if (!loading && visible) {
      const t = setTimeout(() => setVisible(false), Math.max(0, shownAt.current + MIN_SHOWN_MS - Date.now()))
      return () => clearTimeout(t)
    }
  }, [loading, visible])

  return visible
}

/** The Vocus mark, looping. Reduced motion, or a failed load, draws nothing —
 *  callers always pair it with words, so nothing is lost. */
export function LoaderMark({ className }: { className: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [still, setStill] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStill(true)
      return
    }
    let anim: { destroy: () => void } | undefined
    let cancelled = false
    Promise.all([
      import('lottie-web/build/player/lottie_light'),
      fetch('/chat/loader.json').then((r) => r.json()),
    ])
      .then(([{ default: lottie }, animationData]) => {
        if (cancelled || !ref.current) return
        anim = lottie.loadAnimation({
          container: ref.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData,
        })
      })
      .catch(() => {
        if (!cancelled) setStill(true)
      })
    return () => {
      cancelled = true
      anim?.destroy()
    }
  }, [])

  return still ? null : <div ref={ref} aria-hidden className={`flex-none ${className}`} />
}

export function ChatLoader({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-12">
      <LoaderMark className="size-40" />
      <p className="text-12 font-regular text-neutral-600">{label}</p>
    </div>
  )
}
