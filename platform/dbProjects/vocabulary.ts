// =============================================================================
// DB projects · what a project file may name.
//
// Two of the save checks (./checks.ts), kept apart because they need nothing
// but the file and the repo's own sources — which is also what lets
// scripts/test-design.mjs run them without a server:
//
//   raw values   no colour literal (`#22C55E`, `rgb(…)`) anywhere in the file —
//                shadows aside — and no font size / weight / family / line
//                height / letter spacing written into `style`. Neither is a
//                class, so the class check never saw them, and the token lock
//                leaked through them.
//                A value used on purpose — the designer asked for it — is marked
//                `ds-exception: <why>` on its line or the line above, and passes.
//   imports      only modules HOST in ./loader.ts provides, only names those
//                modules export, and only project files that exist. Each of
//                these compiles, saves, and then throws on the link for
//                everyone looking at it.
//
// Like the class checks, both look only at problems the file didn't already
// have, so a project with an old slip stays editable.
// =============================================================================

import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import tailwind from '@/tailwind.config'

/** What a database project can import: HOST in ./loader.ts, which is client
 *  code and can't be imported here. scripts/test-design.mjs keeps the two in step. */
export const HOST_MODULES = [
  'react',
  'react/jsx-runtime',
  '@/design-system/components',
  '@/design-system/icons',
  '@/design-system/assets',
  '@/platform/primitives',
  '@/platform/runtime',
  '@/platform/lazyScreen',
  '@/platform/types',
]

/** The host modules whose names are checked, by the file that defines each.
 *  React's are not (vast, and stable), nor the types module's (erased). */
const SOURCES: Record<string, string> = {
  '@/design-system/components': 'design-system/components/index.ts',
  '@/design-system/icons': 'design-system/icons/index.tsx',
  '@/design-system/assets': 'design-system/assets/index.tsx',
  '@/platform/primitives': 'platform/primitives/index.tsx',
  '@/platform/runtime': 'platform/runtime/index.tsx',
  '@/platform/lazyScreen': 'platform/lazyScreen.tsx',
}

const EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']
const FONT_PROPS = new Set(['fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing'])
/** Attributes whose values are never colours, however hex-like: `href="#add"`. */
const NOT_COLOURS = /^(href|id|key|to|htmlFor|name|aria-.+|data-.+)$/
const EXCEPTION = 'ds-exception'

type Node = { type: string; [key: string]: unknown }

/**
 * Raw-value and import problems in one changed file.
 *
 * @param file    the file's path inside the project (`screens/home.tsx`)
 * @param before  the file as it was — problems already in it are not reported
 * @param files   every file of the project after the save, for relative imports
 * @param root    the repo root, where the host modules' sources are read
 */
