// =============================================================================
// Design · what can be done to a layer.
//
// One implementation behind every way of asking: the panel's Arrange buttons,
// the keyboard, a drag on the canvas, a drag in Layers, typing over text. Each
// turns a layer (layers.ts) into an addressed edit, refuses up front what the
// write would refuse anyway, and stages it — the overlay draws the result.
// =============================================================================

import { applyLayoutPatch, applyShownText, applyTextSwap, srcOf } from './applyDom'
import { catalogItem } from './catalog'
import {
  newEdit,
  newId,
  removeNew,
  stageLiteralEdit,
  stagePropEdit,
  stageStackEdit,
  stageStructuralEdit,
  stageTextEdit,
  updateNew,
  type StageContext,
} from './designStore'
import { factsAt, findText, nextFacts } from './factsClient'
import { layoutOf, withLayout, type Layout } from './layout'
import {
  addressOfLayer,
  blockOf,
  fileOfSrc,
  getLayerTree,
  holderFor,
  isTextBox,
  sameOwner,
  scopeOf,
  setPlaceLookup,
  stepOf,
  within,
  type Layer,
} from './layers'
import type { JsxNode } from './analysis'
import { isHidden, NEW_ATTR } from './overlay'
import { NEW_PREFIX, type InsertEdit, type Place, type Src, type WrapEdit } from './protocol'
import { pinAfterRedraw } from './selection'
import { BOX_TAGS, CONTAINER_COMPONENTS, LEAF_COMPONENTS } from './vocabulary'

// A staged insert sits where its edit put it; the layer tree asks here.
setPlaceLookup((id) => {
  const made = newEdit(id)
  return made?.kind === 'insert' ? made.to : null
})

/** The file version to send with a value edit made on `el`: its own, or the
 *  nearest addressed element's around it. */
function versionOf(el: Element): string | undefined {
  const v = el.getAttribute('data-src-v') ?? el.closest('[data-src-v]')?.getAttribute('data-src-v')
  return v ?? undefined
}

/** What the panel needs to stage a value edit on an element. */
export function stageContext(el: Element, slug: string, screenId: string): StageContext {
  return { slug, screenId, version: versionOf(el) }
}

/** The same, for a layer's structural edit: the version of the file its
 *  address points into. */
function layerContext(layer: Layer, slug: string, screenId: string): StageContext {
  const node = layer.kind === 'list' ? layer.children[0]?.node : layer.node
  return { slug, screenId, version: node?.version ?? undefined }
}

/** A short name for an element in a change label: `Card`, `span “Total”`. */
export function describe(el: Element): string {
  const name = el.getAttribute('data-fds') ?? el.tagName.toLowerCase()
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!text || el.children.length > 2) return name
  return `${name} “${text.length > 18 ? `${text.slice(0, 17)}…` : text}”`
}

/** A short name for a layer in a change label: `StatCell`, `Text “Total”`. */
export function describeLayer(layer: Layer): string {
  if (layer.kind === 'list') return `list of ${layer.children.length}`
  const text = layer.text
  const leafish = layer.children.length === 0 || layer.kind === 'element'
  if (!text || !leafish || text.length > 40) return layer.name
  return `${layer.name} “${text.length > 18 ? `${text.slice(0, 17)}…` : text}”`
}

// --- moving, copying, deleting ------------------------------------------------------

/** Move `layer` to `to`. `near` names the place in the change's label. */
export function moveLayer(layer: Layer, to: Place, near: Layer, slug: string, screenId: string): boolean {
  if (layer.kind === 'new') {
    // Still staged: moving it is putting it somewhere else.
    const made = layer.newId ? newEdit(layer.newId) : undefined
    if (made?.kind !== 'insert') return false
    updateNew(made.id, (e) => (e.kind === 'insert' ? { ...e, to } : e))
    return true
  }
  const address = addressOfLayer(layer)
  if (!address || blockOf(layer, slug)) return false
  const how = 'before' in to ? 'above' : 'after' in to ? 'below' : 'into'
  stageStructuralEdit(
    layerContext(layer, slug, screenId),
    { kind: 'move', src: address.src, to, ...(address.scope ? { scope: address.scope } : {}) },
    `Move ${describeLayer(layer)} ${how} ${describeLayer(near)}`,
  )
  return true
}

