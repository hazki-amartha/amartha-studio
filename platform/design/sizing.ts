// =============================================================================
// Design · Fill, Hug and Fixed — Figma's resizing, read from and written to an
// element's sizing classes.
//
// The same mode is a different class depending on the parent: filling the
// width is `flex-1` in a row but `w-full` in a column, and a column's children
// already fill its width unless something says otherwise. So this reads the
// parent's computed layout, and hands layout.ts a plain class list to write.
//
// Fixed sizes use the 4px size scale in tailwind.config.ts (up to SIZE_MAX),
// so any size a designer types lands on a named class, never `w-[…]`.
// =============================================================================

import { isSizingClass } from './layout'

export type SizeMode = 'fill' | 'hug' | 'fixed'
export type Axis = 'w' | 'h'

export interface AxisSize {
  mode: SizeMode
  /** px, rendered — what the field shows whatever the mode. */
  px: number
}

/** Mirrors SIZE_MAX in tailwind.config.ts. */
export const SIZE_MAX = 1200

type Parent = { dir: 'row' | 'col' | 'block'; stretch: boolean }

function parentOf(el: Element): Parent {
  const p = el.parentElement
  if (!p) return { dir: 'block', stretch: false }
  const s = getComputedStyle(p)
  if (!s.display.includes('flex')) return { dir: 'block', stretch: false }
  return {
    dir: s.flexDirection.startsWith('row') ? 'row' : 'col',
    stretch: s.alignItems === 'normal' || s.alignItems === 'stretch',
  }
}

/** A fixed size on `axis`, from `w-N`/`h-N` or `size-N`, or null. */
function fixedOf(classes: readonly string[], axis: Axis): string | null {
  for (const c of classes) {
    const m = /^(w|h|size)-(\d+)$/.exec(c)
    if (m && (m[1] === axis || m[1] === 'size')) return m[2]
  }
  return null
}

export function sizeOf(el: Element, axis: Axis): AxisSize {
  const classes = Array.from(el.classList)
  // The device is scaled; offset sizes are the unscaled ones.
  const px = el instanceof HTMLElement ? (axis === 'w' ? el.offsetWidth : el.offsetHeight) : 0
  if (fixedOf(classes, axis)) return { mode: 'fixed', px }

  const { dir, stretch } = parentOf(el)
  const has = (c: string) => classes.includes(c)
  const main = (dir === 'row') === (axis === 'w')
  let fill: boolean
  if (has(`${axis}-full`)) fill = true
  else if (dir === 'block') fill = axis === 'w' && !has('w-fit')
  else if (main) fill = has('flex-1')
  else fill = has('self-stretch') || (stretch && !has('self-start'))
  return { mode: fill ? 'fill' : 'hug', px }
}

/** The nearest size the scale has. */
export function snapSize(px: number): string {
  const n = Math.min(SIZE_MAX, Math.max(0, Math.round(px / 4) * 4))
  return String(n)
}

/**
 * The sizing classes `el` should carry for `axis` set to `mode` — the rest of
 * its sizing classes (the other axis) kept as they are.
 */
export function nextSizing(el: Element, axis: Axis, mode: SizeMode, value?: string): string[] {
  const { dir, stretch } = parentOf(el)
  const main = dir !== 'block' && (dir === 'row') === (axis === 'w')

  let classes = Array.from(el.classList).filter(isSizingClass)
  // `size-N` sets both axes; split it so one can change alone.
  const both = classes.find((c) => /^size-/.test(c))
  if (both) {
    const n = both.slice(5)
    classes = [...classes.filter((c) => c !== both), `w-${n}`, `h-${n}`]
  }

  classes = classes.filter((c) => {
    if (c.startsWith(`${axis}-`)) return false
    if (dir === 'block') return true
    if (main) return c !== 'flex-1'
    return c !== 'self-start' && c !== 'self-stretch'
  })

  if (mode === 'fixed' && value) {
    classes.push(`${axis}-${value}`)
  } else if (mode === 'fill') {
    if (dir === 'block' || (!main && axis === 'w')) classes.push(`${axis}-full`)
    else if (main) classes.push('flex-1')
    else if (!stretch) classes.push('self-stretch')
  } else if (mode === 'hug') {
    if (dir === 'block') {
      if (axis === 'w') classes.push('w-fit')
    } else if (!main && stretch) {
      classes.push('self-start')
    }
  }

  // Equal fixed sizes on both axes are one `size-N` — the lint rule's
  // shorthand, and how FunDS writes an icon box.
  const w = fixedOf(classes.filter((c) => !c.startsWith('h-')), 'w')
  const h = fixedOf(classes.filter((c) => !c.startsWith('w-')), 'h')
  if (w && w === h && classes.includes(`w-${w}`) && classes.includes(`h-${h}`)) {
    classes = [...classes.filter((c) => c !== `w-${w}` && c !== `h-${h}`), `size-${w}`]
  }
  return classes
}
