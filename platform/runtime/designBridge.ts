// =============================================================================
// Design bridge — a module-level store holding one boolean: is design mode on.
//
// The exact shape of inspectBridge, for the exact reasons written there: the
// shell's toggle and the running prototype are far apart in the tree, and a
// context would re-render the whole shell on every flip.
//
// Design and inspect are mutually exclusive modes over the same pick layer; the
// exclusivity lives at the call sites (the shell's ViewToggle), not here —
// each bridge stays one dumb flag.
// =============================================================================

let designing = false
const listeners = new Set<() => void>()

export function setDesignMode(on: boolean) {
  if (designing === on) return
  designing = on
  listeners.forEach((l) => l())
}

export function subscribeDesignMode(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getDesignMode(): boolean {
  return designing
}

/** Design mode is a client-only affordance; the server always renders it off. */
export function getDesignServerSnapshot(): boolean {
  return false
}
