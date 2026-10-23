// =============================================================================
// Design · what the screen is made of, read from React's own tree.
//
// The build stamps every JSX element in a project with `data-src` (stamp.cjs),
// and an HTML element carries that stamp onto the page. A COMPONENT doesn't:
// `<StatCell label="…" />` hands `data-src` to StatCell as a prop, and unless
// StatCell passes it on — the project's own components never do — the page
// has no trace of where the StatCell was written. All the page shows is the
// markup inside StatCell, stamped with lib/ui.tsx and shared by every
// StatCell on every screen. So a click on one landed on all of them: "this
// repeats 2 times", or a change that quietly restyled every copy.
//
// React still knows. Every element it rendered is a fiber, and a fiber keeps
// the props it was given — `data-src` included, whoever it was given to. This
// walks the screen's fibers once and returns the JSX the designer wrote:
//
//   • every stamped element, HTML or component, with the DOM boxes it draws;
//   • which element it is written inside (its `parent`) — the JSX nesting,
//     not the DOM's: children handed to a component are written inside the
//     component's usage, wherever its own markup puts them;
//   • which component instance's own code drew it (`owner`) — null for the
//     screen's own markup, StatCell's usage for the `<p>` inside StatCell;
//   • how it sits in its parent (`slot`): a plain child, a row of a `.map()`,
//     a prop's value (`topBar={…}`), or a component's root.
//
// Read-only, and nothing here is kept between calls: the caller decides when
// the screen has changed enough to ask again.
//
// React's internals are not an API. Everything below degrades to "nothing
// found" rather than throwing, and the rest of design mode falls back to the
// stamps on the page — exactly what it did before this existed.
// =============================================================================

import type { Src } from './protocol'

// --- React's fibers, as far as they are read here ----------------------------

export interface Fiber {
  tag: number
  key: string | null
  type: unknown
  stateNode: unknown
  return: Fiber | null
  child: Fiber | null
  sibling: Fiber | null
  memoizedProps: Record<string, unknown> | null
  alternate: Fiber | null
}

const HOST_ROOT = 3
const HOST = 5
const COMPONENT_TAGS = new Set([0, 1, 11, 14, 15])

export const isHostFiber = (f: Fiber) => f.tag === HOST
export const isComponentFiber = (f: Fiber) => COMPONENT_TAGS.has(f.tag)

let fiberKey: string | null = null

/** The fiber React keeps on a DOM element — possibly a render behind. */
export function fiberOf(el: Element): Fiber | null {
  const bag = el as unknown as Record<string, Fiber | undefined>
  if (fiberKey && bag[fiberKey]) return bag[fiberKey] ?? null
  fiberKey = Object.keys(el).find((k) => k.startsWith('__reactFiber$')) ?? null
  return fiberKey ? (bag[fiberKey] ?? null) : null
}

/**
 * The CURRENT fiber for a DOM element.
 *
 * React keeps two fibers per element and flips between them on every render;
 * the one stamped on the DOM node is whichever created it, so its props can be
 * a render old. The current tree is the one the root points at, so walk up to
 * the root and back down the same path, taking whichever twin the current
 * tree holds at each step.
 */
export function currentFiberOf(el: Element): Fiber | null {
  const start = fiberOf(el)
  if (!start) return null
  const path: Fiber[] = []
  for (let f: Fiber | null = start; f; f = f.return) {
    path.push(f)
    if (f.tag === HOST_ROOT) break
  }
  const top = path[path.length - 1]
  const root = top?.tag === HOST_ROOT ? (top.stateNode as { current?: Fiber } | null)?.current : null
  if (!root) return start
  let at: Fiber = root
  for (let i = path.length - 2; i >= 0; i--) {
    const want = path[i]
    let c = at.child
    while (c && c !== want && c !== want.alternate) c = c.sibling
    if (!c) return start
    at = c
  }
  return at
}

// --- names -------------------------------------------------------------------

