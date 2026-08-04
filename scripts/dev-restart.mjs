#!/usr/bin/env node
// =============================================================================
// Stop whatever is serving the studio on port 4000, then start one fresh server.
// The only sanctioned way to restart — it kills the OLD process rather than
// starting a second one beside it, which is the mistake `dev.mjs` documents.
// =============================================================================

import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PORT = 4000
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function listenersOn(port) {
  try {
    // -sTCP:LISTEN so a browser's open connection to the page is never mistaken
    // for the server itself.
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
    })
    return out.split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return [] // lsof exits non-zero when nothing matches
  }
}

const pids = listenersOn(PORT)
if (pids.length === 0) {
  console.log(`Nothing running on ${PORT}.`)
} else {
  console.log(`Stopping ${pids.length} server(s) on ${PORT}: ${pids.join(', ')}`)
  for (const pid of pids) {
    try {
      process.kill(Number(pid))
    } catch {
      // Already gone between the listing and the kill — nothing to do.
    }
  }
  // Give the port a moment to be released before the new server claims it.
  spawnSync(process.execPath, ['-e', 'setTimeout(()=>{}, 1500)'], { stdio: 'ignore' })
}

const r = spawnSync(process.execPath, [join(root, 'scripts', 'dev.mjs'), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
})
process.exit(r.status ?? 0)
