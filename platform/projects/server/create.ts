// =============================================================================
// New project · writes a project into this checkout, exactly as CLAUDE.md §3
// describes doing it by hand: a folder under projects/<slug>/, and one line
// in each of registry.ts and configs.ts, above their markers.
//
//   blank            one empty screen, `home`, as the entry
//   amarthafin-live  extends the live reference, with its home copied in as
//                    the project's own `home` (overriding the base's) — the
//                    homepage the designer is about to change, starting
//                    exactly as it ships. Anything else the live app gains
//                    later is inherited.
//
// Nothing is committed: the new files are the designer's working copy, like
// any chat edit, and Push sends them (registry lines included, see
// platform/push/server/local.ts).
// =============================================================================

import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
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

async function appendTo(file: string, slug: string, line: string) {
  const full = path.join(PROJECTS, file)
  await writeFile(full, appendLine(await readFile(full, 'utf8'), slug, line))
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
  const dir = path.join(PROJECTS, slug)
  const live = input.start === BASE

  try {
    if (live) {
      // The base's own files, minus what says whose project it is.
      await cp(path.join(PROJECTS, BASE), dir, {
        recursive: true,
        filter: (src) => !/[/\\](project\.config\.ts|NOTES\.md)$/.test(src),
      })
    } else {
      await mkdir(path.join(dir, 'screens'), { recursive: true })
      await writeFile(path.join(dir, 'index.ts'), BLANK_INDEX)
      await writeFile(path.join(dir, 'screens', 'home.tsx'), blankScreen(input.name))
    }
    await writeFile(
      path.join(dir, 'project.config.ts'),
      configSource({ ...input, slug, extendsBase: live }),
    )
    await appendTo('registry.ts', slug, registryLine(slug))
    await appendTo('configs.ts', slug, configsLine(slug))
  } catch (err) {
    await rm(dir, { recursive: true, force: true })
    throw err
  }
  return slug
}
