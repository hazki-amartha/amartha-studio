// =============================================================================
// The flow canvas's selection, shared with the sidebar — the flow view's
// counterpart to the prototype's screen bridge (platform/runtime/bridge.ts).
// While the canvas is mounted, the sidebar's rows select a screen on it
// instead of opening the prototype, and the row of whatever is selected on the
// canvas reads as the current one. A pick from the sidebar also brings that
// screen into view; a click on the canvas doesn't, it's already there.
//
// States too: the selected screen's states list under its row, as in the
// prototype, and picking one applies it. A state is a setup of the project's
// shared store, not a copy of one screen, so the whole canvas shows it — every
// screen in that setup, and the arrows re-measured against it.
// =============================================================================

import type { ScreenState } from '@/platform/types'

export interface FlowFocus {
  slug: string
  /** The screens drawn on the canvas — only these can be selected from the sidebar. */
  ids: ReadonlySet<string>
  selected: string | null
  /** Bumped by every sidebar pick: the canvas brings `selected` into view. */
  reveal: number
  /** Each drawn screen's states, for the sidebar to list. */
  states: ReadonlyMap<string, ScreenState[]>
  /** The state last applied here, and the screen it belongs to. */
  applied: { screen: string; state: string; label: string } | null
}

let state: FlowFocus | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((cb) => cb())

/** The canvas showing `slug`'s screens, or null when it goes away. */
export function publishFlow(slug: string | null, screens: { id: string; states?: ScreenState[] }[] = []) {
  const same = state?.slug === slug
  state = slug
    ? {
        slug,
        ids: new Set(screens.map((s) => s.id)),
        states: new Map(screens.flatMap((s) => (s.states?.length ? [[s.id, s.states] as const] : []))),
        selected: same ? state!.selected : null,
        applied: same ? state!.applied : null,
        reveal: 0,
      }
    : null
  emit()
}

/** Apply one of a screen's states — the sidebar's state rows in the flow view. */
export function applyFlowState(screen: string, next: ScreenState) {
  if (!state) return
  next.apply()
  state = { ...state, applied: { screen, state: next.id, label: next.label } }
  emit()
}

/** Select a screen on the canvas; `reveal` also brings it into view. */
export function selectInFlow(id: string | null, reveal = false) {
  if (!state || (state.selected === id && !reveal)) return
  state = { ...state, selected: id, reveal: reveal ? state.reveal + 1 : state.reveal }
  emit()
}

export function subscribeFlowFocus(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getFlowFocus(): FlowFocus | null {
  return state
}
