'use client'

// =============================================================================
// Drives the panel from a live turn: POST /api/chat, read its SSE stream. The
// shape it returns is the replay's shape plus a composer's worth of state, so
// the panel renders both the same way — which was the replay's promise.
//
// The conversation lives in a module store, one per project, not in the
// component. Chat is a tab of the prototype view's panel now, and that panel
// comes and goes — switching Prototype ↔ Edit, going full screen, minimizing
// it. A conversation, or a turn still streaming, must survive all of that, so
// nothing here belongs to a mount. Only leaving for another project, or New
// chat, starts over.
//
// The CLI session id comes back on the first turn and is sent with every later
// one, so a conversation continues rather than starting over (and the cached
// contract is reused rather than paid for again — B6's $0.16 per fresh context).
// =============================================================================

import { useEffect, useState, useSyncExternalStore } from 'react'
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

/** 'signed-out' and 'no-cli': chat is allowed here, but Claude Code on this
 *  laptop can't run a turn until the designer fixes it in their terminal. */
export type Gate = 'checking' | 'unavailable' | 'locked' | 'signed-out' | 'no-cli' | 'open'

interface Conversation {
  status: ChatState['status']
  events: ChatEvent[]
  startedAt: number
  lastEventAt: number
  spendUsd: number
  model: string | null
  last: Done | null
  sessionId?: string
  /** What's typed but not sent — kept, like everything else, across the panel
   *  coming and going. */
  draft: string
}

const fresh = (): Conversation => ({
  status: 'idle',
  events: [],
  startedAt: 0,
  lastEventAt: 0,
  spendUsd: 0,
  model: null,
  last: null,
  draft: '',
})

// --- the store ----------------------------------------------------------------

let slugNow: string | null = null
let convo: Conversation = fresh()
let gate: Gate = 'checking'
let abort: AbortController | null = null
const listeners = new Set<() => void>()

function set(patch: Partial<Conversation>) {
  convo = { ...convo, ...patch }
  listeners.forEach((l) => l())
}

function setGate(next: Gate) {
  gate = next
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Point the store at a project; another project's conversation is dropped. */
function selectProject(slug: string) {
  if (slugNow !== slug) {
    abort?.abort()
    abort = null
    slugNow = slug
    convo = fresh()
  }
}

function push(event: Unstamped) {
  const at = Date.now() - convo.startedAt
  set({ events: [...convo.events, { ...event, at } as ChatEvent], lastEventAt: at })
}

function handle(event: ServerEvent) {
  switch (event.type) {
    case 'session':
      set({ sessionId: event.sessionId, model: event.model })
      break
    case 'text':
      push({ kind: 'text', text: event.text })
      break
    case 'tool':
      push({ kind: 'tool', tool: event.tool, detail: event.detail })
      break
    case 'done':
      set({ sessionId: event.sessionId ?? convo.sessionId, spendUsd: convo.spendUsd + event.costUsd, last: event })
      if (event.error) push({ kind: 'error', text: event.error })
      if (event.outside.length > 0) {
        push({
          kind: 'error',
          text: `Changed outside this project: ${event.outside.join(', ')}. Not undone — check before you commit.`,
        })
      }
      break
  }
}

async function send(prompt: string, shown?: string) {
  const text = prompt.trim()
  const slug = slugNow
  if (!text || abort || !slug) return
  const controller = new AbortController()
  abort = controller
  set({ startedAt: Date.now(), lastEventAt: 0, last: null, status: 'running', draft: '' })
  push({ kind: 'user', text: shown ?? text })

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, message: text, sessionId: convo.sessionId }),
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
      // A New chat mid-turn: stop listening, and don't write into the new one.
      if (abort !== controller) return
      buffer += decoder.decode(value, { stream: true })
      let split: number
      while ((split = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, split)
        buffer = buffer.slice(split + 2)
        if (chunk.startsWith('data: ')) handle(JSON.parse(chunk.slice(6)) as ServerEvent)
      }
    }
  } catch (err) {
    if (abort !== controller) return
    push({ kind: 'error', text: controller.signal.aborted ? 'Stopped.' : String(err) })
  } finally {
    if (abort === controller) {
      abort = null
      set({ status: 'done' })
    }
  }
}

function stop() {
  abort?.abort()
}

/** Start over: the transcript, the agent's session and the spend. A turn still
 *  running is stopped first. */
function newChat() {
  abort?.abort()
  abort = null
  convo = fresh()
  listeners.forEach((l) => l())
}

function setDraft(draft: string) {
  set({ draft })
}

interface Status {
  available: boolean
  needsPassword: boolean
  signIn: 'signed-in' | 'signed-out' | 'no-cli' | null
}

function gateOf(s: Status | null): Gate {
  if (!s?.available) return 'unavailable'
  if (s.needsPassword) return 'locked'
  if (s.signIn === 'no-cli') return 'no-cli'
  if (s.signIn === 'signed-out') return 'signed-out'
  return 'open'
}

let probed = false
function probe() {
  if (probed) return
  probed = true
  check()
}

/** Ask the route again — after unlocking, or after signing in in the terminal. */
function check() {
  fetch('/api/chat', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((s: Status | null) => setGate(gateOf(s)))
    .catch(() => setGate('unavailable'))
}

async function unlock(password: string): Promise<string | null> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unlock: password }),
  })
  if (res.ok) {
    check()
    return null
  }
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? 'That did not work.'
}

// --- the hook ------------------------------------------------------------------

export interface LiveChat extends ChatState {
  gate: Gate
  /** Resolves to an error message, or null once unlocked. */
  unlock: (password: string) => Promise<string | null>
  /** Re-checks the gate, e.g. once the designer has signed in. */
  recheck: () => void
  /** `shown` is what the transcript displays, when it differs from the prompt. */
  send: (prompt: string, shown?: string) => void
  stop: () => void
  newChat: () => void
  draft: string
  setDraft: (draft: string) => void
  model: string | null
  last: Done | null
}

const SERVER: Conversation = fresh()

export function useLiveChat(slug: string): LiveChat {
  selectProject(slug)
  useEffect(probe, [])
  const c = useSyncExternalStore(subscribe, () => convo, () => SERVER)
  const g = useSyncExternalStore(subscribe, () => gate, () => 'checking' as Gate)

  // Same reason as the replay: the clock must move through a long think. It is
  // derived from the turn's start, so a panel mounted mid-turn shows the truth.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (c.status !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [c.status])

  const elapsedMs = c.status === 'running' ? Math.max(0, now - c.startedAt) : (c.last?.durationMs ?? 0)

  return {
    gate: g,
    unlock,
    recheck: check,
    status: c.status,
    events: c.events,
    elapsedMs,
    sinceLastEventMs: Math.max(0, elapsedMs - c.lastEventAt),
    spendUsd: c.spendUsd,
    send: (prompt, shown) => void send(prompt, shown),
    stop,
    newChat,
    draft: c.draft,
    setDraft,
    model: c.model,
    last: c.last,
  }
}
