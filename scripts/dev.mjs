#!/usr/bin/env node
// =============================================================================
// The studio's dev server — one process, always on port 4000.
//
// This exists because `next dev` on its own has two behaviours that break the
// preview link for designers, and both of them are silent:
//
//   1. Running it twice on this folder starts a SECOND server that shares the
//      same .next build cache as the first. The two overwrite each other's
//      compiled output, so an open page goes stale or half-broken after an edit
//      and only a kill-and-restart clears it. It looks exactly like "hot reload
//      is unreliable", which is why it kept getting misdiagnosed.
//   2. When the port is taken it silently moves to the next one (3000 → 3001 →
//      3002), so the link the designer bookmarked yesterday points at a server
//      that is gone, or at a different checkout entirely.
//
// So: if a server is already up on 4000, print its link and exit rather than
// starting a rival. Otherwise start one, pinned to 4000. Either way the caller
// ends up with the same URL, which is what makes this safe to run blindly —
// nobody has to remember to check first.
//
// Flags:
//   --fresh   delete .next before starting (the escape hatch for a genuinely
//             corrupt cache; not something to reach for by habit)
// Everything else is forwarded to `next dev`.
// =============================================================================

import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PORT = 4000
const URL = `http://localhost:${PORT}`
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Resolves true when something already holds the port. */
function portTaken(port) {
  return new Promise((resolve) => {
    const probe = createServer()
    probe.once('error', (err) => resolve(err.code === 'EADDRINUSE'))
    probe.once('listening', () => probe.close(() => resolve(false)))
    probe.listen(port, '0.0.0.0')
  })
}

const args = process.argv.slice(2)
const fresh = args.includes('--fresh')
const passthrough = args.filter((a) => a !== '--fresh')

if (await portTaken(PORT)) {
  // Deliberately not an error: the caller wanted a running server, and there is
  // one. Starting another is the failure mode this script exists to prevent.
  console.log(`Dev server already running — ${URL}`)
  console.log('(Nothing started. Edits hot-reload into it; just refresh.)')
  console.log(`To restart it: npm run dev:restart`)
  process.exit(0)
}

if (fresh) {
  console.log('Clearing .next …')
  await rm(join(root, '.next'), { recursive: true, force: true })
}

const child = spawn(
  'npx',
  ['next', 'dev', '--turbo', '-p', String(PORT), ...passthrough],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
)

child.on('exit', (code) => process.exit(code ?? 0))
