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
import type { NodeBox } from './geometry'

const INERT_FLOW = {
  go() {},
  back() {},
}

export function ScreenThumb({
  screen,
  device = 'mobile',
  box,
}: {
  screen: ScreenDef
  device?: DeviceKind
  /** The node geometry for this device — the box the thumbnail fills exactly. */
  box: NodeBox
}) {
  const Component = screen.component
  const spec = DEVICE_SPECS[device]
  // The box was derived from this same spec, so the screen fills it on both
  // axes: one scale, whatever the device.
  const scale = box.thumbW / spec.width
  return (
    <div
      className="pointer-events-none select-none overflow-hidden rounded-8 border border-default bg-neutral-white"
      style={{ width: box.thumbW, height: box.thumbH }}
    >
      <div style={{ height: box.thumbH, width: box.thumbW }}>
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
