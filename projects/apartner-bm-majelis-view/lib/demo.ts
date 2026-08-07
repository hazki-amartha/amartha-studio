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

import {
  HOME_MITRA,
  MAJELIS,
  PREPAID,
  findMitra,
  growthMembers,
  isSelfServe,
  outstandingOf,
} from './data'
import { INTEREST_ORDER, SEED_LEADS, type Lead } from './leads'
import { vaFor, type SettleMethod } from './schedule'
import {
  store,
  type AppState,
  type Attendance,
  type DepositEntry,
  type FollowUpDraft,
  type GrowthFollowUp,
  type GrowthResult,
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

/**
 * The Mawar roster with every cash-paying mitra having settled her bill in full.
 * This is what lets the settlement screen open Majelis Mawar into its individual
 * mitra to pick from — without the per-mitra payments there is only the
 * aggregate deposit to show. The cash sums to Mawar's banked figure, so the
 * roster view and the deposit figure agree.
 */
const mawarPaid = (): Record<string, number> => {
  const payments = freshPayments()
  collectible.forEach((m) => {
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

// Every queue state clears `payMode`, `poketProof` and `dropOut` as well as the
// payments: they are what tells the card WHICH result it is showing, so a state
// that left them behind would seed a roster still wearing the last one's
// outcomes.
const noOutcomes = { payMode: {}, poketProof: {}, dropOut: {}, partialPtp: {} } as const

export const queueFull = () =>
  store.set({
    payments: freshPayments(),
    nonPayments: {},
    shortfallReasons: {},
    lastCollect: null,
    ...noOutcomes,
  })

export const queueHalf = () => {
  const payments = freshPayments()
  collectible.slice(0, Math.ceil(collectible.length / 2)).forEach((m) => {
    payments[m.id] = outstandingOf(m).total
  })
  store.set({
    payments,
    nonPayments: {},
    shortfallReasons: {},
    lastCollect: null,
    ...noOutcomes,
  })
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
    ...noOutcomes,
    payMode: { [refuser.id]: 'tidak', [partial.id]: 'sebagian' },
  })
}

/**
 * Every result a mitra card can carry, on one screen, in roster order.
 *
 * The eight states of the card are the thing under review, and most of them
 * cost a full pass through the collect menu to reach — some of them twice, on
 * two different mitra, because a card can only be in one state at a time. This
 * seeds one of each: a cash lunas and a part-payment, the same two through
 * Poket, a bill the group covered, a refusal, a mitra leaving the program, and
 * the fifteen who had already settled before the BP arrived.
 */
export const queueEveryOutcome = () => {
  const payments = freshPayments()
  const [sebagian, tanggung, poketLunas, poketSebagian, lunas, tidak, keluar] = collectible

  payments[lunas.id] = outstandingOf(lunas).total
  payments[tanggung.id] = outstandingOf(tanggung).total
  payments[poketLunas.id] = outstandingOf(poketLunas).total
  payments[sebagian.id] = Math.round(outstandingOf(sebagian).total / 2)
  payments[poketSebagian.id] = Math.round(outstandingOf(poketSebagian).total / 2)

  store.set({
    payments,
    payMode: {
      [lunas.id]: 'penuh',
      [sebagian.id]: 'sebagian',
      [tanggung.id]: 'tanggung',
      [poketLunas.id]: 'poket',
      [poketSebagian.id]: 'poket',
      [tidak.id]: 'tidak',
      [keluar.id]: 'keluar',
    },
    // The screenshot behind each Poket claim — without it the card has a state
    // the flow would never have let the BP save.
    poketProof: { [poketLunas.id]: true, [poketSebagian.id]: true },
    nonPayments: {
      [tidak.id]: { reason: 'Usaha sedang sepi', ptp: '25 Juli' },
    },
    dropOut: { [keluar.id]: 'Pindah tanpa kabar' },
    shortfallReasons: {
      [sebagian.id]: 'Uang belum terkumpul semua',
      [poketSebagian.id]: 'Usaha sedang sepi',
    },
    partialPtp: { [sebagian.id]: '23 Juli', [poketSebagian.id]: null },
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
export const scheduleMajelis = () =>
  store.set({ day: 'today', doneTasks: [], remindedTasks: [] })

/** Everything before the 13.00 door is done — a home visit is now "Sekarang". */
export const scheduleHomeVisit = () =>
  store.set({
    day: 'today',
    doneTasks: ['t0', 't1', 't2', 't2b'],
    remindedTasks: REMINDED,
    sentTasks: [],
    // The finished visits BANK their cash, or the settlement widget on this
    // screen has nothing to be about. Two majelis in the bag by midday is
    // exactly the moment the mid-day handover exists for. Mawar's roster is
    // seeded so the settlement can pick per mitra from it.
    payments: mawarPaid(),
    deposits: depositsFor(['t1', 't2']),
    settlements: [],
    depositAmount: null,
    depositMethod: null,
    depositProof: false,
  })

/** Every visit submitted, cash still in the bag — the last settlement is open. */
export const scheduleClosing = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    remindedTasks: REMINDED,
    sentTasks: CLOSING_DONE,
    // Mawar's roster seeded so the settlement opens it per mitra.
    payments: mawarPaid(),
    deposits: bankedDay,
    settlements: [],
    depositAmount: null,
    depositMethod: null,
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
    remindedTasks: REMINDED,
    sentTasks: CLOSING_DONE,
    deposits: bankedDay,
    settlements: [
      settlement(1, ['t1'], '11.40'),
      // The second handover went to an agent counter — the two roads, side by
      // side in the history, so a walkthrough shows both without tapping.
      settlement(2, ['t2', 't4'], '16.20', undefined, 'agent'),
    ],
    depositAmount: null,
    depositMethod: null,
    depositProof: false,
    depositDone: false,
  })

/**
 * All three of the day's handovers used, and a late majelis has banked more
 * cash — the state the CAP speaks to. The widget goes quiet (there is no fourth
 * drop), and the cash that remains rides to closing. Opening the settlement
 * screen here shows its "sudah penuh" state rather than a form.
 */
export const scheduleCapped = () =>
  store.set({
    day: 'today',
    doneTasks: ['t0', 't1', 't2', 't2b', 't3', 't4', 't5'],
    remindedTasks: REMINDED,
    // Everything sent, so the late majelis's cash IS settleable — it is the cap,
    // not a missing sync, that keeps it in the bag.
    sentTasks: ['t0', 't1', 't2', 't2b', 't3', 't4', 't5'],
    // The 16.30 majelis banked after the third handover, so there is cash in
    // the bag with no settlement left in the day's three to put it down with.
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
      settlement(2, ['t2'], '15.10', undefined, 'agent'),
      // Short by Rp15.000, with the reason on file — the case the confirm step
      // exists for, and the one the old settle() silently threw away.
      settlement(3, ['t4'], '16.05', bankedDay.t4.cash - 15_000),
    ],
    depositAmount: null,
    depositMethod: null,
    depositProof: false,
  })

/** Closing submitted — the schedule's thank-you banner, and nothing to do. */
export const scheduleClosed = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    remindedTasks: REMINDED,
    sentTasks: CLOSING_DONE,
    deposits: bankedDay,
    settlements: [
      settlement(1, ['t1'], '11.40'),
      settlement(2, ['t2', 't4'], '16.20', undefined, 'agent'),
    ],
    depositAmount: null,
    depositMethod: null,
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

// Every task on the day except the closing itself — what check 1 counts. The
// 07.00 reminder is one of them: it is a task on the schedule like any other,
// and a seed that leaves it out hands the walkthrough a day that says "7 dari 8"
// and refuses to close over a message that was sent before the day began.
const CLOSING_DONE = ['t0', 't1', 't2', 't2b', 't3', 't3b', 't4', 't5']

// The three groups meeting today, ticked off the morning reminder. Seeded
// alongside CLOSING_DONE so the reminder screen agrees with the schedule row:
// a finished task whose own page still shows "tandai 3 grup lagi" reads as a
// bug in the tick, not as a shortcut a demo state took.
const REMINDED = ['t1', 't2', 't5']

/** The banked lines for a set of finished tasks — only the ones that took cash. */
/**
 * One recorded handover. `expected` defaults to the amount, because the fixture
 * days agree with the app — the disagreement is what `daySelisih` is for.
 */
const settlement = (
  no: number,
  taskIds: string[],
  at: string,
  amount?: number,
  method: SettleMethod = 'va',
): Settlement => {
  const expected = taskIds.reduce((sum, id) => sum + (bankedDay[id]?.cash ?? 0), 0)
  return {
    no,
    amount: amount ?? expected,
    expected,
    diffReason: amount === undefined || amount === expected ? null : 'Salah catat nominal',
    taskIds,
    va: vaFor(no),
    method,
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
  store.set({
    day: 'today',
    doneTasks: [],
    remindedTasks: [],
    deposits: {},
    depositProof: false,
    depositDone: false,
  })

/** Mid-day: four stops done, three still open — the incomplete checklist. */
export const closingPartial = () => {
  const done = ['t0', 't1', 't2', 't2b', 't3']
  store.set({
    day: 'today',
    doneTasks: done,
    remindedTasks: REMINDED,
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
    remindedTasks: REMINDED,
    deposits: bankedDay,
    depositProof: false,
    depositDone: false,
  })

/** Both checks pass — every task done AND the titipan deposited. Ready to close. */
export const closingSettled = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    remindedTasks: REMINDED,
    deposits: bankedDay,
    depositProof: true,
    depositDone: false,
  })

/** Closed and sent — waiting on branch verification. */
export const closingSent = () =>
  store.set({
    day: 'today',
    doneTasks: CLOSING_DONE,
    remindedTasks: REMINDED,
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

// --- The roster, and which day it is ---------------------------------------
//
// What the majelis page OFFERS hangs off one fact: whether today's schedule
// sends the BP to this group. Tapping to the other case means finding a group
// that does not meet today, which is the one thing the schedule cannot hand her.

/** A group whose kumpulan is today — the footer starts the pelayanan. */
export const rosterOnSchedule = () => store.set({ openMajelis: 'mawar', activeTask: null })

/** A group that meets on Wednesday — the footer sends the reminder instead. */
export const rosterOffSchedule = () => store.set({ openMajelis: 'anggrek', activeTask: null })

// --- The Majelis tab's filters ---------------------------------------------

export const groupsUnfiltered = () => store.set({ majelisDay: null, majelisStatus: null })

/** One day's groups — the "what am I doing Selasa" question. */
export const groupsOneDay = () => store.set({ majelisDay: 'Selasa', majelisStatus: null })

/** The two she is still assembling, each with its shortfall. */
export const groupsDrafts = () => store.set({ majelisDay: null, majelisStatus: 'draft' })

// --- Stage 3: the offers ---------------------------------------------------

const clearGrowth = {
  growthResults: {} as Record<string, GrowthResult>,
  growthReasons: {} as Record<string, string>,
  growthFollowUps: {} as Record<string, GrowthFollowUp>,
}

export const offersNone = () => store.set({ openMajelis: 'mawar', ...clearGrowth })

/** Every outcome the stage can record, on one screen. */
export const offersMixed = () => {
  const [done, carried, declined] = growthMembers()
  store.set({
    openMajelis: 'mawar',
    growthResults: { [done.id]: 'ya', [carried.id]: 'ya', [declined.id]: 'tidak' },
    growthFollowUps: { [done.id]: 'selesai', [carried.id]: 'lanjut' },
    growthReasons: { [declined.id]: 'Sudah punya di tempat lain' },
  })
}

/** Nobody left to pitch — the stage as the BP leaves it. */
export const offersAll = () => {
  const growthResults: Record<string, GrowthResult> = {}
  const growthFollowUps: Record<string, GrowthFollowUp> = {}
  const growthReasons: Record<string, string> = {}
  growthMembers().forEach((m, i) => {
    if (i === 2) {
      growthResults[m.id] = 'tidak'
      growthReasons[m.id] = 'Belum ada kebutuhan'
      return
    }
    growthResults[m.id] = 'ya'
    growthFollowUps[m.id] = i === 1 ? 'lanjut' : 'selesai'
  })
  store.set({ openMajelis: 'mawar', growthResults, growthFollowUps, growthReasons })
}

// --- Stage 4: the proof ----------------------------------------------------

export const visitProofEmpty = () => {
  queueDone()
  store.set({ openMajelis: 'mawar', photo: false, geo: false })
}

export const visitProofCaptured = () => {
  queueDone()
  store.set({ openMajelis: 'mawar', photo: true, geo: true })
}

/** Submittable, but seven mitra never got an outcome — the warning, not a block. */
export const visitProofGaps = () => {
  queueFull()
  store.set({ openMajelis: 'mawar', photo: true, geo: true })
}

// --- The home visit --------------------------------------------------------
//
// Every branch of a door in one panel. Most of them are unreachable by tapping:
// the outcome depends on who answered, and a walkthrough cannot make a house
// empty or a group agree to cover a debt.

/** Wati Nurhasanah, Modal, 63 days behind — task t3. */
const WATI = HOME_MITRA[0]
/** Elin Herlina, GL — task t4, the only door where tanggung renteng is offered. */
const ELIN = HOME_MITRA[1]

/** The door as she arrives: nothing recorded, nothing moved. */
const atDoor = (taskId: string, patch: Partial<AppState> = {}) =>
  store.set({
    day: 'today',
    openHome: taskId,
    activeTask: taskId,
    metWith: {},
    payMode: {},
    partialPtp: {},
    mitraAbsence: {},
    newAddress: {},
    dropOut: {},
    nonPayments: {},
    shortfallReasons: {},
    // The majelis roster keeps its pre-paid seed: a home-visit state should not
    // leave the group screens looking as though nobody has paid anything.
    payments: freshPayments(),
    reschedules: {},
    rejects: {},
    photo: false,
    geo: false,
    ...patch,
  })

export const doorFresh = () => atDoor('t3')

export const doorMetMitra = () => atDoor('t3', { metWith: { [WATI.id]: 'mitra' } })

export const doorMetPj = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'pj' },
    mitraAbsence: { [WATI.id]: 'Sedang berdagang' },
  })

/** A locked door: the visit takes its note here and skips the Tagih step. */
export const doorNobody = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'nobody' },
    nonPayments: { [WATI.id]: { reason: 'Pergi tanpa kabar', ptp: '23 Juli' } },
  })

