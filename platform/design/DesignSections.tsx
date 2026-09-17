'use client'

// =============================================================================
// Design · the D3 panel sections — Insert, Layout, a new element's own
// controls, and a multi-selection.
//
// Split out of DesignPanel.tsx only for length; they share its atoms and its
// rule that every control enumerates the design system's own values.
// =============================================================================

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  canHoldDom,
  describe,
  insertItem,
  insertPlace,
  removeNewElement,
  setLayout,
  wrapElements,
  wrappable,
} from './actions'
import { CATALOG, catalogItem, isPlainText, type CatalogItem } from './catalog'
import { COMPONENT_PROPS } from './componentProps'
import { newEdit, updateNew } from './designStore'
import { ALIGNS, JUSTIFIES, layoutOf, SPACING, type Layout } from './layout'
import { NEW_ATTR } from './overlay'
import { iconModule } from './preview'
import type { InsertEdit } from './protocol'
import { clearSelection } from './selection'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-8 border-t border-default pt-12 first:border-0 first:pt-0 dark:border-ink-700">
      <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">{title}</span>
      {children}
    </div>
  )
}

function RowLabel({ children }: { children: ReactNode }) {
  return <span className="truncate text-12 text-caption dark:text-neutral-400">{children}</span>
}

const SEGMENT_ON = 'bg-neutral-50 font-bold text-link dark:bg-ink-800 dark:text-neutral-50'
const SEGMENT_OFF = 'text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50'

