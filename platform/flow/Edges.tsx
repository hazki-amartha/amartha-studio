'use client'

// =============================================================================
// SVG edges between flow nodes (WS-B, task 3).
// Edges stay hidden until a screen is selected: clicking a node reveals only
// that node's outgoing edges — "where can this screen lead?" — which keeps a
// dense graph readable. Cubic beziers from the source's right anchor to the
// target's left anchor, with optional labels. Purely presentational — colours
// come from token classes via CSS vars.
// =============================================================================

import { Fragment } from 'react'
import type { FlowLayout, FlowNode } from './layout'
import { leftAnchor, rightAnchor } from './layout'

interface EdgesProps {
  layout: FlowLayout
  /** Selected screen id — only its outgoing edges are drawn. */
  selected: string | null
}

function edgePath(from: FlowNode, to: FlowNode): string {
  const a = rightAnchor(from)
  const b = leftAnchor(to)
  // If the target sits left of / level with the source (back-edge), route out
  // to the right and loop back so the curve stays legible.
  const forward = b.x >= a.x
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5)
  const c1x = a.x + dx
  const c2x = forward ? b.x - dx : b.x - dx
  return `M ${a.x} ${a.y} C ${c1x} ${a.y}, ${c2x} ${b.y}, ${b.x} ${b.y}`
}

export function Edges({ layout, selected }: EdgesProps) {
  if (!selected) return null

  const byId = new Map(layout.nodes.map((n) => [n.screen.id, n] as const))
  const outgoing = layout.links.filter((l) => l.from === selected)
  if (outgoing.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 overflow-visible text-primary-500"
      width={layout.width}
      height={layout.height}
      aria-hidden
    >
      <defs>
        <marker
          id="flow-arrow-active"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary-500" />
        </marker>
      </defs>

      {outgoing.map((link, i) => {
        const from = byId.get(link.from)
        const to = byId.get(link.to)
        if (!from || !to) return null

        const d = edgePath(from, to)
        const a = rightAnchor(from)
        const b = leftAnchor(to)
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2

        return (
          <Fragment key={`${link.from}->${link.to}-${i}`}>
            <path
              d={d}
              fill="none"
              className="stroke-primary-500"
              strokeWidth={2}
              markerEnd="url(#flow-arrow-active)"
            />
            {link.label ? (
              <g>
                <rect
                  x={midX - link.label.length * 3.2 - 4}
                  y={midY - 9}
                  width={link.label.length * 6.4 + 8}
                  height={16}
                  rx={4}
                  className="fill-neutral-white stroke-primary-200"
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={midY + 2}
                  textAnchor="middle"
                  className="fill-primary-500"
                  style={{ fontSize: 10, fontWeight: 500 }}
                >
                  {link.label}
                </text>
              </g>
            ) : null}
          </Fragment>
        )
      })}
    </svg>
  )
}
