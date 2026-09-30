// =============================================================================
// New project · creates a project in the database (platform/dbProjects): its
// files are rows, it is served at /p/<slug> the moment it exists, and every
// save after that is live — no folder, no registry lines, no push. So it works
// on the deployed link as well as on the laptop.
//
//   blank            one empty screen, `home`, as the entry
//   amarthafin-live  extends the live reference, with its home copied in as
//                    the project's own `home` (overriding the base's) — the
//                    homepage the designer is about to change, starting
//                    exactly as it ships. Anything else the live app gains
//                    later is inherited.
//
// The registry-line helpers below stay for platform/push/server/local.ts,
// which still pushes git projects.
// =============================================================================

import { existsSync } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { saveDbFiles } from '@/platform/dbProjects/server'
import type { BusinessUnit, Platform } from '@/platform/types'
import type { ProjectStart } from '../protocol'

const ROOT = process.cwd()
const PROJECTS = path.join(ROOT, 'projects')
const MARKER = '  // <append new projects above this line — one line per project>'
const BASE = 'amarthafin-live'

export class CreateRefused extends Error {}

export function slugFor(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '')
}

/** The name's slug, or the first free `-2`, `-3`… after it. */
function freeSlug(name: string, taken: Set<string>): string {
  const base = slugFor(name)
  if (!base) throw new CreateRefused('Give the project a name with some letters or numbers in it.')
  let slug = base
  for (let n = 2; taken.has(slug) || existsSync(path.join(PROJECTS, slug)); n++) slug = `${base}-${n}`
  return slug
}

/** A single-quoted TS string literal, as the rest of the configs are written. */
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

function configSource(c: {
  slug: string
  name: string
  owner: string
  businessUnit: BusinessUnit
  platform: Platform
  extendsBase: boolean
}): string {
  const today = new Date().toISOString().slice(0, 10)
  return `import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: ${q(c.slug)},
  name: ${q(c.name)},
  businessUnit: ${q(c.businessUnit)},
  platform: ${q(c.platform)},
  owner: ${q(c.owner)},
  description: 'A new prototype — ask Chat to describe what it explores.',
  device: 'mobile',
  status: 'draft',
  createdAt: ${q(today)},${c.extendsBase ? `\n  extends: ${q(BASE)},` : ''}
}
`
}

const BLANK_INDEX = `import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Home',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
      entry: true,
    },
  ],
}
`

const blankScreen = (title: string) => `'use client'

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'

export function HomeScreen() {
  return <Screen topBar={<NavigationHeader title=${JSON.stringify(title)} hideBack />}>{null}</Screen>
}
`

/** The one line each map gains — the same shape CLAUDE.md §3 shows. */
export const registryLine = (slug: string) => `  '${slug}': () => import('./${slug}').then((m) => m.project),`
export const configsLine = (slug: string) =>
  `  '${slug}': () => import('./${slug}/project.config').then((m) => m.config),`

/** `text` with `line` added above the marker — or unchanged if it's there. */
export function appendLine(text: string, slug: string, line: string): string {
  if (text.includes(`'${slug}':`)) return text
  if (!text.includes(MARKER)) throw new CreateRefused('The project list has lost its marker line, so nothing was added.')
  return text.replace(MARKER, `${line}\n${MARKER}`)
}

/** A git project's files, path → content — the base a live-started project
 *  copies. Deployed, these are traced into the function (next.config.mjs). */
async function filesOf(slug: string): Promise<{ path: string; content: string }[]> {
  const root = path.join(PROJECTS, slug)
  const out: { path: string; content: string }[] = []
  async function walk(dir: string) {
    for (const name of await readdir(dir)) {
      const full = path.join(dir, name)
      if ((await stat(full)).isDirectory()) await walk(full)
      else if (/\.(tsx?|json)$/.test(name)) {
        out.push({ path: path.relative(root, full).split(path.sep).join('/'), content: await readFile(full, 'utf8') })
      }
    }
  }
  await walk(root)
  return out
}

export async function createProject(input: {
  name: string
  owner: string
  businessUnit: BusinessUnit
  platform: Platform
  start: ProjectStart
  taken: Set<string>
}): Promise<string> {
  const slug = freeSlug(input.name, input.taken)
  const live = input.start === BASE

  const files = live
    ? // The base's own files, minus what says whose project it is.
      (await filesOf(BASE)).filter((f) => f.path !== 'project.config.ts')
    : [
        { path: 'index.ts', content: BLANK_INDEX },
        { path: 'screens/home.tsx', content: blankScreen(input.name) },
      ]
  files.push({ path: 'project.config.ts', content: configSource({ ...input, slug, extendsBase: live }) })
  await saveDbFiles(slug, files, input.owner)
  return slug
}
