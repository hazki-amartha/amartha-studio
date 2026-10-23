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
import type {
  ApplyResult,
  ClassEdit,
  DeleteEdit,
  DuplicateEdit,
  Edit,
  InsertEdit,
  LiteralEdit,
  MoveEdit,
  Place,
  PropEdit,
  Refusal,
  Scope,
  Src,
  StackEdit,
  TextEdit,
  UnwrapEdit,
  WrapEdit,
} from './protocol'
import { isNewRef, isStructural, NEW_PREFIX } from './protocol'
import { catalogItem, isPlainText, isTokenClassList } from './catalog'
import { COMPONENT_PROPS } from './componentProps'
import { layoutOf, sameLayout, withLayout } from './layout'
import { rendersNothing, slotOf, type AstNode, type SlotInfo, type Step } from './slots'
import {
  append,
  attachAfter,
  attachBefore,
  buildElement,
  canHold,
  contains,
  detach,
  isElementish,
  isLayoutText,
  lineIndent,
  parentOf,
  settleIndents,
  unsettled,
  tagName,
  text as jsxText,
  ws,
  type Indent,
  type JSXChild,
  type JSXElement,
  type JSXParent,
} from './structure'
import { restoreSemicolons, tidyImports, type ImportNeed } from './tidy'

const n = types.namedTypes
type JSXOpeningElement = types.namedTypes.JSXOpeningElement
type JSXAttribute = types.namedTypes.JSXAttribute
type TemplateLiteral = types.namedTypes.TemplateLiteral

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
 *  side of `cond && …`). `slot` says what it is instead (slots.ts), worked
 *  out only when a structural edit asks. */
interface Located {
  el: JSXElement
  parent: JSXParent | null
  slot: () => SlotInfo
}

/** recast's path, as far as it is read here. */
interface PathLike {
  node: types.ASTNode
  name: string | number
  parentPath: PathLike | null
  parent: PathLike | null
}

/** A recast path as a slots.ts step chain. In ast-types an array child's
 *  `parentPath` is the array, whose name is the field; `parent` skips it. */
