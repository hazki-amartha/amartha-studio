// =============================================================================
// Inspect · the redlining spec.
//
// The agent string next to this one is an INSTRUCTION — it names an element and
// leaves a blank for the change you want. This is the opposite: a complete
// statement of what the element is right now, for a person who has to rebuild
// it somewhere the studio's classes don't exist (an Android or iOS screen, or a
// ticket someone reads a week later).
//
// So it reports every value twice — the raw CSS and the token behind it —
// because those two readers need different halves. `12px (p-12)` tells a web
// engineer which utility to type and a native engineer what to set, and
// `13px (not a token)` tells both that this one is off-system and should
// probably be questioned rather than copied.
//
// It reads a few properties the inspector's own panel doesn't show (line
// height, letter spacing, alignment, shadow). They are noise while you're
// picking things on screen, and exactly what's missing from a handoff.
// =============================================================================

import type { InspectTarget } from './resolve'
import { normaliseColor, tokenForColor, tokenForValue } from './tokenMap'

/** `12px (p-12)`, or `13px (not a token)` when nothing in the scale matches. */
function withToken(value: string, token: string | null): string {
  return token ? `${value} (${token})` : `${value} (not a token)`
}

/** Rendered size in the device's own coordinates, undoing the frame's scale. */
function measure(el: Element): string | null {
  const viewport = el.closest('[data-inspect]') as HTMLElement | null
  const rect = el.getBoundingClientRect()
  if (!rect.width && !rect.height) return null
  const scale = viewport ? viewport.getBoundingClientRect().width / viewport.offsetWidth || 1 : 1
  return `${Math.round(rect.width / scale)} × ${Math.round(rect.height / scale)}`
}

/** Four sides collapsed the way CSS shorthand would write them. */
function collapse(values: string[]): string[] {
  const [t, r, b, l] = values
  if (t === r && r === b && b === l) return [t]
  if (t === b && r === l) return [t, r]
  return [t, r, b, l]
}

/** `p` → `p-12`, `py-8 px-16`, or the four sides, matching how it collapsed. */
function spacingSpec(label: string, values: string[], prefix: string): string | null {
  const parts = collapse(values)
  if (parts.every((v) => parseFloat(v) === 0)) return null

  const names =
    parts.length === 1
      ? [prefix]
      : parts.length === 2
        ? [`${prefix}y`, `${prefix}x`]
        : [`${prefix}t`, `${prefix}r`, `${prefix}b`, `${prefix}l`]

  const shown = parts
    .map((v, i) => {
      const t = tokenForValue(v, 'spacing')
      return withToken(v, t ? `${names[i]}-${t}` : null)
    })
    .join('  ')

  return `${label}${shown}`
}

const pad = (label: string) => `${label}${' '.repeat(Math.max(1, 12 - label.length))}`

