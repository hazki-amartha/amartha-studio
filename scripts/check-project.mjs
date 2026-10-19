#!/usr/bin/env node
// =============================================================================
// check:project — would the Chat agent's edits to a database project pass the
// checks a save must pass (platform/dbProjects/checks.ts)? Asks the dev server,
// which holds the checks, about the local copy in projects/_db/<slug>/.
//
// It also type-checks that copy, here, which nothing else does: tsconfig.json
// leaves projects/_db out of the build, and a save compiles with sucrase, which
// strips types without reading them. So `<Button variant="link">` saved, and
// rendered an unstyled button. Too slow for every save; once per turn is fine.
//
//   npm run check:project -- <slug>   from a terminal
//   npm run check:project             in a Chat turn (the route sets CHAT_SLUG)
//
// exit 0 = the local changes will save, and the project type-checks
// =============================================================================

import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAX_REPORTED = 8

const slug = process.argv[2] ?? process.env.CHAT_SLUG
if (!slug) {
  console.error('Usage: npm run check:project -- <slug>')
  process.exit(1)
}

let body = null
try {
  const res = await fetch(`http://127.0.0.1:4000/api/db-projects/${encodeURIComponent(slug)}/check`)
  body = await res.json()
} catch {
  // Reported below — the type check doesn't need the server.
}

if (body && !body.db) {
  console.log(`${slug} lives in git — use npm run lint and npm run check:flows instead.`)
  process.exit(0)
}

let failed = false
const types = typeProblems(slug)
if (types.length) {
  failed = true
  console.error(`check:project — ${types.length} type error(s); a wrong prop or name renders wrong or crashes the screen:`)
  for (const p of types.slice(0, MAX_REPORTED)) console.error(`  ✗ ${p}`)
  if (types.length > MAX_REPORTED) console.error(`  … and ${types.length - MAX_REPORTED} more`)
}

if (!body) {
  console.error('check:project could not reach the dev server on port 4000.')
  process.exit(1)
}
if (body.problems.length) {
  failed = true
  console.error(`check:project — ${body.problems.length} problem(s); the studio will not save these changes:`)
  for (const p of body.problems) console.error(`  ✗ ${p}`)
}
if (failed) process.exit(1)
console.log(`check:project — OK${body.changed.length ? ` (${body.changed.length} changed file(s) will save)` : ''}`)

/** Type errors in the project's own files, under the repo's compiler options —
 *  what `next build` would say if the project were in git. */
function typeProblems(slug) {
  const folder = path.join(root, 'projects', '_db', slug)
  if (!existsSync(folder)) return []
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile).config
  // Only the options: the project's files are the roots, not the repo's includes.
  const { options } = ts.parseJsonConfigFileContent({ ...config, include: [], files: [] }, ts.sys, root)

  const own = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.tsx?$/.test(name)) own.push(p)
    }
  }
  walk(folder)
  const ambient = [path.join(root, 'next-env.d.ts')].filter(existsSync)

  const program = ts.createProgram([...ambient, ...own], { ...options, noEmit: true, incremental: false })
  const inside = folder.split(path.sep).join('/') + '/'
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName.startsWith(inside))
    .map((d) => {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start ?? 0)
      const message = ts.flattenDiagnosticMessageText(d.messageText, ' ')
      return `${d.file.fileName.slice(inside.length)}:${line + 1}:${character + 1} ${message}`
    })
}
