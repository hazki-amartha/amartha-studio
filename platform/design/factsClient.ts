// =============================================================================
// Design · the panel's side of the facts route (facts.ts).
//
// One request per file version, kept for as long as the page is: the panel
// reads facts synchronously while it renders and re-renders when they arrive.
// A file whose version moved on (someone saved) is asked again.
//
// Nothing here is needed for the panel to work — without facts it offers what
// it offered before and the write side refuses what it can't take. Facts only
// let it stop offering those edits up front.
// =============================================================================

import { designRoute } from './designStore'
import type { FactsResponse, FileFacts, NodeFacts, Src } from './protocol'

const cache = new Map<string, FileFacts | 'failed'>()
const inFlight = new Set<string>()
const listeners = new Set<() => void>()
let changes = 0
const emit = () => {
  changes += 1
  listeners.forEach((l) => l())
}
/** Counts arrivals, for React's useSyncExternalStore. */
export const getFactsVersion = () => changes

export function subscribeFacts(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Resolves when the next facts arrive — or after `ms`, whichever is first. */
export function nextFacts(ms = 1500): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      listeners.delete(done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    listeners.add(done)
  })
}

const fileOf = (src: Src) => src.split(':').slice(0, -2).join(':')
const keyOf = (src: Src) => src.split(':').slice(-2).join(':')

/**
 * What the source says about the element at `src`, if known yet. `version`
 * is the one stamped beside it: facts for any other version of the file are
 * about a different file.
 */
export function factsAt(slug: string, src: Src, version: string | null): NodeFacts | null {
  const file = fileOf(src)
  const cacheKey = `${slug}|${file}|${version ?? ''}`
  const hit = cache.get(cacheKey)
  if (hit === 'failed') return null
  if (hit) return hit.nodes[keyOf(src)] ?? null
  if (!inFlight.has(cacheKey)) {
    inFlight.add(cacheKey)
    void load(slug, file, cacheKey)
  }
  return null
}

async function load(slug: string, file: string, cacheKey: string) {
  try {
    const url = `${designRoute(slug)}?slug=${encodeURIComponent(slug)}&facts=${encodeURIComponent(file)}`
    const res = (await (await fetch(url, { cache: 'no-store' })).json()) as FactsResponse
    cache.set(cacheKey, res.ok && 'nodes' in res ? res : 'failed')
  } catch {
    cache.set(cacheKey, 'failed')
  } finally {
    inFlight.delete(cacheKey)
    emit()
  }
}

/**
 * Where `text` is written as a string in the project — every match. Null when
 * the studio can't look (a shared link with no backend, say).
 */
export async function findText(slug: string, text: string): Promise<{ src: Src; version: string }[] | null> {
  try {
    const url = `${designRoute(slug)}?slug=${encodeURIComponent(slug)}&find=${encodeURIComponent(text)}`
    const res = (await (await fetch(url, { cache: 'no-store' })).json()) as FactsResponse
    return res.ok && 'matches' in res ? res.matches : null
  } catch {
    return null
  }
}
