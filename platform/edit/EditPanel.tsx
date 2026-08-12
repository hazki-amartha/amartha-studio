'use client'

// =============================================================================
// Edit · the tweaking panel.
//
// Takes the same column the inspector uses, and the same pick layer — edit is
// inspect that can write. Every control enumerates the design system's own
// scale, so the panel is physically incapable of producing an off-system
// value: spacing steps through the 4px grid, radius through the radius ramp,
// colours through named tokens, and FunDS components expose only their
// declared props. Free-form input exists nowhere but the text field, and text
// isn't a token.
//
// Layout mirrors a design-tool inspector on purpose (source → component →
// layout → shape → text → fill), with human labels ("Padding", not `p`) —
// utility-class spellings live in Inspect, which is the engineer-facing view.
//
// A nudge patches the live DOM instantly and stages a pending change; NOTHING
// is written until "Apply N changes". Undo is two-layered to match: while
// changes are pending it unstages the last-touched one (reverting its patch);
// once applied, it reverses real file edits through the write-back route.
// =============================================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { ancestorChain, labelOf, resolveTarget } from '@/platform/inspect/resolve'
import {
  colorEntries,
  fontSizeNames,
  fontWeightNames,
  radiusNames,
  spacingNames,
  textAliasEntries,
  tokenForColor,
  valueForClass,
} from '@/platform/inspect/tokenMap'
import {
  applyClassSwap,
  classPeers,
  findRepin,
  repinOf,
  revertStagedPatch,
  type Repin,
} from './applyDom'
import { COMPONENT_PROPS } from './componentProps'
import {
  applyPending,
  clearEditError,
  fileClassesOf,
  getEditStoreServerSnapshot,
  getEditStoreState,
  setOnFlushed,
  stageClassEdit,
  stagePropEdit,
  stageTextEdit,
  subscribeEditStore,
  undoLast,
  unstage,
  unstageLast,
} from './editStore'
import type { Edit } from './protocol'

export interface EditPanelProps {
  pinned: Element | null
  onPin: (el: Element | null) => void
  slug: string
  screenId: string
  className?: string
}

// --- class classification ----------------------------------------------------

/** Utility families the panel lets a designer step. Sizing (`w-`, `h-`) and
 *  position utilities are deliberately absent: nudging those fights the layout
 *  primitives, and that conversation belongs in chat. */
const SPACING_EDITABLE = [
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
  'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
  'gap', 'gap-x', 'gap-y', 'space-x', 'space-y',
]

const RADIUS_EDITABLE = ['rounded', 'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l']

/** Human names for the knobs — the panel speaks designer, Inspect speaks CSS. */
const KNOB_LABELS: Record<string, string> = {
  p: 'Padding', px: 'Padding ↔', py: 'Padding ↕',
  pt: 'Padding top', pr: 'Padding right', pb: 'Padding bottom', pl: 'Padding left',
  m: 'Margin', mx: 'Margin ↔', my: 'Margin ↕',
  mt: 'Margin top', mr: 'Margin right', mb: 'Margin bottom', ml: 'Margin left',
  gap: 'Gap', 'gap-x': 'Gap ↔', 'gap-y': 'Gap ↕',
  'space-x': 'Spacing ↔', 'space-y': 'Spacing ↕',
  rounded: 'Radius', 'rounded-t': 'Radius top', 'rounded-r': 'Radius right',
  'rounded-b': 'Radius bottom', 'rounded-l': 'Radius left',
}

interface EditableRow {
  cls: string
  prefix: string
  suffix: string
  type: 'spacing' | 'radius' | 'fontSize' | 'weight' | 'textColor' | 'bgColor' | 'borderColor'
}

const colorNames = new Set(colorEntries.map(([name]) => name))
const textAliasNames = new Set(textAliasEntries.map(([name]) => name))

