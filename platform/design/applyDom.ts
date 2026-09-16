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

import { COMPONENT_BASE, COMPONENT_PROPS } from './componentProps'
import type { Edit, Src } from './protocol'

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

/** Re-find an element after fast refresh remounted the screen. The address
 *  survives the remount, so this is a lookup rather than the v1 guess. */
export function findBySrc(src: Src): Element | null {
  return peersOf(src)[0] ?? null
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
 * Returns whether a visual change was made — false for props whose effect
 * isn't a class (a swapped icon, an input's `type`), which the panel reports
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

/** Set text on every element rendered from this JSX node. */
export function applyTextSwap(src: Src, next: string) {
  for (const peer of peersOf(src)) peer.textContent = next
}

/**
 * Reverse a staged edit's optimistic patch — used when a pending change is
 * removed before Apply. A miss is harmless: the file was never touched, so any
 * repaint from source is correct.
 *
 * Far simpler than the v1 version, which had to re-derive which elements it had
 * patched by searching for the value it had written. The address is enough.
 */
export function revertStagedPatch(edit: Edit, component?: string) {
  if (edit.kind === 'class') {
    applyClassSwap(edit.src, edit.newClass, edit.oldClass)
    return
  }
  if (edit.kind === 'text') {
    applyTextSwap(edit.src, edit.old)
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
