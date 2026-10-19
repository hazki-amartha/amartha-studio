// =============================================================================
// New project · what a project started inside a live app begins with: the
// app's index.ts cut down to its start screen, and every file that screen and
// the index import, as they are. Every other screen stays the app's own, and
// the project inherits it through `extends` (./create.ts).
//
// Only what the start screen needs is copied. The A-Partner reference is 735KB
// across 37 screens; its Beranda and what that imports are 325KB.
// =============================================================================

import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { parse } from '@babel/parser'
import { CreateRefused } from './refused'

const PROJECTS = path.join(process.cwd(), 'projects')

type Node = { type: string; start?: number | null; end?: number | null; [key: string]: unknown }

const parseTs = (source: string) => parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] })

/** Depth-first over a syntax tree; `visit` returning false skips a node's children. */
function walk(node: unknown, visit: (n: Node) => boolean | void): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit)
    return
  }
  const n = node as Node
  if (typeof n.type === 'string' && visit(n) === false) return
  for (const key in n) if (key !== 'loc' && key !== 'leadingComments' && key !== 'trailingComments') walk(n[key], visit)
}

const keyName = (p: Node) => {
  const key = p.key as Node | undefined
  return key?.type === 'Identifier' ? (key.name as string) : key?.type === 'StringLiteral' ? (key.value as string) : null
}

/** The base's index.ts with its screen list cut down to the entry screen, and
 *  everything else — imports, demo states — as written. */
export function entryOnly(index: string): string {
  let screens: Node | null = null
  walk(parseTs(index).program, (n) => {
    if (screens) return false
    if (n.type === 'ObjectProperty' && keyName(n) === 'screens' && (n.value as Node).type === 'ArrayExpression') {
      screens = n.value as Node
      return false
    }
  })
  const list = screens as Node | null
  const isEntry = (p: Node) => {
    const value = p.value as Node
    return p.type === 'ObjectProperty' && keyName(p) === 'entry' && value.type === 'BooleanLiteral' && value.value === true
  }
  const entry = ((list?.elements as Node[] | undefined) ?? []).find(
    (e) => e?.type === 'ObjectExpression' && (e.properties as Node[]).some(isEntry),
  )
  if (!list || !entry) throw new CreateRefused('That app has no start screen to copy, so nothing was created.')
  return `${index.slice(0, list.start!)}[\n    ${index.slice(entry.start!, entry.end!)},\n  ]${index.slice(list.end!)}`
}

/** Every module path a file imports — static, re-exported or lazy. */
export function importsOf(source: string): string[] {
  const out: string[] = []
  walk(parseTs(source).program, (n) => {
    const from = n.source as Node | undefined
    if ((n.type === 'ImportDeclaration' || n.type === 'ExportNamedDeclaration' || n.type === 'ExportAllDeclaration') && from) {
      out.push(from.value as string)
    } else if (n.type === 'CallExpression' && (n.callee as Node).type === 'Import') {
      const [arg] = n.arguments as Node[]
      if (arg?.type === 'StringLiteral') out.push(arg.value as string)
    }
  })
  return out
}

async function resolveIn(dir: string, target: string): Promise<string | null> {
  for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts', '']) {
    const file = await stat(path.join(dir, target + ext)).catch(() => null)
    if (file?.isFile()) return target + ext
  }
  return null
}

/** What a project starting inside `base` begins with: its index.ts, holding
 *  only the base's start screen, and every file that screen and the index
 *  import, as they are. Deployed, the bases are traced into the function
 *  (next.config.mjs). */
export async function startingFiles(base: string): Promise<{ path: string; content: string }[]> {
  const dir = path.join(PROJECTS, base)
  const files = new Map([['index.ts', entryOnly(await readFile(path.join(dir, 'index.ts'), 'utf8'))]])
  const queue = ['index.ts']
  for (let rel = queue.shift(); rel !== undefined; rel = queue.shift()) {
    const source = files.get(rel) ?? (await readFile(path.join(dir, rel), 'utf8'))
    files.set(rel, source)
    for (const spec of importsOf(source)) {
      if (!spec.startsWith('.')) continue
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec))
      // The project gets its own config, naming its own owner.
      if (target === 'project.config' || target.startsWith('..')) continue
      const file = await resolveIn(dir, target)
      if (file && !files.has(file) && !queue.includes(file)) queue.push(file)
    }
  }
  return [...files].map(([p, content]) => ({ path: p, content }))
}
