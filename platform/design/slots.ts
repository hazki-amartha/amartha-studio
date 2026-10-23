// =============================================================================
// Design · how a JSX element sits in the code around it.
//
// Moving, copying or deleting an element means taking something out of its
// parent's children and putting it back somewhere. For `<A />` written
// straight among the children that something is the element. But a tenth of
// the elements in these projects are shown by a condition —
//
//     {open ? <Sheet /> : null}        {done && <Check />}
//
// — and those used to be refused outright ("shown by a condition"), along
// with every row of every `.map()`. Here each one is answered with WHAT sits
// in the children for it:
//
//   child — the element itself, or a bare `{<A />}` around it
//   cond  — the `{…}` the condition lives in; `holder` is the expression it is
//           a branch of, so a delete can blank just that branch
//   list  — the `{…}` the `.map()` lives in
//   prop  — none: it is the value of a prop (`topBar={<Header />}`)
//   root  — none: what a component returns, or anything else
//
// Pure and parser-agnostic: it walks a chain of `Step`s, which applyEdits
// builds from recast's paths and facts.ts from its own walk over a Babel tree.
// Both trees use Babel's node types, so the rules below are written once.
// =============================================================================

export interface AstNode {
  type: string
  [key: string]: unknown
}

/** One node and how it is held by the one above it. */
export interface Step {
  node: AstNode
  /** The field of the parent holding it (`children`, `consequent`, …). */
  field: string | null
  /** Its position when that field is an array. */
  index: number | null
  up: Step | null
}

export type SlotKind = 'child' | 'cond' | 'list' | 'prop' | 'root'

export interface SlotInfo {
  kind: SlotKind
  /** child, cond, list: the JSX element or fragment whose children hold it. */
  parent: AstNode | null
  /** child, cond, list: what sits in those children. */
  node: AstNode | null
  /** cond: the expression it is a branch of, and which branch. */
  holder?: AstNode
  branch?: string
  /** prop: the prop's name. */
  prop?: string
}

const ROOT: SlotInfo = { kind: 'root', parent: null, node: null }

const isJsxParent = (n: AstNode | undefined) => n?.type === 'JSXElement' || n?.type === 'JSXFragment'
const isFunction = (n: AstNode | undefined) =>
  n?.type === 'ArrowFunctionExpression' || n?.type === 'FunctionExpression' || n?.type === 'FunctionDeclaration'

/** Transparent wrappers an element can sit in without changing where it is. */
const PASS = new Set(['ParenthesizedExpression', 'TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression'])

function attrName(attr: AstNode): string {
  const name = attr.name as AstNode | undefined
  if (name?.type === 'JSXIdentifier') return String(name.name)
  if (name?.type === 'JSXNamespacedName') return `${(name.namespace as AstNode).name}:${(name.name as AstNode).name}`
  return 'prop'
}

/** Whether the function at `fn` is a list's row callback: `x.map(fn)`,
 *  `x.flatMap(fn)`, or `Array.from(x, fn)`. */
function isRowCallback(fn: Step): boolean {
  const call = fn.up?.node
  if (!call || call.type !== 'CallExpression' || fn.field !== 'arguments') return false
  const callee = call.callee as AstNode
  if (callee?.type !== 'MemberExpression' && callee?.type !== 'OptionalMemberExpression') return false
  const prop = callee.property as AstNode
  const name = prop?.type === 'Identifier' ? String(prop.name) : null
  if ((name === 'map' || name === 'flatMap') && fn.index === 0) return true
  const object = callee.object as AstNode
  return name === 'from' && object?.type === 'Identifier' && object.name === 'Array' && fn.index === 1
}

/**
 * How the element at `step` sits in the code around it.
 */
export function slotOf(step: Step): SlotInfo {
  if (step.field === 'children' && isJsxParent(step.up?.node)) {
    return { kind: 'child', parent: step.up!.node, node: step.node }
  }

  let at: Step = step
  let holder: AstNode | undefined
  let branch: string | undefined
  let list = false
  // Inside an array or object literal: a prop's data, or something odd —
  // never a place in the layout of its own.
  let data = false

  for (let guard = 0; guard < 200; guard++) {
    const up = at.up
    if (!up) return ROOT
    const node = up.node
    const field = at.field

    if (node.type === 'ConditionalExpression' && (field === 'consequent' || field === 'alternate')) {
      if (!holder && !list && !data) {
        holder = node
        branch = field
      }
    } else if (node.type === 'LogicalExpression' && (field === 'left' || field === 'right')) {
      if (!holder && !list && !data) {
        holder = node
        branch = field
      }
    } else if (node.type === 'JSXExpressionContainer') {
      const outer = up.up
      if (up.field === 'children' && isJsxParent(outer?.node)) {
        if (data) return ROOT
        if (list) return { kind: 'list', parent: outer!.node, node }
        if (holder) return { kind: 'cond', parent: outer!.node, node, holder, branch }
        return { kind: 'child', parent: outer!.node, node }
      }
      if (up.field === 'value' && outer?.node.type === 'JSXAttribute') {
        return { kind: 'prop', parent: null, node: null, prop: attrName(outer.node) }
      }
      return ROOT
    } else if (isFunction(node) && field === 'body') {
      if (!isRowCallback(up)) return ROOT
      // A row's own conditions are the row's business; the list is one place.
      list = true
      holder = undefined
      branch = undefined
      at = up.up!
      continue
    } else if (node.type === 'ReturnStatement' && field === 'argument') {
      let fn: Step | null = up.up
      while (fn && !isFunction(fn.node)) fn = fn.up
      if (!fn || !isRowCallback(fn)) return ROOT
      list = true
      holder = undefined
      branch = undefined
      at = fn.up!
      continue
    } else if (
      ((node.type === 'CallExpression' || node.type === 'OptionalCallExpression') && field === 'callee') ||
      ((node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') && field === 'object') ||
      PASS.has(node.type)
    ) {
      // `.map(…).filter(…)`, `(…)`, `as …` — still the same expression.
    } else if (
      node.type === 'ArrayExpression' ||
      node.type === 'ObjectExpression' ||
      node.type === 'ObjectProperty' ||
      node.type === 'Property' ||
      node.type === 'SpreadElement'
    ) {
      data = true
    } else {
      return ROOT
    }
    at = up
  }
  return ROOT
}

/** A value that renders nothing: what a deleted branch is left as. */
export function rendersNothing(node: AstNode | undefined): boolean {
  if (!node) return true
  if (node.type === 'NullLiteral' || (node.type === 'Literal' && node.value === null)) return true
  if (node.type === 'BooleanLiteral' && node.value === false) return true
  return node.type === 'Identifier' && node.name === 'undefined'
}
