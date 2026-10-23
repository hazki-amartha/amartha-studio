'use client'

// =============================================================================
// A single flow node: title strip + a live, scaled, non-interactive render of
// the project screen (WS-B, task 1).
//
// The screen calls useFlow(); we satisfy that contract with an inert FlowApi so
// the screen renders but its buttons/navigation do nothing here. A transparent
// overlay + pointer-events-none guarantees hover/click never trigger prototype
// behaviour — the whole node is clickable as a deep-link instead.
//
// Full length: a page longer than the device is drawn whole, as a tall
// thumbnail, not cut at the first screenful. Its length is measured with the
// box set back to the device's height — `Screen` is min-h-full, so held taller
// it would never read shorter again — and re-measured whenever the page
// changes (a state applied, an image arriving). The canvas lays rows out to it.
// =============================================================================

import { memo, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { DeviceKind, ScreenDef } from '@/platform/types'
import { FlowContext } from '@/platform/runtime'
import { ScreenErrorBoundary } from '@/platform/runtime/ScreenErrorBoundary'
import { DEVICE_SPECS } from '@/platform/frame/device'
import type { NodeBox } from './geometry'
import { FlowComments } from './FlowComments'

const INERT_FLOW = {
  go() {},
  back() {},
}

// Memoised: the canvas re-renders on every pan and zoom, and a screen's props
// don't change with either.
export const ScreenThumb = memo(function ScreenThumb({
  screen,
  device = 'mobile',
  box,
  onHeight,
}: {
  screen: ScreenDef
  device?: DeviceKind
  /** The node geometry for this device — the box the thumbnail fills exactly. */
  box: NodeBox
  /** Told the thumbnail's height, in canvas units, whenever the page's length changes. */
  onHeight?: (id: string, height: number) => void
}) {
  const Component = screen.component
  const spec = DEVICE_SPECS[device]
  // The box was derived from this same spec, so the screen fills it on both
  // axes: one scale, whatever the device.
  const scale = box.thumbW / spec.width

  const [full, setFull] = useState(spec.height)
  const deviceRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = deviceRef.current
    if (!el) return
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const held = el.style.height
        el.style.height = `${spec.height}px`
        const length = Math.max(spec.height, Math.ceil(el.scrollHeight))
        el.style.height = held
        setFull(length)
      })
    }
    measure()
    // Our own height changing is an attribute change on `el`: not a reason to measure.
    const watch = new MutationObserver((records) => records.some((r) => r.target !== el) && measure())
    watch.observe(el, { childList: true, subtree: true, characterData: true, attributes: true })
    el.addEventListener('load', measure, true)
    return () => {
      cancelAnimationFrame(frame)
      watch.disconnect()
      el.removeEventListener('load', measure, true)
    }
  }, [spec.height])
  useEffect(() => onHeight?.(screen.id, full * scale), [onHeight, screen.id, full, scale])

  const thumbH = full * scale
  return (
    <div
      className="pointer-events-none select-none overflow-hidden rounded-8 border border-default bg-neutral-white"
      style={{ width: box.thumbW, height: thumbH }}
    >
      <div style={{ height: thumbH, width: box.thumbW }}>
        {/* overflow-hidden here, on the FULL-SIZE screen box, is load-bearing:
            it makes THIS the nearest scrolling ancestor, so a screen's
            `sticky bottom-0` chrome resolves against the real screen height.
            Without it the scaled slot above is the scrollport and sticky bars
            land partway down the screen, over content. */}
        <div
          ref={deviceRef}
          className="relative overflow-hidden"
          style={{
            width: spec.width,
            height: full,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <FlowContext.Provider value={{ ...INERT_FLOW, current: screen.id }}>
            {/* Marked as the runtime marks its own, so the comment pins find
                the page — and, the page being drawn whole, nothing scrolls. */}
            <div data-screen-scroller className="h-full">
              <ScreenErrorBoundary resetKey={Component} compact>
                <Suspense fallback={null}>
                  <Component />
                </Suspense>
              </ScreenErrorBoundary>
            </div>
            <FlowComments />
          </FlowContext.Provider>
        </div>
      </div>
    </div>
  )
})
