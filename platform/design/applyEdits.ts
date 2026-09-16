// =============================================================================
// Design · applying a batch of edits to a screen's source.
//
// A pure function: source in, source out, no I/O. Backends (`fs` on the dev
// server, `github` on the deployed studio) call it; tests call it directly.
// That separation is what lets the same edit path serve a local file write and
// a commit to a branch without either one knowing about the other.
//
// Printed with **recast**, which reprints only the nodes that actually changed
// and leaves every other byte of the file alone. That is not a formatting
// nicety: a design tweak has to arrive as a one-line diff for a human to review
// it like anything else the agent commits. `ts-morph` reprints the whole file,
// which would turn every nudge into a hundred-line diff and make the review
// gate worthless.
// =============================================================================

import { parse, print, types } from 'recast'
// Two things about this import are load-bearing, both found the hard way:
//
//   • The `.js` is required, not stylistic. recast ships no `exports` map, so
//     Node's ESM resolver will not add the extension, and an extensionless
//     specifier fails at runtime even though webpack resolves it happily.
//   • recast 0.24's parsers are built against **@babel/parser 7**. On 8 this
//     parser throws `"pipelineOperator" requires "proposal" option` on the
//     first file it sees. package.json pins ^7 for that reason — bumping it to
//     8 breaks every edit in design mode, loudly but confusingly.
import tsParser from 'recast/parsers/babel-ts.js'
import type { ApplyResult, ClassEdit, Edit, PropEdit, Refusal, Src, TextEdit } from './protocol'

const n = types.namedTypes
type JSXElement = types.namedTypes.JSXElement
type JSXOpeningElement = types.namedTypes.JSXOpeningElement
type JSXAttribute = types.namedTypes.JSXAttribute

const refuse = (edit: Edit, reason: string): ApplyResult => ({
  ok: false,
  refused: { edit, reason } satisfies Refusal,
})

/** `<file>:<line>:<col>` → its two numbers. `file` is not checked here: the
 *  caller already chose the file, and a mismatched path is its bug, not this
 *  function's to second-guess. */
function positionOf(src: Src): { line: number; col: number } | null {
  const parts = src.split(':')
  if (parts.length < 3) return null
  const col = Number(parts.pop())
  const line = Number(parts.pop())
  if (!Number.isInteger(line) || !Number.isInteger(col)) return null
  return { line, col }
}

/**
 * The JSX element whose opening tag starts at `src`.
 *
 * Walks the whole tree rather than stopping at the first hit, so that two nodes
 * claiming one position surface as an ambiguity instead of a coin toss. That
 * should be impossible — a position identifies one node — but "should be
 * impossible" is exactly the assumption a wrong-line write is made of.
 */
function findBySrc(ast: types.ASTNode, src: Src): JSXElement | null | 'ambiguous' {
  const pos = positionOf(src)
  if (!pos) return null

  const found: JSXElement[] = []
  types.visit(ast, {
    visitJSXElement(path) {
      const loc = path.node.openingElement.loc
      if (loc && loc.start.line === pos.line && loc.start.column === pos.col) {
        found.push(path.node)
      }
      this.traverse(path)
    },
  })

  if (found.length === 0) return null
  if (found.length > 1) return 'ambiguous'
  return found[0]
}

/** A named attribute on an opening tag, or undefined. Spread attributes are
 *  skipped: `{...props}` may or may not carry the name, and guessing which is
 *  the whole failure mode this protocol exists to avoid. */
function attributeNamed(open: JSXOpeningElement, name: string): JSXAttribute | undefined {
  for (const attr of open.attributes ?? []) {
    if (n.JSXAttribute.check(attr) && n.JSXIdentifier.check(attr.name) && attr.name.name === name) {
      return attr
    }
  }
  return undefined
}

/**
 * The literal string value of an attribute, or null when it isn't one.
 *
 * `className="a b"` and `className={"a b"}` both read; `className={cn(...)}`
 * and template literals deliberately do not. A computed class list has no
 * single authored string to swap, so an edit against one is refused and handed
 * to the agent — which can read the expression, as this function cannot.
 */
function literalValue(attr: JSXAttribute): string | null {
  const v = attr.value
  if (!v) return null
  if (n.StringLiteral.check(v)) return v.value
  if (n.JSXExpressionContainer.check(v) && n.StringLiteral.check(v.expression)) {
    return v.expression.value
  }
  return null
}

