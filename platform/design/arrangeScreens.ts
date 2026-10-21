// =============================================================================
// Design · rearranging a project's screen list — the sidebar's drag and drop.
//
// The sidebar shows a project's screens in sections (ScreenDef.section); moving
// a row or a section, or naming one, comes here as the whole arrangement: the
// one the sidebar showed (`seen`) and the one it wants (`next`). A pure
// function on index.ts's source, like applyEdits.
//
// The parser only finds positions; the file is changed by splicing text. Each
// screen entry — with the comments and blank lines above it — moves verbatim,
// and a section is one `section: '…',` line added, changed or removed beside
// the title. A reprinter (recast, as applyEdits uses) re-quoted and re-spaced
// every entry it touched, turning a drag into a diff nobody could read.
//
// Refuse, don't guess, as everywhere in design mode: the file must still hold
// exactly the arrangement the sidebar showed, and every entry must be a plain
// `{ id: '…', … }` literal on its own lines. A list built any other way
// (spreads, mapped arrays, one line) is the agent's to change, not a drag's.
// =============================================================================

import { parse } from '@babel/parser'

/** One screen's place in the list: its id, and its section if it has one. */
export interface ScreenSlot {
  id: string
  section?: string
}

export type ArrangeResult = { ok: true; source: string } | { ok: false; reason: string }

