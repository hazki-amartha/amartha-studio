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

import { WEEKLY_BILL, type JourneyPhase } from './data'
import { cardStateStore } from './revolving'
import { store } from './store'

/** Wipe every screen-crossing value back to a fresh, unpaid week. */
const reset = () =>
  store.set({
    amount: 0,
    discount: 0,
    method: null,
    paidAmount: 0,
    poketBalance: 151000,
    autodebit: false,
    topupReturn: 'home',
    billState: 'idle',
    atRisk: false,
    hadirKumpulan: false,
    majelisLancar: false,
  })

// --- Home ------------------------------------------------------------------

export const mitraAktif = () => {
  reset()
  store.set({ mitraStage: 'active' })
  // Home - alt's "Angsuran Anda" card: mendekati pencairan, kelompok
  // belum lancar — state 2b.
  cardStateStore.set({ state: 'mendekati', kelompokLancar: false, remaining: 6 })
}

/** Home - alt only: the card's AWAL state. Resets `mitraStage` back to
 *  'active' same as every other Home - alt entry — without it, landing here
 *  right after "New mitra" left `mitraStage: 'new'` behind would keep
 *  Pinjaman Ibu on screen and hide this state entirely. */
export const earlyRepayment = () => {
  reset()
  store.set({ mitraStage: 'active' })
  cardStateStore.set({ state: 'awal' })
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
  // Home - alt's "Angsuran Anda" card: same status-box read as Active mitra,
  // but a step closer — she just cleared this week's instalment.
  cardStateStore.set({ state: 'mendekati', kelompokLancar: false, remaining: 5 })
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
  // Home - alt's "Angsuran Anda" card: same status-box read as Active mitra.
  cardStateStore.set({ state: 'mendekati', kelompokLancar: false, remaining: 6 })
}

/**
 * Cash handed to the field officer, who has not yet settled it to head office.
 * Her side of the bargain is done — hence a tick — but the money has not landed
 * anywhere that counts yet, so the tick is grey rather than green and there is
 * nothing for her to press: the next move is the officer's.
 */
export const titipBayar = () => {
  reset()
  store.set({
    mitraStage: 'active',
    amount: WEEKLY_BILL,
    method: 'amartha-link',
    paidAmount: WEEKLY_BILL,
    billState: 'titip',
  })
  // Home - alt's "Angsuran Anda" card: same status-box read as Active mitra,
  // but a step closer — the officer's cash still settles this week's bill.
  cardStateStore.set({ state: 'mendekati', kelompokLancar: false, remaining: 5 })
}

/** A partial instalment landed this week — Rp50.000 in, Rp100.000 still due
 *  before kumpulan. Not overdue, so not menunggak. */
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
  cardStateStore.set({ state: 'kurang-bayar', kelompokLancar: true, remaining: 6 })
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
  // Home - alt's "Angsuran Anda" card: menunggak — state 3.
  cardStateStore.set({ state: 'menunggak' })
}

/** She has turned up this week, so the kumpulan row ticks while the bill is
 *  still outstanding — the two habits move independently. */
export const sudahHadir = () => {
  reset()
  store.set({ mitraStage: 'active', hadirKumpulan: true })
}

/**
 * Every row ticked: the week paid, the kumpulan attended, and nobody in the
 * majelis behind. The only state that reaches the checklist's all-green
 * picture, and the only one that shows the majelis row in the condition it is
 * named for.
 */
export const semuaBeres = () => {
  reset()
  store.set({
    mitraStage: 'active',
    amount: WEEKLY_BILL,
    method: 'poket',
    paidAmount: WEEKLY_BILL,
    poketBalance: 1000,
    billState: 'paid',
    hadirKumpulan: true,
    majelisLancar: true,
  })
  // Home - alt's "Angsuran Anda" card: mendekati pencairan, semua
  // lancar — state 2a.
  cardStateStore.set({ state: 'mendekati', kelompokLancar: true, remaining: 6 })
}

/**
 * A goal has been reached and the money left undrawn, so home carries the
 * disbursement row under its tasks. This one seeds the LADDER, unlike the
 * states above it: home reads what is claimable off the journey phase, so the
 * two axes meet here on purpose rather than by accident.
 */
export const limitTerbuka = () => {
  reset()
  store.set({ mitraStage: 'active', journeyPhase: 'jul' })
  cardStateStore.set({ state: 'limit-terbuka', kelompokLancar: true, remaining: 6 })
}

// --- Payment flow ----------------------------------------------------------

/** A full weekly bill against a wallet that can cover it. */
/** Autodebit has never been set up — the banner is the offer to turn it on. */
export const autodebitMati = () => {
  reset()
}

/** Armed, but the wallet cannot cover the bill — the banner leads with Top-up. */
export const autodebitKurang = () => {
  reset()
  store.set({ autodebit: true, poketBalance: 80000 })
}

/** Armed and funded — the banner simply states when the money will be pulled. */
export const autodebitAktif = () => {
  reset()
  store.set({ autodebit: true, poketBalance: 200000 })
}

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

// --- Progress ladder -------------------------------------------------------
// Each seeds a snapshot of the milestone journey (see MILESTONE_SETS). Payment
// state is left alone — the ladder is a separate axis from the weekly bill.

const journey = (journeyPhase: JourneyPhase) => () => store.set({ journeyPhase })

/** Back to the entry view — before 14 Jul, so nothing is unlocked or missed. */
export const journeySekarang = journey('default')
export const journeySisaLimit = journey('sisalimit')
export const journeyJul = journey('jul')
export const journeyGagal = journey('gagal')
export const journeyOkt = journey('okt')
export const journeyJan = journey('jan')
export const journeyMar = journey('mar')
export const journeyNewLoan = journey('newloan')
