'use client'

// =============================================================================
// The chat panel (STUDIO-EDITING-PLAN phase C2). One view, two data sources:
// `ChatPanel` replays a recorded turn at its real timings, `LiveChatPanel`
// streams a real one from the claude CLI on this laptop (app/api/chat). The view
// cannot tell them apart, which is the point of having built it on the replay.
//
// It is shaped by one measured fact: a real request takes 4–10 minutes, with an
// 85-second silence in the middle while the agent thinks. A chat transcript
// alone reads as a hang across that gap, so three things carry the wait —
// a timer that never stops moving, the current activity stated in words, and a
// spend figure that makes the cost of the wait legible rather than a surprise.
// =============================================================================

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CloseIcon, InspectIcon } from '@/platform/chrome/icons'
import { PanelHeader } from '@/platform/chrome/SidePanel'
import { resolveTarget } from '@/platform/inspect/resolve'
import { setDesignMode } from '@/platform/runtime/designBridge'
import { attachmentFor } from './attach'
import type { RecordedTurn, TranscriptEvent } from './transcript'
import { useTranscriptReplay } from './useTranscriptReplay'
import { useLiveChat } from './useLiveChat'

const SPEEDS = [1, 4, 16] as const

export type ChatEvent =
  | TranscriptEvent
  | { at: number; kind: 'user'; text: string }
  | { at: number; kind: 'error'; text: string }

/** What the view needs from either source. */
export interface ChatState {
  status: 'idle' | 'running' | 'done'
  events: ChatEvent[]
  elapsedMs: number
  sinceLastEventMs: number
  spendUsd: number
}

/** Plain-language activity per tool — a designer does not read tool names. */
function activityFor(event: ChatEvent | undefined): string {
  if (!event || event.kind === 'user') return 'Starting up'
  if (event.kind !== 'tool') return 'Writing a reply'
  const file = event.detail.split('/').pop() ?? event.detail
  switch (event.tool) {
    case 'Read':
      return `Reading ${file}`
    case 'Write':
      return `Writing ${file}`
    case 'Edit':
      return `Editing ${file}`
    case 'Bash':
      return /^(npm|npx)\b/.test(event.detail) ? 'Running checks' : 'Searching the project'
    case 'Glob':
    case 'Grep':
      return 'Searching the project'
    default:
      return 'Working'
  }
}

function clock(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function ChatView({
  subtitle,
  state,
  headerControls,
  doneLabel,
  onClose,
  embedded,
  statusExtra,
  children,
}: {
  subtitle: string
  state: ChatState
  headerControls?: ReactNode
  onClose?: () => void
  doneLabel: string
  /** Inside the prototype view's panel: no header of its own (the panel's tabs
   *  are the header) and no side padding (the panel's card has it). */
  embedded?: boolean
  /** Beside the spend, in the status line — New chat. */
  statusExtra?: ReactNode
  children: ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [state.events.length, state.status])

  const running = state.status === 'running'
  const last = state.events[state.events.length - 1]

  const inset = embedded ? '' : 'px-16'

  return (
    <div
      className={
        embedded ? 'flex min-h-0 flex-1 flex-col' : 'flex h-full flex-col bg-neutral-white dark:bg-ink-900'
      }
    >
      {embedded ? null : (
      <header className="flex items-center justify-between border-b border-neutral-200 px-16 py-12 dark:border-ink-700">
        <div className="min-w-0">
          <p className="text-14 font-bold text-ink-900 dark:text-neutral-white">Chat</p>
          <p className="truncate text-12 font-regular text-neutral-600">{subtitle}</p>
        </div>
        {headerControls}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            title="Close chat — the conversation stays"
            className="flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
          >
            <CloseIcon className="size-16" />
          </button>
        ) : null}
      </header>
      )}

      <div ref={scroller} className={`min-h-0 flex-1 overflow-y-auto py-12 ${inset}`}>
        {state.events.length === 0 && embedded ? (
          <p className="text-12 font-regular text-neutral-600">{subtitle}</p>
        ) : null}
        {state.events.map((event, i) => {
          switch (event.kind) {
            case 'user':
              return (
                <div key={i} className="mb-16 mt-4 rounded-12 bg-neutral-50 px-12 py-8 dark:bg-ink-800">
                  <p className="whitespace-pre-wrap text-14 font-regular text-ink-900 dark:text-neutral-200">
                    {event.text}
                  </p>
                </div>
              )
            case 'text':
              return (
                <p
                  key={i}
                  className="mb-12 whitespace-pre-wrap text-14 font-regular text-ink-900 dark:text-neutral-white"
                >
                  {event.text}
                </p>
              )
            case 'error':
              return (
                <p key={i} className="mb-12 rounded-12 bg-red-50 px-12 py-8 text-12 font-regular text-red-500">
                  {event.text}
                </p>
              )
            default:
              return (
                <div key={i} className="mb-4 flex items-baseline gap-8">
                  <span className="text-12 font-bold text-primary-500">{event.tool}</span>
                  <span className="truncate text-12 font-regular text-neutral-600">{event.detail}</span>
                </div>
              )
          }
        })}

        {running && (
          <div className="mt-12 flex items-center gap-8 rounded-12 bg-primary-50 px-12 py-8">
            <span className="text-14 font-bold text-primary-500">{activityFor(last)}</span>
            <span className="text-12 font-regular text-neutral-600">
              {clock(state.sinceLastEventMs)} on this step
            </span>
          </div>
        )}
      </div>

      <footer className={`border-t border-neutral-200 py-12 dark:border-ink-700 ${inset}`}>
        <div className="mb-8 flex items-center justify-between gap-8 text-12 font-regular text-neutral-600">
          <span>
            {running
              ? `Working — ${clock(state.elapsedMs)}`
              : state.status === 'done'
                ? doneLabel
                : 'Idle'}
          </span>
          <span className="flex items-center gap-8">
            {statusExtra}
            <span>${state.spendUsd.toFixed(2)}</span>
          </span>
        </div>
        {children}
      </footer>
    </div>
  )
}

