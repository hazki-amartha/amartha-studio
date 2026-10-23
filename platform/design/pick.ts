// =============================================================================
// Design · between the pinned element and the layer it stands for.
//
// The prototype view keeps the selection as an element — Chat, CSS and the
// outline all want one. Design mode thinks in layers. These are the few
// crossings: what a click on the device picks, what a hover would pick, what
// the outline should cover, and selecting a layer from anywhere.
// =============================================================================

import { diskPath } from '@/platform/dbProjects/active'
import { boxOf, fileOfSrc, getLayerTree, layerOfPin, pathOf, pickLayer, type Layer } from './layers'
import { rememberedLayerId, rememberLayer } from './selection'

/** The layer the pin stands for now. */
export function selectedLayer(pinned: Element | null): Layer | null {
  return layerOfPin(pinned, rememberedLayerId())
}

/** Select a layer: remember which, and pin its first box. */
export function selectLayer(layer: Layer | null, onPin: (el: Element | null) => void) {
  rememberLayer(layer)
  onPin(layer?.hosts[0] ?? null)
}

let dragging = false
/** Set while something is being dragged on the device: hovering then shows
 *  where it will land, not what a click would pick. */
export function setDragging(on: boolean) {
  dragging = on
}

const deep = (e: MouseEvent | null) => Boolean(e && (e.metaKey || e.ctrlKey))

/** What a click at `target` selects — the pick layer's `pick`. */
export function pickAt(target: Element, pinned: Element | null, e: MouseEvent | null): Element | null {
  const tree = getLayerTree()
  const layer = pickLayer(target, layerOfPin(pinned, rememberedLayerId(), tree), deep(e), tree)
  if (!layer) return null
  // A shift-click adds to the selection; the pin, and its layer, stay.
  if (!e?.shiftKey) rememberLayer(layer)
  return layer.hosts[0] ?? null
}

/** What a click at `target` would select, for the hover outline. */
export function hoverAt(target: Element, pinned: Element | null, e: MouseEvent | null): { boxes: Element[]; label: string } | null {
  if (dragging) return null
  const tree = getLayerTree()
  const layer = pickLayer(target, layerOfPin(pinned, rememberedLayerId(), tree), deep(e), tree)
  return layer ? { boxes: layer.hosts, label: layer.name } : null
}

/** What the selection outline covers, and its name. */
export function outlineOf(pinned: Element): { boxes: Element[]; label: string } {
  const layer = layerOfPin(pinned, rememberedLayerId())
  return layer ? { boxes: layer.hosts, label: layer.name } : { boxes: [pinned], label: pinned.tagName.toLowerCase() }
}

/**
 * Scroll the screen so a layer is in view — chosen from the Layers list, it
 * may be below the fold. Only the screen's own scroller moves: scrollIntoView
 * would scroll the studio around the device too.
 */
export function revealLayer(layer: Layer) {
  const host = layer.hosts[0]
  const scroller = host?.closest('[data-screen-scroller]')
  if (!host || !(scroller instanceof HTMLElement)) return
  const box = boxOf(layer)
  const view = scroller.getBoundingClientRect()
  const scale = view.height / scroller.clientHeight || 1
  const margin = 24 * scale
  if (box.top < view.top + margin) scroller.scrollTop -= (view.top + margin - box.top) / scale
  else if (box.bottom > view.bottom - margin && box.height < view.height) {
    scroller.scrollTop += (box.bottom - (view.bottom - margin)) / scale
  }
}

/**
 * The selection as the designer sees it in the Layers list, for Chat's
 * context (platform/chat/attach.ts): which use of which component it is,
 * where that is written, and how far a change to it reaches.
 */
export function describeForChat(el: Element): { name: string; text: string; lines: string[] } | null {
  const layer = selectedLayer(el)
  if (!layer) return null
  const where = (src: string) => `${diskPath(fileOfSrc(src))}, line ${src.split(':').slice(-2)[0]}`
  const lines = [`Selected: ${pathOf(layer).map((l) => l.name).join(' › ')}`]
  const node = layer.kind === 'list' ? layer.children[0]?.node : layer.node
  if (layer.kind === 'instance' && node) {
    lines.push(
      `That is one use of the project’s <${node.name}> component, written at ${where(node.src)} — change this use (its props) unless asked to change the component itself.`,
    )
  } else if (layer.kind === 'list' && node) {
    lines.push(`That is a list: ${layer.children.length} rows from one .map(), written at ${where(node.src)}.`)
  }
  if (layer.inside) {
    lines.push(`It is part of ${layer.inside.name}’s own markup, so changing it changes every ${layer.inside.name}.`)
  }
  return { name: layer.name, text: layer.text, lines }
}
