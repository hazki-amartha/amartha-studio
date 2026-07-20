// =============================================================================
// Screen bridge — a module-level store that lets shell chrome (the page
// explorer in the sidebar) observe and steer the running prototype, which
// lives in a separate React tree under the route. Published by PrototypeView
// while a prototype is mounted; null everywhere else (gallery, flow view).
// Internal runtime plumbing — NOT part of the frozen FlowApi contract, and
// never imported by prototype screens.
// =============================================================================

export interface ScreenBridgeState {
  slug: string
  /** Active screen id in the running prototype. */
  current: string
}

let state: ScreenBridgeState | null = null
let jumpFn: ((id: string) => void) | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function publishScreenBridge(
  slug: string,
  current: string,
  jump: (id: string) => void,
) {
  jumpFn = jump
  // Keep the snapshot referentially stable unless something visible changed —
  // useSyncExternalStore re-renders on identity.
  if (state?.slug !== slug || state?.current !== current) {
    state = { slug, current }
    emit()
  }
}

export function clearScreenBridge() {
  jumpFn = null
  if (state !== null) {
    state = null
    emit()
  }
}

export function subscribeScreenBridge(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getScreenBridge(): ScreenBridgeState | null {
  return state
}

/** Show a screen in the running prototype. No-op when none is mounted. */
export function screenBridgeJump(id: string) {
  jumpFn?.(id)
}
