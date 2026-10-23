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

import { useEffect, useMemo, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  AttachIcon,
  CloseIcon,
  CursorIcon,
  DocumentIcon,
  FigmaIcon,
  FrameIcon,
  StopIcon,
} from '@/platform/chrome/icons'
import { PanelHeader } from '@/platform/chrome/SidePanel'
import { resolveTarget } from '@/platform/inspect/resolve'
import { attachmentFor, type ChatAttachment } from './attach'
import { MAX_FIGMA_LINKS, isFigmaLink, parseFigmaUrl } from './figmaLink'
import { ChatLoader, LoaderMark, useLoaderVisible } from './ChatLoader'
import {
  MAX_DOCUMENTS,
  MAX_IMAGES,
  MAX_LAPTOP_DOCUMENT_CHARS,
  MAX_LAPTOP_TOTAL_CHARS,
  MAX_TOTAL_CHARS,
  isPdf,
  prepareDocument,
  prepareImage,
  type PendingDocument,
  type PendingImage,
} from './images'
import type { RecordedTurn, TranscriptEvent } from './transcript'
import { useTranscriptReplay } from './useTranscriptReplay'
import { useLiveChat } from './useLiveChat'
import { useUsage, type LimitReport } from './usage'
import type { Effort } from './effort'
import { Markdown } from './Markdown'
import { isActiveDbProject } from '@/platform/dbProjects/active'
import { screenError } from '@/platform/runtime/screenError'

const SPEEDS = [1, 4, 16] as const

