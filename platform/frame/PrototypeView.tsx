'use client'

// =============================================================================
// WS-A · PrototypeView — the responsive presentation of a running prototype.
//
// Two axes, deliberately orthogonal (see platform/runtime/presentBridge):
//
//   PRESENTATION — studio (frame + arrows + panels: the review surface) or bare
//   (the app fills the browser window, nothing around it: the demo surface).
//   Bare is either asked for — the shell's Full screen toggle, or ?full=1 — or
//   implied, when a phone prototype is opened on a phone, which is the case
//   that used to be this file's whole "< md" branch.
//
//   DEVICE — mobile (390×844) or desktop (1440×900). It decides what gets
//   framed and how bare fills the window; it does NOT decide the presentation.
//
// In studio mode:
//   • mobile  → device frame centered on neutral-50, flanked by arrows that step
//               through the declared screen order, with the annotation panel
//               pinned to the right edge showing the active screen's notes
//               (falling back to the project's notes), and the states panel
//               mirroring it on the left.
//   • desktop → the same, but 1440 wide leaves no room for two columns, so the
//               panels become drawers over the canvas.
// The two panels are the two axes of a walkthrough: the arrows and the states
// reach any screen in any condition without tapping through the setup first.
// The arrows exist because not every screen is reachable by tapping: component
// explorations declare states (on-track / late / settled) that no flow edge
// points at, and a lifecycle transition is often time passing, not a tap.
// A single app instance is rendered in either mode (no duplicate screen state).
// =============================================================================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { DeviceKind, ProjectConfig, ScreenDef } from '@/platform/types'
import {
  PrototypeProvider,
  ScreenStage,
  useFlow,
  useScreenJump,
  useScreenStep,
} from '@/platform/runtime'
import { clearScreenBridge, publishScreenBridge } from '@/platform/runtime/bridge'
import {
  getDesignMode,
  getDesignServerSnapshot,
  getEditTab,
  getEditTabServerSnapshot,
  setDesignMode,
  setEditTab,
  subscribeDesignMode,
  type EditTab,
} from '@/platform/runtime/designBridge'
import { getDesignStoreServerSnapshot, getDesignStoreState, subscribeDesignStore } from '@/platform/design/designStore'
import {
  getBareMode,
  getBareServerSnapshot,
  setBareMode,
  subscribeBareMode,
} from '@/platform/runtime/presentBridge'
import { InspectLayer, InspectorPanel, LayersPanel } from '@/platform/inspect'
import { DesignLayer, DesignPanel } from '@/platform/design'
import { LiveChatPanel } from '@/platform/chat/ChatPanel'
import { getChat, getChatServerSnapshot, probeChat, subscribeChat } from '@/platform/runtime/chatBridge'
import { PushBar } from '@/platform/push/PushBar'
import { layersDrag } from '@/platform/design/actions'
import { toggleSelected } from '@/platform/design/selection'
import { refind } from '@/platform/design/overlay'
import {
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CodeIcon,
  EditIcon,
  MinusIcon,
  PlusIcon,
} from '@/platform/chrome/icons'
import { PanelShell, PanelTabs } from '@/platform/chrome/SidePanel'
import { CanvasControls } from '@/platform/chrome/CanvasControls'
import {
  getSidebarSlots,
  getSidebarSlotsServerSnapshot,
  setSidebarLive,
  subscribeSidebarSlots,
} from '@/platform/chrome/sidebarSlots'
import { DeviceFrame } from './DeviceFrame'
import { DEVICE_SPECS, outerSize } from './device'
import styles from './prototype.module.css'

const DESKTOP_QUERY = '(min-width: 768px)' // Tailwind `md` breakpoint

/** Tracks whether we're at the desktop breakpoint. Defaults to the desktop
 *  layout so the first client render matches the server (no hydration flash),
 *  then corrects on mount for real mobile viewports. */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isDesktop
}

/** Mirrors the running prototype into the screen bridge so the shell's page
 *  explorer can highlight the active screen and jump to another one, and the
 *  mobile triple-tap dialog can offer the active screen's states. */
