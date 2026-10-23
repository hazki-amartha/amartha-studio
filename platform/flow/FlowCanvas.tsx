'use client'

// =============================================================================
// Flow canvas (WS-B) — the whole project at a glance.
//   1. Live screen thumbnails at ~25% (ScreenThumb).
//   2. Auto-layout: one lane per sidebar section, BFS inside each (layout.ts).
//   3. Right-angled SVG edges with labels, revealed per-selection (Edges).
//   4. Hand-rolled pan (drag) + zoom (wheel / trackpad pinch) — no graph lib.
//   5. Clicking a screen selects it — showing where it leads; the fullscreen
//      button on the selected screen deep-links to /p/<slug>?screen=<id>.
//      The selection is shared with the sidebar (focus.ts): its rows select
//      here, and a row picked there is brought into view.
//   6. AI Chat, as in the prototype view: its button in the top bar, its panel
//      in the column on the right, asking about the selected screen. A change
//      it makes re-reads the project, so new screens and arrows appear.
//   7. Comment: the pins on every page at once (FlowComments), and a click on
//      a page drops a new one — the same comments as the prototype's.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectModule } from '@/platform/types'
import { usePublishHeaderStatus } from '@/platform/chrome'
import { ChatIcon, CloseIcon, CommentIcon } from '@/platform/chrome/icons'
import { setCommentMode, useComments, useCommentsFor } from '@/platform/comments/store'
import { ShellPortal } from '@/platform/chrome/ShellPortal'
import { ToolButton } from '@/platform/chrome/TopBar'
import { LiveChatPanel } from '@/platform/chat/ChatPanel'
import { attachmentForScreen } from '@/platform/chat/attach'
import { getChat, getChatServerSnapshot, probeChat, subscribeChat } from '@/platform/runtime/chatBridge'
import { useProjectVersion } from '@/platform/runtime/projectRefresh'
import { useGuestAccess } from '@/platform/auth/session'
import { nextZoom, ZoomControl } from '@/platform/chrome/ZoomControl'
import { ShortcutSheet, useShortcuts } from '@/platform/chrome/shortcuts'
import { registry } from '@/projects/registry'
import { resolveProject, type ResolvedProject } from '@/platform/runtime/resolveProject'
import { publishDbIndexEntry, setActiveDbProject } from '@/platform/dbProjects/active'
import { briefScreen } from '@/platform/chrome/screenIndex'
import { Edges } from './Edges'
import { ScreenThumb } from './ScreenThumb'
import { computeLayout } from './layout'
import { loadOffsets, saveOffsets, type OffsetMap } from './offsets'
import { getFlowFocus, publishFlow, selectInFlow, subscribeFlowFocus } from './focus'
import { findOrigins, type Origins } from './origins'
import { CANVAS_PAD, LANE_PAD, MAX_ZOOM, MIN_ZOOM, REVEAL_ZOOM, TITLE_H, nodeBox } from './geometry'

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

/** A database project, the same way its prototype view loads it — and its
 *  screens handed to the sidebar, which can't list them otherwise. */
async function resolveDb(slug: string): Promise<ResolvedProject | null> {
  const { fetchDbProject, resolveDbProject } = await import('@/platform/dbProjects/load')
  const build = await fetchDbProject(slug)
  if (!build.ok) return null
  const { resolved } = await resolveDbProject(build)
  publishDbIndexEntry({
    slug,
    name: resolved.config.name,
    status: resolved.config.status,
    createdAt: resolved.config.createdAt,
    screens: resolved.own.map(briefScreen),
    inherited: resolved.base ? { from: resolved.base.name, screens: resolved.inherited.map(briefScreen) } : undefined,
  })
  return resolved
}

/** AI Chat beside the flow: the same conversation as the prototype view's, in
 *  the same panel column. Elements can't be clicked on the canvas, so the
 *  screen selected there is the selection — the chip the message is about. */
