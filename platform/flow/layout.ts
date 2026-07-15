// =============================================================================
// Auto-layout for the flow canvas (WS-B).
// BFS layering from the entry screen -> columns left-to-right; screens the
// flow never reaches are stacked in a trailing column. When no screen declares
// any (resolvable) flowsTo edge, we fall back to a plain grid.
// =============================================================================

import type { ScreenDef } from '@/platform/types'
import { COL_GAP, NODE_H, NODE_W, ROW_GAP, TITLE_H, THUMB_H } from './geometry'

export interface FlowNode {
  screen: ScreenDef
  col: number
  row: number
  /** Top-left of the node box in canvas coordinates. */
  x: number
  y: number
}

export interface FlowLink {
  from: string
  to: string
  label?: string
}

export interface FlowLayout {
  nodes: FlowNode[]
  links: FlowLink[]
  width: number
  height: number
  /** True when there were no resolvable edges and we used the grid fallback. */
  isGrid: boolean
}

/** Anchor points on a node box, in canvas coordinates. */
export function rightAnchor(n: FlowNode) {
  return { x: n.x + NODE_W, y: n.y + TITLE_H + THUMB_H / 2 }
}
export function leftAnchor(n: FlowNode) {
  return { x: n.x, y: n.y + TITLE_H + THUMB_H / 2 }
}

function entryId(screens: ScreenDef[]): string | undefined {
  return (screens.find((s) => s.entry) ?? screens[0])?.id
}

/** Resolvable links only — edges whose target exists in the project. */
function resolveLinks(screens: ScreenDef[]): FlowLink[] {
  const ids = new Set(screens.map((s) => s.id))
  const links: FlowLink[] = []
  for (const s of screens) {
    for (const e of s.flowsTo ?? []) {
      if (ids.has(e.to)) links.push({ from: s.id, to: e.to, label: e.label })
    }
  }
  return links
}

function positionColumns(columns: string[][], byId: Map<string, ScreenDef>): FlowNode[] {
  const nodes: FlowNode[] = []
  // Vertically centre each column against the tallest one.
  const tallest = Math.max(1, ...columns.map((c) => c.length))
  const fullH = tallest * NODE_H + (tallest - 1) * ROW_GAP

  columns.forEach((col, ci) => {
    const colH = col.length * NODE_H + (col.length - 1) * ROW_GAP
    const y0 = (fullH - colH) / 2
    col.forEach((id, ri) => {
      const screen = byId.get(id)
      if (!screen) return
      nodes.push({
        screen,
        col: ci,
        row: ri,
        x: ci * (NODE_W + COL_GAP),
        y: y0 + ri * (NODE_H + ROW_GAP),
      })
    })
  })
  return nodes
}

function gridLayout(screens: ScreenDef[]): FlowNode[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(screens.length)))
  return screens.map((screen, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return {
      screen,
      col,
      row,
      x: col * (NODE_W + COL_GAP),
      y: row * (NODE_H + ROW_GAP),
    }
  })
}

function bounds(nodes: FlowNode[]): { width: number; height: number } {
  let width = 0
  let height = 0
  for (const n of nodes) {
    width = Math.max(width, n.x + NODE_W)
    height = Math.max(height, n.y + NODE_H)
  }
  return { width, height }
}

export function computeLayout(screens: ScreenDef[]): FlowLayout {
  const byId = new Map(screens.map((s) => [s.id, s] as const))
  const links = resolveLinks(screens)

  if (links.length === 0) {
    const nodes = gridLayout(screens)
    return { nodes, links, ...bounds(nodes), isGrid: true }
  }

  // Adjacency for BFS.
  const adj = new Map<string, string[]>()
  for (const l of links) {
    if (!adj.has(l.from)) adj.set(l.from, [])
    adj.get(l.from)!.push(l.to)
  }

  const start = entryId(screens)
  const layer = new Map<string, number>()
  if (start) {
    const queue: string[] = [start]
    layer.set(start, 0)
    while (queue.length) {
      const cur = queue.shift()!
      const d = layer.get(cur)!
      for (const next of adj.get(cur) ?? []) {
        if (!layer.has(next)) {
          layer.set(next, d + 1)
          queue.push(next)
        }
      }
    }
  }

  const reachedMax = layer.size ? Math.max(...Array.from(layer.values())) : -1
  const trailingCol = reachedMax + 1

  // Bucket screens into columns; unreached go to the trailing column,
  // preserving declaration order within each column.
  const columns: string[][] = []
  for (const s of screens) {
    const col = layer.has(s.id) ? layer.get(s.id)! : trailingCol
    while (columns.length <= col) columns.push([])
    columns[col].push(s.id)
  }

  const nodes = positionColumns(columns, byId)
  return { nodes, links, ...bounds(nodes), isGrid: false }
}
