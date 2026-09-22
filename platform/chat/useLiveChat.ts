'use client'

// =============================================================================
// Drives the panel from a live turn: POST /api/chat, read its SSE stream. The
// shape it returns is the replay's shape plus a composer's worth of state, so
// the panel renders both the same way — which was the replay's promise.
//
// The CLI session id comes back on the first turn and is sent with every later
// one, so a conversation continues rather than starting over (and the cached
// contract is reused rather than paid for again — B6's $0.16 per fresh context).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatEvent, ChatState } from './ChatPanel'

interface Done {
  type: 'done'
  sessionId?: string
  costUsd: number
  durationMs: number
  changed: string[]
  outside: string[]
  error?: string
}

type ServerEvent =
  | { type: 'session'; sessionId: string; model: string }
  | { type: 'text'; text: string }
  | { type: 'tool'; tool: string; detail: string }
  | Done

/** A ChatEvent before it is stamped — Omit distributed over the union. */
type Unstamped = ChatEvent extends infer E ? (E extends ChatEvent ? Omit<E, 'at'> : never) : never

export type Gate = 'checking' | 'unavailable' | 'locked' | 'open'

export interface LiveChat extends ChatState {
  gate: Gate
  /** Resolves to an error message, or null once unlocked. */
  unlock: (password: string) => Promise<string | null>
  /** `shown` is what the transcript displays, when it differs from the prompt. */
  send: (prompt: string, shown?: string) => void
  stop: () => void
  model: string | null
  last: Done | null
}

export function useLiveChat(slug: string): LiveChat {
  const [gate, setGate] = useState<Gate>('checking')
  const [status, setStatus] = useState<ChatState['status']>('idle')
  const [events, setEvents] = useState<ChatEvent[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [lastEventAt, setLastEventAt] = useState(0)
  const [spend, setSpend] = useState(0)
  const [model, setModel] = useState<string | null>(null)
  const [last, setLast] = useState<Done | null>(null)
  const sessionId = useRef<string | undefined>(undefined)
  const startedAt = useRef(0)
  const abort = useRef<AbortController | null>(null)

  const push = useCallback((event: Unstamped) => {
    const at = Date.now() - startedAt.current
    setEvents((prev) => [...prev, { ...event, at } as ChatEvent])
    setLastEventAt(at)
  }, [])

  const handle = useCallback(
    (event: ServerEvent) => {
      switch (event.type) {
        case 'session':
          sessionId.current = event.sessionId
          setModel(event.model)
          break
        case 'text':
          push({ kind: 'text', text: event.text })
          break
        case 'tool':
          push({ kind: 'tool', tool: event.tool, detail: event.detail })
          break
        case 'done':
          if (event.sessionId) sessionId.current = event.sessionId
          setSpend((s) => s + event.costUsd)
          setLast(event)
          if (event.error) push({ kind: 'error', text: event.error })
          if (event.outside.length > 0) {
            push({
              kind: 'error',
              text: `Changed outside this project: ${event.outside.join(', ')}. Not undone — check before you commit.`,
            })
          }
          break
      }
    },
    [push],
  )

  const send = useCallback(
    async (prompt: string, shown?: string) => {
      const text = prompt.trim()
      if (!text || abort.current) return
      const controller = new AbortController()
      abort.current = controller
      startedAt.current = Date.now()
      setElapsedMs(0)
      setLastEventAt(0)
      setLast(null)
      setStatus('running')
      push({ kind: 'user', text: shown ?? text })

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug, message: text, sessionId: sessionId.current }),
          signal: controller.signal,
        })
        if (res.status === 401) setGate('locked')
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          push({
            kind: 'error',
            text: body?.error ?? (res.status === 404 ? 'Chat only runs on the local dev server.' : `Failed (${res.status}).`),
          })
          return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let split: number
          while ((split = buffer.indexOf('\n\n')) >= 0) {
            const chunk = buffer.slice(0, split)
            buffer = buffer.slice(split + 2)
            if (chunk.startsWith('data: ')) handle(JSON.parse(chunk.slice(6)) as ServerEvent)
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) push({ kind: 'error', text: String(err) })
        else push({ kind: 'error', text: 'Stopped.' })
      } finally {
        abort.current = null
        setStatus('done')
      }
    },
    [handle, push, slug],
  )

  const stop = useCallback(() => abort.current?.abort(), [])

  useEffect(() => {
    fetch('/api/chat', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { available: boolean; needsPassword: boolean } | null) =>
        setGate(!s?.available ? 'unavailable' : s.needsPassword ? 'locked' : 'open'),
      )
      .catch(() => setGate('unavailable'))
  }, [])

  const unlock = useCallback(async (password: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ unlock: password }),
    })
    if (res.ok) {
      setGate('open')
      return null
    }
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    return body?.error ?? 'That did not work.'
  }, [])

  // Same reason as the replay: the clock must move through a long think.
  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 100)
    return () => clearInterval(id)
  }, [status])

  useEffect(() => () => abort.current?.abort(), [])

  return {
    gate,
    unlock,
    status,
    events,
    elapsedMs,
    sinceLastEventMs: Math.max(0, elapsedMs - lastEventAt),
    spendUsd: spend,
    send,
    stop,
    model,
    last,
  }
}
