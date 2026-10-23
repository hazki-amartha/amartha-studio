// =============================================================================
// Design · the selection, beyond the pinned element.
//
// The pinned element stays the prototype view's state, shared with Chat and
// CSS. Two things ride beside it here:
//
//   • WHICH LAYER it stands for. One box can be several layers — a component
//     drawn as a fragment shares its first box with its first child — so the
//     layer is remembered by id, and by a description good enough to find it
//     again after a save rewrites every address below the change.
//   • the rest of a multi-selection: shift-click adds OTHER layers here,
//     which is all "wrap these in a stack" needs. Cleared whenever the pin
//     changes by a plain click.
// =============================================================================

import type { Layer } from './layers'

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

// --- which layer ---------------------------------------------------------------

/** What finds a layer again when its id no longer exists. */
interface Remembered {
  id: string
  file: string
  kind: Layer['kind']
  name: string
  text: string
}

let chosen: Remembered | null = null

/** Remember the layer a pin stands for. */
export function rememberLayer(layer: Layer | null) {
  if (!layer) {
    chosen = null
    return
  }
  const src = layer.node?.src ?? layer.children[0]?.node?.src ?? ''
  chosen = {
    id: layer.id,
    file: src.split(':').slice(0, -2).join(':'),
    kind: layer.kind,
    name: layer.name,
    text: layer.text,
  }
}

export function rememberedLayerId(): string | null {
  return chosen?.id ?? null
}

/**
 * The remembered layer in a rebuilt screen: by id while its address holds,
 * else the one layer that still looks like it — same file, kind, name and
 * words. A save that moved the card above it shifted its line; the card is
 * still the card.
 */
export function findRemembered(all: readonly Layer[]): Layer | null {
  if (!chosen) return null
  const want = chosen
  const byId = all.find((l) => l.id === want.id)
  if (byId && byId.name === want.name && byId.text === want.text) return byId
  const like = all.filter((l) => {
    const src = l.node?.src ?? l.children[0]?.node?.src ?? ''
    return (
      l.kind === want.kind &&
      l.name === want.name &&
      l.text === want.text &&
      src.split(':').slice(0, -2).join(':') === want.file
    )
  })
  return like.length === 1 ? like[0] : null
}
