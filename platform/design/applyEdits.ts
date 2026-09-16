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
//   • A namespace import, not a default one. The module is compiled CommonJS
//     with `__esModule` set and no `default` export: Node's ESM loader hands
//     back `module.exports` as the default anyway, so the tests passed, but
//     webpack honours `__esModule` and resolved the default to `undefined`.
//     recast then fell back to its JavaScript parser, and every Apply on the
//     dev server refused with "that screen could not be parsed".
//   • recast 0.24's parsers are built against **@babel/parser 7**. On 8 this
//     parser throws `"pipelineOperator" requires "proposal" option` on the
//     first file it sees. package.json pins ^7 for that reason — bumping it to
//     8 breaks every edit in design mode, loudly but confusingly.
import * as tsParser from 'recast/parsers/babel-ts.js'
import { isStructural } from './protocol'
import type {
  ApplyResult,
  ClassEdit,
  DeleteEdit,
  DuplicateEdit,
  Edit,
  MoveEdit,
  PropEdit,
  Refusal,
  Src,
  TextEdit,
} from './protocol'
import {
  append,
  attachAfter,
  attachBefore,
  canHold,
  contains,
  detach,
  tagName,
  type JSXElement,
  type JSXParent,
} from './structure'
import { restoreSemicolons, tidyImports } from './tidy'

const n = types.namedTypes
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

/** An addressed element, and the JSX element or fragment it sits in directly —
 *  null when it is not a JSX child (a screen's root, a `.map()` row, the right
 *  side of `cond && …`). */
interface Located {
  el: JSXElement
  parent: JSXParent | null
}

/**
 * The JSX element whose opening tag starts at `src`.
 *
 * Walks the whole tree rather than stopping at the first hit, so that two nodes
 * claiming one position surface as an ambiguity instead of a coin toss. That
 * should be impossible — a position identifies one node — but "should be
 * impossible" is exactly the assumption a wrong-line write is made of.
 *
 * Copies made earlier in the batch (`fresh`) are skipped, subtree and all:
 * they keep their original's position so recast can print them from source,
 * and must not be mistaken for it.
 */
function locate(ast: types.ASTNode, src: Src, fresh: WeakSet<object>): Located | null | 'ambiguous' {
  const pos = positionOf(src)
  if (!pos) return null

  const found: Located[] = []
  types.visit(ast, {
    visitJSXElement(path) {
      if (fresh.has(path.node)) return false
      const loc = path.node.openingElement.loc
      if (loc && loc.start.line === pos.line && loc.start.column === pos.col) {
        found.push({ el: path.node, parent: jsxParentOf(path) })
      }
      this.traverse(path)
    },
  })

  if (found.length === 0) return null
  if (found.length > 1) return 'ambiguous'
  return found[0]
}

/** The JSX parent a path sits in directly, or null. In ast-types a child's
 *  parent path is the `children` array, and that array's parent is the owner. */
interface PathLike {
  parentPath?: { name?: unknown; parentPath?: { value?: unknown } } | null
}

