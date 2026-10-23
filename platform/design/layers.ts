// =============================================================================
// Design · the screen as layers — what selecting, the Layers list and every
// drag work on.
//
// Before this, a layer was a DOM element, and that was most of what felt
// broken. A card the project wrote as `<StatusCard>` was not one thing on the
// page: it was StatusCard's own markup, stamped with lib/ui.tsx and shared by
// every StatusCard in the project. Clicking it picked the deepest element
// under the pointer, so selecting the card meant hunting for its edge.
//
// Here a layer is what the designer wrote, read from React's tree
// (analysis.ts) and laid over what the page now shows (the overlay's clones
// included):
//
//   instance   one use of a component the project wrote — StatCell, as it is
//              used on THIS screen. Its own markup is folded in when it is a
//              single box, so the instance and its frame are one layer.
//   component  a FunDS component or primitive — Card, Button, Screen.
//   element    an HTML element the project wrote.
//   list       the rows of one `.map()`, grouped: a list moves as a whole.
//   new, copy  staged, not yet written.
//
// Layers nest the way the source does: what a screen writes inside
// `<StatusCard>` is the StatusCard's, wherever StatusCard's own markup puts
// it on the page. What a component draws for itself is its `inside` — edits
// there change the component, and so every use of it.
//
// Selection follows Figma: a click picks within the selection's own context
// (siblings of what is selected, or the top level), a double-click goes one
// level in, ⌘-click goes straight to the deepest layer.
// =============================================================================

import { analyze, loadLibrary, screenRoot, type Analysis, type JsxNode } from './analysis'
import { GHOST_ATTR, HIDDEN_ATTR, NEW_ATTR, sourceOf } from './overlay'
import { NEW_PREFIX, type Place, type Src } from './protocol'
import { BOX_TAGS, CONTAINER_COMPONENTS, LEAF_COMPONENTS } from './vocabulary'

export type LayerKind = 'instance' | 'component' | 'element' | 'list' | 'new' | 'copy'

export interface Layer {
  /** Stable while the screen keeps its shape: address and which repeat. */
  id: string
  kind: LayerKind
  /** The JSX the layer is: an instance's or component's usage, an element. */
  node: JsxNode | null
  /** Every node drawn as this one box, outermost first: the usage, then the
   *  element its component returns, and so on. */
  fold: JsxNode[]
  name: string
  /** The words it shows, short — what tells two Texts apart. */
  text: string
  /** The boxes on the page that show it now, in page order. */
  hosts: Element[]
  parent: Layer | null
  children: Layer[]
  /** The instance whose own markup this is part of; null on the screen's. */
  inside: Layer | null
  /** A row's list, or null. */
  list: Layer | null
  /** A new element's id. */
  newId?: string
}

export interface LayerTree {
  roots: Layer[]
  all: Layer[]
  byId: Map<string, Layer>
  /** A page element → the layers it is a box of, outermost first. */
  at: Map<Element, Layer[]>
  analysis: Analysis
}

// --- names -------------------------------------------------------------------

const TAG_NAMES: Record<string, string> = {
  ul: 'List', ol: 'List', li: 'Item',
  section: 'Section', header: 'Header', footer: 'Footer', nav: 'Nav',
  main: 'Main', aside: 'Aside', form: 'Form', label: 'Label',
  img: 'Image', svg: 'Icon', button: 'Button', a: 'Link',
  input: 'Input', textarea: 'Input', select: 'Select', table: 'Table',
  h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', h5: 'Heading', h6: 'Heading',
  hr: 'Divider',
}