function classify(cls: string): EditableRow | null {
  // Variant-prefixed classes (`md:`, `hover:`) are rare in prototypes and
  // ambiguous to present as one knob — leave them to chat.
  if (cls.includes(':') || cls.startsWith('ds-')) return null

  const split = (prefixes: string[]): [string, string] | null => {
    let best: string | null = null
    for (const p of prefixes) {
      if (cls.startsWith(`${p}-`) && (!best || p.length > best.length)) best = p
    }
    return best ? [best, cls.slice(best.length + 1)] : null
  }

  const spacing = split(SPACING_EDITABLE)
  if (spacing && spacingNames.includes(spacing[1])) {
    return { cls, prefix: spacing[0], suffix: spacing[1], type: 'spacing' }
  }

  const radius = split(RADIUS_EDITABLE)
  if (radius && radiusNames.includes(radius[1])) {
    return { cls, prefix: radius[0], suffix: radius[1], type: 'radius' }
  }

  if (cls.startsWith('text-')) {
    const suffix = cls.slice(5)
    if (fontSizeNames.includes(suffix)) return { cls, prefix: 'text', suffix, type: 'fontSize' }
    if (colorNames.has(suffix) || textAliasNames.has(suffix)) {
      return { cls, prefix: 'text', suffix, type: 'textColor' }
    }
  }

  if (cls.startsWith('font-')) {
    const suffix = cls.slice(5)
    if (fontWeightNames.includes(suffix)) return { cls, prefix: 'font', suffix, type: 'weight' }
  }

  if (cls.startsWith('bg-')) {
    const suffix = cls.slice(3)
    if (colorNames.has(suffix)) return { cls, prefix: 'bg', suffix, type: 'bgColor' }
  }

  if (cls.startsWith('border-')) {
    const suffix = cls.slice(7)
    if (colorNames.has(suffix) || suffix === 'default' || suffix === 'light') {
      return { cls, prefix: 'border', suffix, type: 'borderColor' }
    }
  }

  return null
}

// --- small UI atoms ----------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 border-t border-default pt-12 first:border-0 first:pt-0 dark:border-ink-700">
      <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">
        {title}
      </span>
      {children}
    </div>
  )
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <span className="truncate text-12 text-caption dark:text-neutral-400">{children}</span>
}

function Stepper({
  value,
  hint,
  onStep,
  canDown,
  canUp,
}: {
  value: string
  hint?: string
  onStep: (dir: -1 | 1) => void
  canDown: boolean
  canUp: boolean
}) {
  const btn =
    'flex h-24 w-24 flex-none items-center justify-center text-14 font-bold text-caption hover:bg-neutral-50 hover:text-default disabled:cursor-not-allowed disabled:text-placeholder dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50 dark:disabled:text-neutral-600'
  return (
    <div
      className="flex flex-none items-center overflow-hidden rounded-8 border border-default dark:border-ink-700"
      title={hint}
    >
      <button type="button" onClick={() => onStep(-1)} disabled={!canDown} aria-label="Decrease" className={btn}>
        −
      </button>
      <span className="w-32 border-x border-default text-center text-12 font-bold text-default dark:border-ink-700 dark:text-neutral-50">
        {value}
      </span>
      <button type="button" onClick={() => onStep(1)} disabled={!canUp} aria-label="Increase" className={btn}>
        +
      </button>
    </div>
  )
}

// --- the panel ---------------------------------------------------------------