function jsxParentOf(path: PathLike): JSXParent | null {
  const list = path.parentPath
  if (!list || list.name !== 'children') return null
  const owner = list.parentPath?.value
  return n.JSXElement.check(owner) || n.JSXFragment.check(owner) ? owner : null
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

// --- structure (D2) -------------------------------------------------------------

/** Why a located node cannot be picked up, or null when it can. */
function movable(at: Located, edit: Edit): Refusal | null {
  if (at.parent) return null
  return {
    edit,
    reason:
      'it isn’t placed directly in the layout — it is the screen itself, repeated by a list, or shown by a condition — so moving it means changing code',
  }
}

interface Ctx {
  ast: types.ASTNode
  fresh: WeakSet<object>
  lines: string[]
  /** Printed copies waiting for their placeholders, by placeholder name. */
  copies: Map<string, string>
}

function find(ctx: Ctx, edit: Edit, src: Src, role: string): Located | Refusal {
  const at = locate(ctx.ast, src, ctx.fresh)
  if (at === null) {
    return { edit, reason: `${role} is no longer where it was — the screen has changed since it loaded` }
  }
  if (at === 'ambiguous') return { edit, reason: `${role}’s position matches more than one element` }
  return at
}

const isRefusal = (x: Located | Refusal): x is Refusal => 'reason' in x

function applyMove(ctx: Ctx, edit: MoveEdit): Refusal | null {
  const node = find(ctx, edit, edit.src, 'that element')
  if (isRefusal(node)) return node
  const blocked = movable(node, edit)
  if (blocked) return blocked

  const to = edit.to
  const anchorSrc = 'before' in to ? to.before : 'after' in to ? to.after : to.inside
  const anchor = find(ctx, edit, anchorSrc, 'the place you dropped it')
  if (isRefusal(anchor)) return anchor
  if (contains(node.el, anchor.el)) {
    return { edit, reason: 'an element can’t be moved into itself' }
  }

  if ('inside' in to) {
    if (!canHold(anchor.el)) {
      return { edit, reason: `a ${tagName(anchor.el) ?? 'that element'} can’t hold other elements` }
    }
    detach(node.parent!, node.el)
    append(anchor.el, node.el, ctx.lines)
    return null
  }

  if (!anchor.parent) {
    return {
      edit,
      reason: 'the place you dropped it isn’t directly in the layout, so there is nothing to put it beside',
    }
  }
  detach(node.parent!, node.el)
  if ('before' in to) attachBefore(anchor.parent, anchor.el, node.el, ctx.lines)
  else attachAfter(anchor.parent, anchor.el, node.el, ctx.lines)
  return null
}

function applyDelete(ctx: Ctx, edit: DeleteEdit): Refusal | null {
  const node = find(ctx, edit, edit.src, 'that element')
  if (isRefusal(node)) return node
  const blocked = movable(node, edit)
  if (blocked) return blocked
  detach(node.parent!, node.el)
  return null
}

/**
 * Duplicate by TEXT, through a placeholder.
 *
 * A structural copy of the node, printed by recast, came out reformatted — the
 * printer can only reuse source for nodes it parsed, and a copy is a new node.
 * So the copy goes in as `{__design_copy_N__}` and is swapped for the
 * original's own printed text after the file is printed: byte-identical to
 * what the author wrote, including any value edits already applied to it.
 */
function applyDuplicate(ctx: Ctx, edit: DuplicateEdit): Refusal | null {
  const node = find(ctx, edit, edit.src, 'that element')
  if (isRefusal(node)) return node
  const blocked = movable(node, edit)
  if (blocked) return blocked

  // A multi-line template literal would have its CONTENT re-indented below,
  // silently changing a string. Rare in markup, and not worth a guess.
  let multiline = false
  types.visit(node.el, {
    visitTemplateLiteral(path) {
      if (path.node.quasis.some((q) => q.value.raw.includes('\n'))) multiline = true
      return false
    },
  })
  if (multiline) {
    return { edit, reason: 'it contains a multi-line text template, which can’t be copied safely here' }
  }

  const raw = print(node.el).code

  // recast prints a lone node from column 0; the copy sits beside its
  // original, so every line after the first gets the original's indentation.
  const line = node.el.loc ? ctx.lines[node.el.loc.start.line - 1] : ''
  const indent = /^[ \t]*/.exec(line ?? '')?.[0] ?? ''
  const text = raw
    .split('\n')
    .map((l, i) => (i === 0 || l === '' ? l : indent + l))
    .join('\n')
  const name = `__design_copy_${ctx.copies.size}__`
  ctx.copies.set(name, text)
  const placeholder = types.builders.jsxExpressionContainer(types.builders.identifier(name))
  ctx.fresh.add(placeholder)
  attachAfter(node.parent!, node.el, placeholder as unknown as JSXElement, ctx.lines)
  return null
}

function fillCopies(printed: string, copies: Map<string, string>): string {
  let out = printed
  for (const [name, text] of copies) out = out.replace(`{${name}}`, () => text)
  return out
}

/**
 * Apply a batch of edits to one file's source.
 *
 * **Atomic.** Edits are applied in order against one live AST — recast's node
 * objects stay valid as the tree mutates, so an earlier edit never invalidates
 * a later edit's address, even when it moved or removed nodes around it — and
 * the first refusal abandons the whole batch, returning the source untouched.
 * Half a batch is a state nobody asked for.
 *
 * Every address is resolved against the ORIGINAL positions, because that is
 * the file the designer was looking at: a moved node keeps its `loc`, so it is
 * still found by the address it was stamped with.
 */
export function applyEdits(source: string, edits: readonly Edit[]): ApplyResult {
  if (edits.length === 0) return { ok: true, source }

  let ast: types.ASTNode
  try {
    ast = parse(source, { parser: tsParser })
  } catch {
    return refuse(edits[0], 'that screen could not be parsed')
  }

  const ctx: Ctx = { ast, fresh: new WeakSet(), lines: source.split('\n'), copies: new Map() }

  // Values first, then structure. A value edit's address never depends on
  // structure (addresses resolve against original positions), and applying
  // values first makes a duplicate carry every value edit to its original —
  // which is what the overlay shows, since it patches the live element before
  // cloning it. It also lets "restyle it, then delete it" apply as staged.
  const values = edits.filter((e) => !isStructural(e))
  const structure = edits.filter(isStructural)

  for (const edit of values) {
    if (isStructural(edit)) continue
    const at = find(ctx, edit, edit.src, 'that element')
    if (isRefusal(at)) return { ok: false, refused: at }
    const refusal =
      edit.kind === 'class'
        ? applyClass(at.el, edit)
        : edit.kind === 'text'
          ? applyText(at.el, edit)
          : applyProp(at.el, edit)
    if (refusal) return { ok: false, refused: refusal }
  }

  for (const edit of structure) {
    const refusal =
      edit.kind === 'move'
        ? applyMove(ctx, edit)
        : edit.kind === 'delete'
          ? applyDelete(ctx, edit)
          : applyDuplicate(ctx, edit)
    if (refusal) return { ok: false, refused: refusal }
  }

  const structural = structure.length > 0
  let out = restoreSemicolons(source, fillCopies(print(ast).code, ctx.copies))
  if (structural) out = tidyImports(source, out)
  return { ok: true, source: out }
}
