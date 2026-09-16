// =============================================================================
// Design · structural helpers for the syntax tree.
//
// The mechanics under `move`, `delete` and `duplicate` (and, in D3, `insert`
// and `wrap`): taking a JSX node out of its parent's children, putting it back
// somewhere else, and doing both without disturbing the file's layout.
//
// JSX children are not just elements. Between every two elements sits a
// whitespace JSXText carrying the newline and the indentation of the next
// line, and that text is what makes a moved card land on its own line at the
// right depth. So every detach takes one of those with it, and every attach
// brings one, copied from the siblings it joins. recast reuses the moved
// element's own source and re-indents it; the whitespace is ours to keep
// consistent.
//
// Pure AST work — no I/O, no client code. Imported by applyEdits only.
// =============================================================================

import { types } from 'recast'
import { CONTAINER_COMPONENTS, LEAF_COMPONENTS, VOID_TAGS } from './vocabulary'

const n = types.namedTypes
const b = types.builders

export type JSXElement = types.namedTypes.JSXElement
export type JSXParent = types.namedTypes.JSXElement | types.namedTypes.JSXFragment
type JSXChild = NonNullable<JSXParent['children']>[number]

export function tagName(el: JSXElement): string | null {
  const name = el.openingElement.name
  if (n.JSXIdentifier.check(name)) return name.name
  if (n.JSXMemberExpression.check(name) && n.JSXIdentifier.check(name.property)) {
    return name.property.name
  }
  return null
}

/**
 * Whether `el` can take child elements.
 *
 * An HTML tag can unless it is void; a design-system component can if it is a
 * listed container and never if it is a known leaf (a Button's children are
 * its label). A project's own component is judged by what it already holds:
 * one that already wraps elements demonstrably renders them. Anything else is
 * refused rather than assumed — a component that ignores its children would
 * swallow the moved node without a trace.
 */
export function canHold(el: JSXElement): boolean {
  const name = tagName(el)
  if (!name) return false
  if (/^[a-z]/.test(name)) return !VOID_TAGS.includes(name)
  if (CONTAINER_COMPONENTS.includes(name)) return true
  if (LEAF_COMPONENTS.includes(name)) return false
  return (el.children ?? []).some((c) => n.JSXElement.check(c) || n.JSXFragment.check(c))
}

/** Whitespace that only lays out lines — dropped by JSX when rendering. */
export function isLayoutText(c: JSXChild): boolean {
  return n.JSXText.check(c) && /^\s*$/.test(c.value) && c.value.includes('\n')
}

function isElementish(c: JSXChild): boolean {
  return !isLayoutText(c)
}

/** The indentation a child of `parent` should carry, from its siblings. */
function childIndent(parent: JSXParent, lines: string[]): string {
  const kids = parent.children ?? []
  for (let i = 1; i < kids.length; i++) {
    const ws = kids[i - 1]
    if (isElementish(kids[i]) && n.JSXText.check(ws)) {
      const m = /\n([ \t]*)$/.exec(ws.value)
      if (m) return m[1]
    }
  }
  return `${lineIndent(parent, lines)}  `
}

/** The indentation of the line `node` starts on. */
function lineIndent(node: types.ASTNode & { loc?: types.namedTypes.SourceLocation | null }, lines: string[]): string {
  const line = node.loc ? lines[node.loc.start.line - 1] : undefined
  return line ? (/^[ \t]*/.exec(line)?.[0] ?? '') : ''
}

const ws = (indent: string) => b.jsxText(`\n${indent}`)

/**
 * Take `el` out of `parent`, with the one line-break text that belongs to it.
 *
 * The text BEFORE is preferred: in `[ws, A, ws, B, ws]` removing A together
 * with its leading break leaves `[ws, B, ws]`, exactly the shape of a parent
 * that never had A. Only when there is no leading break (A was first on its
 * line) is the trailing one taken instead.
 */
export function detach(parent: JSXParent, el: JSXElement): void {
  const kids = parent.children ?? []
  const i = kids.indexOf(el)
  if (i === -1) return
  const before = kids[i - 1]
  const after = kids[i + 1]
  if (before && isLayoutText(before)) kids.splice(i - 1, 2)
  else if (after && isLayoutText(after)) kids.splice(i, 2)
  else kids.splice(i, 1)
}

/** Put `el` into `parent` immediately before `anchor`. */
export function attachBefore(parent: JSXParent, anchor: JSXChild, el: JSXElement, lines: string[]) {
  const kids = parent.children ?? []
  const i = kids.indexOf(anchor)
  kids.splice(i, 0, el, ws(childIndent(parent, lines)))
}

/** Put `el` into `parent` immediately after `anchor`. */
export function attachAfter(parent: JSXParent, anchor: JSXChild, el: JSXElement, lines: string[]) {
  const kids = parent.children ?? []
  const i = kids.indexOf(anchor)
  kids.splice(i + 1, 0, ws(childIndent(parent, lines)), el)
}

/**
 * Append `el` as the last child of `container`.
 *
 * A self-closing container is opened first. A container with no children at
 * all gets the whole frame — break, child, break back to its own indentation —
 * so `<div className="h-8" />` becomes a three-line element rather than
 * `<div className="h-8"><p>…</p></div>` on one line.
 */
export function append(container: JSXElement, el: JSXElement, lines: string[]) {
  const open = container.openingElement
  if (open.selfClosing || !container.closingElement) {
    open.selfClosing = false
    container.closingElement = b.jsxClosingElement(copyName(open.name))
  }
  container.children = container.children ?? []
  const kids = container.children
  const indent = childIndent(container, lines)

  let last = -1
  kids.forEach((c, i) => {
    if (isElementish(c)) last = i
  })

  if (last === -1) {
    container.children = [ws(indent), el, ws(lineIndent(container, lines))]
    return
  }
  kids.splice(last + 1, 0, ws(indent), el)
}

function copyName(name: JSXElement['openingElement']['name']): JSXElement['openingElement']['name'] {
  if (n.JSXIdentifier.check(name)) return b.jsxIdentifier(name.name)
  if (n.JSXMemberExpression.check(name)) {
    return b.jsxMemberExpression(
      copyName(name.object) as types.namedTypes.JSXMemberExpression,
      b.jsxIdentifier(name.property.name),
    )
  }
  return b.jsxIdentifier(String((name as { name?: unknown }).name ?? 'div'))
}

/** Whether `target` is `root` or anywhere beneath it. */
export function contains(root: types.ASTNode, target: types.ASTNode): boolean {
  if (root === target) return true
  let found = false
  types.visit(root, {
    visitNode(path) {
      if (path.node === target) {
        found = true
        return false
      }
      this.traverse(path)
    },
  })
  return found
}
