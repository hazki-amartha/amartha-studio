// =============================================================================
// Flow canvas geometry (WS-B).
// Raw pixel numbers used for CSS transforms and SVG math — canvas coordinate
// space, not design-token surface. Visual chrome (colours, borders, radii,
// type) is expressed with Tailwind token classes elsewhere.
//
// The node box follows the project's DEVICE. It used to be the phone's 390×844
// baked in as constants, so a 1440×900 desktop project was squeezed to the
// phone's 97px width — a 6% thumbnail, letterboxed in a box more than three
// times its height, illegible and surrounded by empty node. One scale factor
// applied to whatever the device actually is keeps every flow at the same
// zoom, and the lattice reshapes around it.
// =============================================================================

import type { DeviceKind } from '@/platform/types'
import { DEVICE_SPECS } from '@/platform/frame/device'

/** Live-render scale for the screen thumbnails (~25% — the phone's old 0.25). */
export const SCALE = 0.25

/** Title strip above each thumbnail. */
export const TITLE_H = 28

/** Gaps between BFS columns / stacked rows. */
export const COL_GAP = 96
export const ROW_GAP = 48

/** A section lane: the label strip above its screens, and the space between lanes. */
export const LANE_HEAD = 56
export const LANE_GAP = 96

/** How far a lane's band reaches past its screens. */
export const LANE_PAD = 24

/** Corner radius where an arrow turns. */
export const EDGE_RADIUS = 12

/** Padding around the whole laid-out graph. */
export const CANVAS_PAD = 64

/** Zoom bounds. */
export const MIN_ZOOM = 0.2
/** 8 puts a thumbnail at twice the screen's real size — close enough to read anything on it. */
export const MAX_ZOOM = 8

/** The least zoom a screen picked from the sidebar is shown at. */
export const REVEAL_ZOOM = 0.75

/** Everything the layout, the edges and the node chrome need to agree on. */
export interface NodeBox {
  /** The scaled screen render. */
  thumbW: number
  thumbH: number
  /** The full node box — thumbnail plus its title strip. */
  nodeW: number
  nodeH: number
  /** Drag snap pitch: one column / one row of the auto-layout lattice. */
  snapX: number
  snapY: number
}

export function nodeBox(device: DeviceKind = 'mobile'): NodeBox {
  const spec = DEVICE_SPECS[device]
  const thumbW = spec.width * SCALE
  const thumbH = spec.height * SCALE
  const nodeH = TITLE_H + thumbH
  return {
    thumbW,
    thumbH,
    nodeW: thumbW,
    nodeH,
    snapX: thumbW + COL_GAP,
    snapY: nodeH + ROW_GAP,
  }
}
