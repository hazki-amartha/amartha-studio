'use client'

// The Validasi Mitra flow's own state — the BM's decision has to survive the
// three screens it's made across (§3: screens remount on every navigation), so
// it lives here rather than in each screen's useState.

import { useSyncExternalStore } from 'react'
import { DECISION_REASON_OTHER, type ValidasiDecision } from './validasi'

interface ValidasiState {
  decision: ValidasiDecision | null
  reason: string
  /** Only used when reason === "Lainnya". */
  customReason: string
  submitted: boolean
}

let state: ValidasiState = { decision: null, reason: '', customReason: '', submitted: false }

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const validasiStore = {
  /** Switching Setujui/Tolak clears the reason — the two lists don't share
   *  answers, so a reason picked for one would silently carry into the other. */
  setDecision(decision: ValidasiDecision) {
    state = { ...state, decision, reason: '', customReason: '' }
    emit()
  },
  setReason(reason: string) {
    state = { ...state, reason, customReason: reason === DECISION_REASON_OTHER ? state.customReason : '' }
    emit()
  },
  setCustomReason(customReason: string) {
    state = { ...state, customReason }
    emit()
  },
  submit() {
    state = { ...state, submitted: true }
    emit()
  },
}

export function useValidasi(): ValidasiState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => state,
  )
}

/** The final reason text — the custom note when "Lainnya" was picked. */
export function finalReason(s: ValidasiState): string {
  return s.reason === DECISION_REASON_OTHER ? s.customReason.trim() : s.reason
}
