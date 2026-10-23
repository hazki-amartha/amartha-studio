// =============================================================================
// Design · what a file's JSX can take, read from its source.
//
// The page shows what an element renders. Whether a change to it can be
// written depends on how it is written, which only the source knows:
//
//   <p>Total</p>              text the panel can rewrite
//   <p>{label}</p>            the `label` prop of whoever uses this component —
//                             rewritten there, on that one use
//   <p>{item.name}</p>        a string somewhere in the project's data, if it
//                             is written out once (findText)
//   className={`gap-8 ${x}`}  `gap-8` is as editable as in a plain string
//
// So the panel asks once per file version and offers only what will save,
// instead of staging an edit the write side then refuses.
//
// Pure: source in, facts out. The routes read the file from wherever the
// project lives and hand it here. Server-only only because it parses.
// =============================================================================

import { parse } from '@babel/parser'
import type { FileFacts, NodeFacts, Src } from './protocol'
import { slotOf, type AstNode, type Step } from './slots'
import { versionOf } from './version'

type Ast = ReturnType<typeof parse>

function parseFile(source: string): Ast | null {
  try {
    return parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: true })
  } catch {
    return null
  }
}

const SKIP = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'range'])

/** Every node with the step chain above it. */
function walk(node: AstNode, visit: (step: Step) => void, up: Step | null = null, field: string | null = null, index: number | null = null) {
  const step: Step = { node, field, index, up }
  visit(step)
  for (const key of Object.keys(node)) {
    if (SKIP.has(key)) continue
    const child = node[key]
    if (Array.isArray(child)) {
      child.forEach((c, i) => {
        if (c && typeof c === 'object' && typeof (c as AstNode).type === 'string') walk(c as AstNode, visit, step, key, i)
      })
    } else if (child && typeof child === 'object' && typeof (child as AstNode).type === 'string') {
      walk(child as AstNode, visit, step, key, null)
    }
  }
}

const isFunction = (n: AstNode | undefined) =>
  n?.type === 'ArrowFunctionExpression' || n?.type === 'FunctionExpression' || n?.type === 'FunctionDeclaration'

const isLayoutText = (n: AstNode) => n.type === 'JSXText' && /^\s*$/.test(String(n.value))

function attrName(a: AstNode): string | null {
  const name = a.name as AstNode | undefined
  return name?.type === 'JSXIdentifier' ? String(name.name) : null
}

/** A prop's value when it is written plainly — what the panel may change. */
function plainValue(value: AstNode | null | undefined): string | number | boolean | undefined {
  if (!value) return true
  if (value.type === 'StringLiteral') return String(value.value)
  if (value.type !== 'JSXExpressionContainer') return undefined
  const e = value.expression as AstNode
  if (e.type === 'StringLiteral') return String(e.value)
  if (e.type === 'NumericLiteral') return Number(e.value)
  if (e.type === 'BooleanLiteral') return Boolean(e.value)
  if (e.type === 'TemplateLiteral' && (e.expressions as AstNode[]).length === 0) {
    return String(((e.quasis as AstNode[])[0].value as { cooked: string }).cooked)
  }
  return undefined
}

function classKind(value: AstNode | null | undefined): NodeFacts['cls'] {
  if (value === undefined) return 'none'
  const v = plainValue(value)
  if (typeof v === 'string') return 'literal'
  if (value?.type === 'JSXExpressionContainer' && (value.expression as AstNode).type === 'TemplateLiteral') return 'template'
  return 'computed'
}

/** Names a pattern binds: `{ a, b: c, d = 1, ...rest }` → a, c, d, rest. */
function boundBy(pattern: AstNode | undefined, out: Set<string>) {
  if (!pattern) return
  switch (pattern.type) {
    case 'Identifier':
      out.add(String(pattern.name))
      return
    case 'AssignmentPattern':
      return boundBy(pattern.left as AstNode, out)
    case 'RestElement':
      return boundBy(pattern.argument as AstNode, out)
    case 'ArrayPattern':
      for (const e of (pattern.elements as AstNode[]) ?? []) boundBy(e, out)
      return
    case 'ObjectPattern':
      for (const p of (pattern.properties as AstNode[]) ?? []) {
        boundBy(p.type === 'RestElement' ? p : (p.value as AstNode), out)
      }
      return
    case 'TSParameterProperty':
      return boundBy(pattern.parameter as AstNode, out)
  }
}

