// =============================================================================
// Screen bridge — a module-level store that lets shell chrome (the page
// explorer in the sidebar) observe and steer the running prototype, which
// lives in a separate React tree under the route. Published by PrototypeView
// while a prototype is mounted; null everywhere else (gallery, flow view).
// Internal runtime plumbing — NOT part of the frozen FlowApi contract, and
// never imported by prototype screens.
//
// It also remembers the state last applied from the chrome, because an edit
// can throw that state away. A save usually keeps the project's store (the
// database linker and Fast Refresh both keep unchanged modules), but an edit
// to the store, or to a file everything imports, starts it over and the screen
// falls back to its defaults. After a relink the same state is applied again
// from the NEW screen list — `apply` writes the store of the module graph it
// came from, so the old closures would write to a store no screen reads.
// =============================================================================

import type { ScreenDef, ScreenState } from '@/platform/types'

export interface ScreenBridgeState {
  slug: string
  /** Active screen id in the running prototype. */
  current: string
  /** Its title — what Share calls "this page". */
  title: string
  /** States declared by the active screen, so chrome outside the prototype
   *  tree (the mobile triple-tap dialog) can offer them too. */
  states: ScreenState[]
  /** Id of the state last applied to this screen from the chrome, if any. */
  applied: string | null
}

const NO_STATES: ScreenState[] = []

let state: ScreenBridgeState | null = null
let jumpFn: ((id: string) => void) | null = null
/** The last state applied, and on which screen. It outlives a move to another
 *  screen, since the store it seeded does too; only its highlight doesn't. */
let lastApplied: { screen: string; state: string; label: string; apply: () => void } | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function publishScreenBridge(
  slug: string,
  current: string,
  title: string,
  jump: (id: string) => void,
  states: ScreenState[] = NO_STATES,
) {
  jumpFn = jump
  if (state && state.slug !== slug) lastApplied = null
  update(slug, current, title, states)
}

/** Keep the snapshot referentially stable unless something visible changed —
 *  useSyncExternalStore re-renders on identity. `states` change with the
 *  screen, and also on every relink, which brings new `apply` closures. */
function update(slug: string, current: string, title: string, states: ScreenState[]) {
  const applied = lastApplied?.screen === current ? lastApplied.state : null
  if (
    state?.slug !== slug ||
    state.current !== current ||
    state.title !== title ||
    state.states !== states ||
    state.applied !== applied
  ) {
    state = { slug, current, title, states, applied }
    emit()
  }
}

/** Put the active screen in one of its states — the sidebar's and the mobile
 *  dialog's state buttons. */
export function applyScreenState(next: ScreenState) {
  if (!state) return
  next.apply()
  lastApplied = { screen: state.current, state: next.id, label: next.label, apply: next.apply }
  update(state.slug, state.current, state.title, state.states)
}

/** After the project relinked, apply the last applied state again, from the
 *  new screens — but only when its `apply` is a new function. The same one
 *  means its module was kept, store and all, and applying it again would undo
 *  whatever the designer tapped since. A state that no longer exists is
 *  forgotten. `apply` is idempotent by contract (platform/types.ts). */
export function reapplyScreenState(screens: ScreenDef[]) {
  if (!lastApplied) return
  const { screen, state: id, apply } = lastApplied
  const found = screens.find((s) => s.id === screen)?.states?.find((st) => st.id === id)
  if (!found) {
    lastApplied = null
  } else if (found.apply !== apply) {
    found.apply()
    lastApplied = { screen, state: id, label: found.label, apply: found.apply }
  }
}

export function clearScreenBridge() {
  jumpFn = null
  lastApplied = null
  if (state !== null) {
    state = null
    emit()
  }
}

/** The state the running prototype is in — what a comment posted now records. */
export function appliedScreenState(): { screen: string; id: string; label: string } | null {
  return state && lastApplied ? { screen: lastApplied.screen, id: lastApplied.state, label: lastApplied.label } : null
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
