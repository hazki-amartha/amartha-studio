// =============================================================================
// Design · structural actions on a selected element.
//
// One implementation behind every way of asking: the panel's Arrange buttons,
// the keyboard, a drag on the canvas, a drag in Layers. Each turns a DOM
// element into an addressed edit, refuses up front what the write would
// refuse anyway, and stages it — the overlay draws the result from there.
// =============================================================================

import { applyLayoutPatch, srcOf, peersOf } from './applyDom'
import { catalogItem } from './catalog'
import {
  fileOf,
  fileOfEdit,
  newEdit,
  newId,
  removeNew,
  stageStackEdit,
  stageStructuralEdit,
  updateNew,
  type StageContext,
} from './designStore'
import { layoutOf, withLayout, type Layout } from './layout'
import { GHOST_ATTR, isHidden, NEW_ATTR } from './overlay'
import { NEW_PREFIX, type InsertEdit, type Place, type Src, type WrapEdit } from './protocol'
import { pinAfterRedraw } from './selection'
import { BOX_TAGS, CONTAINER_COMPONENTS, LEAF_COMPONENTS } from './vocabulary'

/** What an element is called in an edit: its address, or `new:<id>` for one
 *  the list creates. */
export function addressOf(el: Element): Src | null {
  const src = srcOf(el)
  if (src) return src
  const id = el.getAttribute(NEW_ATTR)
  return id ? `${NEW_PREFIX}${id}` : null
}

/** The file an element's edits land in. */
export function fileOfElement(el: Element): string | null {
  const src = srcOf(el)
  if (src) return fileOf(src)
  const id = el.getAttribute(NEW_ATTR)
  const maker = id ? newEdit(id) : undefined
  return maker ? fileOfEdit(maker) : null
}

/** The file version to send with an edit made from `el`: its own, or, for a
 *  new element, the version of the nearest addressed element around it. */
function versionOf(el: Element): string | undefined {
  const v = el.getAttribute('data-src-v') ?? el.closest('[data-src-v]')?.getAttribute('data-src-v')
  return v ?? undefined
}

/** What the panel needs to stage: project, screen, and the file version. */
export function stageContext(el: Element, slug: string, screenId: string): StageContext {
  return { slug, screenId, version: versionOf(el) }
}

/**
 * Why `el` can't be moved, deleted or duplicated from the panel — or null.
 *
 * Mirrors the write side's own refusals where the client can see the reason
 * coming, so the designer gets it on the button rather than after Apply.
 */
export function structuralBlock(el: Element, slug: string): string | null {
  if (el.getAttribute(GHOST_ATTR) === 'copy' || el.closest(`[${GHOST_ATTR}="copy"]`)) {
    return 'This is a new copy. Apply first, then it can be changed like anything else.'
  }
  const src = srcOf(el)
  if (!src) return 'This is inside a component, so it moves with the component.'
  if (!fileOf(src).startsWith(`projects/${slug}/`)) {
    return 'This comes from the project this prototype builds on, so it can’t be rearranged here.'
  }
  if (el.getAttribute('data-fds') === 'Screen') return 'This is the screen itself.'
  const peers = peersOf(src).filter((p) => !isHidden(p) && !p.hasAttribute(GHOST_ATTR))
  if (peers.length > 1) {
    return `This repeats ${peers.length} times from one line of code (a list), so it can only be rearranged there.`
  }
  return null
}

/** A short name for an element in a change label: `Card`, `span “Total”`. */
export function describe(el: Element): string {
  const name = el.getAttribute('data-fds') ?? el.tagName.toLowerCase()
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!text || el.children.length > 2) return name
  return `${name} “${text.length > 18 ? `${text.slice(0, 17)}…` : text}”`
}

const usable = (el: Element, file: string): boolean =>
  fileOfElement(el) === file && !isHidden(el) && el.getAttribute(GHOST_ATTR) !== 'copy'


/**
 * The neighbour a one-step move goes past, as a place — or null at either end.
 *
 * Neighbours are DOM siblings that are addressed in the same file; anything
 * else in between (a wrapper a component drew, a copy not yet written) is
 * stepped over rather than treated as a place the write could name.
 */
