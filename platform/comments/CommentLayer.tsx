'use client'

// =============================================================================
// Comments · the pins. Mounted inside the device screen while Comment is on,
// so it sits over exactly the app and nothing else; the thread each pin opens
// is portalled out to the page, so it reads at a normal size however far the
// canvas is zoomed out (and so the screen's 44px clip can't cut it off).
//
// A pin is stored in the screen's scrolled-content coordinates (see
// protocol.ts), so the layer follows the screen's scroller: a pin on the fifth
// card of a long list stays on the fifth card. Anything in a pinned top bar
// scrolls with the page — the price of one coordinate space, and rarely where
// review feedback lands.
// =============================================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFlow } from '@/platform/runtime'
import { CheckCircleIcon, CloseIcon, MoreIcon } from '@/platform/chrome/icons'
import type { Comment } from './protocol'
import {
  editComment,
  getCommenterName,
  numberOf,
  openComment,
  postComment,
  removeComment,
  resolveComment,
  setCommenterName,
  setCommentMode,
  startDraft,
  useComments,
  type Draft,
} from './store'

/** The screen's scroller — the runtime marks it (platform/runtime ScreenStage). */
const scrollerIn = (el: Element | null) => el?.parentElement?.querySelector<HTMLElement>('[data-screen-scroller]') ?? null

/** How far the device is scaled on the canvas: its drawn width over its own. */
const scaleOf = (el: HTMLElement) => (el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1)

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function CommentLayer() {
  const { current } = useFlow()
  const { comments, openId, draft, showResolved } = useComments()
  const ref = useRef<HTMLDivElement>(null)
  // The scroller's offset under the layer and how far it has scrolled, in
  // device pixels; kept in state so pins re-render as the page scrolls.
  const [frame, setFrame] = useState({ top: 0, scroll: 0, scale: 1, width: 0 })

  const measure = useCallback(() => {
    const layer = ref.current
    const scroller = scrollerIn(layer)
    if (!layer || !scroller) return
    const scale = scaleOf(layer)
    const top = (scroller.getBoundingClientRect().top - layer.getBoundingClientRect().top) / scale
    const width = layer.offsetWidth
    setFrame((f) =>
      f.top === top && f.scroll === scroller.scrollTop && f.scale === scale && f.width === width
        ? f
        : { top, scroll: scroller.scrollTop, scale, width },
    )
  }, [])

  // Screens remount on navigation, so the scroller is found again per screen.
  useLayoutEffect(() => {
    measure()
    const scroller = scrollerIn(ref.current)
    scroller?.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    if (ref.current) ro.observe(ref.current)
    window.addEventListener('resize', measure)
    return () => {
      scroller?.removeEventListener('scroll', measure)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [current, measure])

  // Esc backs out one step: the open thread first, then Comment itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT') return
      if (openId) openComment(null)
      else setCommentMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId])

  const onClick = (e: React.MouseEvent) => {
    const layer = ref.current
    if (!layer) return
    // A click away from an open thread closes it, like Figma, rather than
    // starting another comment on top of it.
    if (openId) return openComment(null)
    const box = layer.getBoundingClientRect()
    const x = (e.clientX - box.left) / frame.scale
    const y = (e.clientY - box.top) / frame.scale - frame.top + frame.scroll
    if (y < 0) return
    startDraft({ screenId: current, x, y })
  }

  // The layer takes the device's clicks, so the scroll wheel has to be handed
  // on to the screen underneath. Pinch and ⌘-scroll carry on up to the canvas.
  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return
    scrollerIn(ref.current)?.scrollBy({ left: e.deltaX, top: e.deltaY })
  }

  const visible = comments.filter((c) => c.screenId === current && (showResolved || !c.resolved || c.id === openId))
  const counter = 1 / frame.scale
  // A pin grows up and to the right of its spot; near the screen's right or
  // top edge it would be clipped, so it grows the other way there instead.
  const reach = PIN_PX * counter
  const flip = (at: { x: number; y: number }) => ({
    left: frame.width > 0 && at.x + reach > frame.width,
    down: frame.top - frame.scroll + at.y - reach < 0,
  })

  return (
    <div
      ref={ref}
      onClick={onClick}
      onWheel={onWheel}
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ cursor: 'crosshair' }}
    >
      <div className="absolute left-0" style={{ top: frame.top - frame.scroll }}>
        {visible.map((c) => (
          <Pin
            key={c.id}
            at={c}
            counter={counter}
            flip={flip(c)}
            active={openId === c.id}
            muted={c.resolved}
            label={initials(c.author)}
            title={`#${numberOf(comments, c.id)} · ${c.author}`}
            onOpen={() => openComment(openId === c.id ? null : c.id)}
          >
            {openId === c.id ? <Thread comment={c} number={numberOf(comments, c.id)} /> : null}
          </Pin>
        ))}
        {draft && draft.screenId === current && openId === 'draft' ? (
          <Pin at={draft} counter={counter} flip={flip(draft)} active label="+" title="New comment" onOpen={() => openComment(null)}>
            <Composer draft={draft} />
          </Pin>
        ) : null}
      </div>
    </div>
  )
}