function BridgePublisher({ slug, screens }: { slug: string; screens: ScreenDef[] }) {
  const { current } = useFlow()
  const jump = useScreenJump()

  useEffect(() => {
    const active = screens.find((s) => s.id === current)
    publishScreenBridge(slug, current, jump, active?.states ?? [])
  }, [slug, current, jump, screens])

  // Clear only on unmount — the publish effect above handles every update.
  useEffect(() => () => clearScreenBridge(), [])

  return null
}

/** The running app: the active screen stage, which now carries the device
 *  status-bar strip itself (see `Screen` in platform/primitives).
 *  In Edit mode it also carries the pick layer, which sits inside the device
 *  screen so it inherits the frame's scale. Mobile passes nothing, so the layer
 *  never mounts there. */
function AppViewport({
  device = 'mobile',
  slug,
  editing,
  pinned,
  onPin,
  onRepin,
  preview,
}: {
  device?: DeviceKind
  slug?: string
  editing?: boolean
  pinned?: Element | null
  onPin?: (el: Element | null) => void
  onRepin?: (stale: Element) => void
  preview?: Element | null
} = {}) {
  const { current } = useFlow()
  return (
    <div className={styles.viewport} data-device={device} data-inspect={editing ? 'on' : undefined}>
      <ScreenStage />
      {/* Picks the nearest element the project's source wrote. Picking the
          nearest FunDS boundary was tried and dropped: `Screen` is one, so
          plain content kept selecting the whole screen. A placed component
          still wins over its own insides. Whichever tab is showing, the canvas
          behaves the same — the tab is what you do with the pick. */}
      {editing && onPin ? (
        <InspectLayer
          pinned={pinned ?? null}
          onPin={onPin}
          preview={preview}
          pick="authored"
          onShiftPick={(el) => (pinned ? toggleSelected(el) : onPin(el))}
          onRepin={onRepin}
          tone="design"
        />
      ) : null}
      {editing && onPin && slug ? (
        <DesignLayer
          slug={slug}
          screenId={current}
          pinned={pinned ?? null}
          onPin={onPin}
          onRepin={onRepin}
        />
      ) : null}
    </div>
  )
}