/** One step along its stack — the arrow keys and the panel's Move buttons. */
export function stepLayer(layer: Layer, dir: -1 | 1, slug: string, screenId: string): boolean {
  const step = stepOf(layer, dir)
  if (!step) return false
  return moveLayer(layer, step.to, step.past, slug, screenId)
}

export function deleteLayer(layer: Layer, slug: string, screenId: string): boolean {
  if (layer.kind === 'new' && layer.newId) {
    removeNew(layer.newId)
    return true
  }
  const address = addressOfLayer(layer)
  if (!address || blockOf(layer, slug)) return false
  stageStructuralEdit(
    layerContext(layer, slug, screenId),
    { kind: 'delete', src: address.src, ...(address.scope ? { scope: address.scope } : {}) },
    `Delete ${describeLayer(layer)}`,
  )
  return true
}

export function duplicateLayer(layer: Layer, slug: string, screenId: string): boolean {
  if (layer.kind === 'new') return false
  const address = addressOfLayer(layer)
  if (!address || blockOf(layer, slug)) return false
  stageStructuralEdit(
    layerContext(layer, slug, screenId),
    { kind: 'duplicate', src: address.src, ...(address.scope ? { scope: address.scope } : {}) },
    `Duplicate ${describeLayer(layer)}`,
  )
  return true
}

/** Delete, for a new element: take it — and whatever depends on it — off the list. */
export function removeNewElement(el: Element): boolean {
  const id = el.getAttribute(NEW_ATTR)
  if (!id) return false
  removeNew(id)
  return true
}

// --- dragging in Layers ------------------------------------------------------------

type Where = 'before' | 'after' | 'inside'

/** Whether `target` is somewhere `dragged` may sit beside: drawn by the same
 *  code, in the same file, as one of its parent's children. */
function besideOk(dragged: Layer, target: Layer): boolean {
  if (!target.parent || target.kind === 'copy' || within(target, dragged)) return false
  if (target.kind === 'new') return true
  const scope = scopeOf(dragged)
  const node = target.kind === 'list' ? target.children[0]?.node : target.node
  if (!node || !sameOwner(node.owner, scope.owner) || node.slot === 'prop' || node.slot === 'root') return false
  return !scope.file || fileOfSrc(node.src) === scope.file
}

/** Rearranging from the Layers list: the same rules as a drag on the screen. */
export function layersDrag(slug: string, screenId: string) {
  return {
    canDrag: (layer: Layer) => (layer.kind === 'new' ? Boolean(layer.newId && newEdit(layer.newId)?.kind === 'insert') : blockOf(layer, slug) === null),
    accepts: (dragged: Layer, target: Layer, where: Where) => {
      if (target === dragged || within(target, dragged)) return false
      if (where === 'inside') return holderFor(target, scopeOf(dragged)) !== null
      return besideOk(dragged, target)
    },
    onDrop: (dragged: Layer, target: Layer, where: Where) => {
      let to: Place | null = null
      if (where === 'inside') {
        const holder = holderFor(target, scopeOf(dragged))
        if (holder) to = { inside: holder }
      } else {
        const address = addressOfLayer(target.kind === 'list' ? (where === 'before' ? target.children[0] : target.children[target.children.length - 1]) ?? target : target)
        if (address) to = where === 'before' ? { before: address.src } : { after: address.src }
      }
      if (to) moveLayer(dragged, to, target, slug, screenId)
    },
  }
}

// --- insert ------------------------------------------------------------------------

/**
 * Where an Insert-panel click puts things: inside the selection when it can
 * hold children, right after it otherwise, and at the end of the screen when
 * nothing is selected.
 */
