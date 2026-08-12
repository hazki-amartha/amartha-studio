'use client'

// =============================================================================
// Inspect · the reading panel.
//
// Takes the annotations column while inspect is on — same 264px, same idiom, so
// the device stays optically centred and nothing in the layout moves. Notes and
// the inspector answer different questions and are never both wanted at once.
//
// Order is deliberate: what the thing IS, where it lives, what it was written
// with, what it computes to. Authored classes come before computed styling
// because they are the text an engineer would actually type; computed styling
// is what the design system's hand-written `ds-*` CSS is doing underneath.
// =============================================================================

import { useCallback, useMemo, useState } from 'react'
import { ancestorChain, labelOf, resolveTarget } from './resolve'
import { copyForAgent } from './copyForAgent'
import { copySpec } from './copySpec'

export interface InspectorPanelProps {
  pinned: Element | null
  onPin: (el: Element | null) => void
  slug: string
  screenId: string
  /** The annotations column geometry, handed down by the prototype view. */
  className?: string
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">
      {children}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Heading>{title}</Heading>
      {children}
    </div>
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
}: InspectorPanelProps) {
  const [copied, setCopied] = useState<'agent' | 'spec' | null>(null)
  const shell = `flex max-h-full flex-col gap-12 overflow-y-auto pt-8 ${className ?? ''}`

  // Recomputed per pin rather than per frame — computed styles are only read
  // when the selection changes, not while a box is being tracked.
  const target = useMemo(() => (pinned ? resolveTarget(pinned) : null), [pinned])

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

  if (!target) {
    return (
      <aside className={shell}>
        <Heading>Inspect</Heading>
        <p className="text-14 text-caption dark:text-neutral-400">
          Hover the prototype to highlight an element, click to pin it. Hold ⌥ to reach the raw
          element inside a component.
        </p>
      </aside>
    )
  }

  return (
    <aside className={shell}>
      <Heading>Inspect</Heading>

      <div className="flex flex-col gap-4">
        <h2 className="text-16 font-bold text-default dark:text-neutral-50">
          {target.component ?? `<${target.tag}>`}
        </h2>
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

      <Section title="Screen">
        <span className="break-all text-12 text-default dark:text-neutral-50">
          projects/{slug}/screens/{screenId}.tsx
        </span>
      </Section>

      {target.authored.length > 0 ? (
        <Section title="Classes">
          <div className="flex flex-col gap-2">
            {target.authored.map((a) => (
              <Row key={a.cls} label={a.cls} value={a.value ?? '—'} muted={!a.value} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Styling">
        <div className="flex flex-col gap-2">
          {target.computed.map((row) => (
            <Row
              key={row.label}
              label={row.label}
              value={row.token ?? `${row.value} · not a token`}
              muted={!row.token}
            />
          ))}
        </div>
      </Section>

      {target.text ? (
        <Section title="Content">
          <span className="text-12 text-default dark:text-neutral-50">{target.text}</span>
        </Section>
      ) : null}

      {crumbs.length > 1 ? (
        <Section title="Path">
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
        </Section>
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
      </div>

      {/* The same thing Escape does, for anyone who doesn't know Escape does it. */}
      <button
        type="button"
        onClick={() => onPin(null)}
        className="rounded-full px-16 py-8 text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
      >
        Clear selection
      </button>
    </aside>
  )
}