/** FunDS, the primitives, assets and icons, by the value they export. */
const LIBRARY = new Map<unknown, string>()
let library: Promise<void> | null = null

/**
 * Fill LIBRARY. Loaded on first use, not with the page: the prototype page
 * gets the design system with the project, and a screen being edited has
 * already loaded every module here — so this is a lookup, not a download.
 * Until it resolves, a FunDS component reads as one of the project's own.
 */
export function loadLibrary(): Promise<void> {
  library ??= Promise.all([
    import('@/design-system/components'),
    import('@/platform/primitives'),
    import('@/design-system/assets'),
    import('@/design-system/icons'),
  ])
    .then((modules) => {
      for (const ns of modules as Record<string, unknown>[]) {
        for (const [name, value] of Object.entries(ns)) {
          if (!/^[A-Z]/.test(name)) continue
          if (typeof value === 'function' || (typeof value === 'object' && value !== null)) LIBRARY.set(value, name)
        }
      }
    })
    .catch(() => {})
  return library
}

export function isLibraryComponent(type: unknown): boolean {
  return LIBRARY.has(type)
}

export function componentName(type: unknown): string {
  const known = LIBRARY.get(type)
  if (known) return known
  if (typeof type === 'function') {
    const fn = type as { displayName?: string; name?: string }
    return fn.displayName || fn.name || 'Component'
  }
  if (type && typeof type === 'object') {
    const t = type as { displayName?: string; render?: unknown; type?: unknown }
    if (t.displayName) return t.displayName
    if (t.render) return componentName(t.render)
    if (t.type) return componentName(t.type)
  }
  return 'Component'
}

// --- the result --------------------------------------------------------------

/**
 * How an element sits in the element it is written inside.
 *
 *   child — one of its JSX children (shown always, or by a condition: the
 *           page can't tell those apart, and the write side handles both)
 *   list  — a row of a `.map()` among its children
 *   prop  — the value of one of its props: `topBar={<Header />}`
 *   root  — not inside anything written in the same place: what a
 *           component returns, or the screen's outermost element
 */
export type Slot = 'child' | 'list' | 'prop' | 'root'

export interface JsxNode {
  /** Order of discovery — document order. */
  index: number
  src: Src
  /** The file version stamped beside the address. */
  version: string | null
  kind: 'element' | 'component' | 'instance'
  /** Tag for an HTML element, component name otherwise. */
  name: string
  /** The outermost DOM elements it draws, in document order. */
  hosts: Element[]
  parent: JsxNode | null
  slot: Slot
  /** slot 'prop': which prop. */
  prop?: string
  /** slot 'list': the array the rows came from — one list's rows share it. */
  list?: readonly unknown[]
  /** The component instance whose own code drew this; null for the screen's. */
  owner: JsxNode | null
  /** The props it was given, as rendered now. */
  props: Record<string, unknown>
  key: string | null
}

export interface Analysis {
  nodes: JsxNode[]
  /** For each DOM element, the nodes it is an outermost box of — outer first. */
  byHost: Map<Element, JsxNode[]>
  bySrc: Map<Src, JsxNode[]>
}

const EMPTY: Analysis = { nodes: [], byHost: new Map(), bySrc: new Map() }

// --- reading props -----------------------------------------------------------

interface ElementLike {
  $$typeof: symbol
  type: unknown
  key: string | null
  props: Record<string, unknown>
}

const REACT_ELEMENT = Symbol.for('react.element')
const REACT_FRAGMENT = Symbol.for('react.fragment')

