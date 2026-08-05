// =============================================================================
// Present bridge — a module-level store holding one boolean: is the prototype
// being presented bare (filling the browser window, no studio chrome).
//
// Same shape and the same reasoning as inspectBridge: the shell's toggle and the
// running prototype sit far apart in the tree, and a context here would
// re-render the whole shell every time the mode flips.
//
// Presentation is the studio's second axis, orthogonal to device kind:
//   studio → device frame, step arrows, notes/states panels (the review surface)
//   bare   → the app fills the window, nothing around it (the demo surface)
// A phone prototype opened on a phone is bare implicitly — that rule lives in
// PrototypeView, because it depends on the viewport and on the project's device.
// This flag is only the EXPLICIT request, which is also what tells the two views
// apart: the floating exit button exists precisely when someone asked for bare,
// since implicit bare has nothing to go back to.
// =============================================================================

let bare = false
const listeners = new Set<() => void>()

export function setBareMode(on: boolean) {
  if (bare === on) return
  bare = on
  listeners.forEach((l) => l())
}

export function subscribeBareMode(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getBareMode(): boolean {
  return bare
}

/** Bare is a client-only affordance; the server always renders the shell. A
 *  `?full=1` deep link therefore lands in studio mode and flips on mount, which
 *  is one frame of chrome rather than a hydration mismatch. */
export function getBareServerSnapshot(): boolean {
  return false
}
