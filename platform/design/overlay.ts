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
// An address is found through React's tree (analysis.ts), not only the page:
// a component the project wrote (`<StatCell />`) leaves no stamp of its own
// on the page, but its boxes are known all the same, so moving one draws.
// Every clone remembers the element it shows (`sourceOf`), so the layers and
// the selection still know what a moved box is.
// =============================================================================

import { analyze, screenRoot, type Analysis } from './analysis'
import { ensurePreview, previewOf } from './preview'
import { isNewRef, NEW_PREFIX, type Place, type Src, type Staged } from './protocol'

export const HIDDEN_ATTR = 'data-design-hidden'
export const GHOST_ATTR = 'data-design-ghost'
/** On an element the list creates: the id its insert or wrap chose. */
export const NEW_ATTR = 'data-design-new'

const q = (src: Src) => `[data-src="${CSS.escape(src)}"]`

function root(): Element | null {
  return document.querySelector('[data-inspect]')
}

/** Clone → the element it shows. Kept across redraws: a clone left over from
 *  an earlier one is gone from the page, and a WeakMap lets it go. */
const sources = new WeakMap<Element, Element>()

/** The element a box on screen shows: itself, or the original a clone was
 *  made from. */
export function sourceOf(el: Element): Element {
  return sources.get(el) ?? el
}

/** What the last redraw read from React, for resolving addresses. */
let lastAnalysis: Analysis | null = null
/** Original → the clone that shows it now, for the redraw in progress. */
let shownAs = new Map<Element, Element>()

/** The element now showing `original`: its moved clone, or itself. A clone
 *  that never made it onto the page (its anchor was gone) shows nothing. */
function currentOf(original: Element): Element {
  let at = original
  for (let guard = 0; guard < 32; guard++) {
    const next = shownAs.get(at)
    if (!next || !next.isConnected) return at
    at = next
  }
  return at
}

/**
 * The elements currently SHOWING an address, in page order — its moved
 * clones where it moved, the originals otherwise, never a hidden one.
 *
 * `all` takes every occurrence (a list's rows); otherwise only the first's,
 * since structural edits are refused on anything that repeats.
 */
export function shownBySrc(src: Src, all = false): Element[] {
  const r = root()
  if (!r) return []
  if (isNewRef(src)) {
    const el = r.querySelector(`[${NEW_ATTR}="${CSS.escape(src.slice(NEW_PREFIX.length))}"]`)
    return el ? [el] : []
  }
  const nodes = lastAnalysis?.bySrc.get(src)
  const hosts = nodes?.length
    ? (all ? nodes : nodes.slice(0, 1)).flatMap((n) => n.hosts)
    : Array.from(r.querySelectorAll(q(src)))
  const out: Element[] = []
  for (const h of hosts) {
    const el = currentOf(h)
    if (el.isConnected && !isHidden(el) && !out.includes(el)) out.push(el)
  }
  if (out.length > 0 || nodes?.length) return out
  return []
}

/** The first element currently showing an address. */
export function visibleBySrc(src: Src): Element | null {
  return shownBySrc(src)[0] ?? null
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
  shownAs = new Map()
}

function cloneOf(el: Element, kind: 'move' | 'copy'): Element {
  const c = el.cloneNode(true) as Element
  // A hidden descendant stays hidden in the copy — it was deleted, and the
  // copy is of the element as it will be written.
  if (c.hasAttribute(HIDDEN_ATTR)) reveal(c)
  c.setAttribute(GHOST_ATTR, kind)
  if (kind === 'move') {
    // A moved clone IS its element, somewhere else: remember which, all the
    // way down, so what is inside it is found through it too.
    const from = [el, ...Array.from(el.querySelectorAll('*'))]
    const to = [c, ...Array.from(c.querySelectorAll('*'))]
    from.forEach((f, i) => {
      const original = sourceOf(f)
      if (!to[i]) return
      sources.set(to[i], original)
      shownAs.set(f, to[i])
    })
  }
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
    sources.set(c, sourceOf(el))
  }
  return c
}

/** Take what shows an address off the screen: hide an original, drop a clone
 *  (its original is already hidden). */
function lift(el: Element) {
  if (el.hasAttribute(GHOST_ATTR)) el.remove()
  else hide(el)
}

