'use client'

// =============================================================================
// Inspect · the layers outline panel.
//
// Takes the left column — the side a design tool puts layers on — while inspect
// or edit is running, mirroring how the inspector takes the right. States and
// layers are never wanted at once: one is for presenting a prototype, the other
// for taking it apart.
//
// It exists because hovering is not a complete way to select. Small elements,
// overlapped elements, and the wrappers that carry the padding you want to
// change are all easy to point at and miss — and a designer who lands on the
// wrong node has no way to see what else was available. The outline makes the
// whole screen selectable from a list, and shows where the current selection
// sits in the structure.
//
// The tree is rebuilt from the DOM on mutation rather than tracked
// incrementally: screens remount on navigation, states rewrite them wholesale,
// and edit mode patches classes underneath. One debounced rebuild covers every
// one of those without the panel knowing which happened.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PanelShell } from '@/platform/chrome/SidePanel'
import {
  ComponentIcon,
  FrameIcon,
  ListIcon,
  MediaIcon,
  TextIcon,
} from '@/platform/chrome/icons'
import { buildOutline, pathTo, type NodeIcon, type OutlineNode } from './tree'

/** One glyph per layer kind, so a long outline can be scanned rather than read. */
const KIND_ICON: Record<NodeIcon, (props: { className?: string }) => React.ReactNode> = {
  component: ComponentIcon,
  frame: FrameIcon,
  text: TextIcon,
  media: MediaIcon,
  list: ListIcon,
}

export interface LayersPanelProps {
  pinned: Element | null
  onPin: (el: Element | null) => void
  /** Drives the device's hover highlight from the list. */
  onHover: (el: Element | null) => void
  className?: string
  onMinimize?: () => void
}

const REBUILD_DELAY = 150

/** Rebuilds the outline whenever the rendered screen changes. */
function useOutline(): OutlineNode[] {
  const [nodes, setNodes] = useState<OutlineNode[]>([])

  useEffect(() => {
    const root = document.querySelector('[data-inspect]')
    if (!root) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const rebuild = () => setNodes(buildOutline(root))

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(rebuild, REBUILD_DELAY)
    }

    rebuild()
    // The highlight overlay lives inside this root and rewrites its own
    // geometry every animation frame. Left unfiltered those writes reset the
    // debounce forever and the tree would never rebuild at all.
    const mo = new MutationObserver((records) => {
      const real = records.some((r) => {
        const target = r.target instanceof Element ? r.target : r.target.parentElement
        return !target?.closest('[data-inspect-layer]')
      })
      if (real) schedule()
    })
    mo.observe(root, { childList: true, subtree: true, attributes: true })

    return () => {
      mo.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [])

  return nodes
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

function Row({
  node,
  depth,
  pinned,
  collapsed,
  onToggle,
  onPin,
  onHover,
}: {
  node: OutlineNode
  depth: number
  pinned: Element | null
  collapsed: Set<Element>
  onToggle: (el: Element) => void
  onPin: (el: Element) => void
  onHover: (el: Element | null) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const isPinned = node.el === pinned
  const hasChildren = node.children.length > 0
  const open = hasChildren && !collapsed.has(node.el)
  const Glyph = KIND_ICON[node.icon]

  // Bring the selection into view when it was made in the device, not here.
  useEffect(() => {
    if (isPinned) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [isPinned])

  return (
    <>
      <div
        ref={rowRef}
        className={`flex items-center gap-2 rounded-4 pr-4 ${
          isPinned
            ? 'bg-primary-50 dark:bg-ink-800'
            : 'hover:bg-neutral-50 dark:hover:bg-ink-800'
        }`}
        style={{ paddingLeft: depth * 12 }}
        onMouseEnter={() => onHover(node.el)}
        onMouseLeave={() => onHover(null)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.el)}
            aria-expanded={open}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="flex size-16 flex-none items-center justify-center text-placeholder hover:text-default dark:text-neutral-600 dark:hover:text-neutral-50"
          >
            <Chevron open={open} />
          </button>
        ) : (
          <span aria-hidden className="size-16 flex-none" />
        )}

        <button
          type="button"
          onClick={() => onPin(node.el)}
          className="flex min-w-0 flex-1 items-center gap-4 py-2 text-left"
        >
          <Glyph
            className={`size-12 flex-none ${
              node.kind === 'component'
                ? 'text-link dark:text-neutral-400'
                : 'text-placeholder dark:text-neutral-600'
            }`}
          />
          <span
            className={`truncate text-12 ${
              node.kind === 'component'
                ? isPinned
                  ? 'font-bold text-link dark:text-neutral-50'
                  : 'font-bold text-default dark:text-neutral-50'
                : node.kind === 'text'
                  ? 'text-caption dark:text-neutral-400'
                  : 'text-default dark:text-neutral-50'
            }`}
          >
            {node.kind === 'text' ? `“${node.label}”` : node.label}
          </span>
          {node.detail ? (
            <span className="truncate text-10 text-placeholder dark:text-neutral-600">
              {node.detail}
            </span>
          ) : null}
        </button>
      </div>

      {open
        ? node.children.map((child, i) => (
            <Row
              key={i}
              node={child}
              depth={depth + 1}
              pinned={pinned}
              collapsed={collapsed}
              onToggle={onToggle}
              onPin={onPin}
              onHover={onHover}
            />
          ))
        : null}
    </>
  )
}

export function LayersPanel({
  pinned,
  onPin,
  onHover,
  className,
  onMinimize,
}: LayersPanelProps) {
  const nodes = useOutline()
  const [collapsed, setCollapsed] = useState<Set<Element>>(new Set())

  const toggle = useCallback((el: Element) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(el)) next.delete(el)
      else next.add(el)
      return next
    })
  }, [])

  // A selection made in the device must be reachable in the list, so reveal it
  // by opening anything collapsed above it.
  const path = useMemo(() => (pinned ? pathTo(nodes, pinned) : []), [nodes, pinned])
  useEffect(() => {
    if (path.length < 2) return
    setCollapsed((prev) => {
      const ancestors = path.slice(0, -1).filter((n) => prev.has(n.el))
      if (ancestors.length === 0) return prev
      const next = new Set(prev)
      for (const n of ancestors) next.delete(n.el)
      return next
    })
  }, [path])

  return (
    <PanelShell
      title="Layers"
      onMinimize={onMinimize}
      className={className}
      onMouseLeave={() => onHover(null)}
    >
      {nodes.length === 0 ? (
        <p className="text-12 text-caption dark:text-neutral-400">Nothing on this screen yet.</p>
      ) : (
        <div className="flex flex-col">
          {nodes.map((node, i) => (
            <Row
              key={i}
              node={node}
              depth={0}
              pinned={pinned}
              collapsed={collapsed}
              onToggle={toggle}
              onPin={onPin}
              onHover={onHover}
            />
          ))}
        </div>
      )}
    </PanelShell>
  )
}
