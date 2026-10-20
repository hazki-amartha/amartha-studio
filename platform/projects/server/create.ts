// =============================================================================
// New project · creates a project in the database (platform/dbProjects): its
// files are rows, it is served at /p/<slug> the moment it exists, and every
// save after that is live — no folder, no registry lines, no push. So it works
// on the deployed link as well as on the laptop.
//
//   blank       one empty screen, `home`, as the entry, in its platform's
//               frame — a phone, or the desktop shell for NG-MIS
//   a live app  extends that live reference (LIVE_STARTS in ../protocol.ts),
//               with its start screen copied in as the project's own
//               (./startingFiles.ts) — the screen the designer is about to
//               change, starting exactly as it ships, demo states and all.
//               Every other screen is inherited, so the prototype still
//               behaves like the whole app, and anything the live app gains
//               later arrives on its own.
//
// Copying here costs nothing. Left to Chat, the agent would have written every
// line of the copy out again — for A-Partner's Beranda, 325KB of it.
//
// The registry-line helpers below stay for platform/push/server/local.ts,
// which still pushes git projects.
// =============================================================================

import { existsSync } from 'node:fs'
import path from 'node:path'
import { everSaved } from '@/platform/dbProjects/history'
import { saveDbFiles } from '@/platform/dbProjects/server'
import type { BusinessUnit, DeviceKind, Platform } from '@/platform/types'
import { deviceFor, type LiveStart } from '../protocol'
import { CreateRefused } from './refused'
import { startingFiles } from './startingFiles'

const ROOT = process.cwd()
const PROJECTS = path.join(ROOT, 'projects')
const MARKER = '  // <append new projects above this line — one line per project>'

export { CreateRefused }

export function slugFor(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '')
}

/** The name's slug, or the first free `-2`, `-3`… after it — never one a
 *  project ever had (dbProjects/history.ts everSaved). */
async function freeSlug(name: string, taken: Set<string>): Promise<string> {
  const base = slugFor(name)
  if (!base) throw new CreateRefused('Give the project a name with some letters or numbers in it.')
  let slug = base
  for (let n = 2; taken.has(slug) || existsSync(path.join(PROJECTS, slug)) || (await everSaved(slug)); n++) slug = `${base}-${n}`
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
  device: DeviceKind
  base: string | null
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
  device: ${q(c.device)},
  status: 'draft',
  createdAt: ${q(today)},${c.base ? `\n  extends: ${q(c.base)},` : ''}
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

const blankScreen = (title: string, device: DeviceKind) =>
  device === 'desktop'
    ? `'use client'

import { AppShell, SideNav } from '@/design-system/components'
import { Layout } from '@/design-system/icons'

export function HomeScreen() {
  return (
    <AppShell
      user="A"
      breadcrumbs={[{ label: ${JSON.stringify(title)}, current: true }]}
      sidebar={(collapsed) => (
        <SideNav
          items={[{ id: 'home', label: 'Home', icon: <Layout size={20} /> }]}
          activeId="home"
          collapsed={collapsed}
          onSelect={() => {}}
        />
      )}
    >
      {null}
    </AppShell>
  )
}
`
    : `'use client'

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

export async function createProject(input: {
  name: string
  owner: string
  businessUnit: BusinessUnit
  platform: Platform
  start: LiveStart | null
  taken: Set<string>
}): Promise<string> {
  const slug = await freeSlug(input.name, input.taken)
  const device = input.start?.device ?? deviceFor(input.platform)
  const files = input.start
    ? await startingFiles(input.start.id)
    : [
        { path: 'index.ts', content: BLANK_INDEX },
        { path: 'screens/home.tsx', content: blankScreen(input.name, device) },
      ]
  files.push({
    path: 'project.config.ts',
    content: configSource({ ...input, slug, device, base: input.start?.id ?? null }),
  })
  await saveDbFiles(slug, files, input.owner)
  return slug
}
