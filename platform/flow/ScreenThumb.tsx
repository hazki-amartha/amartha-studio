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
import type { ScreenDef } from '@/platform/types'
import { FlowContext } from '@/platform/runtime'
import type { NodeBox } from './geometry'

const INERT_FLOW = {
  go() {},
  back() {},
}

export function ScreenThumb({ screen, box }: { screen: ScreenDef; box: NodeBox }) {
  const Component = screen.component
  // No letterboxing: the node box was built from this device (geometry.ts), so
  // the scaled screen fills it exactly — a phone node is portrait, an NG-MIS
  // node is landscape, and both are the same height on the canvas.
  const { scale, screenW, screenH, thumbW, thumbH } = box
  return (
    <div
      className="pointer-events-none flex select-none items-center overflow-hidden rounded-8 border border-default bg-neutral-white"
      style={{ width: thumbW, height: thumbH }}
    >
      <div style={{ height: thumbH, flex: 'none', width: thumbW }}>
        {/* overflow-hidden here, on the FULL-SIZE screen box, is load-bearing:
            it makes THIS the nearest scrolling ancestor, so a screen's
            `sticky bottom-0` chrome resolves against the real screen height.
            Without it the scaled slot above is the scrollport and sticky bars
            land partway down the screen, over content. */}
        <div
          className="overflow-hidden"
          style={{
            width: screenW,
            height: screenH,
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
