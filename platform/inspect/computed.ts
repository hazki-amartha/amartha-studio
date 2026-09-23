// =============================================================================
// Inspect · the computed list and the box model, as the CSS tab reads them.
//
// Both adapted from Airship's CSS pane (github.com/0xnyn/airship,
// packages/overlay/src/inspector/css-groups.ts and css-box-model.ts):
//
//   • A resolved style is ~340 properties in alphabetical order — a haystack,
//     not a panel. So it is split into sections (Layout, Box, Typography…) and
//     cut down to the values this element actually asked for: a bare element
//     of the same tag is dropped into the same parent, read, and removed in
//     one task, and anything that matches it is default or inherited noise.
//   • The box model answers "why is there a gap here" without reading a list.
//     Sizes come from layout (client box, computed padding/border/margin), not
//     from getBoundingClientRect — the device is CSS-scaled, and a client rect
//     would report every size multiplied by the canvas zoom.
// =============================================================================

export type GroupId = 'layout' | 'box' | 'typography' | 'appearance' | 'effects' | 'motion' | 'other'

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: 'layout', label: 'Layout' },
  { id: 'box', label: 'Box' },
  { id: 'typography', label: 'Typography' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'effects', label: 'Effects' },
  { id: 'motion', label: 'Motion' },
  { id: 'other', label: 'Other' },
]

/** Properties whose obvious prefix would file them under the wrong heading. */
const EXACT: Record<string, GroupId> = {
  'text-shadow': 'effects',
  'column-gap': 'layout',
  'row-gap': 'layout',
  'overflow-wrap': 'typography',
  'border-collapse': 'other',
  'border-spacing': 'other',
}

/** First match wins, so order within the list matters. */
const PREFIXES: [GroupId, string[]][] = [
  [
    'layout',
    ['align-', 'aspect-ratio', 'bottom', 'clear', 'container', 'display', 'flex', 'float', 'gap', 'grid',
      'inset', 'justify-', 'left', 'order', 'place-', 'position', 'right', 'top', 'z-index'],
  ],
  [
    'box',
    ['block-size', 'border', 'box-sizing', 'height', 'inline-size', 'margin', 'max-', 'min-', 'overflow',
      'padding', 'width'],
  ],
  [
    'typography',
    ['column', 'direction', 'font', 'hyphens', 'letter-spacing', 'line-', 'list-style', 'quotes', 'tab-size',
      'text', 'unicode-bidi', 'vertical-align', 'white-space', 'word-', 'writing-mode'],
  ],
  [
    'appearance',
    ['accent-color', 'appearance', 'background', 'caret-color', 'color', 'cursor', 'isolation',
      'mix-blend-mode', 'object-', 'opacity', 'outline', 'pointer-events', 'resize', 'user-select',
      'visibility'],
  ],
  [
    'effects',
    ['backdrop-filter', 'box-shadow', 'clip', 'contain', 'filter', 'mask', 'perspective', 'rotate', 'scale',
      'transform', 'translate', 'will-change'],
  ],
  ['motion', ['animation', 'offset', 'overscroll', 'scroll', 'transition', 'view-']],
]

function groupOf(property: string): GroupId {
  if (EXACT[property]) return EXACT[property]
  for (const [id, prefixes] of PREFIXES) {
    if (prefixes.some((p) => property.startsWith(p))) return id
  }
  return 'other'
}

export interface ComputedProp {
  property: string
  value: string
}

/**
 * What this element would compute to if nothing styled it: a bare element of
 * the same tag, appended to the same parent so it inherits what the node
 * inherits, read and removed within one task. Appended at the end rather than
 * beside the node, so sibling selectors (`* + *`) don't style the probe too.
 */
function defaultsFor(el: Element): Map<string, string> {
  const out = new Map<string, string>()
  const parent = el.parentElement
  if (!parent) return out
  let probe: Element
  try {
    probe = document.createElementNS(el.namespaceURI, el.localName)
  } catch {
    return out
  }
  // Tagged so the layers tree and the design overlay ignore its brief visit.
  probe.setAttribute('data-inspect-layer', '')
  try {
    parent.append(probe)
    const cs = getComputedStyle(probe)
    for (let i = 0; i < cs.length; i++) out.set(cs[i], cs.getPropertyValue(cs[i]).trim())
  } catch {
    // A parent that rejects children just means no defaults — show everything.
  } finally {
    probe.remove()
  }
  return out
}

/** The element's non-default computed values, grouped, in GROUPS order. */
export function computedGroups(el: Element): { id: GroupId; label: string; props: ComputedProp[] }[] {
  const defaults = defaultsFor(el)
  const cs = getComputedStyle(el)
  const byGroup = new Map<GroupId, ComputedProp[]>()

  for (let i = 0; i < cs.length; i++) {
    const property = cs[i]
    // Vendor-prefixed duplicates and custom properties are noise here.
    if (property.startsWith('-')) continue
    const value = cs.getPropertyValue(property).trim()
    if (defaults.size > 0 && defaults.get(property) === value) continue
    const id = groupOf(property)
    const list = byGroup.get(id) ?? []
    list.push({ property, value })
    byGroup.set(id, list)
  }

  return GROUPS.filter((g) => byGroup.has(g.id)).map((g) => ({
    ...g,
    props: byGroup.get(g.id)!.sort((a, b) => a.property.localeCompare(b.property)),
  }))
}

export type Sides = [number, number, number, number] // top, right, bottom, left

export interface BoxModel {
  margin: Sides
  border: Sides
  padding: Sides
  /** Content box, in layout px. Null for an inline box, which has none. */
  width: number | null
  height: number | null
}

const px = (v: string) => Math.round((parseFloat(v) || 0) * 100) / 100

export function boxModel(el: Element): BoxModel {
  const s = getComputedStyle(el)
  const sides = (prop: (side: string) => string): Sides =>
    ['Top', 'Right', 'Bottom', 'Left'].map((side) => px(s.getPropertyValue(prop(side)))) as Sides

  const margin = sides((d) => `margin-${d.toLowerCase()}`)
  const border = sides((d) => `border-${d.toLowerCase()}-width`)
  const padding = sides((d) => `padding-${d.toLowerCase()}`)

  // clientWidth is the padding box in layout px — unaffected by the canvas's
  // scale — so the content box is it minus the padding.
  const inline = s.display === 'inline'
  const width = inline ? null : Math.max(0, px(String(el.clientWidth)) - padding[1] - padding[3])
  const height = inline ? null : Math.max(0, px(String(el.clientHeight)) - padding[0] - padding[2])

  return { margin, border, padding, width, height }
}
