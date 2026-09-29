'use client'

// The Validasi Mitra flow's own state. Two things it has to hold across the
// four screens the BM moves between (§3: screens remount on every
// navigation):
//
//   - which case is open right now (`open`, like pipelineStore's `openId`) —
//     set from wherever a card is tapped (Tugas, the BM Validation category
//     on Sales), read by all four screens.
//   - each case's own decision + verification, independently — a BM sitting
//     on more than one soft reject at once must be able to work on one
//     without losing progress on the other, so everything is keyed by case
//     id, not one shared blob.

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

  // The BM's own field verification — step 4, before Setujui/Tolak. She
  // re-checks two of the BP's own answers (status rumah, usaha berjalan)
  // rather than trusting the BP Feedback step alone, plus what only she can
  // attest to.
  statusRumahBM: string
  usahaBerjalanBM: string
  /** Multi-select — a mitra can own more than one. */
  asetBM: string[]
  majelisChecking: string
  /** Tap-to-capture booleans — the prototype doesn't take real photos
   *  (§3), only records that the BM did. */
  fotoRumah: boolean
  fotoUsaha: boolean
  selfieMitra: boolean
  selfieKetua: boolean
}

const EMPTY_CASE: ValidasiState = {
  decision: null,
  reason: '',
  customReason: '',
  proposedLimit: '',
  submitted: false,
  statusRumahBM: '',
  usahaBerjalanBM: '',
  asetBM: [],
  majelisChecking: '',
  fotoRumah: false,
  fotoUsaha: false,
  selfieMitra: false,
  selfieKetua: false,
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
  setStatusRumahBM(v: string) {
    patch(state.open, () => ({ statusRumahBM: v }))
  },
  setUsahaBerjalanBM(v: string) {
    patch(state.open, () => ({ usahaBerjalanBM: v }))
  },
  toggleAset(v: string) {
    patch(state.open, (s) => ({
      asetBM: s.asetBM.includes(v) ? s.asetBM.filter((a) => a !== v) : [...s.asetBM, v],
    }))
  },
  setMajelisChecking(v: string) {
    patch(state.open, () => ({ majelisChecking: v }))
  },
  toggleFotoRumah() {
    patch(state.open, (s) => ({ fotoRumah: !s.fotoRumah }))
  },
  toggleFotoUsaha() {
    patch(state.open, (s) => ({ fotoUsaha: !s.fotoUsaha }))
  },
  toggleSelfieMitra() {
    patch(state.open, (s) => ({ selfieMitra: !s.selfieMitra }))
  },
  toggleSelfieKetua() {
    patch(state.open, (s) => ({ selfieKetua: !s.selfieKetua }))
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
