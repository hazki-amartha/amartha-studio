'use client'

// =============================================================================
// WS-A · PrototypeView — the responsive presentation of a running prototype.
//   • < md  → full-page app (no frame), feels like the real app.
//   • ≥ md  → device frame centered on neutral-50, project name + owner above,
//             annotation panel beside it showing the active screen's notes
//             (falling back to the project's notes).
// A single app instance is rendered in either mode (no duplicate screen state).
// =============================================================================

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ProjectConfig, ScreenDef } from '@/platform/types'
import { PrototypeProvider, ScreenStage, useFlow } from '@/platform/runtime'
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
      <span className="text-10 font-bold uppercase text-caption">Notes</span>
      {active ? <h2 className="text-16 font-bold text-default">{active.title}</h2> : null}
      {notes.length > 0 ? (
        <ul className="flex flex-col gap-8">
          {notes.map((note, i) => (
            <li key={i} className="text-14 text-caption">
              {note}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-14 text-caption">No annotations for this screen.</p>
      )}
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

function DesktopLayout({ config, screens }: { config: ProjectConfig; screens: ScreenDef[] }) {
  return (
    <div className="flex h-full min-h-0 w-full items-start justify-center gap-32 overflow-hidden bg-neutral-50 px-16 py-24">
      <ScaledDevice>
        <DeviceFrame>
          <AppViewport />
        </DeviceFrame>
      </ScaledDevice>
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
      {isDesktop ? <DesktopLayout config={config} screens={screens} /> : <MobileLayout />}
    </PrototypeProvider>
  )
}
