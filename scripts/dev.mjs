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
// The reuse test is HEALTH, not port occupancy. An earlier version of this
// script reused whatever held the port, which meant a crashed server, a hung
// compile, or a server left running from a different checkout all counted as
// "already running" — the script printed a link to something that could not
// serve a page, and the designer had to kill and restart it by hand before the
// link worked. That is the failure this file now takes responsibility for: if
// what is on 4000 cannot answer an HTTP request, or is serving another folder,
// it gets replaced instead of advertised.
//
// It also does not hand back a link until that link answers. Next compiles
// routes on demand, so the first hit on a cold server takes tens of seconds —
// indistinguishable from a broken link to anyone who did not know to wait.
//
// Flags:
//   --fresh        delete .next before starting (the escape hatch for a
//                  genuinely corrupt cache; not something to reach for by habit)
//   --warm <path>  also wait until that path answers, so a project page handed
//                  to a designer is already compiled (e.g. --warm /p/my-slug)
// Everything else is forwarded to `next dev`.
// =============================================================================

import { spawn } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { BASE_URL, PORT, root, inspect, stopServers, waitUntilReady } from './dev-lib.mjs'

const args = process.argv.slice(2)
const fresh = args.includes('--fresh')

// --warm <path> or --warm=<path>
let warm = null
const passthrough = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--fresh') continue
  if (a === '--warm') { warm = args[++i] ?? null; continue }
  if (a.startsWith('--warm=')) { warm = a.slice('--warm='.length); continue }
  passthrough.push(a)
}

const paths = ['/', ...(warm && warm !== '/' ? [warm] : [])]

function link() {
  console.log(`\nPreview: ${BASE_URL}${warm && warm !== '/' ? warm : ''}`)
}

async function warmUp() {
  for (const p of paths) {
    const status = await waitUntilReady(p)
    if (status === null) {
      console.error(`\nServer never answered ${p}. Try: npm run dev:restart -- --fresh`)
      process.exit(1)
    }
  }
}

const found = await inspect()

if (found.state === 'healthy' && !fresh) {
  console.log(`Dev server already running — ${BASE_URL}`)
  console.log('(Nothing started. Edits hot-reload into it; just refresh.)')
  await warmUp()
  link()
  process.exit(0)
}

if (found.state === 'broken') {
  console.log(`Port ${PORT} is held by an unresponsive server (${found.detail}). Replacing it.`)
  await stopServers()
} else if (found.state === 'foreign') {
  console.log(`Port ${PORT} is serving a different checkout (${found.detail}). Replacing it.`)
  await stopServers()
} else if (found.state === 'healthy' && fresh) {
  console.log('Stopping the running server for a --fresh start.')
  await stopServers()
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

let exited = false
child.on('exit', (code) => {
  exited = true
  process.exit(code ?? 0)
})

// Hold the link back until the server actually serves it.
await warmUp()
if (!exited) link()
