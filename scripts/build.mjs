#!/usr/bin/env node
// =============================================================================
// `next build`, with one local-only difference: it does not build into the
// folder the dev server is running from.
//
// `next build` REPLACES the contents of distDir. The §6 gate asks for a build
// immediately before the preview link is handed over, so building on a machine
// with a dev server up left that server answering HTTP 500 — the link looked
// broken and only a kill-and-restart fixed it. Locally we therefore build into
// `.next-build` and leave `.next` to the dev server.
//
// On Vercel and in CI nothing else is using `.next`, and changing where the
// output lands there would change what gets deployed — so in those
// environments this is exactly `next build`, untouched.
// =============================================================================

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isCloud = Boolean(process.env.VERCEL || process.env.CI)

const env = { ...process.env }
if (!isCloud) env.NEXT_DIST_DIR = '.next-build'

const child = spawn('npx', ['next', 'build', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})

child.on('exit', (code) => process.exit(code ?? 0))
