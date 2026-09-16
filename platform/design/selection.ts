// =============================================================================
// Design · the rest of a multi-selection (D3).
//
// The pinned element stays the pick layer's business, shared with Inspect.
// Shift-click in design mode adds OTHER elements here, which is all "wrap
// these in a stack" needs. Cleared whenever the pin changes by a plain click.
// =============================================================================

let extra: Element[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function subscribeSelection(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getSelection(): Element[] {
  return extra
}

const EMPTY: Element[] = []
export function getSelectionServerSnapshot(): Element[] {
  return EMPTY
}

export function toggleSelected(el: Element) {
  extra = extra.includes(el) ? extra.filter((e) => e !== el) : [...extra, el]
  emit()
}

export function clearSelection() {
  if (extra.length === 0) return
  extra = []
  emit()
}

/** Drop elements that left the page (a redraw, a fast refresh). */
export function pruneSelection(refind: (el: Element) => Element | null) {
  const next = extra.map(refind).filter((e): e is Element => e !== null)
  if (next.length === extra.length && next.every((e, i) => e === extra[i])) return
  extra = next
  emit()
}

/** One element to pin after the next overlay redraw — a new stack, say. */
let pinNext: string | null = null
export function pinAfterRedraw(address: string) {
  pinNext = address
}
export function takePinAfterRedraw(): string | null {
  const a = pinNext
  pinNext = null
  return a
}