function isElement(v: unknown): v is ElementLike {
  return typeof v === 'object' && v !== null && (v as { $$typeof?: unknown }).$$typeof === REACT_ELEMENT
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

const srcOfProps = (props: unknown): string | null => {
  const v = (props as Record<string, unknown> | null)?.['data-src']
  return typeof v === 'string' ? v : null
}

/** Every address among the elements reachable from a component's props —
 *  what it was handed rather than what it drew. */
function handedSrcs(props: Record<string, unknown>, cache: WeakMap<object, Set<string>>): Set<string> {
  const hit = cache.get(props)
  if (hit) return hit
  const out = new Set<string>()
  const walk = (v: unknown, depth: number) => {
    if (depth > 12 || v === null || typeof v !== 'object') return
    if (isElement(v)) {
      const s = srcOfProps(v.props)
      if (s) out.add(s)
      for (const [k, p] of Object.entries(v.props)) if (k !== 'data-src' && k !== 'data-src-v') walk(p, depth + 1)
      return
    }
    if (Array.isArray(v)) {
      for (const item of v) walk(item, depth + 1)
      return
    }
    if (isPlainObject(v)) for (const p of Object.values(v)) walk(p, depth + 1)
  }
  for (const [k, v] of Object.entries(props)) if (k !== 'data-src' && k !== 'data-src-v') walk(v, 0)
  cache.set(props, out)
  return out
}

interface Found {
  prop: string
  slot: Slot
  list?: readonly unknown[]
}

/**
 * Where, in `props`, an element with address `src` was written — or null.
 *
 * Fragments are looked through: `<>…</>` is a grouping, not a place. Other
 * elements are not: what is inside them is theirs.
 */
function locate(props: Record<string, unknown>, src: string): Found | null {
  for (const [prop, value] of Object.entries(props)) {
    if (prop === 'data-src' || prop === 'data-src-v') continue
    if (prop === 'children') {
      const hit = inChildren(value, src, 0, null)
      if (hit) return { prop, ...hit }
      continue
    }
    if (deepHas(value, src, 0)) return { prop, slot: 'prop' }
  }
  return null
}

function inChildren(
  v: unknown,
  src: string,
  depth: number,
  holder: readonly unknown[] | null,
): { slot: Slot; list?: readonly unknown[] } | null {
  if (isElement(v)) {
    if (srcOfProps(v.props) === src) {
      // Depth 0 is a lone child; depth 1 is one of several JSX children —
      // unless the array is itself the value of one expression (`{rows}`),
      // which a lone array, or one whose items share an address, gives away.
      if (depth <= 1 && holder && (holder.length === 1 || sharesAddress(holder, src))) {
        return { slot: 'list', list: holder }
      }
      return depth <= 1 ? { slot: 'child' } : { slot: 'list', list: holder ?? undefined }
    }
    if (v.type === REACT_FRAGMENT) return inChildren(v.props.children, src, depth, holder)
    return null
  }
  if (Array.isArray(v)) {
    for (const item of v) {
      const hit = inChildren(item, src, depth + 1, v)
      if (hit) return hit
    }
  }
  return null
}

function sharesAddress(items: readonly unknown[], src: string): boolean {
  let n = 0
  for (const item of items) if (isElement(item) && srcOfProps(item.props) === src) n += 1
  return n > 1
}

function deepHas(v: unknown, src: string, depth: number): boolean {
  if (depth > 8 || v === null || typeof v !== 'object') return false
  if (isElement(v)) {
    if (srcOfProps(v.props) === src) return true
    return v.type === REACT_FRAGMENT ? deepHas(v.props.children, src, depth + 1) : false
  }
  if (Array.isArray(v)) return v.some((x) => deepHas(x, src, depth + 1))
  if (isPlainObject(v)) return Object.values(v).some((x) => deepHas(x, src, depth + 1))
  return false
}

// --- the walk ----------------------------------------------------------------

interface Draft extends JsxNode {
  fiber: Fiber
  /** The nearest stamped node above, in rendering order. */
  above: Draft | null
  /** The component fiber whose own code drew it; null for the screen's. */
  ownerFiber: Fiber | null
}

/**
 * Read the screen under `root` — the device's screen scroller.
 */
export function analyze(root: Element | null): Analysis {
  if (!root) return EMPTY
  const top = currentFiberOf(root)
  if (!top) return EMPTY

  const drafts: Draft[] = []
  const byHost = new Map<Element, JsxNode[]>()
  const byFiber = new Map<Fiber, Draft>()

  // Depth-first with an explicit stack: a long screen is deep enough that
  // recursion is a risk not worth taking for a read.
  type Frame = { f: Fiber; pending: Draft[]; above: Draft | null }
  const stack: Frame[] = []
  for (let c = top.child; c; c = c.sibling) stack.push({ f: c, pending: [], above: null })
  stack.reverse()

  while (stack.length > 0) {
    const { f, pending, above } = stack.pop()!
    const props = f.memoizedProps
    const src = props ? srcOfProps(props) : null
    let here = above
    let open = pending

    if (src && props) {
      // A component handing its own stamp on (FunDS spreads props onto its
      // root) is the same element again, not a new one inside it.
      if (above && above.src === src && (above.kind !== 'element' || isHostFiber(f))) {
        byFiber.set(f, above)
      } else {
        const d: Draft = {
          index: drafts.length,
          src,
          version: typeof props['data-src-v'] === 'string' ? (props['data-src-v'] as string) : null,
          kind: isHostFiber(f) ? 'element' : isLibraryComponent(f.type) ? 'component' : 'instance',
          name: isHostFiber(f) ? String(f.type) : componentName(f.type),
          hosts: [],
          parent: null,
          slot: 'root',
          owner: null,
          props,
          key: f.key,
          fiber: f,
          above,
          ownerFiber: null,
        }
        drafts.push(d)
        byFiber.set(f, d)
        here = d
        open = [...pending, d]
      }
    }

    let next = open
    if (isHostFiber(f)) {
      const el = f.stateNode
      if (el instanceof Element) {
        if (open.length > 0) {
          for (const d of open) d.hosts.push(el)
          byHost.set(el, open)
        }
      }
      next = []
    }

    const kids: Frame[] = []
    for (let c = f.child; c; c = c.sibling) kids.push({ f: c, pending: next, above: here })
    for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i])
  }

  // Who drew each node: the nearest component above it that wasn't HANDED it.
  // A component's props hold what its caller wrote; anything else under it
  // came from its own code.
  const handed = new WeakMap<object, Set<string>>()
  for (const d of drafts) {
    for (let f = d.fiber.return; f; f = f.return) {
      if (!isComponentFiber(f) || !f.memoizedProps) continue
      if (handedSrcs(f.memoizedProps, handed).has(d.src)) continue
      d.ownerFiber = f
      break
    }
    const owner = d.ownerFiber ? byFiber.get(d.ownerFiber) : undefined
    // The fiber that drew it may be the forwarded half of a stamped pair,
    // which maps to the pair's node; anything unstamped (the screen itself,
    // the runtime) is the screen's own code.
    d.owner = owner && owner !== d ? owner : null
  }

  // Where each node is written: the nearest stamped node above it, drawn by
  // the same code, that holds it in its props.
  for (const d of drafts) {
    for (let a = d.above; a; a = a.above) {
      if (a.owner !== d.owner) continue
      const found = locate(a.props, d.src)
      if (!found) continue
      d.parent = a
      d.slot = found.prop === 'children' ? found.slot : 'prop'
      if (found.prop !== 'children') d.prop = found.prop
      if (found.list) d.list = found.list
      break
    }
  }

  const bySrc = new Map<Src, JsxNode[]>()
  for (const d of drafts) {
    const list = bySrc.get(d.src)
    if (list) list.push(d)
    else bySrc.set(d.src, [d])
  }
  return { nodes: drafts, byHost, bySrc }
}

/** The screen on show: its scroller inside the device — Edit open or not,
 *  since the Layers list reads it either way. */
export function screenRoot(): Element | null {
  return document.querySelector('[data-device] [data-screen-scroller]')
}

/** The fiber behind a node, for reading what it renders now. */
export function fiberOfNode(node: JsxNode): Fiber | null {
  return (node as Partial<Draft>).fiber ?? null
}
