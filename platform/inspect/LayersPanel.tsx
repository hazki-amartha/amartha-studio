'use client'

// =============================================================================
// Inspect · the layers outline panel.
//
// Docks in the shell's sidebar as the Layers tab beside Screens — the side a
// design tool puts layers on — while edit is running, mirroring how the tool
// panel takes the right. With the sidebar hidden it falls back to the
// prototype's own left column instead.
//
// It exists because hovering is not a complete way to select. Small elements,
// overlapped elements, and the wrappers that carry the padding you want to
// change are all easy to point at and miss — and a designer who lands on the
// wrong node has no way to see what else was available. The outline makes the
// whole screen selectable from a list, and shows where the current selection
// sits in the structure.
//
// It lists the screen's LAYERS (platform/design/layers.ts) — what the source
// writes, one row per element or component used, in the source's nesting —
// rather than a guess at the page's markup. A component the project wrote is
// one row; its own insides sit under a quiet "own layers" row, closed until
// asked for, because changing them changes every use of it. A `.map()` is one
// List row holding its rows. Rows are keyed by layer, so what is open stays
// open while the screen re-renders underneath.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { PanelShell } from '@/platform/chrome/SidePanel'
import {
  ComponentIcon,
  FrameIcon,
  ListIcon,
  MediaIcon,
  TextIcon,
} from '@/platform/chrome/icons'
import {
  getLayersVersion,
  getLayerTree,
  isTextBox,
  layerOfPin,
  pathOf,
  subscribeLayers,
  watchLayers,
  type Layer,
} from '@/platform/design/layers'
import { rememberedLayerId } from '@/platform/design/selection'

export type DropWhere = 'before' | 'after' | 'inside'

/**
 * Rearranging from the list — only in design mode, where the caller passes it.
 * The panel knows rows and pointer positions; what a drop MEANS (and whether
 * it is allowed) is the caller's.
 */
export interface LayersDrag {
  canDrag: (layer: Layer) => boolean
  accepts: (dragged: Layer, target: Layer, where: DropWhere) => boolean
  onDrop: (dragged: Layer, target: Layer, where: DropWhere) => void
}

export interface LayersPanelProps {
  pinned: Element | null
  /** Select a layer from the list; shift adds it to a multi-selection. */
  onSelect: (layer: Layer, add: boolean) => void
  /** Drives the device's hover highlight from the list. */
  onHover: (boxes: readonly Element[] | null) => void
  className?: string
  onMinimize?: () => void
  drag?: LayersDrag
  /** Docked in the sidebar: no card header — the sidebar's tabs name it. */
  embedded?: boolean
  /** Which project and screen — what is open is remembered per screen. */
  memoryKey?: string
}

interface DragState {
  dragged: Layer | null
  over: { id: string; where: DropWhere } | null
}

/** The rows a layer opens to: what is written inside it, then — for a
 *  component the project wrote — its own layers, kept apart. */
function partsOf(layer: Layer): { own: Layer[]; inner: Layer[] } {
  if (layer.kind !== 'instance') return { own: layer.children, inner: [] }
  const own: Layer[] = []
  const inner: Layer[] = []
  for (const k of layer.children) (k.inside === layer ? inner : own).push(k)
  return { own, inner }
}

/** What is open, per project and screen, for the life of the page. */
const openMemory = new Map<string, Set<string>>()

function glyphOf(layer: Layer) {
  if (layer.kind === 'instance' || layer.kind === 'component') return ComponentIcon
  if (layer.kind === 'list') return ListIcon
  const host = layer.hosts[0]
  if (host && isTextBox(host)) return TextIcon
  if (layer.name === 'Image' || layer.name === 'Icon' || layer.name === 'Divider') return MediaIcon
  return FrameIcon
}

