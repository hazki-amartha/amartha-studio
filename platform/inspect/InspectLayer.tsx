'use client'

// =============================================================================
// Inspect · the overlay that makes the device pickable.
//
// Rendered INSIDE the device screen, as a sibling of the screen stage. That
// placement is load-bearing: `.screen` carries a transform (prototype.module.css),
// so it is the containing block for this absolutely-positioned layer, and the
// layer therefore inherits ScaledDevice's scale for free. Highlight boxes are
// computed in the screen's own unscaled 390px coordinate space and need no
// knowledge of the current zoom.
//
// The layer also turns the prototype read-only while it is mounted. Inspect is
// a mode, not a decoration: a click has to select the element rather than fire
// the screen's own onClick, or you could never inspect a button without also
// navigating away from it.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { boundaryOf, labelOf } from './resolve'
import styles from './inspect.module.css'

export interface InspectLayerProps {
  pinned: Element | null
  onPin: (el: Element | null) => void
  /** Highlight driven from outside the device — the layers outline pointing at
   *  a row. Takes precedence over the cursor's own hover, which by definition
   *  isn't over the device while the list is being used. */
  preview?: Element | null
}

interface Box {
  left: number
  top: number
  width: number
  height: number
}

function measure(layer: HTMLElement, el: Element): Box | null {
  if (!el.isConnected) return null
  const origin = layer.getBoundingClientRect()
  // The layer spans the screen exactly, so its own rendered-vs-layout width is
  // the frame's current scale. No dependency on ScaledDevice's state.
  const scale = origin.width / layer.offsetWidth || 1
  const r = el.getBoundingClientRect()
  return {
    left: (r.left - origin.left) / scale,
    top: (r.top - origin.top) / scale,
    width: r.width / scale,
    height: r.height / scale,
  }
}

function place(node: HTMLElement | null, box: Box | null) {
  if (!node) return
  if (!box) {
    node.style.display = 'none'
    return
  }
  node.style.display = ''
  node.style.left = `${box.left}px`
  node.style.top = `${box.top}px`
  node.style.width = `${box.width}px`
  node.style.height = `${box.height}px`
}

export function InspectLayer({ pinned, onPin, preview }: InspectLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const hoverBoxRef = useRef<HTMLDivElement>(null)
  const pinBoxRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLSpanElement>(null)

  const [hover, setHover] = useState<Element | null>(null)
  const [alt, setAlt] = useState(false)
  const [labelBelow, setLabelBelow] = useState(false)

  // Held in a ref as well so the event handlers, which are bound once, always
  // read the current modifier without re-binding on every keypress.
  const altRef = useRef(false)
  altRef.current = alt

  // --- input capture --------------------------------------------------------
  useEffect(() => {
    const layer = layerRef.current
    const viewport = layer?.parentElement
    if (!viewport) return

    const pick = (target: EventTarget | null): Element | null => {
      if (!(target instanceof Element)) return null
      return altRef.current ? target : (boundaryOf(target) ?? target)
    }

    const onMouseOver = (e: Event) => setHover(pick(e.target))
    const onMouseLeave = () => setHover(null)

    // React delegates click handling at the app root, which is an ancestor of
    // this viewport — so stopping the event during capture here means it never
    // reaches the target and never bubbles back, and the prototype's own
    // handlers never run.
    const swallow = (e: Event) => {
      e.stopPropagation()
    }
    // preventDefault on mousedown suppresses focus, which keeps inputs and
    // toggles inert. It is deliberately NOT set on pointerdown, where it would
    // also cancel the compatibility click we rely on for pinning.
    const swallowAndBlock = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const onClick = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      onPin(pick(e.target))
    }

    viewport.addEventListener('mouseover', onMouseOver, true)
    viewport.addEventListener('mouseleave', onMouseLeave)
    viewport.addEventListener('pointerdown', swallow, true)
    viewport.addEventListener('mousedown', swallowAndBlock, true)
    viewport.addEventListener('mouseup', swallow, true)
    viewport.addEventListener('click', onClick, true)

    return () => {
      viewport.removeEventListener('mouseover', onMouseOver, true)
      viewport.removeEventListener('mouseleave', onMouseLeave)
      viewport.removeEventListener('pointerdown', swallow, true)
      viewport.removeEventListener('mousedown', swallowAndBlock, true)
      viewport.removeEventListener('mouseup', swallow, true)
      viewport.removeEventListener('click', onClick, true)
    }
  }, [onPin])

  // --- modifier + escape ----------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAlt(true)
      if (e.key === 'Escape') onPin(null)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAlt(false)
    }
    // Alt-tabbing away never fires keyup, so the modifier would stick on.
    const onBlur = () => setAlt(false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [onPin])

  // --- geometry -------------------------------------------------------------
  // One rAF loop rather than scroll/resize/mutation listeners: the boxes have to
  // follow scrolling, the 240ms screen slide, and window resizes rescaling the
  // frame, and a per-frame rect read is cheaper than keeping three observers in
  // sync. Positions are written straight to the DOM so a moving box costs no
  // React renders.
  useEffect(() => {
    let raf = 0

    const tick = () => {
      const layer = layerRef.current
      if (layer) {
        if (pinned && !pinned.isConnected) {
          onPin(null)
        } else {
          const pinBox = pinned ? measure(layer, pinned) : null
          place(pinBoxRef.current, pinBox)
          // The outline's row wins over the cursor: using the list means the
          // pointer is off the device, so `hover` is stale by definition.
          const highlight = preview ?? hover
          place(
            hoverBoxRef.current,
            highlight && highlight !== pinned ? measure(layer, highlight) : null,
          )
          // Dimensions ride the label rather than React state — they change on
          // every frame of a screen transition, and a render each time would
          // cost more than the whole overlay.
          if (pinBox && sizeRef.current) {
            sizeRef.current.textContent = `${Math.round(pinBox.width)} × ${Math.round(pinBox.height)}`
          }
          // Keep the name pill on screen when the element sits at the very top.
          if (pinBox) setLabelBelow(pinBox.top < 16)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [hover, preview, pinned, onPin])

  return (
    <div ref={layerRef} data-inspect-layer className={styles.layer}>
      <div ref={hoverBoxRef} className={styles.hover} style={{ display: 'none' }} />
      <div ref={pinBoxRef} className={styles.pin} style={{ display: 'none' }}>
        {pinned ? (
          <span className={`${styles.label} ${labelBelow ? styles.labelBelow : ''}`}>
            {labelOf(pinned)}
            <span ref={sizeRef} className={styles.size} />
          </span>
        ) : null}
      </div>
    </div>
  )
}