export function vocabularyProblems(
  file: string,
  source: string,
  before: string,
  files: Map<string, string>,
  root = process.cwd(),
): string[] {
  let ast: Node
  try {
    ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] }) as unknown as Node
  } catch {
    return [] // the compile check reports it
  }
  const lines = source.split('\n')
  const excepted = (n: Node) => {
    const line = (n.loc as { start: { line: number } }).start.line
    return lines[line - 1]?.includes(EXCEPTION) || lines[line - 2]?.includes(EXCEPTION)
  }
  const problems: string[] = []

  const checkImport = (spec: string, names: string[]) => {
    if (spec.startsWith('.')) {
      const base = join(file, spec)
      if (!EXTENSIONS.some((ext) => files.has(base + ext)) && !quoted(before, spec)) {
        problems.push(`${file}: imports "${spec}", which isn’t a file in this project`)
      }
      return
    }
    if (!HOST_MODULES.includes(spec)) {
      if (!quoted(before, spec)) {
        problems.push(`${file}: imports "${spec}" — a database project can only import React, the design system and the studio runtime`)
      }
      return
    }
    const known = SOURCES[spec] ? exportsOf(path.join(root, SOURCES[spec])) : null
    if (!known) return
    for (const name of names) {
      if (known.has(name) || hasName(before, name)) continue
      const near = closest(name, known)
      problems.push(`${file}: "${spec}" has no export \`${name}\`${near.length ? ` — did you mean ${near.map((n) => `\`${n}\``).join(', ')}?` : ''}`)
    }
  }

  walk(ast, (n, parent) => {
    const attribute = parent?.type === 'JSXAttribute' ? nameOf(parent.name as Node) : ''
    if ((n.type === 'StringLiteral' || n.type === 'TemplateElement') && !NOT_COLOURS.test(attribute)) {
      const text = n.type === 'StringLiteral' ? String(n.value) : (n.value as { raw: string }).raw
      for (const value of coloursIn(text)) {
        if (before.includes(value) || excepted(n)) continue
        const token = nearestToken(value)
        problems.push(`${file}: \`${value}\` is a raw colour — use a design-system colour${token ? ` (nearest: ${token})` : ''}`)
      }
    }

    if (n.type === 'JSXAttribute' && (n.name as Node)?.name === 'style') {
      const value = n.value as Node | null
      const object = value?.type === 'JSXExpressionContainer' ? (value.expression as Node) : null
      for (const p of object?.type === 'ObjectExpression' ? (object.properties as Node[]) : []) {
        if (p.type !== 'ObjectProperty') continue
        const key = p.key as Node
        const prop = key.type === 'Identifier' ? String(key.name) : key.type === 'StringLiteral' ? String(key.value) : ''
        const v = p.value as Node
        const literal =
          v.type === 'StringLiteral' ||
          v.type === 'NumericLiteral' ||
          (v.type === 'TemplateLiteral' && !(v.expressions as unknown[]).length)
        if (!FONT_PROPS.has(prop) || !literal) continue
        if (before.includes(source.slice(p.start as number, p.end as number)) || excepted(p)) continue
        problems.push(`${file}: \`style\` sets ${prop} — use the type classes (\`text-14\`, \`font-bold\`) instead`)
      }
    }

    if (n.type === 'ImportDeclaration' && n.importKind !== 'type') {
      const names = (n.specifiers as Node[]).flatMap((s) =>
        s.type === 'ImportDefaultSpecifier'
          ? ['default']
          : s.type === 'ImportSpecifier' && s.importKind !== 'type'
            ? [nameOf(s.imported as Node)]
            : [],
      )
      checkImport(String((n.source as Node).value), names)
    }
    if (n.type === 'ExportNamedDeclaration' && n.source && n.exportKind !== 'type') {
      checkImport(String((n.source as Node).value), (n.specifiers as Node[]).map((s) => nameOf(s.local as Node)))
    }
    if (n.type === 'ExportAllDeclaration' && n.exportKind !== 'type') checkImport(String((n.source as Node).value), [])
    if (n.type === 'CallExpression' && (n.callee as Node)?.type === 'Import') {
      const arg = (n.arguments as Node[])[0]
      if (arg?.type === 'StringLiteral') checkImport(String(arg.value), [])
    }
  })
  return problems
}

// --- colours -------------------------------------------------------------------

const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi
const FUNCTION = /\b(?:rgba?|hsla?)\([^)]*\)/gi
/** A string is a CSS value, not prose, when it has units, a border style or a
 *  colour function — so "Pinjaman #1234" is left alone and "1px solid #F4F0F9" isn't. */
