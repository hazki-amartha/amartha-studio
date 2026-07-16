// =============================================================================
// Flow canvas geometry constants (WS-B).
// These are raw pixel numbers used for CSS transforms and SVG math — canvas
// coordinate space, not design-token surface. Visual chrome (colours, borders,
// radii, type) is expressed with Tailwind token classes elsewhere.
// =============================================================================

/** Emulated mobile viewport each screen renders into before scaling. */
export const SCREEN_W = 390
export const SCREEN_H = 844

/** Live-render scale for the screen thumbnails (~25%). */
export const SCALE = 0.25

export const THUMB_W = SCREEN_W * SCALE // 97.5
export const THUMB_H = SCREEN_H * SCALE // 211

/** Title strip above each thumbnail. */
export const TITLE_H = 28

/** Full node box (title strip + thumbnail). */
export const NODE_W = THUMB_W
export const NODE_H = TITLE_H + THUMB_H

/** Gaps between BFS columns / stacked rows. */
export const COL_GAP = 96
export const ROW_GAP = 48

/** Drag snap pitch — one column / one row of the auto-layout lattice. */
export const SNAP_X = NODE_W + COL_GAP
export const SNAP_Y = NODE_H + ROW_GAP

/** Padding around the whole laid-out graph. */
export const CANVAS_PAD = 64

/** Zoom bounds. */
export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 2