/**
 * The DOM node a container's children render into.
 *
 * Usually the element itself. A component can render its children one level
 * down (a card body inside a card frame), and can render OTHER props as
 * elements too — `Screen` draws its `topBar` before its children, in a
 * different box. So the body is the parent of the LAST child the container
 * holds — what the source writes inside it, read from React's tree, or failing
 * that the last addressed element directly in it: children come after props
 * in every component here. With nothing inside, a component's last box is the
 * best guess at its body.
 */
function bodyOf(container: Element, src: Src | null): { body: Element; after: Element | null } {
  const node = src ? lastAnalysis?.bySrc.get(src)?.[0] : undefined
  if (node && lastAnalysis) {
    const kids = lastAnalysis.nodes.filter((n) => n.parent === node && n.slot !== 'prop')
    const shown = kids.flatMap((k) => k.hosts.map(currentOf)).filter((e) => e.isConnected && !isHidden(e))
    const last = shown.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))[shown.length - 1]
    if (last?.parentElement) return { body: last.parentElement, after: last }
  }
  const own = Array.from(container.querySelectorAll('[data-src], [data-design-new]')).filter(
    (d) => d.parentElement?.closest('[data-src], [data-design-new]') === container && !isHidden(d),
  )
  const last = own[own.length - 1]
  if (last?.parentElement) return { body: last.parentElement, after: null }
  if (container.hasAttribute('data-fds') && container.lastElementChild) return { body: container.lastElementChild, after: null }
  return { body: container, after: null }
}

function place(nodes: Element[], to: Place): boolean {
  if (nodes.length === 0) return false
  if ('inside' in to) {
    const container = visibleBySrc(to.inside)
    if (!container) return false
    const { body, after } = bodyOf(container, isNewRef(to.inside) ? null : to.inside)
    if (after) {
      after.after(...nodes)
      return true
    }
    // After the last addressed child, so text or chrome a component draws
    // after its children stays after them.
    const kids = Array.from(body.children).filter(
      (k) => (k.hasAttribute('data-src') || k.hasAttribute(NEW_ATTR)) && !isHidden(k),
    )
    const last = kids[kids.length - 1]
    if (last) last.after(...nodes)
    else body.append(...nodes)
    return true
  }
  // Beside a list is beside all of it.
  const anchors = shownBySrc('before' in to ? to.before : to.after, true)
  if (anchors.length === 0) return false
  if ('before' in to) anchors[0].before(...nodes)
  else anchors[anchors.length - 1].after(...nodes)
  return true
}

/** Whether every real address `op` names is on screen at `version`. */
function current(op: Staged['edit'], version: string): boolean {
  const srcs =
    op.kind === 'move'
      ? [op.src, 'before' in op.to ? op.to.before : 'after' in op.to ? op.to.after : op.to.inside]
      : op.kind === 'insert'
        ? ['before' in op.to ? op.to.before : 'after' in op.to ? op.to.after : op.to.inside]
        : op.kind === 'wrap'
          ? op.srcs
          : [op.src]
  const r = root()
  return srcs.every((src) => {
    if (isNewRef(src)) return true
    const node = lastAnalysis?.bySrc.get(src)?.[0]
    const v = node ? node.version : r?.querySelector(q(src))?.getAttribute('data-src-v')
    return !v || v === version
  })
}

/** A drawing of something the list creates, marked with the id it chose. */
function fresh(html: string | undefined, id: string): Element {
  const t = document.createElement('template')
  t.innerHTML = html ?? ''
  const el = t.content.firstElementChild ?? document.createElement('div')
  el.setAttribute(GHOST_ATTR, 'new')
  el.setAttribute(NEW_ATTR, id)
  return el
}

const inPageOrder = (els: Element[]) =>
  [...els].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))

/**
 * Replay the staged structure onto the live screen.
 *
 * `onPreview` is called when an insert's markup, not yet rendered, becomes
 * available — the caller redraws then.
 */
