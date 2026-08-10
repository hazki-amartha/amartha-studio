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

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
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
  getInspectMode,
  getInspectServerSnapshot,
  setInspectMode,
  subscribeInspectMode,
} from '@/platform/runtime/inspectBridge'
import {
  getBareMode,
  getBareServerSnapshot,
  setBareMode,
  subscribeBareMode,
} from '@/platform/runtime/presentBridge'
import { InspectLayer, InspectorPanel } from '@/platform/inspect'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/platform/chrome/icons'
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
 *  In inspect mode it also carries the pick layer, which sits inside the device
 *  screen so it inherits the frame's scale. Mobile passes nothing, so the layer
 *  never mounts there. */
function AppViewport({
  device = 'mobile',
  inspect,
  pinned,
  onPin,
}: {
  device?: DeviceKind
  inspect?: boolean
  pinned?: Element | null
  onPin?: (el: Element | null) => void
} = {}) {
  return (
    <div
      className={styles.viewport}
      data-device={device}
      data-inspect={inspect ? 'on' : undefined}
    >
      <ScreenStage />
      {inspect && onPin ? <InspectLayer pinned={pinned ?? null} onPin={onPin} /> : null}
    </div>
  )
}

function AnnotationPanel({
  screens,
  projectNotes,
  /** Defaults to the fixed right-hand column of the phone layout. The desktop
   *  layout passes `w-full` instead, because there the panel lives in a drawer
   *  that already has the width. */
  className = styles.annotations,
}: {
  screens: ScreenDef[]
  projectNotes?: string[]
  className?: string
}) {
  const { current } = useFlow()
  const active = screens.find((s) => s.id === current)
  const notes = active?.notes && active.notes.length > 0 ? active.notes : (projectNotes ?? [])

  return (
    <aside className={`flex max-h-full flex-col gap-12 overflow-y-auto pt-8 ${className}`}>
      <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">Notes</span>
      {active ? <h2 className="text-16 font-bold text-default dark:text-neutral-50">{active.title}</h2> : null}
      {notes.length > 0 ? (
        <ul className="flex flex-col gap-8">
          {notes.map((note, i) => (
            <li key={i} className="text-14 text-caption dark:text-neutral-400">
              {note}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-14 text-caption dark:text-neutral-400">No annotations for this screen.</p>
      )}
    </aside>
  )
}

/**
 * The states panel — the annotation panel's mirror image, on the left.
 *
 * It is a presentation aid: during a walkthrough the state being discussed is
 * often six taps of setup away, and some states cannot be tapped to at all. One
 * click puts the screen in the condition, without leaving it.
 *
 * The selection it shows is what was last APPLIED here, not what the project is
 * actually in — the platform cannot know that, and pretending otherwise would
 * mean reading project internals. It resets when the screen changes, so a stale
 * highlight never survives a navigation.
 *
 * `collapsible` gives it the dismissal the desktop-device layout gets from its
 * drawer tab: there, States is behind a toggle, but here the panel sits in the
 * row beside the device and used to have no way out once a screen declared any.
 * Collapsed, it keeps its column — that column is what balances the annotations
 * and holds the device optically centred — and leaves a pill to bring it back.
 * The choice deliberately survives navigation: a presenter who put it away
 * wants it to stay away.
 */
function StatesPanel({
  screens,
  /** See AnnotationPanel — the desktop layout supplies its own width. */
  className = styles.states,
  collapsible = false,
}: {
  screens: ScreenDef[]
  className?: string
  collapsible?: boolean
}) {
  const { current } = useFlow()
  const active = screens.find((s) => s.id === current)
  const states = active?.states ?? []
  const [applied, setApplied] = useState<string | null>(null)
  const [open, setOpen] = useState(true)

  useEffect(() => setApplied(null), [current])

  // No states declared → the column goes back to being the invisible spacer
  // that balances the annotations, and the device stays optically centred.
  if (states.length === 0) return <div aria-hidden className={className} />

  if (collapsible && !open) {
    return (
      <aside className={`flex max-h-full flex-col pt-8 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className="self-start rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-caption hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:bg-ink-800"
        >
          States
        </button>
      </aside>
    )
  }

  return (
    <aside className={`flex max-h-full flex-col gap-12 overflow-y-auto pt-8 ${className}`}>
      <div className="flex items-center justify-between gap-8">
        <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">
          States
        </span>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded
            aria-label="Hide states"
            title="Hide states"
            className="text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
          >
            <CloseIcon className="h-16 w-16" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-8">
        {states.map((state) => {
          const on = applied === state.id
          return (
            <button
              key={state.id}
              type="button"
              onClick={() => {
                state.apply()
                setApplied(state.id)
              }}
              className={`flex flex-col gap-2 rounded-12 border px-12 py-8 text-left ${
                on
                  ? 'border-primary-500 bg-primary-50 dark:border-ink-700 dark:bg-ink-800'
                  : 'border-default bg-neutral-white hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:hover:bg-ink-800'
              }`}
            >
              <span
                className={`text-14 font-bold ${on ? 'text-link dark:text-neutral-50' : 'text-default dark:text-neutral-50'}`}
              >
                {state.label}
              </span>
              {state.description ? (
                <span className="text-12 text-caption dark:text-neutral-400">
                  {state.description}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </aside>
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

/** Inspect-mode plumbing shared by both framed layouts: the mode flag, and the
 *  pinned element that must be dropped whenever the screen under it remounts. */
function useInspectState() {
  const inspect = useSyncExternalStore(
    subscribeInspectMode,
    getInspectMode,
    getInspectServerSnapshot,
  )
  const [pinned, setPinned] = useState<Element | null>(null)
  const { current } = useFlow()

  // Screens remount on every navigation, so a pin held across one would point
  // at a node that is no longer in the document.
  useEffect(() => setPinned(null), [current])
  useEffect(() => {
    if (!inspect) setPinned(null)
  }, [inspect])

  return { inspect, pinned, setPinned, current }
}

function DesktopLayout({ config, screens }: { config: ProjectConfig; screens: ScreenDef[] }) {
  const { inspect, pinned, setPinned, current } = useInspectState()

  return (
    <div
      className={`h-full min-h-0 w-full gap-32 overflow-hidden bg-neutral-50 px-16 py-24 dark:bg-ink-950 ${styles.desktop}`}
    >
      {/* Mirrors the caption column, so the device stays optically centred
          whether or not the active screen declares any states. Collapsible here
          because this layout has no drawer tab to put it behind. */}
      <StatesPanel screens={screens} collapsible />
      <DeviceStepper>
        <ScaledDevice>
          <DeviceFrame>
            <AppViewport inspect={inspect} pinned={pinned} onPin={setPinned} />
          </DeviceFrame>
        </ScaledDevice>
      </DeviceStepper>
      {/* Notes and the inspector answer different questions; nobody wants both
          at once, so they share the column rather than competing for width. */}
      {inspect ? (
        <InspectorPanel
          className={styles.annotations}
          pinned={pinned}
          onPin={setPinned}
          slug={config.slug}
          screenId={current}
        />
      ) : (
        <AnnotationPanel screens={screens} projectNotes={config.notes} />
      )}
    </div>
  )
}

/** A toggle for one of the desktop drawers. Only rendered when the drawer has
 *  something in it, so a project with no notes and no states shows no chrome at
 *  all beyond the frame and its arrows. */
function DrawerTab({
  side,
  open,
  onClick,
  label,
}: {
  side: 'left' | 'right'
  open: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`absolute top-24 z-20 rounded-full border px-12 py-4 text-12 font-bold ${
        side === 'left' ? 'left-16' : 'right-16'
      } ${
        open
          ? 'border-primary-500 bg-primary-50 text-link dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50'
          : 'border-default bg-neutral-white text-caption hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:bg-ink-800'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * The desktop-device layout. The frame is 1440 wide before anything surrounds
 * it, so unlike the phone it cannot share the row with two 264px panels: notes
 * and states become drawers over the canvas, mounted only when the project has
 * any. The inspector opens the right drawer by itself, since turning inspect on
 * IS the request to see it.
 */
function DesktopDeviceLayout({ config, screens }: { config: ProjectConfig; screens: ScreenDef[] }) {
  const { inspect, pinned, setPinned, current } = useInspectState()
  const [notesOpen, setNotesOpen] = useState(false)
  const [statesOpen, setStatesOpen] = useState(false)

  const active = screens.find((s) => s.id === current)
  const hasStates = (active?.states?.length ?? 0) > 0
  const hasNotes =
    (active?.notes?.length ?? 0) > 0 || (config.notes?.length ?? 0) > 0

  const spec = DEVICE_SPECS.desktop
  const rightOpen = inspect || (hasNotes && notesOpen)

  return (
    <div
      className={`relative h-full min-h-0 w-full overflow-hidden bg-neutral-50 px-16 py-24 dark:bg-ink-950 ${styles.desktopDevice}`}
    >
      <DeviceStepper>
        <FittedDevice spec={outerSize(spec)}>
          <DeviceFrame device="desktop">
            <AppViewport device="desktop" inspect={inspect} pinned={pinned} onPin={setPinned} />
          </DeviceFrame>
        </FittedDevice>
      </DeviceStepper>

      {hasStates ? (
        <DrawerTab
          side="left"
          open={statesOpen}
          onClick={() => setStatesOpen((v) => !v)}
          label="States"
        />
      ) : null}
      {hasNotes && !inspect ? (
        <DrawerTab
          side="right"
          open={notesOpen}
          onClick={() => setNotesOpen((v) => !v)}
          label="Notes"
        />
      ) : null}

      {hasStates && statesOpen ? (
        <div
          className={`rounded-16 bg-neutral-white p-12 dark:bg-ink-900 ${styles.drawer} ${styles.drawerLeft}`}
        >
          <StatesPanel screens={screens} className="w-full" />
        </div>
      ) : null}
      {rightOpen ? (
        <div
          className={`rounded-16 bg-neutral-white p-12 dark:bg-ink-900 ${styles.drawer} ${styles.drawerRight}`}
        >
          {inspect ? (
            <InspectorPanel
              className="w-full"
              pinned={pinned}
              onPin={setPinned}
              slug={config.slug}
              screenId={current}
            />
          ) : (
            <AnnotationPanel screens={screens} projectNotes={config.notes} className="w-full" />
          )}
        </div>
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

/** The project's screen list, loaded client-side from the registry.
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
    import('@/projects/registry')
      .then(({ registry }) => registry[slug]?.())
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

  // Both mode flags outlive this route, so leaving for the gallery or the flow
  // view would otherwise strand the shell in a mode with nothing to apply it to.
  useEffect(
    () => () => {
      setInspectMode(false)
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
      ) : device === 'desktop' ? (
        <DesktopDeviceLayout config={config} screens={screens} />
      ) : (
        <DesktopLayout config={config} screens={screens} />
      )}
    </PrototypeProvider>
  )
}