export function stepPlace(el: Element, dir: -1 | 1): { to: Place; past: Element } | null {
  const file = fileOfElement(el)
  if (!file) return null
  let sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling
  while (sib && !usable(sib, file)) {
    sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling
  }
  if (!sib) return null
  const at = addressOf(sib) as Src
  return { to: dir < 0 ? { before: at } : { after: at }, past: sib }
}

export function moveStep(el: Element, dir: -1 | 1, slug: string, screenId: string): boolean {
  const src = srcOf(el)
  const step = stepPlace(el, dir)
  if (!src || !step || structuralBlock(el, slug)) return false
  stageStructuralEdit(
    stageContext(el, slug, screenId),
    { kind: 'move', src, to: step.to },
    `Move ${describe(el)} ${dir < 0 ? 'above' : 'below'} ${describe(step.past)}`,
  )
  return true
}

export function moveTo(
  el: Element,
  to: Place,
  target: Element,
  slug: string,
  screenId: string,
): boolean {
  const src = srcOf(el)
  if (!src || structuralBlock(el, slug)) return false
  const how = 'before' in to ? 'above' : 'after' in to ? 'below' : 'into'
  stageStructuralEdit(
    stageContext(el, slug, screenId),
    { kind: 'move', src, to },
    `Move ${describe(el)} ${how} ${describe(target)}`,
  )
  return true
}

export function removeElement(el: Element, slug: string, screenId: string): boolean {
  if (el.hasAttribute(NEW_ATTR)) return removeNewElement(el)
  const src = srcOf(el)
  if (!src || structuralBlock(el, slug)) return false
  stageStructuralEdit(stageContext(el, slug, screenId), { kind: 'delete', src }, `Delete ${describe(el)}`)
  return true
}

export function duplicateElement(el: Element, slug: string, screenId: string): boolean {
  const src = srcOf(el)
  if (!src || structuralBlock(el, slug)) return false
  stageStructuralEdit(
    stageContext(el, slug, screenId),
    { kind: 'duplicate', src },
    `Duplicate ${describe(el)}`,
  )
  return true
}

/**
 * Whether the panel offers a drop INTO `el` — the client twin of `canHold` in
 * structure.ts, judged from the DOM, and a little stricter (see BOX_TAGS). A
 * component is judged by its name, an HTML element by its tag.
 */
export function canHoldDom(el: Element): boolean {
  const fds = el.getAttribute('data-fds')
  if (fds) return CONTAINER_COMPONENTS.includes(fds) || !LEAF_COMPONENTS.includes(fds)
  return BOX_TAGS.includes(el.tagName.toLowerCase())
}

/**
 * Rearranging from the Layers list. Accepts only what the canvas drag would:
 * an addressed element in the same file, never a copy, and never beside the
 * screen itself (into it is fine — that is "last on the screen").
 */
export function layersDrag(slug: string, screenId: string) {
  type Where = 'before' | 'after' | 'inside'
  return {
    canDrag: (el: Element) => structuralBlock(el, slug) === null,
    accepts: (dragged: Element, target: Element, where: Where) => {
      const from = srcOf(dragged)
      const to = addressOf(target)
      if (!from || !to || fileOf(from) !== fileOfElement(target)) return false
      if (target.getAttribute(GHOST_ATTR) === 'copy' || isHidden(target)) return false
      if (where === 'inside') return canHoldDom(target)
      return target.getAttribute('data-fds') !== 'Screen'
    },
    onDrop: (dragged: Element, target: Element, where: Where) => {
      const to = addressOf(target)
      if (!to) return
      const place: Place =
        where === 'inside' ? { inside: to } : where === 'before' ? { before: to } : { after: to }
      moveTo(dragged, place, target, slug, screenId)
    },
  }
}

// --- D3: insert, wrap, unwrap ---------------------------------------------------

/**
 * Where an Insert-panel click puts things: inside the selection when it can
 * hold children, right after it otherwise, and at the end of the screen when
 * nothing is selected.
 */