export function insertPlace(selected: Layer | null, slug: string): { to: Place; near: Layer; how: string } | null {
  const tree = getLayerTree()
  if (selected && selected.kind !== 'copy') {
    const scope = { owner: selected.kind === 'list' ? (selected.children[0]?.node?.owner ?? null) : (selected.node?.owner ?? null), file: null, project: slug }
    const holder = holderFor(selected, scope)
    if (holder) return { to: { inside: holder }, near: selected, how: 'inside' }
    if (selected.parent && (selected.kind === 'new' || blockOf(selected, slug) === null)) {
      const last = selected.kind === 'list' ? selected.children[selected.children.length - 1] : selected
      const address = last ? addressOfLayer(last) : null
      if (address) return { to: { after: address.src }, near: selected, how: 'below' }
    }
  }
  const screen = { owner: null, file: null, project: slug }
  for (const root of tree.roots) {
    const holder = holderFor(root, screen)
    if (holder) return { to: { inside: holder }, near: root, how: 'at the end of' }
  }
  return null
}

export function insertItem(
  key: string,
  to: Place,
  near: Layer,
  slug: string,
  screenId: string,
  icon?: string,
): string | null {
  const item = catalogItem(key)
  if (!item) return null
  const id = newId()
  const anchor = 'inside' in to ? to.inside : 'before' in to ? to.before : to.after
  const version = anchor.startsWith(NEW_PREFIX) ? undefined : (getLayerTree().analysis.bySrc.get(anchor)?.[0]?.version ?? undefined)
  stageStructuralEdit(
    { slug, screenId, version },
    { kind: 'insert', id, to, item: key, icon, props: { ...item.props } },
    `Add ${icon ?? item.label} ${'inside' in to ? 'into' : 'before' in to ? 'above' : 'below'} ${describeLayer(near)}`,
  )
  pinAfterRedraw(`${NEW_PREFIX}${id}`)
  return id
}

// --- wrap and unwrap ---------------------------------------------------------------

/** Whether children of `el` flow left-to-right. */
export function isRow(el: Element | null): boolean {
  if (!el) return false
  const s = getComputedStyle(el)
  return s.display.includes('flex') && s.flexDirection.startsWith('row')
}

/**
 * The selection in page order, if it can be wrapped: siblings drawn by the
 * same code, side by side. Otherwise the reason it can't.
 */
export function wrappable(layers: Layer[], slug: string): Layer[] | string {
  if (layers.length === 0) return 'Select something first.'
  for (const l of layers) {
    if (l.kind === 'list') return 'A list can’t be wrapped yet — wrap the element it sits in instead.'
    const blocked = l.kind === 'new' ? null : blockOf(l, slug)
    if (blocked) return blocked
  }
  const parent = layers[0].parent
  if (layers.some((l) => l.parent !== parent)) {
    return 'Only elements side by side in the same container can be wrapped together.'
  }
  const siblings = parent ? parent.children : getLayerTree().roots
  const sorted = [...layers].sort((a, b) => siblings.indexOf(a) - siblings.indexOf(b))
  const first = siblings.indexOf(sorted[0])
  const last = siblings.indexOf(sorted[sorted.length - 1])
  const between = siblings.slice(first, last + 1).filter((s) => s.kind !== 'copy')
  if (between.length !== sorted.length) {
    return 'Only elements side by side can be wrapped together — something else sits between them.'
  }
  return sorted
}

export function wrapLayers(layers: Layer[], slug: string, screenId: string): string | null {
  const sorted = wrappable(layers, slug)
  if (typeof sorted === 'string') return null
  const srcs = sorted.map((l) => addressOfLayer(l)?.src).filter((s): s is Src => Boolean(s))
  if (srcs.length !== sorted.length) return null
  const id = newId()
  const className = isRow(sorted[0].hosts[0]?.parentElement ?? null) ? 'flex items-center gap-8' : 'flex flex-col gap-12'
  stageStructuralEdit(
    layerContext(sorted[0], slug, screenId),
    { kind: 'wrap', id, srcs, className },
    sorted.length === 1 ? `Wrap ${describeLayer(sorted[0])} in a stack` : `Wrap ${sorted.length} elements in a stack`,
  )
  pinAfterRedraw(`${NEW_PREFIX}${id}`)
  return id
}