export function copySpec(target: InspectTarget, slug: string, screenId: string): string {
  const el = target.el
  const s = getComputedStyle(el)
  const lines: string[] = []

  // --- what and where -------------------------------------------------------
  const props = target.props.map(([k, v]) => ` ${k}="${v}"`).join('')
  const name = target.component ? `FunDS <${target.component}${props}>` : `<${target.tag}>`

  lines.push(`Amartha Studio · project ${slug} · screen ${screenId}`)
  lines.push(`Element: ${name}${target.text ? ` — "${target.text}"` : ''}`)
  lines.push(`File: projects/${slug}/screens/${screenId}.tsx (or a helper it imports from lib/)`)
  lines.push('')

  // --- geometry -------------------------------------------------------------
  const size = measure(el)
  if (size) lines.push(`${pad('Size')}${size} px`)

  const display = s.display
  if (display === 'flex' || display === 'inline-flex' || display === 'grid') {
    const bits: string[] = [
      display === 'grid' ? 'grid' : `flex ${s.flexDirection.startsWith('column') ? 'column' : 'row'}`,
    ]
    if (s.alignItems && s.alignItems !== 'normal') bits.push(`align ${s.alignItems}`)
    if (s.justifyContent && s.justifyContent !== 'normal') bits.push(`justify ${s.justifyContent}`)
    if (s.flexWrap === 'wrap') bits.push('wrap')
    lines.push(`${pad('Layout')}${bits.join(' · ')}`)
  }

  // --- spacing --------------------------------------------------------------
  const padding = spacingSpec(
    pad('Padding'),
    [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft],
    'p',
  )
  if (padding) lines.push(padding)

  const margin = spacingSpec(
    pad('Margin'),
    [s.marginTop, s.marginRight, s.marginBottom, s.marginLeft],
    'm',
  )
  if (margin) lines.push(margin)

  const rowGap = s.rowGap === 'normal' ? '0px' : s.rowGap
  const colGap = s.columnGap === 'normal' ? '0px' : s.columnGap
  if (parseFloat(rowGap) || parseFloat(colGap)) {
    if (rowGap === colGap) {
      const t = tokenForValue(rowGap, 'spacing')
      lines.push(`${pad('Gap')}${withToken(rowGap, t ? `gap-${t}` : null)}`)
    } else {
      const ty = tokenForValue(rowGap, 'spacing')
      const tx = tokenForValue(colGap, 'spacing')
      lines.push(
        `${pad('Gap')}${withToken(rowGap, ty ? `gap-y-${ty}` : null)} / ${withToken(colGap, tx ? `gap-x-${tx}` : null)}`,
      )
    }
  }

  // --- type -----------------------------------------------------------------
  // Only worth reporting where there is text to set it on.
  if (target.text || el.children.length === 0) {
    const sizeToken = tokenForValue(s.fontSize, 'fontSize')
    const weightToken = tokenForValue(s.fontWeight, 'fontWeight')
    lines.push(
      `${pad('Type')}${withToken(s.fontSize, sizeToken ? `text-${sizeToken}` : null)}` +
        ` · line-height ${s.lineHeight}` +
        (s.letterSpacing && s.letterSpacing !== 'normal' ? ` · tracking ${s.letterSpacing}` : '') +
        ` · weight ${withToken(s.fontWeight, weightToken ? `font-${weightToken}` : null)}`,
    )
    lines.push(`${pad('Text color')}${withToken(s.color, tokenForColor(s.color, 'text'))}`)
    if (s.textAlign && s.textAlign !== 'start') lines.push(`${pad('Align')}${s.textAlign}`)
  }

  // --- fill and edge --------------------------------------------------------
  if (normaliseColor(s.backgroundColor) !== 'transparent') {
    lines.push(
      `${pad('Background')}${withToken(s.backgroundColor, tokenForColor(s.backgroundColor, 'bg'))}`,
    )
  }

  if (parseFloat(s.borderTopWidth) > 0) {
    lines.push(
      `${pad('Border')}${s.borderTopWidth} ${s.borderTopStyle} · ` +
        withToken(s.borderTopColor, tokenForColor(s.borderTopColor, 'border')),
    )
  }

  const radii = collapse([
    s.borderTopLeftRadius,
    s.borderTopRightRadius,
    s.borderBottomRightRadius,
    s.borderBottomLeftRadius,
  ])
  if (!radii.every((v) => parseFloat(v) === 0)) {
    const shown =
      radii.length === 1
        ? withToken(radii[0], (() => {
            const t = tokenForValue(radii[0], 'radius')
            return t ? `rounded-${t}` : null
          })())
        : `${radii.join(' ')} (no single utility)`
    lines.push(`${pad('Radius')}${shown}`)
  }

  if (s.boxShadow && s.boxShadow !== 'none') lines.push(`${pad('Shadow')}${s.boxShadow}`)
  if (s.opacity && s.opacity !== '1') lines.push(`${pad('Opacity')}${s.opacity}`)

  // --- how it was written ---------------------------------------------------
  lines.push('')
  const authored = target.authored.map((a) => a.cls).join(' ')
  lines.push(
    authored
      ? `Classes: ${authored}`
      : 'Classes: none authored — this element is styled by the design system.',
  )

  return lines.join('\n')
}