export function insertPlace(pinned: Element | null, slug: string): { to: Place; near: Element; how: string } | null {
  const inProject = (el: Element) => (fileOfElement(el) ?? '').startsWith(`projects/${slug}/`)
  if (pinned && inProject(pinned) && !isHidden(pinned) && pinned.getAttribute(GHOST_ATTR) !== 'copy') {
    const at = addressOf(pinned)
    if (at) {
      if (canHoldDom(pinned)) return { to: { inside: at }, near: pinned, how: 'inside' }
      if (pinned.getAttribute('data-fds') !== 'Screen') return { to: { after: at }, near: pinned, how: 'below' }
    }
  }
  const screen = Array.from(document.querySelectorAll('[data-inspect] [data-fds="Screen"][data-src]')).find(
    (el) => inProject(el) && !isHidden(el),
  )
  const at = screen ? addressOf(screen) : null
  return screen && at ? { to: { inside: at }, near: screen, how: 'at the end of' } : null
}

export function insertItem(
  key: string,
  to: Place,
  near: Element,
  slug: string,
  screenId: string,
  icon?: string,
): string | null {
  const item = catalogItem(key)
  if (!item) return null
  const id = newId()
  stageStructuralEdit(
    stageContext(near, slug, screenId),
    { kind: 'insert', id, to, item: key, icon, props: { ...item.props } },
    `Add ${icon ?? item.label} ${'inside' in to ? 'into' : 'before' in to ? 'above' : 'below'} ${describe(near)}`,
  )
  pinAfterRedraw(`${NEW_PREFIX}${id}`)
  return id
}

/** Whether children of `el` flow left-to-right. */
export function isRow(el: Element | null): boolean {
  if (!el) return false
  const s = getComputedStyle(el)
  return s.display.includes('flex') && s.flexDirection.startsWith('row')
}

/**
 * The selection in document order, if it can be wrapped: all in one parent,
 * side by side, from one file. Otherwise the reason it can't.
 */
export function wrappable(els: Element[], slug: string): Element[] | string {
  if (els.length === 0) return 'Select something first.'
  for (const el of els) {
    const blocked = el.hasAttribute(NEW_ATTR) ? null : structuralBlock(el, slug)
    if (blocked) return blocked
  }
  const sorted = [...els].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )
  const parent = sorted[0].parentElement
  const file = fileOfElement(sorted[0])
  if (sorted.some((e) => e.parentElement !== parent || fileOfElement(e) !== file)) {
    return 'Only elements side by side in the same container can be wrapped together.'
  }
  // Nothing addressable between them that isn't selected.
  let at: Element | null = sorted[0]
  const last = sorted[sorted.length - 1]
  while (at && at !== last) {
    at = at.nextElementSibling
    if (at && file && usable(at, file) && !sorted.includes(at)) {
      return 'Only elements side by side can be wrapped together — something else sits between them.'
    }
  }
  return sorted
}

export function wrapElements(els: Element[], slug: string, screenId: string): string | null {
  const sorted = wrappable(els, slug)
  if (typeof sorted === 'string') return null
  const srcs = sorted.map(addressOf).filter((s): s is Src => s !== null)
  if (srcs.length !== sorted.length) return null
  const id = newId()
  const className = isRow(sorted[0].parentElement) ? 'flex items-center gap-8' : 'flex flex-col gap-12'
  stageStructuralEdit(
    stageContext(sorted[0], slug, screenId),
    { kind: 'wrap', id, srcs, className },
    sorted.length === 1 ? `Wrap ${describe(sorted[0])} in a stack` : `Wrap ${sorted.length} elements in a stack`,
  )
  pinAfterRedraw(`${NEW_PREFIX}${id}`)
  return id
}

/** Whether `el` is a plain wrapper that unwrap would accept. */
export function unwrappable(el: Element, slug: string): boolean {
  if (structuralBlock(el, slug) || el.hasAttribute(NEW_ATTR)) return false
  if (el.tagName !== 'DIV' || el.hasAttribute('data-fds')) return false
  return Array.from(el.children).some((k) => !isHidden(k))
}

