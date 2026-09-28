'use client'

// The Validasi Mitra flow's own state. Two things it has to hold across the
// three screens the BM moves between (§3: screens remount on every
// navigation):
//
//   - which case is open right now (`open`, like pipelineStore's `openId`) —
//     set from wherever a card is tapped (Tugas, the BM Validation category
//     on Sales), read by all three screens.
//   - each case's own decision, independently — a BM sitting on more than one
//     soft reject at once must be able to work on one without losing progress
//     on the other, so decisions are keyed by case id, not one shared blob.

import { useSyncExternalStore } from 'react'
import {
  DECISION_REASON_OTHER,
  SOFT_REJECT_CASES,
  type SoftRejectCase,
  type ValidasiDecision,
} from './validasi'

interface ValidasiState {
  decision: ValidasiDecision | null
  reason: string
  /** Only used when reason === "Lainnya". */
  customReason: string
  /** Raw digits, only asked when decision === "approve" — the limit SHE's
   *  proposing in place of the system's soft-reject read. */
  proposedLimit: string
  submitted: boolean
}

const EMPTY_CASE: ValidasiState = {
  decision: null,
  reason: '',
  customReason: '',
  proposedLimit: '',
  submitted: false,
}

interface State {
  /** The case id the 3 screens are currently showing. */
  open: string
  byId: Record<string, ValidasiState>
}

let state: State = { open: SOFT_REJECT_CASES[0].id, byId: {} }

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function patch(id: string, make: (s: ValidasiState) => Partial<ValidasiState>) {
  const current = state.byId[id] ?? EMPTY_CASE
  state = { ...state, byId: { ...state.byId, [id]: { ...current, ...make(current) } } }
  emit()
}

export const validasiStore = {
  /** Points the 3 screens at a case — called wherever its card is tapped. */
  open(id: string) {
    state = { ...state, open: id }
    emit()
  },
  /** Switching Setujui/Tolak clears the reason and the proposed limit — the
   *  two lists don't share answers, and a limit only makes sense once she's
   *  said yes. */
  setDecision(decision: ValidasiDecision) {
    patch(state.open, () => ({ decision, reason: '', customReason: '', proposedLimit: '' }))
  },
  setReason(reason: string) {
    patch(state.open, (s) => ({
      reason,
      customReason: reason === DECISION_REASON_OTHER ? s.customReason : '',
    }))
  },
  setCustomReason(customReason: string) {
    patch(state.open, () => ({ customReason }))
  },
  setProposedLimit(digits: string) {
    patch(state.open, () => ({ proposedLimit: digits.replace(/\D/g, '') }))
  },
  submit() {
    patch(state.open, () => ({ submitted: true }))
  },
}

function getSnapshot(): State {
  return state
}

/** The currently open case's own decision state. */
export function useValidasi(): ValidasiState {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getSnapshot,
    getSnapshot,
  )
  return s.byId[s.open] ?? EMPTY_CASE
}

/** The case the 3 screens are currently showing — wherever its card was
 *  tapped from. Falls back to the first case so a screen never has nothing
 *  to render. */
export function useOpenCase(): SoftRejectCase {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getSnapshot,
    getSnapshot,
  )
  return SOFT_REJECT_CASES.find((c) => c.id === s.open) ?? SOFT_REJECT_CASES[0]
}

/** Every case's decision state, by id — for Tugas / Sales, which list ALL
 *  cases rather than only the one currently open. */
export function useValidasiAll(): Record<string, ValidasiState> {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getSnapshot,
    getSnapshot,
  )
  return s.byId
}

/** The final reason text — the custom note when "Lainnya" was picked. */
export function finalReason(s: ValidasiState): string {
  return s.reason === DECISION_REASON_OTHER ? s.customReason.trim() : s.reason
}
