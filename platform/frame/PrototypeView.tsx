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
// In studio mode the device sits on the page card's canvas, either kind on a
// canvas you can zoom and pan, flanked by arrows that step through the
// declared screen order. Around it, the shell (platform/chrome) lends this
// view three places to draw (shellSlots.ts): the sidebar's Layers and Notes
// tabs, the top bar's Comment · Edit · Chat, and the panel column on the
// frame, right of the card. The arrows and the sidebar's states are the two
// axes of a walkthrough: they reach any screen in any condition without
// tapping through the setup first. The arrows exist because not every screen
// is reachable by tapping: component explorations declare states (on-track /
// late / settled) that no flow edge points at, and a lifecycle transition is
// often time passing, not a tap.
// A single app instance is rendered in either mode (no duplicate screen state).
// =============================================================================

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
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
  useRestart,
  useScreenJump,
  useScreenStep,
} from '@/platform/runtime'
import { clearScreenBridge, publishScreenBridge, reapplyScreenState } from '@/platform/runtime/bridge'
import {
  getDesignMode,
  getDesignServerSnapshot,
  getEditTab,
  getEditTabServerSnapshot,
  getPicking,
  getPickingServerSnapshot,
  setDesignMode,
  setEditTab,
  setPicking,
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
import { HistoryButton } from '@/platform/dbProjects/DraftControls'
import { CommentLayer } from '@/platform/comments/CommentLayer'
import { useGuestAccess } from '@/platform/auth/session'
import { CommentsPanel } from '@/platform/comments/CommentList'
import { setCommentMode, useComments, useCommentsFor } from '@/platform/comments/store'
import { layersDrag } from '@/platform/design/actions'
import { findRemembered, toggleSelected } from '@/platform/design/selection'
import { refind } from '@/platform/design/overlay'
import { getLayerTree, type Layer } from '@/platform/design/layers'
import { describeForChat, hoverAt, outlineOf, pickAt, revealLayer, selectLayer } from '@/platform/design/pick'
import { setSelectionDescriber } from '@/platform/chat/attach'
import type { PickLayers } from '@/platform/inspect/InspectLayer'
import {
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CommentIcon,
  EditIcon,
} from '@/platform/chrome/icons'
import { PillTabs } from '@/platform/chrome/SidePanel'
import { FullScreenButton, ViewSwitch } from '@/platform/chrome/CanvasControls'
import { ShellPortal } from '@/platform/chrome/ShellPortal'
import { ToolButton } from '@/platform/chrome/TopBar'
import { nextZoom, ZoomControl } from '@/platform/chrome/ZoomControl'
import { ShareButton } from '@/platform/share/ShareButton'
import { ShortcutSheet, useShortcuts, withKey, type ShortcutAction } from '@/platform/chrome/shortcuts'
import {
  getShellSlots,
  getShellSlotsServerSnapshot,
  setPrototypeLive,
  subscribeShellSlots,
} from '@/platform/chrome/shellSlots'
import { useProjectVersion } from '@/platform/runtime/projectRefresh'
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

  // A new screen list on the same mount is an edit landing: the project
  // relinked and its stores started over. Put back the state the designer had
  // applied before the screen paints its defaults.
  const linked = useRef(screens)
  useLayoutEffect(() => {
    if (linked.current === screens) return
    linked.current = screens
    reapplyScreenState(screens)
  }, [screens])

  useEffect(() => {
    const active = screens.find((s) => s.id === current)
    publishScreenBridge(slug, current, active?.title ?? current, jump, active?.states)
  }, [slug, current, jump, screens])

  // The address bar follows the device, so a reload — or a full reload after
  // an edit — opens on this screen, and the URL can be copied as a link to it.
  // replaceState, not the router: the route keys the view by ?screen, and a
  // router navigation would remount it.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('screen') === current) return
    url.searchParams.set('screen', current)
    window.history.replaceState(null, '', url)
  }, [current])

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
  picking = true,
  pinned,
  onPin,
  onRepin,
  preview,
  commenting,
}: {
  device?: DeviceKind
  slug?: string
  editing?: boolean
  /** In Edit mode, whether clicks select (true) or tap through (false). */
  picking?: boolean
  pinned?: Element | null
  onPin?: (el: Element | null) => void
  onRepin?: (stale: Element) => void
  preview?: readonly Element[] | null
  /** Comment is on: clicks drop review pins instead of tapping the app. */
  commenting?: boolean
} = {}) {
  const { current } = useFlow()
  // Chat's selection chip and context speak in layers while a prototype is open.
  useEffect(() => {
    setSelectionDescriber(describeForChat)
    return () => setSelectionDescriber(null)
  }, [])
  // Edit picks layers (platform/design/layers.ts): a click selects at the
  // selection's own depth, a hover shows what it would select.
  const pinnedRef = useRef(pinned ?? null)
  pinnedRef.current = pinned ?? null
  const layers = useMemo<PickLayers>(
    () => ({
      pick: (target, e) => pickAt(target, pinnedRef.current, e),
      hover: (target, e) => hoverAt(target, pinnedRef.current, e),
      outline: (el) => outlineOf(el),
    }),
    [],
  )
  return (
    <div
      className={styles.viewport}
      data-device={device}
      data-inspect={editing ? 'on' : undefined}
      data-interact={editing && !picking ? '' : undefined}
    >
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
          layers={layers}
          onShiftPick={(el) => (pinned ? toggleSelected(el) : onPin(el))}
          onRepin={onRepin}
          tone="design"
          passive={!picking}
        />
      ) : null}
      {editing && onPin && slug ? (
        <DesignLayer
          slug={slug}
          screenId={current}
          pinned={pinned ?? null}
          onPin={onPin}
          onRepin={onRepin}
          passive={!picking}
        />
      ) : null}
      {commenting ? <CommentLayer /> : null}
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