export function EditPanel({ pinned, onPin, slug, screenId, className }: EditPanelProps) {
  const shell = `flex max-h-full flex-col gap-12 overflow-y-auto pt-8 ${className ?? ''}`
  const store = useSyncExternalStore(
    subscribeEditStore,
    getEditStoreState,
    getEditStoreServerSnapshot,
  )

  // Optimistic swaps mutate the DOM outside React's sight; bumping this after
  // each one re-runs resolveTarget so the panel shows what's now on screen.
  const [version, bump] = useReducer((x: number) => x + 1, 0)

  const target = useMemo(
    () => (pinned ? resolveTarget(pinned) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, version],
  )

  const crumbs = useMemo(() => {
    if (!pinned) return []
    const root = pinned.closest('[data-inspect]') ?? document.body
    return ancestorChain(pinned, root)
  }, [pinned])

  const peerCount = useMemo(
    () => (pinned ? classPeers(pinned).length : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, version],
  )

  // --- re-pin across fast refresh -------------------------------------------
  const pinnedRef = useRef<Element | null>(pinned)
  pinnedRef.current = pinned
  const repinRef = useRef<Repin | null>(null)

  useEffect(() => {
    setOnFlushed(() => {
      const wanted = repinRef.current
      if (!wanted) return
      let tries = 0
      const iv = setInterval(() => {
        tries += 1
        // Fast refresh often patches in place — if the pin is still connected
        // there is nothing to restore.
        if (pinnedRef.current?.isConnected) {
          clearInterval(iv)
          bump()
          return
        }
        const found = findRepin(wanted)
        if (found) {
          clearInterval(iv)
          onPin(found)
        } else if (tries > 20) {
          clearInterval(iv)
        }
      }, 120)
    })
    return () => setOnFlushed(null)
  }, [onPin])

  // --- editing actions -------------------------------------------------------

  const swapClass = useCallback(
    (oldRendered: string, newClass: string) => {
      const el = pinnedRef.current
      if (!el || oldRendered === newClass) return
      const rendered = Array.from(el.classList).filter((c) => !c.startsWith('ds-'))
      const find = fileClassesOf(rendered)
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
      stageClassEdit(slug, screenId, find, oldRendered, newClass, text)
      applyClassSwap(el, oldRendered, newClass)
      repinRef.current = repinOf(el)
      bump()
    },
    [slug, screenId],
  )

  // --- text editing ----------------------------------------------------------
  // Editable only when the element is a pure text node holder: with element
  // children, "its text" spans several source expressions and a swap would lie.
  const fullText = pinned && pinned.children.length === 0 ? (pinned.textContent ?? '') : ''
  const textEditable = fullText.trim().length >= 2 && fullText.length <= 200
  const [draftText, setDraftText] = useState('')
  useEffect(() => setDraftText(fullText), [fullText, pinned])

  const commitText = useCallback(() => {
    const el = pinnedRef.current
    const oldText = fullText
    const next = draftText
    if (!el || next === oldText || next.trim().length === 0) return
    if (/[<>{}]/.test(next)) return
    stageTextEdit(slug, screenId, oldText, next)
    el.textContent = next
    repinRef.current = repinOf(el)
    bump()
  }, [draftText, fullText, slug, screenId])

  // --- component props -------------------------------------------------------
  const editableProps = target?.component ? (COMPONENT_PROPS[target.component] ?? []) : []

  const changeProp = useCallback(
    (component: string, prop: string, attr: string, next: string) => {
      const el = pinnedRef.current
      if (!el) return
      const old = el.getAttribute(`data-fds-${attr}`) ?? ''
      if (old === next) return
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
      stagePropEdit(slug, screenId, component, prop, old, next, text)
      // No optimistic restyle is possible — the component renders its own
      // classes — but reflecting the attribute keeps the dropdown honest until
      // Apply repaints the real thing.
      el.setAttribute(`data-fds-${attr}`, next)
      repinRef.current = repinOf(el)
      bump()
    },
    [slug, screenId],
  )

  // --- unstaging (pre-apply undo) --------------------------------------------

  const revertEdit = useCallback((edit: Edit) => {
    const attr =
      edit.kind === 'prop'
        ? (COMPONENT_PROPS[edit.component]?.find((p) => p.prop === edit.prop)?.attr ?? edit.prop)
        : undefined
    revertStagedPatch(edit, attr)
    bump()
  }, [])

  const removePending = useCallback(
    (key: string) => {
      const edit = unstage(key)
      if (edit) revertEdit(edit)
    },
    [revertEdit],
  )

  const onUndo = useCallback(() => {
    if (store.pending.length > 0) {
      const edit = unstageLast()
      if (edit) revertEdit(edit)
    } else {
      void undoLast()
    }
  }, [store.pending.length, revertEdit])

  // --- fallback copy string --------------------------------------------------
  const [copied, setCopied] = useState(false)
  const copyFallback = useCallback(() => {
    if (!store.error) return
    const lines = [
      `Amartha Studio · project \`${slug}\` · screen \`${screenId}\``,
      `File: projects/${slug}/screens/${screenId}.tsx (or a helper it imports from lib/)`,
      target
        ? `Element: ${target.component ? `FunDS <${target.component}>` : `<${target.tag}>`}${
            target.text ? ` — text: "${target.text}"` : ''
          }`
        : '',
      `Change: ${store.error.label}`,
      '(Auto-apply could not make this edit — please apply it.)',
    ].filter(Boolean)
    void navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }, [store.error, target, slug, screenId])

  // --- render ----------------------------------------------------------------

  const footer = (
    <>
      <ChangesSection pending={store.pending} onRemove={removePending} />
      <StatusFooter storeError={store.error} onCopy={copyFallback} copied={copied} />
      <ActionsFooter store={store} onUndo={onUndo} />
    </>
  )

  if (!target) {
    return (
      <aside className={shell}>
        <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">
          Edit
        </span>
        <p className="text-14 text-caption dark:text-neutral-400">
          Hover the prototype to highlight an element, click to pin it, then tweak it here. Hold ⌥
          to reach the raw element inside a component.
        </p>
        {footer}
      </aside>
    )
  }

  const rows = target.authored
    .map((a) => classify(a.cls))
    .filter((r): r is EditableRow => r !== null)

  const layoutRows = rows.filter((r) => r.type === 'spacing')
  const shapeRows = rows.filter((r) => r.type === 'radius')
  const sizeRow = rows.find((r) => r.type === 'fontSize')
  const weightRow = rows.find((r) => r.type === 'weight')
  const textColorRow = rows.find((r) => r.type === 'textColor')
  const fillRows = rows.filter((r) => r.type === 'bgColor' || r.type === 'borderColor')

  const hasTextSection = Boolean(sizeRow || weightRow || textColorRow || textEditable)

  const stepperRow = (r: EditableRow, scale: string[]) => {
    const i = scale.indexOf(r.suffix)
    return (
      <div key={r.cls} className="flex items-center justify-between gap-8">
        <RowLabel>{KNOB_LABELS[r.prefix] ?? r.prefix}</RowLabel>
        <Stepper
          value={r.suffix}
          hint={valueForClass(r.cls) ?? undefined}
          canDown={i > 0}
          canUp={i >= 0 && i < scale.length - 1}
          onStep={(dir) => {
            const next = scale[i + dir]
            if (next != null) swapClass(r.cls, `${r.prefix}-${next}`)
          }}
        />
      </div>
    )
  }

  return (
    <aside className={shell}>
      <div className="flex items-center justify-between gap-8">
        <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">
          Edit
        </span>
        {store.busy ? (
          <span className="text-10 text-caption dark:text-neutral-400">Saving…</span>
        ) : null}
      </div>

      {/* Selection: what it is, where it lives, how many it really is. */}
      <div className="flex flex-col gap-4">
        <h2 className="text-16 font-bold text-default dark:text-neutral-50">
          {target.component ?? `<${target.tag}>`}
        </h2>
        <span className="break-all text-10 text-placeholder dark:text-neutral-600">
          projects/{slug}/screens/{screenId}.tsx
        </span>
        {peerCount > 1 ? (
          <span className="text-12 text-caption dark:text-neutral-400">
            Applies to {peerCount} matching items
          </span>
        ) : null}
        {crumbs.length > 1 ? (
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
        ) : null}
      </div>

      {editableProps.length > 0 ? (
        <Section title="Component">
          <div className="flex flex-col gap-8">
            {editableProps.map((p) => {
              const current = pinned?.getAttribute(`data-fds-${p.attr}`) ?? p.values[0]
              return (
                <label key={p.prop} className="flex items-center justify-between gap-8">
                  <RowLabel>{p.prop}</RowLabel>
                  <select
                    value={current}
                    onChange={(e) =>
                      changeProp(target.component ?? '', p.prop, p.attr, e.target.value)
                    }
                    className="rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
                  >
                    {p.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              )
            })}
          </div>
        </Section>
      ) : null}

      {layoutRows.length > 0 ? (
        <Section title="Layout">
          <div className="flex flex-col gap-8">
            {layoutRows.map((r) => stepperRow(r, spacingNames))}
          </div>
        </Section>
      ) : null}

      {shapeRows.length > 0 ? (
        <Section title="Shape">
          <div className="flex flex-col gap-8">
            {shapeRows.map((r) => stepperRow(r, radiusNames))}
          </div>
        </Section>
      ) : null}

      {hasTextSection ? (
        <Section title="Text">
          <div className="flex flex-col gap-8">
            {sizeRow ? stepperRow(sizeRow, fontSizeNames) : null}
            {weightRow ? (
              <div className="flex items-center justify-between gap-8">
                <RowLabel>Weight</RowLabel>
                <div className="flex overflow-hidden rounded-8 border border-default dark:border-ink-700">
                  {fontWeightNames.map((w) => {
                    const on = weightRow.suffix === w
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => swapClass(weightRow.cls, `font-${w}`)}
                        className={`px-8 py-4 text-12 ${
                          on
                            ? 'bg-neutral-50 font-bold text-link dark:bg-ink-800 dark:text-neutral-50'
                            : 'text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50'
                        }`}
                      >
                        {w}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            {textColorRow ? <ColorRow row={textColorRow} label="Color" onSwap={swapClass} /> : null}
            {textEditable ? (
              <div className="flex flex-col gap-4">
                <RowLabel>Content</RowLabel>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      commitText()
                    }
                  }}
                  rows={2}
                  className="w-full rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
                />
                {draftText !== fullText ? (
                  <button
                    type="button"
                    onClick={commitText}
                    disabled={/[<>{}]/.test(draftText) || draftText.trim().length === 0}
                    className="self-start rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800"
                  >
                    Set text
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {fillRows.length > 0 ? (
        <Section title="Fill & border">
          <div className="flex flex-col gap-8">
            {fillRows.map((r) => (
              <ColorRow
                key={r.cls}
                row={r}
                label={r.type === 'bgColor' ? 'Fill' : 'Border'}
                onSwap={swapClass}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {rows.length === 0 && editableProps.length === 0 && !textEditable ? (
        <p className="text-12 text-caption dark:text-neutral-400">
          Nothing tweakable here — this element has no token classes of its own.
          {target.component
            ? ' Its styling belongs to the design system.'
            : ' Try a parent, or hold ⌥ and pick again.'}
        </p>
      ) : null}

      {footer}

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

// --- colour picker row -------------------------------------------------------

function ColorRow({
  row,
  label,
  onSwap,
}: {
  row: EditableRow
  label: string
  onSwap: (oldCls: string, newCls: string) => void
}) {
  // Aliases first (they carry intent), then the raw ramps in declared order.
  const options: { name: string; hex: string }[] = []
  if (row.type === 'textColor') {
    for (const [name, hex] of textAliasEntries) options.push({ name, hex })
  }
  if (row.type === 'borderColor') {
    options.push({ name: 'default', hex: '#E5E7EB' }, { name: 'light', hex: '#F9FAF8' })
  }
  for (const [name, hex] of colorEntries) options.push({ name, hex })

  const current = options.find((o) => o.name === row.suffix)

  return (
    <label className="flex items-center justify-between gap-8">
      <span className="flex min-w-0 items-center gap-4">
        <span
          aria-hidden
          className="inline-block size-12 flex-none rounded-4 border border-default dark:border-ink-700"
          style={{
            backgroundColor: current?.hex ?? tokenForColor(row.suffix, 'text') ?? undefined,
          }}
        />
        <RowLabel>{label}</RowLabel>
      </span>
      <select
        value={row.suffix}
        onChange={(e) => onSwap(row.cls, `${row.prefix}-${e.target.value}`)}
        className="min-w-0 rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
      >
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  )
}

// --- pending changes + apply/undo footer -------------------------------------

function ChangesSection({
  pending,
  onRemove,
}: {
  pending: { key: string; label: string }[]
  onRemove: (key: string) => void
}) {
  if (pending.length === 0) return null
  return (
    <Section title={`Changes · ${pending.length}`}>
      <ul className="flex flex-col gap-4">
        {pending.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-8">
            <span className="min-w-0 break-all text-12 text-default dark:text-neutral-50">
              {p.label}
            </span>
            <button
              type="button"
              onClick={() => onRemove(p.key)}
              aria-label={`Remove ${p.label}`}
              title="Remove this change"
              className="flex size-16 flex-none items-center justify-center rounded-4 text-12 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function ActionsFooter({
  store,
  onUndo,
}: {
  store: ReturnType<typeof getEditStoreState>
  onUndo: () => void
}) {
  const n = store.pending.length
  const lastPending = n > 0 ? store.pending[n - 1] : null
  const lastApplied = store.undo.length > 0 ? store.undo[store.undo.length - 1] : null
  const undoLabel = lastPending
    ? `Undo · ${lastPending.label}`
    : lastApplied
      ? `Undo · ${lastApplied.label}`
      : 'Nothing to undo'

  return (
    <div className="flex flex-col gap-4">
      {/* The one thing a designer must know after Apply: saved ≠ live. Said at
          the moment they'd wonder, not in a doc they'll never open. */}
      {n === 0 && !store.busy && lastApplied ? (
        <p className="text-12 text-caption dark:text-neutral-400">
          Saved to your working copy — not live yet. Say{' '}
          <span className="font-bold">commit</span> or <span className="font-bold">push</span>{' '}
          when you’re ready.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void applyPending()}
        disabled={n === 0 || store.busy}
        className="rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600"
      >
        {store.busy
          ? 'Saving…'
          : n > 0
            ? `Apply ${n} change${n > 1 ? 's' : ''}`
            : 'No changes yet'}
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={(!lastPending && !lastApplied) || store.busy}
        className="rounded-full border border-default bg-neutral-white px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800 dark:disabled:text-neutral-600"
      >
        {undoLabel}
      </button>
    </div>
  )
}

// --- error footer ------------------------------------------------------------

function StatusFooter({
  storeError,
  onCopy,
  copied,
}: {
  storeError: { label: string; reason: string } | null
  onCopy: () => void
  copied: boolean
}) {
  if (!storeError) return null
  return (
    <div className="flex flex-col gap-4 rounded-12 border border-red-200 bg-red-50 p-8">
      <span className="text-12 font-bold text-red-700">Couldn’t apply {storeError.label}</span>
      <span className="text-12 text-red-700">{storeError.reason}</span>
      <div className="flex gap-8">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full border border-red-200 bg-neutral-white px-12 py-4 text-12 font-bold text-red-700 hover:bg-red-50"
        >
          {copied ? 'Copied' : 'Copy for agent'}
        </button>
        <button
          type="button"
          onClick={clearEditError}
          className="rounded-full px-12 py-4 text-12 text-red-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
