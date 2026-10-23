'use client'

// =============================================================================
// Design · the device-side half of design mode.
//
// Mounted inside the device screen beside the pick layer (InspectLayer), for
// as long as design mode is on — not tied to the panel, which can be
// minimized while the designer keeps working on the canvas. It owns what the
// panel can't:
//
//   • the structural overlay — kept drawn across React re-renders;
//   • dragging, the way auto layout does it: press on a layer and move; a copy
//     of it follows the pointer, a line shows the gap it will land in, the
//     screen scrolls at its edges, and what can't be moved says why at the
//     pointer instead of ignoring the drag. Components dragged out of the
//     Insert panel land the same way;
//   • double-click: one level into the selection, or typing over its text;
//   • the rest of a multi-selection (shift-click), outlined;
//   • gap handles on a selected stack — drag the band between two children;
//   • the keyboard — ⌫ delete, ⌘D duplicate, arrows (or ⌥arrows) move, ⌥⌘G
//     wrap, ⇧⌘G unwrap, ⌘Z undo, and Figma's Enter / ⇧Enter / Tab to move
//     the selection in, out and along.
//
// What a press or a click picks is a layer (layers.ts), not the element under
// the pointer — a click picks at the selection's own depth, as Figma does.
//
// Geometry follows InspectLayer: this layer sits inside the scaled screen, so
// boxes are computed in the screen's own unscaled coordinates.
// =============================================================================

import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  commitText,
  deleteLayer,
  duplicateLayer,
  gapsOf,
  insertItem,
  isRow,
  moveLayer,
  setLayout,
  stepLayer,
  textPlan,
  unwrapAt,
  wrapLayers,
} from './actions'
import { repaint, revertStagedPatch } from './applyDom'
import { insertBeingDragged } from './DesignSections'
import {
  getDesignStoreServerSnapshot,
  getDesignStoreState,
  newEdit,
  noteDesignError,
  subscribeDesignStore,
  undoLast,
  unstageLast,
  valueEdits,
} from './designStore'
import {
  blockOf,
  boxOf,
  drillLayer,
  getLayerTree,
  invalidateLayers,
  isTextBox,
  layerAt,
  layerOfPin,
  pickLayer,
  planDrop,
  scopeOf,
  siblingsOf,
  subscribeLayers,
  watchLayers,
  within,
  type DropPlan,
  type Layer,
} from './layers'
import { isHidden, refind, watchOverlay } from './overlay'
import { layoutOf, SPACING } from './layout'
import { selectLayer, setDragging } from './pick'
import {
  clearSelection,
  findRemembered,
  getSelection,
  getSelectionServerSnapshot,
  pruneSelection,
  rememberedLayerId,
  rememberLayer,
  subscribeSelection,
  takePinAfterRedraw,
} from './selection'
import styles from './design.module.css'

export interface DesignLayerProps {
  slug: string
  screenId: string
  pinned: Element | null
  onPin: (el: Element | null) => void
  /** Replace a pin that left the screen, if it is still the pin. */
  onRepin?: (stale: Element) => void
  /** Clicks tap through to the prototype, so a press starts no drag. */
  passive?: boolean
}

interface Box {
  left: number
  top: number
  width: number
  height: number
}

function measure(layer: HTMLElement, r: DOMRect): Box {
  const origin = layer.getBoundingClientRect()
  const scale = origin.width / layer.offsetWidth || 1
  return {
    left: (r.left - origin.left) / scale,
    top: (r.top - origin.top) / scale,
    width: r.width / scale,
    height: r.height / scale,
  }
}

function put(node: HTMLElement | null, b: Box | null) {
  if (!node) return
  if (!b) {
    node.style.display = 'none'
    return
  }
  node.style.display = ''
  node.style.left = `${b.left}px`
  node.style.top = `${b.top}px`
  node.style.width = `${b.width}px`
  node.style.height = `${b.height}px`
}

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

