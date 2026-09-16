// =============================================================================
// Design · the structural overlay — staged moves, deletes and duplicates,
// drawn on the live screen before anything is written.
//
// P2 of the plan: preview and persistence are independent. On a deployment
// nothing will ever be written from here, and on the dev server nothing is
// written until Apply, so the screen has to SHOW a staged move on its own.
//
// React owns the screen's DOM, and moving its nodes would corrupt its idea of
// the tree (the next re-render throws on a node that is no longer where React
// put it). So the overlay never moves a React node. It HIDES the original with
// an attribute React does not manage, and draws a CLONE where the element is
// going. A clone is inert — no handlers — which costs nothing, because design
// mode already swallows every click on the prototype.
//
// The overlay is a pure function of the staged list: every redraw removes all
// clones and hidden marks and replays the list in order. That is the same
// order the backend applies it in, which is what keeps the preview and the
// written file the same. A redraw runs whenever the list changes and whenever
// React re-renders the screen underneath (which would drop the hidden marks).
//
// Moved clones keep their `data-src`: they ARE that element, just somewhere
// else, so selecting one and nudging its padding edits the right node.
// Duplicates lose theirs: a copy has no address until the file is written.
// =============================================================================

import type { Place, Src, StructuralEdit } from './protocol'

export const HIDDEN_ATTR = 'data-design-hidden'
export const GHOST_ATTR = 'data-design-ghost'

const q = (src: Src) => `[data-src="${CSS.escape(src)}"]`

function root(): Element | null {
  return document.querySelector('[data-inspect]')
}

/**
 * The element currently SHOWING an address — its moved clone if there is one,
 * otherwise the original, and never a hidden one. `.map()` rows share an
 * address; structural edits refuse those, so the first match is the one.
 */
export function visibleBySrc(src: Src): Element | null {
  const r = root()
  if (!r) return null
  for (const el of Array.from(r.querySelectorAll(q(src)))) {
    if (!isHidden(el)) return el
  }
  return null
}

/** Whether `el`, or something it sits in, is hidden by the overlay. */
export function isHidden(el: Element): boolean {
  return el.closest(`[${HIDDEN_ATTR}]`) !== null
}

/** Whether `el` is one of the overlay's own drawings, or inside one. */
export function isGhost(el: Element): boolean {
  return el.closest(`[${GHOST_ATTR}]`) !== null
}

/**
 * Hiding is an inline `display: none`, with the attribute as the marker.
 *
 * Inline because a stylesheet rule for the attribute would have to be global,
 * and CSS modules only take selectors anchored on a local class. React leaves
 * an inline property alone unless the element's own `style` prop sets it; the
 * value it had is kept on the attribute and put back on reveal.
 */
function hide(el: Element) {
  if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return
  el.setAttribute(HIDDEN_ATTR, el.style.getPropertyValue('display'))
  el.style.setProperty('display', 'none', 'important')
}

function reveal(el: Element) {
  if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return
  const was = el.getAttribute(HIDDEN_ATTR)
  el.removeAttribute(HIDDEN_ATTR)
  if (was) el.style.setProperty('display', was)
  else el.style.removeProperty('display')
}

function clear(r: Element) {
  for (const g of Array.from(r.querySelectorAll(`[${GHOST_ATTR}]`))) g.remove()
  for (const h of Array.from(r.querySelectorAll(`[${HIDDEN_ATTR}]`))) reveal(h)
}

function cloneOf(el: Element, kind: 'move' | 'copy'): Element {
  const c = el.cloneNode(true) as Element
  // A hidden descendant stays hidden in the copy — it was deleted, and the
  // copy is of the element as it will be written.
  if (c.hasAttribute(HIDDEN_ATTR)) reveal(c)
  c.setAttribute(GHOST_ATTR, kind)
  if (kind === 'copy') {
    // Marked so it reads as not yet real.
    if (c instanceof HTMLElement) {
      c.style.setProperty('outline', '1px dashed var(--primary-400)')
      c.style.setProperty('outline-offset', '-1px')
    }
    for (const n of [c, ...Array.from(c.querySelectorAll('[data-src]'))]) {
      n.removeAttribute('data-src')
      n.removeAttribute('data-src-v')
    }
  }
  return c
}