/** Scales a frame down to fit BOTH axes of the space it was given — bare
 *  presentation's, which has no zoom. (The framed layout's canvas is
 *  useCanvasZoom, which opens fitted the same way.)
 *
 *  The measured element is `min-w-0 flex-1`, so its own width comes from the
 *  container and never from the scaled child. Sizing it from the scale would
 *  feed the observer its own output. */
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

const DESKTOP_FRAME = outerSize(DEVICE_SPECS.desktop)

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

/** The canvas's inset around the frame (ZoomableDevice's p-16), so a fitted
 *  frame keeps its shadow instead of having it cut at the canvas's edge. */
const CANVAS_INSET = 16

/**
 * The device on a canvas you can zoom and pan — the phone and the desktop
 * frame alike. It opens fitted, never larger than life, then zooms past that
 * when a 1440 layout shrunk beside the panels is too small to work on, or to
 * look closely at a phone screen. A trackpad pinch (or ⌘/Ctrl + scroll, for a
 * mouse) zooms at the pointer, a two-finger scroll pans, and ZoomControl (in
 * the canvas's corner) steps or refits.
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
      const room = 2 * CANVAS_INSET
      setFit(Math.min(1, (el.clientWidth - room) / spec.width, (el.clientHeight - room) / spec.height))
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

  // Non-passive, so a pinch zooms the frame instead of the whole page. A pinch
  // arrives as a wheel with ctrlKey set (the browser synthesises it), in small
  // steps; ⌘/Ctrl + a mouse wheel arrives in notches of ~100, so it takes a
  // gentler factor or one notch would leap a whole zoom stop.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const box = el.getBoundingClientRect()
      const rate = e.ctrlKey ? 0.01 : 0.002
      zoomAt(scaleRef.current * Math.exp(-e.deltaY * rate), e.clientX - box.left, e.clientY - box.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // Safari doesn't turn a pinch into a ctrl-wheel: it sends gesture events,
  // with the scale since the pinch began. Left alone they zoom the whole page.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    type Gesture = Event & { scale: number; clientX: number; clientY: number }
    let from = 1
    const onStart = (e: Event) => {
      e.preventDefault()
      from = scaleRef.current
    }
    const onChange = (e: Event) => {
      e.preventDefault()
      const g = e as Gesture
      const box = el.getBoundingClientRect()
      zoomAt(from * g.scale, g.clientX - box.left, g.clientY - box.top)
    }
    const onEnd = (e: Event) => e.preventDefault()
    el.addEventListener('gesturestart', onStart)
    el.addEventListener('gesturechange', onChange)
    el.addEventListener('gestureend', onEnd)
    return () => {
      el.removeEventListener('gesturestart', onStart)
      el.removeEventListener('gesturechange', onChange)
      el.removeEventListener('gestureend', onEnd)
    }
  }, [zoomAt])

  const step = (dir: 1 | -1) => {
    const el = ref.current
    zoomAt(nextZoom(scale, dir, MIN_ZOOM, MAX_ZOOM), (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2)
  }

  const actual = () => {
    const el = ref.current
    zoomAt(1, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2)
  }

  return { ref, spec, scale, fitted: zoom == null, refit: () => setZoom(null), step, actual }
}

type CanvasZoom = ReturnType<typeof useCanvasZoom>

function ZoomableDevice({ zoom, children }: { zoom: CanvasZoom; children: ReactNode }) {
  const { ref, spec, scale } = zoom
  return (
    // `m-auto` on the child, not centring on the parent: it centres a frame
    // smaller than the canvas and still lets a larger one scroll to its left
    // and top edges, which flex centring would push out of reach.
    <div ref={ref} className="flex h-full min-h-0 min-w-0 flex-1 overflow-auto p-16">
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
      className="flex size-32 flex-none items-center justify-center rounded-8 border border-default bg-neutral-white text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-800 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800 dark:disabled:text-neutral-700"
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
  const picking = useSyncExternalStore(subscribeDesignMode, getPicking, getPickingServerSnapshot)
  const [pinned, setPinned] = useState<Element | null>(null)
  // Re-find a pin that left the screen — only while it is still the pin. See
  // InspectLayer's `onRepin` for the race this closes. The layer it stood for
  // is found first by what it looks like: a save shifts every address below
  // the change, and the card is still the card.
  const repin = useCallback(
    (stale: Element) =>
      setPinned((current) =>
        current === stale ? (findRemembered(getLayerTree().all)?.hosts[0] ?? refind(stale)) : current,
      ),
    [],
  )
  // The layers outline's hovered row, highlighted in the device.
  const [preview, setPreview] = useState<readonly Element[] | null>(null)
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

  return { editing, picking, pinned, setPinned, repin, preview, setPreview, current }
}

// --- the right panel: Comments · Edit · Chat ----------------------------------
//
// One column right of the page card, on the dark frame (the shell's `panel`
// slot), with the same three tabs, in the same order, as the top-bar buttons
// that open it. Comments: clicks on the device drop review pins. Edit and
// Chat: clicks select, and the tab is what you do with the selection (STUDIO-
// EDITING-PLAN Part E) — Edit changes it (Visual) or reads it (CSS), Chat asks
// for a change to it. Navigation — Screens, and each screen's states — lives
// in the left sidebar. Under Edit and Chat, Push sends the project's changes
// live, whichever tab made them. Where nothing can be saved — a shared link
// with no backend — Edit opens on CSS, since Visual could only collect.
//
// The Visual panel stays MOUNTED behind Chat and CSS: it is what restores the
// unsaved list and asks where saves go, and its staged edits must survive a
// look elsewhere. CSS mounts fresh each time — it reads computed styles once
// per pin, so a fresh mount shows the element as it is after an edit. Chat
// mounts freely too: its conversation lives in useLiveChat's store.

type PanelTab = 'comments' | 'edit' | 'chat'
/** What Edit shows: Visual (the design panel) or CSS (the inspector). */
type EditView = 'edit' | 'css'

