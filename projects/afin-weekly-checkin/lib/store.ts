'use client'

// The week the mitra is in, and everything already behind her. It lives here
// rather than in a screen because home, the status page, the majelis and the
// 12-week verdict all read the same journey — and because the state controls
// seed it from outside any screen.

import { useSyncExternalStore } from 'react'
import { outcomeOf, range, windowOf, type PayChannel, type WindowOutcome } from './data'

export interface AppState {
  /** The week now in progress, 1–48. */
  week: number
  /** Every week banked as good — instalment paid AND majelis attended. */
  done: number[]
  /** Has this week's instalment posted? */
  paid: boolean
  /**
   * How her money reaches Amartha. A cash-income mitra pays the Ketua Majelis,
   * who cashes in ONCE for the whole group and settles it as one payment —
   * because the cash-in fee is a third-party charge of ~Rp5–6rb on a Rp112rb
   * instalment, so fifteen separate top-ups is a 5–6% tax on the majelis for
   * doing individually what it can do once.
   *
   * The channel changes NOTHING about her record. It only changes who carries
   * the cash, and how long the week waits before it posts.
   */
  channel: PayChannel
  /**
   * Cash handed to the Ketua Majelis this week, not yet settled to Amartha.
   * The week is not paid yet and it is not late either — it is in transit, and
   * that is a third thing the check-in has to be able to say.
   */
  titip: boolean
  /**
   * Weeks that reached Amartha through the Ketua Majelis's pooled payment.
   * They are ordinary paid weeks — this list only remembers the route, so the
   * receipt can name it.
   */
  viaKetua: number[]
  /** Has this week's attendance posted? */
  attended: boolean
  /** Weeks the majelis did NOT finish complete. Five of these are affordable. */
  groupBroken: number[]
  /** Members still short this week. A count, never names. */
  groupShort: number
  /**
   * The standing she holds right now. It is earned by the first clean window
   * and lost when one closes with a week unpaid — so it is a value that moves
   * during a tenor, not a starting condition.
   */
  tier: 'mitra' | 'juara'
  /**
   * Weeks paid after their own week had passed, but before the window closed.
   * The standing survives these; the amount does not.
   */
  late: number[]
  /**
   * Weeks with no instalment yet. While the window is open these are
   * recoverable — that is the whole at-risk state. One still sitting here when
   * the window closes drops the standing.
   */
  unpaid: number[]
  /** Kumpulan missed. Two per window are affordable; the third drops it. */
  absent: number[]
  /** How each CLOSED window ended. Index 0 is window 1. */
  windowLog: WindowOutcome[]
  /** Windows already taken out. */
  disbursedWindows: number
  /**
   * Has she taken the financing itself yet? False only for a mitra who is
   * approved and has never withdrawn — the state before week 1, where the whole
   * page is one button and no instalment is due yet. Every other journey starts
   * true, because a tenor in progress means the money already moved.
   */
  principalTaken: boolean
}

// Week 15 — the third week of window 2, with window 1 closed clean behind her.
// The default is a mitra who ALREADY HOLDS a clean standing, because that is
// the state the concept lives or dies in: the grade is held across the tenor,
// so "keeping it" is the normal reading and "chasing it" is the exception.
const initial: AppState = {
  week: 15,
  done: range(1, 14),
  paid: false,
  channel: 'sendiri',
  titip: false,
  viaKetua: [],
  attended: false,
  groupBroken: [],
  groupShort: 0,
  tier: 'juara',
  late: [],
  unpaid: [],
  absent: [],
  windowLog: ['full'],
  // Window 1 closed clean at week 12 and she has not taken it out yet — which
  // is the ordinary case, not an edge one: nobody disburses on the day.
  disbursedWindows: 0,
  principalTaken: true,
}

let state: AppState = initial

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  set(patch: Partial<AppState>) {
    state = { ...state, ...patch }
    emit()
  },
  /** Used by the demo seeds — replaces the journey wholesale. */
  seed(next: AppState) {
    state = next
    emit()
  },
  /** The instalment posts. Nothing stamps until the majelis lands too. */
  pay() {
    store.set({ paid: true })
  },
  /**
   * The Ketua Majelis settles the group's pooled cash, and the week posts
   * against HER — her name, her receipt, her twelve-week stretch. This is the
   * whole point of the channel: the cash rail aggregates at the group, the
   * record never does.
   */
  settleViaKetua() {
    store.set({
      paid: true,
      titip: false,
      viaKetua: [...state.viaKetua, state.week],
    })
  },
  /** Attendance posts. */
  attend() {
    store.set({ attended: true })
  },
  /** Both halves are in, so the week stamps itself — there is no claim tap. */
  stampWeek() {
    state = {
      ...state,
      done: [...state.done, state.week],
      week: state.week + 1,
      paid: false,
      attended: false,
    }
    emit()
  },
  /**
   * The late-payment path, and the only way out of at-risk. Clearing the oldest
   * outstanding week moves it from `unpaid` to `late`: the standing is safe
   * again, and the amount she can disburse is not.
   */
  payOutstanding() {
    const [oldest, ...rest] = state.unpaid
    if (oldest === undefined) return
    store.set({ unpaid: rest, late: [...state.late, oldest] })
  },
  /**
   * The window closes and the decision is made. Called after the last week of a
   * window has stamped, so it reads the window the week BEFORE the cursor
   * belongs to.
   *
   * This is the only place `tier` moves. Failing sets it back to 'mitra' — and
   * `windowLog` keeps the failure, which is what makes the tenor-end limit
   * lower for the rest of the tenor even after she recovers.
   */
  closeWindow(): WindowOutcome {
    const index = windowOf(state.week - 1)
    const outcome = outcomeOf(state, index)
    const log = [...state.windowLog]
    log[index - 1] = outcome
    state = { ...state, windowLog: log, tier: outcome === 'failed' ? 'mitra' : 'juara' }
    emit()
    return outcome
  },
  /**
   * She takes the disbursement. Every closed window is now marked as taken, so
   * the amount drops to zero and the button flattens — the empty side of that
   * button is as much of the design as the live one.
   */
  disburse() {
    store.set({ disbursedWindows: state.windowLog.length })
  },
  /**
   * She takes the financing itself. The tenor starts: week 1 is live and the
   * first instalment is due, which is why the two habits only appear on home
   * once this has happened.
   */
  takePrincipal() {
    store.set({ principalTaken: true, week: 1 })
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
