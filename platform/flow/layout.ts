// =============================================================================
// Auto-layout for the flow canvas (WS-B).
//
// Lanes. A project whose screens carry a `section` gets one horizontal lane per
// section, in the order the sidebar lists them — the screens without one first,
// in a lane of their own with no label. A project without sections is one
// unlabelled lane. Inside a lane, screens are columns by BFS over the lane's own
// flowsTo edges: the entry (or the first screen nothing in the lane leads to)
// starts at the left, and each further piece of the lane — another flow, a
// screen nothing reaches — starts in the next free column after it. Edges
// between lanes don't place anything; they're drawn across.
//
// Rows line up. A lane's screens sit top-aligned on one row grid, so the gaps
// between columns and between rows are always clear of screens — Edges.tsx
// routes its arrows through them. Pages are drawn full length (ScreenThumb), so
// a row is as tall as its longest page. When no screen declares any (resolvable)
// flowsTo edge and there are no sections, we fall back to a plain grid.
// =============================================================================

import type { ScreenDef } from '@/platform/types'
import { COL_GAP, LANE_GAP, LANE_HEAD, ROW_GAP, TITLE_H, type NodeBox } from './geometry'

export interface FlowNode {
  screen: ScreenDef
  col: number
  row: number
  /** Top-left of the node box in canvas coordinates. */
  x: number
  y: number
  /** The node's full height — its title strip and its page, however long. */
  h: number
}

export interface FlowLink {
  from: string
  to: string
  label?: string
}

/** One section's band across the canvas. */
export interface FlowLane {
  /** undefined for the screens without a section. */
  section?: string
  /** Top of the lane, its label included. */
  y: number
  height: number
}

export interface FlowLayout {
  nodes: FlowNode[]
  links: FlowLink[]
  /** Section bands, top to bottom — empty when the project has no sections. */
  lanes: FlowLane[]
  width: number
  height: number
  /** True when there were no resolvable edges and we used the grid fallback. */
  isGrid: boolean
}

/** Anchor points on a node box, in canvas coordinates. */
export function rightAnchor(n: FlowNode, box: NodeBox) {
  return { x: n.x + box.nodeW, y: n.y + TITLE_H + box.thumbH / 2 }
}
export function leftAnchor(n: FlowNode, box: NodeBox) {
  return { x: n.x, y: n.y + TITLE_H + box.thumbH / 2 }
}

/** Resolvable links only — edges whose target exists in the project. */
function resolveLinks(screens: ScreenDef[]): FlowLink[] {
  const ids = new Set(screens.map((s) => s.id))
  const links: FlowLink[] = []
  for (const s of screens) {
    for (const e of s.flowsTo ?? []) {
      if (ids.has(e.to) && e.to !== s.id) links.push({ from: s.id, to: e.to, label: e.label })
    }
  }
  return links
}

/** Each node's height: the title strip and its page — measured, or the device's own until it is. */
type Heights = ReadonlyMap<string, number>
const heightOf = (id: string, box: NodeBox, heights: Heights) => TITLE_H + Math.max(box.thumbH, heights.get(id) ?? 0)

/** The top of each row, rows being as tall as their tallest node. */
function rowTops(rows: number[][], from: number): { tops: number[]; end: number } {
  const tops: number[] = []
  let y = from
  for (const row of rows) {
    tops.push(y)
    y += Math.max(0, ...row) + ROW_GAP
  }
  return { tops, end: y - ROW_GAP }
}

function gridLayout(screens: ScreenDef[], box: NodeBox, heights: Heights): FlowNode[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(screens.length)))
  const rows: number[][] = []
  screens.forEach((s, i) => (rows[Math.floor(i / cols)] ??= []).push(heightOf(s.id, box, heights)))
  const { tops } = rowTops(rows, 0)
  return screens.map((screen, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return { screen, col, row, x: col * (box.nodeW + COL_GAP), y: tops[row], h: heightOf(screen.id, box, heights) }
  })
}

