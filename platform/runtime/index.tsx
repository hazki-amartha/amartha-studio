'use client'

// =============================================================================
// WS-A · Prototype runtime.
// Implements the FlowApi contract from platform/types.ts (go / back / current)
// over a screen stack,
// and renders the active screen with an optional slide transition.
//
//   • useFlow()          — the frozen navigation API, consumed by every screen.
//   • PrototypeProvider  — owns the visit stack; entry-screen / deep-link start.
//   • ScreenStage        — renders the active screen inside the device viewport.
// =============================================================================

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { FlowApi, ScreenDef } from '@/platform/types'
import styles from '@/platform/frame/prototype.module.css'

// --- FlowApi (frozen contract) ----------------------------------------------

export const FlowContext = createContext<FlowApi | null>(null)

export function useFlow(): FlowApi {
  const ctx = useContext(FlowContext)
  if (!ctx) {
    throw new Error(
      'useFlow() must be called from a screen rendered inside the platform runtime (PrototypeProvider).',
    )
  }
  return ctx
}

// --- Internal runtime state (not part of the frozen contract) ----------------

type Direction = 'forward' | 'back'

interface RuntimeState {
  screens: ScreenDef[]
  current: string
  direction: Direction
}

const RuntimeContext = createContext<RuntimeState | null>(null)

function useRuntime(): RuntimeState {
  const ctx = useContext(RuntimeContext)
  if (!ctx) {
    throw new Error('Prototype runtime components must be rendered inside <PrototypeProvider>.')
  }
  return ctx
}

/** Resolve the screen a prototype should open on: an explicit (deep-linked) id
 *  when valid, otherwise the entry screen, otherwise the first screen. */
export function resolveStartScreen(screens: ScreenDef[], preferredId?: string): string {
  if (preferredId && screens.some((s) => s.id === preferredId)) return preferredId
  const entry = screens.find((s) => s.entry)
  return entry?.id ?? screens[0]?.id ?? ''
}

export interface PrototypeProviderProps {
  screens: ScreenDef[]
  /** Screen id to start on (deep-link). Falls back to entry screen when absent/unknown. */
  initialScreenId?: string
  children: React.ReactNode
}

export function PrototypeProvider({ screens, initialScreenId, children }: PrototypeProviderProps) {
  const startId = useMemo(
    () => resolveStartScreen(screens, initialScreenId),
    [screens, initialScreenId],
  )

  const [stack, setStack] = useState<string[]>(() => [startId])
  const [direction, setDirection] = useState<Direction>('forward')

  const current = stack[stack.length - 1] ?? startId

  const go = useCallback(
    (id: string) => {
      if (!screens.some((s) => s.id === id)) {
        // Fail soft: a bad target should not crash the running prototype.
        console.warn(`useFlow().go("${id}") — no screen with that id in this project.`)
        return
      }
      setDirection('forward')
      setStack((s) => [...s, id])
    },
    [screens],
  )

  const back = useCallback(() => {
    setDirection('back')
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  const flow = useMemo<FlowApi>(() => ({ go, back, current }), [go, back, current])
  const runtime = useMemo<RuntimeState>(
    () => ({ screens, current, direction }),
    [screens, current, direction],
  )

  return (
    <FlowContext.Provider value={flow}>
      <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>
    </FlowContext.Provider>
  )
}

/** Renders the active screen inside the app viewport, animating each transition. */
export function ScreenStage() {
  const { screens, current, direction } = useRuntime()
  const active = screens.find((s) => s.id === current)

  if (!active) return null

  const Screen = active.component
  const slideClass = direction === 'back' ? styles.back : styles.forward

  return (
    <div className={styles.stage}>
      {/* key on the screen id so React remounts (and re-animates) on navigation */}
      <div key={current} className={`${styles.slide} ${slideClass}`}>
        <Screen />
      </div>
    </div>
  )
}
