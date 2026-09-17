// =============================================================================
// Design · keeping a written file's diff to what the designer did.
//
// Two passes run on recast's output, both as TEXT edits rather than tree
// edits, because a tree edit is exactly what causes the noise they remove:
//
//   • imports — a delete can leave a component unused, and an insert (D3) needs
//     one imported. Editing the ImportDeclaration nodes makes recast reprint
//     them, and pruning a whole declaration reprinted the program's directive
//     too (`'use client'` gained a semicolon and lost its blank line). Here the
//     specifier text is spliced directly, so the diff is the one name.
//
//   • semicolons — recast terminates every statement it reprints, and this repo
//     omits them. A `return (…)` whose JSX changed came back as `);`, one extra
//     changed line per edited statement. Any output line that differs from an
//     unchanged original line only by that `;` is put back.
// =============================================================================

import { parse } from '@babel/parser'

type File = ReturnType<typeof parse>
type AnyNode = { type: string; start?: number | null; end?: number | null; [k: string]: unknown }

function parseTsx(source: string): File | null {
  try {
    return parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
  } catch {
    return null
  }
}

function walk(node: unknown, visit: (node: AnyNode, inImport: boolean) => void, inImport = false) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const c of node) walk(c, visit, inImport)
    return
  }
  const a = node as AnyNode
  if (typeof a.type !== 'string') return
  const importing = inImport || a.type === 'ImportDeclaration'
  visit(a, importing)
  for (const key of Object.keys(a)) {
    if (key === 'loc' || key.endsWith('Comments')) continue
    walk(a[key], visit, importing)
  }
}

/** How many times each name is referenced outside import declarations. */
function usage(file: File): Map<string, number> {
  const counts = new Map<string, number>()
  walk(file.program, (node, inImport) => {
    if (inImport) return
    if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
      const name = node.name as string
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  })
  return counts
}

export interface ImportNeed {
  /** The name a component is written as, e.g. `Button`. */
  name: string
  /** The module that exports it, e.g. `@/design-system/components`. */
  from: string
}

interface Splice {
  start: number
  end: number
  text: string
}

function applySplices(source: string, splices: Splice[]): string {
  let out = source
  for (const s of [...splices].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, s.start) + s.text + out.slice(s.end)
  }
  return out
}

/**
 * Drop imports this batch left unused, and add the ones it needs.
 *
 * Only names whose use went from some to none are removed — an import that was
 * already unused before the edit is the author's business, not the panel's.
 */
