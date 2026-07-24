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
import { INTEREST_ORDER, SEED_LEADS, type Lead } from './leads'
import { vaFor } from './schedule'
import {
  store,
  type Attendance,
  type DepositEntry,
  type FollowUpDraft,
  type Settlement,
} from './store'

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
  store.set({ payments: freshPayments(), nonPayments: {}, shortfallReasons: {}, lastCollect: null })

export const queueHalf = () => {
  const payments = freshPayments()
  collectible.slice(0, Math.ceil(collectible.length / 2)).forEach((m) => {
    payments[m.id] = outstandingOf(m).total
  })
  store.set({ payments, nonPayments: {}, shortfallReasons: {}, lastCollect: null })
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
    // A part-payment carries its reason exactly as a refusal does — the balance
    // it leaves behind has to be chaseable by whoever reads the visit later.
    shortfallReasons: { [partial.id]: 'Uang belum terkumpul semua' },
    lastCollect: null,
  })
}

// --- The schedule: which task is "Sekarang" --------------------------------
//
// The focus card is simply the first task the BP hasn't finished (`nowTask`),
// so switching it is a matter of marking the ones before it done. A walkthrough
// jumps straight to the pelayanan, the home visit, or the closing deposit
// without tapping through the day to reach each one. Each also pins the day to
// "hari ini", since the focus card only exists there.

/** Start of day: the first majelis is the active task. */
export const scheduleMajelis = () => store.set({ day: 'today', doneTasks: [] })

/** Everything before the 13.00 door is done — a home visit is now "Sekarang". */
export const scheduleHomeVisit = () =>
  store.set({
    day: 'today',
    doneTasks: ['t1', 't2', 't2b'],
    sentTasks: [],
    // The finished visits BANK their cash, or the settlement widget on this
    // screen has nothing to be about. Two majelis in the bag by midday is
    // exactly the moment the mid-day handover exists for.
    deposits: depositsFor(['t1', 't2']),
    settlements: [],
    depositAmount: null,
    depositProof: false,
  })

/** Every visit submitted, cash still in the bag — the last settlement is open. */
export const scheduleClosing = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    sentTasks: CLOSING_DONE,
    deposits: bankedDay,
    settlements: [],
    depositAmount: null,
    depositProof: false,
    depositDone: false,
  })

/**
 * Nothing left at all: every task done AND sent, every rupiah handed over. The
 * only state where Tutup Hari Ini appears.
 */
export const scheduleCloseable = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    sentTasks: CLOSING_DONE,
    deposits: bankedDay,
    settlements: [
      settlement(1, ['t1'], '11.40'),
      settlement(2, ['t2', 't4'], '16.20'),
    ],
    depositAmount: null,
    depositProof: false,
    depositDone: false,
  })

/**
 * Three free handovers used and cash still coming in — the state the FEE now
 * speaks to. The widget still offers to settle; the page says the next one
 * costs. Nothing is locked, which is the point of the change.
 */
export const scheduleCapped = () =>
  store.set({
    day: 'today',
    doneTasks: ['t1', 't2', 't2b', 't3', 't4', 't5'],
    sentTasks: ['t1', 't2', 't2b', 't3', 't4'],
    // The 16.30 majelis banked after the third handover, so there is cash in
    // the bag with no free settlement left to put it down with.
    deposits: {
      ...bankedDay,
      t5: {
        taskId: 't5',
        label: 'Majelis Kenanga',
        detail: '9 mitra tunai',
        cash: 1_450_000,
        digital: 700_000,
      },
    },
    settlements: [
      settlement(1, ['t1'], '11.40'),
      settlement(2, ['t2'], '15.10'),
      // Short by Rp15.000, with the reason on file — the case the confirm step
      // exists for, and the one the old settle() silently threw away.
      settlement(3, ['t4'], '16.05', bankedDay.t4.cash - 15_000),
    ],
    depositAmount: null,
    depositProof: false,
  })

/** Closing submitted — the schedule's thank-you banner, and nothing to do. */
export const scheduleClosed = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    sentTasks: CLOSING_DONE,
    deposits: bankedDay,
    settlements: [
      settlement(1, ['t1'], '11.40'),
      settlement(2, ['t2', 't4'], '16.20'),
    ],
    depositAmount: null,
    depositProof: true,
    depositDone: true,
  })

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

// Every task on the day except the closing itself — what check 1 counts.
const CLOSING_DONE = ['t1', 't2', 't2b', 't3', 't3b', 't4', 't5']

/** The banked lines for a set of finished tasks — only the ones that took cash. */
/**
 * One recorded handover. `expected` defaults to the amount, because the fixture
 * days agree with the app — the disagreement is what `daySelisih` is for.
 */
const settlement = (no: number, taskIds: string[], at: string, amount?: number): Settlement => {
  const expected = taskIds.reduce((sum, id) => sum + (bankedDay[id]?.cash ?? 0), 0)
  return {
    no,
    amount: amount ?? expected,
    expected,
    diffReason: amount === undefined || amount === expected ? null : 'Salah catat nominal',
    taskIds,
    va: vaFor(no),
    at,
    closing: false,
  }
}

const depositsFor = (ids: string[]): Record<string, DepositEntry> => {
  const out: Record<string, DepositEntry> = {}
  ids.forEach((id) => {
    if (bankedDay[id]) out[id] = bankedDay[id]
  })
  return out
}

/** Nothing started: every task still open, nothing to deposit. */
export const closingFresh = () =>
  store.set({ day: 'today', doneTasks: [], deposits: {}, depositProof: false, depositDone: false })

