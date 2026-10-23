'use client'

// =============================================================================
// Design · the tweaking panel.
//
// Takes the same column the inspector uses, and the same pick layer — edit is
// inspect that can write. Every control enumerates the design system's own
// scale, so the panel is physically incapable of producing an off-system
// value: spacing steps through the 4px grid, radius through the radius ramp,
// colours through named tokens, and FunDS components expose only their
// declared props. Free-form input exists nowhere but text, and text isn't a
// token.
//
// It works on a LAYER (layers.ts) — what the designer wrote, an instance of
// one of the project's components included — and says plainly how far a
// change reaches: this instance only (its properties, its words), every use
// of the component (its own styling), or every row of a list.
//
// Layout mirrors a design-tool inspector on purpose (selection → arrange →
// properties → text → layout → shape → fill), with human labels ("Padding",
// not `p`) — utility-class spellings live in the CSS tab, which is the
// engineer-facing view.
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
import { signIn } from '@/platform/auth/session'
import { PanelShell } from '@/platform/chrome/SidePanel'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, Trash } from '@/design-system/icons'
import { labelOf, resolveTarget } from '@/platform/inspect/resolve'
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
  canHoldDom,
  commitText,
  deleteLayer,
  describeLayer,
  duplicateLayer,
  isRow,
  stageContext,
  stepLayer,
  textPlan,
  unwrapAt,
  unwrapTarget,
  wrapLayers,
  type TextPlan,
} from './actions'
import {
  InsertSection,
  LayoutSection,
  NewElementSection,
  RowLabel,
  SelectionSection,
  TokenField,
  sentenceCase,
} from './DesignSections'
import { layoutOf } from './layout'
import {
  blockOf,
  fileOfSrc,
  getLayerTree,
  getLayersVersion,
  isTextBox,
  layerAt,
  pathOf,
  stepOf,
  styleScope,
  subscribeLayers,
  type Layer,
} from './layers'
import { selectedLayer, selectLayer } from './pick'
import { findRemembered, getSelection, getSelectionServerSnapshot, subscribeSelection } from './selection'
import {
  applyClassSwap,
  applyPropPreview,
  applyShownText,
  countPeers,
  findBySrc,
  peersOf,
  revertStagedPatch,
  srcOf,
} from './applyDom'
import { COMPONENT_PROPS } from './componentProps'
import { factsAt, getFactsVersion, subscribeFacts } from './factsClient'
import { Section } from './DesignSections'
import type { PropChange } from './illustration'
import { IllustrationSection } from './IllustrationSection'
import {
  applyPending,
  canSave,
  canWrite,
  clearDesignError,
  copyChangeList,
  fileOf,
  noteDesignError,
  pushChanges,
  setDesignerName,
  stagedProps,
  unlockEditing,
  type PendingRow,
  getDesignStoreServerSnapshot,
  getDesignStoreState,
  restoreChanges,
  revertAll,
  revertableCount,
  setOnFlushed,
  stageClassEdit,
  stagePropEdit,
  subscribeDesignStore,
  unstage,
  undoLast,
  type Unstaged,
} from './designStore'
import { diskPath } from '@/platform/dbProjects/active'

