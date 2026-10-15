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
import { ChevronRightIcon, CloseIcon, CursorIcon, MediaIcon, StopIcon } from '@/platform/chrome/icons'
import { PanelHeader } from '@/platform/chrome/SidePanel'
import { resolveTarget } from '@/platform/inspect/resolve'
import { attachmentFor } from './attach'
import { ChatLoader, LoaderMark, useLoaderVisible } from './ChatLoader'
import { MAX_IMAGES, MAX_TOTAL_CHARS, prepareImage, type PendingImage } from './images'
import type { RecordedTurn, TranscriptEvent } from './transcript'
import { useTranscriptReplay } from './useTranscriptReplay'
import { useLiveChat } from './useLiveChat'
import { useUsage, type LimitReport } from './usage'
import { isActiveDbProject } from '@/platform/dbProjects/active'

const SPEEDS = [1, 4, 16] as const

export type ChatEvent =
  | TranscriptEvent
  | { at: number; kind: 'user'; text: string; images?: string[] }
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

type ToolEvent = Extract<ChatEvent, { kind: 'tool' }>

/** A run of tool calls in one line — "Read 2 files · edited 1 file · ran 2
 *  commands" — the way Claude's own apps fold the steps between replies. */
function stepsSummary(tools: ToolEvent[]): string {
  const count = (names: string[]) => tools.filter((t) => names.includes(t.tool)).length
  const n = (k: number, one: string) => `${k} ${one}${k === 1 ? '' : 's'}`
  const parts: string[] = []
  const read = count(['Read'])
  const edited = count(['Edit', 'Write', 'MultiEdit'])
  const searched = count(['Glob', 'Grep'])
  const ran = count(['Bash'])
  const other = tools.length - read - edited - searched - ran
  if (read) parts.push(`read ${n(read, 'file')}`)
  if (edited) parts.push(`edited ${n(edited, 'file')}`)
  if (searched) parts.push(`searched ${searched === 1 ? 'once' : `${searched} times`}`)
  if (ran) parts.push(`ran ${n(ran, 'command')}`)
  if (other) parts.push(n(other, 'other step'))
  const line = parts.join(' · ')
  return line.charAt(0).toUpperCase() + line.slice(1)
}