/** The prop a destructured name stands for: `{ title: heading }` → heading is `title`. */
function propNamed(param: AstNode | undefined, local: string): string | null {
  if (!param) return null
  const p = param.type === 'AssignmentPattern' ? (param.left as AstNode) : param
  if (p.type !== 'ObjectPattern') return null
  for (const prop of (p.properties as AstNode[]) ?? []) {
    if (prop.type !== 'ObjectProperty' || prop.computed) continue
    const key = prop.key as AstNode
    let value = prop.value as AstNode
    if (value.type === 'AssignmentPattern') value = value.left as AstNode
    if (value.type === 'Identifier' && value.name === local) {
      return key.type === 'Identifier' ? String(key.name) : key.type === 'StringLiteral' ? String(key.value) : null
    }
  }
  return null
}

/** Names declared directly in a function's body. */
function declaredIn(fn: AstNode): Set<string> {
  const out = new Set<string>()
  const body = fn.body as AstNode
  if (body?.type !== 'BlockStatement') return out
  for (const s of (body.body as AstNode[]) ?? []) {
    if (s.type !== 'VariableDeclaration') continue
    for (const d of (s.declarations as AstNode[]) ?? []) boundBy(d.id as AstNode, out)
  }
  return out
}

/**
 * The prop of the enclosing component that an expression shows, or null.
 * `{label}` where `label` is destructured from the component's props, or
 * `{props.label}`. A name bound nearer — a `.map()` row, a local — is not a
 * prop, however it is spelled.
 */
function propShown(expr: AstNode, at: Step): string | null {
  let local: string | null = null
  let viaProps: string | null = null
  if (expr.type === 'Identifier') local = String(expr.name)
  else if (expr.type === 'MemberExpression' && !expr.computed) {
    const object = expr.object as AstNode
    const property = expr.property as AstNode
    if (object.type === 'Identifier' && property.type === 'Identifier') {
      local = String(object.name)
      viaProps = String(property.name)
    }
  }
  if (!local) return null
  for (let s: Step | null = at.up; s; s = s.up) {
    if (!isFunction(s.node)) continue
    const params = (s.node.params as AstNode[]) ?? []
    const bound = new Set<string>()
    for (const p of params) boundBy(p, bound)
    const locals = declaredIn(s.node)
    if (!bound.has(local) && !locals.has(local)) continue
    if (locals.has(local) && !bound.has(local)) return null
    // Bound by this function's parameters: a prop only if this is the
    // component, i.e. its first parameter is the props.
    if (viaProps) {
      const first = params[0]
      return first?.type === 'Identifier' && first.name === local ? viaProps : null
    }
    return propNamed(params[0], local)
  }
  return null
}

function textKind(el: AstNode, at: Step): Pick<NodeFacts, 'text' | 'textProp'> {
  const kids = ((el.children as AstNode[]) ?? []).filter((c) => !isLayoutText(c))
  if (kids.length === 0) return { text: 'none' }
  if (kids.some((c) => c.type === 'JSXElement' || c.type === 'JSXFragment')) return { text: 'none' }
  if (kids.every((c) => c.type === 'JSXText')) return { text: 'literal' }
  if (kids.length === 1 && kids[0].type === 'JSXExpressionContainer') {
    const prop = propShown(kids[0].expression as AstNode, at)
    return prop ? { text: 'prop', textProp: prop } : { text: 'expr' }
  }
  return { text: 'mixed' }
}

