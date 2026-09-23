'use client'

// =============================================================================
// Inspect · the reading panel — Edit mode's CSS tab.
//
// Laid out after Airship's CSS pane (github.com/0xnyn/airship): where it came
// from, the box model, then collapsible blocks — so the answer to "why is
// there a gap here" is a picture at the top, not a list to read.
//
// Order is deliberate: what the thing IS and where it lives; its box; the
// tokens it resolves to (the studio's own addition — Airship has no design
// system to map back to); the classes it was written with, which are the text
// an engineer would actually type; then everything else the browser computed,
// grouped and cut down to what this element actually asked for.
// =============================================================================

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { PanelShell } from '@/platform/chrome/SidePanel'
import { ChevronRightIcon } from '@/platform/chrome/icons'
import { boxModel, computedGroups, type BoxModel, type Sides } from './computed'
import { ancestorChain, labelOf, resolveTarget } from './resolve'
import { copyForAgent } from './copyForAgent'
import { getChat, getChatServerSnapshot, subscribeChat } from '@/platform/runtime/chatBridge'
import { setEditTab } from '@/platform/runtime/designBridge'
import { copySpec } from './copySpec'

export interface InspectorPanelProps {
  pinned: Element | null
  onPin: (el: Element | null) => void
  slug: string
  screenId: string
  /** The annotations column geometry, handed down by the prototype view. */
  className?: string
  onMinimize?: () => void
  /** The Edit mode's tabs, drawn in this panel's header. */
  tabs?: React.ReactNode
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">
      {children}
    </span>
  )
}

/**
 * One collapsible block of the panel — a heading row that opens and closes
 * it, divided from the next by a hairline. `count` says how much is inside
 * while it's closed, so a shut block isn't a guess.
 */
function Block({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string
  count?: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col border-t border-default dark:border-ink-700">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex h-40 items-center justify-between gap-8 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
      >
        <span className="flex items-center gap-8">
          <Heading>{title}</Heading>
          {count != null && !open ? (
            <span className="text-10 text-placeholder dark:text-neutral-600">{count}</span>
          ) : null}
        </span>
        <ChevronRightIcon className={`size-12 flex-none ${open ? 'rotate-90' : ''}`} />
      </button>
      {open ? <div className="flex flex-col gap-2 pb-12">{children}</div> : null}
    </div>
  )
}

/** Open/closed per block, kept across pins — the reader's layout, not the element's. */
function useBlocks(initial: Record<string, boolean>) {
  const [open, setOpen] = useState(initial)
  return {
    isOpen: (id: string) => open[id] ?? false,
    toggle: (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] })),
  }
}

/** A side's number: a dash for zero, since the interesting thing about a box
 *  model is where the non-zero numbers are. */
const num = (n: number) => (n === 0 ? '–' : String(n))

/** The four numbers around a ring, each on the edge it belongs to. */
function SideValues({ sides }: { sides: Sides }) {
  const [t, r, b, l] = sides
  const cell = 'absolute text-10 text-default dark:text-neutral-50'
  return (
    <>
      <span className={`${cell} left-1/2 top-2 -translate-x-1/2`}>{num(t)}</span>
      <span className={`${cell} right-8 top-1/2 -translate-y-1/2`}>{num(r)}</span>
      <span className={`${cell} bottom-2 left-1/2 -translate-x-1/2`}>{num(b)}</span>
      <span className={`${cell} left-8 top-1/2 -translate-y-1/2`}>{num(l)}</span>
    </>
  )
}

function Ring({
  label,
  sides,
  tone,
  children,
}: {
  label: string
  sides: Sides
  tone: string
  children: React.ReactNode
}) {
  return (
    <div className={`relative rounded-4 border border-dashed px-24 py-20 ${tone}`}>
      <span className="absolute left-4 top-2 text-10 uppercase text-caption dark:text-neutral-400">{label}</span>
      <SideValues sides={sides} />
      {children}
    </div>
  )
}

/**
 * Margin, border, padding and content as nested rings — the convention every
 * browser's inspector already taught, in FunDS's status tints.
 */
