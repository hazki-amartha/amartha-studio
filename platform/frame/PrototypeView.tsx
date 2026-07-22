'use client'

// =============================================================================
// WS-A · PrototypeView — the responsive presentation of a running prototype.
//   • < md  → full-page app (no frame), feels like the real app.
//   • ≥ md  → device frame centered on neutral-50, flanked by arrows that step
//             through the declared screen order, with the annotation panel
//             pinned to the right edge showing the active screen's notes
//             (falling back to the project's notes), and the states panel
//             mirroring it on the left.
// The two panels are the two axes of a walkthrough: the arrows and the states
// reach any screen in any condition without tapping through the setup first.
// The arrows exist because not every screen is reachable by tapping: component
// explorations declare states (on-track / late / settled) that no flow edge
// points at, and a lifecycle transition is often time passing, not a tap.
// A single app instance is rendered in either mode (no duplicate screen state).
// =============================================================================

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ProjectConfig, ScreenDef } from '@/platform/types'
import {
  PrototypeProvider,
  ScreenStage,
  useFlow,
  useScreenJump,
  useScreenStep,
} from '@/platform/runtime'
import { clearScreenBridge, publishScreenBridge } from '@/platform/runtime/bridge'
import { ChevronLeftIcon, ChevronRightIcon } from '@/platform/chrome/icons'
import { DeviceFrame } from './DeviceFrame'
import { StatusBar } from './StatusBar'
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
 *  explorer can highlight the active screen and jump to another one. */
function BridgePublisher({ slug }: { slug: string }) {
  const { current } = useFlow()
  const jump = useScreenJump()

  useEffect(() => {
    publishScreenBridge(slug, current, jump)
  }, [slug, current, jump])

  // Clear only on unmount — the publish effect above handles every update.
  useEffect(() => () => clearScreenBridge(), [])

  return null
}

/** The running app: status bar + the active screen stage. */
function AppViewport() {
  return (
    <div className={styles.viewport}>
      <StatusBar />
      <ScreenStage />
    </div>
  )
}

function AnnotationPanel({
  screens,
  projectNotes,
}: {
  screens: ScreenDef[]
  projectNotes?: string[]
}) {
  const { current } = useFlow()
  const active = screens.find((s) => s.id === current)
  const notes = active?.notes && active.notes.length > 0 ? active.notes : (projectNotes ?? [])

  return (
    <aside className={`flex max-h-full flex-col gap-12 overflow-y-auto pt-8 ${styles.annotations}`}>
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
 */
function StatesPanel({ screens }: { screens: ScreenDef[] }) {
  const { current } = useFlow()
  const active = screens.find((s) => s.id === current)
  const states = active?.states ?? []
  const [applied, setApplied] = useState<string | null>(null)

  useEffect(() => setApplied(null), [current])

  // No states declared → the column goes back to being the invisible spacer
  // that balances the annotations, and the device stays optically centred.
  if (states.length === 0) return <div aria-hidden className={styles.states} />

  return (
    <aside className={`flex max-h-full flex-col gap-12 overflow-y-auto pt-8 ${styles.states}`}>
      <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">States</span>
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

// Outer device dimensions: 390×844 screen + 12px bezel on each side.
// Hardware specs, not design tokens.
const DEVICE_W = 414
const DEVICE_H = 868

/** Scales the device frame down (never up) so it always fits the height this
 *  view was given — whatever chrome surrounds it — without page scroll, while
 *  screens keep their 390px layout. The wrapper is measured (not the window)
 *  so headers/sidebars around the view are automatically accounted for. */
function ScaledDevice({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientHeight / DEVICE_H))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="h-full flex-none" style={{ width: DEVICE_W * scale }}>
      <div
        style={{
          width: DEVICE_W,
          height: DEVICE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
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

function DesktopLayout({ config, screens }: { config: ProjectConfig; screens: ScreenDef[] }) {
  return (
    <div
      className={`h-full min-h-0 w-full gap-32 overflow-hidden bg-neutral-50 px-16 py-24 dark:bg-ink-950 ${styles.desktop}`}
    >
      {/* Mirrors the caption column, so the device stays optically centred
          whether or not the active screen declares any states. */}
      <StatesPanel screens={screens} />
      <DeviceStepper>
        <ScaledDevice>
          <DeviceFrame>
            <AppViewport />
          </DeviceFrame>
        </ScaledDevice>
      </DeviceStepper>
      <AnnotationPanel screens={screens} projectNotes={config.notes} />
    </div>
  )
}

function MobileLayout() {
  return (
    <div className="h-full w-full bg-neutral-white">
      <AppViewport />
    </div>
  )
}

export interface PrototypeViewProps {
  config: ProjectConfig
  screens: ScreenDef[]
  /** Deep-link target from ?screen=<id>; falls back to the entry screen. */
  initialScreenId?: string
}

export function PrototypeView({ config, screens, initialScreenId }: PrototypeViewProps) {
  const isDesktop = useIsDesktop()

  return (
    <PrototypeProvider screens={screens} initialScreenId={initialScreenId}>
      <BridgePublisher slug={config.slug} />
      {isDesktop ? <DesktopLayout config={config} screens={screens} /> : <MobileLayout />}
    </PrototypeProvider>
  )
}
