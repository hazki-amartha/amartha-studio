#!/usr/bin/env node
// Validates flow metadata across every registered project (PLAN.md WS-0 task 8):
//   - registry.ts and configs.ts list exactly the same slugs
//   - registry key matches config.slug
//   - screen ids unique within a project
//   - exactly one screen has entry: true
//   - every flowsTo.to targets an existing screen id (own or inherited)
//   - `extends` names a registered project that does not itself extend
// Bundles the registry with esbuild (CSS stubbed) so it runs in plain Node.

import { build } from 'esbuild'
import { rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const cssStub = {
  name: 'css-stub',
  setup(buildApi) {
    buildApi.onResolve({ filter: /\.css$/ }, (args) => ({
      path: args.path,
      namespace: 'css-stub',
    }))
    buildApi.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({
      contents: '',
      loader: 'js',
    }))
  },
}

// Written inside the repo (gitignored) so Node resolves the externalized
// react imports against ./node_modules.
const outFile = join(root, 'scripts', '.check-flows-bundle.mjs')

try {
  await build({
    absWorkingDir: root,
    stdin: {
      contents: `export { registry } from './projects/registry'
export { configs } from './projects/configs'
export { mergeProject } from './platform/runtime/resolveProject'`,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    outfile: outFile,
    tsconfig: join(root, 'tsconfig.json'),
    external: ['react', 'react-dom', 'react/jsx-runtime', 'next'],
    logLevel: 'silent',
  })

  const { registry, configs, mergeProject } = await import(pathToFileURL(outFile).href)
  const errors = []

  // The two maps are appended by hand and are easy to half-update. A project
  // missing from configs.ts 404s in the gallery; one missing from registry.ts
  // opens to an empty device. Both are confusing enough to be worth catching
  // here rather than in the browser.
  for (const slug of Object.keys(registry)) {
    if (!configs[slug]) {
      errors.push(`${slug}: in projects/registry.ts but not projects/configs.ts — add the line`)
    }
  }
  for (const slug of Object.keys(configs)) {
    if (!registry[slug]) {
      errors.push(`${slug}: in projects/configs.ts but not projects/registry.ts — add the line`)
    }
  }

  // Load every module once up front: a project's flow edges are checked
  // against its base's screens too, so the base has to be in hand.
  const modules = new Map()
  for (const [slug, load] of Object.entries(registry)) {
    try {
      modules.set(slug, await load())
    } catch (err) {
      errors.push(`${slug}: failed to load project module — ${err.message}`)
    }
  }

  for (const [slug, project] of modules) {
    const { config, screens } = project
    if (config.slug !== slug) {
      errors.push(`${slug}: registry key does not match config.slug ("${config.slug}")`)
    }

    const ids = new Set()
    for (const screen of screens) {
      if (ids.has(screen.id)) errors.push(`${slug}: duplicate screen id "${screen.id}"`)
      ids.add(screen.id)
    }

    // Entry is checked on the project's own screens: an extending project
    // decides where it opens, the base's entry never counts for it.
    const entries = screens.filter((s) => s.entry)
    if (entries.length !== 1) {
      errors.push(`${slug}: expected exactly 1 entry screen, found ${entries.length}`)
    }

    let base
    if (config.extends) {
      base = modules.get(config.extends)
      if (!base) {
        errors.push(`${slug}: extends "${config.extends}", which is not in projects/registry.ts`)
      } else if (base.config.extends) {
        errors.push(
          `${slug}: extends "${config.extends}", which itself extends "${base.config.extends}" — one level only`,
        )
        base = undefined
      } else if (config.extends === slug) {
        errors.push(`${slug}: extends itself`)
        base = undefined
      }
    }

    const resolved = mergeProject(project, base)
    const reachable = new Set(resolved.screens.map((s) => s.id))
    for (const screen of screens) {
      for (const edge of screen.flowsTo ?? []) {
        if (!reachable.has(edge.to)) {
          errors.push(`${slug}: screen "${screen.id}" flows to unknown screen "${edge.to}"`)
        }
      }
    }

    // Overriding a base screen is the point of extends, but it is easy to do by
    // accident with a generic id — so say which ones, every run.
    if (base) {
      const list = resolved.overrides.length ? resolved.overrides.join(', ') : 'none'
      console.log(`  ${slug} extends ${config.extends} — overrides: ${list}`)
    }
  }

  if (errors.length > 0) {
    console.error(`check:flows — ${errors.length} problem(s):`)
    for (const e of errors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }
  console.log(`check:flows — OK (${Object.keys(registry).length} project(s) validated)`)
} finally {
  await rm(outFile, { force: true })
}
