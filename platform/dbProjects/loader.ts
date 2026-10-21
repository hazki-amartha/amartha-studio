'use client'

// =============================================================================
// DB projects · link a compiled database project into a ProjectModule.
//
// The server (./server.ts) hands over one CommonJS module per file. Here they
// run against a tiny module system: relative imports resolve to the project's
// own files, and the studio's shared vocabulary resolves to the copy this page
// already has loaded — so the design system, runtime and React are the same
// instances a git project gets, and useFlow() finds the same provider.
//
// Anything outside HOST is not reachable from a database project, which is the
// same line CLAUDE.md §2 draws for every project.
// =============================================================================

import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import * as components from '@/design-system/components'
import * as icons from '@/design-system/icons'
import * as assets from '@/design-system/assets'
import * as primitives from '@/platform/primitives'
import * as runtime from '@/platform/runtime'
import * as lazyScreen from '@/platform/lazyScreen'
import type { ProjectModule, ScreenComponent } from '@/platform/types'
import type { DbProjectBuild } from './protocol'

const HOST: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  '@/design-system/components': components,
  '@/design-system/icons': icons,
  '@/design-system/assets': assets,
  '@/platform/primitives': primitives,
  '@/platform/runtime': runtime,
  '@/platform/lazyScreen': lazyScreen,
  // Types only — erased by the compiler, but a value import must not crash.
  '@/platform/types': {},
}

const EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']

function join(from: string, spec: string): string {
  const parts = from.split('/').slice(0, -1)
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.' && seg !== '') parts.push(seg)
  }
  return parts.join('/')
}

interface Instance {
  code: string
  exports: Record<string, unknown>
  /** The project files it required — recorded as it requires them, so a
   *  screen loaded lazily joins its index's list on first visit. */
  deps: Set<string>
}

/** The last successful link of each project, for the next link to keep from. */
const graphs = new Map<string, Map<string, Instance>>()
/** Each project's screen components from its last link, by the file and
 *  export they load — so a relink hands back the same component for a screen
 *  whose file it kept, and the device doesn't remount it. */
const lazies = new Map<string, Map<string, ScreenComponent>>()
/** Each project's live resolver. Modules reach it through this map rather
 *  than a closure, so a module kept from an earlier link — an index whose lazy
 *  screens haven't loaded yet — resolves against the current files. */
const resolvers = new Map<string, (from: string, spec: string) => unknown>()

/**
 * Evaluate the project's index.ts and return its `project` export.
 *
 * A relink keeps every module whose code is unchanged and whose own imports
 * were all kept too, the way Fast Refresh does for a git project: an edit to a
 * screen re-runs that screen and what imports it (its index), but leaves
 * lib/store.ts — and the state the designer tapped the prototype into — alone.
 * Editing the store itself re-runs everything that uses it, from scratch.
 *
 * Screens get the same treatment: index.ts re-runs whenever anything it lists
 * changes — a drag in the sidebar rewrites it outright — and each lazyScreen()
 * would be a new component, so the device would redraw the screen showing even
 * though its file never changed. A kept screen file keeps its component.
 */
export function linkDbProject(build: DbProjectBuild): ProjectModule {
  const { slug } = build
  const previous = graphs.get(slug) ?? new Map<string, Instance>()
  const instances = new Map<string, Instance>()
  const lastLazies = lazies.get(slug) ?? new Map<string, ScreenComponent>()
  const nextLazies = new Map<string, ScreenComponent>()

  const kept = new Map<string, boolean>()
  function keeps(path: string, visiting = new Set<string>()): boolean {
    const known = kept.get(path)
    if (known !== undefined) return known
    const prev = previous.get(path)
    if (!prev || prev.code !== build.modules[path]) {
      kept.set(path, false)
      return false
    }
    // An import cycle back to here: the rest of the cycle decides.
    if (visiting.has(path)) return true
    visiting.add(path)
    const ok = [...prev.deps].every((dep) => keeps(dep, visiting))
    kept.set(path, ok)
    return ok
  }

  function load(path: string): Record<string, unknown> {
    const existing = instances.get(path)
    if (existing) return existing.exports
    const prev = previous.get(path)
    if (prev && keeps(path)) {
      instances.set(path, prev)
      return prev.exports
    }
    const code = build.modules[path]
    const mod: Instance = { code, exports: {}, deps: new Set() }
    instances.set(path, mod)
    // eslint-disable-next-line no-new-func
    const run = new Function('require', 'module', 'exports', `${code}\n//# sourceURL=db://${slug}/${path}`)
    run((spec: string) => resolvers.get(slug)?.(path, spec), mod, mod.exports)
    return mod.exports
  }

  /** The file `spec` names, seen from `from` — or undefined. */
  function resolve(from: string, spec: string): string | undefined {
    const base = join(from, spec)
    return EXTENSIONS.map((ext) => base + ext).find((p) => build.modules[p] !== undefined)
  }

  /** lazyScreen() for one module: the last link's component when the screen
   *  file it loads was kept. The file is read off the loader's own source —
   *  `() => import('./screens/x')`, compiled to a require — and a loader
   *  written any other way just gets a new component, as before. */
  const screenModules = new Map<string, unknown>()
  function lazyScreenFor(from: string): unknown {
    const known = screenModules.get(from)
    if (known) return known
    const wrapped = {
      ...lazyScreen,
      lazyScreen: (load: () => Promise<Record<string, never>>, name: string) => {
        const spec = /require\((['"])(\.[^'"]+)\1\)/.exec(String(load))?.[2]
        const file = spec ? resolve(from, spec) : undefined
        const key = file ? `${file}#${name}` : null
        const reused = key && keeps(file!) ? lastLazies.get(key) : undefined
        const component = reused ?? lazyScreen.lazyScreen(load, name)
        if (key) nextLazies.set(key, component)
        return component
      },
    }
    screenModules.set(from, wrapped)
    return wrapped
  }

  function requireFrom(from: string, spec: string): unknown {
    if (spec === '@/platform/lazyScreen') return lazyScreenFor(from)
    if (spec in HOST) return HOST[spec]
    if (spec.startsWith('.')) {
      const file = resolve(from, spec)
      if (file) {
        instances.get(from)?.deps.add(file)
        return load(file)
      }
      const base = join(from, spec)
      const failed = build.errors.find((e) => EXTENSIONS.some((ext) => e.path === base + ext))
      throw new Error(failed ? `${failed.path}: ${failed.message}` : `${from}: cannot find "${spec}"`)
    }
    throw new Error(`${from}: "${spec}" is not available to database projects.`)
  }

  const index = ['index.ts', 'index.tsx'].find((p) => build.modules[p] !== undefined)
  if (!index) throw new Error('The project has no index.ts.')
  const restore = resolvers.get(slug)
  resolvers.set(slug, requireFrom)
  try {
    const project = load(index).project as ProjectModule | undefined
    if (!project?.config || !Array.isArray(project.screens)) {
      throw new Error('index.ts must export `project` with a config and screens.')
    }
    graphs.set(slug, instances)
    // Merged, not replaced: a kept index made no lazyScreen() calls this time.
    lazies.set(slug, new Map([...lastLazies, ...nextLazies]))
    return project
  } catch (e) {
    // A broken save leaves the running prototype on the last good link.
    if (restore) resolvers.set(slug, restore)
    else resolvers.delete(slug)
    throw e
  }
}
