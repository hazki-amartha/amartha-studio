// =============================================================================
// Inspect bridge — a module-level store holding one boolean: is inspect mode on.
//
// Written by the shell's view toggle, read by the running prototype. It is a
// singleton rather than context for the same reason the screen bridge is: the
// chrome and the prototype are far apart in the tree, and a context here would
// re-render the whole shell every time the mode flips.
//
// Deliberately NOT a field on ScreenBridgeState — that snapshot's identity
// stability is tuned for screen navigation, and a UI mode has no business
// invalidating it.
//
// Only the flag crosses. The pinned element stays local React state inside the
// prototype view, where the two components that need it are already siblings.
// =============================================================================

let inspecting = false
const listeners = new Set<() => void>()

export function setInspectMode(on: boolean) {
  if (inspecting === on) return
  inspecting = on
  listeners.forEach((l) => l())
}

export function subscribeInspectMode(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getInspectMode(): boolean {
  return inspecting
}

/** Inspect is a client-only affordance; the server always renders it off. */
export function getInspectServerSnapshot(): boolean {
  return false
}
