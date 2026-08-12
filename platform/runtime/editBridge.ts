// =============================================================================
// Edit bridge — a module-level store holding one boolean: is edit mode on.
//
// The exact shape of inspectBridge, for the exact reasons written there: the
// shell's toggle and the running prototype are far apart in the tree, and a
// context would re-render the whole shell on every flip.
//
// Edit and inspect are mutually exclusive modes over the same pick layer; the
// exclusivity lives at the call sites (the shell's ViewToggle), not here —
// each bridge stays one dumb flag.
// =============================================================================

let editing = false
const listeners = new Set<() => void>()

export function setEditMode(on: boolean) {
  if (editing === on) return
  editing = on
  listeners.forEach((l) => l())
}

export function subscribeEditMode(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getEditMode(): boolean {
  return editing
}

/** Edit is a client-only, dev-only affordance; the server always renders it off. */
export function getEditServerSnapshot(): boolean {
  return false
}
