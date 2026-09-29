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
import type { ProjectModule } from '@/platform/types'
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

/** Evaluate the project's index.ts and return its `project` export. Each call
 *  is a fresh module graph: a save re-runs every module, stores included. */
export function linkDbProject(build: DbProjectBuild): ProjectModule {
  const instances = new Map<string, { exports: Record<string, unknown> }>()

  function load(path: string): Record<string, unknown> {
    const existing = instances.get(path)
    if (existing) return existing.exports
    const code = build.modules[path]
    const module = { exports: {} as Record<string, unknown> }
    instances.set(path, module)
    // eslint-disable-next-line no-new-func
    const run = new Function('require', 'module', 'exports', `${code}\n//# sourceURL=db://${build.slug}/${path}`)
    run((spec: string) => requireFrom(path, spec), module, module.exports)
    return module.exports
  }

  function requireFrom(from: string, spec: string): unknown {
    if (spec in HOST) return HOST[spec]
    if (spec.startsWith('.')) {
      const base = join(from, spec)
      for (const ext of EXTENSIONS) {
        if (build.modules[base + ext] !== undefined) return load(base + ext)
      }
      const failed = build.errors.find((e) => EXTENSIONS.some((ext) => e.path === base + ext))
      throw new Error(failed ? `${failed.path}: ${failed.message}` : `${from}: cannot find "${spec}"`)
    }
    throw new Error(`${from}: "${spec}" is not available to database projects.`)
  }

  const index = ['index.ts', 'index.tsx'].find((p) => build.modules[p] !== undefined)
  if (!index) throw new Error('The project has no index.ts.')
  const project = load(index).project as ProjectModule | undefined
  if (!project?.config || !Array.isArray(project.screens)) {
    throw new Error('index.ts must export `project` with a config and screens.')
  }
  return project
}