/** Mid-day: four stops done, three still open — the incomplete checklist. */
export const closingPartial = () => {
  const done = ['t1', 't2', 't2b', 't3']
  store.set({
    day: 'today',
    doneTasks: done,
    deposits: depositsFor(done),
    depositProof: false,
    depositDone: false,
  })
}

/** Every task done, titipan not yet deposited — the state the CTA waits on. */
export const closingReady = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    deposits: bankedDay,
    depositProof: false,
    depositDone: false,
  })

/** Both checks pass — every task done AND the titipan deposited. Ready to close. */
export const closingSettled = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    deposits: bankedDay,
    depositProof: true,
    depositDone: false,
  })

/** Closed and sent — waiting on branch verification. */
export const closingSent = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    deposits: bankedDay,
    depositProof: true,
    depositDone: true,
  })

// --- NTB: sosialisasi and follow up ----------------------------------------
//
// The prospecting states are the ones a walkthrough most needs handed to it.
// A sosialisasi at its target is ten captures away; a prospect whose interest
// COOLED between two calls cannot be reached by tapping at all, because the
// first call happened last week.

const NEW_NAMES = [
  'Ipah Saripah',
  'Dedeh Kurniasih',
  'Euis Rohaeti',
  'Titin Suryani',
  'Nurhayati',
  'Imas Masitoh',
  'Cucu Sumiati',
  'Lilis Rohaeni',
  'Wiwin Winarti',
  'Enok Sunarsih',
]

/** A prospect captured at today's Ciseeng session, built from the quick tier. */
function made(i: number, over: Partial<Lead> = {}): Lead {
  const name = NEW_NAMES[i]
  const interest = INTEREST_ORDER[i % 3]
  return {
    id: `d${i + 1}`,
    name,
    phone: `0812-${4400 + i * 7}-${1100 + i * 13}`,
    source: i % 4 === 3 ? 'referral' : 'sosialisasi',
    referredBy: i % 4 === 3 ? 'Ibu Rina Marlina (Majelis Mawar)' : '',
    referralKind: i % 4 === 3 ? 'mitra' : null,
    interest,
    followUpAt: interest === 'tinggi' ? '22 Juli' : '28 Juli',
    address: '',
    majelisId: null,
    hasOtherLoan: null,
    otherLoan: null,
    stage: 'baru',
    reason: '',
    note: '',
    eventId: 'e1',
    log: [
      {
        at: '21 Juli',
        via: 'sosialisasi',
        outcome: `Minat ${interest} · follow up ${interest === 'tinggi' ? '22 Juli' : '28 Juli'}`,
        note: '',
      },
    ],
    ...over,
  }
}

/** Seed leads plus `count` captured at today's session. */
function withCaptured(extra: Lead[]) {
  const leads: Record<string, Lead> = {}
  const order: string[] = []
  SEED_LEADS.concat(extra).forEach((l) => {
    leads[l.id] = l
    order.push(l.id)
  })
  return { leads, leadOrder: order }
}

export const eventEmpty = () =>
  store.set({ openEvent: 'e1', scheduled: [], ...withCaptured([]) })

export const eventHalf = () =>
  store.set({
    openEvent: 'e1',
    scheduled: [],
    ...withCaptured([0, 1, 2, 3, 4].map((i) => made(i))),
  })

/** Target met, and one refusal in the list — a no is a result, not a gap. */
export const eventFull = () =>
  store.set({
    openEvent: 'e1',
    scheduled: [],
    ...withCaptured(
      NEW_NAMES.map((_, i) =>
        i === 6
          ? made(i, {
              interest: 'tidak',
              stage: 'tidak',
              followUpAt: null,
              note: 'Keberatan tanggung renteng',
            })
          : made(i),
      ),
    ),
  })

// --- One prospect's record -------------------------------------------------

const showLead = (lead: Lead) =>
  store.set({
    leads: { ...store.get().leads, [lead.id]: lead },
    leadOrder: store.get().leadOrder.includes(lead.id)
      ? store.get().leadOrder
      : [...store.get().leadOrder, lead.id],
    openLead: lead.id,
    followUp: { ...store.get().followUp, leadId: lead.id, contact: null },
  })

const NIA = SEED_LEADS[0]

export const leadIncomplete = () =>
  showLead({
    ...NIA,
    address: '',
    majelisId: null,
    hasOtherLoan: null,
    otherLoan: null,
    reason: '',
  })

export const leadComplete = () => showLead({ ...NIA, stage: 'follow-up', reason: '' })

/** The ordinary NTB case: she wants it, she just can't yet. */
export const leadBlocked = () =>
  showLead({
    ...NIA,
    interest: 'tinggi',
    followUpAt: '21 Oktober',
    reason: 'Menunggu pinjaman BRI lunas Oktober 2026',
  })

// --- The call ---------------------------------------------------------------

const draft = (over: Partial<FollowUpDraft>) =>
  store.set({
    openLead: NIA.id,
    leads: { ...store.get().leads, [NIA.id]: NIA },
    followUp: {
      leadId: NIA.id,
      via: 'wa',
      contact: null,
      interest: null,
      next: null,
      reason: '',
      followUpAt: null,
      followUpPicked: false,
      note: '',
      ...over,
    },
  })

export const followUpFresh = () => draft({})

/** Interest moved between two calls — the line the screen exists to surface. */
export const followUpCooled = () =>
  draft({
    contact: 'terhubung',
    interest: 'sedang',
    next: 'lanjut',
    followUpAt: '21 Agustus',
    followUpPicked: true,
    reason: 'Suaminya belum setuju',
  })

export const followUpMissed = () =>
  draft({ contact: 'tidak-diangkat', followUpAt: '22 Juli', followUpPicked: true })

export const followUpQualified = () =>
  draft({ contact: 'terhubung', interest: 'tinggi', next: 'siap' })
