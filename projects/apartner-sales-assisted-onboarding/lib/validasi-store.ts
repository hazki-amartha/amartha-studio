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
  PERNAH_KELOMPOK_OPTIONS,
  SOFT_REJECT_CASES,
  type SoftRejectCase,
  type ValidasiDecision,
} from './validasi'

interface ValidasiState {
  decision: ValidasiDecision | null
  /** Setujui allows more than one reason at once (a checkbox list) — an
   *  approval is usually a combination of things going right. Tolak stays
   *  single-select (picking a new one replaces the list) — see
   *  `toggleReason` below. */
  reasons: string[]
  /** Only used when reasons includes "Lainnya". */
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
  /** How long the Ketua Majelis has known her, and whether they've already
   *  been in a group loan together — the two things only the Ketua Majelis
   *  visit can answer. */
  lamaKenalKM: string
  pernahKelompokKM: string
  /** Only meaningful when pernahKelompokKM is the "Ya" answer — which
   *  pinjaman that previous group was. Cleared the moment she switches
   *  pernahKelompokKM away from "Ya". */
  riwayatPinjamanKM: string
  /** Tap-to-capture booleans — the prototype doesn't take real photos
   *  (§3), only records that the BM did. */
  fotoRumah: boolean
  fotoUsaha: boolean
  selfieMitra: boolean
  selfieKetua: boolean
}

const EMPTY_CASE: ValidasiState = {
  decision: null,
  reasons: [],
  customReason: '',
  proposedLimit: '',
  submitted: false,
  statusRumahBM: '',
  usahaBerjalanBM: '',
  asetBM: [],
  majelisChecking: '',
  lamaKenalKM: '',
  pernahKelompokKM: '',
  riwayatPinjamanKM: '',
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
    patch(state.open, () => ({ decision, reasons: [], customReason: '', proposedLimit: '' }))
  },
  /** Setujui: toggles `reason` in/out of the list. Tolak: replaces the list
   *  with just `reason` — the same handler, because which behavior applies
   *  depends only on the decision already in state. */
  toggleReason(reason: string) {
    patch(state.open, (s) => {
      const reasons =
        s.decision === 'approve'
          ? s.reasons.includes(reason)
            ? s.reasons.filter((r) => r !== reason)
            : [...s.reasons, reason]
          : [reason]
      return {
        reasons,
        customReason: reasons.includes(DECISION_REASON_OTHER) ? s.customReason : '',
      }
    })
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
  setLamaKenalKM(v: string) {
    patch(state.open, () => ({ lamaKenalKM: v }))
  },
  setPernahKelompokKM(v: string) {
    patch(state.open, (s) => ({
      pernahKelompokKM: v,
      riwayatPinjamanKM: v === PERNAH_KELOMPOK_OPTIONS[0] ? s.riwayatPinjamanKM : '',
    }))
  },
  setRiwayatPinjamanKM(v: string) {
    patch(state.open, () => ({ riwayatPinjamanKM: v }))
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

/** The picked reasons as one line — "Lainnya" is swapped for its own custom
 *  note, and any reason without text (an empty custom note) is dropped so an
 *  incomplete "Lainnya" doesn't show up as a blank item in the summary. */
export function reasonSummary(s: ValidasiState): string {
  return s.reasons
    .map((r) => (r === DECISION_REASON_OTHER ? s.customReason.trim() : r))
    .filter((r) => r.length > 0)
    .join(', ')
}

/** At least one reason picked, and — if "Lainnya" is one of them — its own
 *  note actually filled in. */
export function reasonsValid(s: ValidasiState): boolean {
  if (s.reasons.length === 0) return false
  if (s.reasons.includes(DECISION_REASON_OTHER) && s.customReason.trim().length === 0) return false
  return true
}

/** Step 2 (Validasi ke Mitra) is whole. */
export function isVerifikasiMitraDone(s: ValidasiState): boolean {
  return (
    s.statusRumahBM.length > 0 &&
    s.usahaBerjalanBM.length > 0 &&
    s.asetBM.length > 0 &&
    s.fotoRumah &&
    s.fotoUsaha &&
    s.selfieMitra
  )
}

/** Step 3 (Validasi ke Ketua Majelis) is whole. */
export function isVerifikasiKetuaDone(s: ValidasiState): boolean {
  return (
    s.majelisChecking.length > 0 &&
    s.lamaKenalKM.length > 0 &&
    s.pernahKelompokKM.length > 0 &&
    (s.pernahKelompokKM !== PERNAH_KELOMPOK_OPTIONS[0] || s.riwayatPinjamanKM.length > 0) &&
    s.selfieKetua
  )
}

/** Whether the stepper may jump straight to `step` (1-indexed, matching
 *  VALIDASI_STEP_SCREENS) — she can always go back to a step she's already
 *  on or past, and step 1 (Hasil Underwriting) is always open, but Validasi
 *  KM needs Validasi mitra done first, and Keputusan needs both. */
export function canGoToValidasiStep(s: ValidasiState, step: number): boolean {
  if (step <= 2) return true
  if (step === 3) return isVerifikasiMitraDone(s)
  return isVerifikasiMitraDone(s) && isVerifikasiKetuaDone(s)
}