function BoxModelView({ box }: { box: BoxModel }) {
  const size =
    box.width == null || box.height == null ? 'auto' : `${box.width} × ${box.height}`
  return (
    <Ring
      label="Margin"
      sides={box.margin}
      tone="border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-800/30"
    >
      <Ring
        label="Border"
        sides={box.border}
        tone="border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-800/30"
      >
        <Ring
          label="Padding"
          sides={box.padding}
          tone="border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-800/30"
        >
          <div className="rounded-4 border border-blue-200 bg-blue-50 px-8 py-8 text-center text-12 font-bold text-default dark:border-blue-700 dark:bg-blue-800/40 dark:text-neutral-50">
            {size}
          </div>
        </Ring>
      </Ring>
    </Ring>
  )
}

/** name → value, the shape every row in this panel takes. */
function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-8 text-12">
      <span className="shrink-0 text-caption dark:text-neutral-400">{label}</span>
      <span
        className={`min-w-0 break-all text-right ${
          muted ? 'text-placeholder dark:text-neutral-600' : 'text-default dark:text-neutral-50'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export function InspectorPanel({
  pinned,
  onPin,
  slug,
  screenId,
  className,
  onMinimize,
  tabs,
}: InspectorPanelProps) {
  const [copied, setCopied] = useState<'agent' | 'spec' | null>(null)
  const chatAvailable = useSyncExternalStore(
    subscribeChat,
    () => getChat().available,
    () => getChatServerSnapshot().available,
  )
  const shell = { title: 'CSS', tabs, onMinimize, className }

  // Recomputed per pin rather than per frame — computed styles are only read
  // when the selection changes, not while a box is being tracked.
  const target = useMemo(() => (pinned ? resolveTarget(pinned) : null), [pinned])

  // Read once per pin, like the rest: the probe and a full computed read are
  // cheap enough for a click, not for every frame.
  const computed = useMemo(() => (pinned ? computedGroups(pinned) : []), [pinned])
  const box = useMemo(() => (pinned ? boxModel(pinned) : null), [pinned])
  const [filter, setFilter] = useState('')
  const blocks = useBlocks({ tokens: true, classes: true })

  const crumbs = useMemo(() => {
    if (!pinned) return []
    const root = pinned.closest('[data-inspect]') ?? document.body
    return ancestorChain(pinned, root)
  }, [pinned])

  // One flag, holding WHICH button was pressed, so both can report back without
  // a second piece of state that could disagree with the first.
  const copy = useCallback(
    (which: 'agent' | 'spec') => {
      if (!target) return
      const text =
        which === 'agent'
          ? copyForAgent(target, slug, screenId)
          : copySpec(target, slug, screenId)
      void navigator.clipboard.writeText(text)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 1500)
    },
    [target, slug, screenId],
  )

  if (!target || !box) {
    return (
      <PanelShell {...shell}>
        <p className="text-14 text-caption dark:text-neutral-400">
          Hover the prototype to highlight an element, click to pin it. Hold ⌥ to reach the raw
          element inside a component.
        </p>
      </PanelShell>
    )
  }

  const q = filter.trim().toLowerCase()
  const groups = computed
    .map((g) => ({
      ...g,
      props: q ? g.props.filter((p) => `${p.property}: ${p.value}`.toLowerCase().includes(q)) : g.props,
    }))
    .filter((g) => g.props.length > 0)
  const source = target.source?.split('/').pop()?.replace(/:\d+$/, '') ?? null

  return (
    <PanelShell {...shell}>
      <div className="flex flex-col gap-4">
        <h2 className="truncate text-16 font-bold text-default dark:text-neutral-50">
          {target.component ?? `<${target.tag}>`}
        </h2>
        {target.text ? (
          <p className="truncate text-12 text-caption dark:text-neutral-400">“{target.text}”</p>
        ) : null}
        {target.props.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {target.props.map(([key, value]) => (
              <span
                key={key}
                className="rounded-full bg-neutral-50 px-8 py-2 text-10 text-caption dark:bg-ink-800 dark:text-neutral-400"
              >
                {key} <span className="font-bold text-default dark:text-neutral-50">{value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-8">
        <Heading>Source</Heading>
        <span
          title={target.source ?? `projects/${slug}/screens/${screenId}.tsx`}
          className="min-w-0 truncate text-12 text-default dark:text-neutral-50"
        >
          {source ?? `${screenId}.tsx`}
        </span>
      </div>

      <BoxModelView box={box} />

      <div className="flex flex-col">
        <Block title="Tokens" count={target.computed.length} open={blocks.isOpen('tokens')} onToggle={() => blocks.toggle('tokens')}>
          {target.computed.map((row) => (
            <Row
              key={row.label}
              label={row.label}
              value={row.token ?? `${row.value} · not a token`}
              muted={!row.token}
            />
          ))}
        </Block>

        {target.authored.length > 0 ? (
          <Block title="Classes" count={target.authored.length} open={blocks.isOpen('classes')} onToggle={() => blocks.toggle('classes')}>
            {target.authored.map((a) => (
              <Row key={a.cls} label={a.cls} value={a.value ?? '—'} muted={!a.value} />
            ))}
          </Block>
        ) : null}

        <div className="flex flex-col gap-8 border-t border-default pb-4 pt-12 dark:border-ink-700">
          <Heading>Computed</Heading>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter computed styles…"
            aria-label="Filter computed styles"
            className="h-32 w-full rounded-8 border border-default bg-neutral-white px-8 text-12 text-default outline-none placeholder:text-placeholder focus:border-primary-500 dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50 dark:placeholder:text-neutral-600"
          />
        </div>
        {groups.length === 0 ? (
          <p className="pb-8 text-12 text-caption dark:text-neutral-400">
            {q ? 'Nothing matches.' : 'Nothing set beyond the defaults.'}
          </p>
        ) : null}
        {groups.map((g) => (
          // A filter opens every block it matches, so results are never hidden.
          <Block
            key={g.id}
            title={g.label}
            count={g.props.length}
            open={q !== '' || blocks.isOpen(g.id)}
            onToggle={() => blocks.toggle(g.id)}
          >
            {g.props.map((p) => (
              <Row key={p.property} label={p.property} value={p.value} />
            ))}
          </Block>
        ))}
      </div>

      {crumbs.length > 1 ? (
        <div className="flex flex-col gap-4">
          <Heading>Path</Heading>
          <div className="flex flex-wrap items-center gap-2">
            {crumbs.map((el, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPin(el)}
                className={`rounded-4 px-4 py-2 text-10 hover:bg-neutral-50 dark:hover:bg-ink-800 ${
                  el === pinned
                    ? 'font-bold text-link dark:text-neutral-50'
                    : 'text-caption dark:text-neutral-400'
                }`}
              >
                {labelOf(el)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Two audiences, two shapes of the same selection: a prompt with a blank
          for the change, and a finished redline for whoever has to rebuild it
          outside the studio. */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => copy('spec')}
          title="Every value with its token — for a ticket or a native build"
          className="rounded-full border border-default bg-neutral-white px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800"
        >
          {copied === 'spec' ? 'Copied' : 'Copy spec for dev'}
        </button>
        <button
          type="button"
          onClick={() => copy('agent')}
          title="Names this element and leaves a blank for the change you want"
          className="rounded-full border border-default bg-neutral-white px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800"
        >
          {copied === 'agent' ? 'Copied' : 'Copy for agent'}
        </button>
        {/* Where chat runs, the same handoff is one tab away: Chat is about
            the selection, so this element is already its chip. */}
        {chatAvailable ? (
          <button
            type="button"
            onClick={() => setEditTab('chat')}
            title="Open Chat about this element and say what should change"
            className="rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600"
          >
            Ask chat about this
          </button>
        ) : null}
      </div>

      {/* The same thing Escape does, for anyone who doesn't know Escape does it. */}
      <button
        type="button"
        onClick={() => onPin(null)}
        className="rounded-full px-16 py-8 text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
      >
        Clear selection
      </button>
    </PanelShell>
  )
}
