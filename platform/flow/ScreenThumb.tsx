'use client'

// =============================================================================
// A single flow node: title strip + a live, scaled, non-interactive render of
// the project screen (WS-B, task 1).
//
// The screen calls useFlow(); we satisfy that contract with an inert FlowApi so
// the screen renders but its buttons/navigation do nothing here. A transparent
// overlay + pointer-events-none guarantees hover/click never trigger prototype
// behaviour — the whole node is clickable as a deep-link instead.
// =============================================================================

import { Suspense } from 'react'
import type { DeviceKind, ScreenDef } from '@/platform/types'
import { FlowContext } from '@/platform/runtime'
import { DEVICE_SPECS } from '@/platform/frame/device'
import { THUMB_H, THUMB_W } from './geometry'

const INERT_FLOW = {
  go() {},
  back() {},
}

export function ScreenThumb({
  screen,
  device = 'mobile',
}: {
  screen: ScreenDef
  device?: DeviceKind
}) {
  const Component = screen.component
  const spec = DEVICE_SPECS[device]
  // Scale to the node's width, not its height: the lattice in layout.ts is
  // built on a fixed node box, so a desktop screen is letterboxed inside the
  // same box rather than reshaping the whole canvas. For the phone this is
  // exactly the old 0.25.
  const scale = THUMB_W / spec.width
  return (
    <div
      className="pointer-events-none flex select-none items-center overflow-hidden rounded-8 border border-default bg-neutral-white"
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      {/* The scaled-down slot, centred: a desktop screen is much wider than it
          is tall relative to the node box, so it letterboxes instead of
          filling. */}
      <div style={{ height: spec.height * scale, flex: 'none', width: THUMB_W }}>
        {/* overflow-hidden here, on the FULL-SIZE screen box, is load-bearing:
            it makes THIS the nearest scrolling ancestor, so a screen's
            `sticky bottom-0` chrome resolves against the real screen height.
            Without it the scaled slot above is the scrollport and sticky bars
            land partway down the screen, over content. */}
        <div
          className="overflow-hidden"
          style={{
            width: spec.width,
            height: spec.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <FlowContext.Provider value={{ ...INERT_FLOW, current: screen.id }}>
            <Suspense fallback={null}>
              <Component />
            </Suspense>
          </FlowContext.Provider>
        </div>
      </div>
    </div>
  )
}