/** Folded steps; a click opens the full list for anyone who wants it. */
function StepGroup({ tools }: { tools: ToolEvent[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-12">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-4 text-12 font-regular text-neutral-600 hover:text-ink-900 dark:hover:text-neutral-white"
      >
        <span>{stepsSummary(tools)}</span>
        <ChevronRightIcon className={`size-12 flex-none transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open ? (
        <div className="mt-4 border-l border-neutral-200 pl-8 dark:border-ink-700">
          {tools.map((t, i) => (
            <div key={i} className="mb-4 flex items-baseline gap-8">
              <span className="text-12 font-bold text-ink-900 dark:text-neutral-white">{t.tool}</span>
              <span className="truncate text-12 font-regular text-neutral-600">{t.detail}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Consecutive tool calls folded into one group between messages. */
function groupSteps(events: ChatEvent[]): (ChatEvent | ToolEvent[])[] {
  const out: (ChatEvent | ToolEvent[])[] = []
  for (const e of events) {
    const prev = out[out.length - 1]
    if (e.kind !== 'tool') out.push(e)
    else if (Array.isArray(prev)) prev.push(e)
    else out.push([e])
  }
  return out
}

/** One limit, as the footer shows it: "5h 23%", amber near the limit, red at it. */
function Limit({ label, report }: { label: string; report: LimitReport | null }) {
  const resets = report?.resetsAt
    ? `resets ${new Date(report.resetsAt).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`
    : null
  const value =
    report?.status === 'rejected' ? 'limit reached' : report?.percent !== null && report?.percent !== undefined ? `${report.percent}%` : report ? 'OK' : '—'
  const tone =
    report?.status === 'rejected' ? 'text-red-500' : report?.status === 'allowed_warning' ? 'text-orange-500' : ''
  return (
    <span className={tone} title={report ? [`${label} limit: ${value}`, resets].filter(Boolean).join(' · ') : `${label} usage shows after your next message`}>
      {label} {value}
    </span>
  )
}

/** The subscription's 5-hour and weekly limits (./usage.ts). */
function UsageMeter() {
  const usage = useUsage()
  return (
    <span className="flex flex-none items-center gap-4">
      <Limit label="5h" report={usage.fiveHour} />
      <span aria-hidden>·</span>
      <Limit label="Week" report={usage.weekly} />
    </span>
  )
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
  meter,
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
  /** Below the input — usage, or a replay's spend. */
  meter?: ReactNode
  /** Above the input, on the right — New chat. */
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
        {groupSteps(state.events).map((event, i) => {
          if (Array.isArray(event)) return <StepGroup key={i} tools={event} />
          switch (event.kind) {
            case 'user':
              return (
                <div key={i} className="mb-16 mt-4 rounded-12 bg-neutral-50 px-12 py-8 dark:bg-ink-800">
                  {event.images?.length ? (
                    <div className="mb-8 flex flex-wrap gap-8">
                      {event.images.map((src, j) => (
                        <Thumb key={j} src={src} small />
                      ))}
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-14 font-regular text-ink-900 dark:text-neutral-200">
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
              return null
          }
        })}

        {/* Like Claude's own apps: the mark loops under the last message for as
            long as the turn runs, beside what it is doing right now. */}
        {running && (
          <div role="status" className="mt-12 flex items-center gap-8">
            <LoaderMark className="size-24" />
            <span className="text-14 font-bold text-ink-900 dark:text-neutral-white">{activityFor(last)}</span>
            <span className="text-12 font-regular text-neutral-600">
              {clock(state.sinceLastEventMs)} on this step
            </span>
          </div>
        )}
      </div>

      {/* Embedded, the panel's card already pads the bottom — its own would double it. */}
      <footer className={`border-t border-neutral-200 pt-12 dark:border-ink-700 ${embedded ? '' : 'pb-12'} ${inset}`}>
        <div className="mb-8 flex items-center justify-between gap-8 text-12 font-regular text-neutral-600">
          <span>{running ? 'Working…' : state.status === 'done' ? doneLabel : 'Idle'}</span>
          {statusExtra}
        </div>
        {children}
        {meter ? <div className="mt-8 text-12 font-regular text-neutral-600">{meter}</div> : null}
      </footer>
    </div>
  )
}

/** A reference image's thumbnail — in the composer with an ✕, in the transcript without. */
function Thumb({ src, small, onRemove }: { src: string; small?: boolean; onRemove?: () => void }) {
  return (
    <span
      className={`relative flex-none overflow-hidden rounded-8 border border-neutral-200 bg-neutral-white dark:border-ink-700 ${
        small ? 'size-48' : 'size-64'
      }`}
    >
      {/* A data: URL made in the browser — nothing for next/image to optimise. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Reference image" className="h-full w-full object-cover" />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove image"
          title="Remove image"
          className="absolute left-4 top-4 flex size-20 items-center justify-center rounded-full bg-neutral-white text-ink-900 shadow-sm hover:bg-neutral-50"
        >
          <CloseIcon className="size-12" />
        </button>
      ) : null}
    </span>
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
      doneLabel="Done · saved, not live"
      meter={<span>${spendUsd.toFixed(2)}</span>}
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
 * Chat as the first tab of Edit mode's panel. It is about the current
 * selection — the pinned element — shown as a chip with an ✕ that deselects;
 * there is no separate pick. With nothing selected the message is about the
 * project as a whole.
 *
 * The conversation lives in useLiveChat's store, so this can mount and unmount
 * with the panel without losing a word, or a turn that is still running.
 */
export function LiveChatPanel({
  slug,
  screenId,
  pinned,
  onDeselect,
  tabs,
  onMinimize,
  className,
}: {
  slug: string
  screenId: string
  pinned: Element | null
  onDeselect: () => void
  tabs?: ReactNode
  onMinimize?: () => void
  className?: string
}) {
  const chat = useLiveChat(slug)
  const running = chat.status === 'running'
  const loaderVisible = useLoaderVisible(chat.gate === 'checking')
  const [imageError, setImageError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  const attachment = useMemo(
    () => (pinned ? attachmentFor(resolveTarget(pinned), slug, screenId) : null),
    [pinned, slug, screenId],
  )

  /** Pasted, dropped or picked files: the images among them, shrunk and
   *  attached, up to what one message can carry. */
  const attach = async (files: File[]) => {
    const picked = files.filter((f) => f.type.startsWith('image/'))
    if (!picked.length) return
    const room = MAX_IMAGES - chat.images.length
    const ready = (await Promise.all(picked.slice(0, Math.max(0, room)).map(prepareImage))).filter(
      (img): img is PendingImage => img !== null,
    )
    let total = chat.images.reduce((n, img) => n + img.image.data.length, 0)
    const fits = ready.filter((img) => (total += img.image.data.length) <= MAX_TOTAL_CHARS)
    if (fits.length) chat.addImages(fits)
    setImageError(
      picked.length > room
        ? `Up to ${MAX_IMAGES} images per message.`
        : fits.length < ready.length
          ? 'Those images are too large together — send fewer at once.'
          : ready.length < picked.length
            ? 'One of those files couldn’t be read as an image.'
            : null,
    )
  }

  const submit = () => {
    const draft = chat.draft.trim()
    if (!draft || running) return
    setImageError(null)
    if (attachment) {
      // The element goes to the agent in full; the transcript shows the chip.
      chat.send(`${attachment.context}\n\nChange: ${draft}`, `[${attachment.label}] ${draft}`)
    } else {
      chat.send(draft)
    }
  }

  const changed = chat.last?.changed.length ?? 0
  const subtitle = `Claude on ${chat.where === 'cloud' ? 'studio' : 'this laptop'} - working on ${slug}`
  const shell = (body: ReactNode) => (
    <aside className={`flex min-h-0 min-w-0 flex-1 flex-col ${className ?? ''}`}>
      <PanelHeader title="Chat" tabs={tabs} onMinimize={onMinimize} />
      {body}
    </aside>
  )

  // Reaching Claude takes a moment; the loader fills the panel so it sits in
  // the middle of the chat window rather than at the top of an empty transcript.
  // A quick connect shows a blank panel instead of a flash of loader.
  if (loaderVisible) return shell(<ChatLoader label="Connecting to Claude…" />)
  if (chat.gate === 'checking') return shell(null)

  if (chat.gate !== 'open') {
    return shell(
      <ChatView subtitle={subtitle} state={chat} doneLabel="" embedded>
        {chat.gate === 'unavailable' ? (
          <p className="text-12 font-regular text-neutral-600">
            Chat only runs on the laptop that&rsquo;s running the studio — open it at
            localhost:4000 there.
          </p>
        ) : chat.gate === 'no-cli' || chat.gate === 'signed-out' ? (
          <SignInHelp missing={chat.gate === 'no-cli'} onRecheck={chat.recheck} />
        ) : chat.gate === 'error' ? (
          <div>
            <p className="mb-8 text-12 font-regular text-neutral-600">
              Couldn&rsquo;t reach chat just now. Check your connection, then try again.
            </p>
            <button type="button" onClick={chat.recheck} className={buttonClass}>
              Try again
            </button>
          </div>
        ) : (
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
            className="font-bold text-ink-900 dark:text-neutral-white hover:underline"
          >
            New chat
          </button>
        ) : null
      }
      meter={<UsageMeter />}
      doneLabel={
        chat.last?.error
          ? 'Stopped'
          : `${changed} file${changed === 1 ? '' : 's'} changed · ${
              chat.last?.notSaved?.length ? 'not saved' : isActiveDbProject(slug) ? 'saved, live' : 'saved, not live'
            }`
      }
    >
      {/* One box, as in Claude and Airship: the selection's chip, the message,
          and the send button inside it. ⌘↵ sends; Enter is a new line — a
          change request is often a few lines, and a stray Enter shouldn't
          spend a turn. */}
      <div
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          setDragging(false)
          void attach([...e.dataTransfer.files])
        }}
        className={`flex flex-col gap-8 rounded-12 border bg-neutral-white p-8 focus-within:border-primary-500 dark:bg-ink-800 ${
          dragging ? 'border-primary-500' : 'border-neutral-200 dark:border-ink-700'
        }`}
      >
        {chat.images.length ? (
          <div className="flex flex-wrap gap-8">
            {chat.images.map((img) => (
              <Thumb key={img.id} src={img.thumb} onRemove={() => chat.removeImage(img.id)} />
            ))}
          </div>
        ) : null}
        {attachment ? (
          // Quiet on purpose: the selection is context, not the message — a
          // neutral chip, capped to the box so a long label truncates instead
          // of pushing the panel wider.
          <span
            title={attachment.label}
            className="flex min-w-0 max-w-full items-center gap-8 self-start rounded-8 border border-neutral-200 bg-neutral-50 py-4 pl-8 pr-4 text-12 text-neutral-700 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-200"
          >
            <CursorIcon className="size-12 flex-none text-caption dark:text-neutral-400" />
            <span className="min-w-0 truncate">{attachment.label}</span>
            <button
              type="button"
              onClick={onDeselect}
              aria-label="Deselect the element"
              title="Deselect — the message will be about the project"
              className="flex size-20 flex-none items-center justify-center rounded-4 text-caption hover:bg-neutral-200 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-50"
            >
              <CloseIcon className="size-12" />
            </button>
          </span>
        ) : null}
        <textarea
          value={chat.draft}
          onChange={(e) => chat.setDraft(e.target.value)}
          onPaste={(e) => {
            // A screenshot or a frame copied from Figma arrives as a file; text
            // pastes as usual.
            const files = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/'))
            if (!files.length) return
            e.preventDefault()
            void attach(files)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          rows={2}
          aria-label="Message"
          placeholder={
            attachment
              ? 'What should change about it?'
              : chat.images.length
                ? 'What should it take from the image?'
                : 'Describe the change, or click an element first'
          }
          className="w-full resize-none bg-transparent text-14 font-regular text-ink-900 outline-none placeholder:text-neutral-400 dark:text-neutral-white"
        />
        {imageError ? <p className="text-12 font-regular text-red-500">{imageError}</p> : null}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => picker.current?.click()}
            disabled={chat.images.length >= MAX_IMAGES}
            aria-label="Attach images"
            title="Attach images — or paste or drop them here"
            className="flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-50"
          >
            <MediaIcon className="size-16" />
          </button>
          <input
            ref={picker}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void attach([...(e.target.files ?? [])])
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={running ? chat.stop : submit}
            disabled={!running && !chat.draft.trim()}
            aria-label={running ? 'Stop' : 'Send'}
            title={running ? 'Stop this turn' : 'Send (⌘↵)'}
            className="flex h-32 min-w-32 flex-none items-center justify-center rounded-8 bg-primary-500 px-8 text-14 font-bold text-neutral-white hover:bg-primary-600 disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-ink-700"
          >
            {/* The shortcut IS the label: it says how to send without a hint beside it. */}
            {running ? <StopIcon className="size-16" /> : '⌘↵'}
          </button>
        </div>
      </div>
    </ChatView>,
  )
}

/** The design-mode editing password — one password unlocks both. */
/** Chat is the designer's own Claude Code, so fixing this happens in their
 *  terminal — the one place they already use it. */
function SignInHelp({ missing, onRecheck }: { missing: boolean; onRecheck: () => void }) {
  return (
    <div>
      <p className="mb-8 text-12 font-regular text-neutral-600">
        {missing
          ? 'Chat uses Claude Code on this laptop, and it isn’t installed here yet.'
          : 'Chat uses your Claude Code, and it isn’t signed in. Open your terminal, type claude, and log in — then come back here.'}
      </p>
      <button type="button" onClick={onRecheck} className={buttonClass}>
        Check again
      </button>
    </div>
  )
}

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
        {error ?? 'Chat drives Claude on the laptop running the studio, so from here it needs the editing password.'}
      </p>
      <button type="submit" disabled={!value || busy} className={buttonClass}>
        Unlock
      </button>
    </form>
  )
}
