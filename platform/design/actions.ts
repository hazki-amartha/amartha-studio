// =============================================================================
// Design · structural actions on a selected element.
//
// One implementation behind every way of asking: the panel's Arrange buttons,
// the keyboard, a drag on the canvas, a drag in Layers. Each turns a DOM
// element into an addressed edit, refuses up front what the write would
// refuse anyway, and stages it — the overlay draws the result from there.
// =============================================================================

import { srcOf, peersOf } from './applyDom'
import { fileOf, stageStructuralEdit, type StageContext } from './designStore'
import { GHOST_ATTR, isHidden } from './overlay'
import type { Place, Src } from './protocol'
import { CONTAINER_COMPONENTS, LEAF_COMPONENTS, VOID_TAGS } from './vocabulary'

/** What the panel needs to stage: project, screen, and the file version. */
export function stageContext(el: Element, slug: string, screenId: string): StageContext {
  return { slug, screenId, version: el.getAttribute('data-src-v') ?? undefined }
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

const usable = (el: Element, file: string): boolean => {
  const src = srcOf(el)
  return Boolean(src && fileOf(src) === file && !isHidden(el) && el.getAttribute(GHOST_ATTR) !== 'copy')
}

/**
 * The neighbour a one-step move goes past, as a place — or null at either end.
 *
 * Neighbours are DOM siblings that are addressed in the same file; anything
 * else in between (a wrapper a component drew, a copy not yet written) is
 * stepped over rather than treated as a place the write could name.
 */
export function stepPlace(el: Element, dir: -1 | 1): { to: Place; past: Element } | null {
  const src = srcOf(el)
  if (!src) return null
  const file = fileOf(src)
  let sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling
  while (sib && !usable(sib, file)) {
    sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling
  }
  if (!sib) return null
  const at = srcOf(sib) as Src
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
 * Whether a drop INTO `el` would be accepted — the client twin of `canHold` in
 * structure.ts, judged from the DOM. A component is judged by its name, an
 * HTML element by its tag.
 */
export function canHoldDom(el: Element): boolean {
  const fds = el.getAttribute('data-fds')
  if (fds) return CONTAINER_COMPONENTS.includes(fds) || !LEAF_COMPONENTS.includes(fds)
  return !VOID_TAGS.includes(el.tagName.toLowerCase())
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
      const to = srcOf(target)
      if (!from || !to || fileOf(from) !== fileOf(to)) return false
      if (target.getAttribute(GHOST_ATTR) === 'copy' || isHidden(target)) return false
      if (where === 'inside') return canHoldDom(target)
      return target.getAttribute('data-fds') !== 'Screen'
    },
    onDrop: (dragged: Element, target: Element, where: Where) => {
      const to = srcOf(target)
      if (!to) return
      const place: Place =
        where === 'inside' ? { inside: to } : where === 'before' ? { before: to } : { after: to }
      moveTo(dragged, place, target, slug, screenId)
    },
  }
}