/** Whether Chat is offered — unless the server said no; loading and errors
 *  show inside the tab. */
function useChatAvailable(): boolean {
  useEffect(probeChat, [])
  return useSyncExternalStore(
    subscribeChat,
    () => getChat().available !== false,
    () => getChatServerSnapshot().available !== false,
  )
}

/** Which tab is showing, and the way to each — the top bar's buttons, the
 *  panel's tabs and the shortcuts all go through here. */
function usePanel(chatAvailable: boolean) {
  const editing = useSyncExternalStore(subscribeDesignMode, getDesignMode, getDesignServerSnapshot)
  const { mode: commenting } = useComments()
  const chosen = useSyncExternalStore(subscribeDesignMode, getEditTab, getEditTabServerSnapshot)
  const backend = useSyncExternalStore(
    subscribeDesignStore,
    () => getDesignStoreState().backend,
    () => getDesignStoreServerSnapshot().backend,
  )

  // Opened without a tab named — picking a layer starts Edit mode — it shows
  // Chat where Chat is there, otherwise what this backend can do.
  const fallback: EditTab = chatAvailable ? 'chat' : backend === 'record' ? 'css' : 'edit'
  const editTab: EditTab = chosen && (chosen !== 'chat' || chatAvailable) ? chosen : fallback
  const tab: PanelTab | null = editing ? (editTab === 'chat' ? 'chat' : 'edit') : commenting ? 'comments' : null
  const editView: EditView = editTab === 'css' ? 'css' : 'edit'

  const openEdit = (view?: EditView) => {
    setCommentMode(false)
    setDesignMode(true)
    // Visual, unless nothing here can be saved — then only CSS has a use.
    setEditTab(view ?? (backend === 'record' ? 'css' : 'edit'))
    setPicking(true)
  }
  const openChat = () => {
    setCommentMode(false)
    setDesignMode(true)
    setEditTab('chat')
    setPicking(false)
  }
  // Turning Comment on turns Edit off (comments/store).
  const openComments = () => setCommentMode(true)
  const close = () => {
    setDesignMode(false)
    setCommentMode(false)
  }
  const chooseView = (view: EditView) => setEditTab(view)
  // The tab already showing keeps its Pick / Interact choice.
  const select = (next: PanelTab) =>
    next === tab ? undefined : next === 'comments' ? openComments() : next === 'chat' ? openChat() : openEdit()

  return { tab, editView, openEdit, openChat, openComments, close, chooseView, select }
}