/**
 * Moved three times already. Only at this count does "Jadwal ulang" also offer
 * to close the visit for good — a state no amount of tapping reaches, because
 * the first two moves happened on days that are not today.
 */
export const doorStuck = () =>
  atDoor('t3', {
    reschedules: { t3: { reason: 'Mitra tidak di tempat', date: '23 Juli', count: 3 } },
  })

// --- The home visit's money step -------------------------------------------

const WATI_OWED = outstandingOf(WATI).total
const ELIN_OWED = outstandingOf(ELIN).total

export const payFull = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'penuh' },
    payments: { ...freshPayments(), [WATI.id]: WATI_OWED },
  })

/** Part of the bill, and a date for the rest — a balance with nothing chasing it
 *  is the gap this outcome exists to close. */
export const payPartial = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'sebagian' },
    payments: { ...freshPayments(), [WATI.id]: Math.round(WATI_OWED / 3) },
    partialPtp: { [WATI.id]: '23 Juli' },
  })

/** Reached, did not pay: a reason and a promise. An outcome, not a blank. */
export const payRefused = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'tidak' },
    nonPayments: { [WATI.id]: { reason: 'Usaha sedang sepi', ptp: '28 Juli' } },
  })

/** She is leaving the programme — neither a payment nor a promise, so it carries
 *  only a reason, and recording it retracts anything else on her. */
