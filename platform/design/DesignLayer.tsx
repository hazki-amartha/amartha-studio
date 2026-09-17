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
//   • dragging — press on an element, move, drop between or into others; and
//     dropping a component dragged out of the Insert panel;
//   • the rest of a multi-selection (shift-click), outlined;
//   • gap handles on a selected stack — drag the band between two children;
//   • the keyboard — ⌫ delete, ⌘D duplicate, ⌥↑/⌥↓ move, ⌥⌘G wrap,
//     ⇧⌘G unwrap, ⌘Z undo.
//
// Geometry follows InspectLayer: this layer sits inside the scaled screen, so
// boxes are computed in the screen's own unscaled coordinates.
// =============================================================================

import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  addressOf,
  canHoldDom,
  duplicateElement,
  fileOfElement,
  gapsOf,
  insertItem,
  isRow,
  moveStep,
  moveTo,
  removeElement,
  setLayout,
  structuralBlock,
  unwrapElement,
  wrapElements,
} from './actions'
import { revertStagedPatch } from './applyDom'
import { insertBeingDragged } from './DesignSections'
import {
  getDesignStoreServerSnapshot,
  getDesignStoreState,
  subscribeDesignStore,
  undoLast,
  unstageLast,
} from './designStore'
import { GHOST_ATTR, isHidden, refind, visibleBySrc, watchOverlay } from './overlay'
import { layoutOf, SPACING } from './layout'
import type { Place } from './protocol'
import {
  clearSelection,
  getSelection,
  getSelectionServerSnapshot,
  pruneSelection,
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

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

interface Drop {
  to: Place
  target: Element
  /** Where to draw: a line (between) or a box (into). */
  line: DOMRect | null
  box: DOMRect | null
}

const NAMED = '[data-src], [data-design-new]'

/**
 * The nearest element under the pointer a drop can name, walking outwards.
 * `fileOk` says which files the drop may land in: a moved element's own file,
 * or for an insert, any file in the project.
 */
function candidate(el: Element | null, dragged: Element | null, fileOk: (file: string) => boolean): Element | null {
  let at = el?.closest(NAMED) ?? null
  while (at) {
    const file = fileOfElement(at)
    const ok =
      file !== null &&
      fileOk(file) &&
      !isHidden(at) &&
      at.getAttribute(GHOST_ATTR) !== 'copy' &&
      !(dragged && dragged.contains(at))
    if (ok) return at
    at = at.parentElement?.closest(NAMED) ?? null
  }
  return null
}

/**
 * What a drop at (x, y) would do, or null for nowhere.
 *
 * Over an element: before or after it, by which half of it the pointer is in
 * along its parent's direction. Over the inner middle of a container that can
 * hold children: into it. That middle band is only offered when the container
 * is big enough to have one — on a slim row every point is an edge.
 */
function dropAt(
  x: number,
  y: number,
  dragged: Element | null,
  fileOk: (file: string) => boolean,
): Drop | null {
  const stack = document.elementsFromPoint(x, y)
  let target: Element | null = null
  for (const el of stack) {
    if (el.closest('[data-inspect-layer]')) continue
    if (!el.closest('[data-inspect]')) continue
    target = candidate(el, dragged, fileOk)
    if (target) break
  }
  if (!target) return null
  const at = addressOf(target)
  if (!at) return null

  const r = target.getBoundingClientRect()
  const row = isRow(target.parentElement)
  const along = row ? (x - r.left) / r.width : (y - r.top) / r.height
  const span = row ? r.width : r.height
  const screen = target.getAttribute('data-fds') === 'Screen'

  // The screen itself can only be dropped INTO; everything else, into its
  // middle band when it holds children, beside it otherwise.
  if (canHoldDom(target) && (screen || (span > 32 && along > 0.25 && along < 0.75))) {
    return { to: { inside: at }, target, line: null, box: r }
  }
  if (screen) return null

  const before = along < 0.5
  const line = row
    ? new DOMRect(before ? r.left - 2 : r.right - 1, r.top, 3, r.height)
    : new DOMRect(r.left, before ? r.top - 2 : r.bottom - 1, r.width, 3)
  return { to: before ? { before: at } : { after: at }, target, line, box: null }
}

export function DesignLayer({ slug, screenId, pinned, onPin, onRepin }: DesignLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
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

  // --- the overlay ------------------------------------------------------------
  const overlayRef = useRef<ReturnType<typeof watchOverlay> | null>(null)
  useEffect(() => {
    const watch = watchOverlay(
      () => getDesignStoreState().structure,
      () => {
        pruneSelection(refind)
        // Something just created asked to be selected once it is drawn.
        const wanted = takePinAfterRedraw()
        const made = wanted ? visibleBySrc(wanted) : null
        if (made) {
          ctxRef.current.onPin(made)
          return
        }
        // A redraw replaces moved copies; keep the selection on whatever now
        // shows the pinned element.
        const pin = pinnedRef.current
        if (!pin || (pin.isConnected && !isHidden(pin))) return
        const { onRepin: repin, onPin: pin1 } = ctxRef.current
        if (repin) repin(pin)
        else pin1(refind(pin))
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
        const b = measure(layer, el.getBoundingClientRect())
        node.style.display = ''
        node.style.left = `${b.left}px`
        node.style.top = `${b.top}px`
        node.style.width = `${b.width}px`
        node.style.height = `${b.height}px`
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
      const gaps = pin && !isHidden(pin) ? gapsOf(pin) : []
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
        const b = measure(layer, g.rect)
        node.style.left = `${b.left}px`
        node.style.top = `${b.top}px`
        node.style.width = `${b.width}px`
        node.style.height = `${b.height}px`
        node.dataset.row = g.row ? '1' : ''
        const tag = node.firstElementChild as HTMLElement
        if (tag.textContent !== label) tag.textContent = label
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // --- dragging ---------------------------------------------------------------
  useEffect(() => {
    const layer = layerRef.current
    const viewport = layer?.parentElement
    if (!layer || !viewport) return

    let press: { el: Element; x: number; y: number; file: string } | null = null
    const inProject = (file: string) => file.startsWith(`projects/${ctxRef.current.slug}/`)
    let dragging = false
    let drop: Drop | null = null
    let swallowClick = false

    const draw = (d: Drop | null) => {
      const line = lineRef.current
      const box = boxRef.current
      if (!line || !box) return
      const put = (node: HTMLElement, rect: DOMRect | null) => {
        if (!rect) {
          node.style.display = 'none'
          return
        }
        const b = measure(layer, rect)
        node.style.display = ''
        node.style.left = `${b.left}px`
        node.style.top = `${b.top}px`
        node.style.width = `${b.width}px`
        node.style.height = `${b.height}px`
      }
      put(line, d?.line ?? null)
      put(box, d?.box ?? null)
    }

    const dim = (el: Element | null, on: boolean) => {
      if (el instanceof HTMLElement) el.style.opacity = on ? '0.4' : ''
    }

    // A press on a gap band of the selected stack drags its gap instead.
    let gapDrag: { el: Element; row: boolean; start: number; from: number } | null = null
    const onGapDown = (e: PointerEvent): boolean => {
      const pin = pinnedRef.current
      if (!pin || isHidden(pin)) return false
      const hit = gapsOf(pin).find(
        (g) =>
          e.clientX >= g.rect.left - 2 &&
          e.clientX <= g.rect.right + 2 &&
          e.clientY >= g.rect.top - 2 &&
          e.clientY <= g.rect.bottom + 2,
      )
      if (!hit) return false
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
      if (e.button !== 0 || e.altKey || !(e.target instanceof Element)) return
      if (onGapDown(e)) return
      const el = e.target.closest('[data-src]')
      if (!el || isHidden(el) || !el.closest('[data-inspect]')) return
      // Pressing inside the selection drags the selection — so a card can be
      // picked up by its text once the card is selected. Anywhere else drags
      // what a click there would select.
      const pin = pinnedRef.current
      const grab = pin && pin.contains(el) ? pin : el
      if (structuralBlock(grab, ctxRef.current.slug)) return
      const file = fileOfElement(grab)
      if (!file || grab.hasAttribute('data-design-new')) return
      press = { el: grab, x: e.clientX, y: e.clientY, file }
    }

    const onMove = (e: PointerEvent) => {
      if (gapDrag) {
        // Screen pixels to the frame's: the device is scaled.
        const scale = layer.getBoundingClientRect().width / layer.offsetWidth || 1
        const moved = ((gapDrag.row ? e.clientX : e.clientY) - gapDrag.start) / scale
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
      if (!dragging) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5) return
        dragging = true
        dim(press.el, true)
        if (press.el !== pinnedRef.current) ctxRef.current.onPin(press.el)
      }
      const file = press.file
      drop = dropAt(e.clientX, e.clientY, press.el, (f) => f === file)
      draw(drop)
    }

    const finish = () => {
      gapDrag = null
      if (press && dragging) {
        dim(press.el, false)
        if (drop) {
          const { slug: s, screenId: id } = ctxRef.current
          moveTo(press.el, drop.to, drop.target, s, id)
        }
        swallowClick = true
      }
      press = null
      dragging = false
      drop = null
      draw(null)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && press) {
        dim(press.el, false)
        press = null
        dragging = false
        drop = null
        draw(null)
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

    // Dropping a component dragged out of the Insert panel.
    const onDragOver = (e: DragEvent) => {
      const what = insertBeingDragged()
      if (!what) return
      drop = dropAt(e.clientX, e.clientY, null, inProject)
      draw(drop)
      if (drop) {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      }
    }
    const onDragLeave = (e: DragEvent) => {
      if (!viewport.contains(e.relatedTarget as Node | null)) {
        drop = null
        draw(null)
      }
    }
    const onDrop = (e: DragEvent) => {
      const what = insertBeingDragged()
      const d = drop ?? (what ? dropAt(e.clientX, e.clientY, null, inProject) : null)
      drop = null
      draw(null)
      if (!what || !d) return
      e.preventDefault()
      const { slug: s, screenId: id } = ctxRef.current
      insertItem(what.item, d.to, d.target, s, id, what.icon)
    }

    viewport.addEventListener('dragover', onDragOver)
    viewport.addEventListener('dragleave', onDragLeave)
    viewport.addEventListener('drop', onDrop)
    viewport.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', finish, true)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('click', onClick, true)
    return () => {
      viewport.removeEventListener('dragover', onDragOver)
      viewport.removeEventListener('dragleave', onDragLeave)
      viewport.removeEventListener('drop', onDrop)
      viewport.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', finish, true)
      window.removeEventListener('pointercancel', finish, true)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('click', onClick, true)
    }
  }, [])

  // --- the keyboard -----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      const pin = pinnedRef.current
      const { slug: s, screenId: id } = ctxRef.current
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (getDesignStoreState().pending.length > 0) {
          const last = unstageLast()
          if (last) revertStagedPatch(last.edit, last.component)
        } else {
          void undoLast()
        }
        return
      }

      if (!pin) return
      if (mod && e.altKey && e.code === 'KeyG') {
        e.preventDefault()
        wrapElements([pin, ...getSelection()], s, id)
        clearSelection()
      } else if (mod && e.shiftKey && e.code === 'KeyG') {
        e.preventDefault()
        unwrapElement(pin, s, id)
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && !mod) {
        e.preventDefault()
        removeElement(pin, s, id)
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateElement(pin, s, id)
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        e.preventDefault()
        moveStep(pin, -1, s, id)
      } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault()
        moveStep(pin, 1, s, id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div ref={layerRef} data-inspect-layer className={styles.layer}>
      <div ref={lineRef} className={styles.line} style={{ display: 'none' }} />
      <div ref={boxRef} className={styles.box} style={{ display: 'none' }} />
      <div ref={alsoRef} />
      <div ref={gapsRef} />
    </div>
  )
}
