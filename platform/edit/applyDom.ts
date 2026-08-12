// =============================================================================
// Edit · optimistic DOM application.
//
// A nudge repaints the live element instantly; the file write follows on the
// debounce. When the write lands, fast refresh re-renders the screen from
// source and the optimistic patch is superseded by the real thing — so this
// layer never needs to be undone, only to not lie in the meantime.
//
// The one place lying is possible: elements rendered by a `.map()` share a
// single source line, so editing "one" of them edits all of them. The patch
// therefore applies to every element with the identical className string, and
// reports the count so the panel can say "applies to 4 items" up front.
// =============================================================================

import { COMPONENT_BASE, COMPONENT_PROPS } from './componentProps'

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

/** Every element in the viewport sharing `el`'s exact className — the set a
 *  single-source-line edit will really change. Always includes `el`. */
export function classPeers(el: Element): Element[] {
  const root = el.closest('[data-inspect]')
  if (!root) return [el]
  const cls = el.getAttribute('class') ?? ''
  return Array.from(root.querySelectorAll(el.tagName)).filter(
    (peer) => (peer.getAttribute('class') ?? '') === cls,
  )
}

/** Swap a class on the element and all its peers, live. */
export function applyClassSwap(el: Element, oldClass: string, newClass: string) {
  for (const peer of classPeers(el)) {
    if (peer.classList.contains(oldClass)) peer.classList.replace(oldClass, newClass)
    else peer.classList.add(newClass)
  }
}

/**
 * Reverse a staged edit's optimistic patch on the live DOM — used when a
 * pending change is removed before Apply. Finds the patched element(s) by what
 * they currently show (the NEW value) and puts the old value back. A miss is
 * harmless: the file was never touched, so any repaint from source is correct.
 */
export function revertStagedPatch(
  edit:
    | { kind: 'class'; find: string[]; oldClass: string; newClass: string }
    | { kind: 'text'; old: string; next: string }
    | { kind: 'prop'; component: string; prop: string; old: string; next: string },
  attrOfProp?: string,
) {
  const root = document.querySelector('[data-inspect]')
  if (!root) return

  if (edit.kind === 'class') {
    const rendered = edit.find.map((c) => (c === edit.oldClass ? edit.newClass : c))
    for (const el of Array.from(root.querySelectorAll('*'))) {
      if (rendered.every((c) => el.classList.contains(c))) {
        el.classList.replace(edit.newClass, edit.oldClass)
      }
    }
    return
  }

  if (edit.kind === 'text') {
    for (const el of Array.from(root.querySelectorAll('*'))) {
      if (el.children.length === 0 && (el.textContent ?? '') === edit.next) {
        el.textContent = edit.old
        return
      }
    }
    return
  }

  const attr = attrOfProp ?? edit.prop
  const el = root.querySelector(`[data-fds="${edit.component}"][data-fds-${attr}="${edit.next}"]`)
  // Same path as applying, run backwards — so a removed prop change puts the
  // component's own styling back, not just its stamp.
  if (el) applyPropPreview(el, edit.component, edit.prop, edit.next, edit.old)
}

/** What re-finds the element after fast refresh remounts the screen. */
export interface Repin {
  tag: string
  classes: string[]
  text: string
}

export function repinOf(el: Element): Repin {
  return {
    tag: el.tagName,
    classes: Array.from(el.classList),
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
  }
}

/**
 * Find the remounted element matching a repin record. Classes must all be
 * present (a just-written token swap means the NEW class list is what renders);
 * among class matches, matching text breaks ties, else the first wins — for
 * mapped rows any peer is equally true.
 */
export function findRepin(repin: Repin, updatedClass?: { oldClass: string; newClass: string }): Element | null {
  const root = document.querySelector('[data-inspect]')
  if (!root) return null

  const wanted = updatedClass
    ? repin.classes.map((c) => (c === updatedClass.oldClass ? updatedClass.newClass : c))
    : repin.classes

  const candidates = Array.from(root.querySelectorAll(repin.tag)).filter((el) =>
    wanted.every((c) => el.classList.contains(c)),
  )
  if (candidates.length === 0) return null
  return (
    candidates.find(
      (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().startsWith(repin.text),
    ) ?? candidates[0]
  )
}