const words = (el: Element | undefined, max = 40) =>
  (el?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** Whether an element is a run of words: no element children, some text. */
export function isTextBox(el: Element | undefined): boolean {
  return Boolean(el && el.children.length === 0 && words(el, 1).length > 0)
}

/** A name a designer recognises, from the element's role. Auto layout's
 *  vocabulary for the wrappers: Stack, Row, Grid. */
function elementName(el: Element): string {
  const tag = el.tagName.toLowerCase()
  if (TAG_NAMES[tag]) return TAG_NAMES[tag]
  if (isTextBox(el)) return 'Text'
  const cls = el.classList
  if (cls.contains('grid')) return 'Grid'
  if (cls.contains('flex') || cls.contains('inline-flex')) return cls.contains('flex-col') ? 'Stack' : 'Row'
  return 'Group'
}

// --- building ----------------------------------------------------------------

const sameSet = (a: readonly Element[], b: readonly Element[]) =>
  a.length === b.length && a.every((x) => b.includes(x))

const byPage = (a: Layer, b: Layer) => {
  const x = a.hosts[0]
  const y = b.hosts[0]
  if (!x || !y || x === y) return 0
  return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
}

function build(): LayerTree {
  const root = screenRoot()
  const analysis = analyze(root)
  const tree: LayerTree = { roots: [], all: [], byId: new Map(), at: new Map(), analysis }
  if (!root) return tree

  // A component's own root, when it draws exactly the component's boxes, is
  // the component: StatCell and the `<div>` it returns are one layer.
  const folds = new Map<JsxNode, JsxNode>()
  for (const n of analysis.nodes) {
    if (n.owner && !n.parent && n.slot === 'root' && n.hosts.length > 0 && sameSet(n.hosts, n.owner.hosts)) {
      folds.set(n, n.owner)
    }
  }
  const targetOf = (n: JsxNode): JsxNode => {
    let at = n
    for (let i = 0; i < 64; i++) {
      const next = folds.get(at)
      if (!next) return at
      at = next
    }
    return at
  }

  const ofNode = new Map<JsxNode, Layer>()
  for (const n of analysis.nodes) {
    const t = targetOf(n)
    if (t.hosts.length === 0) continue
    let layer = ofNode.get(t)
    if (!layer) {
      layer = {
        id: '',
        kind: t.kind,
        node: t,
        fold: [t],
        name: t.kind === 'element' ? '' : t.name,
        text: '',
        hosts: [],
        parent: null,
        children: [],
        inside: null,
        list: null,
      }
      ofNode.set(t, layer)
    }
    if (t !== n) layer.fold.push(n)
    ofNode.set(n, layer)
  }

  // What shows each layer now: walk the page as drawn, overlay included. A
  // moved box is a clone, found through the element it shows; a copy is a
  // copy of one layer and nothing inside it is addressable yet.
  const news: Layer[] = []
  const copies: { el: Element; of: Element }[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => {
      const el = n as Element
      if (el.hasAttribute(HIDDEN_ATTR)) return NodeFilter.FILTER_REJECT
      const ghost = el.getAttribute(GHOST_ATTR)
      if (ghost === 'copy') {
        copies.push({ el, of: sourceOf(el) })
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n as Element
    const id = el.getAttribute(NEW_ATTR)
    if (id && el.getAttribute(GHOST_ATTR) === 'new') {
      const made: Layer = {
        id: `${NEW_PREFIX}${id}`,
        kind: 'new',
        node: null,
        fold: [],
        name: el.tagName === 'DIV' && !el.hasAttribute('data-fds') ? elementName(el) : (el.getAttribute('data-fds') ?? elementName(el)),
        text: words(el),
        hosts: [el],
        parent: null,
        children: [],
        inside: null,
        list: null,
        newId: id,
      }
      news.push(made)
      tree.at.set(el, [made])
      continue
    }
    const nodes = analysis.byHost.get(sourceOf(el))
    if (!nodes) continue
    const here: Layer[] = []
    for (const node of nodes) {
      const layer = ofNode.get(node)
      if (layer && !here.includes(layer)) here.push(layer)
    }
    for (const layer of here) if (!layer.hosts.includes(el)) layer.hosts.push(el)
    if (here.length > 0) tree.at.set(el, here)
  }

  const live = Array.from(new Set(ofNode.values())).filter((l) => l.hosts.length > 0)
  for (const l of live) {
    const host = l.hosts[0]
    if (l.kind === 'element') l.name = elementName(host)
    l.text = words(host)
  }

  // Where each layer is written: the nearest layer around it on the page
  // that the same code drew — the source's nesting, whatever component
  // markup sits between. A component's own root sits in the component.
  const parentFor = (l: Layer): Layer | null => {
    const n = l.node!
    if (!n.parent && !n.owner) return null
    const fits = (p: Layer) =>
      p.kind === 'new' ||
      (n.parent ? p.fold.some((m) => m.owner === n.owner) : p.fold.includes(n.owner!))
    const first = l.hosts[0]
    // Layers outside this one on its own box come first (a fragment's
    // component), then the boxes around it.
    const own = tree.at.get(first) ?? []
    for (let i = own.indexOf(l) - 1; i >= 0; i--) if (fits(own[i])) return own[i]
    for (let el = first.parentElement; el && el !== root; el = el.parentElement) {
      const here = tree.at.get(el)
      if (!here) continue
      for (let i = here.length - 1; i >= 0; i--) if (here[i] !== l && fits(here[i])) return here[i]
    }
    const fallback = n.parent ?? n.owner
    return fallback ? (ofNode.get(fallback) ?? null) : null
  }
  for (const l of live) {
    l.parent = parentFor(l)
    const owner = l.node?.owner
    l.inside = owner ? (ofNode.get(owner) ?? null) : null
  }

  // A staged element sits where its edit put it; what it holds sits in it
  // (the walk above found those through `fits`).
  const layerOfSrc = (src: Src): Layer | null => {
    if (src.startsWith(NEW_PREFIX)) return news.find((x) => x.id === src) ?? null
    const node = analysis.bySrc.get(src)?.[0]
    return node ? (ofNode.get(node) ?? null) : null
  }
  for (const made of news) {
    const place = placeOfNew(made.newId!)
    if (place) {
      const anchor = layerOfSrc('inside' in place ? place.inside : 'before' in place ? place.before : place.after)
      made.parent = 'inside' in place ? anchor : (anchor?.parent ?? null)
      made.inside = made.parent?.kind === 'new' ? made.parent.inside : (made.parent?.inside ?? null)
    } else {
      // A wrap: where its first box was.
      for (let el = made.hosts[0].parentElement; el && el !== root; el = el.parentElement) {
        const here = tree.at.get(el)
        if (here?.length) {
          made.parent = here[here.length - 1]
          break
        }
      }
    }
  }

  const copied: Layer[] = copies.map(({ el, of }) => {
    const original = tree.at.get(of)?.slice(-1)[0] ?? null
    return {
      id: '',
      kind: 'copy',
      node: null,
      fold: [],
      name: original?.name ?? elementName(el),
      text: words(el),
      hosts: [el],
      parent: original?.parent ?? null,
      children: [],
      inside: original?.inside ?? null,
      list: null,
    }
  })

  const all = [...live, ...news, ...copied]
  for (const l of all) {
    if (l.parent) l.parent.children.push(l)
    else tree.roots.push(l)
  }

  // Rows of one `.map()` are one list.
  const lists: Layer[] = []
  const group = (kids: Layer[], parent: Layer | null): Layer[] => {
    const out: Layer[] = []
    const seen = new Map<readonly unknown[], Layer>()
    for (const k of kids.sort(byPage)) {
      const arr = k.node?.slot === 'list' ? k.node.list : undefined
      if (!arr) {
        out.push(k)
        continue
      }
      let list = seen.get(arr)
      if (!list) {
        list = {
          id: '',
          kind: 'list',
          node: null,
          fold: [],
          name: 'List',
          text: '',
          hosts: [],
          parent,
          children: [],
          inside: k.inside,
          list: null,
        }
        seen.set(arr, list)
        lists.push(list)
        out.push(list)
      }
      list.children.push(k)
      list.hosts.push(...k.hosts)
      k.parent = list
      k.list = list
    }
    return out
  }
  for (const l of all) if (l.children.length > 0) l.children = group(l.children, l)
  tree.roots = group(tree.roots, null)
  // Named for what repeats: "Item ×4", not a second "List" inside a <ul>.
  for (const list of lists) list.name = `${list.children[0]?.name ?? 'Row'} ×${list.children.length}`

  // Ids: the address, and which of its repeats in page order.
  const counts = new Map<string, number>()
  const name = (base: string) => {
    const k = counts.get(base) ?? 0
    counts.set(base, k + 1)
    return `${base}#${k}`
  }
  const everything = [...all, ...lists].sort(byPage)
  for (const l of everything) {
    if (l.kind === 'new') continue
    if (l.kind === 'list') l.id = name(`list:${l.children[0]?.node?.src ?? ''}`)
    else if (l.kind === 'copy') l.id = name(`copy:${l.name}`)
    else l.id = name(l.node!.src)
  }
  for (const l of everything) tree.byId.set(l.id, l)
  tree.all = everything
  for (const list of lists) {
    // Rows' boxes are on the page as rows are: one list box covers them all.
    for (const host of list.hosts) {
      const here = tree.at.get(host)
      if (here && !here.includes(list)) here.unshift(list)
    }
  }
  return tree
}

/** Where a staged insert was put. Read through a hook the store fills in, so
 *  this module needn't import it (designStore imports nothing from here). */
let placeLookup: (id: string) => Place | null = () => null
export function setPlaceLookup(fn: (id: string) => Place | null) {
  placeLookup = fn
}
const placeOfNew = (id: string) => placeLookup(id)

// --- the cache -----------------------------------------------------------------

let cached: LayerTree | null = null
let dirty = true
const listeners = new Set<() => void>()
let notifyFrame = 0
/** Counts notifications, for React's useSyncExternalStore. */
let changes = 0
export const getLayersVersion = () => changes

let libraryAsked = false

/** The screen's layers as it is now. Rebuilt only after something changed. */
export function getLayerTree(): LayerTree {
  if (!libraryAsked) {
    // Which components are FunDS' is known once the design system is looked
    // up; read the screen again then.
    libraryAsked = true
    void loadLibrary().then(invalidateLayers)
  }
  if (!cached || dirty) {
    cached = build()
    dirty = false
  }
  return cached
}

/** Something on the screen changed: rebuild on the next read, and tell the
 *  lists — once per frame, however many changes arrive in it. */
export function invalidateLayers() {
  dirty = true
  if (notifyFrame || typeof requestAnimationFrame === 'undefined') return
  notifyFrame = requestAnimationFrame(() => {
    notifyFrame = 0
    changes += 1
    listeners.forEach((l) => l())
  })
}

export function subscribeLayers(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/**
 * Watch the device for anything React (or the overlay) changes. One
 * observer, started while Edit is open; stopping it leaves the cache to
 * rebuild on its next read.
 */
export function watchLayers(): () => void {
  const r = document.querySelector('[data-device]')
  if (!r) return () => {}
  const mo = new MutationObserver((records) => {
    const real = records.some((rec) => {
      const t = rec.target instanceof Element ? rec.target : rec.target.parentElement
      return !t?.closest('[data-inspect-layer]')
    })
    if (real) invalidateLayers()
  })
  mo.observe(r, { childList: true, subtree: true, attributes: true, characterData: true })
  invalidateLayers()
  return () => {
    mo.disconnect()
    dirty = true
  }
}

// --- finding layers --------------------------------------------------------------

/** The innermost layer whose box holds `el`. */
export function layerAt(el: Element | null, tree = getLayerTree()): Layer | null {
  for (let at = el; at; at = at.parentElement) {
    const here = tree.at.get(at)
    if (here?.length) return here[here.length - 1]
    if (at.hasAttribute('data-screen-scroller')) return null
  }
  return null
}

/** The layer a pinned element stands for: the one selected by id if its box
 *  is that element, else the innermost layer there. */
export function layerOfPin(pinned: Element | null, id: string | null, tree = getLayerTree()): Layer | null {
  if (!pinned) return null
  if (id) {
    const l = tree.byId.get(id)
    if (l && l.hosts[0] === pinned) return l
  }
  return layerAt(pinned, tree)
}

/** A layer and everything around it, outermost first. */
export function pathOf(layer: Layer): Layer[] {
  const out: Layer[] = []
  for (let l: Layer | null = layer; l; l = l.parent) out.unshift(l)
  return out
}

/** The layers under a page element, outermost first. */
export function layersAt(target: Element, tree = getLayerTree()): Layer[] {
  const inner = layerAt(target, tree)
  return inner ? pathOf(inner) : []
}

/** Whether `inner` is `outer` or anywhere inside it. */
export function within(inner: Layer, outer: Layer): boolean {
  // By id as well: a layer held through a gesture can be from an earlier
  // reading of the screen than the one it is compared with.
  for (let l: Layer | null = inner; l; l = l.parent) if (l === outer || l.id === outer.id) return true
  return false
}

/**
 * Whether two layers were drawn by the same code: the same component's own
 * markup, or both the screen's. Compared by address, not identity — every
 * reading of the screen makes new nodes, and a drag can span two readings.
 */
export function sameOwner(a: JsxNode | null, b: JsxNode | null): boolean {
  return a === b || (a !== null && b !== null && a.src === b.src)
}

/**
 * What a click on `target` selects, Figma's way.
 *
 * A screen's outermost layer is its artboard: clicks start one level in. With
 * a selection, a click stays at the selection's own depth inside whatever of
 * its surroundings holds the pointer — a sibling, or a sibling's. `deep` (⌘)
 * goes straight to the innermost layer.
 */
export function pickLayer(target: Element, selected: Layer | null, deep: boolean, tree = getLayerTree()): Layer | null {
  const chain = layersAt(target, tree)
  if (chain.length === 0) return null
  if (deep) return chain[chain.length - 1]
  const start = chain.length > 1 && chain[0].parent === null ? 1 : 0
  if (selected) {
    const around = pathOf(selected).slice(0, -1)
    for (let i = around.length - 1; i >= 0; i--) {
      const k = chain.indexOf(around[i])
      if (k !== -1) return chain[k + 1] ?? chain[k]
    }
  }
  return chain[start]
}

/** One level into `selected`, under `target` — a double-click. */
export function drillLayer(selected: Layer, target: Element, tree = getLayerTree()): Layer | null {
  const chain = layersAt(target, tree)
  const k = chain.indexOf(selected)
  return k !== -1 ? (chain[k + 1] ?? null) : null
}

/** Siblings, in page order. */
export function siblingsOf(layer: Layer, tree = getLayerTree()): Layer[] {
  return layer.parent ? layer.parent.children : tree.roots
}

// --- what a layer is, for edits ------------------------------------------------------

/** The address a structural edit names, and its scope. */
export function addressOfLayer(layer: Layer): { src: Src; scope?: 'list' } | null {
  if (layer.kind === 'new') return { src: layer.id }
  if (layer.kind === 'list') {
    const row = layer.children[0]?.node
    return row ? { src: row.src, scope: 'list' } : null
  }
  return layer.node ? { src: layer.node.src } : null
}

/** For "before" and "after": the first and last address a layer covers. */
function edgesOf(layer: Layer): { first: Src; last: Src } | null {
  if (layer.kind === 'list') {
    const first = layer.children[0]?.node?.src
    const last = layer.children[layer.children.length - 1]?.node?.src
    return first && last ? { first, last } : null
  }
  const a = addressOfLayer(layer)
  return a ? { first: a.src, last: a.src } : null
}

/** The element whose classes style a layer's box: for an instance, the
 *  element its component returns — its main component's. */
export function styleNodeOf(layer: Layer): JsxNode | null {
  for (let i = layer.fold.length - 1; i >= 0; i--) if (layer.fold[i].kind === 'element') return layer.fold[i]
  return layer.node && layer.node.kind !== 'instance' ? layer.node : null
}

export const fileOfSrc = (src: Src) => src.split(':').slice(0, -2).join(':')

/** The instance whose component a change to `layer`'s own styling edits. */
export function styleScope(layer: Layer): Layer | null {
  const style = styleNodeOf(layer)
  if (!style) return null
  if (layer.kind === 'instance' && style !== layer.node) return layer
  return layer.inside
}

/**
 * Why a layer can't be moved, copied or deleted here — or null.
 *
 * Said up front, on the button and at the pointer, rather than learned from a
 * refusal after the fact.
 */
export function blockOf(layer: Layer, slug: string): string | null {
  if (layer.kind === 'copy') return 'This copy is still being saved — it can be moved in a moment.'
  if (layer.kind === 'new') return null
  if (layer.kind === 'list') {
    const row = layer.children[0]?.node
    if (!row) return 'This list has nothing in it to move.'
    return fileOfSrc(row.src).startsWith(`projects/${slug}/`) ? null : inherited(row.src)
  }
  const node = layer.node
  if (!node) return 'This can’t be moved from here.'
  if (!fileOfSrc(node.src).startsWith(`projects/${slug}/`)) return inherited(node.src)
  if (!layer.parent) return 'This is the screen itself.'
  if (node.slot === 'prop') {
    return `This is the ${node.prop ?? 'content'} of ${layer.parent.name}, so it stays where ${layer.parent.name} puts it.`
  }
  if (node.slot === 'list') return 'This is one row of a list — select the list to move it as a whole.'
  if (node.slot === 'root') {
    const by = layer.inside?.name ?? layer.parent.name
    return `This is how ${by} is built — select the ${by} to move it.`
  }
  return null
}

function inherited(src: Src): string {
  const project = fileOfSrc(src).split('/')[1] ?? 'another project'
  return `This comes from ${project}, which this prototype builds on — it can’t be changed from here.`
}

// --- dropping ------------------------------------------------------------------

/** Whether `holder` takes children, judged the way the write side will. */
function holds(node: JsxNode): boolean {
  if (node.kind === 'element') return BOX_TAGS.includes(node.name)
  if (CONTAINER_COMPONENTS.includes(node.name)) return true
  if (LEAF_COMPONENTS.includes(node.name)) return false
  // A component the project wrote is trusted with children once it has some.
  const kids = node.props.children
  const isEl = (v: unknown) => typeof v === 'object' && v !== null && '$$typeof' in v
  return Array.isArray(kids) ? kids.some(isEl) : isEl(kids)
}

/** What a dragged thing may land beside or in: drawn by the same code (the
 *  screen's, or one component's own), in the same file. */
interface Scope {
  owner: JsxNode | null
  file: string | null
  /** For an Insert-panel drag: any file in the project. */
  project?: string
  /** The list row it is part of: a row's insides are every row's, so only
   *  something already in that row may land there. */
  row?: Layer | null
}

/** The row of a list a layer is, or is inside. */
function rowOf(layer: Layer): Layer | null {
  for (let l: Layer | null = layer; l; l = l.parent) if (l.list) return l
  return null
}

export function scopeOf(layer: Layer): Scope {
  const node = layer.kind === 'list' ? (layer.children[0]?.node ?? null) : layer.node
  const row = layer.kind === 'list' ? null : rowOf(layer)
  if (node) return { owner: node.owner, file: fileOfSrc(node.src), row }
  return { owner: layer.inside?.node ?? null, file: null, row }
}

/** The node in `layer` that can take something drawn in `scope`, as an
 *  address to put it `inside` — or null. */
function holderIn(layer: Layer, scope: Scope): Src | null {
  if (layer.kind === 'new') return layer.hosts[0]?.tagName === 'DIV' ? layer.id : null
  if (layer.kind === 'list' || layer.kind === 'copy') return null
  const row = rowOf(layer)
  if (row && row !== (scope.row ?? null)) return null
  for (const n of layer.fold) {
    if (!sameOwner(n.owner, scope.owner)) continue
    const file = fileOfSrc(n.src)
    if (scope.file ? file !== scope.file : !file.startsWith(`projects/${scope.project}/`)) continue
    if (holds(n)) return n.src
  }
  return null
}

/** The children of `layer` a dragged thing would sit among. */
function slotsIn(layer: Layer, scope: Scope, dragged: Layer | null): Layer[] {
  return layer.children.filter((k) => {
    if (k === dragged || (dragged && k.id === dragged.id) || k.kind === 'copy' || k.hosts.length === 0) return false
    if (k.kind === 'new') return true
    const node = k.kind === 'list' ? k.children[0]?.node : k.node
    return Boolean(node && sameOwner(node.owner, scope.owner) && node.slot !== 'prop' && node.slot !== 'root')
  })
}

export interface DropPlan {
  to: Place
  /** Where the line goes (page coordinates), between two layers… */
  line: DOMRect | null
  /** …or the container's box, when it is dropped into an empty one. */
  box: DOMRect | null
  container: Layer
  /** What it lands next to, for the change's label. */
  near: Layer
}

function union(els: readonly Element[]): DOMRect {
  let l = Infinity
  let t = Infinity
  let r = -Infinity
  let b = -Infinity
  for (const el of els) {
    const x = el.getBoundingClientRect()
    if (x.width === 0 && x.height === 0) continue
    l = Math.min(l, x.left)
    t = Math.min(t, x.top)
    r = Math.max(r, x.right)
    b = Math.max(b, x.bottom)
  }
  return l === Infinity ? new DOMRect() : new DOMRect(l, t, r - l, b - t)
}

export const boxOf = (layer: Layer) => union(layer.hosts)

type Flow = 'row' | 'col' | 'grid'

function flowOf(el: Element | null): Flow {
  if (!el) return 'col'
  const s = getComputedStyle(el)
  if (s.display.includes('grid')) return 'grid'
  if (s.display.includes('flex')) {
    if (s.flexWrap !== 'nowrap' && s.flexDirection.startsWith('row')) return 'grid'
    return s.flexDirection.startsWith('row') ? 'row' : 'col'
  }
  return 'col'
}

/** How far into a box's edge a pointer still means "beside it". */
const EDGE = 6

/**
 * Where a drop at (x, y) lands: in the innermost layer under the pointer
 * that can hold it, at the gap nearest the pointer among its children — or
 * beside that layer when the pointer is on its very edge.
 *
 * `dragged` is null for something new from the Insert panel; `scope` says
 * what may hold it.
 */
export function planDrop(
  x: number,
  y: number,
  dragged: Layer | null,
  scope: Scope,
  tree = getLayerTree(),
  scale = 1,
): DropPlan | null {
  let target: Element | null = null
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest('[data-inspect-layer]') || !el.closest('[data-screen-scroller]')) continue
    target = el
    break
  }
  if (!target) return null
  const chain = layersAt(target, tree)
  const edge = EDGE * scale

  for (let i = chain.length - 1; i >= 0; i--) {
    const layer = chain[i]
    if (dragged && within(layer, dragged)) continue
    const holder = holderIn(layer, scope)
    if (!holder) continue
    const box = boxOf(layer)
    // On its edge, a layer is something to sit beside, if its parent takes it.
    const parent = chain[i - 1]
    if (parent && holderIn(parent, scope) && layer.kind !== 'new') {
      const pflow = flowOf(layer.hosts[0]?.parentElement ?? null)
      const nearEdge =
        pflow === 'row'
          ? x - box.left < edge || box.right - x < edge
          : y - box.top < edge || box.bottom - y < edge
      if (nearEdge) continue
    }
    return planIn(layer, holder, x, y, dragged, scope)
  }
  return null
}

function planIn(layer: Layer, holder: Src, x: number, y: number, dragged: Layer | null, scope: Scope): DropPlan | null {
  const kids = slotsIn(layer, scope, dragged)
  if (kids.length === 0) {
    return { to: { inside: holder }, line: null, box: boxOf(layer), container: layer, near: layer }
  }
  const boxes = kids.map(boxOf)
  const flow = flowOf(kids[0].hosts[0]?.parentElement ?? null)

  // The index the pointer falls at: along the stack for a row or a column;
  // for a grid or wrapping row, beside whichever child is nearest.
  let index: number
  if (flow === 'grid') {
    let best = 0
    let dist = Infinity
    boxes.forEach((b, i) => {
      const dx = Math.max(b.left - x, 0, x - b.right)
      const dy = Math.max(b.top - y, 0, y - b.bottom)
      const d = dx * dx + dy * dy
      if (d < dist) {
        dist = d
        best = i
      }
    })
    const b = boxes[best]
    index = x < b.left + b.width / 2 ? best : best + 1
  } else {
    const along = (b: DOMRect) => (flow === 'row' ? b.left + b.width / 2 : b.top + b.height / 2)
    const p = flow === 'row' ? x : y
    index = boxes.filter((b) => along(b) < p).length
  }

  // Dropping where it already is moves nothing; say so by drawing nothing.
  // Counted among the same children the index is: where it sits, it is
  // already between the one before it and the one after.
  if (dragged && slotsIn(layer, scope, null).findIndex((k) => k === dragged || k.id === dragged.id) === index) return null

  const before = kids[index]
  const after = kids[index - 1]
  const edges = before ? edgesOf(before) : edgesOf(after)
  if (!edges) return null
  const to: Place = before ? { before: edges.first } : { after: edges.last }
  return {
    to,
    line: lineBetween(boxes[index - 1] ?? null, boxes[index] ?? null, flow === 'row', boxes),
    box: null,
    container: layer,
    near: before ?? after,
  }
}

function lineBetween(a: DOMRect | null, b: DOMRect | null, row: boolean, all: DOMRect[]): DOMRect {
  const cross = union0(all)
  const T = 2
  if (row) {
    const at = a && b ? (a.right + b.left) / 2 : a ? a.right + T : b!.left - T
    return new DOMRect(at - T / 2 - 0.5, cross.top, T + 1, cross.height)
  }
  const at = a && b ? (a.bottom + b.top) / 2 : a ? a.bottom + T : b!.top - T
  return new DOMRect(cross.left, at - T / 2 - 0.5, cross.width, T + 1)
}

function union0(rects: DOMRect[]): DOMRect {
  const l = Math.min(...rects.map((r) => r.left))
  const t = Math.min(...rects.map((r) => r.top))
  const r = Math.max(...rects.map((x) => x.right))
  const b = Math.max(...rects.map((x) => x.bottom))
  return new DOMRect(l, t, r - l, b - t)
}

/** The neighbour a one-step move goes past, among siblings drawn by the same
 *  code — or null at either end. */
export function stepOf(layer: Layer, dir: -1 | 1): { to: Place; past: Layer } | null {
  if (!layer.parent) return null
  const scope = scopeOf(layer)
  const kids = slotsIn(layer.parent, scope, null)
  const i = kids.indexOf(layer)
  if (i === -1) return null
  const past = kids[i + dir]
  if (!past) return null
  const edges = edgesOf(past)
  if (!edges) return null
  return { to: dir < 0 ? { before: edges.first } : { after: edges.last }, past }
}

/** Whether `layer` takes things dropped or inserted into it, for `scope`. */
export function holderFor(layer: Layer, scope: Scope): Src | null {
  return holderIn(layer, scope)
}
