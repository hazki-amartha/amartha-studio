// =============================================================================
// Design · a stack's layout, read from and written to a class list (D3).
//
// The auto-layout knobs — direction, gap, alignment, justification — are four
// families of Tailwind classes. Reading them the same way on both sides is the
// whole point of this module: the panel reads the rendered class list, the
// backend reads the authored one, and a `stack` edit is only applied when the
// two agree on what the element is now.
//
// Dependency-free; used by the panel, the overlay and applyEdits alike.
// =============================================================================

export type Direction = 'row' | 'col'

export interface Layout {
  /** null when the element is not a flex container at all. */
  direction: Direction | null
  /** A spacing token name (`12`), or null for no gap. */
  gap: string | null
  align: string | null
  justify: string | null
}

/** The 4px grid, as `tailwind.config.ts` spells it. The tests assert this
 *  matches the inspector's own list, so a new token can't drift past here. */
export const SPACING = ['0', '2', '4', '8', '12', '16', '20', '24', '32', '40', '48']
export const ALIGNS = ['start', 'center', 'end', 'stretch', 'baseline']
export const JUSTIFIES = ['start', 'center', 'end', 'between', 'around', 'evenly']

const FLEX = new Set(['flex', 'inline-flex'])

function suffix(classes: readonly string[], prefix: string, allowed: readonly string[]): string | null {
  for (const c of classes) {
    if (c.startsWith(prefix) && allowed.includes(c.slice(prefix.length))) return c.slice(prefix.length)
  }
  return null
}

export function layoutOf(classes: readonly string[]): Layout {
  const flex = classes.some((c) => FLEX.has(c))
  return {
    direction: flex ? (classes.includes('flex-col') ? 'col' : 'row') : null,
    gap: suffix(classes, 'gap-', SPACING),
    align: suffix(classes, 'items-', ALIGNS),
    justify: suffix(classes, 'justify-', JUSTIFIES),
  }
}

export function sameLayout(a: Layout, b: Layout): boolean {
  return a.direction === b.direction && a.gap === b.gap && a.align === b.align && a.justify === b.justify
}

/**
 * Roughly where Tailwind's own class order puts a utility — enough to place a
 * newly added layout class where `tailwindcss/classnames-order` expects it, so
 * a panel edit doesn't leave a lint warning behind. null for anything this
 * table doesn't know, which never decides a position.
 */
const RANKS: [RegExp, number][] = [
  [/^(static|fixed|absolute|relative|sticky)$|^(inset|top|right|bottom|left|z)-/, 0],
  [/^-?m[xytrbl]?-/, 1],
  [/^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden|contents)$/, 2],
  [/^(size|h|min-h|max-h|w|min-w|max-w)-/, 3],
  [/^(flex-1|flex-auto|flex-initial|flex-none|shrink|shrink-0|grow|grow-0)$|^basis-/, 4],
  [/^flex-(row|col)(-reverse)?$/, 6],
  [/^flex-(wrap|nowrap)/, 7],
  [/^items-/, 8],
  [/^justify-/, 9],
  [/^gap-/, 10],
  [/^(space|divide)-/, 11],
  [/^self-/, 12],
  [/^(overflow|truncate)/, 13],
  [/^rounded/, 14],
  [/^border/, 15],
  [/^bg-/, 16],
  [/^p[xytrbl]?-/, 17],
  [/^text-(left|center|right|justify)$/, 18],
  [/^text-/, 19],
  [/^font-/, 20],
  [/^(leading|tracking)-/, 21],
  [/^(shadow|opacity)/, 22],
]

function rank(cls: string): number | null {
  for (const [re, r] of RANKS) if (re.test(cls)) return r
  return null
}

/** Put `cls` before the first class Tailwind orders after it. */
function insertOrdered(classes: string[], cls: string) {
  const r = rank(cls)
  const at = r === null ? -1 : classes.findIndex((c) => (rank(c) ?? -1) > r)
  if (at === -1) classes.push(cls)
  else classes.splice(at, 0, cls)
}

/** Replace the class for one family in place, add it in order, or drop it. */
function swap(classes: string[], prefix: string, allowed: readonly string[], next: string | null) {
  const at = classes.findIndex((c) => c.startsWith(prefix) && allowed.includes(c.slice(prefix.length)))
  const cls = next === null ? null : `${prefix}${next}`
  if (at === -1) {
    if (cls) insertOrdered(classes, cls)
  } else if (cls) {
    classes[at] = cls
  } else {
    classes.splice(at, 1)
  }
}

/**
 * The class list with `from` rewritten to `to`, leaving every other class —
 * and the order of the ones it keeps — alone. The caller has already checked
 * that `classes` really is `from`.
 */
export function withLayout(classes: readonly string[], to: Layout): string[] {
  const out = [...classes]
  const from = layoutOf(out)

  if (from.direction !== to.direction) {
    if (to.direction === null) {
      for (const c of ['flex', 'inline-flex', 'flex-col', 'flex-row']) {
        const i = out.indexOf(c)
        if (i !== -1) out.splice(i, 1)
      }
    } else {
      if (!out.some((c) => FLEX.has(c))) insertOrdered(out, 'flex')
      const col = out.indexOf('flex-col')
      const row = out.indexOf('flex-row')
      if (row !== -1) out.splice(row, 1)
      if (to.direction === 'col' && col === -1) insertOrdered(out, 'flex-col')
      if (to.direction === 'row' && col !== -1) out.splice(out.indexOf('flex-col'), 1)
    }
  }

  if (from.gap !== to.gap) swap(out, 'gap-', SPACING, to.gap)
  if (from.align !== to.align) swap(out, 'items-', ALIGNS, to.align)
  if (from.justify !== to.justify) swap(out, 'justify-', JUSTIFIES, to.justify)
  return out
}