export const payDropOut = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'keluar' },
    dropOut: { [WATI.id]: 'Pindah tanpa kabar' },
  })

/** The GL door, where the group can cover her — a full settlement nobody in the
 *  household funded. Modal loans never see this option. */
export const payGroupCovered = () =>
  atDoor('t4', {
    metWith: { [ELIN.id]: 'mitra' },
    payMode: { [ELIN.id]: 'tanggung' },
    payments: { ...freshPayments(), [ELIN.id]: ELIN_OWED },
  })

// --- Closing a home visit --------------------------------------------------

export const doorProofEmpty = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'penuh' },
    payments: { ...freshPayments(), [WATI.id]: WATI_OWED },
  })

/** Photo taken and cash in her bag — submitting goes on to the WhatsApp receipt. */
export const doorProofCash = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'penuh' },
    payments: { ...freshPayments(), [WATI.id]: WATI_OWED },
    photo: true,
    geo: true,
  })

/** Photo taken, nothing collected — submitting returns straight to the schedule. */
export const doorProofNoCash = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'tidak' },
    nonPayments: { [WATI.id]: { reason: 'Usaha sedang sepi', ptp: '28 Juli' } },
    photo: true,
    geo: true,
  })

// --- The doorstep receipt --------------------------------------------------
// A state for the Bukti step, whose receipt sheet is where the message now
// lives. `receiptFull` went with the page it used to seed: "cash at the door"
// is already the doorProofCash state one line above it.

