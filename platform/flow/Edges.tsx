'use client'

// =============================================================================
// SVG edges between flow nodes (WS-B, task 3).
// Edges stay hidden until a screen is selected: clicking a node reveals only
// that node's outgoing edges — "where can this screen lead?" — which keeps a
// dense graph readable. Each arrow leaves the source's right side and enters
// the target's left side in horizontal and vertical runs only, rounded where it
// turns, and travels through the gaps the layout keeps clear (layout.ts): the
// gutter after the source's column, the gap above the target's row, the gutter
// before the target's column. Optional labels sit on the longest run. Purely
// presentational — colours come from token classes via CSS vars.
//
// An arrow starts at the button that makes the move (origins.ts): a dot marks
// the button's right edge, and the line crosses the screen to leave it. Those
// parts sit over the screens, so they're drawn in a second layer (`over`)
// after the nodes; the routes between screens stay under them.
//
// Lines, dots, arrowheads and labels keep one size on screen at any zoom —
// everything here is divided by it — while the routes follow the canvas.
// An arrow whose button isn't on the screen as shown — another state, or a
// target worked out at run time — starts dashed from the screen's edge.
// =============================================================================

import { Fragment } from 'react'
import type { FlowLayout, FlowNode } from './layout'
import { leftAnchor, rightAnchor } from './layout'
import { COL_GAP, EDGE_RADIUS, ROW_GAP, type NodeBox } from './geometry'
import type { OriginBox, Origins } from './origins'

interface EdgesProps {
  layout: FlowLayout
  /** Selected screen id — only its outgoing edges are drawn. */
  selected: string | null
  /** The device's node geometry — where an edge meets a node box. */
  box: NodeBox
  /** Where each of the selection's arrows starts; a target missing here isn't measured yet. */
  origins: Origins
  /** 'under' the screens: the routes between them. 'over': the origins on the selected screen. */
  layer: 'under' | 'over'
  /** The canvas zoom — strokes and marks are drawn at 1/zoom to stay one size on screen. */
  zoom: number
}

type Point = { x: number; y: number }

/** The corners an arrow passes through, from the source's anchor to the target's. */
function route(from: FlowNode, to: FlowNode, box: NodeBox, startY?: number): Point[] {
  const a = { x: from.x + box.nodeW, y: startY ?? rightAnchor(from, box).y }
  const b = leftAnchor(to, box)
  const out = a.x + COL_GAP / 2
  const inn = b.x - COL_GAP / 2
  const nextColumn = b.x > a.x && b.x - a.x <= COL_GAP + 1
  // The neighbouring column: straight across, or one step in the gutter between.
  if (nextColumn) return Math.abs(a.y - b.y) < 1 ? [a, b] : [a, { x: out, y: a.y }, { x: out, y: b.y }, b]
  // Anywhere else — further right, back left, another lane: out into the
  // gutter, along the gap above the target's row, down the gutter before it.
  const lane = to.y - ROW_GAP / 2
  return [a, { x: out, y: a.y }, { x: out, y: lane }, { x: inn, y: lane }, { x: inn, y: b.y }, b]
}

/** An SVG path through `points`, each corner rounded. */
function roundedPath(points: Point[]): string {
  // Drop repeats and points that don't turn, so every corner left is a real one.
  const pts = points.filter((p, i) => {
    const prev = points[i - 1]
    const next = points[i + 1]
    if (prev && prev.x === p.x && prev.y === p.y) return false
    if (!prev || !next) return true
    return !((prev.x === p.x && p.x === next.x) || (prev.y === p.y && p.y === next.y))
  })
  const dist = (p: Point, q: Point) => Math.hypot(q.x - p.x, q.y - p.y)
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [p0, p1, p2] = [pts[i - 1], pts[i], pts[i + 1]]
    const r = Math.min(EDGE_RADIUS, dist(p0, p1) / 2, dist(p1, p2) / 2)
    const toward = (p: Point, q: Point) => ({ x: (q.x - p.x) / dist(p, q), y: (q.y - p.y) / dist(p, q) })
    const u = toward(p0, p1)
    const v = toward(p1, p2)
    d += ` L ${p1.x - u.x * r} ${p1.y - u.y * r} Q ${p1.x} ${p1.y} ${p1.x + v.x * r} ${p1.y + v.y * r}`
  }
  const last = pts[pts.length - 1]
  return `${d} L ${last.x} ${last.y}`
}

/** The middle of the longest run — where a label reads clearest. */
function labelAt(points: Point[]): Point {
  let best = { x: points[0].x, y: points[0].y, len: -1 }
  for (let i = 1; i < points.length; i++) {
    const [p, q] = [points[i - 1], points[i]]
    const len = Math.hypot(q.x - p.x, q.y - p.y)
    if (len > best.len) best = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, len }
  }
  return best
}

/** The origin's box in canvas coordinates, and the point its arrow leaves from. */
function originOf(from: FlowNode, o: OriginBox) {
  const rect = { x: from.x + o.x, y: from.y + o.y, w: o.w, h: o.h }
  return { rect, start: { x: rect.x + rect.w, y: rect.y + rect.h / 2 } }
}

export function Edges({ layout, selected, box, origins, layer, zoom }: EdgesProps) {
  const k = 1 / zoom
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
      {layer === 'under' ? (
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
      ) : null}

      {outgoing.map((link, i) => {
        const from = byId.get(link.from)
        const to = byId.get(link.to)
        if (!from || !to) return null

        const measured = link.to in origins
        const origin = origins[link.to] ? originOf(from, origins[link.to]!) : null

        if (layer === 'over') {
          if (!origin) return null
          return (
            <g key={`${link.from}->${link.to}-${i}`}>
              <path
                d={`M ${origin.start.x} ${origin.start.y} L ${from.x + box.nodeW} ${origin.start.y}`}
                className="stroke-primary-500"
                strokeWidth={2 * k}
              />
              <circle cx={origin.start.x} cy={origin.start.y} r={4 * k} className="fill-primary-500" />
            </g>
          )
        }

        const points = route(from, to, box, origin?.start.y)
        const d = roundedPath(points)
        const { x: midX, y: midY } = labelAt(points)

        return (
          <Fragment key={`${link.from}->${link.to}-${i}`}>
            <path
              d={d}
              fill="none"
              className="stroke-primary-500"
              strokeWidth={2 * k}
              strokeLinejoin="round"
              strokeDasharray={measured && !origin ? `${6 * k} ${6 * k}` : undefined}
              markerEnd="url(#flow-arrow-active)"
            />
            {link.label ? (
              <g>
                <rect
                  x={midX - (link.label.length * 3.2 + 4) * k}
                  y={midY - 9 * k}
                  width={(link.label.length * 6.4 + 8) * k}
                  height={16 * k}
                  rx={4 * k}
                  className="fill-neutral-white stroke-primary-200 dark:fill-ink-800 dark:stroke-ink-700"
                  strokeWidth={k}
                />
                <text
                  x={midX}
                  y={midY + 3 * k}
                  textAnchor="middle"
                  className="fill-primary-500 dark:fill-primary-200"
                  style={{ fontSize: 10 * k, fontWeight: 500 }}
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