function Segments<T extends string>({
  value,
  options,
  onPick,
}: {
  value: T | null
  options: { value: T; label: string }[]
  onPick: (value: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-8 border border-default dark:border-ink-700">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={`px-8 py-4 text-12 ${value === o.value ? SEGMENT_ON : SEGMENT_OFF}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const BTN =
  'rounded-full border border-default bg-neutral-white px-8 py-4 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800 dark:disabled:text-neutral-600'

// --- insert -------------------------------------------------------------------

/** What is being dragged out of the Insert panel — read by the device's drop
 *  handler, which cannot read a drag's data until the drop itself. */
let dragging: { item: string; icon?: string } | null = null
export function insertBeingDragged() {
  return dragging
}

const GROUPS: CatalogItem['group'][] = ['Layout', 'Text', 'Components']

export function InsertSection({
  pinned,
  slug,
  screenId,
  onChanged,
}: {
  pinned: Element | null
  slug: string
  screenId: string
  onChanged: () => void
}) {
  const [picking, setPicking] = useState(false)
  const place = insertPlace(pinned, slug)

  const add = (key: string, icon?: string) => {
    if (!place) return
    insertItem(key, place.to, place.near, slug, screenId, icon)
    setPicking(false)
    onChanged()
  }

  const tile = (item: CatalogItem) => (
    <button
      key={item.key}
      type="button"
      draggable={Boolean(place)}
      disabled={!place}
      onDragStart={(e) => {
        dragging = { item: item.key }
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('text/plain', item.label)
      }}
      onDragEnd={() => {
        dragging = null
      }}
      onClick={() => (item.key === 'icon' ? setPicking((p) => !p) : add(item.key))}
      className={`${BTN} text-left`}
      title={place ? `Add ${place.how} ${describe(place.near)} — or drag it onto the screen` : undefined}
    >
      {item.label}
    </button>
  )

  return (
    <Section title="Insert">
      <span className="text-10 text-caption dark:text-neutral-400">
        {place
          ? `Adds ${place.how} ${describe(place.near)}. Or drag onto the screen.`
          : 'Nothing on this screen can take new elements.'}
      </span>
      {GROUPS.map((g) => (
        <div key={g} className="flex flex-col gap-4">
          <span className="text-10 text-placeholder dark:text-neutral-600">{g}</span>
          <div className="grid grid-cols-2 gap-4">{CATALOG.filter((c) => c.group === g).map(tile)}</div>
        </div>
      ))}
      <div className="flex flex-col gap-4">
        <span className="text-10 text-placeholder dark:text-neutral-600">Icons</span>
        <div className="grid grid-cols-2 gap-4">{tile(catalogItem('icon')!)}</div>
        {picking && place ? <IconPicker onPick={(name) => add('icon', name)} onDragName={(name) => (dragging = { item: 'icon', icon: name })} /> : null}
      </div>
    </Section>
  )
}

function IconPicker({ onPick, onDragName }: { onPick: (name: string) => void; onDragName: (name: string) => void }) {
  const [icons, setIcons] = useState<Record<string, ComponentType<{ className?: string }>> | null>(null)
  const [query, setQuery] = useState('')
  useEffect(() => {
    let alive = true
    void iconModule().then((m) => alive && setIcons(m))
    return () => {
      alive = false
    }
  }, [])

  const names = useMemo(() => {
    if (!icons) return []
    const q = query.trim().toLowerCase()
    return Object.keys(icons)
      .filter((n) => !q || n.toLowerCase().includes(q))
      .slice(0, 48)
  }, [icons, query])

  return (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search icons"
        className="rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
      />
      {!icons ? (
        <span className="text-10 text-caption dark:text-neutral-400">Loading icons…</span>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {names.map((name) => {
            const Icon = icons[name]
            return (
              <button
                key={name}
                type="button"
                title={name}
                draggable
                onDragStart={(e) => {
                  onDragName(name)
                  e.dataTransfer.effectAllowed = 'copy'
                  e.dataTransfer.setData('text/plain', name)
                }}
                onClick={() => onPick(name)}
                className="flex items-center justify-center rounded-8 p-4 text-default hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-ink-800"
              >
                <Icon className="size-20" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- layout -------------------------------------------------------------------

const DIRECTIONS = [
  { value: 'none', label: 'None' },
  { value: 'col', label: 'Column' },
  { value: 'row', label: 'Row' },
] as const

/**
 * Auto layout: direction, gap, alignment, justification — for anything that
 * can hold children. A written element stages a `stack` edit; a new one has
 * its own class list rewritten in the list.
 */
export function LayoutSection({
  el,
  slug,
  screenId,
  onChanged,
}: {
  el: Element
  slug: string
  screenId: string
  onChanged: () => void
}) {
  if (!canHoldDom(el) && !el.hasAttribute(NEW_ATTR)) return null
  const current = layoutOf(Array.from(el.classList))

  const set = (patch: Partial<Layout>) => {
    setLayout(el, patch, slug, screenId)
    onChanged()
  }

  const gapIndex = current.gap === null ? -1 : SPACING.indexOf(current.gap)

  return (
    <Section title="Auto layout">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-8">
          <RowLabel>Direction</RowLabel>
          <Segments
            value={current.direction ?? 'none'}
            options={[...DIRECTIONS]}
            onPick={(v) => set({ direction: v === 'none' ? null : v })}
          />
        </div>
        {current.direction ? (
          <>
            <div className="flex items-center justify-between gap-8">
              <RowLabel>Gap</RowLabel>
              <div className="flex flex-none items-center overflow-hidden rounded-8 border border-default dark:border-ink-700">
                <button
                  type="button"
                  aria-label="Less gap"
                  disabled={gapIndex < 0}
                  onClick={() => set({ gap: gapIndex <= 0 ? null : SPACING[gapIndex - 1] })}
                  className="flex h-24 w-24 items-center justify-center text-14 font-bold text-caption hover:bg-neutral-50 disabled:text-placeholder dark:text-neutral-400 dark:hover:bg-ink-800"
                >
                  −
                </button>
                <span className="w-32 border-x border-default text-center text-12 font-bold text-default dark:border-ink-700 dark:text-neutral-50">
                  {current.gap ?? '–'}
                </span>
                <button
                  type="button"
                  aria-label="More gap"
                  disabled={gapIndex >= SPACING.length - 1}
                  onClick={() => set({ gap: SPACING[gapIndex + 1] })}
                  className="flex h-24 w-24 items-center justify-center text-14 font-bold text-caption hover:bg-neutral-50 disabled:text-placeholder dark:text-neutral-400 dark:hover:bg-ink-800"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-8">
              <RowLabel>Align</RowLabel>
              <select
                value={current.align ?? ''}
                onChange={(e) => set({ align: e.target.value || null })}
                className="rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
              >
                <option value="">default</option>
                {ALIGNS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-8">
              <RowLabel>Justify</RowLabel>
              <select
                value={current.justify ?? ''}
                onChange={(e) => set({ justify: e.target.value || null })}
                className="rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
              >
                <option value="">default</option>
                {JUSTIFIES.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>
    </Section>
  )
}

// --- a new element -------------------------------------------------------------

/**
 * A staged insert or wrap, selected on the screen. It has no address yet, so
 * what it offers is its own definition: the component's declared props, its
 * text, and — through LayoutSection and the class knobs — its classes. All of
 * it rewrites the staged edit in place.
 */
export function NewElementSection({
  el,
  onChanged,
}: {
  el: Element
  onChanged: () => void
}) {
  const id = el.getAttribute(NEW_ATTR)
  const edit = id ? newEdit(id) : undefined
  const [draft, setDraft] = useState<Record<string, string>>({})
  useEffect(() => setDraft({}), [id])
  if (!id || !edit) return null

  const item = edit.kind === 'insert' ? catalogItem(edit.item) : undefined
  const enums = item ? (COMPONENT_PROPS[item.tag] ?? []) : []
  const texts = item?.textProps ?? []

  const change = (patch: (e: InsertEdit) => InsertEdit) => {
    updateNew(id, (e) => (e.kind === 'insert' ? patch(e) : e))
    onChanged()
  }

  const textField = (key: string, value: string, commit: (v: string) => void) => {
    const shown = draft[key] ?? value
    const valid = isPlainText(shown)
    return (
      <label key={key} className="flex flex-col gap-4">
        <RowLabel>{key}</RowLabel>
        <input
          value={shown}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
          onBlur={() => valid && shown !== value && commit(shown)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) commit(shown)
          }}
          className={`rounded-8 border bg-neutral-white px-8 py-4 text-12 text-default dark:bg-ink-900 dark:text-neutral-50 ${
            valid ? 'border-default dark:border-ink-700' : 'border-red-500'
          }`}
        />
      </label>
    )
  }

  return (
    <Section title="New element">
      <span className="text-10 text-caption dark:text-neutral-400">
        Not written yet — it gets an address once applied.
      </span>
      {edit.kind === 'insert' && item ? (
        <div className="flex flex-col gap-8">
          {enums
            .filter((p) => p.prop in item.props)
            .map((p) => (
              <label key={p.prop} className="flex items-center justify-between gap-8">
                <RowLabel>{p.prop}</RowLabel>
                <select
                  value={edit.props[p.prop] ?? item.props[p.prop]}
                  onChange={(e) => change((x) => ({ ...x, props: { ...x.props, [p.prop]: e.target.value } }))}
                  className="rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
                >
                  {p.values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          {texts.map((key) =>
            textField(key, edit.props[key] ?? '', (v) => change((x) => ({ ...x, props: { ...x.props, [key]: v } }))),
          )}
          {item.text !== undefined
            ? textField('text', edit.text ?? item.text, (v) => change((x) => ({ ...x, text: v })))
            : null}
        </div>
      ) : null}
      <button
        type="button"
        className={BTN}
        onClick={() => {
          removeNewElement(el)
          onChanged()
        }}
      >
        Remove
      </button>
    </Section>
  )
}

// --- a multi-selection ------------------------------------------------------------

export function SelectionSection({
  els,
  slug,
  screenId,
  onChanged,
}: {
  els: Element[]
  slug: string
  screenId: string
  onChanged: () => void
}) {
  const ok = wrappable(els, slug)
  return (
    <Section title={`${els.length} selected`}>
      <div className="flex gap-4">
        <button
          type="button"
          className={`${BTN} flex-1`}
          disabled={typeof ok === 'string'}
          title="Wrap in a stack (⌥⌘G)"
          onClick={() => {
            wrapElements(els, slug, screenId)
            clearSelection()
            onChanged()
          }}
        >
          Wrap in stack
        </button>
        <button type="button" className={`${BTN} flex-1`} onClick={clearSelection}>
          Clear
        </button>
      </div>
      <span className="text-10 text-caption dark:text-neutral-400">
        {typeof ok === 'string' ? ok : 'Shift-click to add or remove elements.'}
      </span>
    </Section>
  )
}