const CSS_VALUE = /\d(?:px|em|rem|deg|%)|\b(?:solid|dashed|dotted)\b|gradient\(|\b(?:rgba?|hsla?)\(/i
/** Offsets and blur, then a colour: a shadow. There are no shadow tokens, and
 *  FunDS's own primary Button casts a purple one, so a shadow's tint is a
 *  design decision this check doesn't take away. */
const SHADOW = /^(?:inset\s+)?(?:-?\d*\.?\d+(?:px|rem|em)?\s+){2,4}(?:#|rgba?\(|hsla?\()/i

/** The colour literals in a string. Strings with `[` are class lists, where an
 *  arbitrary value (`bg-[#853291]`) is already its own error. */
function coloursIn(text: string): string[] {
  const whole = text.trim()
  if (!whole || whole.includes('[') || SHADOW.test(whole)) return []
  if (/^#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})$/i.test(whole)) return [whole]
  if (!CSS_VALUE.test(whole)) return []
  return [...(whole.match(FUNCTION) ?? []), ...(whole.match(HEX) ?? [])]
}

type Rgb = [number, number, number]

/** Every colour a prototype can paint with, as `[token, rgb]`. The ink ramp is
 *  the studio's own chrome, not a prototype colour, so it is never suggested. */
const PALETTE: [string, Rgb][] = Object.entries(
  (tailwind.theme?.colors ?? {}) as Record<string, string | Record<string, string>>,
).flatMap(([name, scale]) =>
  name === 'ink' || typeof scale !== 'object'
    ? []
    : Object.entries(scale).flatMap(([step, hex]): [string, Rgb][] => {
        const rgb = rgbOf(hex)
        return rgb ? [[`${name}-${step}`, rgb]] : []
      }),
)

function rgbOf(value: string): Rgb | null {
  const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1]
  if (hex) {
    const full = hex.length <= 4 ? [...hex.slice(0, 3)].map((c) => c + c).join('') : hex.slice(0, 6)
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb
  }
  const parts = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
  return parts ? [Number(parts[1]), Number(parts[2]), Number(parts[3])] : null
}

/** The token closest to a colour, by the "redmean" approximation of how far
 *  apart two colours look — good enough to point at the right ramp and step. */
function nearestToken(value: string): string | null {
  const rgb = rgbOf(value)
  if (!rgb) return null
  let best: [string, number] | null = null
  for (const [token, [r, g, b]] of PALETTE) {
    const mean = (rgb[0] + r) / 2
    const d = (2 + mean / 256) * (rgb[0] - r) ** 2 + 4 * (rgb[1] - g) ** 2 + (2 + (255 - mean) / 256) * (rgb[2] - b) ** 2
    if (!best || d < best[1]) best = [token, d]
  }
  return best?.[0] ?? null
}

// --- exports -------------------------------------------------------------------

const own = new Map<string, { mtime: number; names: Set<string>; all: string[] }>()

/**
 * The names a module file exports, following `export * from` into the files it
 * names. Null when a file can't be read — on a deployment that didn't ship the
 * sources, say — and then that module's names go unchecked rather than guessed.
 */
export function exportsOf(file: string, seen = new Set<string>()): Set<string> | null {
  if (seen.has(file)) return new Set()
  seen.add(file)
  const mine = ownExports(file)
  if (!mine) return null
  const names = new Set(mine.names)
  for (const target of mine.all) {
    const more = exportsOf(target, seen)
    if (!more) return null
    more.forEach((n) => names.add(n))
  }
  return names
}

/** One file's own exports and the files its `export *` lines pull in, cached
 *  until the file changes. */
function ownExports(file: string): { names: Set<string>; all: string[] } | null {
  let mtime: number
  try {
    mtime = statSync(file).mtimeMs
  } catch {
    return null
  }
  const hit = own.get(file)
  if (hit?.mtime === mtime) return hit
  let body: Node[]
  try {
    const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] })
    body = ast.program.body as unknown as Node[]
  } catch {
    return null
  }
  const names = new Set<string>()
  const all: string[] = []
  for (const n of body) {
    if (n.type === 'ExportNamedDeclaration') {
      const d = n.declaration as Node | null
      if (d?.type === 'VariableDeclaration') {
        for (const v of d.declarations as Node[]) if ((v.id as Node).type === 'Identifier') names.add(String((v.id as Node).name))
      } else if (d && (d.id as Node | undefined)?.type === 'Identifier') names.add(String((d.id as Node).name))
      for (const s of n.specifiers as Node[]) names.add(nameOf(s.exported as Node))
    } else if (n.type === 'ExportAllDeclaration') {
      if (n.exported) names.add(nameOf(n.exported as Node))
      else {
        const target = sibling(file, String((n.source as Node).value))
        if (!target) return null
        all.push(target)
      }
    } else if (n.type === 'ExportDefaultDeclaration') names.add('default')
  }
  const entry = { mtime, names, all }
  own.set(file, entry)
  return entry
}

function sibling(file: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  const base = path.join(path.dirname(file), spec)
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    try {
      if (statSync(base + ext).isFile()) return base + ext
    } catch {
      // try the next spelling
    }
  }
  return null
}

/** Up to three exported names a misspelt one was probably meant to be. */
function closest(name: string, names: Set<string>): string[] {
  const want = name.toLowerCase()
  return [...names]
    .map((n) => {
      const have = n.toLowerCase()
      return [n, have.includes(want) || want.includes(have) ? 0 : distance(want, have)] as const
    })
    .filter(([, d]) => d <= 2)
    .sort((a, b) => a[1] - b[1] || a[0].length - b[0].length)
    .slice(0, 3)
    .map(([n]) => n)
}

function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const next = [i]
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    row = next
  }
  return row[b.length]
}

// --- helpers -------------------------------------------------------------------

/** A project path joined with a relative import, as ./loader.ts resolves it. */
function join(from: string, spec: string): string {
  const parts = from.split('/').slice(0, -1)
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.' && seg !== '') parts.push(seg)
  }
  return parts.join('/')
}

/** An identifier's name — `Identifier` or `JSXIdentifier` — or a quoted name's text. */
const nameOf = (n: Node) => String(n.type === 'StringLiteral' ? n.value : n.name)
const quoted = (text: string, spec: string) => text.includes(`'${spec}'`) || text.includes(`"${spec}"`)
const hasName = (text: string, name: string) => new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`).test(text)

function walk(node: unknown, visit: (n: Node, parent: Node | null) => void, parent: Node | null = null) {
  if (Array.isArray(node)) return node.forEach((c) => walk(c, visit, parent))
  if (!node || typeof node !== 'object' || typeof (node as Node).type !== 'string') return
  const n = node as Node
  visit(n, parent)
  for (const key of Object.keys(n)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue
    const child = n[key]
    if (child && typeof child === 'object') walk(child, visit, n)
  }
}
