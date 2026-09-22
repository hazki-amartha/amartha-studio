// =============================================================================
// Edit bridge — is Edit mode on, and which of its tabs is showing.
//
// Edit mode is what Design and Inspect were before they merged (2026-09-22,
// STUDIO-EDITING-PLAN Part E): selecting is the mode, and what you do with the
// selection is a tab — Chat asks for a change to it, Edit changes it, CSS
// reads it. The names below still
// say "design" because that is what the rest of platform/design calls it.
//
// A module-level store rather than context: the shell's toggle and the running
// prototype are far apart in the tree, and a context would re-render the whole
// shell on every flip. The pinned element is NOT here — it stays local React
// state in the prototype view, where everything that needs it is a sibling.
// =============================================================================

export type EditTab = 'chat' | 'edit' | 'css'

let designing = false
/** null until the designer picks one; the panel then chooses by backend. */
let tab: EditTab | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function setDesignMode(on: boolean) {
  if (designing === on) return
  designing = on
  emit()
}

export function subscribeDesignMode(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getDesignMode(): boolean {
  return designing
}

/** Edit mode is a client-only affordance; the server always renders it off. */
export function getDesignServerSnapshot(): boolean {
  return false
}

/** null goes back to the default for this backend. */
export function setEditTab(next: EditTab | null) {
  if (tab === next) return
  tab = next
  emit()
}

export function getEditTab(): EditTab | null {
  return tab
}

export function getEditTabServerSnapshot(): EditTab | null {
  return null
}
