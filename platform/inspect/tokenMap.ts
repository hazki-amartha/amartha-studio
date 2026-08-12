// =============================================================================
// Inspect · token map — the two-way bridge between token names and real values.
//
// Reads ONLY tailwind.config.ts. That file generates the utility classes, so it
// is the one place that cannot disagree with what a prototype actually renders.
// design-system/tokens.ts is deliberately NOT read: it is specimen data for the
// /system page, it is incomplete (SPACINGS omits 2/24/40), and some values are
// display glyphs rather than CSS (radius `full` is '∞').
//
// Two directions are needed, because the studio has two kinds of styling:
//   • forward  (class → value)  — prototype-authored Tailwind, e.g. `px-16`.
//   • backward (value → token)  — the design system styles itself with
//     hand-written `ds-*` CSS carrying hardcoded px, so the only way to describe
//     a Button in token terms is to read its computed style and map back.
// =============================================================================

import type { Config } from 'tailwindcss'
import twConfig from '@/tailwind.config'

// The config's own types model every value as possibly-a-function, which none
// of ours are. Narrow once, here, rather than casting at each read site.
type Scale = Record<string, string>

interface ThemeShape {
  spacing?: Scale
  borderRadius?: Scale
  fontSize?: Record<string, string | [string, unknown]>
  fontWeight?: Scale
  colors?: Record<string, string | Scale>
  extend?: {
    textColor?: Scale
    borderColor?: Scale
    backgroundColor?: Scale
  }
}

const theme = ((twConfig as Config).theme ?? {}) as unknown as ThemeShape

const spacing = theme.spacing ?? {}
const radius = theme.borderRadius ?? {}
const fontWeight = theme.fontWeight ?? {}

/** fontSize entries are `[size, {lineHeight, letterSpacing}]` tuples. */
const fontSize: Scale = Object.fromEntries(
  Object.entries(theme.fontSize ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
)

// --- value normalisation -----------------------------------------------------

/** Everything is compared in px. Config spacing is rem; computed style is px. */
export function toPx(value: string): string {
  const rem = /^(-?[\d.]+)rem$/.exec(value.trim())
  if (rem) return `${parseFloat(rem[1]) * 16}px`
  const bare = /^(-?[\d.]+)$/.exec(value.trim())
  if (bare) return `${bare[1]}px`
  return value.trim()
}

function hex2(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
}

/**
 * One canonical spelling for a colour, whichever end it came from.
 * getComputedStyle returns `rgb(133, 50, 145)`; the config holds `#853291` and
 * one `rgba(17, 25, 40, 0.8)`. Opaque → `#rrggbb`, translucent → `#rrggbbaa`,
 * fully transparent → `transparent` (so `rgba(0,0,0,0)` backgrounds, which every
 * unstyled element reports, collapse to a single meaningful key).
 */
export function normaliseColor(input: string): string {
  const value = input.trim().toLowerCase()
  if (!value || value === 'transparent' || value === 'none') return 'transparent'

  const fn = /^rgba?\(([^)]+)\)$/.exec(value)
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean)
    const [r, g, b] = parts.map((p) => parseFloat(p))
    const a = parts.length > 3 ? parseFloat(parts[3]) : 1
    if ([r, g, b].some((n) => Number.isNaN(n))) return value
    if (a === 0) return 'transparent'
    return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`
  }

  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(value)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`

  return value
}

// --- reverse maps (computed value → token name) ------------------------------

function invert(scale: Scale, transform: (v: string) => string): Map<string, string> {
  const out = new Map<string, string>()
  for (const [name, value] of Object.entries(scale)) {
    const key = transform(value)
    // First writer wins, so the earliest-declared name is canonical.
    if (!out.has(key)) out.set(key, name)
  }
  return out
}

const spacingByPx = invert(spacing, toPx)
const radiusByPx = invert(radius, toPx)
const fontSizeByPx = invert(fontSize, toPx)
const weightByValue = invert(fontWeight, (v) => v)

/** Flattened colour ramps: `primary-500`, `neutral-white`, … → hex. */
const colorScale: Scale = {}
for (const [family, value] of Object.entries(theme.colors ?? {})) {
  if (typeof value === 'string') {
    colorScale[family] = value
  } else {
    for (const [step, hex] of Object.entries(value)) colorScale[`${family}-${step}`] = hex
  }
}

const colorByHex = invert(colorScale, normaliseColor)
const textAliasByHex = invert(theme.extend?.textColor ?? {}, normaliseColor)
const borderAliasByHex = invert(theme.extend?.borderColor ?? {}, normaliseColor)
const bgAliasByHex = invert(theme.extend?.backgroundColor ?? {}, normaliseColor)

// --- ordered scales (for the edit panel's steppers and pickers) --------------

/** Numeric-ish scale names in ascending px order; non-numeric names (`full`,
 *  `none`) keep their declared position at the ends. */
function orderedNames(scale: Scale): string[] {
  return Object.keys(scale).sort((a, b) => {
    const pa = parseFloat(toPx(scale[a]))
    const pb = parseFloat(toPx(scale[b]))
    if (Number.isNaN(pa) || Number.isNaN(pb)) return 0
    return pa - pb
  })
}

/** Spacing token names, ascending: 0, 2, 4, … 48. */
export const spacingNames = orderedNames(spacing)
/** Radius token names, ascending, `full` last. */
export const radiusNames = orderedNames(radius)
/** Font-size token names, ascending. */
export const fontSizeNames = orderedNames(fontSize)
/** Font-weight token names in declared order (regular, bold). */
export const fontWeightNames = Object.keys(fontWeight)

