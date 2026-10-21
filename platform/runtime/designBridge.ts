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
//
// `picking` is what a click on the device does while Edit mode is on: select
// (true) or navigate the prototype (false). Chat always opens navigating — it
// needs no selection, and a designer talking to it still walks the flow — and
// its cursor button turns selecting on until it's turned off. Edit and CSS
// always select. ⌘-click selects in either mode.
// =============================================================================

export type EditTab = 'chat' | 'edit' | 'css'

let designing = false
/** null until the designer picks one; the panel then shows its default. */
let tab: EditTab | null = null
let picking = true
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function setDesignMode(on: boolean) {
  if (designing === on) return
  designing = on
  // Every opening starts on the default tab (Chat, where it's available),
  // not on whichever tab was showing last time.
  if (on) {
    tab = null
    picking = true
  }
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

export function setPicking(on: boolean) {
  if (picking === on) return
  picking = on
  emit()
}

export function getPicking(): boolean {
  return picking
}

export function getPickingServerSnapshot(): boolean {
  return true
}