export function renderOverlay(staged: readonly Staged[], onPreview: () => void = () => {}): void {
  const r = root()
  if (!r) return
  clear(r)
  lastAnalysis = analyze(screenRoot())

  for (const { edit: op, version } of staged) {
    // Positions are only meaningful in the file version they were read from.
    // An op from an older version — the file has been written since — is left
    // undrawn rather than applied to whatever now sits at its line.
    if (version && !current(op, version)) continue

    if (op.kind === 'insert') {
      const html = previewOf(op)
      if (html === undefined) ensurePreview(op, onPreview)
      place([fresh(html, op.id)], op.to)
      continue
    }

    if (op.kind === 'wrap') {
      const groups = op.srcs.map((s) => shownBySrc(s))
      if (groups.some((g) => g.length === 0)) continue
      const els = inPageOrder(groups.flat())
      const wrapper = fresh(undefined, op.id)
      wrapper.setAttribute('class', op.className)
      els[0].before(wrapper)
      for (const e of els) {
        const moved = cloneOf(e, 'move')
        lift(e)
        wrapper.appendChild(moved)
      }
      continue
    }

    // A list's edit takes all its rows; anything else, the first showing.
    const list = 'scope' in op && op.scope === 'list'
    const els = shownBySrc(op.src, list)
    // Not on this screen — a change staged on another screen, or one whose
    // element has not rendered. Nothing to draw; the list still has it.
    if (els.length === 0) continue

    if (op.kind === 'delete') {
      for (const el of els) lift(el)
    } else if (op.kind === 'duplicate') {
      els[els.length - 1].after(...els.map((el) => cloneOf(el, 'copy')))
    } else if (op.kind === 'unwrap') {
      const el = els[0]
      const kids = Array.from(bodyOf(el, op.src).body.children).filter((k) => !isHidden(k))
      for (const k of kids) el.before(k.hasAttribute(GHOST_ATTR) ? k : cloneOf(k, 'move'))
      for (const k of kids) if (!k.hasAttribute(GHOST_ATTR)) lift(k)
      lift(el)
    } else {
      const moved = els.map((el) => cloneOf(el, 'move'))
      for (const el of els) lift(el)
      if (!place(moved, op.to)) {
        // The anchor is gone (deleted earlier in the list, or not rendered):
        // show the element where it was rather than nowhere.
        for (const el of els) if (el.isConnected) reveal(el)
      }
    }
  }

  // A new stack with nothing in it yet has no height: nothing to see, nothing
  // to drop onto. Give it a visible slot until something lands in it. Only on
  // our own drawings, so it can never leak into the written screen.
  for (const g of Array.from(r.querySelectorAll(`[${GHOST_ATTR}="new"]`))) {
    if (!(g instanceof HTMLElement) || g.tagName !== 'DIV' || g.childElementCount > 0) continue
    g.style.setProperty('min-height', '32px')
    g.style.setProperty('outline', '1px dashed var(--primary-400)')
    g.style.setProperty('outline-offset', '-1px')
    g.style.setProperty('border-radius', '4px')
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
  getOps: () => readonly Staged[],
  onRedraw: () => void,
  /** Whether anything is staged at all — value edits need repainting too. */
  active: () => boolean = () => getOps().length > 0,
): { stop: () => void; redraw: () => void } {
  const r = root()
  if (!r) return { stop: () => {}, redraw: () => {} }

  let frame = 0
  const redraw = () => {
    frame = 0
    const ops = getOps()
    // Stop observing while we write, or the redraw would trigger itself.
    mo.disconnect()
    renderOverlay(ops, () => {
      if (!frame) frame = requestAnimationFrame(redraw)
    })
    // Before observing again: the callback repaints, and its writes must not
    // read as the screen changing.
    onRedraw()
    observe()
  }

  const ours = (node: Node) =>
    node instanceof Element && (node.hasAttribute(GHOST_ATTR) || node.closest?.('[data-inspect-layer]') !== null)

  const mo = new MutationObserver((records) => {
    if (!active()) return
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

/**
 * The element that now shows `el` — itself if it is still on screen, else
 * whatever carries its address (or its new-element id) and is visible.
 */
export function refind(el: Element): Element | null {
  if (el.isConnected && !isHidden(el)) return el
  const src = el.getAttribute('data-src')
  if (src) return visibleBySrc(src)
  const id = el.getAttribute(NEW_ATTR)
  if (id) return visibleBySrc(`${NEW_PREFIX}${id}`)
  return null
}