/** A part-payment, so the message carries the balance and the promised date. */
export const receiptPartial = () =>
  atDoor('t3', {
    metWith: { [WATI.id]: 'mitra' },
    payMode: { [WATI.id]: 'sebagian' },
    payments: { ...freshPayments(), [WATI.id]: Math.round(WATI_OWED / 3) },
    partialPtp: { [WATI.id]: '23 Juli' },
    photo: true,
    geo: true,
  })

// --- The bag ---------------------------------------------------------------

const MIDDAY_BANKED = bankedDay.t1.cash + bankedDay.t2.cash

/**
 * Two majelis in the bag by midday — the first handover. Mawar's roster is
 * seeded per mitra (each collectible member paid her bill in cash), so the
 * settlement can open it into individual mitra to pick from; Melati has no
 * roster in this prototype and stays one line. The per-mitra cash sums to
 * Mawar's banked figure, so the two views agree.
 */
export const bagFirstHandover = () => {
  store.set({
    day: 'today',
    doneTasks: ['t0', 't1', 't2', 't2b'],
    remindedTasks: REMINDED,
    sentTasks: ['t0', 't1', 't2', 't2b'],
    payments: mawarPaid(),
    deposits: depositsFor(['t1', 't2']),
    settlements: [],
    depositAmount: null,
    depositDiffReason: null,
    depositMethod: null,
    depositProof: false,
    depositDone: false,
  })
}

