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
import { layoutOf, SPACING, type Layout } from './layout'
import { nextSizing, sizeOf, snapSize, type Axis, type SizeMode } from './sizing'
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

/** "iconPosition" → "Icon position": prop names read as labels. */
export function sentenceCase(text: string): string {
  const spaced = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function RowLabel({ children }: { children: ReactNode }) {
  return (
    <span className="truncate text-12 text-caption dark:text-neutral-400">
      {typeof children === 'string' ? sentenceCase(children) : children}
    </span>
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
  open,
  onOpen,
}: {
  pinned: Element | null
  slug: string
  screenId: string
  onChanged: () => void
  /** Held by the panel, so the menu stays open across the selection changing
   *  to what was just inserted. */
  open: boolean
  onOpen: (open: boolean) => void
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

  if (!open) {
    return (
      <Section title="Insert">
        <button type="button" onClick={() => onOpen(true)} className={`${BTN} w-full`}>
          + Insert element
        </button>
      </Section>
    )
  }

  return (
    <Section title="Insert">
      <div className="flex items-center justify-between gap-8">
        <span className="text-12 font-bold text-default dark:text-neutral-50">Insert element</span>
        <button
          type="button"
          onClick={() => {
            setPicking(false)
            onOpen(false)
          }}
          className="text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
        >
          Close
        </button>
      </div>
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

type Pos = 'start' | 'center' | 'end'
const POS: Pos[] = ['start', 'center', 'end']

const FIELD =
  'relative flex h-32 min-w-0 items-center gap-8 rounded-8 bg-neutral-50 px-8 text-12 text-default hover:outline hover:outline-1 hover:outline-neutral-200 dark:bg-ink-800 dark:text-neutral-50 dark:hover:outline-ink-700'
const GLYPH = 'size-16 flex-none text-caption dark:text-neutral-400'

function Svg({ children, className = GLYPH }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  )
}

const FlowNone = () => (
  <Svg className="size-16">
    <rect x="2.5" y="2.5" width="4" height="4" rx="1" />
    <rect x="9.5" y="5.5" width="4" height="4" rx="1" />
    <rect x="2.5" y="9.5" width="4" height="4" rx="1" />
  </Svg>
)
const FlowColumn = () => (
  <Svg className="size-16">
    <rect x="2.5" y="2" width="5" height="4.5" rx="1" />
    <rect x="2.5" y="9.5" width="5" height="4.5" rx="1" />
    <path d="M12 2.5v11M9.75 11.25 12 13.5l2.25-2.25" />
  </Svg>
)
const FlowRow = () => (
  <Svg className="size-16">
    <rect x="2" y="2.5" width="4.5" height="4" rx="1" />
    <rect x="9.5" y="2.5" width="4.5" height="4" rx="1" />
    <path d="M2.5 11.5h11M11.25 9.25l2.25 2.25-2.25 2.25" />
  </Svg>
)
const GapGlyph = ({ row }: { row: boolean }) => (
  <Svg>
    <g transform={row ? 'rotate(90 8 8)' : undefined}>
      <path d="M2.5 3.5c1.5 1 9.5 1 11 0M2.5 12.5c1.5-1 9.5-1 11 0M6 8h4" />
    </g>
  </Svg>
)
const PadXGlyph = () => (
  <Svg>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5.5 5v6M10.5 5v6" />
  </Svg>
)
const PadYGlyph = () => (
  <Svg>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5 5.5h6M5 10.5h6" />
  </Svg>
)
const Chevron = () => (
  <Svg className="size-12 flex-none text-caption dark:text-neutral-400">
    <path d="m4 6 4 4 4-4" />
  </Svg>
)

/** Hover label under a control, the way Figma names its flow buttons. */
function Tip({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-4 hidden -translate-x-1/2 whitespace-nowrap rounded-4 bg-neutral-900 px-8 py-4 text-12 text-neutral-white group-hover:block dark:bg-ink-950">
      {children}
    </span>
  )
}

/** A value box with a native select laid over it: a token menu that still
 *  looks like a field, and keeps the keyboard and screen reader for free. */
export function TokenField({
  glyph,
  value,
  options,
  onPick,
  label,
  chevron = false,
}: {
  glyph?: ReactNode
  value: string
  options: { value: string; label: string }[]
  onPick: (value: string) => void
  label: string
  chevron?: boolean
}) {
  return (
    <label className={FIELD} title={label}>
      {glyph}
      <span className="flex-1 truncate">{options.find((o) => o.value === value)?.label ?? value}</span>
      {chevron ? <Chevron /> : null}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onPick(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Three bars, drawn where a cell's alignment puts the children. */
function AlignBars({ row, cross }: { row: boolean; cross: Pos }) {
  const lengths = [8, 12, 6]
  return (
    <Svg className="size-16 text-blue-500">
      {lengths.map((len, i) => {
        const along = 4 + i * 4
        const from = cross === 'start' ? 2 : cross === 'end' ? 14 - len : 8 - len / 2
        return row ? (
          <path key={i} d={`M${along} ${from}v${len}`} strokeWidth="2" />
        ) : (
          <path key={i} d={`M${from} ${along}h${len}`} strokeWidth="2" />
        )
      })}
    </Svg>
  )
}

/** Where a padding value reads from when no class sets it: what renders. */
function renderedPad(el: Element, axis: 'x' | 'y'): string {
  const s = getComputedStyle(el)
  const px = Math.round(parseFloat(axis === 'x' ? s.paddingLeft : s.paddingTop))
  return SPACING.includes(String(px)) ? String(px) : '0'
}

const SPACING_OPTIONS = SPACING.map((v) => ({ value: v, label: v }))

const MODES: { value: SizeMode; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hug', label: 'Hug' },
  { value: 'fill', label: 'Fill' },
]

/**
 * Figma's W / H field: the rendered size, and how it is decided. Typing a
 * number makes it Fixed, snapped to the 4px size scale; the mode menu switches
 * between Fixed, Hug and Fill.
 */
function SizeField({ el, axis, onSize }: { el: Element; axis: Axis; onSize: (sizing: string[]) => void }) {
  const size = sizeOf(el, axis)
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const n = Number(draft)
    setDraft(null)
    if (Number.isFinite(n) && n > 0) onSize(nextSizing(el, axis, 'fixed', snapSize(n)))
  }
  const label = axis === 'w' ? 'Width' : 'Height'
  return (
    <div className={FIELD}>
      <span className="flex-none text-caption dark:text-neutral-400">{axis.toUpperCase()}</span>
      <input
        aria-label={label}
        inputMode="numeric"
        value={draft ?? String(size.px)}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(null)
        }}
        className="w-full min-w-0 bg-transparent outline-none"
      />
      <label className="relative flex flex-none cursor-pointer items-center gap-2">
        <span className={size.mode === 'fixed' ? 'text-caption dark:text-neutral-400' : ''}>
          {MODES.find((m) => m.value === size.mode)?.label}
        </span>
        <Chevron />
        <select
          aria-label={`${label} sizing`}
          value={size.mode}
          onChange={(e) => {
            const mode = e.target.value as SizeMode
            onSize(nextSizing(el, axis, mode, mode === 'fixed' ? snapSize(size.px) : undefined))
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

/**
 * Auto layout, laid out as Figma's: flow, alignment, gap, padding, clip. Only
 * the three flows the stack classes express — none, column, row. A written
 * element stages a `stack` edit; a new one has its own class list rewritten.
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
  const container = canHoldDom(el) || el.hasAttribute(NEW_ATTR)
  const sizable = el.getAttribute('data-fds') !== 'Screen'
  if (!container && !sizable) return null
  const current = layoutOf(Array.from(el.classList))
  const row = current.direction === 'row'
  const auto = current.justify === 'between'

  const set = (patch: Partial<Layout>) => {
    setLayout(el, patch, slug, screenId)
    onChanged()
  }

  const flows = [
    { value: null, label: 'None', Glyph: FlowNone },
    { value: 'col', label: 'Column', Glyph: FlowColumn },
    { value: 'row', label: 'Row', Glyph: FlowRow },
  ] as const

  const cross: Pos = POS.includes(current.align as Pos) ? (current.align as Pos) : 'start'
  const main: Pos = POS.includes(current.justify as Pos) ? (current.justify as Pos) : 'start'

  const pick = (r: number, c: number) => {
    const alongMain = row ? POS[c] : POS[r]
    const alongCross = row ? POS[r] : POS[c]
    // `start` is flex's own default on the main axis, so it is written as no
    // class. On the cross axis the default is stretch, which `start` is not —
    // but a stack that was stretching stays so until another cell is picked.
    const align = alongCross === 'start' && current.align === null ? null : alongCross
    set(auto ? { align } : { align, justify: alongMain === 'start' ? null : alongMain })
  }

  const padX = current.padX ?? renderedPad(el, 'x')
  const padY = current.padY ?? renderedPad(el, 'y')
  const pad = (v: string) => (v === '0' ? null : v)

  return (
    <Section title={container ? 'Auto layout' : 'Layout'}>
      <div className="flex flex-col gap-12">
        {container ? (
          <div className="flex flex-col gap-4">
            <RowLabel>Flow</RowLabel>
            <div className="flex gap-2 rounded-8 bg-neutral-50 p-2 dark:bg-ink-800">
              {flows.map(({ value, label, Glyph }) => {
                const on = current.direction === value
                return (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    aria-pressed={on}
                    onClick={() => set({ direction: value })}
                    className={`group relative flex h-24 flex-1 items-center justify-center rounded-4 ${
                      on
                        ? 'bg-neutral-white text-default outline outline-1 outline-neutral-200 dark:bg-ink-900 dark:text-neutral-50 dark:outline-ink-700'
                        : 'text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50'
                    }`}
                  >
                    <Glyph />
                    <Tip>{label}</Tip>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {sizable ? (
          <div className="grid grid-cols-2 gap-8">
            <SizeField el={el} axis="w" onSize={(sizing) => set({ sizing })} />
            <SizeField el={el} axis="h" onSize={(sizing) => set({ sizing })} />
          </div>
        ) : null}

        {container && current.direction ? (
          <>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <RowLabel>Alignment</RowLabel>
                <div className="grid grid-cols-3 rounded-8 bg-neutral-50 p-4 dark:bg-ink-800">
                  {POS.map((_, r) =>
                    POS.map((__, c) => {
                      const cellMain = row ? POS[c] : POS[r]
                      const cellCross = row ? POS[r] : POS[c]
                      const on = cellCross === cross && (auto || cellMain === main)
                      return (
                        <button
                          key={`${r}${c}`}
                          type="button"
                          aria-label={`Align ${POS[r]} ${POS[c]}`}
                          aria-pressed={on}
                          onClick={() => pick(r, c)}
                          className="flex h-20 items-center justify-center rounded-4 hover:bg-neutral-200 dark:hover:bg-ink-700"
                        >
                          {on ? (
                            <AlignBars row={row} cross={cellCross} />
                          ) : (
                            <span className="size-2 rounded-full bg-neutral-500" />
                          )}
                        </button>
                      )
                    }),
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <RowLabel>Gap</RowLabel>
                <TokenField
                  label="Gap between items"
                  glyph={<GapGlyph row={row} />}
                  value={auto ? 'auto' : (current.gap ?? '0')}
                  options={[...SPACING_OPTIONS, { value: 'auto', label: 'Auto' }]}
                  chevron
                  onPick={(v) =>
                    set(
                      v === 'auto'
                        ? { justify: 'between' }
                        : { gap: pad(v), justify: auto ? null : current.justify },
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <RowLabel>Padding</RowLabel>
              <div className="grid grid-cols-2 gap-8">
                <TokenField
                  label="Horizontal padding"
                  chevron
                  glyph={<PadXGlyph />}
                  value={padX}
                  options={SPACING_OPTIONS}
                  onPick={(v) => set({ padX: pad(v) })}
                />
                <TokenField
                  label="Vertical padding"
                  chevron
                  glyph={<PadYGlyph />}
                  value={padY}
                  options={SPACING_OPTIONS}
                  onPick={(v) => set({ padY: pad(v) })}
                />
              </div>
            </div>
          </>
        ) : null}

        {container ? (
          <label className="flex cursor-pointer items-center gap-8 text-12 text-default dark:text-neutral-50">
            <input
              type="checkbox"
              checked={Boolean(current.clip)}
              onChange={(e) => set({ clip: e.target.checked })}
              className="size-16 accent-blue-500"
            />
            Clip content
          </label>
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
      {/* Not written yet, so this takes it back off the list. For a new stack
          that is an unwrap: what it holds goes back where it was — but
          anything added INTO it only exists inside it, and goes too. */}
      <button
        type="button"
        className={BTN}
        title={
          edit.kind === 'wrap'
            ? 'Take this stack away; what it wrapped goes back where it was (⇧⌘G)'
            : 'Take this off the change list (⌫)'
        }
        onClick={() => {
          removeNewElement(el)
          onChanged()
        }}
      >
        {edit.kind === 'wrap' ? 'Unwrap' : 'Remove'}
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