/**
 * Write a literal back, in place.
 *
 * Mutating the existing node rather than replacing it with a fresh one is what
 * keeps recast's patcher on the narrow path: a replaced node has no original to
 * diff against, so recast falls back to reprinting an ancestor and the diff
 * grows. The shape is preserved too — a string attribute stays a string
 * attribute, an expression stays an expression.
 */
function setLiteralValue(attr: JSXAttribute, next: string): void {
  const v = attr.value
  if (v && n.JSXExpressionContainer.check(v) && n.StringLiteral.check(v.expression)) {
    v.expression.value = next
    return
  }
  if (v && n.StringLiteral.check(v)) {
    v.value = next
    return
  }
  attr.value = types.builders.stringLiteral(next)
}

function applyClass(el: JSXElement, edit: ClassEdit): Refusal | null {
  const attr = attributeNamed(el.openingElement, 'className')
  if (!attr) return { edit, reason: 'that element has no className to change' }

  const current = literalValue(attr)
  if (current === null) {
    return { edit, reason: 'its className is computed, so there is no single class list to edit' }
  }

  const classes = current.split(/\s+/).filter(Boolean)
  const at = classes.indexOf(edit.oldClass)
  if (at === -1) {
    return { edit, reason: `its className no longer contains "${edit.oldClass}"` }
  }

  classes[at] = edit.newClass
  setLiteralValue(attr, classes.join(' '))
  return null
}

function applyText(el: JSXElement, edit: TextEdit): Refusal | null {
  const texts = (el.children ?? []).filter((c) => n.JSXText.check(c)) as types.namedTypes.JSXText[]
  // Compared trimmed because JSX text carries the indentation around it, which
  // is layout in the file and not something the designer edited.
  const match = texts.filter((t) => t.value.trim() === edit.old)

  if (match.length === 0) return { edit, reason: 'its text has changed since you selected it' }
  if (match.length > 1) return { edit, reason: 'that text appears more than once inside the element' }

  const node = match[0]
  node.value = node.value.replace(edit.old, edit.next)
  return null
}

function applyProp(el: JSXElement, edit: PropEdit): Refusal | null {
  const open = el.openingElement
  const attr = attributeNamed(open, edit.prop)

  if (!attr) {
    // Absent is a legitimate old value — it is how adding a prop stays checked.
    if (edit.old !== null) {
      return { edit, reason: `it has no ${edit.prop} to change` }
    }
    // Absent, and asked to remove: already how it should be.
    if (edit.next === null) return null
    open.attributes = open.attributes ?? []
    open.attributes.push(
      types.builders.jsxAttribute(
        types.builders.jsxIdentifier(edit.prop),
        types.builders.stringLiteral(edit.next),
      ),
    )
    return null
  }

  if (edit.old === null) {
    return { edit, reason: `it already has a ${edit.prop}` }
  }

  const current = literalValue(attr)
  if (edit.next === null) {
    if (current !== null && current !== edit.old) {
      return { edit, reason: `its ${edit.prop} is now "${current}", not "${edit.old}"` }
    }
    open.attributes = (open.attributes ?? []).filter((a) => a !== attr)
    return null
  }
  if (current === null) {
    return { edit, reason: `its ${edit.prop} is computed, so there is no single value to edit` }
  }
  if (current !== edit.old) {
    return { edit, reason: `its ${edit.prop} is now "${current}", not "${edit.old}"` }
  }

  setLiteralValue(attr, edit.next)
  return null
}

/**
 * Apply a batch of edits to one file's source.
 *
 * **Atomic.** Edits are applied in order against one live AST — recast's node
 * objects stay valid as the tree mutates, so an earlier edit never invalidates
 * a later edit's address — and the first refusal abandons the whole batch,
 * returning the source untouched. Half a batch is a state nobody asked for.
 */
export function applyEdits(source: string, edits: readonly Edit[]): ApplyResult {
  if (edits.length === 0) return { ok: true, source }

  let ast: types.ASTNode
  try {
    ast = parse(source, { parser: tsParser })
  } catch {
    return refuse(edits[0], 'that screen could not be parsed')
  }

  for (const edit of edits) {
    const el = findBySrc(ast, edit.src)
    if (el === null) {
      return refuse(edit, 'that element is no longer where it was — the screen has changed since it loaded')
    }
    if (el === 'ambiguous') {
      return refuse(edit, 'that position matches more than one element')
    }

    const refusal =
      edit.kind === 'class'
        ? applyClass(el, edit)
        : edit.kind === 'text'
          ? applyText(el, edit)
          : applyProp(el, edit)

    if (refusal) return { ok: false, refused: refusal }
  }

  return { ok: true, source: print(ast).code }
}