/**
 * She is about to declare Rp200.000 less than the app says she is carrying. The
 * disagreement is the point: a gap with a record behind it is something ops can
 * chase, and it cannot be reached by tapping without typing the wrong number.
 */
export const bagShort = () =>
  store.set({
    day: 'today',
    doneTasks: ['t0', 't1', 't2', 't2b'],
    remindedTasks: REMINDED,
    sentTasks: ['t0', 't1', 't2', 't2b'],
    deposits: depositsFor(['t1', 't2']),
    settlements: [],
    depositAmount: MIDDAY_BANKED - 200_000,
    depositDiffReason: null,
    // She has already picked her road and photographed the receipt — the state
    // is a step from confirming, which is what makes the selisih the point.
    depositMethod: 'va',
    depositProof: true,
    depositDone: false,
  })

// --- One mitra's record ----------------------------------------------------

/** 34 days behind — the ledger the collect page argues from. */
export const mitraBehind = () => store.set({ openMitra: 'm1' })

/** Nothing overdue — the same page with no arrears in it. */
export const mitraCurrent = () => store.set({ openMitra: 'm3' })

/** 63 days behind: the arrears deep enough to have earned a home visit. */
export const mitraDeepArrears = () => store.set({ openMitra: WATI.id })

// --- The collect page ------------------------------------------------------
//
// It opens on whatever is already recorded, so the sheet a BP lands on IS the
// outcome she is correcting. Each of these is a different landing.