/** The words that tell one row from its siblings. */
function detailOf(layer: Layer): string {
  if (layer.kind === 'list') return `${layer.children.length} rows`
  if (layer.kind === 'new') return 'not saved yet'
  if (layer.kind === 'copy') return 'copy'
  const host = layer.hosts[0]
  if (layer.kind === 'element' && host && isTextBox(host)) return ''
  // Only a layer with nothing listed under it: anything with rows beneath
  // would just repeat their words, run together.
  return layer.children.length === 0 ? layer.text.slice(0, 32) : ''
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={open ? 'rotate-90' : ''}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

interface RowProps {
  layer: Layer
  depth: number
  selected: Layer | null
  open: Set<string>
  onToggle: (id: string) => void
  onSelect: (layer: Layer, add: boolean) => void
  onHover: (boxes: readonly Element[] | null) => void
  drag?: LayersDrag
  dragState: DragState
  setDragState: (next: DragState) => void
  /** Inside a component's own layers: drawn quieter. */
  quiet?: boolean
}

function Row(props: RowProps) {
  const { layer, depth, selected, open, onToggle, onSelect, onHover, drag, dragState, setDragState, quiet } = props
  const rowRef = useRef<HTMLDivElement>(null)
  const isSelected = layer === selected
  const { own, inner } = partsOf(layer)
  const hasChildren = own.length > 0 || inner.length > 0
  const isOpen = hasChildren && open.has(layer.id)
  const innerKey = `${layer.id}::own`
  const innerOpen = open.has(innerKey)
  const Glyph = glyphOf(layer)
  const draggable = Boolean(drag?.canDrag(layer))
  const over = dragState.over?.id === layer.id ? dragState.over.where : null
  const text = layer.hosts[0] && isTextBox(layer.hosts[0]) && layer.kind === 'element'
  const detail = detailOf(layer)

  // Top and bottom thirds drop beside the row; the middle drops into it, when
  // it can take children. Dropping onto yourself or your own contents is not a
  // place at all.
  const whereAt = (e: React.DragEvent<HTMLDivElement>): DropWhere | null => {
    const dragged = dragState.dragged
    if (!drag || !dragged || dragged === layer) return null
    const r = e.currentTarget.getBoundingClientRect()
    const f = (e.clientY - r.top) / r.height
    // An open container's next row is its own first child, so below its middle
    // reads as "into it", not "after all of it".
    const intoBand = isOpen ? f > 0.3 : f > 0.25 && f < 0.75
    if (intoBand && drag.accepts(dragged, layer, 'inside')) return 'inside'
    const beside: DropWhere = f < 0.5 ? 'before' : 'after'
    return drag.accepts(dragged, layer, beside) ? beside : null
  }

  // Bring the selection into view when it was made in the device, not here.
  useEffect(() => {
    if (isSelected) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [isSelected])

  const child = (l: Layer, q: boolean) => (
    <Row key={l.id} {...props} layer={l} depth={depth + 1} quiet={q} />
  )

  return (
    <>
      <div
        ref={rowRef}
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          // Firefox will not start a drag without data.
          e.dataTransfer.setData('text/plain', layer.name)
          setDragState({ dragged: layer, over: null })
        }}
        onDragOver={(e) => {
          const where = whereAt(e)
          if (!where) return
          e.preventDefault()
          if (over !== where) setDragState({ ...dragState, over: { id: layer.id, where } })
        }}
        onDrop={(e) => {
          const where = whereAt(e)
          const dragged = dragState.dragged
          setDragState({ dragged: null, over: null })
          if (!where || !dragged || !drag) return
          e.preventDefault()
          drag.onDrop(dragged, layer, where)
        }}
        onDragEnd={() => setDragState({ dragged: null, over: null })}
        className={`relative flex items-center gap-4 rounded-8 pr-8 ${
          over === 'inside'
            ? 'outline outline-2 outline-primary-500'
            : isSelected
              ? 'bg-primary-50 dark:bg-ink-800'
              : 'hover:bg-neutral-50 dark:hover:bg-ink-800'
        } ${dragState.dragged === layer ? 'opacity-50' : ''}`}
        // 16px a level, so the nesting reads at a glance in a roomy row.
        style={{ paddingLeft: 4 + depth * 16 }}
        onMouseEnter={() => onHover(layer.hosts)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Drawn over the row, not as a border: a border moves the row under
            the pointer, which flips the drop target back and forth. */}
        {over === 'before' || over === 'after' ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 h-2 bg-primary-500 ${
              over === 'before' ? 'top-0' : 'bottom-0'
            }`}
          />
        ) : null}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(layer.id)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            className="flex size-16 flex-none items-center justify-center text-placeholder hover:text-default dark:text-neutral-600 dark:hover:text-neutral-50"
          >
            <Chevron open={isOpen} />
          </button>
        ) : (
          <span aria-hidden className="size-16 flex-none" />
        )}

        <button
          type="button"
          onClick={(e) => onSelect(layer, e.shiftKey)}
          className="flex min-w-0 flex-1 items-center gap-8 py-8 text-left"
        >
          <Glyph
            className={`size-16 flex-none ${
              layer.kind === 'instance'
                ? 'text-primary-500 dark:text-primary-300'
                : layer.kind === 'component'
                  ? 'text-link dark:text-neutral-400'
                  : 'text-placeholder dark:text-neutral-500'
            }`}
          />
          <span
            className={`min-w-0 truncate text-14 ${
              isSelected
                ? 'font-bold text-link dark:text-neutral-50'
                : quiet
                  ? 'text-caption dark:text-neutral-500'
                  : layer.kind === 'instance' || layer.kind === 'component'
                    ? 'font-bold text-default dark:text-neutral-50'
                    : text
                      ? 'text-caption dark:text-neutral-500'
                      : 'text-default dark:text-neutral-400'
            } ${layer.kind === 'new' || layer.kind === 'copy' ? 'italic' : ''}`}
          >
            {text ? `“${layer.text}”` : layer.name}
          </span>
          {/* The rest of the row, after the name has what it needs. */}
          {detail ? (
            <span className="min-w-0 flex-1 truncate text-12 text-placeholder dark:text-neutral-600">{detail}</span>
          ) : null}
        </button>
      </div>

      {isOpen ? own.map((l) => child(l, Boolean(quiet))) : null}
      {isOpen && inner.length > 0 ? (
        <>
          <div className="flex items-center gap-4 pr-8" style={{ paddingLeft: 4 + (depth + 1) * 16 }}>
            <button
              type="button"
              onClick={() => onToggle(innerKey)}
              aria-expanded={innerOpen}
              className="flex min-w-0 flex-1 items-center gap-4 py-4 text-left text-12 text-placeholder hover:text-default dark:text-neutral-600 dark:hover:text-neutral-50"
              title={`Changing these changes every ${layer.name}`}
            >
              <span className="flex size-16 flex-none items-center justify-center">
                <Chevron open={innerOpen} />
              </span>
              <span className="truncate">{layer.name}’s own layers</span>
            </button>
          </div>
          {innerOpen ? inner.map((l) => <Row key={l.id} {...props} layer={l} depth={depth + 2} quiet />) : null}
        </>
      ) : null}
    </>
  )
}

/** The screen's layers, rebuilt as the screen changes — Edit open or not. */
function useLayers(): Layer[] {
  useEffect(() => watchLayers(), [])
  const version = useSyncExternalStore(subscribeLayers, getLayersVersion, () => 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getLayerTree().roots, [version])
}

export function LayersPanel({
  pinned,
  onSelect,
  onHover,
  className,
  onMinimize,
  drag,
  embedded,
  memoryKey = '',
}: LayersPanelProps) {
  const roots = useLayers()
  const version = useSyncExternalStore(subscribeLayers, getLayersVersion, () => 0)
  const [open, setOpen] = useState<Set<string>>(() => openMemory.get(memoryKey) ?? new Set())
  const [dragState, setDragState] = useState<DragState>({ dragged: null, over: null })
  useEffect(() => setOpen(openMemory.get(memoryKey) ?? new Set()), [memoryKey])

  const toggle = useCallback(
    (id: string) => {
      setOpen((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        openMemory.set(memoryKey, next)
        return next
      })
    },
    [memoryKey],
  )

  const selected = useMemo(
    () => layerOfPin(pinned, rememberedLayerId()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, version],
  )

  // The screen's own top level starts open, and so does the way to the
  // selection — wherever it was made.
  useEffect(() => {
    const want = [...roots, ...(selected ? pathOf(selected).slice(0, -1) : [])]
    setOpen((prev) => {
      const missing = want.filter((l) => !prev.has(l.id) && l.children.length > 0)
      // A component's own layers open too, when the way to the selection
      // goes through them.
      const path = selected ? pathOf(selected) : []
      const inner = path
        .filter((l, i) => l.kind === 'instance' && path[i + 1]?.inside === l)
        .map((l) => `${l.id}::own`)
        .filter((k) => !prev.has(k))
      if (missing.length === 0 && inner.length === 0) return prev
      const next = new Set(prev)
      for (const l of missing) next.add(l.id)
      for (const k of inner) next.add(k)
      openMemory.set(memoryKey, next)
      return next
    })
  }, [roots, selected, memoryKey])

  const tree =
    roots.length === 0 ? (
      <p className="px-8 text-12 text-caption dark:text-neutral-400">Nothing on this screen yet.</p>
    ) : (
      <div className="flex flex-col gap-2">
        {roots.map((layer) => (
          <Row
            key={layer.id}
            layer={layer}
            depth={0}
            selected={selected}
            open={open}
            onToggle={toggle}
            onSelect={onSelect}
            onHover={onHover}
            drag={drag}
            dragState={dragState}
            setDragState={setDragState}
          />
        ))}
      </div>
    )

  if (embedded) {
    return (
      <div className={className} onMouseLeave={() => onHover(null)}>
        {tree}
      </div>
    )
  }

  return (
    <PanelShell
      title="Layers"
      onMinimize={onMinimize}
      className={className}
      onMouseLeave={() => onHover(null)}
    >
      {tree}
    </PanelShell>
  )
}

