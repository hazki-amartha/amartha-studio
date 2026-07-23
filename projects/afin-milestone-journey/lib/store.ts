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
import { WEEKLY_BILL, MILESTONE_AMOUNT, type MethodId } from './data'

/** Where the weekly instalment task has got to, as the home screen shows it. */
export type BillState = 'idle' | 'pending' | 'paid'

/** The geolocation check behind the "Absen" button. */
export type AttendState = 'idle' | 'checking' | 'ok' | 'fail'

/** Which mitra the home screen is drawn for. A brand-new mitra has no repayment
 *  history yet, so her nearest goal is the first disbursement, not a milestone. */
export type MitraStage = 'active' | 'new'

export interface AppState {
  /** Rupiah being paid in the current pass through the payment flow. */
  amount: number
  method: MethodId | null
  /** Rupiah settled against this week's bill so far. */
  paidAmount: number
  poketBalance: number
  billState: BillState
  attendState: AttendState
  /** Distance message shown when the location check fails. */
  attendMsg: string
  /** Consecutive failed checks — two of them offer the "Hubungi BP" escape. */
  attendFails: number
  mitraStage: MitraStage
  /** Who the reminder goes to, set by the majelis screen for the compose screen. */
  waTarget: string
  waMessage: string
  /** Amount of the last disbursement, so the success screen can name it. */
  lastDisburse: number
}

const initial: AppState = {
  amount: 0,
  method: null,
  paidAmount: 0,
  poketBalance: 80000,
  billState: 'idle',
  attendState: 'idle',
  attendMsg: '',
  attendFails: 0,
  mitraStage: 'active',
  waTarget: '',
  waMessage: '',
  lastDisburse: MILESTONE_AMOUNT,
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
    store.set({ amount: 0, method: null })
  },
  setAmount(amount: number) {
    store.set({ amount })
  },
  setMethod(method: MethodId) {
    store.set({ method })
  },

  /** An off-app method was used — the money is claimed but not yet verified. */
  markPending() {
    store.set({ paidAmount: state.paidAmount + state.amount, billState: 'pending' })
  },
  /** Poket paid instantly: the balance moves and the bill settles in one step. */
  payWithPoket() {
    store.set({
      poketBalance: state.poketBalance - state.amount,
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

  // --- Attendance ---------------------------------------------------------
  startAttendCheck() {
    store.set({ attendState: 'checking', attendMsg: '' })
  },
  attendOk() {
    store.set({ attendState: 'ok', attendFails: 0, attendMsg: '' })
  },
  attendFail(message: string) {
    store.set({
      attendState: 'fail',
      attendMsg: message,
      attendFails: state.attendFails + 1,
    })
  },

  // --- Reminders ----------------------------------------------------------
  composeReminder(waTarget: string, waMessage: string) {
    store.set({ waTarget, waMessage })
  },

  // --- Disbursement -------------------------------------------------------
  disburse(lastDisburse: number) {
    store.set({ lastDisburse })
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

// --- Derivations -----------------------------------------------------------

/** What is still owed on this week's bill. */
export const outstanding = (s: AppState) => Math.max(0, WEEKLY_BILL - s.paidAmount)

/** True once the week's instalment is fully settled. */
export const isSettled = (s: AppState) => s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL

/** How far the Poket balance falls short of the amount being paid. */
export const shortfall = (s: AppState) => Math.max(0, s.amount - s.poketBalance)
