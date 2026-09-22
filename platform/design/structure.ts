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
export type JSXChild = NonNullable<JSXParent['children']>[number]

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
  return n.JSXText.check(c) && /^\s*$/.test(unmarked(c.value)) && c.value.includes('\n')
}

/** A break's text as it will print — without the marks `ws` carries. */
const unmarked = (value: string) => value.replace(/\u0001([ \t]*)\u0002/g, '$1')

export function isElementish(c: JSXChild): boolean {
  return !isLayoutText(c)
}

/**
 * Where indentation comes from.
 *
 * `lines` is the original file; `placed` records the indentation every node
 * was given when this batch attached it somewhere. A node the batch created
 * has no line of its own, and a node the batch moved still carries its OLD
 * line — in both cases what it was given is the truth.
 */
export interface Indent {
  lines: string[]
  placed: WeakMap<object, string>
}

/** The indentation a child of `parent` should carry, from its siblings. */
function childIndent(parent: JSXParent, ind: Indent): string {
  const given = ind.placed.get(parent)
  if (given !== undefined) return `${given}  `
  const kids = parent.children ?? []
  for (let i = 1; i < kids.length; i++) {
    const ws = kids[i - 1]
    if (isElementish(kids[i]) && n.JSXText.check(ws)) {
      const m = /\n([ \t]*)$/.exec(unmarked(ws.value))
      if (m) return m[1]
    }
  }
  return `${lineIndent(parent, ind)}  `
}

/** The indentation of the line `node` starts on. */
export function lineIndent(
  node: types.ASTNode & { loc?: types.namedTypes.SourceLocation | null },
  ind: Indent,
): string {
  const given = ind.placed.get(node)
  if (given !== undefined) return given
  const line = node.loc ? ind.lines[node.loc.start.line - 1] : undefined
  return line ? (/^[ \t]*/.exec(line)?.[0] ?? '') : ''
}

/**
 * A line break this batch writes, carrying the indentation it means.
 *
 * recast does not print new whitespace as written. Patching an element in
 * place, it re-indents the element by its own column — new breaks included —
 * so "\n" + 10 spaces inside an element at column 8 came out at 18. Reprinting
 * an element whole, it drops a whitespace-only break and lays the children out
 * itself. Which of the two happens depends on which ancestor recast chose to
 * reprint, and that isn't ours to predict.
 *
 * So the indentation travels between two marks that are not whitespace:
 * recast leaves them alone either way, and `settleIndents` turns each back
 * into a break at exactly the indentation inside them.
 */
const OPEN = '\u0001'
const CLOSE = '\u0002'

export const ws = (indent: string) => b.jsxText(`\n${OPEN}${indent}${CLOSE}`)

/**
 * Printed source with every written break at exactly the indentation it was
 * given. A mark still at the start of a line lost only its indentation (the
 * patched path); one that isn't lost its line break too (the reprinted path).
 */
export function settleIndents(code: string): string {
  return code
    .replace(/^[ \t]*\u0001([ \t]*)\u0002/gm, '$1')
    .replace(/[ \t]*\u0001([ \t]*)\u0002/g, '\n$1')
}

/** Whether any mark survived — a print this module can't vouch for. */
export const unsettled = (code: string) => code.includes(OPEN) || code.includes(CLOSE)

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
export function attachBefore(parent: JSXParent, anchor: JSXChild, el: JSXChild, ind: Indent) {
  const kids = parent.children ?? []
  const i = kids.indexOf(anchor)
  const indent = childIndent(parent, ind)
  ind.placed.set(el, indent)
  kids.splice(i, 0, el, ws(indent))
}

/** Put `el` into `parent` immediately after `anchor`. */
export function attachAfter(parent: JSXParent, anchor: JSXChild, el: JSXChild, ind: Indent) {
  const kids = parent.children ?? []
  const i = kids.indexOf(anchor)
  const indent = childIndent(parent, ind)
  ind.placed.set(el, indent)
  kids.splice(i + 1, 0, ws(indent), el)
}

/**
 * Append `el` as the last child of `container`.
 *
 * A self-closing container is opened first. A container with no children at
 * all gets the whole frame — break, child, break back to its own indentation —
 * so `<div className="h-8" />` becomes a three-line element rather than
 * `<div className="h-8"><p>…</p></div>` on one line.
 */
export function append(container: JSXElement, el: JSXChild, ind: Indent) {
  const open = container.openingElement
  if (open.selfClosing || !container.closingElement) {
    open.selfClosing = false
    container.closingElement = b.jsxClosingElement(copyName(open.name))
  }
  container.children = container.children ?? []
  const kids = container.children
  const indent = childIndent(container, ind)
  ind.placed.set(el, indent)

  let last = -1
  kids.forEach((c, i) => {
    if (isElementish(c)) last = i
  })

  if (last === -1) {
    container.children = [ws(indent), el, ws(lineIndent(container, ind))]
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

/** The JSX element or fragment whose children hold `node` directly, or null. */
export function parentOf(root: types.ASTNode, node: types.ASTNode): JSXParent | null {
  let found: JSXParent | null = null
  const check = (owner: JSXParent) => {
    if ((owner.children ?? []).includes(node as JSXChild)) found = owner
  }
  types.visit(root, {
    visitJSXElement(path) {
      check(path.node)
      if (found) return false
      this.traverse(path)
    },
    visitJSXFragment(path) {
      check(path.node)
      if (found) return false
      this.traverse(path)
    },
  })
  return found
}

/** A JSX element built from scratch: `<tag a="b">text</tag>` or `<tag a="b" />`. */
export function buildElement(
  tag: string,
  props: Record<string, string>,
  children: JSXChild[] | null,
): JSXElement {
  const attrs = Object.entries(props).map(([k, v]) =>
    b.jsxAttribute(b.jsxIdentifier(k), b.stringLiteral(v)),
  )
  const selfClosing = children === null
  return b.jsxElement(
    b.jsxOpeningElement(b.jsxIdentifier(tag), attrs, selfClosing),
    selfClosing ? null : b.jsxClosingElement(b.jsxIdentifier(tag)),
    children ?? [],
  )
}

export const text = (value: string) => b.jsxText(value)