/** A pin whose bottom-left corner is the spot it points at — the Figma shape —
 *  held at the same on-screen size whatever the canvas zoom. */
const PIN_PX = 32

/** The pin's sharp corner — the one on the spot — for each way it can grow. */
const POINT: Record<string, string> = {
  ru: 'rounded-bl-none',
  lu: 'rounded-br-none',
  rd: 'rounded-tl-none',
  ld: 'rounded-tr-none',
}

function Pin({
  at,
  counter,
  flip,
  active,
  muted,
  label,
  title,
  onOpen,
  children,
}: {
  at: { x: number; y: number }
  counter: number
  flip: { left: boolean; down: boolean }
  active: boolean
  muted?: boolean
  label: string
  title: string
  onOpen: () => void
  children?: ReactNode
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const tone = active
    ? 'bg-blue-500 text-neutral-white'
    : muted
      ? 'bg-neutral-500 text-neutral-white'
      : 'bg-ink-900 text-neutral-white'
  return (
    <div
      className="absolute"
      style={{
        left: at.x,
        top: at.y,
        transform: `scale(${counter}) translate(${flip.left ? '-100%' : '0'}, ${flip.down ? '0' : '-100%'})`,
        transformOrigin: 'top left',
      }}
    >
      <button
        ref={ref}
        type="button"
        title={title}
        onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}
        className={`flex size-32 items-center justify-center rounded-full ${POINT[`${flip.left ? 'l' : 'r'}${flip.down ? 'd' : 'u'}`]} border-2 border-neutral-white text-12 font-bold shadow-lg ${tone}`}
      >
        {label}
      </button>
      {children ? <Popover anchor={ref}>{children}</Popover> : null}
    </div>
  )
}

/** The thread card, beside its pin, in page coordinates. Follows the pin every
 *  frame while open — the canvas pans and zooms, the screen scrolls — which is
 *  one rect read per frame for the one card that is showing. */
function Popover({ anchor, children }: { anchor: React.RefObject<HTMLElement | null>; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    let raf = 0
    const place = () => {
      const pin = anchor.current?.getBoundingClientRect()
      const card = ref.current
      if (pin && card) {
        const w = card.offsetWidth
        const h = card.offsetHeight
        const gap = 8
        let left = pin.right + gap
        if (left + w > window.innerWidth - gap) left = pin.left - w - gap
        const top = Math.min(Math.max(gap, pin.top), window.innerHeight - h - gap)
        card.style.transform = `translate(${Math.round(Math.max(gap, left))}px, ${Math.round(top)}px)`
        card.style.visibility = 'visible'
      }
      raf = requestAnimationFrame(place)
    }
    place()
    return () => cancelAnimationFrame(raf)
  }, [anchor])

  return createPortal(
    <div
      ref={ref}
      // Portalled, but React still bubbles its events to the layer — which
      // would read a click inside the card as a click on the screen.
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className="fixed left-0 top-0 z-50 w-280 rounded-12 border border-default bg-neutral-white p-12 shadow-lg dark:border-ink-700 dark:bg-ink-900"
      style={{ visibility: 'hidden', cursor: 'auto' }}
    >
      {children}
    </div>,
    document.body,
  )
}

const FIELD =
  'w-full rounded-8 border border-default bg-neutral-white px-12 py-8 text-14 text-default outline-none placeholder:text-placeholder focus:border-neutral-600 dark:border-ink-700 dark:bg-ink-950 dark:text-neutral-50 dark:focus:border-neutral-500'
const PRIMARY =
  'rounded-full bg-ink-900 px-16 py-4 text-12 font-bold text-neutral-white hover:bg-ink-800 disabled:opacity-50 dark:bg-neutral-white dark:text-ink-900 dark:hover:bg-neutral-200'
const GHOST =
  'rounded-full px-12 py-4 text-12 font-bold text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'
const ICON_BTN =
  'flex size-24 flex-none items-center justify-center rounded-full text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'

/** ⌘/Ctrl-Enter sends, as in every comment box people already know. */
const submitOn = (send: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    send()
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    openComment(null)
  }
}

function ErrorLine() {
  const { error } = useComments()
  return error ? <p className="text-12 text-red-500">{error}</p> : null
}

