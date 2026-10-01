// =============================================================================
// DB projects · the checks a save must pass.
//
// A git project reaches the link through lint, the build and check:flows. A
// database project's save is live at once, so those checks run here, on the
// save itself, and a save that fails them is refused:
//
//   compiles       every file compiles
//   design system  classes are the token-locked ones — no arbitrary values
//                  (`p-[13px]`), nothing the config doesn't define
//                  (`font-medium`). The CSS generator would happily render
//                  either, so nothing else stops them now.
//   stays inside   no fetch / WebSocket / browser storage / eval / window.open
//                  — the same globals the lint config bans in projects/
//   flows          one entry screen, unique ids, a known owner, one level of
//                  `extends`, and every flowsTo and go('…') names a real screen
//
// Class and global checks look only at what the save CHANGES, and only at
// problems the file didn't already have — a project with an old slip must stay
// editable. The flow checks are whole-project, as check:flows is.
// =============================================================================

import { parse } from '@babel/parser'
import { transform } from 'sucrase'
import { knownNames } from '@/platform/auth/profiles'
import type { ProjectModule, ScreenDef } from '@/platform/types'
import { configs } from '@/projects/configs'
import { tailwindFor } from './server'

const COMPILED = /\.(tsx?|jsx?)$/
const CLASS_CALLEES = new Set(['clsx', 'cn'])
/** Classes that are real but generate no CSS of their own. */
const NO_CSS = /^(group|peer|ds-.*)$/
const BANNED: Record<string, string> = {
  fetch: 'reaches outside the studio',
  XMLHttpRequest: 'reaches outside the studio',
  WebSocket: 'reaches outside the studio',
  EventSource: 'reaches outside the studio',
  importScripts: 'reaches outside the studio',
  localStorage: 'keeps state in browser storage — use a module store',
  sessionStorage: 'keeps state in browser storage — use a module store',
  indexedDB: 'keeps state in browser storage — use a module store',
  eval: 'runs code built from a string',
}
const BANNED_ON_WINDOW = new Set([...Object.keys(BANNED), 'open'])
const MAX_REPORTED = 8

/**
 * The problems a project would have after a save, or none.
 *
 * @param files     every file of the project as it would be after the save
 * @param previous  the files as they are now — problems already there are not
 *                  the save's fault
 * @param changed   the paths the save writes
 */
export async function checkDbProject(
  slug: string,
  files: Map<string, string>,
  previous: Map<string, string>,
  changed: string[],
): Promise<string[]> {
  const errors: string[] = []

  for (const [path, content] of files) {
    if (!COMPILED.test(path)) continue
    try {
      transform(content, { transforms: ['typescript', 'jsx', 'imports'], jsxRuntime: 'automatic', filePath: path })
    } catch (e) {
      errors.push(`${path} doesn’t compile: ${firstLine(e)}`)
    }
  }
  if (errors.length) return errors.slice(0, MAX_REPORTED)

  const candidates = new Map<string, string>()
  for (const path of changed) {
    const content = files.get(path)
    if (content === undefined || !COMPILED.test(path)) continue
    const before = previous.get(path) ?? ''
    const found = scan(content)
    for (const cls of found.classes) {
      if (hasWord(before, cls)) continue
      if (/\[.*\]/.test(cls)) errors.push(`${path}: \`${cls}\` is an arbitrary value — use a design-system token`)
      else if (!NO_CSS.test(cls.split(':').pop() ?? cls)) candidates.set(cls, path)
    }
    for (const { name, onWindow } of found.globals) {
      if (hasWord(before, name)) continue
      const why = BANNED[name] ?? 'reaches outside the studio'
      errors.push(`${path}: ${onWindow ? `window.${name}` : name} ${why} — prototypes draw the result on a screen instead`)
    }
  }

  if (candidates.size) {
    const known = generatedClasses(await tailwindFor([...candidates.keys()].join(' ')))
    for (const [cls, path] of candidates) {
      if (!known.has(cls)) errors.push(`${path}: \`${cls}\` isn’t a design-system class`)
    }
  }

  errors.push(...(await flowProblems(slug, files)))
  return [...new Set(errors)].slice(0, MAX_REPORTED)
}