const buttonClass =
  'w-full rounded-full bg-primary-500 px-16 py-12 text-14 font-bold text-neutral-white disabled:opacity-50'
const fieldClass =
  'mb-8 w-full rounded-8 border border-neutral-200 bg-neutral-white px-12 py-8 text-14 font-regular text-ink-900 outline-none focus:border-primary-500 dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-white'

export function ChatPanel({ turn }: { turn: RecordedTurn }) {
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const replay = useTranscriptReplay(turn, speed)
  const running = replay.status === 'running'
  // Spend is estimated from progress, because the SDK only reports the true
  // figure at the end — and a number that appears only when it is too late to
  // act on it is not a cost control.
  const spendUsd = running
    ? turn.costUsd * Math.min(1, replay.elapsedMs / turn.durationMs)
    : replay.status === 'done'
      ? turn.costUsd
      : 0
  const events: ChatEvent[] = [{ at: 0, kind: 'user', text: turn.prompt }, ...replay.events]

  return (
    <ChatView
      subtitle="afin-linear · replay of a recorded turn"
      state={{ ...replay, events, spendUsd }}
      doneLabel={`Done in ${clock(turn.durationMs)} · saved, not live`}
      headerControls={
        <div className="flex gap-4" role="group" aria-label="Replay speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`rounded-full px-12 py-4 text-12 font-bold ${
                speed === s
                  ? 'bg-primary-500 text-neutral-white'
                  : 'bg-neutral-50 text-neutral-700 dark:bg-ink-700 dark:text-neutral-200'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      }
    >
      <button
        type="button"
        onClick={replay.status === 'idle' ? replay.start : replay.reset}
        className={buttonClass}
      >
        {replay.status === 'idle' ? 'Send' : replay.status === 'running' ? 'Stop' : 'Again'}
      </button>
    </ChatView>
  )
}

/**
 * Chat as the first tab of the prototype view's panel. It is about the current
 * selection — Edit mode's pinned element — shown as a chip with an ✕ that
 * deselects; there is no separate pick. With nothing selected (or in
 * Prototype, where nothing can be) the message goes without an element, and
 * "Select an element" switches to Edit mode to pick one.
 *
 * The conversation lives in useLiveChat's store, so this can mount and unmount
 * with the panel without losing a word, or a turn that is still running.
 */
