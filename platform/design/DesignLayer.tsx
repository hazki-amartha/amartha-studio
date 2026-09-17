'use client'

// =============================================================================
// Design · the device-side half of design mode.
//
// Mounted inside the device screen beside the pick layer (InspectLayer), for
// as long as design mode is on — not tied to the panel, which can be
// minimized while the designer keeps working on the canvas. It owns three
// things the panel can't:
//
//   • the structural overlay — kept drawn across React re-renders;
//   • dragging — press on an element, move, drop between or into others;
//   • the keyboard — ⌫ delete, ⌘D duplicate, ⌥↑/⌥↓ move, ⌘Z undo.
//
// Geometry follows InspectLayer: this layer sits inside the scaled screen, so
// boxes are computed in the screen's own unscaled coordinates.
// =============================================================================

import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  canHoldDom,
  duplicateElement,
  moveStep,
  moveTo,
  removeElement,
  structuralBlock,
} from './actions'
import { revertStagedPatch, srcOf } from './applyDom'
import {
  fileOf,
  getDesignStoreServerSnapshot,
  getDesignStoreState,
  subscribeDesignStore,
  undoLast,
  unstageLast,
} from './designStore'
import { GHOST_ATTR, isHidden, visibleBySrc, watchOverlay } from './overlay'
import type { Place } from './protocol'
import styles from './design.module.css'

export interface DesignLayerProps {
  slug: string
  screenId: string
  pinned: Element | null
  onPin: (el: Element | null) => void
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

/** Whether children of `el` flow left-to-right rather than top-to-bottom. */
function isRow(el: Element | null): boolean {
  if (!el) return false
  const s = getComputedStyle(el)
  return s.display.includes('flex') && s.flexDirection.startsWith('row')
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

/** An element that can be named as a drop target for `dragged`. */
function candidate(el: Element | null, dragged: Element, file: string): Element | null {
  let at = el?.closest('[data-src]') ?? null
  while (at) {
    const src = srcOf(at)
    const ok =
      src &&
      fileOf(src) === file &&
      !isHidden(at) &&
      at.getAttribute(GHOST_ATTR) !== 'copy' &&
      !dragged.contains(at) &&
      at.getAttribute('data-fds') !== 'Screen'
    if (ok) return at
    at = at.parentElement?.closest('[data-src]') ?? null
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
function dropAt(x: number, y: number, dragged: Element, file: string): Drop | null {
  const stack = document.elementsFromPoint(x, y)
  let target: Element | null = null
  for (const el of stack) {
    if (el.closest('[data-inspect-layer]')) continue
    if (!el.closest('[data-inspect]')) continue
    target = candidate(el, dragged, file)
    if (target) break
  }

  // Nothing addressable under the pointer: the screen's own body. Dropping
  // there means "last on the screen", which is the Screen's last child.
  if (!target) return null

  const r = target.getBoundingClientRect()
  const row = isRow(target.parentElement)
  const along = row ? (x - r.left) / r.width : (y - r.top) / r.height
  const span = row ? r.width : r.height

  if (canHoldDom(target) && span > 32 && along > 0.25 && along < 0.75) {
    return { to: { inside: srcOf(target)! }, target, line: null, box: r }
  }

  const before = along < 0.5
  const line = row
    ? new DOMRect(before ? r.left - 2 : r.right - 1, r.top, 3, r.height)
    : new DOMRect(r.left, before ? r.top - 2 : r.bottom - 1, r.width, 3)
  return {
    to: before ? { before: srcOf(target)! } : { after: srcOf(target)! },
    target,
    line,
    box: null,
  }
}

export function DesignLayer({ slug, screenId, pinned, onPin }: DesignLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const store = useSyncExternalStore(
    subscribeDesignStore,
    getDesignStoreState,
    getDesignStoreServerSnapshot,
  )

  // Held in refs so the listeners, bound once, see the latest values.
  const pinnedRef = useRef(pinned)
  pinnedRef.current = pinned
  const ctxRef = useRef({ slug, screenId, onPin })
  ctxRef.current = { slug, screenId, onPin }

  // --- the overlay ------------------------------------------------------------
  const overlayRef = useRef<ReturnType<typeof watchOverlay> | null>(null)
  useEffect(() => {
    const watch = watchOverlay(
      () => getDesignStoreState().structure,
      () => {
        // A redraw replaces moved copies; keep the selection on whatever now
        // shows the pinned element.
        const pin = pinnedRef.current
        if (!pin || (pin.isConnected && !isHidden(pin))) return
        const src = srcOf(pin)
        ctxRef.current.onPin(src ? visibleBySrc(src) : null)
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

  // --- dragging ---------------------------------------------------------------
  useEffect(() => {
    const layer = layerRef.current
    const viewport = layer?.parentElement
    if (!layer || !viewport) return

    let press: { el: Element; x: number; y: number; file: string } | null = null
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

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.altKey || !(e.target instanceof Element)) return
      const el = e.target.closest('[data-src]')
      if (!el || isHidden(el) || !el.closest('[data-inspect]')) return
      // Pressing inside the selection drags the selection — so a card can be
      // picked up by its text once the card is selected. Anywhere else drags
      // what a click there would select.
      const pin = pinnedRef.current
      const grab = pin && pin.contains(el) ? pin : el
      if (structuralBlock(grab, ctxRef.current.slug)) return
      const src = srcOf(grab)
      if (!src) return
      press = { el: grab, x: e.clientX, y: e.clientY, file: fileOf(src) }
    }

    const onMove = (e: PointerEvent) => {
      if (!press) return
      if (!dragging) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5) return
        dragging = true
        dim(press.el, true)
        if (press.el !== pinnedRef.current) ctxRef.current.onPin(press.el)
      }
      drop = dropAt(e.clientX, e.clientY, press.el, press.file)
      draw(drop)
    }

    const finish = () => {
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

    viewport.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', finish, true)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('click', onClick, true)
    return () => {
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
      if ((e.key === 'Backspace' || e.key === 'Delete') && !mod) {
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
    </div>
  )
}
