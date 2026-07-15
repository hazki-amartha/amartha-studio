'use client'

// =============================================================================
// Flow canvas (WS-B) — the whole project at a glance.
//   1. Live screen thumbnails at ~25% (ScreenThumb).
//   2. BFS auto-layout, unreached screens trailing (layout.ts).
//   3. SVG edges with labels + hover highlight (Edges).
//   4. Hand-rolled pan (drag) + zoom (wheel / trackpad pinch) — no graph lib.
//   5. Clicking a screen deep-links to /p/<slug>?screen=<id> (WS-A prototype).
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectModule } from '@/platform/types'
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

export function FlowCanvas({ slug }: { slug: string }) {
  const router = useRouter()
  const [mod, setMod] = useState<ProjectModule | null>(null)
  const [state, setState] = useState<LoadState>('loading')

  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: CANVAS_PAD, y: CANVAS_PAD })
  const [zoom, setZoom] = useState(1)
  const [hovered, setHovered] = useState<string | null>(null)
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
    setZoom(nz)
    setPan({
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
        panX: pan.x,
        panY: pan.y,
        nodeId: nodeEl?.dataset.nodeId ?? null,
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pan],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current
    if (!d?.active) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true
    if (d.moved) setPan({ x: d.panX + dx, y: d.panY + dy })
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      drag.current = null
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
      if (d && !d.moved && d.nodeId) {
        router.push(`/p/${slug}?screen=${d.nodeId}`)
      }
    },
    [router, slug],
  )

  // --- zoom (wheel + trackpad pinch), centred on the cursor ----------------
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      // Trackpad pinch arrives as wheel + ctrlKey; scale factor differs.
      const factor = e.ctrlKey ? 1 - e.deltaY * 0.01 : 1 - e.deltaY * 0.0015
      setZoom((z) => {
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor))
        const ratio = nz / z
        setPan((p) => ({ x: cx - (cx - p.x) * ratio, y: cy - (cy - p.y) * ratio }))
        return nz
      })
    },
    [],
  )

  // Native listener so preventDefault works (React onWheel is passive).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

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
      <header className="flex h-48 shrink-0 items-center justify-between border-b border-default bg-neutral-white px-16">
        <div className="flex flex-col">
          <span className="text-14 font-bold text-default">
            {mod?.config.name ?? 'Loading…'}
          </span>
          <span className="text-10 uppercase text-caption">Flow</span>
        </div>
        <div className="flex items-center gap-8">
          {layout?.isGrid ? (
            <span className="rounded-full bg-neutral-50 px-8 py-4 text-10 uppercase text-caption">
              no flow metadata
            </span>
          ) : null}
          <span className="text-12 text-caption">{Math.round(zoom * 100)}%</span>
        </div>
      </header>

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
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <Edges layout={layout} hovered={hovered} />
            {layout.nodes.map((n) => {
              const active = hovered === n.screen.id
              return (
                <div
                  key={n.screen.id}
                  data-node-id={n.screen.id}
                  className="absolute cursor-pointer"
                  style={{ left: n.x, top: n.y, width: NODE_W, height: TITLE_H + THUMB_H }}
                  onMouseEnter={() => setHovered(n.screen.id)}
                  onMouseLeave={() => setHovered((h) => (h === n.screen.id ? null : h))}
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
                    className={
                      active
                        ? 'rounded-8 ring-2 ring-primary-500'
                        : 'rounded-8 ring-1 ring-transparent'
                    }
                  >
                    <ScreenThumb screen={n.screen} />
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
