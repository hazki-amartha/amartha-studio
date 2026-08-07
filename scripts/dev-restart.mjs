#!/usr/bin/env node
// =============================================================================
// Stop whatever is serving the studio on port 4000, then start one fresh server.
// The only sanctioned way to restart — it kills the OLD process rather than
// starting a second one beside it, which is the mistake `dev.mjs` documents.
//
// Day to day this should be rare: `npm run dev` now replaces a dead or foreign
// server on its own. This stays for the case where the server is alive and
// answering but wrong (a bad .next cache, a config change it did not pick up).
// =============================================================================

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { PORT, root, stopServers } from './dev-lib.mjs'

const killed = await stopServers()
console.log(killed === 0 ? `Nothing running on ${PORT}.` : `Stopped ${killed} server(s) on ${PORT}.`)

const r = spawnSync(process.execPath, [join(root, 'scripts', 'dev.mjs'), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
})
process.exit(r.status ?? 0)
