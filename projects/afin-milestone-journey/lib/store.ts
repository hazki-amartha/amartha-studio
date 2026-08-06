'use client'

// Project-local store. The platform remounts a screen on every navigation, so
// everything the payment flow carries forward lives here rather than in a
// screen's useState — the amount entered on `amount`, the method picked on
// `method`, the Poket balance a top-up changes, and how far the home screen's
// "Bayar" task has got.
//
// The source HTML held all of this in one <AfinProvider> context that wrapped a
// switch-based router, so nothing ever unmounted. Here each screen stands alone,
// which is what makes the module store necessary rather than a nicety.
//
// Genuinely ephemeral state — a slider position, an unsent draft message, an
// open bottom sheet — stays as useState in the screen that owns it.

import { useSyncExternalStore } from 'react'
import {
  MEMBERS,
  WEEKLY_BILL,
  MILESTONE_AMOUNT,
  type JourneyPhase,
  type MethodId,
} from './data'

/**
 * Where the weekly instalment task has got to, as the home screen shows it.
 *
 * `pending` and `titip` are both "money handed over, not yet confirmed", but
 * they are not the same wait and the mitra can act on only one of them:
 * `pending` is an off-app transfer she can chase a status on, `titip` is cash
 * given to the field officer, which is settled to head office on his round and
 * has nothing for her to press in the meantime.
 */
export type BillState = 'idle' | 'pending' | 'titip' | 'paid'

/** Which mitra the home screen is drawn for. A brand-new mitra has no repayment
 *  history yet, so her nearest goal is the first disbursement, not a milestone. */
export type MitraStage = 'active' | 'new'

export interface AppState {
  /** Rupiah being paid in the current pass through the payment flow. */
  amount: number
  /** Promo taken on the confirmation screen. It lowers what the wallet is
   *  charged, not what the bill settles — so it lives beside `amount` rather
   *  than inside it. */
  discount: number
  method: MethodId | null
  /** Rupiah settled against this week's bill so far. */
  paidAmount: number
  poketBalance: number
  /** Autodebit is armed: the bill is pulled from Poket on its due date. It
   *  survives navigation because the top-up it sends her to is another screen. */
  autodebit: boolean
  /** Where the top-up screen goes back to. Poket can be topped up from home,
   *  from a shortfall, and now from the autodebit banner, and only the screen
   *  that sent her there knows which. */
  topupReturn: string
  billState: BillState
  mitraStage: MitraStage
  /**
   * She has fallen behind and the next milestone reward is now at risk: miss
   * this week's instalment or kumpulan and the streak that unlocks it resets.
   * Drives the goal card's warning treatment on the home screen.
   */
  atRisk: boolean
  /** She has turned up to this week's kumpulan — the checklist row ticks. */
  hadirKumpulan: boolean
  /**
   * Every member is current on their payments. It overrides the roster rather
   * than sitting beside it (see `members`), because five screens read that
   * roster and a majelis that is healthy on home and behind on its own page is
   * the kind of thing a walkthrough dies on.
   */
  majelisLancar: boolean
  /** Who the reminder goes to, set by the majelis screen for the compose screen. */
  waTarget: string
  waMessage: string
  /** Amount of the last disbursement, so the success screen can name it. */
  lastDisburse: number
  /** How the "Cairkan modal tambahan" screen is sized — the ceiling it offers and
   *  the floor its slider starts at. Set by whichever page sends her there, so the
   *  figures on it tally with what that page promised (a Rp8jt limit rise and a
   *  Rp1,25jt pencairan open the same screen at very different amounts). */
  disburseCap: number
  disburseFloor: number
  /** Which snapshot of the milestone ladder the progress page draws. */
  journeyPhase: JourneyPhase
}

const initial: AppState = {
  amount: 0,
  discount: 0,
  method: null,
  paidAmount: 0,
  poketBalance: 151000,
  autodebit: true,
  topupReturn: 'home',
  billState: 'idle',
  mitraStage: 'active',
  atRisk: false,
  hadirKumpulan: false,
  majelisLancar: false,
  waTarget: '',
  waMessage: '',
  lastDisburse: MILESTONE_AMOUNT,
  disburseCap: MILESTONE_AMOUNT,
  disburseFloor: 500000,
  journeyPhase: 'default',
}