/** Whether a page element is inside one of a layer's boxes. */
const holds = (layer: Layer, el: Element) => layer.hosts.some((h) => h === el || h.contains(el))

/** Copies of a layer's boxes, for the drag preview: inert, addressless. */
function ghostOf(layer: Layer, scale: number): HTMLElement {
  const ghost = document.createElement('div')
  ghost.className = styles.ghost
  for (const host of layer.hosts.slice(0, 8)) {
    const copy = host.cloneNode(true) as HTMLElement
    for (const n of [copy, ...Array.from(copy.querySelectorAll('*'))]) {
      for (const a of ['data-src', 'data-src-v', 'data-design-new', 'data-design-ghost', 'id']) n.removeAttribute(a)
    }
    const r = host.getBoundingClientRect()
    copy.style.width = `${r.width / scale}px`
    copy.style.margin = '0'
    copy.style.opacity = ''
    ghost.appendChild(copy)
  }
  return ghost
}

export function DesignLayer({ slug, screenId, pinned, onPin, onRepin, passive = false }: DesignLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const alsoRef = useRef<HTMLDivElement>(null)
  const gapsRef = useRef<HTMLDivElement>(null)
  const extra = useSyncExternalStore(subscribeSelection, getSelection, getSelectionServerSnapshot)
  const store = useSyncExternalStore(
    subscribeDesignStore,
    getDesignStoreState,
    getDesignStoreServerSnapshot,
  )

  // Held in refs so the listeners, bound once, see the latest values.
  const pinnedRef = useRef(pinned)
  pinnedRef.current = pinned
  const ctxRef = useRef({ slug, screenId, onPin, onRepin })
  ctxRef.current = { slug, screenId, onPin, onRepin }
  const passiveRef = useRef(passive)
  passiveRef.current = passive

  const select = (layer: Layer | null) => selectLayer(layer, ctxRef.current.onPin)
  const current = () => layerOfPin(pinnedRef.current, rememberedLayerId())

  // --- the layers, kept current while Edit is open -----------------------------
  useEffect(() => watchLayers(), [])

  // A save reloads the screen and every address below a moved card shifts:
  // keep the selection on the same layer by what it looks like.
  useEffect(
    () =>
      subscribeLayers(() => {
        const pin = pinnedRef.current
        if (!pin) return
        if (pin.isConnected && !isHidden(pin)) {
          // Still on screen: keep what it is remembered by current — its
          // words just changed, say — so a reload can find it again.
          rememberLayer(layerOfPin(pin, rememberedLayerId()))
          return
        }
        const again = findRemembered(getLayerTree().all)
        if (again?.hosts[0]) ctxRef.current.onPin(again.hosts[0])
      }),
    [],
  )

  // --- the overlay ------------------------------------------------------------
  const overlayRef = useRef<ReturnType<typeof watchOverlay> | null>(null)
  useEffect(() => {
    const watch = watchOverlay(
      () => getDesignStoreState().structure,
      () => {
        invalidateLayers()
        // Staged value edits live only on the elements they were painted on;
        // a re-render (or a reopened screen) drops them, so paint them again.
        for (const patch of valueEdits()) repaint(patch)
        pruneSelection(refind)
        // Something just created asked to be selected once it is drawn.
        const wanted = takePinAfterRedraw()
        const made = wanted ? getLayerTree().byId.get(wanted) : null
        if (made) {
          selectLayer(made, ctxRef.current.onPin)
          return
        }
        // A redraw replaces moved copies; keep the selection on whatever now
        // shows the pinned layer.
        const pin = pinnedRef.current
        if (!pin || (pin.isConnected && !isHidden(pin))) return
        const again = findRemembered(getLayerTree().all)
        if (again?.hosts[0]) {
          ctxRef.current.onPin(again.hosts[0])
          return
        }
        const { onRepin: repin, onPin: pin1 } = ctxRef.current
        if (repin) repin(pin)
        else pin1(refind(pin))
      },
      // Written structure is still drawn until the screen reloads, with nothing
      // pending: that reload is exactly the change that must clear it.
      () => {
        const s = getDesignStoreState()
        return s.pending.length > 0 || s.structure.length > 0
      },
    )
    overlayRef.current = watch
    return () => {
      watch.stop()
      overlayRef.current = null
    }
  }, [])

  useEffect(() => {
    overlayRef.current?.redraw()
  }, [store.structure, screenId])

  // A plain click moves the pin and starts a new selection; shift-clicks only
  // ever add to `extra`, so a pin change is always a plain one.
  useEffect(() => {
    clearSelection()
  }, [pinned])
  useEffect(() => () => clearSelection(), [])

  // Outline the rest of the selection, following it as the screen moves.
  useEffect(() => {
    const layer = layerRef.current
    const host = alsoRef.current
    if (!layer || !host) return
    let raf = 0
    const tick = () => {
      while (host.children.length < extra.length) {
        const d = document.createElement('div')
        d.className = styles.also
        host.appendChild(d)
      }
      while (host.children.length > extra.length) host.lastChild?.remove()
      extra.forEach((el, i) => {
        const node = host.children[i] as HTMLElement
        if (!el.isConnected) {
          node.style.display = 'none'
          return
        }
        const l = layerAt(el)
        put(node, measure(layer, l ? boxOf(l) : el.getBoundingClientRect()))
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [extra])

  // Gap handles: the space between a selected stack's children, drawn as a
  // band with its value, so the gap can be dragged like Figma's.
  useEffect(() => {
    const layer = layerRef.current
    const host = gapsRef.current
    if (!layer || !host) return
    let raf = 0
    const tick = () => {
      const pin = pinnedRef.current
      const viewport = layer.parentElement
      const busy = pin?.hasAttribute('data-design-editing') || viewport?.hasAttribute('data-dragging')
      const gaps = pin && !isHidden(pin) && !busy ? gapsOf(pin) : []
      const label = pin ? (layoutOf(Array.from(pin.classList)).gap ?? '0') : ''
      while (host.children.length < gaps.length) {
        const d = document.createElement('div')
        d.className = styles.gap
        const tag = document.createElement('span')
        tag.className = styles.gapTag
        d.appendChild(tag)
        host.appendChild(d)
      }
      while (host.children.length > gaps.length) host.lastChild?.remove()
      gaps.forEach((g, i) => {
        const node = host.children[i] as HTMLElement
        put(node, measure(layer, g.rect))
        node.dataset.row = g.row ? '1' : ''
        const tag = node.firstElementChild as HTMLElement
        if (tag.textContent !== label) tag.textContent = label
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // --- typing over text, on the screen -----------------------------------------
  const editingRef = useRef<{ el: HTMLElement; layer: Layer; was: string; done: (keep: boolean) => void } | null>(null)

  const startEditing = (layer: Layer) => {
    const el = layer.hosts[0]
    if (!(el instanceof HTMLElement) || editingRef.current) return
    const plan = textPlan(layer, ctxRef.current.slug)
    if (plan.kind === 'none') {
      if (plan.reason) noteDesignError('that text', plan.reason)
      return
    }
    const was = el.textContent ?? ''
    el.setAttribute('data-design-editing', '')
    el.setAttribute('contenteditable', 'plaintext-only')
    // A browser without plain-text editing takes the rich kind; the words are
    // read back as text either way.
    if (!el.isContentEditable) el.setAttribute('contenteditable', 'true')
    el.spellcheck = false
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    const finish = (keep: boolean) => {
      if (editingRef.current?.el !== el) return
      editingRef.current = null
      el.removeEventListener('keydown', onKey, true)
      el.removeEventListener('blur', onBlur)
      el.removeAttribute('contenteditable')
      el.removeAttribute('data-design-editing')
      window.getSelection()?.removeAllRanges()
      const next = el.textContent ?? ''
      el.textContent = was
      if (!keep || next.trim() === was.trim()) return
      const { slug: s, screenId: id } = ctxRef.current
      void commitText(layer, next, s, id).then((why) => {
        if (why) noteDesignError('that text', why)
      })
    }
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        finish(true)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        finish(false)
      }
    }
    const onBlur = () => finish(true)
    el.addEventListener('keydown', onKey, true)
    el.addEventListener('blur', onBlur)
    editingRef.current = { el, layer, was, done: finish }
  }

  // Leaving Edit, or the layer going away, ends the typing — kept.
  useEffect(() => () => editingRef.current?.done(true), [])

  // --- dragging -----------------------------------------------------------------
  useEffect(() => {
    const layer = layerRef.current
    const viewport = layer?.parentElement
    if (!layer || !viewport) return

    const scaleNow = () => layer.getBoundingClientRect().width / layer.offsetWidth || 1

    let press: { subject: Layer; x: number; y: number; dx: number; dy: number } | null = null
    let dragging = false
    let blocked: string | null = null
    let plan: DropPlan | null = null
    let ghost: HTMLElement | null = null
    let point = { x: 0, y: 0 }
    let scrollFrame = 0
    let swallowClick = false

    const draw = (p: DropPlan | null) => {
      put(lineRef.current, p?.line ? measure(layer, p.line) : null)
      put(boxRef.current, p?.box ? measure(layer, p.box) : null)
      put(targetRef.current, p && p.line ? measure(layer, boxOf(p.container)) : null)
    }

    const tip = (text: string | null, x = 0, y = 0) => {
      const node = tipRef.current
      if (!node) return
      if (!text) {
        node.style.display = 'none'
        return
      }
      if (node.textContent !== text) node.textContent = text
      const origin = layer.getBoundingClientRect()
      const scale = scaleNow()
      node.style.display = ''
      node.style.left = `${Math.min((x - origin.left) / scale + 12, layer.offsetWidth - 248)}px`
      node.style.top = `${(y - origin.top) / scale + 16}px`
    }

    const dim = (l: Layer | null, on: boolean) => {
      for (const h of l?.hosts ?? []) if (h instanceof HTMLElement) h.style.opacity = on ? '0.35' : ''
    }

    const replan = () => {
      if (!press || !dragging) return
      // The screen's layers are read again whenever the page changes — dimming
      // the dragged boxes is a change — so find the dragged layer in the
      // current reading, or nothing in it would match it.
      const tree = getLayerTree()
      const subject = tree.byId.get(press.subject.id) ?? press.subject
      plan = planDrop(point.x, point.y, subject, scopeOf(subject), tree, scaleNow())
      draw(plan)
    }

    // Near the top or bottom of the screen, scroll it — so a card can be
    // carried past the fold.
    const autoscroll = () => {
      scrollFrame = 0
      if (!dragging) return
      const scroller = viewport.querySelector('[data-screen-scroller]')
      if (scroller instanceof HTMLElement) {
        const r = scroller.getBoundingClientRect()
        const zone = 48 * scaleNow()
        let dy = 0
        if (point.y < r.top + zone) dy = -Math.ceil((r.top + zone - point.y) / 4)
        else if (point.y > r.bottom - zone) dy = Math.ceil((point.y - (r.bottom - zone)) / 4)
        if (dy) {
          scroller.scrollTop += dy
          replan()
        }
      }
      scrollFrame = requestAnimationFrame(autoscroll)
    }

    const end = () => {
      if (press) dim(press.subject, false)
      ghost?.remove()
      ghost = null
      press = null
      dragging = false
      blocked = null
      plan = null
      setDragging(false)
      viewport.removeAttribute('data-dragging')
      viewport.removeAttribute('data-drag-blocked')
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
      scrollFrame = 0
      draw(null)
      tip(null)
    }

    // A press on the handle in the middle of a gap of the selected stack —
    // its number tag — drags the gap, as Figma's spacing handle does. The rest
    // of the band belongs to the stack: pressing there picks the stack up.
    let gapDrag: { el: Element; row: boolean; start: number; from: number } | null = null
    const gapHandleAt = (x: number, y: number) => {
      const pin = pinnedRef.current
      if (!pin || isHidden(pin) || pin.hasAttribute('data-design-editing')) return null
      const reach = 14 * scaleNow()
      return (
        gapsOf(pin).find((g) => {
          const cx = g.rect.left + g.rect.width / 2
          const cy = g.rect.top + g.rect.height / 2
          return g.row
            ? Math.abs(y - cy) <= reach && x >= g.rect.left - 3 && x <= g.rect.right + 3
            : Math.abs(x - cx) <= reach && y >= g.rect.top - 3 && y <= g.rect.bottom + 3
        }) ?? null
      )
    }
    const onGapDown = (e: PointerEvent): boolean => {
      const pin = pinnedRef.current
      const hit = gapHandleAt(e.clientX, e.clientY)
      if (!pin || !hit) return false
      const gap = layoutOf(Array.from(pin.classList)).gap
      gapDrag = {
        el: pin,
        row: hit.row,
        start: hit.row ? e.clientX : e.clientY,
        from: gap === null ? 0 : SPACING.indexOf(gap),
      }
      return true
    }

    const onDown = (e: PointerEvent) => {
      // Navigating is using the app, not picking anything up — a ⌘-click
      // there selects, but never starts a drag.
      if (passiveRef.current) return
      if (e.button !== 0 || e.altKey || !(e.target instanceof Element)) return
      if (e.target.closest('[data-design-editing]')) return
      if (!e.target.closest('[data-screen-scroller]')) return
      // The canvas has the keyboard now: a button in the panel keeping focus
      // would take Enter and Tab for itself.
      const active = document.activeElement
      if (active instanceof HTMLElement && !typing(active) && !viewport.contains(active)) active.blur()
      if (onGapDown(e)) return
      const tree = getLayerTree()
      const selected = layerOfPin(pinnedRef.current, rememberedLayerId(), tree)
      // Pressing inside the selection drags the selection — so a card can be
      // picked up by its text once the card is selected. Anywhere else drags
      // what a click there would select.
      const subject =
        selected && holds(selected, e.target)
          ? selected
          : pickLayer(e.target, selected, e.metaKey || e.ctrlKey, tree)
      if (!subject || !subject.parent) return
      const box = boxOf(subject)
      press = { subject, x: e.clientX, y: e.clientY, dx: e.clientX - box.left, dy: e.clientY - box.top }
    }

    const onMove = (e: PointerEvent) => {
      // Over a gap's handle, the cursor says it resizes.
      if (!press && !gapDrag) {
        const hover = gapHandleAt(e.clientX, e.clientY)
        const want = hover ? (hover.row ? 'row' : 'col') : null
        if (viewport.getAttribute('data-gap-hover') !== want) {
          if (want) viewport.setAttribute('data-gap-hover', want)
          else viewport.removeAttribute('data-gap-hover')
        }
      }
      if (gapDrag) {
        // Screen pixels to the frame's: the device is scaled.
        const moved = ((gapDrag.row ? e.clientX : e.clientY) - gapDrag.start) / scaleNow()
        // A step per 8px of drag reads as deliberate without being sluggish.
        const index = Math.max(0, Math.min(SPACING.length - 1, gapDrag.from + Math.round(moved / 8)))
        const want = SPACING[index]
        if (layoutOf(Array.from(gapDrag.el.classList)).gap !== want) {
          const { slug: s, screenId: id } = ctxRef.current
          setLayout(gapDrag.el, { gap: want }, s, id)
        }
        swallowClick = true
        return
      }
      if (!press) return
      point = { x: e.clientX, y: e.clientY }
      if (!dragging && !blocked) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 4) return
        const subject = press.subject
        const reason =
          subject.kind === 'new'
            ? subject.newId && newEdit(subject.newId)?.kind === 'insert'
              ? null
              : 'A new stack can be moved once it is saved.'
            : blockOf(subject, ctxRef.current.slug)
        if (reason) {
          blocked = reason
          viewport.setAttribute('data-drag-blocked', '')
        } else {
          dragging = true
          setDragging(true)
          viewport.setAttribute('data-dragging', '')
          if (subject !== current()) select(subject)
          dim(subject, true)
          ghost = ghostOf(subject, scaleNow())
          // Under the drop line and the container's outline: the line is
          // usually right where the copy is, at the pointer.
          layer.insertBefore(ghost, layer.firstChild)
          scrollFrame = requestAnimationFrame(autoscroll)
        }
      }
      if (blocked) {
        tip(blocked, e.clientX, e.clientY)
        swallowClick = true
        return
      }
      if (ghost) {
        const origin = layer.getBoundingClientRect()
        const scale = scaleNow()
        ghost.style.left = `${(e.clientX - press.dx - origin.left) / scale}px`
        ghost.style.top = `${(e.clientY - press.dy - origin.top) / scale}px`
      }
      replan()
    }

    const finish = () => {
      if (gapDrag) viewport.removeAttribute('data-gap-hover')
      gapDrag = null
      if (press && dragging) {
        if (plan) {
          const { slug: s, screenId: id } = ctxRef.current
          moveLayer(press.subject, plan.to, plan.near, s, id)
        }
        swallowClick = true
      }
      end()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && press) {
        e.stopPropagation()
        swallowClick = dragging || Boolean(blocked)
        end()
      }
    }

    // The click that ends a drag must not re-pick whatever is under the
    // pointer. Caught on window, in the capture phase, so it runs before the
    // pick layer's own listener on the viewport.
    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return
      swallowClick = false
      e.stopPropagation()
      e.preventDefault()
    }

    // Double-click: one level into the selection under the pointer — or, on
    // text, type over it.
    const onDouble = (e: MouseEvent) => {
      if (passiveRef.current && !(e.metaKey || e.ctrlKey)) return
      if (!(e.target instanceof Element) || e.target.closest('[data-design-editing]')) return
      if (!e.target.closest('[data-screen-scroller]')) return
      e.preventDefault()
      e.stopPropagation()
      const tree = getLayerTree()
      const selected = layerOfPin(pinnedRef.current, rememberedLayerId(), tree)
      if (!selected || !holds(selected, e.target)) return
      const inner = drillLayer(selected, e.target, tree)
      if (inner) select(inner)
      else if (isTextBox(selected.hosts[0])) startEditing(selected)
    }

    // Dropping a component dragged out of the Insert panel.
    const insertScope = () => ({ owner: null, file: null, project: ctxRef.current.slug })
    const onDragOver = (e: DragEvent) => {
      const what = insertBeingDragged()
      if (!what) return
      plan = planDrop(e.clientX, e.clientY, null, insertScope(), getLayerTree(), scaleNow())
      draw(plan)
      if (plan) {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      }
    }
    const onDragLeave = (e: DragEvent) => {
      if (!viewport.contains(e.relatedTarget as Node | null)) {
        plan = null
        draw(null)
      }
    }
    const onDrop = (e: DragEvent) => {
      const what = insertBeingDragged()
      const p = plan ?? (what ? planDrop(e.clientX, e.clientY, null, insertScope(), getLayerTree(), scaleNow()) : null)
      plan = null
      draw(null)
      if (!what || !p) return
      e.preventDefault()
      const { slug: s, screenId: id } = ctxRef.current
      insertItem(what.item, p.to, p.near, s, id, what.icon)
    }

    viewport.addEventListener('dragover', onDragOver)
    viewport.addEventListener('dragleave', onDragLeave)
    viewport.addEventListener('drop', onDrop)
    viewport.addEventListener('pointerdown', onDown, true)
    viewport.addEventListener('dblclick', onDouble, true)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', finish, true)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('click', onClick, true)
    return () => {
      end()
      viewport.removeEventListener('dragover', onDragOver)
      viewport.removeEventListener('dragleave', onDragLeave)
      viewport.removeEventListener('drop', onDrop)
      viewport.removeEventListener('pointerdown', onDown, true)
      viewport.removeEventListener('dblclick', onDouble, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', finish, true)
      window.removeEventListener('pointercancel', finish, true)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('click', onClick, true)
    }
    // startEditing reads everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- the keyboard -----------------------------------------------------------
  useEffect(() => {
    const viewport = layerRef.current?.parentElement
    // Enter and Tab belong to whatever has focus, unless that is nothing — or
    // the canvas itself.
    const canvasHasKeys = () => {
      const a = document.activeElement
      return !a || a === document.body || Boolean(viewport?.contains(a))
    }

    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || editingRef.current) return
      const { slug: s, screenId: id } = ctxRef.current
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (getDesignStoreState().pending.length > 0) {
          const last = unstageLast()
          if (last) revertStagedPatch(last)
        } else {
          void undoLast()
        }
        return
      }

      const tree = getLayerTree()
      const layer = layerOfPin(pinnedRef.current, rememberedLayerId(), tree)
      if (!layer) return

      if (e.key === 'Enter' && canvasHasKeys()) {
        e.preventDefault()
        if (e.shiftKey) {
          if (layer.parent) select(layer.parent)
        } else if (layer.children.length > 0) {
          select(layer.children[0])
        } else if (isTextBox(layer.hosts[0])) {
          startEditing(layer)
        }
        return
      }
      if (e.key === 'Tab' && !mod && canvasHasKeys()) {
        const sibs = siblingsOf(layer, tree)
        if (sibs.length < 2) return
        e.preventDefault()
        const i = sibs.indexOf(layer)
        select(sibs[(i + (e.shiftKey ? -1 : 1) + sibs.length) % sibs.length])
        return
      }

      if (mod && e.altKey && e.code === 'KeyG') {
        e.preventDefault()
        const others = getSelection()
          .map((el) => layerAt(el, tree))
          .filter((l): l is Layer => l !== null && !within(l, layer) && !within(layer, l))
        wrapLayers([layer, ...others], s, id)
        clearSelection()
      } else if (mod && e.shiftKey && e.code === 'KeyG') {
        e.preventDefault()
        unwrapAt(layer, s, id)
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && !mod) {
        e.preventDefault()
        if (deleteLayer(layer, s, id)) select(null)
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateLayer(layer, s, id)
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        e.preventDefault()
        stepLayer(layer, -1, s, id)
      } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault()
        stepLayer(layer, 1, s, id)
      } else if (!mod && !e.shiftKey && e.key.startsWith('Arrow')) {
        // Auto layout, as in Figma: plain arrows reorder along the stack's own
        // axis — ←/→ in a row, ↑/↓ in a column. The other axis does nothing.
        const parent = layer.hosts[0]?.parentElement ?? null
        const row = isRow(parent)
        const dir =
          e.key === (row ? 'ArrowLeft' : 'ArrowUp') ? -1 : e.key === (row ? 'ArrowRight' : 'ArrowDown') ? 1 : 0
        if (!dir) return
        e.preventDefault()
        const reversed = parent ? getComputedStyle(parent).flexDirection.endsWith('reverse') : false
        stepLayer(layer, (reversed ? -dir : dir) as -1 | 1, s, id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // startEditing and select read everything through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={layerRef} data-inspect-layer className={styles.layer}>
      <div ref={targetRef} className={styles.target} style={{ display: 'none' }} />
      <div ref={lineRef} className={styles.line} style={{ display: 'none' }} />
      <div ref={boxRef} className={styles.box} style={{ display: 'none' }} />
      <div ref={alsoRef} />
      <div ref={gapsRef} />
      <div ref={tipRef} className={styles.tip} style={{ display: 'none' }} />
    </div>
  )
}