const atCollect = (mitraId: string, patch: Partial<AppState> = {}) =>
  store.set({
    openMajelis: 'mawar',
    openMitra: mitraId,
    payments: freshPayments(),
    nonPayments: {},
    shortfallReasons: {},
    payMode: {},
    partialPtp: {},
    lastCollect: null,
    ...patch,
  })

export const collectFresh = () => atCollect('m1')

/** Reopened on a part-payment: the amount, its reason, and the promised date. */
export const collectPartial = () =>
  atCollect('m1', {
    payments: { ...freshPayments(), m1: Math.round(outstandingOf(findMitra('m1')).total / 2) },
    shortfallReasons: { m1: 'Uang belum terkumpul semua' },
    payMode: { m1: 'sebagian' },
    partialPtp: { m1: '25 Juli' },
  })

/** Reopened on a recorded no — the refusal sheet, prefilled. */
export const collectRefused = () =>
  atCollect('m1', {
    nonPayments: { m1: { reason: 'Usaha sedang sepi', ptp: 'Sabtu, 25 Juli' } },
    payMode: { m1: 'tidak' },
  })

/** A GL mitra covered by her group. The option exists on GL only, so a Modal
 *  card can never show it. */
export const collectGroupCovered = () =>
  atCollect('m2', {
    payments: { ...freshPayments(), m2: outstandingOf(findMitra('m2')).total },
    payMode: { m2: 'tanggung' },
  })

// --- KPI: the four conditions the scoreboard has to tell apart -------------
//
// Every one of these turns on the gate — collection has to be clear before a
// single growth rupiah is payable — and the page's whole job is that two of
// them show Rp0 for opposite reasons. A BP who reads "sudah kerja tapi Rp0" the
// same way she reads "belum ada capaian" is a BP who stops trying.

/** The running month: DPD 31–90 missed, so the Celengan she won is held. */
export const kpiRunning = () => store.set({ kpiPeriod: 'Juli 2026' })

/** The gate's worst case — every growth target won, every DPD missed. Rp0, and
 *  all of it recoverable if she clears collection before the month closes. */
export const kpiAllHeld = () => store.set({ kpiPeriod: 'gate-zero' })

/** Rp0 with nothing behind it: no target met anywhere, nothing held. */
export const kpiNothingYet = () => store.set({ kpiPeriod: 'nothing-yet' })

/** Everything met — collection clear, so growth pays and the gate is invisible. */
export const kpiAllClear = () => store.set({ kpiPeriod: 'Juni 2026' })

/** Version B's own wipe-out: a score that pays, voided by the boom factor. */
export const kpiBoom = () => store.set({ kpiPeriod: 'boom' })

/** Version B's ceiling: past 100% AND both boosts — Rp600rb + Rp100rb. */
export const kpiBoosted = () => store.set({ kpiPeriod: 'boosted' })

// --- Morning briefing cuts -------------------------------------------------
// The three alternatives the designer flips the morning briefing between. Each
// just writes `morningVariant`; the screen reads it and redraws (see
// `screens/briefing-morning.tsx`).

/** Alt-1 — the single-page checklist, absensi open and ticked as the room fills. */
export const morningDefault = () => store.set({ morningVariant: 'default' })

/** Alt-2 — the same running order, one card per page behind a stepper. */
export const morningStepper = () => store.set({ morningVariant: 'stepper' })

/** Alt-3 — the stepper, but repayment/disbursement/tugas are worked in-app. */
export const morningLive = () => store.set({ morningVariant: 'live' })

/** Alt-4 — Alt-3 with the tugas step dissolved into the two books. */
export const morningMerged = () => store.set({ morningVariant: 'merged' })

/** Alt-5 — Alt-4 with the meters replaced by spoken pointers. */
export const morningPointer = () => store.set({ morningVariant: 'pointer' })
