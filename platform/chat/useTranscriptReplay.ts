'use client'

// =============================================================================
// Drives a RecordedTurn at its real timings, so the panel can be judged before
// there is an API key to judge it with. The panel consumes this exactly as it
// would consume a live SSE stream: events arrive, and between them nothing
// happens — which is the whole point. `speed` exists so a reviewer can sit
// through it once at 1x and then iterate without waiting four minutes again.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecordedTurn, TranscriptEvent } from './transcript'

export type ReplayStatus = 'idle' | 'running' | 'done'

export interface ReplayState {
  status: ReplayStatus
  /** Events delivered so far, in order. */
  events: TranscriptEvent[]
  /** Turn-relative ms, advancing continuously — this is what a timer shows. */
  elapsedMs: number
  /** Time since the last event. The silence the designer actually feels. */
  sinceLastEventMs: number
  start: () => void
  reset: () => void
}

export function useTranscriptReplay(turn: RecordedTurn, speed: number): ReplayState {
  const [status, setStatus] = useState<ReplayStatus>('idle')
  const [events, setEvents] = useState<TranscriptEvent[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const startedAt = useRef<number | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    startedAt.current = null
    setEvents([])
    setElapsedMs(0)
    setStatus('idle')
  }, [clearTimers])

  const start = useCallback(() => {
    clearTimers()
    setEvents([])
    setElapsedMs(0)
    setStatus('running')
    startedAt.current = Date.now()

    turn.events.forEach((event) => {
      timers.current.push(
        setTimeout(() => setEvents((prev) => [...prev, event]), event.at / speed),
      )
    })
    timers.current.push(
      setTimeout(() => setStatus('done'), turn.durationMs / speed),
    )
  }, [clearTimers, speed, turn])

  // The timer ticks independently of events — a panel that only re-renders when
  // something arrives goes visibly dead during an 85-second think.
  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => {
      if (startedAt.current === null) return
      setElapsedMs((Date.now() - startedAt.current) * speed)
    }, 100)
    return () => clearInterval(id)
  }, [status, speed])

  useEffect(() => clearTimers, [clearTimers])

  const lastAt = events.length > 0 ? events[events.length - 1].at : 0

  return {
    status,
    events,
    elapsedMs,
    sinceLastEventMs: Math.max(0, elapsedMs - lastAt),
    start,
    reset,
  }
}
