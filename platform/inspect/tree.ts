// =============================================================================
// Inspect · the layers outline.
//
// A DOM tree is the wrong thing to show a designer — `<div><div><span>` names
// nothing they recognise. So this walks the rendered screen and keeps only the
// nodes that MEAN something, flattening everything else away:
//
//   • FunDS components   — named by component (`Card`, `Button`), the vocabulary
//                          the screen was actually written in.
//   • Text leaves        — the copy, quoted, because content is what a designer
//                          most often hunts for.
//   • Styled containers  — anything carrying a token class the panels can edit
//                          (a gap, a padding, a radius). These are exactly the
//                          wrappers that are hardest to hover and easiest to
//                          miss, so they earn a row even though the DOM calls
//                          them nothing.
//
// Anonymous wrappers are skipped but WALKED THROUGH, so their meaningful
// descendants attach to the nearest kept ancestor. That is what keeps the
// outline shallow enough to read: the tree mirrors the design's structure, not
// the markup's.
//
// Design-system internals fall out for free: a component's own chrome is styled
// with hand-written `ds-*` CSS carrying no token classes, so it is never
// "styled" by the test below and never earns a row. What survives inside a
// component is the project's own markup — which is the only part a prototype
// may edit anyway.
// =============================================================================

import { valueForClass } from './tokenMap'

export type NodeKind = 'component' | 'text' | 'container'

export interface OutlineNode {
  el: Element
  /** What the row says: component name, layout role, or the text itself. */
  label: string
  /** Secondary line — a component's text, or nothing. */
  detail: string
  kind: NodeKind
  children: OutlineNode[]
}

/** Utilities that describe size or position rather than design intent. A
 *  wrapper whose only token is `w-full` is plumbing, not a layer. */
const NOT_STYLING = /^(w|h|size|min-w|min-h|max-w|max-h|top|right|bottom|left|inset|inset-x|inset-y|z)-/

function hasTokenStyling(el: Element): boolean {
  for (const cls of Array.from(el.classList)) {
    if (cls.startsWith('ds-') || NOT_STYLING.test(cls)) continue
    if (valueForClass(cls) !== null) return true
  }
  return false
}

function textOf(el: Element, max = 40): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** A layer name a designer would recognise, inferred from the element's role.
 *  Flex direction becomes Figma's auto-layout vocabulary (Stack / Row) because
 *  that is what these wrappers are, and what the designer would have drawn. */
function containerLabel(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const byTag: Record<string, string> = {
    ul: 'List', ol: 'List', li: 'Item',
    section: 'Section', header: 'Header', footer: 'Footer', nav: 'Nav',
    main: 'Main', aside: 'Aside', form: 'Form', label: 'Label',
    img: 'Image', svg: 'Icon', button: 'Button', a: 'Link',
    input: 'Input', textarea: 'Input', select: 'Select', table: 'Table',
    p: 'Text', span: 'Text', h1: 'Heading', h2: 'Heading', h3: 'Heading',
    h4: 'Heading', h5: 'Heading', h6: 'Heading',
  }
  if (byTag[tag]) return byTag[tag]

  const cls = el.classList
  if (cls.contains('grid')) return 'Grid'
  if (cls.contains('flex')) return cls.contains('flex-col') ? 'Stack' : 'Row'
  return 'Group'
}

function kindOf(el: Element): NodeKind | null {
  if (el.hasAttribute('data-fds')) return 'component'
  // A leaf carrying words is the copy on screen — always worth a row.
  if (el.children.length === 0 && textOf(el, 1).length > 0) return 'text'
  if (hasTokenStyling(el)) return 'container'
  return null
}

/** Zero-size nodes (a closed sheet, an `hidden` branch) can't be pointed at in
 *  the device, so listing them would offer a selection that does nothing. */
function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

const MAX_NODES = 400

/**
 * Build the outline for a rendered screen. `root` is the inspect viewport;
 * the root itself never appears, only what it contains.
 */
export function buildOutline(root: Element): OutlineNode[] {
  let budget = MAX_NODES

  const walk = (parent: Element): OutlineNode[] => {
    const out: OutlineNode[] = []

    for (const el of Array.from(parent.children)) {
      if (budget <= 0) break
      // The inspect overlay lives inside the viewport as a sibling of the
      // screen; it is chrome, not content.
      if (el.hasAttribute('data-inspect-layer')) continue
      if (!isVisible(el)) continue

      const kind = kindOf(el)
      if (!kind) {
        // Skipped, but not pruned: its meaningful descendants belong to us.
        out.push(...walk(el))
        continue
      }

      budget -= 1
      const children = kind === 'text' ? [] : walk(el)
      const text = textOf(el)

      out.push({
        el,
        kind,
        label:
          kind === 'component'
            ? (el.getAttribute('data-fds') ?? 'Component')
            : kind === 'text'
              ? text
              : containerLabel(el),
        // A component's own text is its identity ("Button · Salin"); a
        // container's text belongs to its children, which have their own rows.
        detail: kind === 'component' ? text : '',
        children,
      })
    }

    return out
  }

  return walk(root)
}

/** The path of outline nodes from the roots down to `el`, if it is listed. */
export function pathTo(nodes: OutlineNode[], el: Element): OutlineNode[] {
  for (const node of nodes) {
    if (node.el === el) return [node]
    const below = pathTo(node.children, el)
    if (below.length > 0) return [node, ...below]
  }
  return []
}