/** Take the element that shows `src` off the screen: hide an original, drop a
 *  clone (its original is already hidden). */
function lift(el: Element) {
  if (el.hasAttribute(GHOST_ATTR)) el.remove()
  else hide(el)
}

/**
 * The DOM node a container's children render into.
 *
 * Usually the element itself. A component can render its children one level
 * down (a card body inside a card frame); when the container already has
 * addressed children, their parent is the right answer.
 */
function bodyOf(container: Element): Element {
  const own = Array.from(container.querySelectorAll('[data-src]')).find(
    (d) => d.parentElement?.closest('[data-src]') === container && !isHidden(d),
  )
  return own?.parentElement ?? container
}

function place(node: Element, to: Place): boolean {
  if ('inside' in to) {
    const container = visibleBySrc(to.inside)
    if (!container) return false
    const body = bodyOf(container)
    // After the last addressed child, so text or chrome a component draws
    // after its children stays after them.
    const kids = Array.from(body.children).filter((k) => k.hasAttribute('data-src') && !isHidden(k))
    const last = kids[kids.length - 1]
    if (last) last.after(node)
    else body.appendChild(node)
    return true
  }
  const anchor = visibleBySrc('before' in to ? to.before : to.after)
  if (!anchor) return false
  if ('before' in to) anchor.before(node)
  else anchor.after(node)
  return true
}

/** Replay the staged structure onto the live screen. */
export function renderOverlay(ops: readonly StructuralEdit[]): void {
  const r = root()
  if (!r) return
  clear(r)

  for (const op of ops) {
    const el = visibleBySrc(op.src)
    // Not on this screen — a change staged on another screen, or one whose
    // element has not rendered. Nothing to draw; the list still has it.
    if (!el) continue

    if (op.kind === 'delete') {
      lift(el)
    } else if (op.kind === 'duplicate') {
      el.after(cloneOf(el, 'copy'))
    } else {
      const moved = cloneOf(el, 'move')
      lift(el)
      if (!place(moved, op.to)) {
        // The anchor is gone (deleted earlier in the list, or not rendered):
        // show the element where it was rather than nowhere.
        if (el.isConnected) reveal(el)
      }
    }
  }
}

/**
 * Keep the overlay drawn while React re-renders underneath it.
 *
 * Returns `stop`, and `redraw` for when the list itself changed. Our own
 * writes are filtered out by what they touch — a MutationObserver cannot tell
 * who made a change, but it can tell a clone being added from a real node.
 */
export function watchOverlay(
  getOps: () => readonly StructuralEdit[],
  onRedraw: () => void,
): { stop: () => void; redraw: () => void } {
  const r = root()
  if (!r) return { stop: () => {}, redraw: () => {} }

  let frame = 0
  const redraw = () => {
    frame = 0
    const ops = getOps()
    // Stop observing while we write, or the redraw would trigger itself.
    mo.disconnect()
    renderOverlay(ops)
    observe()
    onRedraw()
  }

  const ours = (node: Node) =>
    node instanceof Element && (node.hasAttribute(GHOST_ATTR) || node.closest?.('[data-inspect-layer]') !== null)

  const mo = new MutationObserver((records) => {
    if (getOps().length === 0) return
    const real = records.some((rec) => {
      if (rec.type === 'attributes') {
        const t = rec.target as Element
        return !isGhost(t) && !t.closest('[data-inspect-layer]')
      }
      const target = rec.target as Element
      if (target.closest?.('[data-inspect-layer]') || isGhost(target)) return false
      const added = Array.from(rec.addedNodes)
      const removed = Array.from(rec.removedNodes)
      return [...added, ...removed].some((n) => !ours(n))
    })
    if (real && !frame) frame = requestAnimationFrame(redraw)
  })

  const observe = () =>
    mo.observe(r, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-src', 'data-src-v'],
    })

  redraw()
  return {
    redraw,
    stop: () => {
      mo.disconnect()
      if (frame) cancelAnimationFrame(frame)
      clear(r)
    },
  }
}
