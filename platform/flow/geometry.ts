// =============================================================================
// Flow canvas geometry (WS-B).
// Raw pixel numbers used for CSS transforms and SVG math — canvas coordinate
// space, not design-token surface. Visual chrome (colours, borders, radii,
// type) is expressed with Tailwind token classes elsewhere.
//
// The node box is DERIVED FROM THE DEVICE, not fixed. It used to be a portrait
// 97.5×211 constant, which is a phone — so an NG-MIS flow drew 1440×900 screens
// letterboxed inside a phone-shaped node, mostly empty and unreadable.
// =============================================================================

import type { DeviceKind } from '@/platform/types'
import { DEVICE_SPECS } from '@/platform/frame/device'

/** Every thumbnail is this tall, whatever the device.
 *
 *  Holding HEIGHT constant (rather than width, or a flat 25% scale) is what
 *  keeps one lattice working for both: rows stay exactly where they were, and a
 *  wider device simply takes a wider column. It also keeps the two device kinds
 *  legible at the same zoom, which a shared scale would not — 1440px at 25% is
 *  a 360px-wide node next to a 97px one. */
export const THUMB_H = 211

/** Title strip above each thumbnail. */
export const TITLE_H = 28

/** Gaps between BFS columns / stacked rows. */
export const COL_GAP = 96
export const ROW_GAP = 48

/** Padding around the whole laid-out graph. */
export const CANVAS_PAD = 64

/** Zoom bounds. */
export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 2

/** The node box for one device kind — everything the layout, the edges, and the
 *  thumbnail need to agree on. */
export interface NodeBox {
  /** Device viewport a screen renders into before scaling. */
  screenW: number
  screenH: number
  /** Live-render scale for the thumbnail (0.25 for the phone, as before). */
  scale: number
  thumbW: number
  thumbH: number
  /** Full node box, title strip included. */
  nodeW: number
  nodeH: number
  /** Drag snap pitch — one column / one row of the auto-layout lattice. */
  snapX: number
  snapY: number
}

export function nodeBox(device: DeviceKind = 'mobile'): NodeBox {
  const spec = DEVICE_SPECS[device]
  const scale = THUMB_H / spec.height
  const thumbW = spec.width * scale
  const nodeH = TITLE_H + THUMB_H
  return {
    screenW: spec.width,
    screenH: spec.height,
    scale,
    thumbW,
    thumbH: THUMB_H,
    nodeW: thumbW,
    nodeH,
    snapX: thumbW + COL_GAP,
    snapY: nodeH + ROW_GAP,
  }
}
