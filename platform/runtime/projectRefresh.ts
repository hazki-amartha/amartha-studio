'use client'

// =============================================================================
// Re-read the open project's screen list without reloading the page.
//
// The prototype view resolves a project's screens once, when it mounts. Hot
// reload patches every module that changes — a new screen in index.ts included
// — but the view's copy of the list is state, and state survives hot reload by
// design. So an edit that adds, removes or renames a screen reached the module
// and never the device: the new screen stayed invisible until a full reload,
// and a full reload also threw the chat conversation away.
//
// Anything that knows it just edited a project (the chat, when a turn writes a
// file) calls refreshProject(); useScreens re-resolves on every bump.
// =============================================================================

import { useSyncExternalStore } from 'react'

let version = 0
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function refreshProject() {
  version++
  listeners.forEach((l) => l())
}

/** Hot reload lands a beat after the file is written — the dev server has to
 *  compile it first. Asking straight away would re-read the old module, so a
 *  write asks now and again once the update has had time to arrive; a burst of
 *  writes collapses into one late ask. */
const SETTLE_MS = 1500
let timer: ReturnType<typeof setTimeout> | null = null

export function refreshProjectSoon() {
  refreshProject()
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    refreshProject()
  }, SETTLE_MS)
}

export function useProjectVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => 0)
}