// The few Babel node fields used here, loosely — this reads, never builds.
interface Node {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

const UNREADABLE =
  'This project’s screen list is written in a way the sidebar can’t rearrange — ask Chat to do it instead.'
const CHANGED = 'Someone just changed this project’s screens. The list updates in a moment — then try again.'

const keyName = (prop: Node): string | null => {
  const key = prop.key as Node | undefined
  if (key?.type === 'Identifier') return key.name as string
  if (key?.type === 'StringLiteral') return key.value as string
  return null
}

/** Strip what TypeScript wraps a value in: `{…} as X`, `{…} satisfies X`, `(…)`. */
function unwrap(node: Node | null | undefined): Node | null {
  let n = node ?? null
  while (n && (n.type === 'TSAsExpression' || n.type === 'TSSatisfiesExpression' || n.type === 'ParenthesizedExpression')) {
    n = n.expression as Node
  }
  return n
}

/** The top-level `const <name> = …` initialiser, exported or not. */
function topLevel(program: Node, name: string): Node | null {
  for (const statement of program.body as Node[]) {
    const decl = statement.type === 'ExportNamedDeclaration' ? (statement.declaration as Node | null) : statement
    if (decl?.type !== 'VariableDeclaration') continue
    for (const d of decl.declarations as Node[]) {
      const id = d.id as Node
      if (id.type === 'Identifier' && id.name === name) return unwrap(d.init as Node)
    }
  }
  return null
}

const propOf = (entry: Node, name: string) =>
  (entry.properties as Node[]).find((p) => p.type === 'ObjectProperty' && keyName(p) === name)

/** The array literal behind `project.screens`. */
function screensArray(program: Node): Node | null {
  const project = topLevel(program, 'project')
  if (project?.type !== 'ObjectExpression') return null
  const value = unwrap(propOf(project, 'screens')?.value as Node)
  if (value?.type === 'ArrayExpression') return value
  // `screens,` or `screens: screens` — a list declared beside the project.
  if (value?.type === 'Identifier') {
    const list = topLevel(program, value.name as string)
    return list?.type === 'ArrayExpression' ? list : null
  }
  return null
}

/** An entry's id and section, or null when either isn't a plain string. */
function slotOf(entry: Node): ScreenSlot | null {
  if (entry.type !== 'ObjectExpression') return null
  const id = unwrap(propOf(entry, 'id')?.value as Node)
  if (id?.type !== 'StringLiteral') return null
  const section = propOf(entry, 'section')
  if (!section) return { id: id.value as string }
  const value = unwrap(section.value as Node)
  return value?.type === 'StringLiteral' ? { id: id.value as string, section: value.value as string } : null
}

const quote = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const lineStart = (src: string, at: number) => src.lastIndexOf('\n', at - 1) + 1
/** Just past the newline ending the line `at` is on. */
const lineEnd = (src: string, at: number) => {
  const nl = src.indexOf('\n', at)
  return nl < 0 ? src.length : nl + 1
}

/** One splice on the source: replace [from, to) with `text`. */
interface Splice {
  from: number
  to: number
  text: string
}

/** The splices that give an entry this section, or take its section away. */
function sectionSplices(src: string, entry: Node, section: string | undefined): Splice[] | null {
  const current = propOf(entry, 'section')
  if (current && section) {
    const value = current.value as Node
    return [{ from: value.start, to: value.end, text: quote(section) }]
  }
  if (current) {
    // The line, when the property has it to itself; else the property and
    // its comma.
    const from = lineStart(src, current.start)
    const to = lineEnd(src, current.end)
    if (/^\s*section\s*:[^\n]*,?\s*$/.test(src.slice(from, to))) return [{ from, to, text: '' }]
    const after = src.slice(current.end).match(/^\s*,\s*/)?.[0] ?? ''
    return [{ from: current.start, to: current.end + after.length, text: '' }]
  }
  if (!section) return []
  // Beside the title, where a reader looks for what the screen is.
  const anchor = propOf(entry, 'title') ?? propOf(entry, 'id')
  if (!anchor) return null
  const rest = src.slice(anchor.end)
  const comma = rest.match(/^\s*,/)
  const ownLine = comma && /^\s*(\/\/[^\n]*)?\n/.test(rest.slice(comma[0].length))
  if (ownLine) {
    const indent = src.slice(lineStart(src, anchor.start), anchor.start)
    if (/\S/.test(indent)) return null
    const at = lineEnd(src, anchor.end)
    return [{ from: at, to: at, text: `${indent}section: ${quote(section)},\n` }]
  }
  return [{ from: anchor.end, to: anchor.end, text: `, section: ${quote(section)}` }]
}

const sameSlots = (a: readonly ScreenSlot[], b: readonly ScreenSlot[]) =>
  a.length === b.length && a.every((s, i) => s.id === b[i].id && (s.section ?? '') === (b[i].section ?? ''))

/** Rewrite index.ts's screen list from `seen` to `next`. */
export function arrangeScreens(source: string, seen: readonly ScreenSlot[], next: readonly ScreenSlot[]): ArrangeResult {
  let file: Node
  try {
    file = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] }) as unknown as Node
  } catch {
    return { ok: false, reason: UNREADABLE }
  }
  const array = screensArray(file.program as Node)
  if (!array) return { ok: false, reason: UNREADABLE }

  const entries = array.elements as (Node | null)[]
  if (entries.length === 0) return { ok: false, reason: UNREADABLE }
  const slots: ScreenSlot[] = []
  const byId = new Map<string, number>()
  for (const [i, entry] of entries.entries()) {
    const slot = entry ? slotOf(entry) : null
    if (!entry || !slot || byId.has(slot.id)) return { ok: false, reason: UNREADABLE }
    slots.push(slot)
    byId.set(slot.id, i)
  }
  if (!sameSlots(slots, seen)) return { ok: false, reason: CHANGED }

  // The same screens, each once — a drag never adds or drops one.
  if (new Set(next.map((s) => s.id)).size !== next.length || next.length !== slots.length || next.some((s) => !byId.has(s.id))) {
    return { ok: false, reason: CHANGED }
  }
  if (sameSlots(slots, next)) return { ok: true, source }

  // Cut the list into chunks, one per entry: from the end of the line the
  // previous entry ends on (the first: the line after `[`) to the end of the
  // line this one ends on — so each carries its own comments and blank lines.
  // Two entries sharing a line can't be cut apart, so that's refused.
  const open = source.indexOf('[', array.start)
  const first = lineEnd(source, open)
  const bounds: { from: number; to: number }[] = []
  let from = first
  for (const entry of entries as Node[]) {
    if (entry.start < from) return { ok: false, reason: UNREADABLE }
    const to = lineEnd(source, entry.end)
    if (!/^\s*,?\s*(\/\/[^\n]*)?\n?$/.test(source.slice(entry.end, to))) return { ok: false, reason: UNREADABLE }
    bounds.push({ from, to })
    from = to
  }
  const lastEnd = from
  if (lastEnd > array.end) return { ok: false, reason: UNREADABLE }

  const chunks = (entries as Node[]).map((entry, i) => {
    const { from, to } = bounds[i]
    const section = next.find((s) => s.id === slots[i].id)!.section?.trim() || undefined
    const splices = section === slots[i].section ? [] : sectionSplices(source, entry, section)
    if (!splices) return null
    // Applied back to front so earlier positions stay valid.
    let text = source.slice(from, to)
    for (const s of [...splices].sort((a, b) => b.from - a.from)) {
      text = text.slice(0, s.from - from) + s.text + text.slice(s.to - from)
    }
    // Every chunk ends in a comma, so the last one can move up the list.
    const end = entry.end - from + text.length - (to - from)
    if (!/^\s*,/.test(text.slice(end))) text = `${text.slice(0, end)},${text.slice(end)}`
    return text
  })
  if (chunks.some((c) => c === null)) return { ok: false, reason: UNREADABLE }

  const list = next.map((s) => chunks[byId.get(s.id)!]).join('')
  return { ok: true, source: source.slice(0, first) + list + source.slice(lastEnd) }
}
