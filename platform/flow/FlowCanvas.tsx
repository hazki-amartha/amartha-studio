'use client'

// =============================================================================
// Flow canvas (WS-B) — the whole project at a glance.
//   1. Live screen thumbnails at ~25% (ScreenThumb).
//   2. BFS auto-layout, unreached screens trailing (layout.ts).
//   3. SVG edges with labels, revealed per-selection (Edges).
//   4. Hand-rolled pan (drag) + zoom (wheel / trackpad pinch) — no graph lib.
//   5. Clicking a screen selects it — showing where it leads; the fullscreen
//      button on the selected screen deep-links to /p/<slug>?screen=<id>.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectModule } from '@/platform/types'
import { usePublishHeaderStatus } from '@/platform/chrome'
import { registry } from '@/projects/registry'
import { Edges } from './Edges'
import { ScreenThumb } from './ScreenThumb'
import { computeLayout } from './layout'
import { loadOffsets, saveOffsets, type OffsetMap } from './offsets'
import {
  CANVAS_PAD,
  MAX_ZOOM,
  MIN_ZOOM,
  NODE_W,
  SNAP_X,
  SNAP_Y,
  TITLE_H,
  THUMB_H,
} from './geometry'

type LoadState = 'loading' | 'missing' | 'ready'

const DRAG_THRESHOLD = 4

function NodeGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Expand-to-corners glyph, sized to the node overlay. */
function FullscreenIcon() {
  return (
    <NodeGlyph>
      <path d="M9 3H3v6" />
      <path d="M15 21h6v-6" />
      <path d="M3 3l7 7" />
      <path d="M21 21l-7-7" />
    </NodeGlyph>
  )
}

/** Four-way arrows — the drag handle. */
function MoveIcon() {
  return (
    <NodeGlyph>
      <path d="M12 3v18M3 12h18" />
      <path d="M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3" />
      <path d="M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
    </NodeGlyph>
  )
}