/** Colour scale entries as `[name, hex]`, declared order — primary first,
 *  `transparent`/`current` filtered out since neither is a paintable pick. */
export const colorEntries: [string, string][] = Object.entries(colorScale).filter(
  ([name]) => name !== 'transparent' && name !== 'current',
)

/** Semantic text-colour aliases as `[name, value]` (default, caption, …). */
export const textAliasEntries: [string, string][] = Object.entries(theme.extend?.textColor ?? {})

export type ColorRole = 'text' | 'border' | 'bg'

/**
 * A colour in token terms. The raw scale name is canonical; the semantic alias
 * is appended in parentheses when one exists, because several hexes are both
 * (#111928 is neutral-900 AND text-default) and picking only one would hide
 * whichever name the reader was looking for.
 */
export function tokenForColor(value: string, role: ColorRole): string | null {
  const key = normaliseColor(value)
  if (key === 'transparent') return 'transparent'

  const scale = colorByHex.get(key) ?? null
  const aliasMap =
    role === 'text' ? textAliasByHex : role === 'border' ? borderAliasByHex : bgAliasByHex
  const alias = aliasMap.get(key)
  const aliasName = alias ? `${role === 'bg' ? 'bg' : role}-${alias}` : null

  if (scale && aliasName) return `${scale} (${aliasName})`
  return scale ?? aliasName
}

export type LengthRole = 'spacing' | 'radius' | 'fontSize' | 'fontWeight'

/** A length/weight in token terms, or null when the value is off-system. */
export function tokenForValue(value: string, role: LengthRole): string | null {
  if (role === 'fontWeight') return weightByValue.get(value.trim()) ?? null
  const px = toPx(value)
  const map =
    role === 'spacing' ? spacingByPx : role === 'radius' ? radiusByPx : fontSizeByPx
  return map.get(px) ?? null
}

// --- forward lookup (authored class → value) ---------------------------------

/** Utilities whose suffix indexes a scale. Longest prefix wins on lookup. */
const SPACING_PREFIXES = [
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
  'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
  'gap', 'gap-x', 'gap-y', 'space-x', 'space-y',
  'w', 'h', 'size', 'min-w', 'min-h', 'max-w', 'max-h',
  'top', 'right', 'bottom', 'left', 'inset', 'inset-x', 'inset-y',
]

const RADIUS_PREFIXES = [
  'rounded', 'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l',
  'rounded-tl', 'rounded-tr', 'rounded-br', 'rounded-bl',
]

const COLOR_PREFIXES = ['bg', 'border', 'fill', 'stroke', 'ring', 'divide', 'outline']

/** Sizing keywords Tailwind provides outside the spacing scale. */
const KEYWORDS: Scale = {
  full: '100%',
  auto: 'auto',
  fit: 'fit-content',
  min: 'min-content',
  max: 'max-content',
  screen: '100vh/vw',
  px: '1px',
}

function splitPrefix(cls: string, prefixes: string[]): string | null {
  let best: string | null = null
  for (const prefix of prefixes) {
    if (cls.startsWith(`${prefix}-`) && (!best || prefix.length > best.length)) best = prefix
  }
  return best
}

/**
 * The value an authored utility class resolves to, or null when it isn't a
 * token-scale class (layout utilities like `flex`, or something off-system).
 * Variant prefixes are stripped first — `md:px-16` and `hover:bg-primary-500`
 * carry the same token as their base.
 */
export function valueForClass(input: string): string | null {
  const cls = input.includes(':') ? input.slice(input.lastIndexOf(':') + 1) : input
  if (!cls || cls.startsWith('ds-')) return null

  const radiusPrefix = splitPrefix(cls, RADIUS_PREFIXES)
  if (radiusPrefix) {
    const suffix = cls.slice(radiusPrefix.length + 1)
    if (radius[suffix]) return toPx(radius[suffix])
  }
  if (cls === 'rounded' && radius.DEFAULT) return toPx(radius.DEFAULT)

  if (cls.startsWith('text-')) {
    const suffix = cls.slice(5)
    if (fontSize[suffix]) return toPx(fontSize[suffix])
    if (theme.extend?.textColor?.[suffix]) return theme.extend.textColor[suffix]
    if (colorScale[suffix]) return colorScale[suffix]
    return null
  }

  if (cls.startsWith('font-')) {
    const suffix = cls.slice(5)
    if (fontWeight[suffix]) return fontWeight[suffix]
    return null
  }

  const colorPrefix = splitPrefix(cls, COLOR_PREFIXES)
  if (colorPrefix) {
    const suffix = cls.slice(colorPrefix.length + 1)
    const alias =
      colorPrefix === 'border'
        ? theme.extend?.borderColor?.[suffix]
        : colorPrefix === 'bg'
          ? theme.extend?.backgroundColor?.[suffix]
          : undefined
    if (alias) return alias
    if (colorScale[suffix]) return colorScale[suffix]
    // `border-2` and friends are widths, not colours — fall through to spacing.
  }

  const spacingPrefix = splitPrefix(cls, SPACING_PREFIXES)
  if (spacingPrefix) {
    const suffix = cls.slice(spacingPrefix.length + 1)
    if (spacing[suffix]) return toPx(spacing[suffix])
    if (KEYWORDS[suffix]) return KEYWORDS[suffix]
  }

  return null
}