export function tidyImports(before: string, after: string, needs: ImportNeed[] = []): string {
  const was = parseTsx(before)
  const now = parseTsx(after)
  if (!was || !now) return after

  const usedBefore = usage(was)
  const usedAfter = usage(now)
  const splices: Splice[] = []

  const decls = now.program.body.flatMap((s) => (s.type === 'ImportDeclaration' ? [s] : []))
  const imported = new Set<string>()
  for (const d of decls) for (const s of d.specifiers) imported.add(s.local.name)

  // What each declaration should end up naming: its survivors, plus anything a
  // batch needs from the same module. One splice per declaration, so a drop
  // and an add on the same line can never overlap.
  const plan = new Map<(typeof decls)[number], { drop: Set<unknown>; add: string[] }>()
  const planFor = (d: (typeof decls)[number]) => {
    let p = plan.get(d)
    if (!p) plan.set(d, (p = { drop: new Set(), add: [] }))
    return p
  }

  for (const d of decls) {
    for (const s of d.specifiers) {
      const local = s.local.name
      if ((usedBefore.get(local) ?? 0) > 0 && (usedAfter.get(local) ?? 0) === 0) {
        planFor(d).drop.add(s)
      }
    }
  }

  const bySource = new Map<string, string[]>()
  for (const need of needs) {
    if (imported.has(need.name)) continue
    const names = bySource.get(need.from) ?? []
    if (!names.includes(need.name)) names.push(need.name)
    bySource.set(need.from, names)
  }

  const newLines: string[] = []
  const lastDecl = decls[decls.length - 1]
  const semi = lastDecl ? after.slice(lastDecl.start ?? 0, lastDecl.end ?? 0).endsWith(';') : false
  const quote = lastDecl && after[lastDecl.source.start ?? 0] === '"' ? '"' : "'"

  for (const [from, names] of bySource) {
    const into = decls.find(
      (d) =>
        d.source.value === from &&
        d.importKind !== 'type' &&
        d.specifiers.length > 0 &&
        d.specifiers.every((s) => s.type === 'ImportSpecifier'),
    )
    if (into) planFor(into).add.push(...names)
    else newLines.push(`import { ${names.join(', ')} } from ${quote}${from}${quote}${semi ? ';' : ''}`)
  }

  for (const [d, { drop, add }] of plan) {
    const specs = d.specifiers
    const kept = specs.filter((s) => !drop.has(s))

    if (kept.length === 0 && add.length === 0) {
      // The whole line goes, including its newline.
      const start = d.start ?? 0
      let end = d.end ?? start
      if (after[end] === '\n') end += 1
      splices.push({ start, end, text: '' })
      continue
    }

    // Partial rewrites only for a plain `{ A, B }` list. With a default or
    // namespace import in the line, the specifiers are not one comma-separated
    // run, and leaving an unused name behind is harmless where a mangled
    // import is not.
    if (!specs.every((s) => s.type === 'ImportSpecifier')) continue

    // The survivors keep their own text, joined with the list's own separator
    // — `, ` on one line, `,\n  ` when the import is written one per line.
    const first = specs[0]
    const last = specs[specs.length - 1]
    if (first.start == null || last.end == null) continue
    const sep =
      specs.length > 1 && specs[0].end != null && specs[1].start != null
        ? after.slice(specs[0].end, specs[1].start)
        : ', '
    const text = [...kept.map((s) => after.slice(s.start ?? 0, s.end ?? 0)), ...add].join(sep)
    splices.push({ start: first.start, end: last.end, text })
  }

  if (newLines.length > 0) {
    if (lastDecl) {
      const at = lastDecl.end ?? 0
      splices.push({ start: at, end: at, text: `\n${newLines.join('\n')}` })
    } else {
      // No imports at all: after the directive prologue, or at the top.
      const directive = now.program.directives[now.program.directives.length - 1]
      const at = directive?.end ?? 0
      const text = directive ? `\n\n${newLines.join('\n')}` : `${newLines.join('\n')}\n\n`
      splices.push({ start: at, end: at, text })
    }
  }

  return splices.length > 0 ? applySplices(after, splices) : after
}

/**
 * Put back the semicolons recast added.
 *
 * Aligns the two files by their longest common run of lines and looks only at
 * the gaps: an output line in a gap that is an original line in the same gap
 * plus a trailing `;` is the original, reprinted. Anywhere else a `;` is left
 * alone — it may be part of what was written.
 */
export function restoreSemicolons(original: string, printed: string): string {
  const a = original.split('\n')
  const bLines = printed.split('\n')
  if (a.length * bLines.length > 4_000_000) return printed

  // LCS table over lines, bottom-up.
  const rows = a.length + 1
  const cols = bLines.length + 1
  const table = new Uint32Array(rows * cols)
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = bLines.length - 1; j >= 0; j--) {
      table[i * cols + j] =
        a[i] === bLines[j]
          ? table[(i + 1) * cols + j + 1] + 1
          : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1])
    }
  }

  const out = [...bLines]
  let i = 0
  let j = 0
  const gapA: number[] = []
  const gapB: number[] = []

  const flush = () => {
    for (const bj of gapB) {
      const line = bLines[bj]
      if (!line.endsWith(';')) continue
      const bare = line.slice(0, -1)
      const k = gapA.findIndex((ai) => a[ai] === bare)
      if (k !== -1) {
        out[bj] = bare
        gapA.splice(k, 1)
      }
    }
    gapA.length = 0
    gapB.length = 0
  }

  while (i < a.length || j < bLines.length) {
    if (i < a.length && j < bLines.length && a[i] === bLines[j]) {
      flush()
      i++
      j++
    } else if (j < bLines.length && (i === a.length || table[i * cols + j + 1] >= table[(i + 1) * cols + j])) {
      gapB.push(j++)
    } else {
      gapA.push(i++)
    }
  }
  flush()

  return out.join('\n')
}
