// =============================================================================
// Design · optimistic DOM application.
//
// A nudge repaints the live element instantly; the file write follows on Apply.
// When the write lands, fast refresh re-renders the screen from source and the
// optimistic patch is superseded by the real thing — so this layer never needs
// to be undone, only to not lie in the meantime.
//
// Everything here is keyed by `data-src`, the address the build stamps onto
// every JSX element in a project screen. That replaces the v1 approach of
// matching on tag + class list + rendered text, and fixes its one real lie:
//
//   `.map()` rows share a single source line, so editing "one" of them edits
//   ALL of them. v1 approximated that set by looking for elements with an
//   identical className string, which was a heuristic that could over- or
//   under-reach. Elements from one `.map()` share one `data-src`, so the set is
//   now exact — and it is the same set the file write will really change. The
//   panel reports the count up front ("applies to 4 items"), which is the
//   instance model a designer already knows from Figma.
// =============================================================================

import { artworkSrc, COMPONENT_BASE, COMPONENT_PROPS } from './componentProps'
import { withLayout, type Layout } from './layout'
import { isHidden, visibleBySrc } from './overlay'
import { isStructural, type Edit, type Src } from './protocol'

/** The address of the element, or null when it has none. `design-system/` and
 *  `platform/` are never stamped, so their internals are unaddressable — which
 *  is what makes them unselectable rather than a rule anyone has to enforce. */
export function srcOf(el: Element): Src | null {
  return el.getAttribute('data-src')
}

/** Every element rendered from the same JSX node — one element normally, N for
 *  a `.map()`. This is exactly the set a single write will change. */
export function peersOf(src: Src): Element[] {
  const root = document.querySelector('[data-inspect]')
  if (!root) return []
  return Array.from(root.querySelectorAll(`[data-src="${CSS.escape(src)}"]`))
}

/** How many elements on screen one write to `src` really changes — the
 *  peers, minus originals the overlay has hidden behind their moved copy. */
export function countPeers(src: Src): number {
  return peersOf(src).filter((p) => !isHidden(p)).length
}

/** Re-find an element after fast refresh remounted the screen, or after the
 *  overlay redrew a moved copy. The address survives both, so this is a
 *  lookup rather than the v1 guess. */
export function findBySrc(src: Src): Element | null {
  return visibleBySrc(src)
}

/**
 * Repaint a component for a prop change, live.
 *
 * A component styles itself from its props, so unlike a token swap there is no
 * authored class to exchange — the `ds-*` class comes from inside the
 * component. Swapping it here from the same table the component uses is what
 * makes "make this button secondary" visible immediately rather than only
 * after the file write.
 *
 * The styled node is found by the component's base class rather than assumed
 * to be the pinned one: Input and Toggle stamp `data-fds` on their outermost
 * wrapper when they render a labelled field, leaving the size class inside.
 *
 * A brand asset's `name` picks the file its <img> shows, so that preview points
 * the image at the new file instead (`artworkSrc`).
 *
 * Returns whether a visual change was made — false for props whose effect
 * isn't a class or artwork (an input's `type`), which the panel reports
 * rather than leaving the designer waiting for a repaint that never comes.
 */
export function applyPropPreview(
  el: Element,
  component: string,
  prop: string,
  from: string,
  to: string,
): boolean {
  const meta = COMPONENT_PROPS[component]?.find((p) => p.prop === prop)
  if (!meta) return false

  // The attribute is the panel's own source of truth for "what is it now", so
  // it moves whether or not anything repaints.
  el.setAttribute(`data-fds-${meta.attr}`, to)
  if (meta.artwork) {
    const src = el.getAttribute('src')
    const next = src && artworkSrc(src, from, to)
    if (!next || next === src) return false
    el.setAttribute('src', next)
    return true
  }
  if (!meta.classes) return false

  const base = COMPONENT_BASE[component]
  const styled = !base
    ? el
    : el.matches(`.${base}`)
      ? el
      : el.querySelector(`.${base}`)
  if (!styled) return false

  const before = meta.classes[from]
  const after = meta.classes[to]
  if (before) styled.classList.remove(before)
  if (after) styled.classList.add(after)
  return true
}

/** Swap a class on every element rendered from this JSX node. */
export function applyClassSwap(src: Src, oldClass: string, newClass: string) {
  for (const peer of peersOf(src)) {
    if (peer.classList.contains(oldClass)) peer.classList.replace(oldClass, newClass)
    else peer.classList.add(newClass)
  }
}

