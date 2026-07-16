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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectModule } from '@/platform/types'
import { usePublishHeaderStatus } from '@/platform/chrome'
import { registry } from '@/projects/registry'
import { Edges } from './Edges'
import { ScreenThumb } from './ScreenThumb'
import { computeLayout } from './layout'
import {
  CANVAS_PAD,
  MAX_ZOOM,
  MIN_ZOOM,
  NODE_W,
  TITLE_H,
  THUMB_H,
} from './geometry'

type LoadState = 'loading' | 'missing' | 'ready'

const DRAG_THRESHOLD = 4

/** Expand-to-corners glyph, sized to the node overlay. */
function FullscreenIcon() {
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
      <path d="M9 3H3v6" />
      <path d="M15 21h6v-6" />
      <path d="M3 3l7 7" />
      <path d="M21 21l-7-7" />
    </svg>
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
    startX: number
    startY: number
    panX: number
    panY: number
    nodeId: string | null
    fullscreen: boolean
  } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement
      const nodeEl = target.closest('[data-node-id]') as HTMLElement | null
      drag.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        panX: view.x,
        panY: view.y,
        nodeId: nodeEl?.dataset.nodeId ?? null,
        // Resolved here rather than via the button's own onClick: the canvas
        // takes pointer capture below, which retargets the follow-up click.
        fullscreen: Boolean(target.closest('[data-fullscreen]')),
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [view.x, view.y],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current
    if (!d?.active) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true
    if (d.moved) setView((v) => ({ ...v, x: d.panX + dx, y: d.panY + dy }))
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      drag.current = null
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
      if (!d || d.moved) return
      if (d.fullscreen && d.nodeId) {
        router.push(`/p/${slug}?screen=${d.nodeId}`)
        return
      }
      // Clicking a screen selects it; clicking bare canvas clears.
      setSelected(d.nodeId)
    },
    [router, slug],
  )

  // Escape clears the selection, hiding its edges again.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
      <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-neutral-50 px-16 text-center">
        <p className="text-18 font-bold text-default">Project not found</p>
        <p className="text-14 text-caption">
          No project is registered for &ldquo;{slug}&rdquo;.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-neutral-50">
      <div
        ref={containerRef}
        className="relative flex-1 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        {layout ? (
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          >
            <Edges layout={layout} selected={selected} />
            {layout.nodes.map((n) => {
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
                    <span className="truncate text-12 font-bold text-default">
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
                      <button
                        type="button"
                        data-fullscreen
                        aria-label={`Open ${n.screen.title} in the prototype`}
                        className="absolute right-4 top-4 flex size-20 items-center justify-center rounded-4 bg-overlay text-neutral-white"
                      >
                        <FullscreenIcon />
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-14 text-caption">Loading flow…</span>
          </div>
        )}
      </div>
    </div>
  )
}
