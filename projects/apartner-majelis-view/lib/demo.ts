'use client'

// Presentation states — the one-click conditions offered beside the device in
// desktop prototype view (`states` on a ScreenDef).
//
// They exist for walkthroughs, not for the prototype. Explaining the closing
// task to stakeholders should not cost three full pelayanan of tapping first,
// and the states worth discussing most — a deposit that doesn't reconcile, a
// register nobody has touched — are exactly the ones a happy-path tap-through
// never reaches.
//
// Kept in their own file on purpose: none of this is the prototype. Everything
// here writes the same store the screens already read, so a demo state is
// indistinguishable from having done the work by hand.

import { MAJELIS, PREPAID, isSelfServe, outstandingOf } from './data'
import { store, type Attendance, type DepositEntry } from './store'

const collectible = MAJELIS.members.filter((m) => !isSelfServe(m))

/** The register as the BP finds it: the pre-paid seeded present, nobody else. */
const freshAttendance = (): Record<string, Attendance> => {
  const attendance: Record<string, Attendance> = {}
  PREPAID.forEach((m) => {
    attendance[m.id] = 'hadir'
  })
  return attendance
}

const freshPayments = (): Record<string, number> => {
  const payments: Record<string, number> = {}
  PREPAID.forEach((m) => {
    payments[m.id] = outstandingOf(m).total
  })
  return payments
}

const sumOf = (list: typeof collectible) =>
  list.reduce((sum, m) => sum + outstandingOf(m).total, 0)

// --- Stage 1: the register -------------------------------------------------

export const registerFresh = () =>
  store.set({ attendance: freshAttendance(), absenceReasons: {} })

/** Two left to mark — the state the stage is designed around. */
export const registerAlmost = () => {
  const attendance = freshAttendance()
  collectible.slice(0, collectible.length - 2).forEach((m) => {
    attendance[m.id] = 'hadir'
  })
  store.set({ attendance, absenceReasons: {} })
}

/** Complete, including two absences that carry their reason. */
export const registerDone = () => {
  const attendance = freshAttendance()
  collectible.forEach((m, i) => {
    attendance[m.id] = i < 2 ? 'tidak' : 'hadir'
  })
  store.set({
    attendance,
    absenceReasons: {
      [collectible[0].id]: 'Sedang bekerja',
      [collectible[1].id]: 'Sakit',
    },
  })
}

// --- Stage 2: the queue ----------------------------------------------------

export const queueFull = () =>
  store.set({ payments: freshPayments(), nonPayments: {}, lastCollect: null })

export const queueHalf = () => {
  const payments = freshPayments()
  collectible.slice(0, Math.ceil(collectible.length / 2)).forEach((m) => {
    payments[m.id] = outstandingOf(m).total
  })
  store.set({ payments, nonPayments: {}, lastCollect: null })
}

/** Everyone recorded, and the two outcomes that are not "lunas" both present. */
export const queueDone = () => {
  const payments = freshPayments()
  const [refuser, partial, ...rest] = collectible
  rest.forEach((m) => {
    payments[m.id] = outstandingOf(m).total
  })
  payments[partial.id] = Math.round(outstandingOf(partial).total / 2)
  store.set({
    payments,
    nonPayments: {
      [refuser.id]: { reason: 'Usaha sedang sepi', ptp: 'Sabtu, 25 Juli' },
    },
    lastCollect: null,
  })
}

// --- The daily close -------------------------------------------------------

// A day that has already happened. The amounts are computed from the same
// roster the visits collect from, so the deposit reconciles against real lines
// rather than a number invented for the panel.
const MAWAR_CASH = sumOf(collectible)
const MAWAR_DIGITAL = PREPAID.reduce((sum, m) => sum + outstandingOf(m).total, 0)

const bankedDay: Record<string, DepositEntry> = {
  t1: {
    taskId: 't1',
    label: 'Majelis Mawar',
    detail: `${collectible.length} mitra tunai`,
    cash: MAWAR_CASH,
    digital: MAWAR_DIGITAL,
  },
  t2: {
    taskId: 't2',
    label: 'Majelis Melati',
    detail: '11 mitra tunai',
    cash: 1_675_000,
    digital: 900_000,
  },
  t4: {
    taskId: 't4',
    label: 'Ibu Elin Herlina',
    detail: 'Ibu Elin Herlina',
    cash: 250_000,
    digital: 0,
  },
}

const bankedTotal = Object.values(bankedDay).reduce((sum, e) => sum + e.cash, 0)

export const dayEmpty = () =>
  store.set({
    deposits: {},
    depositAmount: 0,
    depositDiffReason: null,
    depositProof: false,
    depositDone: false,
  })

export const dayCollected = () =>
  store.set({
    deposits: bankedDay,
    depositAmount: bankedTotal,
    depositDiffReason: null,
    depositProof: false,
    depositDone: false,
  })

/** The case the screen exists for: the bag and the app disagree. */
export const daySelisih = () =>
  store.set({
    deposits: bankedDay,
    depositAmount: bankedTotal - 15_000,
    depositDiffReason: 'Mitra bayar kurang dari yang dicatat',
    depositProof: true,
    depositDone: false,
  })

export const daySubmitted = () =>
  store.set({
    deposits: bankedDay,
    depositAmount: bankedTotal,
    depositDiffReason: null,
    depositProof: true,
    depositDone: true,
  })