/** What each JSX element in `source` can take. */
export function factsOf(source: string, file: string): FileFacts | null {
  const ast = parseFile(source)
  if (!ast) return null
  const nodes: Record<string, NodeFacts> = {}
  walk(ast as unknown as AstNode, (step) => {
    const el = step.node
    if (el.type !== 'JSXElement') return
    const open = el.openingElement as AstNode
    const loc = open.loc as { start: { line: number; column: number } } | undefined
    if (!loc) return
    const props: NodeFacts['props'] = {}
    const exprProps: string[] = []
    const passes: Record<string, string> = {}
    let cls: NodeFacts['cls'] = 'none'
    for (const a of (open.attributes as AstNode[]) ?? []) {
      if (a.type !== 'JSXAttribute') {
        exprProps.push('...')
        continue
      }
      const name = attrName(a)
      if (!name) continue
      if (name === 'className') cls = classKind(a.value as AstNode | null)
      const v = plainValue(a.value as AstNode | null)
      if (v !== undefined) {
        props[name] = v
        continue
      }
      exprProps.push(name)
      const value = a.value as AstNode | null
      if (value?.type === 'JSXExpressionContainer') {
        const from = propShown(value.expression as AstNode, step)
        if (from) passes[name] = from
      }
    }
    const slot = slotOf(step)
    nodes[`${loc.start.line}:${loc.start.column}`] = {
      slot: slot.kind,
      cls,
      ...textKind(el, step),
      props,
      exprProps,
      ...(Object.keys(passes).length > 0 ? { passes } : {}),
    }
  })
  return { ok: true, file, version: versionOf(source), nodes }
}

// --- text written as data -------------------------------------------------------

/** Attributes whose strings are never words on screen. */
const NOT_WORDS = new Set(['className', 'key', 'id', 'href', 'src', 'type', 'name', 'role', 'style', 'htmlFor', 'variant', 'size', 'intent', 'tone'])

/** Files that describe the project rather than draw it. */
export const NOT_SCREENS = /(^|\/)(index|project\.config)\.tsx?$/

function isWords(step: Step): boolean {
  const up = step.up?.node
  if (!up) return false
  if (up.type === 'ImportDeclaration' || up.type === 'ExportNamedDeclaration' || up.type === 'ExportAllDeclaration') return false
  if ((up.type === 'ObjectProperty' || up.type === 'Property') && step.field === 'key') return false
  if (up.type === 'TSLiteralType' || up.type.startsWith('TS')) return false
  if (up.type === 'JSXAttribute') return !NOT_WORDS.has(attrName(up) ?? '')
  if (up.type === 'JSXExpressionContainer' && step.up?.up?.node.type === 'JSXAttribute') {
    return !NOT_WORDS.has(attrName(step.up.up.node) ?? '')
  }
  if (up.type === 'CallExpression') {
    const callee = up.callee as AstNode
    if (callee.type === 'Identifier' && (callee.name === 'require' || callee.name === 'go')) return false
  }
  if (up.type === 'BinaryExpression' || up.type === 'SwitchCase') return false
  return true
}

/**
 * Where `text` is written as a string in the given files — every match, so
 * the caller can tell one place from several. Files are repo-relative paths
 * to their source.
 */
export function findText(files: Map<string, string>, text: string): { src: Src; version: string }[] {
  const want = text.trim()
  if (!want) return []
  const out: { src: Src; version: string }[] = []
  for (const [file, source] of files) {
    if (!/\.tsx?$/.test(file) || NOT_SCREENS.test(file)) continue
    if (!source.includes(want.slice(0, 24))) continue
    const ast = parseFile(source)
    if (!ast) continue
    const version = versionOf(source)
    walk(ast as unknown as AstNode, (step) => {
      const node = step.node
      let value: string | null = null
      if (node.type === 'StringLiteral') value = String(node.value)
      else if (node.type === 'TemplateLiteral' && (node.expressions as AstNode[]).length === 0) {
        value = String(((node.quasis as AstNode[])[0].value as { cooked: string }).cooked)
      } else if (node.type === 'JSXText') value = String(node.value).trim()
      if (value !== want) return
      if (node.type !== 'JSXText' && !isWords(step)) return
      const loc = node.loc as { start: { line: number; column: number } } | undefined
      if (loc) out.push({ src: `${file}:${loc.start.line}:${loc.start.column}`, version })
    })
  }
  return out
}
