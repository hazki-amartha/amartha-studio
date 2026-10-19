// =============================================================================
// Chat · the studio note at the top of every message — the laptop's Chat and
// the deployed one alike.
//
// What differs from turn to turn travels here, with the message: the project,
// its folder, the screen in the device and any error it is showing. It used to
// be in the system prompt, and a system prompt that names the project is a new
// prompt for every project — no session could reuse another's cached copy, so
// each one paid to write it again. The appended prompt is now the same for
// every session, and this note is a few lines.
//
// The screen line also saves the search a turn opened with. The panel only said
// which screen was open when an element was pinned, so "make the header
// shorter" started with Glob and ls to find out which file the header was in.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { draftChatLines } from '@/platform/dbProjects/draftMeta'

// Screen ids and slugs are kebab-case. (common.ts has the same pattern, but
// importing it loads every project's config.)
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** What the panel sends with a message. */
export interface TurnView {
  screen?: unknown
  screenError?: unknown
}

export interface ScreenFile {
  /** Relative to the agent's working directory. */
  path: string
  /** The base project the screen comes from, when this one doesn't override it. */
  from?: string
}

const MAX_ERROR = 400

/**
 * `root` is the agent's working directory: the checkout on a laptop, the
 * turn's workspace on the deployment. `first` is a conversation's first turn —
 * the branch's whole explanation goes once, and later notes only say it is one.
 */
export function turnNote(n: {
  root: string
  slug: string
  folder: string
  db: boolean
  draftOf: string | null
  first: boolean
  view: TurnView
}): string {
  const lines = [
    `Project: \`${n.slug}\`, ${n.db ? 'a database project' : 'a git project'}. Its files are in \`${n.folder}/\`, the only folder you can change.`,
  ]
  if (n.draftOf) {
    lines.push(...(n.first ? draftChatLines(n.draftOf) : [`It is a branch of “${n.draftOf}”: saves reach the branch only.`]))
  }
  const screen = typeof n.view.screen === 'string' && KEBAB.test(n.view.screen) ? n.view.screen : null
  if (screen) {
    const file = locateScreen(n.root, n.folder, screen)
    lines.push(
      file?.from
        ? `Viewing: screen \`${screen}\`, inherited from \`${file.from}\` (\`${file.path}\`, read-only). To change it, add a screen with the same id to this project.`
        : file
          ? `Viewing: screen \`${screen}\`, in \`${file.path}\`.`
          : `Viewing: screen \`${screen}\`.`,
    )
    const error = typeof n.view.screenError === 'string' ? n.view.screenError.trim() : ''
    if (error) {
      lines.push(`The device shows an error in place of this screen: ${JSON.stringify(error.slice(0, MAX_ERROR))}`)
    }
  }
  return `<studio-note>\n${lines.join('\n')}\n</studio-note>`
}

/** The file a screen is in: this project's own, or its base's when the screen is inherited. */
export function locateScreen(root: string, folder: string, screen: string): ScreenFile | null {
  const own = screenFileIn(root, folder, screen)
  if (own) return { path: own }
  const config = read(path.join(root, folder, 'project.config.ts'))
  const base = config && /extends:\s*['"]([a-z0-9-]+)['"]/.exec(config)?.[1]
  if (!base || !KEBAB.test(base)) return null
  // A base in the database has its copy beside this one; a git base is in projects/.
  const baseFolder = existsSync(path.join(root, 'projects', '_db', base)) ? `projects/_db/${base}` : `projects/${base}`
  const inherited = screenFileIn(root, baseFolder, screen)
  return inherited ? { path: inherited, from: base } : null
}

function screenFileIn(root: string, folder: string, screen: string): string | null {
  const index = read(path.join(root, folder, 'index.ts'))
  const spec = index && screenImport(index, screen)
  if (!spec) return null
  const rel = path.posix.normalize(spec)
  if (rel.startsWith('..') || path.posix.isAbsolute(rel)) return null
  for (const ext of ['.tsx', '.ts', '', '/index.tsx', '/index.ts']) {
    if (existsSync(path.join(root, folder, rel + ext))) return `${folder}/${rel}${ext}`
  }
  return null
}

/** The path a screen's lazyScreen() imports in index.ts — `./screens/home` —
 *  read from the object literal around its `id`, whichever order it is written in. */
export function screenImport(index: string, screen: string): string | null {
  const at = new RegExp(`\\bid:\\s*(['"\`])${screen}\\1`).exec(index)
  if (!at) return null
  const entry = enclosingObject(index, at.index)
  return /import\(\s*(['"`])(\.\/[^'"`]+)\1\s*\)/.exec(entry)?.[2] ?? null
}

/** The `{ … }` around `at`, by brace depth — enough for an index.ts entry. */
function enclosingObject(src: string, at: number): string {
  let start = 0
  for (let i = at, depth = 0; i >= 0; i--) {
    if (src[i] === '}') depth++
    else if (src[i] === '{' && depth-- === 0) {
      start = i
      break
    }
  }
  for (let i = start, depth = 0; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1)
  }
  return src.slice(start)
}

function read(file: string): string | null {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return null
  }
}