export function unwrapElement(el: Element, slug: string, screenId: string): boolean {
  const src = srcOf(el)
  if (!src || !unwrappable(el, slug)) return false
  stageStructuralEdit(stageContext(el, slug, screenId), { kind: 'unwrap', src }, `Unwrap ${describe(el)}`)
  return true
}

/**
 * What Unwrap acts on for a selection: the element itself when it is a plain
 * stack, otherwise the stack it sits in — so a child can take its own stack
 * away, as the stack itself can. A stack that is still only staged is taken
 * off the list instead of being unwrapped.
 */
export function unwrapTarget(el: Element, slug: string): Element | null {
  const own = el.getAttribute(NEW_ATTR)
  if (own) return newEdit(own)?.kind === 'wrap' ? el : null
  if (unwrappable(el, slug)) return el
  const parent = el.parentElement?.closest('[data-src], [data-design-new]') ?? null
  if (!parent) return null
  const staged = parent.getAttribute(NEW_ATTR)
  if (staged) return newEdit(staged)?.kind === 'wrap' ? parent : null
  return unwrappable(parent, slug) ? parent : null
}

/** Unwrap the selection's stack (see unwrapTarget). */
export function unwrapAt(el: Element, slug: string, screenId: string): boolean {
  const target = unwrapTarget(el, slug)
  if (!target) return false
  if (target.hasAttribute(NEW_ATTR)) return removeNewElement(target)
  return unwrapElement(target, slug, screenId)
}

/** Delete, for a new element: take it — and whatever depends on it — off the list. */
export function removeNewElement(el: Element): boolean {
  const id = el.getAttribute(NEW_ATTR)
  if (!id) return false
  removeNew(id)
  return true
}

// --- D3: stack layout ------------------------------------------------------------

/**
 * Change an element's auto layout — the one path for the panel's knobs and
 * the canvas gap handles. A written element stages a `stack` edit and repaints
 * now; a new one has the class list in its staged definition rewritten.
 */
export function setLayout(el: Element, patch: Partial<Layout>, slug: string, screenId: string): void {
  const current = layoutOf(Array.from(el.classList))
  const next = { ...current, ...patch }
  if (next.direction === null) {
    next.gap = null
    next.align = null
    next.justify = null
  }
  const id = el.getAttribute(NEW_ATTR)
  if (id) {
    updateNew(id, (e) => withClassName(e, (classes) => withLayout(classes, next)))
    return
  }
  const src = srcOf(el)
  if (!src) return
  stageStackEdit(stageContext(el, slug, screenId), src, current, next, `${describe(el)} layout`)
  applyLayoutPatch(src, next)
}

function withClassName(
  e: InsertEdit | WrapEdit,
  change: (classes: string[]) => string[],
): InsertEdit | WrapEdit {
  const split = (s: string | undefined) => (s ?? '').split(/\s+/).filter(Boolean)
  if (e.kind === 'wrap') return { ...e, className: change(split(e.className)).join(' ') }
  const className = change(split(e.props.className)).join(' ')
  const props = { ...e.props }
  if (className) props.className = className
  else delete props.className
  return { ...e, props }
}

/**
 * The gaps between a stack's children, in page coordinates — what the canvas
 * handles are drawn over. Empty unless `el` is a stack with two or more
 * visible children.
 */
export function gapsOf(el: Element): { rect: DOMRect; row: boolean }[] {
  const layout = layoutOf(Array.from(el.classList))
  if (!layout.direction) return []
  const row = layout.direction === 'row'
  const kids = Array.from(el.children).filter((k) => {
    if (isHidden(k)) return false
    const r = k.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  })
  const box = el.getBoundingClientRect()
  const out: { rect: DOMRect; row: boolean }[] = []
  for (let i = 1; i < kids.length; i++) {
    const a = kids[i - 1].getBoundingClientRect()
    const b = kids[i].getBoundingClientRect()
    if (row) {
      const w = Math.max(b.left - a.right, 4)
      out.push({ rect: new DOMRect(b.left - w, box.top, w, box.height), row })
    } else {
      const h = Math.max(b.top - a.bottom, 4)
      out.push({ rect: new DOMRect(box.left, b.top - h, box.width, h), row })
    }
  }
  return out
}
