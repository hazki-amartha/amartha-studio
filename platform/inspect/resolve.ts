// =============================================================================
// Inspect · resolver — turns a DOM element into something a human can read.
//
// Two styling paths, both required, because the studio styles itself two ways:
//   • Authored Tailwind classes — what a prototype screen actually wrote. Shown
//     first, because it is literally the text an engineer would copy.
//   • Computed style, mapped back to tokens — the only path that says anything
//     about a FunDS component, since those style themselves with hand-written
//     `ds-*` CSS carrying hardcoded px rather than token classes.
//
// Values with no token behind them are reported as such rather than rounded to
// a nearby token: `.ds-btn` really does set `gap: 6px`, off the 4px grid, and
// an engineer building from this needs to know that.
// =============================================================================

import { tokenForColor, tokenForValue, valueForClass } from './tokenMap'

export interface AuthoredClass {
  cls: string
  /** Resolved token value, or null for a non-scale utility like `flex`. */
  value: string | null
}

export interface ComputedRow {
  label: string
  value: string
  /** Token name(s), or null when the value is off-system. */
  token: string | null
}

export interface InspectTarget {
  el: Element
  /** FunDS component name from `data-fds`, or null for a raw node. */
  component: string | null
  props: [string, string][]
  tag: string
  authored: AuthoredClass[]
  computed: ComputedRow[]
  text: string
}

/** The nearest FunDS component boundary at or above `el`. */
export function boundaryOf(el: Element): Element | null {
  return el.closest('[data-fds]')
}

/**
 * The chain from the inspect root down to `el`, keeping every FunDS boundary
 * plus the element itself. Outermost first, innermost last, capped so a deeply
 * nested node doesn't produce an unreadable breadcrumb.
 */
export function ancestorChain(el: Element, root: Element, max = 6): Element[] {
  const chain: Element[] = []
  let node: Element | null = el

  while (node && node !== root) {
    if (node === el || node.hasAttribute('data-fds')) chain.push(node)
    node = node.parentElement
  }

  return chain.reverse().slice(-max)
}

/** A short human label for a crumb: the component name, or the tag name. */
export function labelOf(el: Element): string {
  return el.getAttribute('data-fds') ?? el.tagName.toLowerCase()
}

// --- computed style ----------------------------------------------------------

/** CSS shorthand collapsing: 4 equal → 1, t/b + l/r → 2, otherwise all 4. */
function collapse(values: string[]): string[] {
  const [t, r, b, l] = values
  if (t === r && r === b && b === l) return [t]
  if (t === b && r === l) return [t, r]
  return [t, r, b, l]
}

/**
 * Padding, named with the utility that matches how it collapsed: one value is
 * `p-`, two are `py-`/`px-`, four are the individual sides. The token is null
 * unless EVERY part resolves — a half-tokenised value would read as if the
 * whole thing were on-system.
 */
function paddingRow(values: string[]): ComputedRow | null {
  const parts = collapse(values)
  if (parts.every((v) => parseFloat(v) === 0)) return null

  const prefixes =
    parts.length === 1 ? ['p'] : parts.length === 2 ? ['py', 'px'] : ['pt', 'pr', 'pb', 'pl']
  const names = parts.map((v) => tokenForValue(v, 'spacing'))

  return {
    label: 'padding',
    value: parts.join(' '),
    token: names.every(Boolean) ? names.map((n, i) => `${prefixes[i]}-${n}`).join(' ') : null,
  }
}

/**
 * Corner radius. Only the uniform case gets a token: the two-value collapse for
 * corners means tl==br and tr==bl, which no Tailwind utility expresses, so
 * naming one would be a guess.
 */
function radiusRow(values: string[]): ComputedRow | null {
  const parts = collapse(values)
  if (parts.every((v) => parseFloat(v) === 0)) return null
  if (parts.length > 1) return { label: 'radius', value: parts.join(' '), token: null }

  const name = tokenForValue(parts[0], 'radius')
  return { label: 'radius', value: parts[0], token: name ? `rounded-${name}` : null }
}

function colorRow(
  label: string,
  value: string,
  role: 'text' | 'border' | 'bg',
): ComputedRow | null {
  const token = tokenForColor(value, role)
  if (token === 'transparent') return null
  return { label, value, token }
}

function computedRows(el: Element): ComputedRow[] {
  const s = getComputedStyle(el)
  const rows: (ComputedRow | null)[] = []

  rows.push(paddingRow([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]))

  const rowGap = s.rowGap === 'normal' ? '0px' : s.rowGap
  const colGap = s.columnGap === 'normal' ? '0px' : s.columnGap
  if (parseFloat(rowGap) || parseFloat(colGap)) {
    const same = rowGap === colGap
    const token = same ? tokenForValue(rowGap, 'spacing') : null
    rows.push({
      label: 'gap',
      value: same ? rowGap : `${rowGap} ${colGap}`,
      token: token ? `gap-${token}` : null,
    })
  }

  rows.push(
    radiusRow([
      s.borderTopLeftRadius,
      s.borderTopRightRadius,
      s.borderBottomRightRadius,
      s.borderBottomLeftRadius,
    ]),
  )

  const size = tokenForValue(s.fontSize, 'fontSize')
  rows.push({ label: 'font size', value: s.fontSize, token: size ? `text-${size}` : null })

  const weight = tokenForValue(s.fontWeight, 'fontWeight')
  rows.push({ label: 'weight', value: s.fontWeight, token: weight ? `font-${weight}` : null })

  rows.push(colorRow('color', s.color, 'text'))
  rows.push(colorRow('background', s.backgroundColor, 'bg'))

  // Border colour only means something when there is a border to see.
  if (parseFloat(s.borderTopWidth) > 0) {
    const width = tokenForValue(s.borderTopWidth, 'spacing')
    rows.push({
      label: 'border',
      value: s.borderTopWidth,
      token: width ? `border-${width}` : null,
    })
    rows.push(colorRow('border color', s.borderTopColor, 'border'))
  }

  return rows.filter((r): r is ComputedRow => r !== null)
}

// --- entry point -------------------------------------------------------------

export function resolveTarget(el: Element): InspectTarget {
  const props: [string, string][] = []
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-fds-')) props.push([attr.name.slice(9), attr.value])
  }

  const authored = Array.from(el.classList)
    .filter((cls) => !cls.startsWith('ds-'))
    .map((cls) => ({ cls, value: valueForClass(cls) }))

  return {
    el,
    component: el.getAttribute('data-fds'),
    props,
    tag: el.tagName.toLowerCase(),
    authored,
    computed: computedRows(el),
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
  }
}
