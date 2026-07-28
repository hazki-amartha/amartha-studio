'use client'

// Presentation states — the one-click conditions offered beside the device in
// desktop prototype view (`states` on a ScreenDef).
//
// They exist for walkthroughs, not for the prototype. The states worth
// discussing most are the ones a happy-path tap-through cannot reach: an
// arrears balance needs a deliberately short payment made first, and a Poket
// shortfall needs a bill larger than the wallet — neither is somewhere you land
// by tapping "Bayar".
//
// The source HTML had a toggle above the device for exactly this reason, but it
// could only switch mitra stage. This covers the payment states too.
//
// Kept in its own file: none of this is the prototype. Everything here writes
// the same store the screens already read, so a demo state is indistinguishable
// from having done the work by hand.

import { WEEKLY_BILL } from './data'
import { store } from './store'

/** Wipe every screen-crossing value back to a fresh, unpaid week. */
const reset = () =>
  store.set({
    amount: 0,
    method: null,
    paidAmount: 0,
    poketBalance: 151000,
    billState: 'idle',
    attendState: 'idle',
    attendMsg: '',
    attendFails: 0,
    atRisk: false,
  })

// --- Home ------------------------------------------------------------------

export const mitraAktif = () => {
  reset()
  store.set({ mitraStage: 'active' })
}

/** No repayment history yet, so the nearest goal is the first disbursement. */
export const mitraBaru = () => {
  reset()
  store.set({ mitraStage: 'new' })
}

export const belumBayar = () => {
  reset()
  store.set({ mitraStage: 'active' })
}

/** Paid in full — the task shows "Lunas" and the amount is struck through. */
export const sudahLunas = () => {
  reset()
  store.set({
    mitraStage: 'active',
    amount: WEEKLY_BILL,
    method: 'poket',
    paidAmount: WEEKLY_BILL,
    poketBalance: 1000,
    billState: 'paid',
  })
}

/** Claimed via an off-app method, not yet verified — the amber "Cek status". */
export const menungguKonfirmasi = () => {
  reset()
  store.set({
    mitraStage: 'active',
    amount: WEEKLY_BILL,
    method: 'va-bca',
    paidAmount: WEEKLY_BILL,
    billState: 'pending',
  })
}

/** A short payment landed, so the rest is arrears and the task says "Bayar sisa". */
export const sisaTunggakan = () => {
  reset()
  store.set({
    mitraStage: 'active',
    amount: 50000,
    method: 'poket',
    paidAmount: 50000,
    poketBalance: 101000,
    billState: 'paid',
  })
}

/** The location check has failed twice — the "Hubungi BP" escape is showing. */
export const absenGagal = () => {
  reset()
  store.set({
    mitraStage: 'active',
    attendState: 'fail',
    attendMsg: 'Lokasi terlalu jauh (≈820m dari titik kumpulan)',
    attendFails: 2,
  })
}

export const absenBerhasil = () => {
  reset()
  store.set({ mitraStage: 'active', attendState: 'ok' })
}

/**
 * She has fallen behind: the week's instalment is unpaid and she has not shown
 * at kumpulan, so the next milestone reward is at risk. The goal card swaps its
 * "keep going" framing for a warning that the reward can be forfeited, and the
 * two tasks become the way to save it.
 */
export const rewardBerisiko = () => {
  reset()
  store.set({ mitraStage: 'active', atRisk: true })
}

// --- Payment flow ----------------------------------------------------------

/** A full weekly bill against a wallet that can cover it. */
export const poketCukup = () => {
  reset()
  store.set({ amount: WEEKLY_BILL, method: 'poket', poketBalance: 200000 })
}

/** The same bill against a Rp80.000 wallet — the shortfall branch. */
export const poketKurang = () => {
  reset()
  store.set({ amount: WEEKLY_BILL, method: 'poket', poketBalance: 80000 })
}

/** A part-payment in progress, so `amount` is under the bill. */
export const bayarSebagian = () => {
  reset()
  store.set({ amount: 50000, method: 'poket', poketBalance: 80000 })
}

export const viaVaBca = () => {
  reset()
  store.set({ amount: WEEKLY_BILL, method: 'va-bca' })
}

export const viaIndomaret = () => {
  reset()
  store.set({ amount: WEEKLY_BILL, method: 'indomaret' })
}

export const viaAgen = () => {
  reset()
  store.set({ amount: WEEKLY_BILL, method: 'amartha-link' })
}

export const viaTransfer = () => {
  reset()
  store.set({ amount: WEEKLY_BILL, method: 'transfer' })
}
