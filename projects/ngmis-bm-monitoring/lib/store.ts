'use client'

// The two values that outlive a render tree.
//
// `variant` is which cut of the Pembayaran page is on screen, so the two can be
// reached from the STATES panel rather than a toggle drawn inside the prototype.
//
// `scheduled` is which BPs already have a task booked. It lives here rather
// than in the grid's own state because switching tab or state unmounts that
// grid — and a task the BM just created disappearing because she looked at the
// MVP is the kind of thing that derails a walkthrough.

import { useSyncExternalStore } from 'react'

export type Variant = 'mvp' | 'end'

/** Which cut of Pencairan is on screen — plain counts, or the same table with
 *  Mitra baru's lead funnel opened up ("With Leads monitoring"). */
export type PencairanVariant = 'default' | 'leads'

interface State {
  variant: Variant
  pencairanVariant: PencairanVariant
  /** BP id → the date its task is booked for. */
  scheduled: Record<string, string>
}

let state: State = { variant: 'mvp', pencairanVariant: 'leads', scheduled: {} }
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  listeners.forEach((l) => l())
}

export const store = {
  setVariant(variant: Variant) {
    if (variant === state.variant) return
    set({ ...state, variant })
  },
  setPencairanVariant(pencairanVariant: PencairanVariant) {
    if (pencairanVariant === state.pencairanVariant) return
    set({ ...state, pencairanVariant })
  },
  scheduleTask(bpId: string, date: string) {
    if (state.scheduled[bpId] === date) return
    set({ ...state, scheduled: { ...state.scheduled, [bpId]: date } })
  },
  /** Back to nothing booked — so a walkthrough can be run twice. */
  clearTasks() {
    if (Object.keys(state.scheduled).length === 0) return
    set({ ...state, scheduled: {} })
  },
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useApp(): State {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