/** Give every element rendered from this JSX node a stack layout. Only the
 *  four layout families change; every other class stays where it is. */
export function applyLayoutPatch(src: Src, to: Layout) {
  for (const peer of peersOf(src)) {
    peer.setAttribute('class', withLayout(Array.from(peer.classList), to).join(' '))
  }
}

/** Set text on every element rendered from this JSX node. */
export function applyTextSwap(src: Src, next: string) {
  for (const peer of peersOf(src)) if (peer.textContent !== next) peer.textContent = next
}

/**
 * Swap the words on the elements drawn from `shows` that read exactly `from`.
 *
 * For text that is written somewhere else than the element showing it — a
 * component's prop (`<StatCell label="…" />` shown by StatCell's `<p>`), or a
 * string in a data file shown by a list's row. Every StatCell's `<p>` shares
 * one address, so the words are what tells the one being changed apart.
 */
export function applyShownText(shows: Src, from: string, to: string) {
  for (const peer of peersOf(shows)) {
    if (peer.children.length === 0 && (peer.textContent ?? '').trim() === from) peer.textContent = to
  }
}

/** A staged edit as the optimistic layer needs it. */
export interface Patch {
  edit: Edit
  component?: string
  /** Text-like edits written away from the element showing them. */
  shows?: Src
}

/** The words a text-like edit changes, as `[from, to]`, or null. */
function wordsOf(edit: Edit): [string, string] | null {
  if (edit.kind === 'literal' || edit.kind === 'text') return [edit.old, edit.next]
  if (edit.kind === 'prop' && edit.old !== null && edit.next !== null) return [edit.old, edit.next]
  return null
}

/**
 * Reverse a staged edit's optimistic patch — used when a pending change is
 * removed before Apply. A miss is harmless: the file was never touched, so any
 * repaint from source is correct.
 *
 * Far simpler than the v1 version, which had to re-derive which elements it had
 * patched by searching for the value it had written. The address is enough.
 */
export function revertStagedPatch({ edit, component, shows }: Patch) {
  // Structure has no patch to reverse: the overlay redraws from the list.
  if (isStructural(edit)) return
  const text = shows ? wordsOf(edit) : null
  if (shows && text) {
    applyShownText(shows, text[1], text[0])
    return
  }
  if (edit.kind === 'literal') return
  if (edit.kind === 'class') {
    applyClassSwap(edit.src, edit.newClass, edit.oldClass)
    return
  }
  if (edit.kind === 'text') {
    applyTextSwap(edit.src, edit.old)
    return
  }
  if (edit.kind === 'stack') {
    applyLayoutPatch(edit.src, edit.old)
    return
  }
  if (!component) return
  // Same path as applying, run backwards — so a removed prop change puts the
  // component's own styling back, not just its stamp.
  // A null on either side means the prop was added or removed, and "how the
  // component renders without it" is not something a class swap can express.
  // The fast refresh after the next write shows the truth; until then the
  // optimistic layer stays quiet rather than inventing a state.
  if (edit.old === null || edit.next === null) return
  for (const peer of peersOf(edit.src)) {
    applyPropPreview(peer, component, edit.prop, edit.next, edit.old)
  }
}

/**
 * Paint a staged value edit again — after React re-rendered its element, or
 * on a screen reopened with a restored list. Each patch is idempotent: a swap
 * whose old class is already gone just makes sure the new one is there.
 */
export function repaint({ edit, component, shows }: Patch) {
  const text = shows ? wordsOf(edit) : null
  if (shows && text) applyShownText(shows, text[0], text[1])
  else if (edit.kind === 'class') applyClassSwap(edit.src, edit.oldClass, edit.newClass)
  else if (edit.kind === 'text') applyTextSwap(edit.src, edit.next)
  else if (edit.kind === 'stack') applyLayoutPatch(edit.src, edit.next)
  else if (edit.kind === 'prop' && component && edit.old !== null && edit.next !== null) {
    for (const peer of peersOf(edit.src)) {
      if (peer.getAttribute(`data-fds-${attrOf(component, edit.prop)}`) !== edit.next) {
        applyPropPreview(peer, component, edit.prop, edit.old, edit.next)
      }
    }
  }
}

function attrOf(component: string, prop: string): string {
  return COMPONENT_PROPS[component]?.find((p) => p.prop === prop)?.attr ?? prop
}