/** Whether `layer` is a plain stack unwrap would accept. */
function unwrappable(layer: Layer, slug: string): boolean {
  if (layer.kind !== 'element' || blockOf(layer, slug) || layer.node?.name !== 'div') return false
  if (layer.node.slot !== 'child') return false
  return layer.children.length > 0
}

/**
 * What Unwrap acts on for a selection: the layer itself when it is a plain
 * stack, otherwise the stack it sits in — so a child can take its own stack
 * away, as the stack itself can. A stack still only staged is taken off the
 * list instead of being unwrapped.
 */
export function unwrapTarget(layer: Layer, slug: string): Layer | null {
  const staged = (l: Layer | null) => (l?.kind === 'new' && l.newId && newEdit(l.newId)?.kind === 'wrap' ? l : null)
  if (layer.kind === 'new') return staged(layer)
  if (unwrappable(layer, slug)) return layer
  const parent = layer.parent?.kind === 'list' ? layer.parent.parent : layer.parent
  if (!parent) return null
  return staged(parent) ?? (unwrappable(parent, slug) ? parent : null)
}

/** Unwrap the selection's stack (see unwrapTarget). */
export function unwrapAt(layer: Layer, slug: string, screenId: string): boolean {
  const target = unwrapTarget(layer, slug)
  if (!target) return false
  if (target.kind === 'new' && target.newId) {
    removeNew(target.newId)
    return true
  }
  const address = addressOfLayer(target)
  if (!address) return false
  stageStructuralEdit(layerContext(target, slug, screenId), { kind: 'unwrap', src: address.src }, `Unwrap ${describeLayer(target)}`)
  return true
}

// --- stack layout ------------------------------------------------------------------

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
 * Whether the panel offers Auto layout for `el` — the client twin of
 * `canHold` in structure.ts, judged from the DOM. A component is judged by its
 * name, an HTML element by its tag.
 */
