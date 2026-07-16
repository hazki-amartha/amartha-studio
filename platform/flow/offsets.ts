// =============================================================================
// Per-project node offsets for the flow canvas.
//
// Positions stay derived: computeLayout() owns where a screen sits, and a
// designer's rearrangement is stored as a *delta* from that. This keeps the
// auto-layout the baseline (reset = drop the deltas) and means a screen added
// later still lands somewhere sensible instead of colliding with saved
// absolute coordinates.
//
// Deltas live in localStorage — a personal scratch preference, not a project
// artifact. Nothing here is shared with teammates or committed.
// =============================================================================

export interface NodeOffset {
  dx: number
  dy: number
}

export type OffsetMap = Record<string, NodeOffset>

const KEY_PREFIX = 'db.flow.offsets.'

function key(slug: string): string {
  return `${KEY_PREFIX}${slug}`
}

export function loadOffsets(slug: string): OffsetMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(key(slug))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    // Hand-written localStorage is untrusted input: keep only well-formed,
    // finite pairs so one bad entry can't NaN a node off the canvas.
    const out: OffsetMap = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue
      const { dx, dy } = value as Partial<NodeOffset>
      if (typeof dx !== 'number' || typeof dy !== 'number') continue
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) continue
      out[id] = { dx, dy }
    }
    return out
  } catch {
    return {}
  }
}

export function saveOffsets(slug: string, offsets: OffsetMap): void {
  if (typeof window === 'undefined') return
  try {
    if (Object.keys(offsets).length === 0) {
      window.localStorage.removeItem(key(slug))
      return
    }
    window.localStorage.setItem(key(slug), JSON.stringify(offsets))
  } catch {
    // Private mode / quota — the arrangement just won't survive a reload.
  }
}