function Composer({ draft }: { draft: Draft }) {
  const [name, setName] = useState(getCommenterName)
  const [askName, setAskName] = useState(() => !getCommenterName())
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = body.trim() && name.trim() && !busy

  const send = async () => {
    if (!ready) return
    setBusy(true)
    setCommenterName(name)
    await postComment({ ...draft, body, author: name.trim() })
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-8">
      {askName ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={submitOn(send)}
          placeholder="Your name"
          maxLength={60}
          className={FIELD}
        />
      ) : null}
      <textarea
        autoFocus={!askName}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={submitOn(send)}
        placeholder="Add a comment"
        rows={3}
        maxLength={2000}
        className={`${FIELD} resize-none`}
      />
      <ErrorLine />
      <div className="flex items-center justify-between gap-8">
        {askName ? (
          <span className="truncate text-12 text-caption dark:text-neutral-400">Shown with your comments</span>
        ) : (
          <button
            type="button"
            onClick={() => setAskName(true)}
            title="Change your name"
            className="min-w-0 truncate text-left text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
          >
            As {name} · <span className="underline">Change</span>
          </button>
        )}
        <div className="flex gap-4">
          <button type="button" onClick={() => openComment(null)} className={GHOST}>
            Cancel
          </button>
          <button type="button" onClick={send} disabled={!ready} className={PRIMARY}>
            Post
          </button>
        </div>
      </div>
    </div>
  )
}

function Thread({ comment, number }: { comment: Comment; number: number }) {
  const [editing, setEditing] = useState(false)
  const [menu, setMenu] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [body, setBody] = useState(comment.body)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!body.trim() || busy) return
    setBusy(true)
    if (await editComment(comment.id, body)) setEditing(false)
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Number and time, then ··· · resolve · close — with a rule under it,
          full width. */}
      <div className="-mx-12 flex items-center gap-4 border-b border-default px-12 pb-8 dark:border-ink-700">
        <span className="min-w-0 flex-1 truncate text-12 text-caption dark:text-neutral-400">
          #{number} · {ago(comment.createdAt)}
          {comment.editedAt ? ' · edited' : ''}
        </span>
        {comment.mine ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              title="More"
              aria-label="More"
              className={ICON_BTN}
            >
              <MoreIcon className="size-16" />
            </button>
            {menu ? (
              <div className="absolute right-0 top-24 z-10 flex w-120 flex-col rounded-8 border border-default bg-neutral-white p-4 shadow-lg dark:border-ink-700 dark:bg-ink-900">
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false)
                    setBody(comment.body)
                    setEditing(true)
                  }}
                  className="rounded-4 px-8 py-4 text-left text-14 text-default hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-ink-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false)
                    setConfirming(true)
                  }}
                  className="rounded-4 px-8 py-4 text-left text-14 text-red-500 hover:bg-red-50 dark:hover:bg-ink-800"
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => resolveComment(comment.id, !comment.resolved)}
          title={comment.resolved ? 'Reopen' : 'Resolve'}
          aria-label={comment.resolved ? 'Reopen' : 'Resolve'}
          className={comment.resolved ? `${ICON_BTN} bg-green-50 text-green-500 dark:bg-ink-800` : ICON_BTN}
        >
          <CheckCircleIcon className="size-16" />
        </button>
        <button type="button" onClick={() => openComment(null)} title="Close" aria-label="Close" className={ICON_BTN}>
          <CloseIcon className="size-16" />
        </button>
      </div>

      {editing ? (
        <>
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                setEditing(false)
              } else submitOn(save)(e)
            }}
            rows={3}
            maxLength={2000}
            className={`${FIELD} resize-none`}
          />
          <ErrorLine />
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setEditing(false)} className={GHOST}>
              Cancel
            </button>
            <button type="button" onClick={save} disabled={!body.trim() || busy} className={PRIMARY}>
              Save
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="whitespace-pre-wrap break-words text-14 text-default dark:text-neutral-50">{comment.body}</p>
          <span className="truncate text-12 font-bold text-caption dark:text-neutral-400">{comment.author}</span>
        </div>
      )}

      {confirming ? (
        <div className="flex items-center justify-between gap-8 rounded-8 bg-red-50 px-8 py-4 dark:bg-ink-800">
          <span className="text-12 text-red-500">Delete this comment?</span>
          <div className="flex gap-4">
            <button type="button" onClick={() => setConfirming(false)} className={GHOST}>
              Keep
            </button>
            <button
              type="button"
              onClick={() => removeComment(comment.id)}
              className="rounded-full bg-red-500 px-12 py-4 text-12 font-bold text-neutral-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
      {!editing ? <ErrorLine /> : null}
    </div>
  )
}