export function canHoldDom(el: Element): boolean {
  const fds = el.getAttribute('data-fds')
  if (fds) return CONTAINER_COMPONENTS.includes(fds) || !LEAF_COMPONENTS.includes(fds)
  return BOX_TAGS.includes(el.tagName.toLowerCase())
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

// --- text ----------------------------------------------------------------------------

/**
 * Where the words a layer shows are written, and so what typing over them
 * changes:
 *
 *   text  JSX text on the element — `<p>Total</p>` (or a component's
 *         children, `<Badge>Baru</Badge>`)
 *   prop  a prop of one use of a component — `<StatCell label="…" />` shown by
 *         StatCell's `<p>{label}</p>`. Only that use changes.
 *   find  a string somewhere in the project — a list row's `{item.name}` —
 *         looked up when the words are committed
 *   wait  the file's facts are still on their way
 *   none  put together by code; `reason` says so
 *
 * `scope` is the component whose own markup is changed, when it is: every
 * use of it shows the new words.
 */
export type TextPlan =
  | { kind: 'text'; src: Src; version: string | null; shows?: Src; scope: Layer | null }
  | { kind: 'prop'; src: Src; version: string | null; prop: string; component: string; old: string | null; shows: Src }
  | { kind: 'find'; shows: Src }
  | { kind: 'wait' }
  | { kind: 'none'; reason: string }

const NONE_MIXED = 'Part of this text is filled in by code, so it can’t be typed over here. Ask Chat to change it.'

export function textPlan(layer: Layer, slug: string): TextPlan {
  const host = layer.hosts[0]
  if (!host || !isTextBox(host)) return { kind: 'none', reason: '' }
  if (layer.kind === 'new' || layer.kind === 'copy' || layer.kind === 'list') {
    return { kind: 'none', reason: 'Its text can be changed once it is saved.' }
  }
  const at: JsxNode | undefined = layer.fold[layer.fold.length - 1]
  if (!at) return { kind: 'none', reason: '' }
  if (!fileOfSrc(at.src).startsWith(`projects/${slug}/`)) {
    return { kind: 'none', reason: 'This comes from the project this prototype builds on.' }
  }
  const tree = getLayerTree()
  const layerOfNode = (n: JsxNode | null) => (n ? (tree.all.find((l) => l.fold.includes(n)) ?? null) : null)

  const facts = factsAt(slug, at.src, at.version)
  if (!facts) return { kind: 'wait' }
  if (facts.text === 'literal') return { kind: 'text', src: at.src, version: at.version, scope: layerOfNode(at.owner) }
  if (facts.text === 'mixed') return { kind: 'none', reason: NONE_MIXED }
  if (facts.text === 'none') return { kind: 'none', reason: '' }

  if (facts.text === 'prop' && facts.textProp) {
    // Up through the components that hand the words on, to where they are
    // written as a value.
    let prop = facts.textProp
    let owner = at.owner
    while (owner) {
      const use = factsAt(slug, owner.src, owner.version)
      if (!use) return { kind: 'wait' }
      if (prop === 'children') {
        if (use.text === 'literal') {
          return { kind: 'text', src: owner.src, version: owner.version, shows: at.src, scope: layerOfNode(owner.owner) }
        }
        if (use.text === 'prop' && use.textProp) {
          prop = use.textProp
          owner = owner.owner
          continue
        }
        break
      }
      const value = use.props[prop]
      if (typeof value === 'string') {
        return { kind: 'prop', src: owner.src, version: owner.version, prop, component: owner.name, old: value, shows: at.src }
      }
      // Not set on this use at all: the words are the component's default.
      // Setting the prop here changes this use only, as an override should.
      if (!(prop in use.props) && !use.exprProps.includes(prop) && !use.exprProps.includes('...')) {
        return { kind: 'prop', src: owner.src, version: owner.version, prop, component: owner.name, old: null, shows: at.src }
      }
      const passed = use.passes?.[prop]
      if (!passed) break
      prop = passed
      owner = owner.owner
    }
  }
  return { kind: 'find', shows: at.src }
}

/**
 * Write new words for a layer's text, wherever they are written (textPlan).
 * Returns why it couldn't, or null once the change is staged and previewed.
 */
export async function commitText(layer: Layer, next: string, slug: string, screenId: string): Promise<string | null> {
  const host = layer.hosts[0]
  const old = (host?.textContent ?? '').replace(/\s+/g, ' ').trim()
  const words = next.replace(/\s+/g, ' ').trim()
  if (!host || !words || words === old) return null
  // Tracing words through a component takes a file's facts per step; wait for
  // them rather than turn the designer away.
  let plan = textPlan(layer, slug)
  for (let i = 0; i < 6 && plan.kind === 'wait'; i++) {
    await nextFacts()
    plan = textPlan(layer, slug)
  }
  switch (plan.kind) {
    case 'text':
      if (/[<>{}]/.test(words)) return 'Text here can’t contain < > { or }.'
      stageTextEdit({ slug, screenId, version: plan.version ?? undefined }, plan.src, old, words, plan.shows)
      if (plan.shows) applyShownText(plan.shows, old, words)
      else applyTextSwap(plan.src, words)
      return null
    case 'prop':
      if (/["{}<>\\]/.test(words)) return 'Text here can’t contain quotes, < > { } or \\.'
      stagePropEdit({ slug, screenId, version: plan.version ?? undefined }, plan.src, plan.component, plan.prop, plan.old, words, plan.shows)
      applyShownText(plan.shows, old, words)
      return null
    case 'find': {
      const found = await findText(slug, old)
      if (!found) return 'The studio couldn’t look this text up. Ask Chat to change it.'
      if (found.length === 0) return 'This text is worked out by code, not written anywhere as it is. Ask Chat to change it.'
      if (found.length > 1) return `This text is written in ${found.length} places in the code, so it’s not clear which one to change. Ask Chat to change it.`
      const [match] = found
      stageLiteralEdit({ slug, screenId, version: match.version }, match.src, old, words, plan.shows)
      applyShownText(plan.shows, old, words)
      return null
    }
    case 'wait':
      return 'Still reading this screen’s code — try again in a moment.'
    default:
      return plan.reason || 'This text can’t be changed here.'
  }
}