// --- classes and globals -------------------------------------------------------

interface Found {
  classes: Set<string>
  globals: { name: string; onWindow: boolean }[]
}

type Node = { type: string; [key: string]: unknown }

function scan(source: string): Found {
  const found: Found = { classes: new Set(), globals: [] }
  let ast: Node
  try {
    ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] }) as unknown as Node
  } catch {
    return found
  }

  const collectStrings = (node: unknown) =>
    walk(node, (n) => {
      if (n.type === 'StringLiteral') addClasses(found.classes, String(n.value), true, true)
      else if (n.type === 'TemplateLiteral') {
        const quasis = n.quasis as { value: { raw: string } }[]
        quasis.forEach((q, i) => addClasses(found.classes, q.value.raw, i === 0, i === quasis.length - 1))
      }
    })

  walk(ast, (n, parent) => {
    if (n.type === 'JSXAttribute' && (n.name as Node)?.name === 'className') collectStrings(n.value)
    if (n.type === 'CallExpression' && CLASS_CALLEES.has(String((n.callee as Node)?.name))) collectStrings(n.arguments)

    if (n.type === 'Identifier' && String(n.name) in BANNED && parent) {
      const used =
        ((parent.type === 'CallExpression' || parent.type === 'NewExpression') && parent.callee === n) ||
        (parent.type === 'MemberExpression' && parent.object === n)
      if (used) found.globals.push({ name: String(n.name), onWindow: false })
    }
    if (
      n.type === 'MemberExpression' &&
      (n.object as Node)?.type === 'Identifier' &&
      (n.object as Node).name === 'window' &&
      !n.computed &&
      BANNED_ON_WINDOW.has(String((n.property as Node)?.name))
    ) {
      found.globals.push({ name: String((n.property as Node).name), onWindow: true })
    }
  })
  return found
}

/** Whitespace-separated class names; a name cut by a `${…}` at either edge of
 *  a template piece is only half a name, so it is left out. */