export function LiveChatPanel({
  slug,
  screenId,
  pinned,
  onDeselect,
  editing,
  tabs,
  onMinimize,
  className,
}: {
  slug: string
  screenId: string
  pinned: Element | null
  onDeselect: () => void
  /** In Edit mode, where elements can be picked. */
  editing: boolean
  tabs?: ReactNode
  onMinimize?: () => void
  className?: string
}) {
  const chat = useLiveChat(slug)
  const running = chat.status === 'running'
  const attachment = useMemo(
    () => (pinned ? attachmentFor(resolveTarget(pinned), slug, screenId) : null),
    [pinned, slug, screenId],
  )

  const submit = () => {
    const draft = chat.draft.trim()
    if (!draft || running) return
    if (attachment) {
      // The element goes to the agent in full; the transcript shows the chip.
      chat.send(`${attachment.context}\n\nChange: ${draft}`, `[${attachment.label}] ${draft}`)
    } else {
      chat.send(draft)
    }
  }

  const changed = chat.last?.changed.length ?? 0
  const subtitle = `Claude on this laptop${chat.model ? ` · ${chat.model}` : ''} — ask for a change to ${slug}.`
  const shell = (body: ReactNode) => (
    <aside className={`flex min-h-0 flex-1 flex-col ${className ?? ''}`}>
      <PanelHeader title="Chat" tabs={tabs} onMinimize={onMinimize} />
      {body}
    </aside>
  )

  if (chat.gate !== 'open') {
    return shell(
      <ChatView subtitle={subtitle} state={chat} doneLabel="" embedded>
        {chat.gate === 'unavailable' ? (
          <p className="text-12 font-regular text-neutral-600">
            Chat runs only on the dev server, and only once STUDIO_EDIT_PASSWORD is set in
            .env.local.
          </p>
        ) : chat.gate === 'checking' ? null : (
          <PasswordForm onUnlock={chat.unlock} />
        )}
      </ChatView>,
    )
  }

  return shell(
    <ChatView
      subtitle={subtitle}
      state={chat}
      embedded
      statusExtra={
        chat.events.length > 0 ? (
          <button
            type="button"
            onClick={chat.newChat}
            title="Start over — a new conversation"
            className="font-bold text-primary-500 hover:underline"
          >
            New chat
          </button>
        ) : null
      }
      doneLabel={
        chat.last?.error
          ? 'Stopped'
          : `Done in ${clock(chat.last?.durationMs ?? chat.elapsedMs)} · ${changed} file${changed === 1 ? '' : 's'} changed · saved, not live`
      }
    >
      <div className="mb-8 flex min-h-32 items-center gap-8">
        {attachment ? (
          <span className="flex min-w-0 items-center gap-4 rounded-full bg-primary-50 py-4 pl-12 pr-4 text-12 font-bold text-primary-500">
            <span className="truncate">{attachment.label}</span>
            <button
              type="button"
              onClick={onDeselect}
              aria-label="Deselect the element"
              title="Deselect — the message will be about the project"
              className="flex size-20 flex-none items-center justify-center rounded-full hover:bg-primary-200"
            >
              <CloseIcon className="size-12" />
            </button>
          </span>
        ) : editing ? (
          <span className="text-12 font-regular text-neutral-600">
            Click an element in the prototype to ask about it.
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setDesignMode(true)}
            title="Switch to Edit and click an element to ask about it"
            className="flex h-32 flex-none items-center gap-4 rounded-full border border-neutral-200 px-12 text-12 font-bold text-neutral-700 hover:border-primary-500 hover:text-primary-500 dark:border-ink-700 dark:text-neutral-200"
          >
            <InspectIcon className="size-16" />
            Select an element
          </button>
        )}
      </div>
      <textarea
        value={chat.draft}
        onChange={(e) => chat.setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        rows={3}
        placeholder={attachment ? 'What should change about it?' : 'Ask for a change'}
        className={`${fieldClass} resize-none`}
      />
      <button
        type="button"
        onClick={running ? chat.stop : submit}
        disabled={!running && !chat.draft.trim()}
        className={buttonClass}
      >
        {running ? 'Stop' : 'Send'}
      </button>
    </ChatView>,
  )
}

/** The design-mode editing password — one password unlocks both. */
function PasswordForm({ onUnlock }: { onUnlock: (password: string) => Promise<string | null> }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!value || busy) return
        setBusy(true)
        setError(await onUnlock(value))
        setBusy(false)
      }}
    >
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="current-password"
        aria-label="Editing password"
        placeholder="Editing password"
        className={fieldClass}
      />
      <p className="mb-8 text-12 font-regular text-neutral-600">
        {error ?? 'Chat drives Claude on this laptop, so it needs the editing password.'}
      </p>
      <button type="submit" disabled={!value || busy} className={buttonClass}>
        Unlock
      </button>
    </form>
  )
}