export function FlowCanvas({ slug }: { slug: string }) {
  const router = useRouter()
  const [mod, setMod] = useState<ProjectModule | null>(null)
  const [state, setState] = useState<LoadState>('loading')

  const containerRef = useRef<HTMLDivElement>(null)
  // Pan and zoom live in one state object so a wheel event can move both in a
  // single pure updater — zooming about the cursor needs them to agree exactly.
  const [view, setView] = useState({ x: CANVAS_PAD, y: CANVAS_PAD, zoom: 1 })
  const [selected, setSelected] = useState<string | null>(null)
  const fittedRef = useRef(false)

  // Committed node deltas, and the one being dragged right now (kept separate
  // so an in-flight drag doesn't hit localStorage on every pointermove).
  const [offsets, setOffsets] = useState<OffsetMap>({})
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null)

  useEffect(() => {
    setOffsets(loadOffsets(slug))
  }, [slug])

  // --- load the project module client-side (screen components can't cross the
  //     server boundary; the registry loader runs here) --------------------
  useEffect(() => {
    let alive = true
    const loader = registry[slug]
    if (!loader) {
      setState('missing')
      return
    }
    loader()
      .then((m) => {
        if (!alive) return
        setMod(m)
        setState('ready')
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
    }
  }, [slug])

  const layout = useMemo(() => (mod ? computeLayout(mod.screens) : null), [mod])

  // Auto-layout + saved deltas + the live drag = where nodes actually render.
  // Edges read these same coordinates, so they follow a node as it moves.
  const placed = useMemo(() => {
    if (!layout) return null
    const nodes = layout.nodes.map((n) => {
      const off = dragging?.id === n.screen.id ? dragging : offsets[n.screen.id]
      if (!off) return n
      return { ...n, x: n.x + off.dx, y: n.y + off.dy }
    })
    return { ...layout, nodes }
  }, [layout, offsets, dragging])

  // Screens the selection leads to — ringed so the destinations read as a set.
  const targets = useMemo(() => {
    if (!layout || !selected) return new Set<string>()
    return new Set(layout.links.filter((l) => l.from === selected).map((l) => l.to))
  }, [layout, selected])

  // --- fit-to-view once, when layout + container are known -----------------
  useEffect(() => {
    if (!layout || fittedRef.current) return
    const el = containerRef.current
    if (!el) return
    const { width: cw, height: ch } = el.getBoundingClientRect()
    if (cw === 0 || ch === 0) return
    const contentW = layout.width + CANVAS_PAD * 2
    const contentH = layout.height + CANVAS_PAD * 2
    const z = Math.min(cw / contentW, ch / contentH, 1)
    const nz = Math.max(MIN_ZOOM, z)
    setView({
      zoom: nz,
      x: (cw - layout.width * nz) / 2,
      y: (ch - layout.height * nz) / 2,
    })
    fittedRef.current = true
  }, [layout])

  // --- pan (pointer drag) ---------------------------------------------------
  const drag = useRef<{
    active: boolean
    moved: boolean
    /** 'pan' slides the canvas; 'node' moves one screen on the snap grid. */
    mode: 'pan' | 'node'
    startX: number
    startY: number
    panX: number
    panY: number
    /** Committed delta of the dragged node when the grab started. */
    baseDx: number
    baseDy: number
    nodeId: string | null
    fullscreen: boolean
    reset: boolean
  } | null>(null)

  // Declared above the pointer handlers: onPointerUp lists it as a dependency,
  // and dependency arrays are evaluated during render.
  const resetLayout = useCallback(() => {
    setOffsets({})
    setDragging(null)
    saveOffsets(slug, {})
  }, [slug])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement
      const nodeEl = target.closest('[data-node-id]') as HTMLElement | null
      const nodeId = nodeEl?.dataset.nodeId ?? null
      // Only the move handle grabs a node — dragging anywhere else on the
      // canvas, a node included, still pans. That's what keeps the two gestures
      // from fighting over the same pointer.
      const onHandle = Boolean(target.closest('[data-move]')) && nodeId != null
      const committed = nodeId ? offsets[nodeId] : undefined

      drag.current = {
        active: true,
        moved: false,
        mode: onHandle ? 'node' : 'pan',
        startX: e.clientX,
        startY: e.clientY,
        panX: view.x,
        panY: view.y,
        baseDx: committed?.dx ?? 0,
        baseDy: committed?.dy ?? 0,
        nodeId,
        // Resolved here rather than via the buttons' own onClick: the canvas
        // takes pointer capture below, which retargets the follow-up click.
        fullscreen: Boolean(target.closest('[data-fullscreen]')),
        reset: Boolean(target.closest('[data-reset]')),
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [view.x, view.y, offsets],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d?.active) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true
      if (!d.moved) return

      if (d.mode === 'pan') {
        setView((v) => ({ ...v, x: d.panX + dx, y: d.panY + dy }))
        return
      }
      if (!d.nodeId) return

      // Pointer travel is screen px; the canvas is scaled, so convert before
      // snapping or the grid would coarsen as you zoom out.
      const snap = (delta: number, base: number, pitch: number) =>
        Math.round((base + delta / view.zoom) / pitch) * pitch

      setDragging({
        id: d.nodeId,
        dx: snap(dx, d.baseDx, SNAP_X),
        dy: snap(dy, d.baseDy, SNAP_Y),
      })
    },
    [view.zoom],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      drag.current = null
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
      if (!d) return

      if (d.moved) {
        // Land the node: fold the live drag into the committed map and persist.
        if (d.mode === 'node' && dragging) {
          setOffsets((prev) => {
            const next = { ...prev }
            if (dragging.dx === 0 && dragging.dy === 0) delete next[dragging.id]
            else next[dragging.id] = { dx: dragging.dx, dy: dragging.dy }
            saveOffsets(slug, next)
            return next
          })
          setDragging(null)
        }
        return
      }

      if (d.reset) {
        resetLayout()
        return
      }
      if (d.fullscreen && d.nodeId) {
        router.push(`/p/${slug}?screen=${d.nodeId}`)
        return
      }
      // Clicking a screen selects it; clicking bare canvas clears.
      setDragging(null)
      setSelected(d.nodeId)
    },
    [router, slug, dragging, resetLayout],
  )

  // Escape clears the selection, hiding its edges again.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const moved = Object.keys(offsets).length > 0

  // --- zoom (wheel + trackpad pinch), centred on the cursor ----------------
  // cx/cy are cursor coordinates relative to the canvas box, so the nav rail
  // and sidebar to our left are already excluded. Pan and zoom move together in
  // one pure updater: nesting a setPan inside a setZoom updater made the
  // updater impure, and StrictMode's double-invoke applied `ratio` twice —
  // which is what pulled the anchor off the cursor.
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    // Trackpad pinch arrives as wheel + ctrlKey; scale factor differs.
    const factor = e.ctrlKey ? 1 - e.deltaY * 0.01 : 1 - e.deltaY * 0.0015

    setView((v) => {
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor))
      const ratio = nz / v.zoom
      // Keep the canvas point under the cursor pinned there.
      return { zoom: nz, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio }
    })
  }, [])

  // Native listener so preventDefault works (React onWheel is passive).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // The shell's top bar already names the project and the view; it carries the
  // canvas's zoom and grid-fallback badge too, so this route has no header.
  usePublishHeaderStatus(
    state === 'ready'
      ? { zoom: view.zoom, badge: layout?.isGrid ? 'no flow metadata' : undefined }
      : null,
  )

  if (state === 'missing') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-neutral-50 px-16 text-center dark:bg-ink-950">
        <p className="text-18 font-bold text-default dark:text-neutral-50">Project not found</p>
        <p className="text-14 text-caption dark:text-neutral-400">
          No project is registered for &ldquo;{slug}&rdquo;.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-neutral-50 dark:bg-ink-950">
      <div
        ref={containerRef}
        className="relative flex-1 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        {moved ? (
          <button
            type="button"
            data-reset
            className="absolute bottom-16 left-16 z-10 rounded-full border border-default bg-neutral-white px-12 py-8 text-12 text-caption hover:text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
          >
            Reset layout
          </button>
        ) : null}

        {placed ? (
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          >
            <Edges layout={placed} selected={selected} />
            {placed.nodes.map((n) => {
              const active = selected === n.screen.id
              const isTarget = selected != null && targets.has(n.screen.id)
              return (
                <div
                  key={n.screen.id}
                  data-node-id={n.screen.id}
                  className="absolute cursor-pointer"
                  style={{ left: n.x, top: n.y, width: NODE_W, height: TITLE_H + THUMB_H }}
                >
                  <div
                    className="flex items-center gap-4 truncate"
                    style={{ height: TITLE_H }}
                  >
                    {n.screen.entry ? (
                      <span className="rounded-full bg-primary-50 px-4 text-10 font-bold uppercase text-link">
                        entry
                      </span>
                    ) : null}
                    <span className="truncate text-12 font-bold text-default dark:text-neutral-50">
                      {n.screen.title}
                    </span>
                  </div>
                  <div
                    className={`relative rounded-8 ${
                      active
                        ? 'ring-2 ring-primary-500'
                        : isTarget
                          ? 'ring-2 ring-primary-200'
                          : 'ring-1 ring-transparent'
                    }`}
                  >
                    <ScreenThumb screen={n.screen} />
                    {active ? (
                      <div className="absolute right-4 top-4 flex items-center gap-2">
                        <span
                          data-move
                          role="button"
                          aria-label={`Move ${n.screen.title}`}
                          className="flex size-20 cursor-grab items-center justify-center rounded-4 bg-overlay text-neutral-white active:cursor-grabbing"
                        >
                          <MoveIcon />
                        </span>
                        <button
                          type="button"
                          data-fullscreen
                          aria-label={`Open ${n.screen.title} in the prototype`}
                          className="flex size-20 items-center justify-center rounded-4 bg-overlay text-neutral-white"
                        >
                          <FullscreenIcon />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-14 text-caption dark:text-neutral-400">Loading flow…</span>
          </div>
        )}
      </div>
    </div>
  )
}