export type ChatEvent =
  | TranscriptEvent
  | { at: number; kind: 'user'; text: string; images?: string[]; documents?: string[]; figma?: string[] }
  | { at: number; kind: 'error'; text: string }
  /** The panel's own word, between turns — "carrying on". */
  | { at: number; kind: 'note'; text: string }

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
  if (event.kind === 'note') return 'Carrying on'
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
    case 'Prototype':
      return `Looking at ${event.detail.split(' · ')[0]}`
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
                  {event.documents?.length ? (
                    <div className="mb-8 flex flex-col gap-4">
                      {event.documents.map((name, j) => (
                        <Chip key={j} icon={<DocumentIcon className="size-12" />} label={name} />
                      ))}
                    </div>
                  ) : null}
                  {event.figma?.length ? (
                    <div className="mb-8 flex flex-col gap-4">
                      {event.figma.map((label, j) => (
                        <Chip key={j} icon={<FigmaIcon className="size-12" />} label={label} />
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
                <Markdown
                  key={i}
                  text={event.text}
                  className="mb-12 text-14 font-regular text-ink-900 dark:text-neutral-white"
                />
              )
            case 'error':
              return (
                <p key={i} className="mb-12 rounded-12 bg-red-50 px-12 py-8 text-12 font-regular text-red-500">
                  {event.text}
                </p>
              )
            case 'note':
              return (
                <p key={i} className="mb-12 text-12 font-regular text-neutral-600">
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
            <LoaderMark className="size-20" />
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

/** The one ✕ every attachment uses — the selection, a Figma link, an image,
 *  a PDF. */
function RemoveButton({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-20 flex-none items-center justify-center rounded-4 text-caption hover:bg-neutral-200 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-50 ${className}`}
    >
      <CloseIcon className="size-12" />
    </button>
  )
}

/** What goes with a message besides its words — the selection, a Figma link.
 *  Quiet on purpose: context, not the message — a neutral chip, capped to the
 *  box so a long label truncates instead of pushing the panel wider. */
function Chip({
  icon,
  label,
  title,
  onRemove,
  removeLabel,
}: {
  icon: ReactNode
  label: string
  title?: string
  onRemove?: () => void
  removeLabel?: string
}) {
  return (
    <span
      title={title ?? label}
      className={`flex min-w-0 max-w-full items-center gap-8 self-start rounded-8 border border-neutral-200 bg-neutral-50 py-4 pl-8 text-12 text-neutral-700 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-200 ${
        onRemove ? 'pr-4' : 'pr-8'
      }`}
    >
      <span className="flex-none text-caption dark:text-neutral-400">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
      {onRemove ? <RemoveButton label={removeLabel ?? 'Remove'} onClick={onRemove} /> : null}
    </span>
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
        // The chip's ✕, on the chip's surface so it reads over any image.
        <RemoveButton
          label="Remove image"
          onClick={onRemove}
          className="absolute right-4 top-4 border border-neutral-200 bg-neutral-50 dark:border-ink-700 dark:bg-ink-900"
        />
      ) : null}
    </span>
  )
}

const FIELD_TEXT = 'whitespace-pre-wrap break-words text-14 font-regular text-ink-900 dark:text-neutral-white'

/** The message field. It grows with its text — a pasted brief shows, not two
 *  lines of it — up to max-h-240, then scrolls, and shrinks back once sent. An
 *  invisible copy of the text in the same grid cell sets the height, so nothing
 *  is measured and the transcript never jumps while typing. */
function GrowingField({ value, ...field }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  return (
    <div className="grid grid-cols-1">
      {/* The trailing space gives a final empty line its height. */}
      <div aria-hidden className={`invisible col-start-1 row-start-1 max-h-240 overflow-hidden ${FIELD_TEXT}`}>
        {`${value} `}
      </div>
      <textarea
        {...field}
        value={value}
        rows={2}
        className={`col-start-1 row-start-1 w-full resize-none overflow-y-auto bg-transparent outline-none placeholder:text-neutral-400 ${FIELD_TEXT}`}
      />
    </div>
  )
}

const EFFORT_CHOICES: { id: Effort; label: string; note: string }[] = [
  { id: 'medium', label: 'Medium', note: 'Quicker, and uses less of your Claude limit' },
  { id: 'high', label: 'High', note: 'Thinks longer — better for new screens and multi-step changes' },
]

/** How long Claude thinks on the next message (./effort.ts): the level and a
 *  chevron, quiet beside the image button, and a menu above it that says what
 *  each level is for. */
function EffortMenu({ value, onChange }: { value: Effort; onChange: (effort: Effort) => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const current = EFFORT_CHOICES.find((c) => c.id === value) ?? EFFORT_CHOICES[1]
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Effort: ${current.label}`}
        title="Effort — how long Claude thinks on your next message"
        onClick={() => setOpen((o) => !o)}
        className="flex h-32 items-center gap-4 rounded-8 px-8 text-12 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-50"
      >
        {current.label}
        <ChevronDownIcon className="size-12" />
      </button>
      {/* Opens upward: the composer sits at the bottom of the panel. */}
      {open ? (
        <div className="absolute bottom-full left-0 z-10 mb-4 flex w-240 flex-col rounded-12 border border-default bg-neutral-white p-4 shadow-sm dark:border-ink-700 dark:bg-ink-900">
          {EFFORT_CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={value === c.id}
              onClick={() => {
                onChange(c.id)
                setOpen(false)
              }}
              className="flex items-start gap-8 rounded-8 p-8 text-left hover:bg-neutral-50 dark:hover:bg-ink-800"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-14 font-bold text-default dark:text-neutral-50">{c.label}</span>
                <span className="text-12 text-caption dark:text-neutral-400">{c.note}</span>
              </span>
              {value === c.id ? <CheckIcon className="size-16 flex-none text-primary-500" /> : null}
            </button>
          ))}
        </div>
      ) : null}
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
  selection,
  select,
  tabs,
  onMinimize,
  className,
}: {
  slug: string
  screenId: string
  pinned: Element | null
  onDeselect: () => void
  /** A selection made away from the device — a whole screen, in the flow view.
   *  Passing it (null included) also says elements can't be clicked here. */
  selection?: ChatAttachment | null
  /** Whether a click on the device selects an element to ask about, or taps
   *  through the prototype — the switch beside Attach. */
  select?: { on: boolean; onToggle: () => void }
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
    () => (pinned ? attachmentFor(resolveTarget(pinned), slug, screenId) : (selection ?? null)),
    [pinned, slug, screenId, selection],
  )

  /** Pasted, dropped or picked files: the images among them, shrunk, and the
   *  PDFs, attached up to what one message can carry — on the hosted Chat the
   *  deployment's request cap, shared by both; on the laptop, the model's. */
  const attach = async (files: File[]) => {
    const pictures = files.filter((f) => f.type.startsWith('image/'))
    const pdfs = files.filter(isPdf)
    if (!pictures.length && !pdfs.length) {
      if (files.length) setImageError('Attach images or PDFs.')
      return
    }
    const imageRoom = MAX_IMAGES - chat.images.length
    const docRoom = MAX_DOCUMENTS - chat.documents.length
    const [images, documents] = await Promise.all([
      Promise.all(pictures.slice(0, Math.max(0, imageRoom)).map(prepareImage)),
      Promise.all(pdfs.slice(0, Math.max(0, docRoom)).map(prepareDocument)),
    ])
    const readyImages = images.filter((img): img is PendingImage => img !== null)
    const readyDocs = documents.filter((doc): doc is PendingDocument => doc !== null)

    const laptop = chat.where === 'laptop'
    const totalCap = laptop ? MAX_LAPTOP_TOTAL_CHARS : MAX_TOTAL_CHARS
    const eachDocCap = laptop ? MAX_LAPTOP_DOCUMENT_CHARS : MAX_TOTAL_CHARS
    let total =
      chat.images.reduce((n, img) => n + img.image.data.length, 0) +
      chat.documents.reduce((n, doc) => n + doc.document.data.length, 0)
    // Each one is taken if it still fits beside what's already attached.
    const fits = (size: number) => {
      if (total + size > totalCap) return false
      total += size
      return true
    }
    const fitImages = readyImages.filter((img) => fits(img.image.data.length))
    const tooBig = readyDocs.find((doc) => doc.document.data.length > eachDocCap)
    const fitDocs = readyDocs.filter((doc) => doc.document.data.length <= eachDocCap && fits(doc.document.data.length))
    if (fitImages.length) chat.addImages(fitImages)
    if (fitDocs.length) chat.addDocuments(fitDocs)

    setImageError(
      pictures.length > imageRoom
        ? `Up to ${MAX_IMAGES} images per message.`
        : pdfs.length > docRoom
          ? `Up to ${MAX_DOCUMENTS} PDFs per message.`
          : tooBig
            ? laptop
              ? `${tooBig.document.name} is over 20 MB — too large to send.`
              : `${tooBig.document.name} is too large for Chat here — under 3 MB works, or use Chat on your laptop.`
            : fitImages.length < readyImages.length || fitDocs.length < readyDocs.length
              ? 'Those attachments are too large together — send fewer at once.'
              : readyImages.length < Math.min(pictures.length, imageRoom) || readyDocs.length < Math.min(pdfs.length, docRoom)
                ? 'One of those files couldn’t be read.'
                : null,
    )
  }

  const submit = () => {
    const draft = chat.draft.trim()
    if (!draft || running) return
    setImageError(null)
    // Every message says which screen is open, and what it shows if it threw,
    // so a turn starts there instead of searching for it.
    const view = { screen: screenId, screenError: screenError(screenId) }
    if (attachment) {
      // The element goes to the agent in full; the transcript shows the chip.
      chat.send(`${attachment.context}\n\nChange: ${draft}`, `[${attachment.label}] ${draft}`, view)
    } else {
      chat.send(draft, undefined, view)
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
        {chat.documents.map((d) => (
          <Chip
            key={d.id}
            icon={<DocumentIcon className="size-12" />}
            label={d.document.name}
            onRemove={() => chat.removeDocument(d.id)}
            removeLabel="Remove the PDF"
          />
        ))}
        {chat.figma.map((f) => (
          <Chip
            key={f.id}
            icon={<FigmaIcon className="size-12" />}
            label={f.label}
            title={f.url}
            onRemove={() => chat.removeFigma(f.id)}
            removeLabel="Remove the Figma link"
          />
        ))}
        {attachment ? (
          <Chip
            icon={pinned ? <CursorIcon className="size-12" /> : <FrameIcon className="size-12" />}
            label={attachment.label}
            onRemove={onDeselect}
            removeLabel="Deselect — the message will be about the project"
          />
        ) : null}
        <GrowingField
          value={chat.draft}
          onChange={(e) => chat.setDraft(e.target.value)}
          onPaste={(e) => {
            // A Figma link on its own becomes a chip, like the selection.
            const pasted = e.clipboardData.getData('text/plain')
            if (isFigmaLink(pasted)) {
              e.preventDefault()
              if (!parseFigmaUrl(pasted)) {
                setImageError('That link is to the whole Figma file — right-click a frame → Copy link to selection.')
              } else if (chat.figma.length >= MAX_FIGMA_LINKS) {
                setImageError(`Up to ${MAX_FIGMA_LINKS} Figma links per message.`)
              } else {
                setImageError(null)
                chat.addFigma(pasted.trim())
              }
              return
            }
            // A screenshot or a frame copied from Figma arrives as a file; text
            // pastes as usual.
            const files = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/') || isPdf(f))
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
          aria-label="Message"
          placeholder={
            attachment
              ? 'What should change about it?'
              : chat.documents.length
                ? 'What should it take from the PDF?'
                : chat.images.length
                  ? 'What should it take from the image?'
                  : selection !== undefined
                    ? 'Describe the change, or click a screen first'
                    : 'Describe the change, or ⌘+click an element first'
          }
        />
        {imageError ? <p className="text-12 font-regular text-red-500">{imageError}</p> : null}
        {/* Wraps rather than squeezes in a narrow panel. */}
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => picker.current?.click()}
              disabled={chat.images.length >= MAX_IMAGES && chat.documents.length >= MAX_DOCUMENTS}
              aria-label="Attach images or PDFs"
              title="Attach images or PDFs — or paste or drop them here"
              className="flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-50"
            >
              <AttachIcon className="size-16" />
            </button>
            {select ? (
              <button
                type="button"
                onClick={select.onToggle}
                aria-pressed={select.on}
                aria-label="Select elements"
                title={select.on ? 'Selecting — click to stop' : '⌘+click to select an element into chat'}
                className={`flex size-32 flex-none items-center justify-center rounded-8 ${
                  select.on
                    ? 'bg-primary-50 text-primary-500 dark:bg-ink-700 dark:text-neutral-50'
                    : 'text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-50'
                }`}
              >
                <CursorIcon className="size-16" />
              </button>
            ) : null}
            <input
              ref={picker}
              type="file"
              accept="image/*,application/pdf,.pdf"
              multiple
              hidden
              onChange={(e) => {
                void attach([...(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
            {chat.canSetEffort ? <EffortMenu value={chat.effort} onChange={chat.setEffort} /> : null}
          </div>
          {/* Usage sits with Send, so the field's own edge stays clean. */}
          <div className="ml-auto flex items-center gap-8">
            <span className="text-12 font-regular text-neutral-600">
              <UsageMeter />
            </span>
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