function stepOf(path: PathLike): Step {
  const field = typeof path.name === 'number' ? path.parentPath?.name : path.name
  let up: Step | null | undefined
  return {
    node: path.node as unknown as AstNode,
    field: typeof field === 'string' ? field : null,
    index: typeof path.name === 'number' ? path.name : null,
    get up() {
      if (up === undefined) up = path.parent ? stepOf(path.parent) : null
      return up
    },
  }
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
        const p = path as unknown as PathLike
        let slot: SlotInfo | undefined
        found.push({ el: path.node, parent: jsxParentOf(p), slot: () => (slot ??= slotOf(stepOf(p))) })
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
function jsxParentOf(path: PathLike): JSXParent | null {
  const list = path.parentPath
  if (!list || list.name !== 'children') return null
  const owner = list.parentPath?.node
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

/**
 * A className written as a template — `` `flex gap-8 ${tone}` `` — read for
 * the classes it spells out. Nine in ten such lists in the projects are a
 * fixed list with one expression after it; the fixed classes are as editable
 * as a plain string's.
 *
 * A class counts only when whole: `p-${n}` is half code, and is left alone.
 */
interface TemplateClasses {
  tpl: TemplateLiteral
  /** Per quasi: the text around its whole classes, and the classes. */
  parts: { head: string; lead: string; classes: string[]; trail: string; tail: string }[]
}

function templateOf(attr: JSXAttribute): TemplateClasses | null {
  const v = attr.value
  if (!v || !n.JSXExpressionContainer.check(v) || !n.TemplateLiteral.check(v.expression)) return null
  const tpl = v.expression
  const last = tpl.quasis.length - 1
  const parts = tpl.quasis.map((q, i) => {
    const raw = q.value.raw
    // A run touching an expression belongs to it: `p-${n}` is not a class.
    const head = i === 0 ? '' : (/^\S*/.exec(raw)?.[0] ?? '')
    const tail = i === last ? '' : (/\S*$/.exec(raw.slice(head.length))?.[0] ?? '')
    const middle = raw.slice(head.length, raw.length - tail.length)
    const lead = /^\s*/.exec(middle)?.[0] ?? ''
    const trail = middle.length > lead.length ? (/\s*$/.exec(middle)?.[0] ?? '') : ''
    const classes = middle.slice(lead.length, middle.length - trail.length).split(/\s+/).filter(Boolean)
    return { head, lead, classes, trail, tail }
  })
  return { tpl, parts }
}

function writeTemplate(t: TemplateClasses): void {
  const last = t.parts.length - 1
  t.tpl.quasis.forEach((q, i) => {
    const p = t.parts[i]
    // A quasi left with no classes keeps one space between two expressions,
    // so `${a} ${b}` doesn't fuse into `${a}${b}`; at either end it goes.
    const middle =
      p.classes.length > 0
        ? `${p.lead}${p.classes.join(' ')}${p.trail}`
        : i > 0 && i < last && (p.lead || p.trail)
          ? ' '
          : ''
    const text = `${p.head}${middle}${p.tail}`
    q.value = { raw: text, cooked: text }
  })
}

const staticClasses = (t: TemplateClasses) => t.parts.flatMap((p) => p.classes)

function applyClass(el: JSXElement, edit: ClassEdit): Refusal | null {
  const attr = attributeNamed(el.openingElement, 'className')
  if (!attr) return { edit, reason: 'that element has no className to change' }

  const current = literalValue(attr)
  if (current === null) {
    const t = templateOf(attr)
    if (!t) return { edit, reason: 'its className is computed, so there is no single class list to edit' }
    const hits = t.parts.flatMap((p, i) => (p.classes.includes(edit.oldClass) ? [i] : []))
    if (hits.length === 0) {
      return { edit, reason: `"${edit.oldClass}" isn’t written out in its className — code adds it` }
    }
    const part = t.parts[hits[0]]
    part.classes[part.classes.indexOf(edit.oldClass)] = edit.newClass
    writeTemplate(t)
    return null
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

/**
 * JSX text as the page shows it: React drops the line breaks and indentation
 * a long sentence is wrapped with in the file, joining its lines with one
 * space. A designer edits that, so that is what is compared.
 */
function shownText(value: string): string {
  const lines = value.split(/\r\n|\n|\r/)
  let last = -1
  lines.forEach((l, i) => {
    if (/[^ \t]/.test(l)) last = i
  })
  let out = ''
  lines.forEach((line, i) => {
    let t = line.replace(/\t/g, ' ')
    if (i > 0) t = t.replace(/^ +/, '')
    if (i < lines.length - 1) t = t.replace(/ +$/, '')
    if (t) out += i === last ? t : `${t} `
  })
  return out.trim()
}

function applyText(el: JSXElement, edit: TextEdit): Refusal | null {
  const texts = (el.children ?? []).filter((c) => n.JSXText.check(c)) as types.namedTypes.JSXText[]
  // Compared as shown because JSX text carries the indentation around it,
  // which is layout in the file and not something the designer edited.
  const match = texts.filter((t) => t.value.trim() === edit.old || shownText(t.value) === edit.old)

  if (match.length === 0) return { edit, reason: 'its text has changed since you selected it' }
  if (match.length > 1) return { edit, reason: 'that text appears more than once inside the element' }

  const node = match[0]
  if (node.value.includes(edit.old)) {
    node.value = node.value.replace(edit.old, edit.next)
  } else {
    // Wrapped over several lines in the file: the new words take one line,
    // between the same whitespace the text started and ended with.
    const lead = /^\s*/.exec(node.value)?.[0] ?? ''
    const trail = /\s*$/.exec(node.value)?.[0] ?? ''
    node.value = `${lead}${edit.next}${trail}`
  }
  return null
}

/** A number or boolean prop's value as written, as text — `{3}` → "3",
 *  `{false}` → "false", a bare `active` → "true" — or null for code. */
function typedValue(attr: JSXAttribute): string | null {
  const v = attr.value
  if (!v) return 'true'
  if (n.JSXExpressionContainer.check(v)) {
    const e = v.expression
    if (n.NumericLiteral.check(e) || n.BooleanLiteral.check(e)) return String(e.value)
  }
  return null
}

/** A typed value as it is written in JSX. */
function typedNode(type: 'number' | 'boolean', value: string) {
  const b = types.builders
  return b.jsxExpressionContainer(type === 'boolean' ? b.booleanLiteral(value === 'true') : b.numericLiteral(Number(value)))
}

function applyTypedProp(el: JSXElement, edit: PropEdit & { type: 'number' | 'boolean' }): Refusal | null {
  const open = el.openingElement
  const attr = attributeNamed(open, edit.prop)
  if (edit.next !== null && (edit.type === 'boolean' ? !/^(true|false)$/.test(edit.next) : !/^-?\d+(\.\d+)?$/.test(edit.next))) {
    return { edit, reason: `“${edit.next}” isn’t a ${edit.type}` }
  }
  if (!attr) {
    if (edit.old !== null) return { edit, reason: `it has no ${edit.prop} to change` }
    if (edit.next === null) return null
    open.attributes = [...(open.attributes ?? []), types.builders.jsxAttribute(types.builders.jsxIdentifier(edit.prop), typedNode(edit.type, edit.next))]
    return null
  }
  const current = typedValue(attr)
  if (current === null) return { edit, reason: `its ${edit.prop} is computed, so there is no single value to edit` }
  if (edit.old !== null && current !== edit.old) {
    return { edit, reason: `its ${edit.prop} is now ${current}, not ${edit.old}` }
  }
  if (edit.next === null) {
    open.attributes = (open.attributes ?? []).filter((a) => a !== attr)
    return null
  }
  attr.value = typedNode(edit.type, edit.next)
  return null
}

function applyProp(el: JSXElement, edit: PropEdit): Refusal | null {
  if (edit.type === 'number' || edit.type === 'boolean') {
    return applyTypedProp(el, edit as PropEdit & { type: 'number' | 'boolean' })
  }
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

// --- values (D3): stack layout -------------------------------------------------

function applyStack(el: JSXElement, edit: StackEdit): Refusal | null {
  const attr = attributeNamed(el.openingElement, 'className')
  const current = attr ? literalValue(attr) : ''
  if (current === null) {
    // A template: its fixed classes are the layout, rewritten where they are —
    // as long as they are all in one place, so nothing moves across code.
    const t = attr ? templateOf(attr) : null
    const holding = t ? t.parts.filter((p) => p.classes.length > 0) : []
    if (!t || holding.length !== 1) {
      return { edit, reason: 'its className is computed, so its layout can’t be set here' }
    }
    if (!sameLayout(layoutOf(staticClasses(t)), edit.old)) {
      return { edit, reason: 'part of its layout is worked out by code, so it can’t be set here' }
    }
    holding[0].classes = withLayout(holding[0].classes, edit.next)
    writeTemplate(t)
    return null
  }
  const classes = current.split(/\s+/).filter(Boolean)
  if (!sameLayout(layoutOf(classes), edit.old)) {
    return { edit, reason: 'its layout has changed since you selected it' }
  }
  const next = withLayout(classes, edit.next).join(' ')
  if (attr) {
    setLiteralValue(attr, next)
  } else if (next) {
    el.openingElement.attributes = [
      ...(el.openingElement.attributes ?? []),
      types.builders.jsxAttribute(
        types.builders.jsxIdentifier('className'),
        types.builders.stringLiteral(next),
      ),
    ]
  }
  return null
}

// --- values: a string written in code -----------------------------------------

/**
 * The string at a position: a `'…'` literal, a template with no expressions,
 * or JSX text. Data files are plain `.ts`, so this looks at every node type
 * that can carry words, not only JSX.
 */
function locateString(ast: types.ASTNode, src: Src): types.ASTNode[] {
  const pos = positionOf(src)
  if (!pos) return []
  const found: types.ASTNode[] = []
  const at = (node: types.ASTNode & { loc?: types.namedTypes.SourceLocation | null }) =>
    node.loc?.start.line === pos.line && node.loc.start.column === pos.col
  types.visit(ast, {
    visitStringLiteral(path) {
      if (at(path.node)) found.push(path.node)
      return false
    },
    visitTemplateLiteral(path) {
      if (at(path.node) && path.node.expressions.length === 0) found.push(path.node)
      this.traverse(path)
    },
    visitJSXText(path) {
      if (at(path.node)) found.push(path.node)
      return false
    },
  })
  return found
}

/** A string as source, in the quotes it was written with. */
function quoted(value: string, quote: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(new RegExp(quote, 'g'), `\\${quote}`)
    .replace(/\n/g, '\\n')
  return `${quote}${escaped}${quote}`
}

function applyLiteral(ctx: Ctx, edit: LiteralEdit): Refusal | null {
  const found = locateString(ctx.ast, edit.src)
  if (found.length === 0) return { edit, reason: 'that text has moved in the code since the screen loaded' }
  if (found.length > 1) return { edit, reason: 'that position matches more than one piece of text' }
  const node = found[0]
  // A string in code is escaped as it is written, so only its length and
  // line breaks matter; JSX text has to stay text.
  const writable = n.JSXText.check(node) ? isPlainText(edit.next) : edit.next.length > 0 && edit.next.length <= 200 && !/\n/.test(edit.next)
  if (!writable) return { edit, reason: 'that text can’t be written as it is' }

  if (n.StringLiteral.check(node)) {
    if (node.value !== edit.old) return { edit, reason: 'that text has changed since you selected it' }
    const raw = (node as { extra?: { raw?: string } }).extra?.raw
    const quote = raw?.startsWith("'") ? "'" : '"'
    // recast prints a changed string in ITS quotes, not the file's — so the
    // string goes in as a placeholder, swapped for the text after printing.
    const name = `__design_literal_${ctx.literals.size}__`
    ctx.literals.set(name, quoted(edit.next, quote))
    node.value = name
    return null
  }
  if (n.TemplateLiteral.check(node)) {
    const q = node.quasis[0]
    if (q.value.cooked !== edit.old) return { edit, reason: 'that text has changed since you selected it' }
    const raw = edit.next.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
    q.value = { raw, cooked: edit.next }
    return null
  }
  if (n.JSXText.check(node)) {
    if (node.value.trim() !== edit.old && shownText(node.value) !== edit.old) {
      return { edit, reason: 'that text has changed since you selected it' }
    }
    const lead = /^\s*/.exec(node.value)?.[0] ?? ''
    const trail = /\s*$/.exec(node.value)?.[0] ?? ''
    node.value = node.value.includes(edit.old) ? node.value.replace(edit.old, edit.next) : `${lead}${edit.next}${trail}`
    return null
  }
  return { edit, reason: 'that isn’t text the panel can change' }
}

// --- structure (D2, D3) -------------------------------------------------------

/**
 * What a structural edit lifts for a located node: the node itself, or the
 * `{…}` it is shown by (slots.ts) — and the parent whose children hold it.
 * A refusal says why there is nothing to lift.
 */
interface Lifted {
  parent: JSXParent
  thing: JSXChild
  slot: SlotInfo
}

function lift(at: Located, edit: Edit, scope?: Scope): Lifted | Refusal {
  const slot = at.slot()
  if (scope === 'list' && slot.kind !== 'list') {
    return { edit, reason: 'it isn’t a row of a list' }
  }
  switch (slot.kind) {
    case 'child':
    case 'cond':
      return { parent: slot.parent as unknown as JSXParent, thing: slot.node as unknown as JSXChild, slot }
    case 'list':
      if (scope === 'list') {
        return { parent: slot.parent as unknown as JSXParent, thing: slot.node as unknown as JSXChild, slot }
      }
      return {
        edit,
        reason: 'it is one row of a list — every row comes from the same line, so the list moves as a whole',
      }
    case 'prop':
      return {
        edit,
        reason: `it is the ${slot.prop ?? 'value'} of the element around it, so it stays where that element puts it`,
      }
    default:
      return {
        edit,
        reason:
          'it isn’t placed inside another element here — it is what a component returns, or the screen itself — so moving it means changing code',
      }
  }
}

const isLifted = (x: Lifted | Refusal): x is Lifted => 'thing' in x

interface Ctx extends Indent {
  ast: types.ASTNode
  fresh: WeakSet<object>
  /** Printed copies waiting for their placeholders, by placeholder name. */
  copies: Map<string, string>
  /** Elements this batch created, by the id their edit chose. */
  news: Map<string, JSXElement>
  /** Imports the created elements need. */
  needs: ImportNeed[]
  icons?: ReadonlySet<string>
  /** Rewritten strings waiting for their placeholders, by placeholder name. */
  literals: Map<string, string>
}

function find(ctx: Ctx, edit: Edit, src: Src, role: string): Located | Refusal {
  if (isNewRef(src)) {
    const el = ctx.news.get(src.slice(NEW_PREFIX.length))
    if (!el) return { edit, reason: `${role} was not created earlier in this batch` }
    // An element this batch created sits straight in what it was put into.
    const parent = parentOf(ctx.ast, el)
    const slot: SlotInfo = parent
      ? { kind: 'child', parent: parent as unknown as AstNode, node: el as unknown as AstNode }
      : { kind: 'root', parent: null, node: null }
    return { el, parent, slot: () => slot }
  }
  const at = locate(ctx.ast, src, ctx.fresh)
  if (at === null) {
    return { edit, reason: `${role} is no longer where it was — the screen has changed since it loaded` }
  }
  if (at === 'ambiguous') return { edit, reason: `${role}’s position matches more than one element` }
  return at
}

const isRefusal = (x: Located | Refusal): x is Refusal => 'reason' in x

const placeSrc = (to: Place) => ('before' in to ? to.before : 'after' in to ? to.after : to.inside)

/**
 * What "before" or "after" an anchor means: beside it, or beside the `{…}`
 * it is shown by — a condition, or a whole list.
 */
function besideOf(anchor: Located, edit: Edit, role: string): Lifted | Refusal {
  const slot = anchor.slot()
  if (slot.kind === 'child' || slot.kind === 'cond' || slot.kind === 'list') {
    return { parent: slot.parent as unknown as JSXParent, thing: slot.node as unknown as JSXChild, slot }
  }
  return { edit, reason: `${role} isn’t directly in the layout, so there is nothing to put it beside` }
}

/** Put `node` at `to`, which has already been checked not to be inside it. */
function put(ctx: Ctx, edit: Edit, node: JSXChild, to: Place, role: string): Refusal | null {
  const anchor = find(ctx, edit, placeSrc(to), role)
  if (isRefusal(anchor)) return anchor
  if ('inside' in to) {
    if (!canHold(anchor.el)) {
      return { edit, reason: `a ${tagName(anchor.el) ?? 'that element'} can’t hold other elements` }
    }
    append(anchor.el, node, ctx)
    return null
  }
  const beside = besideOf(anchor, edit, role)
  if (!isLifted(beside)) return beside
  if ('before' in to) attachBefore(beside.parent, beside.thing, node, ctx)
  else attachAfter(beside.parent, beside.thing, node, ctx)
  return null
}

function applyMove(ctx: Ctx, edit: MoveEdit): Refusal | null {
  const node = find(ctx, edit, edit.src, 'that element')
  if (isRefusal(node)) return node
  const lifted = lift(node, edit, edit.scope)
  if (!isLifted(lifted)) return lifted

  const anchor = find(ctx, edit, placeSrc(edit.to), 'the place you dropped it')
  if (isRefusal(anchor)) return anchor
  if (contains(lifted.thing, anchor.el)) {
    return { edit, reason: 'an element can’t be moved into itself' }
  }
  // Checked before detaching, so a refusal leaves the tree as it was — the
  // batch is abandoned anyway, but a half-moved tree is not worth reasoning
  // about.
  if ('inside' in edit.to) {
    if (!canHold(anchor.el)) {
      return { edit, reason: `a ${tagName(anchor.el) ?? 'that element'} can’t hold other elements` }
    }
  } else {
    const beside = besideOf(anchor, edit, 'the place you dropped it')
    if (!isLifted(beside)) return beside
    // Beside its own condition or list: it is already there.
    if (beside.thing === lifted.thing) return null
  }

  detach(lifted.parent, lifted.thing)
  return put(ctx, edit, lifted.thing, edit.to, 'the place you dropped it')
}

/** Whether an expression shows nothing whichever way its conditions go. */
function showsNothing(node: AstNode | undefined): boolean {
  if (!node) return true
  if (rendersNothing(node)) return true
  if (node.type === 'ConditionalExpression') {
    return showsNothing(node.consequent as AstNode) && showsNothing(node.alternate as AstNode)
  }
  if (node.type === 'LogicalExpression' && node.operator === '&&') return showsNothing(node.right as AstNode)
  return false
}

function applyDelete(ctx: Ctx, edit: DeleteEdit): Refusal | null {
  const node = find(ctx, edit, edit.src, 'that element')
  if (isRefusal(node)) return node
  const lifted = lift(node, edit, edit.scope)
  if (!isLifted(lifted)) return lifted

  const { slot } = lifted
  if (slot.kind === 'cond' && slot.holder && slot.branch) {
    // Only the state it was selected in: its branch shows nothing now. A
    // condition left showing nothing at all goes with it.
    ;(slot.holder as Record<string, unknown>)[slot.branch] = types.builders.nullLiteral()
    const expression = (lifted.thing as unknown as { expression?: AstNode }).expression
    if (!showsNothing(expression)) return null
  }
  detach(lifted.parent, lifted.thing)
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
  if (isNewRef(edit.src)) {
    return { edit, reason: 'a new element can be duplicated once it has been applied' }
  }
  // A condition or a list is copied whole: the copy shows when the original
  // does.
  const lifted = lift(node, edit, edit.scope)
  if (!isLifted(lifted)) return lifted

  // A multi-line template literal would have its CONTENT re-indented below,
  // silently changing a string. Rare in markup, and not worth a guess.
  let multiline = false
  types.visit(lifted.thing, {
    visitTemplateLiteral(path) {
      if (path.node.quasis.some((q) => q.value.raw.includes('\n'))) multiline = true
      return false
    },
  })
  if (multiline) {
    return { edit, reason: 'it contains a multi-line text template, which can’t be copied safely here' }
  }

  const raw = print(lifted.thing).code

  // recast prints a lone node from column 0; the copy sits beside its
  // original, so every line after the first gets the original's indentation.
  const indent = lineIndent(lifted.thing, ctx)
  const text = raw
    .split('\n')
    .map((l, i) => (i === 0 || l === '' ? l : indent + l))
    .join('\n')
  const name = `__design_copy_${ctx.copies.size}__`
  ctx.copies.set(name, text)
  const placeholder = types.builders.jsxExpressionContainer(types.builders.identifier(name))
  ctx.fresh.add(placeholder)
  attachAfter(lifted.parent, lifted.thing, placeholder, ctx)
  return null
}

function fillCopies(printed: string, copies: Map<string, string>): string {
  let out = printed
  for (const [name, text] of copies) out = out.replace(`{${name}}`, () => text)
  return out
}

function fillLiterals(printed: string, literals: Map<string, string>): string {
  let out = printed
  for (const [name, text] of literals) out = out.replace(new RegExp(`(["'])${name}\\1`), () => text)
  return out
}

const ID = /^[a-z0-9]{1,24}$/

/**
 * Build an insert's element from the catalog, refusing anything the panel
 * could not have produced: an unknown item or icon, an undeclared prop, a
 * value off the component's own list, a class that isn't a named utility, or
 * text that could break out of JSX.
 */
function buildInsert(ctx: Ctx, edit: InsertEdit): JSXElement | Refusal {
  const item = catalogItem(edit.item)
  if (!item) return { edit, reason: `there is no “${edit.item}” to insert` }
  if (!ID.test(edit.id) || ctx.news.has(edit.id)) {
    return { edit, reason: 'that new element’s id is not usable' }
  }

  let tag = item.tag
  if (item.key === 'icon') {
    if (!edit.icon || !/^[A-Z][A-Za-z0-9]*$/.test(edit.icon) || !ctx.icons?.has(edit.icon)) {
      return { edit, reason: `there is no icon called “${edit.icon ?? ''}”` }
    }
    tag = edit.icon
  }

  const enums = COMPONENT_PROPS[item.tag] ?? []
  const props: Record<string, string> = {}
  for (const [key, value] of Object.entries(edit.props)) {
    if (key !== 'className' && !(key in item.props)) {
      return { edit, reason: `a ${item.label} has no “${key}” to set here` }
    }
    const menu = enums.find((p) => p.prop === key)
    const ok =
      key === 'className'
        ? isTokenClassList(value)
        : menu
          ? menu.values.includes(value)
          : isPlainText(value)
    if (!ok) return { edit, reason: `“${value}” isn’t a value a ${item.label}’s ${key} can take` }
    if (value !== '') props[key] = value
  }

  if (edit.text !== undefined && (item.text === undefined || !isPlainText(edit.text))) {
    return { edit, reason: 'that text can’t be written as it is' }
  }

  // Children are laid out one indentation step in; the element's own line is
  // given its indentation by whoever attaches it, so the frame is filled in
  // afterwards, once that is known.
  const kids = item.children?.map((c) =>
    buildElement(c.tag, c.props, c.text === undefined ? null : [jsxText(c.text)]),
  )
  const body: JSXChild[] | null =
    kids && kids.length > 0 ? kids : item.text !== undefined ? [jsxText(edit.text ?? item.text)] : null

  if (item.from) ctx.needs.push({ name: tag, from: item.from })
  return buildElement(tag, props, body)
}

/** Lay element children out on their own lines, one step in from `el`. */
function frameChildren(ctx: Ctx, el: JSXElement) {
  const kids = (el.children ?? []).filter((k) => !isLayoutText(k))
  // Elements and the `{…}` a condition or list lives in each take a line.
  if (!kids.some((k) => n.JSXElement.check(k) || n.JSXFragment.check(k) || n.JSXExpressionContainer.check(k))) return
  const outer = lineIndent(el, ctx)
  const inner = `${outer}  `
  const framed: JSXChild[] = []
  for (const k of kids) {
    framed.push(ws(inner), k)
    ctx.placed.set(k, inner)
  }
  framed.push(ws(outer))
  el.children = framed
}

function applyInsert(ctx: Ctx, edit: InsertEdit): Refusal | null {
  const el = buildInsert(ctx, edit)
  if ('reason' in el) return el
  const refused = put(ctx, edit, el, edit.to, 'the place you chose')
  if (refused) return refused
  frameChildren(ctx, el)
  ctx.fresh.add(el)
  ctx.news.set(edit.id, el)
  return null
}

function applyWrap(ctx: Ctx, edit: WrapEdit): Refusal | null {
  if (!ID.test(edit.id) || ctx.news.has(edit.id)) {
    return { edit, reason: 'that new stack’s id is not usable' }
  }
  if (!isTokenClassList(edit.className)) {
    return { edit, reason: 'that stack’s classes aren’t named utilities' }
  }
  if (edit.srcs.length === 0) return { edit, reason: 'there is nothing to wrap' }

  // What goes inside: each element, or the `{…}` condition it is shown by.
  const nodes: JSXChild[] = []
  let parent: JSXParent | null = null
  for (const src of edit.srcs) {
    const at = find(ctx, edit, src, 'one of those elements')
    if (isRefusal(at)) return at
    const lifted = lift(at, edit)
    if (!isLifted(lifted)) return lifted
    if (parent && lifted.parent !== parent) {
      return { edit, reason: 'only elements side by side in the same container can be wrapped together' }
    }
    parent = lifted.parent
    if (!nodes.includes(lifted.thing)) nodes.push(lifted.thing)
  }

  // Consecutive, in this order, with nothing but line breaks between them.
  const kids = parent!.children ?? []
  const first = kids.indexOf(nodes[0])
  const last = kids.indexOf(nodes[nodes.length - 1])
  const span = kids.slice(first, last + 1)
  const between = span.filter((k) => !isLayoutText(k))
  if (first === -1 || last < first || between.length !== nodes.length || between.some((k, i) => k !== nodes[i])) {
    return { edit, reason: 'only elements side by side in the same container can be wrapped together' }
  }

  const indent = lineIndent(nodes[0], ctx)
  const wrapper = buildElement('div', { className: edit.className }, [])
  ctx.placed.set(wrapper, indent)
  wrapper.children = [...nodes]
  kids.splice(first, last - first + 1, wrapper)
  frameChildren(ctx, wrapper)

  ctx.fresh.add(wrapper)
  ctx.news.set(edit.id, wrapper)
  return null
}

function applyUnwrap(ctx: Ctx, edit: UnwrapEdit): Refusal | null {
  const at = find(ctx, edit, edit.src, 'that element')
  if (isRefusal(at)) return at
  const lifted = lift(at, edit)
  if (!isLifted(lifted)) return lifted
  if (lifted.thing !== at.el) {
    return { edit, reason: 'it is shown by a condition, so taking it away would leave its children nowhere to be' }
  }

  const open = at.el.openingElement
  const onlyClass = (open.attributes ?? []).every(
    (a) =>
      types.namedTypes.JSXAttribute.check(a) &&
      types.namedTypes.JSXIdentifier.check(a.name) &&
      a.name.name === 'className' &&
      literalValue(a) !== null,
  )
  if (tagName(at.el) !== 'div' || !onlyClass) {
    return {
      edit,
      reason: 'only a plain stack can be unwrapped — this one carries more than its layout',
    }
  }

  const parent = at.parent!
  const kids = parent.children ?? []
  const i = kids.indexOf(at.el)
  const indent = lineIndent(at.el, ctx)
  const inner = (at.el.children ?? []).filter(isElementish)
  const raised: JSXChild[] = []
  inner.forEach((k, n) => {
    if (n > 0) raised.push(ws(indent))
    raised.push(k)
    ctx.placed.set(k, indent)
  })
  kids.splice(i, 1, ...raised)
  return null
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
 * still found by the address it was stamped with. Elements the batch creates
 * are named `new:<id>`.
 *
 * `icons` is the set of icon names an `icon` insert may use; the backend reads
 * it from the icon module.
 */
export function applyEdits(
  source: string,
  edits: readonly Edit[],
  options: { icons?: ReadonlySet<string> } = {},
): ApplyResult {
  if (edits.length === 0) return { ok: true, source }

  let ast: types.ASTNode
  try {
    ast = parse(source, { parser: tsParser })
  } catch {
    return refuse(edits[0], 'that screen could not be parsed')
  }

  const ctx: Ctx = {
    ast,
    fresh: new WeakSet(),
    lines: source.split('\n'),
    placed: new WeakMap(),
    copies: new Map(),
    news: new Map(),
    needs: [],
    icons: options.icons,
    literals: new Map(),
  }

  // Values first, then structure. A value edit's address never depends on
  // structure (addresses resolve against original positions), and applying
  // values first makes a duplicate carry every value edit to its original —
  // which is what the overlay shows, since it patches the live element before
  // cloning it. It also lets "restyle it, then delete it" apply as staged.
  for (const edit of edits) {
    if (isStructural(edit)) continue
    if (isNewRef(edit.src)) {
      return refuse(edit, 'a new element is changed through its insert, not on its own')
    }
    if (edit.kind === 'literal') {
      const refusal = applyLiteral(ctx, edit)
      if (refusal) return { ok: false, refused: refusal }
      continue
    }
    const at = find(ctx, edit, edit.src, 'that element')
    if (isRefusal(at)) return { ok: false, refused: at }
    const refusal =
      edit.kind === 'class'
        ? applyClass(at.el, edit)
        : edit.kind === 'text'
          ? applyText(at.el, edit)
          : edit.kind === 'prop'
            ? applyProp(at.el, edit)
            : applyStack(at.el, edit)
    if (refusal) return { ok: false, refused: refusal }
  }

  let structural = false
  for (const edit of edits) {
    if (!isStructural(edit)) continue
    structural = true
    const refusal =
      edit.kind === 'move'
        ? applyMove(ctx, edit)
        : edit.kind === 'delete'
          ? applyDelete(ctx, edit)
          : edit.kind === 'duplicate'
            ? applyDuplicate(ctx, edit)
            : edit.kind === 'insert'
              ? applyInsert(ctx, edit)
              : edit.kind === 'wrap'
                ? applyWrap(ctx, edit)
                : applyUnwrap(ctx, edit)
    if (refusal) return { ok: false, refused: refusal }
  }

  const printed = settleIndents(fillLiterals(fillCopies(print(ast).code, ctx.copies), ctx.literals))
  if (unsettled(printed)) return refuse(edits[0], 'the change couldn’t be laid out cleanly in the file')
  let out = restoreSemicolons(source, printed)
  if (structural) out = tidyImports(source, out, ctx.needs)
  return { ok: true, source: out }
}