/** The live screen's notes (or the project's), for the sidebar's Notes tab. */
function NotesBody({ screens, projectNotes }: { screens: ScreenDef[]; projectNotes?: string[] }) {
  const { current } = useFlow()
  const active = screens.find((s) => s.id === current)
  const notes = active?.notes && active.notes.length > 0 ? active.notes : (projectNotes ?? [])

  return (
    <>
      {active ? (
        <h2 className="text-14 font-bold text-default dark:text-neutral-50">{active.title}</h2>
      ) : null}
      {notes.length > 0 ? (
        <ul className="flex flex-col gap-8">
          {notes.map((note, i) => (
            <li key={i} className="text-14 text-caption dark:text-neutral-400">
              {note}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-12 text-caption dark:text-neutral-400">No notes for this screen.</p>
      )}
    </>
  )
}

// Outer phone dimensions: 390×844 screen + 12px bezel on each side.
const PHONE = outerSize(DEVICE_SPECS.mobile)

/** Scales the phone down (never up) so it always fits the height this view was
 *  given — whatever chrome surrounds it — without page scroll, while screens
 *  keep their 390px layout. The wrapper is measured (not the window) so
 *  headers/sidebars around the view are automatically accounted for.
 *
 *  Height-only is right for the phone: it is narrow, so the column it sits in
 *  is sized by the frame rather than the other way round. The desktop frame is
 *  the opposite case — see FittedDevice. */
function ScaledDevice({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientHeight / PHONE.height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="h-full flex-none" style={{ width: PHONE.width * scale }}>
      <div
        style={{
          width: PHONE.width,
          height: PHONE.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Scales a desktop frame down to fit BOTH axes of the space it was given.
 *  1440 is wider than most laptop viewports once the studio chrome is
 *  subtracted, so width is normally the binding constraint — the phone's
 *  height-only rule would overflow horizontally on every screen smaller than a
 *  27" monitor.
 *
 *  The measured element is `min-w-0 flex-1`, so its own width comes from the
 *  container and never from the scaled child. Sizing it from the scale (what
 *  ScaledDevice does) would feed the observer its own output. */
function FittedDevice({
  spec,
  /** Framed, the device is hardware and never grows past life size. Bare, the
   *  request was "use the whole window", so a 1440 layout on a 1920 display
   *  scales up rather than sitting in a letterbox — it's a transform on live
   *  DOM, so text stays crisp at any factor. */
  upscale = false,
  children,
}: {
  spec: { width: number; height: number }
  upscale?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const fit = Math.min(el.clientWidth / spec.width, el.clientHeight / spec.height)
      setScale(upscale ? fit : Math.min(1, fit))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [spec.width, spec.height, upscale])

  return (
    <div ref={ref} className="flex h-full min-w-0 flex-1 items-center justify-center">
      <div style={{ width: spec.width * scale, height: spec.height * scale }}>
        <div
          style={{
            width: spec.width,
            height: spec.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3
const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2, 3]

const DESKTOP_FRAME = outerSize(DEVICE_SPECS.desktop)

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

/**
 * The desktop frame on a canvas you can zoom and pan — opens fitted, like
 * FittedDevice, then zooms past that when a 1440 layout shrunk beside the
 * panels is too small to work on. Pinch or ⌘/Ctrl-scroll zooms at the
 * pointer, plain scrolling pans, and ZoomControl (in the canvas's corner
 * buttons) steps or refits.
 *
 * `null` zoom means "fit": it follows the canvas as it resizes, so opening or
 * hiding a panel keeps a fitted frame fitted. Any explicit zoom stays put.
 *
 * A hook rather than state inside the canvas, because the control lives with
 * the other corner buttons, away from the frame it zooms.
 */
function useCanvasZoom(spec: { width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  const [zoom, setZoom] = useState<number | null>(null)
  const scale = zoom ?? fit
  // The wheel handler is attached once, so it reads the live scale from here.
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setFit(Math.min(1, el.clientWidth / spec.width, el.clientHeight / spec.height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [spec.width, spec.height])

  // Zooms keeping the point under (x, y) — canvas coordinates — where it is.
  const zoomAt = useCallback((next: number, x: number, y: number) => {
    const el = ref.current
    const prev = scaleRef.current
    const to = clampZoom(next)
    setZoom(to)
    if (!el) return
    const px = (el.scrollLeft + x) / prev
    const py = (el.scrollTop + y) / prev
    requestAnimationFrame(() => {
      el.scrollLeft = px * to - x
      el.scrollTop = py * to - y
    })
  }, [])

  // Non-passive, so a pinch zooms the frame instead of the whole page.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const box = el.getBoundingClientRect()
      zoomAt(scaleRef.current * Math.exp(-e.deltaY * 0.01), e.clientX - box.left, e.clientY - box.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const step = (dir: 1 | -1) => {
    const el = ref.current
    const next =
      dir === 1
        ? (ZOOM_STEPS.find((z) => z > scale + 0.01) ?? MAX_ZOOM)
        : ([...ZOOM_STEPS].reverse().find((z) => z < scale - 0.01) ?? MIN_ZOOM)
    zoomAt(next, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2)
  }

  return { ref, spec, scale, fitted: zoom == null, refit: () => setZoom(null), step }
}

type CanvasZoom = ReturnType<typeof useCanvasZoom>

function ZoomableDevice({ zoom, children }: { zoom: CanvasZoom; children: ReactNode }) {
  const { ref, spec, scale } = zoom
  return (
    // `m-auto` on the child, not centring on the parent: it centres a frame
    // smaller than the canvas and still lets a larger one scroll to its left
    // and top edges, which flex centring would push out of reach.
    <div ref={ref} className="flex h-full min-h-0 min-w-0 flex-1 overflow-auto">
      <div className="m-auto flex-none" style={{ width: spec.width * scale, height: spec.height * scale }}>
        <div
          style={{
            width: spec.width,
            height: spec.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/** `− Fit +`, beside the canvas's full-screen button. */
function ZoomControl({ zoom }: { zoom: CanvasZoom }) {
  const btn =
    'flex size-32 items-center justify-center rounded-full text-caption hover:bg-neutral-50 hover:text-default disabled:text-placeholder dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50 dark:disabled:text-neutral-600'
  return (
    <div className="flex h-40 items-center gap-2 rounded-full border border-default bg-neutral-white px-4 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:shadow-none">
      <button
        type="button"
        onClick={() => zoom.step(-1)}
        disabled={zoom.scale <= MIN_ZOOM}
        aria-label="Zoom out"
        title="Zoom out"
        className={btn}
      >
        <MinusIcon className="size-16" />
      </button>
      <button
        type="button"
        onClick={zoom.refit}
        title={zoom.fitted ? 'Fitted to the canvas' : 'Fit to the canvas'}
        className="min-w-52 rounded-full px-8 py-4 text-12 font-bold text-default hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-ink-800"
      >
        {zoom.fitted ? 'Fit' : `${Math.round(zoom.scale * 100)}%`}
      </button>
      <button
        type="button"
        onClick={() => zoom.step(1)}
        disabled={zoom.scale >= MAX_ZOOM}
        aria-label="Zoom in"
        title="Zoom in"
        className={btn}
      >
        <PlusIcon className="size-16" />
      </button>
    </div>
  )
}

function StepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-40 w-40 flex-none items-center justify-center rounded-full border border-default bg-neutral-white text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800 dark:disabled:text-neutral-600"
    >
      {children}
    </button>
  )
}

/** The device, flanked by arrows that step through the declared screen order.
 *  Reaches every screen — including states no flow edge points at — which is
 *  why this is order-based rather than history-based. */
function DeviceStepper({ children }: { children: ReactNode }) {
  const { prev, next, goPrev, goNext } = useScreenStep()

  return (
    <div className="flex h-full items-center gap-16">
      <StepButton
        onClick={goPrev}
        disabled={!prev}
        label={prev ? `Back — ${prev.title}` : 'Back (first screen)'}
      >
        <ChevronLeftIcon className="h-16 w-16" />
      </StepButton>
      {children}
      <StepButton
        onClick={goNext}
        disabled={!next}
        label={next ? `Next — ${next.title}` : 'Next (last screen)'}
      >
        <ChevronRightIcon className="h-16 w-16" />
      </StepButton>
    </div>
  )
}

/** Edit-mode plumbing shared by both framed layouts: the flag, and the pinned
 *  element that must be dropped whenever the screen under it remounts. */
function useInspectState() {
  const editing = useSyncExternalStore(subscribeDesignMode, getDesignMode, getDesignServerSnapshot)
  const [pinned, setPinned] = useState<Element | null>(null)
  // Re-find a pin that left the screen — only while it is still the pin. See
  // InspectLayer's `onRepin` for the race this closes.
  const repin = useCallback(
    (stale: Element) => setPinned((current) => (current === stale ? refind(stale) : current)),
    [],
  )
  // The layers outline's hovered row, highlighted in the device.
  const [preview, setPreview] = useState<Element | null>(null)
  const { current } = useFlow()

  // Screens remount on every navigation, so a pin held across one would point
  // at a node that is no longer in the document.
  useEffect(() => setPinned(null), [current])
  useEffect(() => setPreview(null), [current])
  useEffect(() => {
    if (!editing) {
      setPinned(null)
      setPreview(null)
    }
  }, [editing])

  return { editing, pinned, setPinned, repin, preview, setPreview, current }
}

// --- the right panel: Chat · Design · CSS ------------------------------------
//
// One selection, three things to do with it (STUDIO-EDITING-PLAN Part E): Chat
// asks for a change to it, Design changes it, CSS reads it. Whether the canvas
// selects at all is the Edit toggle in its corner, not a tab — tapping through
// the app is navigation, and navigation (Screens, and each screen's states)
// lives in the left sidebar. Under every tab, Push sends the project's changes
// live, whichever tab made them. Where nothing can be saved — a shared link
// with no backend — it opens on CSS, since Design could only collect.
//
// The Design panel stays MOUNTED behind Chat and CSS: it is what restores the
// unsaved list and asks where saves go, and its staged edits must survive a
// look elsewhere. CSS mounts fresh each time — it reads computed styles once
// per pin, so a fresh mount shows the element as it is after an edit. Chat
// mounts freely too: its conversation lives in useLiveChat's store.

const TAB_META: Record<EditTab, { label: string; icon: typeof ChatIcon }> = {
  chat: { label: 'Chat', icon: ChatIcon },
  edit: { label: 'Design', icon: EditIcon },
  css: { label: 'CSS', icon: CodeIcon },
}

/** Which tabs exist, and which one is showing. */
function usePanelTab() {
  useEffect(probeChat, [])
  const chatAvailable = useSyncExternalStore(
    subscribeChat,
    () => getChat().available === true,
    () => getChatServerSnapshot().available === true,
  )
  const chosen = useSyncExternalStore(subscribeDesignMode, getEditTab, getEditTabServerSnapshot)
  const backend = useSyncExternalStore(
    subscribeDesignStore,
    () => getDesignStoreState().backend,
    () => getDesignStoreServerSnapshot().backend,
  )

  const fallback: EditTab = backend === 'record' ? 'css' : 'edit'
  const tabs: EditTab[] = chatAvailable ? ['chat', 'edit', 'css'] : ['edit', 'css']
  const tab: EditTab = chosen && tabs.includes(chosen) ? chosen : fallback

  return { tab, tabs, select: setEditTab }
}

function RightPanel({
  pinned,
  onPin,
  slug,
  screenId,
  onMinimize,
}: {
  pinned: Element | null
  onPin: (el: Element | null) => void
  slug: string
  screenId: string
  onMinimize: () => void
}) {
  const { tab, tabs, select } = usePanelTab()
  // The panel's own title and ✕ above the tabs — the ✕ ends Edit, whichever
  // tab is showing, so it belongs to the panel rather than to a tab's row.
  const header = (
    <div className="flex w-full flex-col">
      <div className="flex h-48 items-center justify-between">
        <span className="text-14 font-bold text-default dark:text-neutral-50">Edit</span>
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Close Edit"
          title="Close Edit — clicks tap through the prototype again"
          className="flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
        >
          <CloseIcon className="size-16" />
        </button>
      </div>
      <PanelTabs tabs={tabs.map((id) => ({ id, ...TAB_META[id] }))} active={tab} onChange={select} />
    </div>
  )
  // Every tab fills the panel, so the Push bar under them never moves.
  const fill = 'flex-1'
  const common = { className: fill, pinned, onPin, slug, screenId }

  return (
    <aside
      className={`${styles.panel} flex h-full min-h-0 flex-none flex-col rounded-16 border border-default bg-neutral-white px-12 pb-12 dark:border-ink-700 dark:bg-ink-900`}
    >
      <div className={tab === 'edit' ? 'contents' : 'hidden'}>
        <DesignPanel {...common} tabs={header} />
      </div>
      {tab === 'css' ? <InspectorPanel {...common} tabs={header} /> : null}
      {tab === 'chat' ? (
        <LiveChatPanel
          slug={slug}
          screenId={screenId}
          pinned={pinned}
          onDeselect={() => onPin(null)}
          tabs={header}
          className={fill}
        />
      ) : null}
      <PushBar slug={slug} />
    </aside>
  )
}

// --- the left sidebar's Layers and Notes -------------------------------------
//
// Both live in the shell's sidebar, as tabs beside Screens (see
// chrome/sidebarSlots.ts). They are drawn from here because they need the
// running prototype; the sidebar only lends them a place.

function SidebarPortals({
  screens,
  notes,
  editing,
  slug,
  current,
  pinned,
  setPinned,
  setPreview,
}: {
  screens: ScreenDef[]
  notes?: string[]
  editing: boolean
  slug: string
  current: string
  pinned: Element | null
  setPinned: (el: Element | null) => void
  setPreview: (el: Element | null) => void
}) {
  const slots = useSyncExternalStore(subscribeSidebarSlots, getSidebarSlots, getSidebarSlotsServerSnapshot)
  useEffect(() => {
    setSidebarLive(true)
    return () => setSidebarLive(false)
  }, [])

  // Picking a layer is a request to work on it, so it starts Edit first.
  const pinFromList = (el: Element | null) => {
    if (el && !editing) setDesignMode(true)
    setPinned(el)
  }

  return (
    <>
      {slots.layers
        ? createPortal(
            <LayersPanel
              embedded
              pinned={pinned}
              onPin={pinFromList}
              onHover={setPreview}
              drag={editing ? layersDrag(slug, current) : undefined}
            />,
            slots.layers,
          )
        : null}
      {slots.notes ? createPortal(<NotesBody screens={screens} projectNotes={notes} />, slots.notes) : null}
    </>
  )
}

/**
 * The framed layout — the device on the canvas with its view controls in the
 * corner, the sidebar's tabs on the left (drawn by the shell), and the one
 * panel floating on the right. The phone sits at
 * life size or smaller by height; a 1440 desktop frame scales to fit both axes
 * of what's left beside the panel.
 */
function FramedLayout({ config, screens }: { config: ProjectConfig; screens: ScreenDef[] }) {
  const { editing, pinned, setPinned, repin, preview, setPreview, current } = useInspectState()
  const device = config.device ?? 'mobile'
  const zoom = useCanvasZoom(DESKTOP_FRAME)
  // The right panel IS Edit: open, clicks select for its tools; closed, they
  // tap through the app. One switch, so neither can be on without the other —
  // selecting with nowhere to act on the selection would be a trap.
  const startEditing = () => setDesignMode(true)
  const stopEditing = () => setDesignMode(false)

  const viewport = (
    <AppViewport
      device={device}
      slug={config.slug}
      editing={editing}
      pinned={pinned}
      onPin={setPinned}
      onRepin={repin}
      preview={preview}
    />
  )

  return (
    <div className="flex h-full min-h-0 w-full gap-16 overflow-hidden bg-neutral-50 p-16 dark:bg-ink-950">
      <SidebarPortals
        screens={screens}
        notes={config.notes}
        editing={editing}
        slug={config.slug}
        current={current}
        pinned={pinned}
        setPinned={setPinned}
        setPreview={setPreview}
      />

      <div className="relative flex min-w-0 flex-1">
        {device === 'desktop' ? (
          // The 1440 frame fills its cell, so it starts below the corner
          // buttons rather than under them.
          <div className={`min-w-0 flex-1 pt-48 ${styles.desktopDevice}`}>
            <DeviceStepper>
              <ZoomableDevice zoom={zoom}>
                <DeviceFrame device="desktop">{viewport}</DeviceFrame>
              </ZoomableDevice>
            </DeviceStepper>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 justify-center py-8">
            <DeviceStepper>
              <ScaledDevice>
                <DeviceFrame>{viewport}</DeviceFrame>
              </ScaledDevice>
            </DeviceStepper>
          </div>
        )}
        <CanvasControls
          slug={config.slug}
          onEdit={editing ? undefined : startEditing}
          zoom={device === 'desktop' ? <ZoomControl zoom={zoom} /> : null}
          className="absolute right-0 top-0 z-30"
        />
      </div>

      {editing ? (
        <RightPanel
          pinned={pinned}
          onPin={setPinned}
          slug={config.slug}
          screenId={current}
          onMinimize={stopEditing}
        />
      ) : null}
    </div>
  )
}

/** The way out of an explicitly-requested full screen. Floating rather than in a
 *  bar, because a bar is chrome and bare mode's whole point is that there isn't
 *  any: it sits over the bottom-right corner, where app UI least often is. */
function ExitFullScreen() {
  return (
    <button
      type="button"
      onClick={() => setBareMode(false)}
      aria-label="Exit full screen"
      title="Exit full screen (Esc)"
      className="fixed bottom-24 right-24 z-30 flex items-center gap-8 rounded-full border border-default bg-neutral-white px-16 py-8 text-12 font-bold text-caption shadow-sm hover:bg-neutral-50 hover:text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
    >
      <CloseIcon className="size-16" />
      Exit full screen
    </button>
  )
}

/**
 * Bare presentation — the app, the window, and nothing else.
 *
 * `fill` is the phone-on-a-phone case (and the only one that existed before
 * this was a mode): the viewport already IS the device, so the app takes it
 * literally, unscaled, exactly as the real app would. Every other bare view has
 * a window that doesn't match the design size — a 1440 back-office on a laptop,
 * or a 390 phone flow on a projector — so the layout keeps its design width and
 * scales to fit, centred on the canvas.
 *
 * The exit button is tied to `explicit`, not to the mode: implicit bare has no
 * studio view to return to, and a floating button over a phone screen would
 * cover real UI for no gain (the triple-tap escape hatch already serves there).
 */
function BareLayout({
  device,
  fill,
  explicit,
}: {
  device: DeviceKind
  fill: boolean
  explicit: boolean
}) {
  // Esc is the reflex for leaving anything full screen, so it works even when
  // the button is deliberately absent.
  useEffect(() => {
    if (!explicit) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBareMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [explicit])

  if (fill) {
    return (
      <div className="h-full w-full bg-neutral-white">
        <AppViewport device={device} />
        {explicit ? <ExitFullScreen /> : null}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-neutral-50 dark:bg-ink-950">
      <FittedDevice spec={DEVICE_SPECS[device]} upscale>
        <div className="h-full w-full overflow-hidden bg-neutral-white">
          <AppViewport device={device} />
        </div>
      </FittedDevice>
      {explicit ? <ExitFullScreen /> : null}
    </div>
  )
}

export interface PrototypeViewProps {
  config: ProjectConfig
  /** Deep-link target from ?screen=<id>; falls back to the entry screen. */
  initialScreenId?: string
  /** Deep-link from ?full=1 — opens straight into bare presentation, so a link
   *  handed round before a demo needs no click to get there. */
  initialBare?: boolean
}

/** The project's screen list — its own plus any inherited from a base
 *  (`extends`) — loaded client-side from the registry.
 *  Screen components are lazyScreen() handles and can't cross the server
 *  boundary, so the loader runs here — the same thing FlowCanvas does. */
function useScreens(slug: string): ScreenDef[] | null {
  const [screens, setScreens] = useState<ScreenDef[] | null>(null)

  useEffect(() => {
    let alive = true
    // The registry is imported dynamically, not at the top of the file: a
    // static import would put every project's index — and the demo/store libs
    // their states pull in — into this route's bundle, which is the cost we
    // just removed from the screens.
    Promise.all([import('@/projects/registry'), import('@/platform/runtime/resolveProject')])
      .then(([{ registry }, { resolveProject }]) => resolveProject(registry, slug))
      .then((m) => {
        if (alive && m) setScreens(m.screens)
      })
    return () => {
      alive = false
    }
  }, [slug])

  return screens
}

export function PrototypeView({ config, initialScreenId, initialBare }: PrototypeViewProps) {
  const isDesktop = useIsDesktop()
  const screens = useScreens(config.slug)

  const explicitBare = useSyncExternalStore(
    subscribeBareMode,
    getBareMode,
    getBareServerSnapshot,
  )

  // Both flags outlive this route, so leaving for the gallery or the flow view
  // would otherwise strand the shell in a mode with nothing to apply it to.
  useEffect(
    () => () => {
      setDesignMode(false)
      setBareMode(false)
    },
    [],
  )

  useEffect(() => {
    if (initialBare) setBareMode(true)
  }, [initialBare])

  const device = config.device ?? 'mobile'
  // A phone prototype on a phone viewport: bare without anyone asking, because
  // there is no room for the studio around it — the rule that used to be a
  // layout branch. A 1440-wide desktop prototype never qualifies: unframed on a
  // 375px window it isn't a prototype at all, so it stays framed and scales.
  const impliedBare = device === 'mobile' && !isDesktop
  const bare = explicitBare || impliedBare

  // The provider seeds its visit stack from the screen list, so it must not
  // mount before the list is there. The canvas underneath is the same colour
  // the loaded layout paints, so the wait reads as an empty page, not a flash.
  if (!screens) return <div className="h-full w-full bg-neutral-50 dark:bg-ink-950" />

  return (
    <PrototypeProvider screens={screens} initialScreenId={initialScreenId}>
      <BridgePublisher slug={config.slug} screens={screens} />
      {bare ? (
        <BareLayout device={device} fill={impliedBare} explicit={explicitBare} />
      ) : (
        <FramedLayout config={config} screens={screens} />
      )}
    </PrototypeProvider>
  )
}