let state: AppState = initial

const listeners = new Set<() => void>()

function emit() {
  // forEach (not for..of) — the repo's tsconfig target predates Set iteration.
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  set(patch: Partial<AppState>) {
    state = { ...state, ...patch }
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Enter the payment flow. A fresh pass always starts with no amount picked. */
  startPayment() {
    store.set({ amount: 0, discount: 0, method: null })
  },
  setAmount(amount: number) {
    store.set({ amount })
  },
  setMethod(method: MethodId) {
    store.set({ method })
  },
  setDiscount(discount: number) {
    store.set({ discount })
  },
  setAutodebit(autodebit: boolean) {
    store.set({ autodebit })
  },
  /** Send her to the top-up screen and remember where she came from. */
  goTopUp(topupReturn: string) {
    store.set({ topupReturn })
  },

  /** An off-app method was used — the money is claimed but not yet verified. */
  markPending() {
    store.set({ paidAmount: state.paidAmount + state.amount, billState: 'pending' })
  },
  /** Poket paid instantly: the balance moves and the bill settles in one step.
   *  A discount comes off the wallet, not off the instalment — she still owes
   *  the bill she agreed to. */
  payWithPoket() {
    store.set({
      poketBalance: state.poketBalance - chargeable(state),
      paidAmount: state.paidAmount + state.amount,
      billState: 'paid',
    })
  },
  /** The backend confirmed a pending payment. */
  confirmPending() {
    store.set({ billState: 'paid' })
  },
  topUp(value: number) {
    store.set({ poketBalance: state.poketBalance + value })
  },

  // --- Reminders ----------------------------------------------------------
  composeReminder(waTarget: string, waMessage: string) {
    store.set({ waTarget, waMessage })
  },

  // --- Disbursement -------------------------------------------------------
  /** Size the "Cairkan modal tambahan" screen for the page that opened it, so
   *  its ceiling and floor tally with the amount that page promised. */
  startDisburse(disburseCap: number, disburseFloor = 500000) {
    store.set({ disburseCap, disburseFloor })
  },
  disburse(lastDisburse: number) {
    store.set({ lastDisburse })
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

// --- Derivations -----------------------------------------------------------

/**
 * The majelis roster as the prototype currently stands. Every screen that reads
 * members goes through here rather than touching MEMBERS directly, so the
 * `majelisLancar` demo state moves home's checklist, the majelis page, both
 * progress reads and the limit tracker together.
 */
export const members = (s: AppState) =>
  s.majelisLancar ? MEMBERS.map((m) => ({ ...m, bayar: true })) : MEMBERS

/** How many in the majelis are behind on payments. */
export const tunggakan = (s: AppState) => members(s).filter((m) => !m.bayar).length

/** What is still owed on this week's bill. */
export const outstanding = (s: AppState) => Math.max(0, WEEKLY_BILL - s.paidAmount)

/** True once the week's instalment is fully settled. */
export const isSettled = (s: AppState) => s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL

/**
 * The reward is at risk when she still owes money this week — either the
 * deliberate at-risk state, or a part-payment that left arrears behind. Home
 * turns its rail orange on this, and the progress ladder marks the goal she is
 * working toward Berisiko, so the two surfaces read the same. A new mitra has no
 * reward streak yet, so it never applies to her.
 */
export const rewardAtRisk = (s: AppState) =>
  s.mitraStage !== 'new' && (s.atRisk || (s.billState === 'paid' && outstanding(s) > 0))

/** What the chosen method is actually charged — the amount less any promo. */
export const chargeable = (s: AppState) => Math.max(0, s.amount - s.discount)

/** How far the Poket balance falls short of the amount being paid. */
export const shortfall = (s: AppState) => Math.max(0, chargeable(s) - s.poketBalance)
