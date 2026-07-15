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
import { SCALE, SCREEN_H, SCREEN_W, THUMB_H, THUMB_W } from './geometry'

const INERT_FLOW = {
  go() {},
  back() {},
}

export function ScreenThumb({ screen }: { screen: ScreenDef }) {
  const Component = screen.component
  return (
    <div
      className="pointer-events-none select-none overflow-hidden rounded-8 border border-default bg-neutral-white"
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      <div
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          transform: `scale(${SCALE})`,
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
  )
}