/** Visual | CSS — the Edit tab's two ways to look at the selection. */
function EditAs({ view, onChange }: { view: EditView; onChange: (view: EditView) => void }) {
  const views: { id: EditView; label: string; title: string }[] = [
    { id: 'edit', label: 'Visual', title: 'Change the selection with the design tools' },
    { id: 'css', label: 'CSS', title: 'Read the selection’s styles' },
  ]
  return (
    <div className="flex w-full pt-12">
      <div
        role="group"
        aria-label="Edit as"
        className="flex h-32 w-full items-stretch gap-2 rounded-8 border border-default bg-neutral-50 p-2 dark:border-ink-700 dark:bg-ink-900"
      >
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            title={v.title}
            onClick={() => onChange(v.id)}
            className={`flex flex-1 items-center justify-center rounded-6 text-12 ${
              view === v.id
                ? 'bg-neutral-white font-bold text-default shadow-sm dark:bg-ink-700 dark:text-neutral-50 dark:shadow-none'
                : 'text-caption hover:text-default dark:text-neutral-500 dark:hover:text-neutral-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function RightPanel({
  tab,
  tabs,
  onTab,
  editView,
  onEditView,
  onClose,
  picking,
  pinned,
  onPin,
  slug,
  screenId,
  screens,
}: {
  tab: PanelTab
  tabs: { id: PanelTab; label: string; title?: string }[]
  onTab: (tab: PanelTab) => void
  editView: EditView
  onEditView: (view: EditView) => void
  onClose: () => void
  picking: boolean
  pinned: Element | null
  onPin: (el: Element | null) => void
  slug: string
  screenId: string
  screens: ScreenDef[]
}) {
  // Every tab fills the box, so the Push bar under them never moves.
  const common = { className: 'flex-1', pinned, onPin, slug, screenId }
  const editAs = <EditAs view={editView} onChange={onEditView} />

  return (
    <aside aria-label="Panel" className="flex min-h-0 flex-1 flex-col">
      {/* The tabs, the save History (database projects) and the ✕ sit on the
          frame above the box, as the sidebar's header does opposite. The ✕
          closes the whole panel, whichever tab is showing: clicks tap through
          the prototype again. */}
      <div className="flex h-48 flex-none items-center gap-4 px-4">
        <PillTabs tabs={tabs} active={tab} onChange={onTab} />
        <HistoryButton slug={slug} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          title="Close — clicks tap through the prototype again"
          className="flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-500 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
        >
          <CloseIcon className="size-16" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-12 border border-default bg-neutral-white px-12 pb-12 dark:border-ink-800 dark:bg-ink-950">
        {tab === 'comments' ? (
          <CommentsPanel screens={screens} />
        ) : (
          <>
            <div className={tab === 'edit' && editView === 'edit' ? 'contents' : 'hidden'}>
              <DesignPanel {...common} tabs={editAs} />
            </div>
            {tab === 'edit' && editView === 'css' ? <InspectorPanel {...common} tabs={editAs} /> : null}
            {tab === 'chat' ? (
              <LiveChatPanel
                slug={slug}
                screenId={screenId}
                pinned={pinned}
                onDeselect={() => onPin(null)}
                select={{ on: picking, onToggle: () => setPicking(!picking) }}
                tabs={false}
                className="flex-1"
              />
            ) : null}
            <PushBar slug={slug} />
          </>
        )}
      </div>
    </aside>
  )
}

// --- the left sidebar's Layers and Notes -------------------------------------
//
// Both live in the shell's sidebar, as tabs beside Screens (see
// chrome/shellSlots.ts). They are drawn from here because they need the
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
  setPreview: (boxes: readonly Element[] | null) => void
}) {
  const slots = useSyncExternalStore(subscribeShellSlots, getShellSlots, getShellSlotsServerSnapshot)
  useEffect(() => {
    setPrototypeLive(true)
    return () => setPrototypeLive(false)
  }, [])

  // Picking a layer is a request to work on it, so it starts Edit first — and
  // brings it into view, wherever the screen is scrolled.
  const selectFromList = (layer: Layer, add: boolean) => {
    if (add && pinned) {
      if (layer.hosts[0]) toggleSelected(layer.hosts[0])
      return
    }
    if (!editing) setDesignMode(true)
    selectLayer(layer, setPinned)
    revealLayer(layer)
  }

  return (
    <>
      {slots.layers
        ? createPortal(
            <LayersPanel
              embedded
              pinned={pinned}
              onSelect={selectFromList}
              onHover={setPreview}
              drag={editing ? layersDrag(slug, current) : undefined}
              memoryKey={`${slug}:${current}`}
            />,
            slots.layers,
          )
        : null}
      {slots.notes ? createPortal(<NotesBody screens={screens} projectNotes={notes} />, slots.notes) : null}
    </>
  )
}

/**
 * The framed layout — the device on the page card's canvas, with how you look
 * at it in the canvas's bottom corners (Prototype | Flow; zoom and full
 * screen). What you do to it goes through the shell: Share and Comment · Edit ·
 * Chat in the top bar, their panel in the column right of the card, Layers and
 * Notes as the sidebar's tabs.
 */
function FramedLayout({ config, screens, presence }: { config: ProjectConfig; screens: ScreenDef[]; presence?: ReactNode }) {
  const { editing, picking, pinned, setPinned, repin, preview, setPreview, current } = useInspectState()
  const device = config.device ?? 'mobile'
  const zoom = useCanvasZoom(device === 'desktop' ? DESKTOP_FRAME : PHONE)
  useCommentsFor(config.slug)
  const { mode: commenting, available: commentsOn } = useComments()
  const chatAvailable = useChatAvailable()
  const panel = usePanel(chatAvailable)
  // Opened from a share link (platform/share): never Edit, and comments only
  // when the link allows them. The routes enforce the same; this is the UI.
  const guest = useGuestAccess(config.slug)
  const canComment = commentsOn && guest !== 'view'
  useEffect(() => {
    if (guest && editing) setDesignMode(false)
  }, [guest, editing])
  // Comment and Edit both take over clicks on the device, so opening Edit —
  // from its button or by picking a layer — ends Comment.
  useEffect(() => {
    if (editing) setCommentMode(false)
  }, [editing])
  // The panel's Edit and Chat ARE Edit mode: open, clicks select for their
  // tools; closed, they tap through the app. One switch, so neither can be on
  // without the other — selecting with nowhere to act on the selection would
  // be a trap.
  const stopEditing = () => setDesignMode(false)
  const restart = useRestart()
  const [shortcuts, setShortcuts] = useState(false)
  const keys: Partial<Record<ShortcutAction, () => boolean | void>> = {
    comment: canComment ? () => (panel.tab === 'comments' ? panel.close() : panel.openComments()) : undefined,
    edit: guest ? undefined : () => (panel.tab === 'edit' ? panel.close() : panel.openEdit()),
    fullscreen: () => setBareMode(true),
    restart,
    fit: zoom.refit,
    actual: zoom.actual,
    zoomIn: () => zoom.step(1),
    zoomOut: () => zoom.step(-1),
    help: () => setShortcuts((open) => !open),
    // One step back. A selection clears first — the Edit layer does that — and
    // only an empty Edit closes; Comment handles its own Esc.
    escape: () => {
      if (shortcuts) return (setShortcuts(false), true)
      if (editing && !pinned) stopEditing()
    },
  }
  useShortcuts(keys)

  const tabs: { id: PanelTab; label: string; title?: string }[] = [
    ...(canComment
      ? [{ id: 'comments' as const, label: 'Comments', title: withKey('Comments — click the screen to leave feedback', 'comment') }]
      : []),
    ...(guest
      ? []
      : [
          { id: 'edit' as const, label: 'Edit', title: withKey('Edit — click elements to select them', 'edit') },
          ...(chatAvailable ? [{ id: 'chat' as const, label: 'AI Chat', title: 'AI Chat — ask Claude for a change' }] : []),
        ]),
  ]

  const viewport = (
    <AppViewport
      device={device}
      slug={config.slug}
      editing={editing}
      picking={picking}
      pinned={pinned}
      onPin={setPinned}
      onRepin={repin}
      preview={preview}
      commenting={commenting && !editing}
    />
  )

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-neutral-50 dark:bg-ink-950">
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

      {/* The bottom strip stays clear for the corner controls, so a fitted
          device never sits under them. */}
      <div className={`min-w-0 flex-1 px-16 pb-32 pt-8 ${styles.deviceCell}`}>
        <DeviceStepper>
          <ZoomableDevice zoom={zoom}>
            <DeviceFrame device={device}>{viewport}</DeviceFrame>
          </ZoomableDevice>
        </DeviceStepper>
      </div>
      <ViewSwitch slug={config.slug} className="absolute bottom-16 left-16 z-30" />
      <div className="absolute bottom-16 right-16 z-30 flex items-center gap-8">
        <ZoomControl
          scale={zoom.scale}
          fitted={zoom.fitted}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          onStep={zoom.step}
          onFit={zoom.refit}
        />
        <FullScreenButton />
      </div>
      {shortcuts ? (
        <ShortcutSheet
          only={(Object.keys(keys) as ShortcutAction[]).filter((k) => keys[k])}
          onClose={() => setShortcuts(false)}
        />
      ) : null}

      {/* The top bar's end: who else is here, Share, then the ways into the
          panel — those go while it's open, since its tabs are the same three. */}
      <ShellPortal slot="actions">
        {presence}
        {guest ? null : <ShareButton slug={config.slug} icon />}
        {panel.tab ? null : (
          <>
            {canComment ? (
              <ToolButton
                icon={<CommentIcon className="size-16" />}
                label="Comment"
                title={withKey('Comment — click anywhere on the screen to leave feedback', 'comment')}
                onClick={panel.openComments}
              />
            ) : null}
            {guest ? null : (
              <ToolButton
                icon={<EditIcon className="size-16" />}
                label="Edit"
                title={withKey('Edit — click elements to select them', 'edit')}
                onClick={() => panel.openEdit()}
              />
            )}
            {guest || !chatAvailable ? null : (
              <ToolButton
                icon={<ChatIcon className="size-16" />}
                label="AI Chat"
                title="AI Chat — ask Claude for a change"
                inverted
                onClick={panel.openChat}
              />
            )}
          </>
        )}
      </ShellPortal>

      {panel.tab ? (
        <ShellPortal slot="panel">
          <RightPanel
            tab={panel.tab}
            tabs={tabs}
            onTab={panel.select}
            editView={panel.editView}
            onEditView={panel.chooseView}
            onClose={panel.close}
            picking={picking}
            pinned={pinned}
            onPin={setPinned}
            slug={config.slug}
            screenId={current}
            screens={screens}
          />
        </ShellPortal>
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
  // the button is deliberately absent; F goes back the way it came in.
  const restart = useRestart()
  useShortcuts(
    explicit ? { escape: () => setBareMode(false), fullscreen: () => setBareMode(false), restart } : {},
  )

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
  /** Screens supplied by the caller instead of loaded from the registry —
   *  /db/<slug>, whose project lives in the database (platform/dbProjects). */
  screens?: ScreenDef[]
  /** Shown in the top bar, before Comment · Edit · Chat — /db/<slug>'s "also
   *  here" avatars. */
  presence?: ReactNode
}

/** The project's screen list — its own plus any inherited from a base
 *  (`extends`) — loaded client-side from the registry.
 *  Screen components are lazyScreen() handles and can't cross the server
 *  boundary, so the loader runs here — the same thing FlowCanvas does. */
function useScreens(slug: string, enabled: boolean): ScreenDef[] | null {
  const [screens, setScreens] = useState<ScreenDef[] | null>(null)
  // Bumped when something edits the project (see projectRefresh), so a screen
  // added by chat shows up without a reload.
  const version = useProjectVersion()

  useEffect(() => {
    if (!enabled) return
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
  }, [slug, version, enabled])

  return screens
}

export function PrototypeView({ config, initialScreenId, initialBare, screens: supplied, presence }: PrototypeViewProps) {
  const isDesktop = useIsDesktop()
  const loaded = useScreens(config.slug, !supplied)
  const screens = supplied ?? loaded

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
      setCommentMode(false)
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
        <FramedLayout config={config} screens={screens} presence={presence} />
      )}
    </PrototypeProvider>
  )
}