function bounds(nodes: FlowNode[], box: NodeBox): { width: number; height: number } {
  let width = 0
  let height = 0
  for (const n of nodes) {
    width = Math.max(width, n.x + box.nodeW)
    height = Math.max(height, n.y + n.h)
  }
  return { width, height }
}

/** The screens grouped as the sidebar shows them: unsectioned first, then each
 *  section in the order it first appears. */
function groupBySection(screens: ScreenDef[]): { section?: string; screens: ScreenDef[] }[] {
  const loose: ScreenDef[] = []
  const sections = new Map<string, ScreenDef[]>()
  for (const s of screens) {
    if (!s.section) loose.push(s)
    else sections.set(s.section, [...(sections.get(s.section) ?? []), s])
  }
  return [
    ...(loose.length ? [{ screens: loose }] : []),
    ...Array.from(sections, ([section, list]) => ({ section, screens: list })),
  ]
}

/** Columns for one lane: BFS over the lane's own edges, one piece after another. */
function laneColumns(screens: ScreenDef[], links: FlowLink[]): string[][] {
  const ids = new Set(screens.map((s) => s.id))
  const adj = new Map<string, string[]>()
  const into = new Map<string, number>()
  for (const l of links) {
    if (!ids.has(l.from) || !ids.has(l.to)) continue
    adj.set(l.from, [...(adj.get(l.from) ?? []), l.to])
    into.set(l.to, (into.get(l.to) ?? 0) + 1)
  }

  const layer = new Map<string, number>()
  let base = 0
  while (layer.size < screens.length) {
    const left = screens.filter((s) => !layer.has(s.id))
    const start =
      left.find((s) => s.entry) ?? left.find((s) => !into.get(s.id)) ?? left[0]
    layer.set(start.id, base)
    const queue = [start.id]
    let deepest = base
    while (queue.length) {
      const cur = queue.shift()!
      const d = layer.get(cur)!
      for (const next of adj.get(cur) ?? []) {
        if (layer.has(next)) continue
        layer.set(next, d + 1)
        deepest = Math.max(deepest, d + 1)
        queue.push(next)
      }
    }
    base = deepest + 1
  }

  const columns: string[][] = []
  for (const s of screens) {
    const col = layer.get(s.id)!
    while (columns.length <= col) columns.push([])
    columns[col].push(s.id)
  }
  return columns
}

export function computeLayout(screens: ScreenDef[], box: NodeBox, heights: Heights = new Map()): FlowLayout {
  const links = resolveLinks(screens)
  const sectioned = screens.some((s) => s.section)

  if (links.length === 0 && !sectioned) {
    const nodes = gridLayout(screens, box, heights)
    return { nodes, links, lanes: [], ...bounds(nodes, box), isGrid: true }
  }

  const byId = new Map(screens.map((s) => [s.id, s] as const))
  const groups = sectioned ? groupBySection(screens) : [{ screens }]
  const nodes: FlowNode[] = []
  const lanes: FlowLane[] = []
  let y = 0
  for (const group of groups) {
    // Only a named lane has a label strip above its screens.
    const head = group.section ? LANE_HEAD : 0
    const columns = laneColumns(group.screens, links)
    const rows: number[][] = []
    columns.forEach((col) => col.forEach((id, ri) => (rows[ri] ??= []).push(heightOf(id, box, heights))))
    const { tops, end } = rowTops(rows, y + head)
    columns.forEach((col, ci) => {
      col.forEach((id, ri) => {
        nodes.push({
          screen: byId.get(id)!,
          col: ci,
          row: ri,
          x: ci * (box.nodeW + COL_GAP),
          y: tops[ri],
          h: heightOf(id, box, heights),
        })
      })
    })
    const height = end - y
    if (sectioned) lanes.push({ section: group.section, y, height })
    y += height + LANE_GAP
  }
  return { nodes, links, lanes, ...bounds(nodes, box), isGrid: false }
}
