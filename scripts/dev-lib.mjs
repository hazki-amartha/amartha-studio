// =============================================================================
// Shared plumbing for the studio's dev server scripts.
//
// The one job here is to answer "is there a WORKING server on 4000?" — not the
// much weaker "is the port taken?", which is what dev.mjs used to ask and what
// made the preview link unreliable. A port can be held by a Next server that
// crashed mid-compile, or by one started from a different checkout/worktree, or
// by a leftover from a branch that no longer exists. Every one of those answers
// "yes" to a port probe and "no" to an actual HTTP request, and the designer is
// the one who finds out.
// =============================================================================

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const PORT = 4000
export const BASE_URL = `http://localhost:${PORT}`
export const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** PIDs listening on the port. -sTCP:LISTEN so a browser's open connection to
 *  the page is never mistaken for the server itself. */
export function listenersOn(port = PORT) {
  try {
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return [] // lsof exits non-zero when nothing matches
  }
}

/** The working directory a PID was started in — i.e. which checkout it serves. */
export function cwdOf(pid) {
  try {
    const out = execFileSync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const line = out.split('\n').find((l) => l.startsWith('n'))
    return line ? line.slice(1) : null
  } catch {
    return null
  }
}

/** One HTTP GET with a hard timeout. Returns the status, or null if the socket
 *  never answered (dead process still holding the port, hung compile, …). */
export async function probe(path = '/', timeoutMs = 5000) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE_URL}${path}`, { signal: ac.signal, redirect: 'manual' })
    return res.status
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Is the thing on 4000 a healthy server for THIS checkout?
 * Returns { state, detail } where state is one of:
 *   'free'      nothing is listening
 *   'healthy'   answers HTTP and was started from this folder
 *   'foreign'   answers HTTP but serves a different checkout
 *   'broken'    holds the port but does not answer HTTP
 */
export async function inspect() {
  const pids = listenersOn()
  if (pids.length === 0) return { state: 'free', pids }

  const status = await probe('/', 8000)
  if (status === null || status >= 500) {
    return { state: 'broken', pids, detail: status === null ? 'no response' : `HTTP ${status}` }
  }

  const foreign = pids.filter((pid) => {
    const cwd = cwdOf(pid)
    return cwd && cwd !== root
  })
  if (foreign.length === pids.length && foreign.length > 0) {
    return { state: 'foreign', pids, detail: cwdOf(foreign[0]) }
  }

  return { state: 'healthy', pids }
}

/** Kill everything listening on the port and wait for it to be released. */
export async function stopServers() {
  const pids = listenersOn()
  if (pids.length === 0) return 0
  for (const pid of pids) {
    try {
      process.kill(Number(pid))
    } catch {
      // Already gone between the listing and the kill — nothing to do.
    }
  }
  // SIGTERM first; escalate only for anything still clinging to the port.
  for (let i = 0; i < 30; i++) {
    if (listenersOn().length === 0) return pids.length
    await sleep(200)
  }
  for (const pid of listenersOn()) {
    try {
      process.kill(Number(pid), 'SIGKILL')
    } catch {}
  }
  await sleep(500)
  return pids.length
}

/**
 * Poll a path until it answers, so the link we hand over is one that already
 * works. Next compiles routes on demand: the first hit on a cold server takes
 * tens of seconds, which reads as "the link is broken" to anyone who did not
 * know to wait. Warming it here moves that wait to our side.
 */
export async function waitUntilReady(path = '/', timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const status = await probe(path, 30_000)
    if (status !== null && status < 500) return status
    await sleep(500)
  }
  return null
}