function addClasses(into: Set<string>, text: string, openStart: boolean, openEnd: boolean) {
  const parts = text.split(/\s+/)
  parts.forEach((p, i) => {
    if (!p) return
    if (i === 0 && !openStart && !/^\s/.test(text)) return
    if (i === parts.length - 1 && !openEnd && !/\s$/.test(text)) return
    if (/^[!-]?[a-z0-9]/i.test(p) && /^[\w:/.\-![\]#%(),]+$/.test(p)) into.add(p)
  })
}

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

/** Every class a stylesheet defines, unescaped (`.md\:flex` → `md:flex`). */
function generatedClasses(css: string): Set<string> {
  const out = new Set<string>()
  for (const m of css.matchAll(/\.((?:\\.|[\w-])+)/g)) out.add(m[1].replace(/\\(.)/g, '$1'))
  return out
}

function hasWord(text: string, word: string): boolean {
  let i = text.indexOf(word)
  while (i !== -1) {
    const before = text[i - 1]
    const after = text[i + word.length]
    if ((!before || !/[\w:-]/.test(before)) && (!after || !/[\w:-]/.test(after))) return true
    i = text.indexOf(word, i + 1)
  }
  return false
}

// --- flows ---------------------------------------------------------------------

/**
 * check:flows, for one database project. Runs index.ts with every studio
 * module stubbed out — it only needs the screen list, not working components.
 * If the index can't be run that way, the flow checks are skipped rather than
 * guessed at: the compile check above already caught anything truly broken.
 */
async function flowProblems(slug: string, files: Map<string, string>): Promise<string[]> {
  const project = runIndex(files)
  if (!project) return []
  const { config, screens } = project
  const errors: string[] = []

  if (config.slug !== slug) errors.push(`project.config.ts: slug is "${config.slug}", but this project is "${slug}"`)
  const named = [config.owner].flat().filter(Boolean)
  if (!named.length) errors.push('project.config.ts: the project has no owner')
  // Anyone who has signed in goes by a name they can own projects under
  // (platform/auth/profiles.ts), beside the git roster in owners.json.
  if (named.length) {
    const known = await knownNames()
    for (const o of named) {
      if (!known.includes(o)) errors.push(`project.config.ts: "${o}" isn’t a name anyone in the studio goes by (${known.join(', ')})`)
    }
  }

  const ids = new Set<string>()
  for (const s of screens) {
    if (ids.has(s.id)) errors.push(`index.ts: two screens have the id "${s.id}"`)
    ids.add(s.id)
  }
  const entries = screens.filter((s) => s.entry).length
  if (entries !== 1) errors.push(`index.ts: exactly one screen must be the entry — found ${entries}`)

  // A base is a git project: only its config is readable on the server (its
  // screens are client code), so the base must exist and not extend again —
  // and a target that isn't one of this project's own screens may be the
  // base's, so it can't be called wrong here.
  if (config.extends) {
    const base = await configs[config.extends]?.()
    if (!base) errors.push(`project.config.ts: extends "${config.extends}", which isn’t a project`)
    else if (base.extends) {
      errors.push(`project.config.ts: "${config.extends}" itself extends another project — one level only`)
    }
    return errors
  }

  for (const s of screens) {
    for (const edge of s.flowsTo ?? []) {
      if (!ids.has(edge.to)) errors.push(`index.ts: screen "${s.id}" flows to "${edge.to}", which doesn’t exist`)
    }
  }
  for (const [path, content] of files) {
    for (const m of content.matchAll(/\bgo\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      if (!ids.has(m[1])) errors.push(`${path}: go('${m[1]}') — there’s no screen with that id`)
    }
  }
  return errors
}

function runIndex(files: Map<string, string>): ProjectModule | null {
  const stub: unknown = new Proxy(function () {}, {
    get: (_t, key) => (key === '__esModule' ? false : key === Symbol.toPrimitive ? () => '' : stub),
    apply: () => stub,
    construct: () => stub as object,
  })
  const lazyScreen = { lazyScreen: () => stub }
  const instances = new Map<string, { exports: Record<string, unknown> }>()

  const load = (path: string): Record<string, unknown> => {
    const hit = instances.get(path)
    if (hit) return hit.exports
    const module = { exports: {} as Record<string, unknown> }
    instances.set(path, module)
    const code = transform(files.get(path)!, {
      transforms: ['typescript', 'jsx', 'imports'],
      jsxRuntime: 'automatic',
      production: true,
    }).code
    // eslint-disable-next-line no-new-func
    new Function('require', 'module', 'exports', code)((spec: string) => resolve(path, spec), module, module.exports)
    return module.exports
  }
  const resolve = (from: string, spec: string): unknown => {
    if (spec === '@/platform/lazyScreen') return lazyScreen
    if (!spec.startsWith('.')) return stub
    const parts = from.split('/').slice(0, -1)
    for (const seg of spec.split('/')) {
      if (seg === '..') parts.pop()
      else if (seg !== '.' && seg) parts.push(seg)
    }
    const base = parts.join('/')
    for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
      if (files.has(base + ext)) return load(base + ext)
    }
    return stub
  }

  try {
    const index = ['index.ts', 'index.tsx'].find((p) => files.has(p))
    const project = index ? (load(index).project as ProjectModule | undefined) : undefined
    if (!project?.config || !Array.isArray(project.screens)) return null
    const screens = project.screens.map((s: ScreenDef) => ({ ...s }))
    return { config: { ...project.config }, screens }
  } catch {
    return null
  }
}

function firstLine(e: unknown): string {
  return (e instanceof Error ? e.message : String(e)).split('\n')[0]
}