export interface DesignPanelProps {
  pinned: Element | null
  onPin: (el: Element | null) => void
  slug: string
  screenId: string
  className?: string
  onMinimize?: () => void
  /** The Edit mode's tabs, drawn in this panel's header. */
  tabs?: React.ReactNode
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

// --- can this element be written at all? -------------------------------------

/**
 * Why a selected element has no controls, or null when it can be edited.
 *
 * Only for what isn't a layer: hold ⌥ and the pick layer reaches inside a
 * FunDS component, which the CSS tab needs; but only what the project wrote
 * has an address, and `design-system/` is never stamped. Saying why teaches
 * the rule instead of showing controls that do nothing.
 */
type Lock =
  | { kind: 'component'; owner: Element | null }
  | { kind: 'inherited'; project: string }
  | { kind: 'unstamped' }

function lockOf(el: Element, slug: string): Lock | null {
  const src = srcOf(el)
  if (!src) {
    const boundary = el.closest('[data-fds]')
    if (!boundary) return { kind: 'unstamped' }
    // The component itself is addressable when the project wrote it — the
    // stamp rides its forwarded props onto its root.
    return { kind: 'component', owner: srcOf(boundary) ? boundary : null }
  }
  // A screen inherited through `extends` is stamped with its base project's
  // path. The write route refuses it anyway; saying so up front is kinder.
  const file = src.split(':').slice(0, -2).join(':')
  if (!file.startsWith(`projects/${slug}/`)) {
    return { kind: 'inherited', project: file.split('/')[1] ?? 'another project' }
  }
  return null
}

function LockNotice({ lock, onPin }: { lock: Lock; onPin: (el: Element | null) => void }) {
  if (lock.kind === 'component') {
    return (
      <div className="flex flex-col gap-8 rounded-12 bg-neutral-50 p-8 dark:bg-ink-800">
        <span className="text-12 text-default dark:text-neutral-50">
          This is inside a component — change it with the component’s props instead.
        </span>
        {lock.owner ? (
          <button
            type="button"
            onClick={() => onPin(lock.owner)}
            className="self-start rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-default hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800"
          >
            Select {labelOf(lock.owner)}
          </button>
        ) : null}
      </div>
    )
  }
  return (
    <p className="rounded-12 bg-neutral-50 p-8 text-12 text-default dark:bg-ink-800 dark:text-neutral-50">
      {lock.kind === 'inherited'
        ? `This comes from ${lock.project}, which this prototype builds on — it can’t be changed from here.`
        : 'This belongs to the studio, not the prototype, so there is nothing here to change.'}
    </p>
  )
}

const zero = () => 0

const CHIP =
  'self-start rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-default hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800'

// --- the panel ---------------------------------------------------------------

export function DesignPanel({
  pinned,
  onPin,
  slug,
  screenId,
  className,
  onMinimize,
  tabs,
}: DesignPanelProps) {
  const shell = { title: 'Design', tabs, onMinimize, className }
  const store = useSyncExternalStore(
    subscribeDesignStore,
    getDesignStoreState,
    getDesignStoreServerSnapshot,
  )

  const extra = useSyncExternalStore(subscribeSelection, getSelection, getSelectionServerSnapshot)
  // The screen's layers and the source's facts both arrive on their own; the
  // panel re-reads when either does.
  const layersVersion = useSyncExternalStore(subscribeLayers, getLayersVersion, zero)
  const factsVersion = useSyncExternalStore(subscribeFacts, getFactsVersion, zero)

  // Optimistic swaps mutate the DOM outside React's sight; bumping this after
  // each one re-runs resolveTarget so the panel shows what's now on screen.
  const [version, bump] = useReducer((x: number) => x + 1, 0)

  // A recorded list only exists in this tab, so it is read back per project as
  // soon as the panel knows which one it is looking at.
  useEffect(() => restoreChanges(slug), [slug])

  const layer = useMemo(
    () => selectedLayer(pinned),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, layersVersion, version],
  )
  const select = useCallback((l: Layer | null) => selectLayer(l, onPin), [onPin])
  const extraLayers = useMemo(
    () => extra.map((el) => layerAt(el)).filter((l): l is Layer => l !== null && l !== layer),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extra, layer, layersVersion],
  )

  const target = useMemo(
    () => (pinned ? resolveTarget(pinned) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, version],
  )

  // How many elements one write to the box's own classes really changes: N for
  // a list's rows or a component's insides, 1 otherwise.
  const peerCount = useMemo(
    () => {
      const src = pinned ? srcOf(pinned) : null
      return src ? countPeers(src) : 0
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, version, layersVersion],
  )

  const pinnedSrc = pinned ? srcOf(pinned) : null
  const pinnedFile = pinnedSrc ? fileOf(pinnedSrc) : null

  // --- re-pin across fast refresh -------------------------------------------
  const pinnedRef = useRef<Element | null>(pinned)
  pinnedRef.current = pinned
  /** The address of the pinned element, so it can be re-found after a write
   *  remounts the screen. Survives fast refresh; the DOM node does not. */
  const repinRef = useRef<string | null>(null)

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
        // The layer it was, by what it looks like, before the first box with
        // its address: every StatCell's frame shares one.
        const found = findRemembered(getLayerTree().all)?.hosts[0] ?? findBySrc(wanted)
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
      // No address means the element came from design-system/ or platform/,
      // which are never stamped. Unaddressable is unselectable (§ Vocabulary).
      const src = srcOf(el)
      if (!src) return
      stageClassEdit(stageContext(el, slug, screenId), src, oldRendered, newClass)
      applyClassSwap(src, oldRendered, newClass)
      repinRef.current = src
      bump()
    },
    [slug, screenId],
  )

  // --- text --------------------------------------------------------------------
  // The words a layer shows, and where they are written (actions.textPlan): on
  // the element, on one use of a component, or in the project's data.
  const plan: TextPlan | null = useMemo(
    () => (layer ? textPlan(layer, slug) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layer, slug, factsVersion, version],
  )
  const fullText = pinned && isTextBox(pinned) ? (pinned.textContent ?? '').replace(/\s+/g, ' ').trim() : ''
  const textEditable = Boolean(plan && plan.kind !== 'none' && fullText.length > 0 && fullText.length <= 200)
  const [draftText, setDraftText] = useState('')
  const [insertOpen, setInsertOpen] = useState(false)
  useEffect(() => setDraftText(fullText), [fullText, pinned])

  const saveText = useCallback(() => {
    if (!layer || draftText.trim() === fullText) return
    void commitText(layer, draftText, slug, screenId).then((why) => {
      if (why) noteDesignError('that text', why)
      bump()
    })
  }, [layer, draftText, fullText, slug, screenId])

  // --- component props -------------------------------------------------------
  const editableProps = target?.component ? (COMPONENT_PROPS[target.component] ?? []) : []

  const changeProp = useCallback(
    (component: string, prop: string, attr: string, next: string) => {
      const el = pinnedRef.current
      if (!el) return
      const src = srcOf(el)
      if (!src) return
      const old = el.getAttribute(`data-fds-${attr}`) ?? ''
      if (old === next) return
      stagePropEdit(stageContext(el, slug, screenId), src, component, prop, old, next)
      for (const peer of peersOf(src)) applyPropPreview(peer, component, prop, old, next)
      repinRef.current = src
      bump()
    },
    [slug, screenId],
  )

  // An Illustration swap adds, changes and removes props in one go. Nothing to
  // preview: the image only changes once the file does.
  const swapIllustration = useCallback(
    (changes: PropChange[]) => {
      const el = pinnedRef.current
      if (!el) return
      const src = srcOf(el)
      if (!src) return
      for (const c of changes) {
        stagePropEdit(stageContext(el, slug, screenId), src, 'Illustration', c.prop, c.old, c.next)
      }
      repinRef.current = src
      bump()
    },
    [slug, screenId],
  )

  // --- unstaging (pre-apply undo) --------------------------------------------

  const revertEdit = useCallback((unstaged: Unstaged) => {
    revertStagedPatch(unstaged)
    bump()
  }, [])

  const removePending = useCallback(
    (key: string) => {
      const edit = unstage(key)
      if (edit) revertEdit(edit)
    },
    [revertEdit],
  )

  const onRevert = useCallback(() => {
    for (const unstaged of revertAll()) revertStagedPatch(unstaged)
    bump()
  }, [])

  // --- fallback copy string --------------------------------------------------
  const [copied, setCopied] = useState(false)
  const copyFallback = useCallback(() => {
    if (!store.error) return
    // Refused changes stay staged, so the whole list is the useful thing to
    // hand on — every line carries its own address.
    if (store.pending.length > 0) {
      void copyChangeList().then((ok) => {
        if (!ok) return
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      return
    }
    const lines = [
      `Amartha Studio · project \`${slug}\` · screen \`${screenId}\``,
      `File: ${diskPath(pinnedFile ?? `projects/${slug}/screens/${screenId}.tsx`)}`,
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
  }, [store.error, store.pending.length, target, slug, screenId, pinnedFile])

  // --- render ----------------------------------------------------------------

  const footer = (
    <>
      <ChangesSection
        pending={store.pending}
        screenId={screenId}
        onRemove={removePending}
        locked={store.pushed}
      />
      <StatusFooter
        storeError={store.error}
        onCopy={store.instant ? undefined : copyFallback}
        copied={copied}
        onDiscard={store.pending.length > 0 ? onRevert : undefined}
      />
      <div className="border-t border-default dark:border-ink-700" />
      <ActionsFooter store={store} onRevert={onRevert} />
    </>
  )

  const insert = (
    <InsertSection
      layer={layer}
      slug={slug}
      screenId={screenId}
      onChanged={bump}
      open={insertOpen}
      onOpen={setInsertOpen}
    />
  )

  if (!target) {
    return (
      <PanelShell {...shell}>
        {insert}
        {footer}
        <p className="text-10 text-caption dark:text-neutral-400">
          Click to select — double-click to go inside, ⌘-click to reach straight in. Drag to move. Enter and ⇧Enter
          step in and out, Tab moves along. Double-click text to type over it.
        </p>
      </PanelShell>
    )
  }

  const heading = (
    <SelectionHeader
      layer={layer}
      fallback={target.component ?? `<${target.tag}>`}
      file={layer?.node ? fileOfSrc(layer.node.src) : (pinnedFile ?? `projects/${slug}/screens/${screenId}.tsx`)}
      defined={layer?.kind === 'instance' && pinnedFile && layer.node && pinnedFile !== fileOfSrc(layer.node.src) ? pinnedFile : null}
      onSelect={select}
    />
  )

  // A new element — staged, not yet written — is edited through its staged
  // definition, since it has no address to aim a value edit at.
  if (layer?.kind === 'new') {
    return (
      <PanelShell {...shell}>
        {heading}
        {extraLayers.length > 0 ? (
          <SelectionSection layers={[layer, ...extraLayers]} slug={slug} screenId={screenId} onChanged={bump} />
        ) : null}
        <NewElementSection el={target.el} onChanged={bump} />
        <LayoutSection el={target.el} slug={slug} screenId={screenId} onChanged={bump} />
        {insert}
        {footer}
      </PanelShell>
    )
  }

  // What isn't a layer at all: inside a FunDS component (⌥-click), or chrome.
  const lock = layer ? (layer.node && !fileOfSrc(layer.node.src).startsWith(`projects/${slug}/`) ? lockOf(target.el, slug) : null) : lockOf(target.el, slug)
  if (lock || !layer) {
    return (
      <PanelShell {...shell}>
        {heading}
        {lock ? <LockNotice lock={lock} onPin={onPin} /> : null}
        {footer}
      </PanelShell>
    )
  }

  // A list: one place in the layout, many rows. It moves as a whole; its rows
  // are styled through any one of them.
  if (layer.kind === 'list') {
    return (
      <PanelShell {...shell}>
        {heading}
        <ScopeNote>
          Every row comes from one piece of code and the screen’s data. Move, copy or delete the list here; select a
          row to restyle all of them at once.
        </ScopeNote>
        <ArrangeSection layer={layer} slug={slug} screenId={screenId} structure={store.structure.length} />
        {insert}
        {footer}
      </PanelShell>
    )
  }

  const rows = target.authored
    .map((a) => classify(a.cls))
    .filter((r): r is EditableRow => r !== null)

  // A stack's own gap and padding are Auto layout's, not free-standing spacing
  // knobs: two controls staging two edits against one class would refuse each
  // other.
  const stacked = canHoldDom(target.el) && layoutOf(Array.from(target.el.classList)).direction !== null
  const ownedByStack = ['gap', 'p', 'px', 'py']
  const layoutRows = rows.filter((r) => r.type === 'spacing' && !(stacked && ownedByStack.includes(r.prefix)))
  const shapeRows = rows.filter((r) => r.type === 'radius')
  const sizeRow = rows.find((r) => r.type === 'fontSize')
  const weightRow = rows.find((r) => r.type === 'weight')
  const textColorRow = rows.find((r) => r.type === 'textColor')
  const fillRows = rows.filter((r) => r.type === 'bgColor' || r.type === 'borderColor')
  const styled = Boolean(pinnedSrc)
  const hasTextStyle = styled && Boolean(sizeRow || weightRow || textColorRow)

  // How far a change to this box's own styling reaches.
  const scope = styleScope(layer)
  const listOf = layer.list

  // Same field as Auto layout's: the label above, the value in a box, the
  // scale in a menu.
  const tokenRow = (r: EditableRow, scale: string[]) => {
    const name = KNOB_LABELS[r.prefix] ?? (r.type === 'fontSize' ? 'Size' : r.prefix)
    return (
      <div key={r.cls} className="flex min-w-0 flex-col gap-4" title={valueForClass(r.cls) ?? undefined}>
        <RowLabel>{name}</RowLabel>
        <TokenField
          label={name}
          value={r.suffix}
          options={scale.map((v) => ({ value: v, label: v }))}
          chevron
          onPick={(v) => {
            if (v !== r.suffix) swapClass(r.cls, `${r.prefix}-${v}`)
          }}
        />
      </div>
    )
  }

  return (
    <PanelShell {...shell}>
      {store.busy ? (
        <span className="text-10 text-caption dark:text-neutral-400">Saving…</span>
      ) : null}

      {heading}

      {/* How far a change reaches, said before anything is changed. */}
      {listOf ? (
        <ScopeNote action={{ label: 'Select the list', run: () => select(listOf) }}>
          One of {listOf.children.length} rows from a list — style changes apply to every row.
        </ScopeNote>
      ) : layer.inside && layer.inside !== layer ? (
        <ScopeNote action={{ label: `Select the ${layer.inside.name}`, run: () => select(layer.inside) }}>
          Part of {layer.inside.name}’s own design — changes here change every {layer.inside.name}.
        </ScopeNote>
      ) : peerCount > 1 ? (
        <span className="text-12 text-caption dark:text-neutral-400">Applies to {peerCount} matching items</span>
      ) : null}

      {extraLayers.length > 0 ? (
        <SelectionSection layers={[layer, ...extraLayers]} slug={slug} screenId={screenId} onChanged={bump} />
      ) : null}

      <ArrangeSection layer={layer} slug={slug} screenId={screenId} structure={store.structure.length} />

      {layer.kind === 'instance' ? (
        <InstanceSection layer={layer} slug={slug} screenId={screenId} onChanged={bump} />
      ) : null}

      {textEditable ? (
        <Section title="Text">
          <div className="flex flex-col gap-4">
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  saveText()
                }
              }}
              rows={2}
              aria-label="Text"
              className="w-full rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
            />
            <span className="text-10 text-placeholder dark:text-neutral-600">{whereWritten(plan, layer)}</span>
            {draftText.trim() !== fullText ? (
              <button type="button" onClick={saveText} disabled={draftText.trim().length === 0} className={CHIP}>
                Set text
              </button>
            ) : null}
          </div>
        </Section>
      ) : plan?.kind === 'none' && plan.reason && fullText ? (
        <Section title="Text">
          <span className="text-12 text-caption dark:text-neutral-400">{plan.reason}</span>
        </Section>
      ) : null}

      {/* Everything below styles the box itself — for an instance, that is the
          component's own design. */}
      {scope === layer && styled ? (
        <ScopeNote>Styles below are {layer.name}’s own — changing them changes every {layer.name}.</ScopeNote>
      ) : null}

      {styled ? <LayoutSection el={target.el} slug={slug} screenId={screenId} onChanged={bump} /> : null}

      {editableProps.length > 0 && styled ? (
        <Section title="Component">
          <div className="grid grid-cols-2 gap-8">
            {editableProps.map((p) => {
              const current = pinned?.getAttribute(`data-fds-${p.attr}`) ?? p.values[0]
              return (
                <div key={p.prop} className="flex min-w-0 flex-col gap-4">
                  <RowLabel>{p.prop}</RowLabel>
                  <TokenField
                    label={sentenceCase(p.prop)}
                    value={current}
                    options={p.values.map((v) => ({ value: v, label: v }))}
                    chevron
                    onPick={(v) => changeProp(target.component ?? '', p.prop, p.attr, v)}
                  />
                  {/* Honesty over silence: these change something the preview
                      can't fake, so say when it will actually show up. */}
                  {!p.classes && !p.artwork ? (
                    <span className="text-10 text-placeholder dark:text-neutral-600">
                      Shows once saved
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Section>
      ) : null}

      {target.component === 'Illustration' && styled ? (
        <IllustrationSection el={target.el} onSwap={swapIllustration} />
      ) : null}

      {layoutRows.length > 0 && styled ? (
        <Section title="Spacing">
          <div className="grid grid-cols-2 gap-8">
            {layoutRows.map((r) => tokenRow(r, spacingNames))}
          </div>
        </Section>
      ) : null}

      {shapeRows.length > 0 && styled ? (
        <Section title="Shape">
          <div className="grid grid-cols-2 gap-8">
            {shapeRows.map((r) => tokenRow(r, radiusNames))}
          </div>
        </Section>
      ) : null}

      {hasTextStyle ? (
        <Section title="Text style">
          <div className="grid grid-cols-2 gap-8">
            {sizeRow ? tokenRow(sizeRow, fontSizeNames) : null}
            {weightRow ? (
              <div className="flex min-w-0 flex-col gap-4">
                <RowLabel>Weight</RowLabel>
                <TokenField
                  label="Weight"
                  value={weightRow.suffix}
                  options={fontWeightNames.map((w) => ({ value: w, label: sentenceCase(w) }))}
                  chevron
                  onPick={(w) => {
                    if (w !== weightRow.suffix) swapClass(weightRow.cls, `font-${w}`)
                  }}
                />
              </div>
            ) : null}
            {textColorRow ? <ColorRow row={textColorRow} label="Color" onSwap={swapClass} /> : null}
          </div>
        </Section>
      ) : null}

      {fillRows.length > 0 && styled ? (
        <Section title="Fill & border">
          <div className="grid grid-cols-2 gap-8">
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

      {rows.length === 0 && editableProps.length === 0 && !textEditable && layer.kind !== 'instance' ? (
        <p className="text-12 text-caption dark:text-neutral-400">
          No styling of its own here.
          {target.component ? ' Its look belongs to the design system.' : ' Try the layer around it.'}
        </p>
      ) : null}

      {insert}

      {footer}

      <button
        type="button"
        onClick={() => select(null)}
        className="rounded-full px-16 py-8 text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
      >
        Clear selection
      </button>
    </PanelShell>
  )
}

/** Where typing over this text writes, said under the field. */
function whereWritten(plan: TextPlan | null, layer: Layer): string {
  if (!plan) return ''
  switch (plan.kind) {
    case 'text':
      return plan.scope ? `Changes every ${plan.scope.name}.` : 'Written right here.'
    case 'prop':
      return `Changes this ${plan.component} only.`
    case 'find':
      return 'Written in the screen’s data — it is looked up when you set it.'
    case 'wait':
      return 'Reading where this text is written…'
    default:
      return layer.inside ? `Part of ${layer.inside.name}.` : ''
  }
}

// --- the selection's header ------------------------------------------------------

const KIND_LABEL: Record<Layer['kind'], string> = {
  instance: 'Component',
  component: 'FunDS',
  element: 'Element',
  list: 'List',
  new: 'New — not saved yet',
  copy: 'Copy — saving',
}

function SelectionHeader({
  layer,
  fallback,
  file,
  defined,
  onSelect,
}: {
  layer: Layer | null
  fallback: string
  file: string
  /** For an instance: where its component is written, when elsewhere. */
  defined: string | null
  onSelect: (l: Layer) => void
}) {
  const path = layer ? pathOf(layer) : []
  const short = (f: string) => diskPath(f).split('/').slice(-2).join('/')
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-8">
        <h2 className="min-w-0 truncate text-16 font-bold text-default dark:text-neutral-50">{layer?.name ?? fallback}</h2>
        {layer ? (
          <span className="flex-none text-10 font-bold uppercase text-caption dark:text-neutral-400">
            {layer.kind === 'list' ? `${KIND_LABEL.list} · ${layer.children.length}` : KIND_LABEL[layer.kind]}
          </span>
        ) : null}
      </div>
      <span className="break-all text-10 text-placeholder dark:text-neutral-600" title={diskPath(file)}>
        {short(file)}
        {defined ? ` · its design is in ${short(defined)}` : ''}
      </span>
      {/* Every layer around the selection, so any of them is one click away. */}
      {path.length > 1 ? (
        <nav aria-label="Selection path" className="flex flex-wrap items-center gap-2">
          {path.map((l, i) => (
            <span key={l.id} className="flex items-center gap-2">
              {i > 0 ? <span className="text-10 text-placeholder dark:text-neutral-600">›</span> : null}
              <button
                type="button"
                onClick={() => onSelect(l)}
                className={`max-w-120 truncate rounded-4 px-4 py-2 text-10 hover:bg-neutral-50 dark:hover:bg-ink-800 ${
                  l === layer ? 'font-bold text-link dark:text-neutral-50' : 'text-caption dark:text-neutral-400'
                }`}
              >
                {l.name}
              </button>
            </span>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

/** A quiet line saying how far a change reaches, with a way to the bigger
 *  thing when there is one. */
function ScopeNote({ children, action }: { children: React.ReactNode; action?: { label: string; run: () => void } }) {
  return (
    <div className="flex flex-col gap-4 rounded-8 bg-neutral-50 px-8 py-8 dark:bg-ink-800">
      <span className="text-12 text-default dark:text-neutral-50">{children}</span>
      {action ? (
        <button type="button" onClick={action.run} className={CHIP}>
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

// --- one use of a component --------------------------------------------------------

const QUIET_PROPS = new Set(['key', 'className', 'children', 'style', 'id'])

/**
 * The props this use of a component is written with — Figma's instance
 * overrides. A plain value can be changed here and changes this use only;
 * one worked out by code is listed, so it isn't a mystery why it can't.
 */
function InstanceSection({
  layer,
  slug,
  screenId,
  onChanged,
}: {
  layer: Layer
  slug: string
  screenId: string
  onChanged: () => void
}) {
  const node = layer.node
  if (!node) return null
  const facts = factsAt(slug, node.src, node.version)
  if (!facts) {
    return (
      <Section title="Properties">
        <span className="text-12 text-caption dark:text-neutral-400">Reading how this {layer.name} is written…</span>
      </Section>
    )
  }
  const staged = stagedProps(node.src)
  const plain = Object.entries(facts.props).filter(([k]) => !QUIET_PROPS.has(k) && !k.startsWith('data-'))
  const coded = facts.exprProps.filter((k) => !QUIET_PROPS.has(k) && !/^on[A-Z]/.test(k) && k !== '...')
  if (plain.length === 0 && coded.length === 0) return null

  const ctx = { slug, screenId, version: node.version ?? undefined }
  /** A text box inside the instance showing exactly `words` — what a string
   *  prop's preview rewrites. */
  const shownIn = (words: string): string | null => {
    const inside: Layer[] = []
    const visit = (l: Layer) => {
      for (const k of l.children) {
        inside.push(k)
        visit(k)
      }
    }
    visit(layer)
    const hit = inside.find((l) => isTextBox(l.hosts[0]) && l.text === words && l.node)
    return hit?.node?.src ?? (isTextBox(layer.hosts[0]) && layer.text === words ? (srcOf(layer.hosts[0]) ?? null) : null)
  }

  return (
    <Section title="Properties">
      <div className="flex flex-col gap-8">
        {plain.map(([prop, value]) => {
          const pending = staged.get(prop)
          const now = pending === undefined ? value : (pending ?? '')
          if (typeof value === 'boolean') {
            const on = String(now) === 'true'
            return (
              <label key={prop} className="flex cursor-pointer items-center justify-between gap-8 text-12 text-default dark:text-neutral-50">
                {sentenceCase(prop)}
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    stagePropEdit(ctx, node.src, layer.name, prop, String(value), String(e.target.checked), undefined, 'boolean')
                    onChanged()
                  }}
                  className="size-16 accent-blue-500"
                />
              </label>
            )
          }
          return (
            <PropText
              key={prop}
              label={sentenceCase(prop)}
              value={String(now)}
              numeric={typeof value === 'number'}
              onCommit={(next) => {
                if (typeof value === 'number') {
                  stagePropEdit(ctx, node.src, layer.name, prop, String(value), next, undefined, 'number')
                } else {
                  const shows = shownIn(String(now))
                  stagePropEdit(ctx, node.src, layer.name, prop, String(value), next, shows ?? undefined)
                  if (shows) applyShownText(shows, String(now), next)
                }
                onChanged()
              }}
            />
          )
        })}
        {coded.length > 0 ? (
          <span className="text-10 text-placeholder dark:text-neutral-600">
            Set by code: {coded.join(', ')}
          </span>
        ) : null}
        <span className="text-10 text-placeholder dark:text-neutral-600">Changes this {layer.name} only.</span>
      </div>
    </Section>
  )
}

function PropText({
  label,
  value,
  numeric,
  onCommit,
}: {
  label: string
  value: string
  numeric: boolean
  onCommit: (next: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? value
  const ok = numeric ? /^-?\d+(\.\d+)?$/.test(shown) : shown.length > 0 && shown.length <= 200 && !/["{}<>\\\n]/.test(shown)
  const commit = () => {
    if (draft === null) return
    setDraft(null)
    if (ok && draft !== value) onCommit(draft)
  }
  return (
    <label className="flex flex-col gap-4">
      <RowLabel>{label}</RowLabel>
      <input
        value={shown}
        inputMode={numeric ? 'numeric' : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(null)
        }}
        className={`rounded-8 border bg-neutral-white px-8 py-4 text-12 text-default dark:bg-ink-900 dark:text-neutral-50 ${
          ok ? 'border-default dark:border-ink-700' : 'border-red-500'
        }`}
      />
    </label>
  )
}

// --- arrange (D2) ------------------------------------------------------------

const ARRANGE_BTN =
  'flex-1 rounded-full border border-default bg-neutral-white px-8 py-4 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800 dark:disabled:text-neutral-600'

/**
 * Move, duplicate, delete — the same actions as the keyboard and a drag, as
 * buttons, so they can be found. `structure` is only there to re-render when
 * the staged list changes: whether there is a neighbour to move past depends
 * on the overlay, which React doesn't see.
 */
function ArrangeSection({
  layer,
  slug,
  screenId,
}: {
  layer: Layer
  slug: string
  screenId: string
  structure: number
}) {
  const blocked = layer.kind === 'new' ? null : blockOf(layer, slug)
  const up = blocked ? null : stepOf(layer, -1)
  const down = blocked ? null : stepOf(layer, 1)
  const unwrapFrom = unwrapTarget(layer, slug)
  // Steps follow the stack's own axis, as the arrow keys do.
  const row = isRow(layer.hosts[0]?.parentElement ?? null)

  return (
    <Section title="Arrange">
      <div className="flex flex-col gap-8">
        <div className="flex gap-4">
          {[
            {
              label: row ? 'Move left' : 'Move up',
              hint: up ? `${row ? 'Before' : 'Above'} ${describeLayer(up.past)} (${row ? '←' : '↑'})` : 'Already first',
              Glyph: row ? ArrowLeft : ArrowUp,
              disabled: !up,
              run: () => stepLayer(layer, -1, slug, screenId),
            },
            {
              label: row ? 'Move right' : 'Move down',
              hint: down ? `${row ? 'After' : 'Below'} ${describeLayer(down.past)} (${row ? '→' : '↓'})` : 'Already last',
              Glyph: row ? ArrowRight : ArrowDown,
              disabled: !down,
              run: () => stepLayer(layer, 1, slug, screenId),
            },
            {
              label: 'Duplicate',
              hint: 'Duplicate (⌘D)',
              Glyph: Copy,
              disabled: Boolean(blocked) || layer.kind === 'new',
              run: () => duplicateLayer(layer, slug, screenId),
            },
            {
              label: 'Delete',
              hint: 'Delete (⌫)',
              Glyph: Trash,
              disabled: Boolean(blocked),
              run: () => deleteLayer(layer, slug, screenId),
            },
          ].map(({ label, hint, Glyph, disabled, run }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={hint}
              disabled={disabled}
              onClick={run}
              className={`${ARRANGE_BTN} flex items-center justify-center`}
            >
              <Glyph size={16} />
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            className={ARRANGE_BTN}
            disabled={Boolean(blocked) || layer.kind === 'list'}
            title="Wrap in a stack (⌥⌘G)"
            onClick={() => wrapLayers([layer], slug, screenId)}
          >
            Wrap
          </button>
          <button
            type="button"
            className={ARRANGE_BTN}
            disabled={!unwrapFrom}
            title={
              unwrapFrom === layer
                ? 'Replace this stack with what it holds (⇧⌘G)'
                : unwrapFrom
                  ? `Replace the ${describeLayer(unwrapFrom)} this sits in with what it holds (⇧⌘G)`
                  : 'Not a plain stack, and not inside one'
            }
            onClick={() => unwrapAt(layer, slug, screenId)}
          >
            {unwrapFrom && unwrapFrom !== layer ? 'Unwrap parent' : 'Unwrap'}
          </button>
        </div>
        {blocked ? <span className="text-10 text-caption dark:text-neutral-400">{blocked}</span> : null}
      </div>
    </Section>
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
    <div className="flex min-w-0 flex-col gap-4">
      <RowLabel>{label}</RowLabel>
      <TokenField
        label={label}
        glyph={
          <span
            aria-hidden
            className="inline-block size-16 flex-none rounded-4 border border-default dark:border-ink-700"
            style={{
              backgroundColor: current?.hex ?? tokenForColor(row.suffix, 'text') ?? undefined,
            }}
          />
        }
        value={row.suffix}
        options={options.map((o) => ({ value: o.name, label: o.name }))}
        chevron
        onPick={(v) => {
          if (v !== row.suffix) onSwap(row.cls, `${row.prefix}-${v}`)
        }}
      />
    </div>
  )
}

// --- pending changes + apply/undo footer -------------------------------------

function ChangesSection({
  pending,
  screenId,
  onRemove,
  locked,
}: {
  pending: PendingRow[]
  /** The screen on show, so changes made elsewhere can say where they were. */
  screenId: string
  onRemove: (key: string) => void
  /** Pushed: the list is a record now, not something to edit. */
  locked: boolean
}) {
  if (pending.length === 0) return null
  return (
    <Section title={`Changes · ${pending.length}`}>
      <ul className="flex flex-col gap-4">
        {pending.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-8">
            <span className="min-w-0 break-all text-12 text-default dark:text-neutral-50">
              {p.label}
              {p.screenId !== screenId ? (
                <span className="text-placeholder dark:text-neutral-600"> · {p.screenId}</span>
              ) : null}
            </span>
            {locked ? null : (
              <button
                type="button"
                onClick={() => onRemove(p.key)}
                aria-label={`Remove ${p.label}`}
                title="Remove this change"
                className="flex size-16 flex-none items-center justify-center rounded-4 text-12 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

const PRIMARY =
  'rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600'
const SECONDARY =
  'rounded-full border border-default bg-neutral-white px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800 dark:disabled:text-neutral-600'
const NOTE = 'text-12 text-caption dark:text-neutral-400'

const plural = (n: number) => `${n} change${n === 1 ? '' : 's'}`

/**
 * One list, and what can be done with it here:
 *
 *   dev server — each change saves itself, into the database project or
 *                the git working copy; only Undo is left to show. A git
 *                project's Push bar, below, sends it live.
 *   the link   — Push writes it and sends it live, in one press. The editing
 *                password and who is editing are asked THEN, inline, and the
 *                push carries on once they are answered — never up front,
 *                where answering them used to swap the list out.
 *   anywhere   — Copy hands it on; Revert takes it all back.
 */
function ActionsFooter({
  store,
  onRevert,
}: {
  store: ReturnType<typeof getDesignStoreState>
  onRevert: () => void
}) {
  const [copied, setCopied] = useState(false)
  /** The link's questions, asked when Push is pressed. */
  const [asking, setAsking] = useState<'signin' | 'password' | 'name' | null>(null)
  const [confirming, setConfirming] = useState(false)
  const n = store.pending.length
  const writable = canSave(store)
  const linked = writable && store.backend === 'github'
  const revertable = revertableCount(store)
  const saved = store.backend === 'fs' ? store.undo.reduce((k, u) => k + u.count, 0) : 0

  // A second tap confirms; left alone, the question goes away.
  useEffect(() => {
    if (!confirming) return
    const t = window.setTimeout(() => setConfirming(false), 3000)
    return () => window.clearTimeout(t)
  }, [confirming])

  const copy = useCallback(() => {
    void copyChangeList().then((ok) => {
      if (!ok) return
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }, [])

  /** Push, asking first for whatever this browser hasn't answered yet. */
  const push = useCallback(() => {
    const now = getDesignStoreState()
    if (now.needsSignIn) return setAsking('signin')
    if (now.needsPassword) return setAsking('password')
    // Signed in, the name is the account's; `locked` already says why not.
    if (!canWrite(now)) return setAsking(now.signedIn ? null : 'name')
    setAsking(null)
    void pushChanges()
  }, [])

  const revert = () => {
    if (!confirming) return setConfirming(true)
    setConfirming(false)
    onRevert()
  }

  // What happens next differs by where the changes go, and each is worth
  // saying at the moment the designer would wonder — not in a doc.
  let note: React.ReactNode = null
  if (store.backend === 'record') {
    note =
      n > 0
        ? 'This is a shared link, so these changes aren’t saved anywhere. Copy them and send them over to be applied.'
        : 'This is a shared link, so tweaks here are for describing a change, not saving one.'
  } else if (store.locked) {
    note = store.locked
  } else if (linked && store.landed) {
    note = 'It’s landed. The link picks it up in a couple of minutes — refresh then.'
  } else if (linked && store.pushed) {
    note = 'Pushed. It goes live on its own in a few minutes — these stay on screen until it does.'
  } else if (!linked && n === 0 && !store.busy && saved > 0) {
    note = (
      <>
        Saved — not live yet. <span className="font-bold">Push</span> below when you’re ready.
      </>
    )
  }

  // The dev server saves each change as it is made — on a database project a
  // save is already live, in a git project it waits for Push: the footer is
  // just where that stands, and Undo.
  if (store.instant && writable) {
    const status = store.busy || n > 0 ? 'Saving…' : saved > 0 ? (store.live ? 'Saved — live on the link' : 'Saved') : null
    return (
      <div className="flex flex-col gap-4">
        {store.needsSignIn ? <SignInStep onCancel={() => undefined} /> : null}
        {store.needsPassword ? <PasswordStep onUnlocked={() => undefined} onCancel={() => undefined} /> : null}
        {status && !store.error ? <p className={NOTE}>{status}</p> : null}
        {store.undo.length > 0 ? (
          <button type="button" onClick={() => void undoLast()} disabled={store.busy} className={SECONDARY}>
            Undo
          </button>
        ) : null}
      </div>
    )
  }

  const empty = n === 0 && !store.pushed
  const primary = !writable ? (
    <button type="button" onClick={copy} disabled={n === 0 || store.busy} className={PRIMARY}>
      {n === 0 ? 'No changes yet' : copied ? 'Copied' : `Copy ${plural(n)}`}
    </button>
  ) : linked ? (
    <button type="button" onClick={push} disabled={empty || store.busy || store.pushed} className={PRIMARY}>
      {store.busy ? 'Pushing…' : store.pushed ? 'Pushed' : empty ? 'No changes yet' : `Push ${plural(n)}`}
    </button>
  ) : (
    <button type="button" onClick={() => void applyPending()} disabled={empty || store.busy} className={PRIMARY}>
      {store.busy ? 'Saving…' : empty ? 'No changes yet' : `Save ${plural(n)}`}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      {note ? <p className={NOTE}>{note}</p> : null}
      {linked && asking === 'signin' && !store.pushed ? <SignInStep onCancel={() => setAsking(null)} /> : null}
      {linked && asking === 'password' && !store.pushed ? (
        <PasswordStep onUnlocked={push} onCancel={() => setAsking(null)} />
      ) : null}
      {linked && asking === 'name' && !store.pushed ? (
        <NameStep
          owners={store.owners}
          onChoose={(name) => {
            setDesignerName(name)
            push()
          }}
          onCancel={() => setAsking(null)}
        />
      ) : null}
      {primary}
      {writable && n > 0 && !store.pushed ? (
        <button type="button" onClick={copy} disabled={store.busy} className={SECONDARY}>
          {copied ? 'Copied' : `Copy ${plural(n)}`}
        </button>
      ) : null}
      {revertable > 0 ? (
        <button
          type="button"
          onClick={revert}
          disabled={store.busy}
          className={`rounded-full px-16 py-4 text-12 font-bold disabled:cursor-not-allowed disabled:text-placeholder ${
            confirming ? 'text-red-700 dark:text-red-400' : 'text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50'
          }`}
        >
          {confirming ? `Revert ${plural(revertable)}?` : `Revert ${plural(revertable)}`}
        </button>
      ) : null}
      {linked && store.name && canWrite(store) && !store.pushed ? (
        <p className="text-center text-10 text-placeholder dark:text-neutral-600">
          Pushing as {store.name}.{' '}
          <button type="button" className="underline" onClick={() => setDesignerName(null)}>
            Not you?
          </button>
        </p>
      ) : null}
    </div>
  )
}

// --- asked at Push (github) ----------------------------------------------------

/**
 * Sign-in is how this link saves (platform/auth). Google sign-in leaves the
 * page, so the list rides it out in localStorage (§ surviving a refresh) and
 * Push is pressed again on the way back.
 */
function SignInStep({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-12 border border-default p-8 dark:border-ink-700">
      <span className="text-12 font-bold text-default dark:text-neutral-50">Sign in to push</span>
      <button type="button" className={SECONDARY} onClick={() => signIn()}>
        Continue with Google
      </button>
      <span className={NOTE}>Pushing from this link needs your Amartha Google account. Your changes stay as they are.</span>
      <button type="button" className={`${NOTE} self-start`} onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}

/**
 * The studio is open to view; pushing from it needs the editing password
 * (STUDIO_EDIT_PASSWORD). Asked once per browser, the first time Push is
 * pressed; the push carries on once it is accepted.
 */
function PasswordStep({ onUnlocked, onCancel }: { onUnlocked: () => void; onCancel: () => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value || busy) return
    setBusy(true)
    const reason = await unlockEditing(value)
    setBusy(false)
    setError(reason)
    if (!reason) onUnlocked()
  }
  return (
    <form className="flex flex-col gap-4 rounded-12 border border-default p-8 dark:border-ink-700" onSubmit={(e) => void submit(e)}>
      <span className="text-12 font-bold text-default dark:text-neutral-50">Editing password</span>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="current-password"
        aria-label="Editing password"
        autoFocus
        className="rounded-8 border border-neutral-200 bg-neutral-white px-8 py-4 text-12 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-white"
      />
      <span className={error ? 'text-12 text-red-700' : NOTE}>
        {error ?? 'Pushing from this link needs the editing password. Your changes stay as they are.'}
      </span>
      <div className="flex gap-8">
        <button type="submit" className={`flex-1 ${SECONDARY}`} disabled={!value || busy}>
          {busy ? 'Checking…' : 'Continue'}
        </button>
        <button type="button" className={`${NOTE} px-8`} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

/**
 * A push lands in someone's name, so the first one asks whose — once per
 * browser. Only the project's owners are offered: anyone else copies the
 * changes and sends them on.
 */
function NameStep({
  owners,
  onChoose,
  onCancel,
}: {
  owners: string[]
  onChoose: (name: string) => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-12 border border-default p-8 dark:border-ink-700">
      <span className="text-12 font-bold text-default dark:text-neutral-50">Who’s pushing?</span>
      {owners.map((o) => (
        <button key={o} type="button" className={SECONDARY} onClick={() => onChoose(o)}>
          I’m {o}
        </button>
      ))}
      <span className={NOTE}>
        Only {owners.join(' and ')} can push this project. Anyone else can copy the changes and send them on.
      </span>
      <button type="button" className={`${NOTE} self-start`} onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}

// --- error footer ------------------------------------------------------------

function StatusFooter({
  storeError,
  onCopy,
  copied,
  onDiscard,
}: {
  storeError: { label: string; reason: string; title?: string } | null
  /** Absent on a database project: there is no agent to hand a list to. */
  onCopy?: () => void
  copied: boolean
  /** Present while refused changes are still staged. */
  onDiscard?: () => void
}) {
  if (!storeError) return null
  return (
    <div className="flex flex-col gap-4 rounded-12 border border-red-200 bg-red-50 p-8">
      <span className="text-12 font-bold text-red-700">
        {storeError.title ?? `Couldn’t apply ${storeError.label}`}
      </span>
      <span className="text-12 text-red-700">{storeError.reason}</span>
      <div className="flex gap-8">
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border border-red-200 bg-neutral-white px-12 py-4 text-12 font-bold text-red-700 hover:bg-red-50"
          >
            {copied ? 'Copied' : 'Copy for agent'}
          </button>
        ) : null}
        {onDiscard ? (
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-full px-12 py-4 text-12 font-bold text-red-700"
          >
            Discard changes
          </button>
        ) : null}
        <button
          type="button"
          onClick={clearDesignError}
          className="rounded-full px-12 py-4 text-12 text-red-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