function FlowChat({
  slug,
  screenId,
  selected,
  onClose,
}: {
  slug: string
  screenId: string
  selected: { id: string; title: string } | null
  onClose: () => void
}) {
  const selection = useMemo(() => (selected ? attachmentForScreen(slug, selected) : null), [slug, selected])
  return (
    <aside aria-label="AI Chat" className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-48 flex-none items-center gap-4 px-4">
        <span className="flex-1 px-8 text-14 font-bold text-neutral-50">AI Chat</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Chat"
          title="Close AI Chat"
          className="flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-500 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
        >
          <CloseIcon className="size-16" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-12 border border-default bg-neutral-white px-12 pb-12 dark:border-ink-800 dark:bg-ink-950">
        <LiveChatPanel
          slug={slug}
          screenId={screenId}
          pinned={null}
          selection={selection}
          onDeselect={() => selectInFlow(null)}
          tabs={false}
          className="flex-1"
        />
      </div>
    </aside>
  )
}

/** `db`: the project lives in the database (platform/dbProjects), not the registry. */
export function FlowCanvas({ slug, db = false }: { slug: string; db?: boolean }) {
  const router = useRouter()
  const [mod, setMod] = useState<ProjectModule | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  // Chat beside the canvas decides where to write by this, as on /p/<slug>:
  // unmarked, a database project's turn was sent as a git one and could
  // write only to a projects/<slug>/ that doesn't exist.
  if (db) setActiveDbProject(slug)
  // Again after commit: the prototype view this replaced clears the mark as it
  // unmounts, which runs after this render.
  useEffect(() => {
    if (!db) return
    setActiveDbProject(slug)
    return () => setActiveDbProject(null)
  }, [slug, db])

  const containerRef = useRef<HTMLDivElement>(null)
  // Pan and zoom live in one state object so a wheel event can move both in a
  // single pure updater — zooming about the cursor needs them to agree exactly.
  const [view, setView] = useState({ x: CANVAS_PAD, y: CANVAS_PAD, zoom: 1 })
  const focus = useSyncExternalStore(subscribeFlowFocus, getFlowFocus, () => null)
  const selected = focus?.slug === slug ? focus.selected : null
  const reveal = focus?.slug === slug ? focus.reveal : 0
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
  // Bumped when Chat changes the project: read it again.
  const version = useProjectVersion()
  useEffect(() => {
    let alive = true
    // Only the project's own screens are drawn: a feature that extends a base
    // would otherwise disappear among forty inherited nodes. Edges into the
    // base are still valid navigation (check:flows resolves them against the
    // merged list); the canvas simply has no node to draw them to.
    const load = db ? resolveDb(slug) : resolveProject(registry, slug)
    load
      .then((m) => {
        if (!alive) return
        if (!m) {
          setState('missing')
          return
        }
        setMod({ config: m.config, screens: m.own })
        setState('ready')
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
      if (db) publishDbIndexEntry(null)
    }
  }, [slug, db, version])

  // AI Chat — offered unless the server says no, and never to a share-link guest.
  useEffect(probeChat, [])
  const chatAvailable = useSyncExternalStore(
    subscribeChat,
    () => getChat().available !== false,
    () => getChatServerSnapshot().available !== false,
  )
  const guest = useGuestAccess(slug)
  const [chatting, setChatting] = useState(false)
  // Comments — offered where the prototype offers them: a store configured,
  // and not a view-only share link.
  useCommentsFor(slug)
  const { mode: commenting, available: commentsOn } = useComments()
  const canComment = commentsOn && guest !== 'view'
  useEffect(() => () => setCommentMode(false), [])
  const selectedScreen = useMemo(() => {
    const s = selected ? mod?.screens.find((x) => x.id === selected) : undefined
    return s ? { id: s.id, title: s.title } : null
  }, [selected, mod])

  // The node box follows the project's device, so a 1440-wide desktop flow
  // lays out on a 1440-shaped lattice instead of the phone's.
  const box = useMemo(() => nodeBox(mod?.config.device), [mod])

  // Each page's measured length (ScreenThumb). Collected for a frame before the
  // layout is redone, so ninety pages arriving relayout once, not ninety times.
  const [heights, setHeights] = useState<ReadonlyMap<string, number>>(new Map())
  const pendingHeights = useRef(new Map<string, number>())
  const heightFrame = useRef(0)
  const onHeight = useCallback((id: string, h: number) => {
    pendingHeights.current.set(id, h)
    cancelAnimationFrame(heightFrame.current)
    heightFrame.current = requestAnimationFrame(() => {
      const next = pendingHeights.current
      pendingHeights.current = new Map()
      setHeights((prev) => {
        if ([...next].every(([k, v]) => Math.abs((prev.get(k) ?? 0) - v) < 0.5)) return prev
        return new Map([...prev, ...next])
      })
    })
  }, [])
  useEffect(() => () => cancelAnimationFrame(heightFrame.current), [])

  const layout = useMemo(() => (mod ? computeLayout(mod.screens, box, heights) : null), [mod, box, heights])

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

  // The sidebar selects on this canvas while it's here.
  // Published again when the project is re-read (Chat changed it), which keeps
  // the selection and the applied state; withdrawn only when the canvas goes.
  useEffect(() => {
    if (mod) publishFlow(slug, mod.screens)
  }, [mod, slug])
  useEffect(() => () => publishFlow(null), [])

  // A screen picked in the sidebar: centred, at a zoom where it reads.
  const revealed = useRef(0)
  useEffect(() => {
    if (!reveal || reveal === revealed.current || !placed || !selected) return
    revealed.current = reveal
    const node = placed.nodes.find((n) => n.screen.id === selected)
    const el = containerRef.current
    if (!node || !el) return
    const { width: cw, height: ch } = el.getBoundingClientRect()
    setView((v) => {
      const zoom = Math.max(v.zoom, REVEAL_ZOOM)
      // The middle of its first screenful — a long page's top is what you came to see.
      return { zoom, x: cw / 2 - (node.x + box.nodeW / 2) * zoom, y: ch / 2 - (node.y + box.nodeH / 2) * zoom }
    })
  }, [reveal, placed, selected, box])

  // Where the selection's arrows start — measured on the live render, again
  // whenever it changes (a lazy screen arriving, a state applied). Kept in node
  // units, so panning, zooming and dragging the node don't need a re-measure.
  const [origins, setOrigins] = useState<Origins>({})
  const zoomRef = useRef(view.zoom)
  zoomRef.current = view.zoom
  useEffect(() => {
    setOrigins({})
    const el = selected ? containerRef.current?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(selected)}"]`) : null
    if (!el || !layout) return
    const links = layout.links.filter((l) => l.from === selected)
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setOrigins(findOrigins(el, links, zoomRef.current)))
    }
    measure()
    const watch = new MutationObserver(measure)
    watch.observe(el, { childList: true, subtree: true, characterData: true })
    return () => {
      cancelAnimationFrame(frame)
      watch.disconnect()
    }
  }, [selected, layout])

  // Screens the selection leads to — ringed so the destinations read as a set.
  const targets = useMemo(() => {
    if (!layout || !selected) return new Set<string>()
    return new Set(layout.links.filter((l) => l.from === selected).map((l) => l.to))
  }, [layout, selected])

  // --- fit-to-view: once, when layout + container are known, and on Fit ----
  // The zoom a fit landed on, so the control can read "Fit" until it changes.
  const [fitZoom, setFitZoom] = useState<number | null>(null)
  const fit = useCallback(() => {
    const el = containerRef.current
    if (!layout || !el) return false
    const { width: cw, height: ch } = el.getBoundingClientRect()
    if (cw === 0 || ch === 0) return false
    const contentW = layout.width + CANVAS_PAD * 2
    const contentH = layout.height + CANVAS_PAD * 2
    const z = Math.min(cw / contentW, ch / contentH, 1)
    const nz = Math.max(MIN_ZOOM, z)
    setView({
      zoom: nz,
      x: (cw - layout.width * nz) / 2,
      y: (ch - layout.height * nz) / 2,
    })
    setFitZoom(nz)
    return true
  }, [layout])

  useEffect(() => {
    if (!layout || fittedRef.current) return
    if (fit()) fittedRef.current = true
  }, [layout, fit])

  // − and + zoom about the middle of the canvas.
  const step = useCallback((dir: 1 | -1) => {
    const el = containerRef.current
    if (!el) return
    const { width: cw, height: ch } = el.getBoundingClientRect()
    setView((v) => {
      const nz = nextZoom(v.zoom, dir, MIN_ZOOM, MAX_ZOOM)
      const ratio = nz / v.zoom
      return { zoom: nz, x: cw / 2 - (cw / 2 - v.x) * ratio, y: ch / 2 - (ch / 2 - v.y) * ratio }
    })
  }, [])

  // 100% about the middle, like − and +.
  const actual = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { width: cw, height: ch } = el.getBoundingClientRect()
    setView((v) => {
      const ratio = 1 / v.zoom
      return { zoom: 1, x: cw / 2 - (cw / 2 - v.x) * ratio, y: ch / 2 - (ch / 2 - v.y) * ratio }
    })
  }, [])

  // The prototype's zoom keys, so the zoom buttons' tooltips hold here too.
  const [shortcuts, setShortcuts] = useState(false)
  useShortcuts({
    fit: () => void fit(),
    actual,
    zoomIn: () => step(1),
    zoomOut: () => step(-1),
    help: () => setShortcuts((open) => !open),
    escape: () => (shortcuts ? (setShortcuts(false), true) : undefined),
  })

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
      // The comment pins take their own clicks: no pan, and no pointer capture
      // that would send the click to the canvas instead.
      if (target.closest('[data-comment-layer]')) return
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
        dx: snap(dx, d.baseDx, box.snapX),
        dy: snap(dy, d.baseDy, box.snapY),
      })
    },
    [view.zoom, box],
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
      selectInFlow(d.nodeId)
    },
    [router, slug, dragging, resetLayout],
  )

  // Escape clears the selection, hiding its edges again.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectInFlow(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const moved = Object.keys(offsets).length > 0

  // --- wheel: scroll pans, pinch/modifier zooms (Figma's split) -------------
  // A plain two-finger trackpad scroll arrives as a wheel with deltaX/deltaY
  // and no modifier — that pans, exactly like dragging. A pinch arrives as a
  // wheel with ctrlKey set (the browser synthesises it), and ⌘/ctrl + scroll is
  // the mouse-wheel equivalent — both zoom about the cursor.
  //
  // cx/cy are cursor coordinates relative to the canvas box, so the sidebar
  // to our left is already excluded. Pan and zoom move together in
  // one pure updater: nesting a setPan inside a setZoom updater made the
  // updater impure, and StrictMode's double-invoke applied `ratio` twice —
  // which is what pulled the anchor off the cursor.
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return

    if (!e.ctrlKey && !e.metaKey) {
      setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      return
    }

    const rect = el.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    // Pinch (ctrlKey) reports much smaller deltas than a mouse wheel notch.
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

  // The shell's top bar already names the view; it carries the grid-fallback
  // badge too, so this route has no header of its own. The bottom corners are
  // the shell's Prototype | Flow and the zoom, so Reset layout sits top right.
  usePublishHeaderStatus(
    state === 'ready'
      ? { badge: layout && layout.links.length === 0 ? 'no flow metadata' : undefined }
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
    <div className="relative flex h-full flex-col bg-neutral-50 dark:bg-ink-950">
      <div
        ref={containerRef}
        className="relative flex-1 cursor-grab touch-none select-none overflow-hidden overscroll-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        {moved ? (
          <button
            type="button"
            data-reset
            className="absolute right-16 top-16 z-10 flex h-32 items-center rounded-8 border border-default bg-neutral-white px-12 text-12 text-caption hover:text-default dark:border-ink-800 dark:bg-ink-900 dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
          >
            Reset layout
          </button>
        ) : null}

        {placed ? (
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          >
            {/* A band per named section, behind everything. Fixed to the
                auto-layout: a screen dragged out of its lane leaves the band. */}
            {placed.lanes.map((lane) =>
              lane.section ? (
                <div
                  key={lane.section}
                  className="pointer-events-none absolute rounded-16 border border-default bg-neutral-white px-24 pt-24 dark:border-ink-800 dark:bg-ink-900"
                  style={{
                    left: -LANE_PAD,
                    top: lane.y - LANE_PAD,
                    width: placed.width + LANE_PAD * 2,
                    height: lane.height + LANE_PAD * 2,
                  }}
                >
                  <span className="text-14 font-bold text-default dark:text-neutral-50">{lane.section}</span>
                </div>
              ) : null,
            )}
            <Edges layout={placed} selected={selected} box={box} origins={origins} layer="under" zoom={view.zoom} />
            {placed.nodes.map((n) => {
              // Zoomed past 100%, a node's title, ring and buttons stay one size
              // on screen instead of growing with the screen they sit on.
              const chrome = Math.min(1, 1 / view.zoom)
              const active = selected === n.screen.id
              const isTarget = selected != null && targets.has(n.screen.id)
              return (
                <div
                  key={n.screen.id}
                  data-node-id={n.screen.id}
                  className="absolute cursor-pointer"
                  style={{ left: n.x, top: n.y, width: box.nodeW, height: n.h }}
                >
                  <div className="flex items-end" style={{ height: TITLE_H }}>
                    <div
                      className="flex items-center gap-4 pb-4"
                      style={{ width: box.nodeW / chrome, transform: `scale(${chrome})`, transformOrigin: 'left bottom' }}
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
                  </div>
                  <div
                    className={`relative rounded-8 ${active ? 'ring-primary-500' : isTarget ? 'ring-primary-200' : ''}`}
                    style={
                      active || isTarget
                        ? { boxShadow: `0 0 0 ${(2 / view.zoom).toFixed(3)}px var(--tw-ring-color)` }
                        : undefined
                    }
                  >
                    <ScreenThumb screen={n.screen} device={mod?.config.device} box={box} onHeight={onHeight} />
                    {active ? (
                      <div
                        className="absolute right-4 top-4 flex items-center gap-2"
                        style={{ transform: `scale(${chrome})`, transformOrigin: 'right top' }}
                      >
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
            {/* Above the screens: where on the selected one each arrow starts. */}
            <Edges layout={placed} selected={selected} box={box} origins={origins} layer="over" zoom={view.zoom} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-14 text-caption dark:text-neutral-400">Loading flow…</span>
          </div>
        )}
      </div>
      {/* Outside the pan surface, which captures the pointer and would
          swallow the buttons' clicks. */}
      {placed ? (
        <ZoomControl
          scale={view.zoom}
          fitted={fitZoom != null && Math.abs(view.zoom - fitZoom) < 0.001}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          onStep={step}
          onFit={fit}
          className="absolute bottom-16 right-16 z-10"
        />
      ) : null}
      {state !== 'ready' ? null : (
        <ShellPortal slot="actions">
          {canComment ? (
            <ToolButton
              icon={<CommentIcon className="size-16" />}
              label={commenting ? 'Done' : 'Comment'}
              title={commenting ? 'Stop commenting' : 'Comment — click anywhere on a page to leave feedback'}
              inverted={commenting}
              onClick={() => setCommentMode(!commenting)}
            />
          ) : null}
          {guest || !chatAvailable || chatting ? null : (
            <ToolButton
              icon={<ChatIcon className="size-16" />}
              label="AI Chat"
              title="AI Chat — ask Claude for a change"
              inverted
              onClick={() => setChatting(true)}
            />
          )}
        </ShellPortal>
      )}
      {guest || !chatAvailable || state !== 'ready' || !chatting ? null : (
        <ShellPortal slot="panel">
          <FlowChat
            slug={slug}
            screenId={selected ?? (mod?.screens.find((s) => s.entry) ?? mod?.screens[0])?.id ?? ''}
            selected={selectedScreen}
            onClose={() => setChatting(false)}
          />
        </ShellPortal>
      )}
      {shortcuts ? (
        <ShortcutSheet
          only={['fit', 'actual', 'zoomIn', 'zoomOut', 'escape', 'help']}
          onClose={() => setShortcuts(false)}
        />
      ) : null}
    </div>
  )
}
