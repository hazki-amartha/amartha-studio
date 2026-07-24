'use client'

// Project-local module store. Screens remount on every go()/back(), so anything
// that must survive navigation lives here — and in this direction that is nearly
// everything, because collecting from one mitra is a three-screen round trip
// (list → her page → collect → success → back to the list) rather than a bottom
// sheet that holds its own state.
//
// Payment is an AMOUNT, not a flag: a mitra can hand over part of what she owes,
// which is the outcome this whole direction is built to record properly.

import { useSyncExternalStore } from 'react'
import { MAJELIS, PREPAID, findMitra, isSelfServe, outstandingOf, type Mitra } from './data'
import {
  SEED_LEADS,
  findEvent,
  type ContactResult,
  type Interest,
  type Lead,
  type LeadStage,
  type SosialisasiEvent,
} from './leads'
import {
  DEPOSIT,
  TASKS,
  findMajelisEntry,
  findTask,
  taskForMajelis,
  vaFor,
  type DayKey,
  type MajelisEntry,
  type MajelisStatus,
  type Task,
} from './schedule'

/** Who actually answered the door on a home visit. */
export type MetWith = 'mitra' | 'pj' | 'nobody'

/**
 * The outcome picked inline on a home visit.
 * - `penuh`    — she cleared the whole bill herself.
 * - `sebagian` — a part-payment, with a promise for the rest.
 * - `tanggung` — the group covered her under tanggung renteng (joint liability):
 *                a full settlement funded by the majelis, not by the mitra. The
 *                "PAR payment" a collections door exists to reach.
 * - `tidak`    — reached, but did not pay: a reason and maybe a promise.
 * - `keluar`   — she is dropping out of the program. A flag with a reason, not a
 *                payment — recorded here so ops can pick the case up.
 */
export type PayMode = 'penuh' | 'sebagian' | 'tanggung' | 'tidak' | 'keluar'

export type Attendance = 'hadir' | 'tidak'

/**
 * Where a mitra stands on this visit.
 * - `belum`    — nothing recorded; the BP hasn't reached her.
 * - `sebagian` — she paid part of what she owes.
 * - `lunas`    — everything outstanding is settled.
 * - `tidak`    — recorded as not paying, with a reason and maybe a promise. An
 *                OUTCOME, not the absence of one: "she said no, here's why,
 *                here's when" is a result the BP can close and ops can chase.
 */
export type CollectStatus = 'belum' | 'sebagian' | 'lunas' | 'tidak'

/** Why she isn't paying, and when she says she will. */
export interface NonPayment {
  reason: string
  /** Promise to pay. Null = none given; not every no comes with a next date. */
  ptp: string | null
}

/** What the mitra said to a growth offer. */
export type GrowthResult = 'ya' | 'tidak'

/**
 * What happened to a YES. "Tertarik" is not an outcome on its own — a celengan
 * she agreed to and one that was actually opened are the same record until this
 * says otherwise, and the difference is whether next week's BP has to bring it
 * up again.
 */
export type GrowthFollowUp = 'selesai' | 'lanjut'

/**
 * What one finished task contributed to the day's cash, banked at the moment it
 * was submitted.
 *
 * It has to be a SNAPSHOT: `payments` is scoped to the open majelis and is reset
 * by the next `startVisit`, so by the time the BP reaches the closing task the
 * money from her first two groups is no longer in state. Recording the totals
 * when the task closes is also the honest model — the deposit owes what she
 * submitted, not what the roster currently says.
 */
export interface DepositEntry {
  taskId: string
  label: string
  /** "7 mitra" — what the amount is made of. */
  detail: string
  /** Physical money in her bag. The only figure the deposit is about. */
  cash: number
  /** Paid by the mitra herself, digitally. Never passed through the BP. */
  digital: number
}

/**
 * What the success screen reads back. It is written at the moment of collection
 * rather than recomputed on arrival, because by then the store has already
 * absorbed the payment and "sisa sebelum ini" would no longer be recoverable.
 */
export interface LastCollect {
  mitraId: string
  /** What she owed when the BP opened the page. */
  owed: number
  /** What she just handed over. */
  paid: number
}

/**
 * One handover of cash to the branch.
 *
 * A day can have up to three. That is not a convenience — it is the shape of
 * the risk: a BP carrying six hours of collections on a motorbike is the single
 * largest exposure in this flow, and the fix is to let her put it down twice
 * before the day ends rather than once at 17.45.
 *
 * Each one takes EVERYTHING outstanding. Partial settlement would mean the app
 * holding an opinion about which rupiah in her bag belongs to which pelayanan,
 * which it cannot check and she cannot separate — and a BP who can choose the
 * amount is a BP who can be asked to explain why she chose it.
 */
export interface Settlement {
  /** 1-based. Also picks the VA, so each transfer reconciles on its own. */
  no: number
  /** What she says she actually transferred. */
  amount: number
  /**
   * What the app's ledger said she was carrying. Kept beside `amount` rather
   * than recomputed, because the whole point of the pair is that they can
   * disagree — and once the entries are settled the expected figure is no
   * longer derivable from anything on screen.
   */
  expected: number
  /**
   * Why the two differ. Nothing sets this from the settlement screen any more —
   * the reason list came off, because a BP at a counter who has already
   * transferred was being asked to pick from five guesses the app made on her
   * behalf. The DIFFERENCE is still recorded, and that is what ops chases; the
   * why is a conversation, and the field stays for whatever records one.
   */
  diffReason: string | null
  /** The finished tasks whose cash this covered. */
  taskIds: string[]
  va: string
  /** "13.20" — when she sent it. */
  at: string
  /** Done from the closing task rather than mid-day from the schedule. */
  closing: boolean
}

export interface AppState {
  /** mitraId → hadir/tidak. Absent = not marked yet. */
  attendance: Record<string, Attendance>
  /**
   * mitraId → why she wasn't at the majelis. Recorded at the moment she is
   * marked `tidak`, before her card leaves the register: an absence with no
   * reason is the same unauditable gap in the record that a half-marked
   * register is, and the person reading it later wasn't in the room to guess.
   */
  absenceReasons: Record<string, string>
  /** mitraId → rupiah collected this visit. Absent = nothing recorded. */
  payments: Record<string, number>
  /** mitraId → why she isn't paying. Absent = no such outcome recorded. */
  nonPayments: Record<string, NonPayment>
  /**
   * mitraId → why she handed over less than the bill. A part-payment leaves a
   * balance exactly as a refusal does, and a balance nobody wrote a reason
   * against is the same unchaseable gap — "Ibu bayar 200 dari 650" tells next
   * week's BP nothing about whether to expect the rest. Absent = she paid in
   * full, or nothing was recorded.
   */
  shortfallReasons: Record<string, string>
  /** mitraId → what she said to her growth offer. Absent = not pitched. */
  growthResults: Record<string, GrowthResult>
  /**
   * mitraId → why she said no to the offer. Recorded alongside a `tidak`
   * result: "tidak tertarik" alone tells next week's BP nothing about whether
   * to pitch again, and an offer with no reason on file gets either re-pushed
   * blindly or dropped for good. Absent = interested, or not yet answered.
   */
  growthReasons: Record<string, string>
  /**
   * mitraId → whether her YES was finished on the spot or carried to the next
   * kumpulan. Absent = she said no, or nothing recorded.
   */
  growthFollowUps: Record<string, GrowthFollowUp>
  /** Which mitra the mitra page and collect page render. */
  openMitra: string
  /** The receipt the success screen prints. Null before any collection. */
  lastCollect: LastCollect | null
  /** Proof photo captured. Gates submission. */
  photo: boolean
  /**
   * Location recorded. Gates submission alongside the photo: a photo proves
   * something happened, a location proves it happened HERE, and only the pair
   * makes a visit verifiable after the fact.
   */
  geo: boolean

  // --- L0: the schedule ----------------------------------------------------

  /**
   * Which day the schedule tab is showing. In the store rather than useState
   * because the schedule remounts every time the BP comes back to the tab, and
   * silently snapping back to "hari ini" would undo a deliberate choice.
   */
  day: DayKey
  /** Task ids finished today. Drives the focus card and the KPI count. */
  doneTasks: string[]
  /**
   * Task ids she has OPENED but not finished. Without this, a visit abandoned
   * halfway — she started the register, the group scattered, she rode on — is
   * indistinguishable from one never touched, and "Dikerjakan" is exactly the
   * state a BP needs to find again at the end of the day.
   */
  startedTasks: string[]
  /**
   * Task ids whose record has reached the server. Finishing and SENDING are
   * different events here for the reason they are different in the field: she
   * closes a visit standing in a balai with no signal, and the record sits on
   * the handset until it can go. A day that shows work as "selesai" while
   * nothing has left the phone is how a BP finds out on Friday that Tuesday
   * never landed.
   */
  sentTasks: string[]
  /**
   * The task the open pelayanan belongs to, so submitting the recap closes the
   * right row on the schedule. Null when the roster was opened from the Majelis
   * tab instead, where the task is recovered from the group itself.
   */
  activeTask: string | null
  /**
   * Which group the roster and the three stages render. Set by the schedule and
   * by the Majelis tab, so a pelayanan opened either way names itself correctly
   * and — the reason it is in the store rather than a route param — so
   * submitting can find the schedule row it belongs to.
   */
  openMajelis: string
  /**
   * The Majelis tab's two filters. They live here rather than in the screen
   * because a BP filters to Kamis, opens a group, comes back — and a filter
   * that resets on the way back is one she stops trusting and stops using.
   * The search box does NOT: a query is a question she just asked and finished.
   */
  majelisDay: string | null
  majelisStatus: MajelisStatus | null

  // --- Home visit ----------------------------------------------------------

  /** Which home-visit task the two home screens render. */
  openHome: string
  /**
   * mitraId → who answered the door. ONE question with three answers, rather
   * than the flowchart's nested "met mitra? → met PJ? → met neighbour?": all
   * three ask who the BP talked to.
   */
  metWith: Record<string, MetWith>
  /** mitraId → the payment outcome picked inline at the door. */
  payMode: Record<string, PayMode>
  /**
   * mitraId → when she promises the REST, after a part-payment. Separate from
   * `nonPayments`: a part-payment is not a refusal, so it carries no reason —
   * but it does leave a balance, and a balance with no date is the same
   * unchased gap as an unrecorded no.
   */
  partialPtp: Record<string, string | null>
  /** mitraId → her new address, when the reason given is "Pindah rumah". */
  newAddress: Record<string, string>
  /**
   * mitraId → why the mitra herself was not present at a home visit. Recorded
   * when the BP met the PJ or found nobody home: the outcome of the visit turns
   * on who she dealt with, but the record ops reads later has to say why the
   * borrower was absent, not only that someone else answered.
   */
  mitraAbsence: Record<string, string>
  /**
   * mitraId → why she is dropping out of the program. Presence IS the drop-out:
   * a `keluar` outcome is not a payment and not a promise, so it carries only a
   * reason, and recording one retracts any money or refusal left on her.
   */
  dropOut: Record<string, string>
  /**
   * taskId → the visit the BP moved to another day, with why and when. A home
   * visit she can't or won't work today doesn't vanish and isn't "done" — it is
   * rescheduled, and the schedule has to say so rather than leave a locked door
   * looking like unfinished work.
   */
  reschedules: Record<string, { reason: string; date: string }>

  // --- The daily close -----------------------------------------------------

  /** taskId → what that finished task put in her bag. Written by `finishTask`. */
  deposits: Record<string, DepositEntry>
  /**
   * Every handover so far today, oldest first. Up to three: two she can time
   * herself from the schedule, and a third that is the closing task.
   */
  settlements: Settlement[]
  /**
   * What she actually handed over, in rupiah. Null until she confirms — it is
   * seeded from the computed total the moment she opens the closing task, so
   * agreeing is a tap and disagreeing is the deliberate act.
   */
  depositAmount: number | null
  /** Why her figure differs from the app's. Required when the two disagree. */
  depositDiffReason: string | null
  /** Photo of the transfer receipt. Gates submission, as on every visit. */
  depositProof: boolean
  /** Submitted. Not "verified" — the branch confirms that, and it isn't today. */
  depositDone: boolean

  // --- NTB: prospects ------------------------------------------------------

  /**
   * Every lead, by id. A record rather than a list because a follow-up updates
   * one prospect from three different screens and none of them should be
   * scanning an array to find her.
   */
  leads: Record<string, Lead>
  /** Capture order — the only order a sosialisasi list can honestly be in. */
  leadOrder: string[]
  /** Which prospect the lead page and the follow-up screen render. */
  openLead: string
  /** Which sosialisasi the event screen renders. */
  openEvent: string
  /**
   * Follow-up tasks the BP created today for a LATER day. They are stored
   * rather than derived because a promise to call is made once and has to
   * survive every navigation after it — and because the schedule shows them on
   * a day that has no roster of its own yet.
   */
  scheduled: Task[]
  /**
   * The follow-up being filled in. In the store rather than `useState` for the
   * usual reason plus a specific one: the screen offers a jump to "Lengkapi
   * data" on the lead's record — a BP who discovers mid-call that she never
   * took an address must be able to go and take it — and a local draft would
   * be wiped by exactly the navigation the screen invites.
   */
  followUp: FollowUpDraft
}

/** What the BP is recording about one call, before she saves it. */
export interface FollowUpDraft {
  leadId: string
  /** Which button she tapped to reach her. */
  via: 'wa' | 'telepon'
  /** Whether the call landed at all. Null until answered. */
  contact: ContactResult | null
  interest: Interest | null
  /** What happens to the prospect now. */
  next: 'siap' | 'lanjut' | 'tidak' | null
  reason: string
  followUpAt: string | null
  /** Distinguishes "chose no follow-up" from "hasn't chosen yet". */
  followUpPicked: boolean
  note: string
}

const emptyFollowUp = (leadId: string): FollowUpDraft => ({
  leadId,
  via: 'wa',
  contact: null,
  interest: null,
  next: null,
  reason: '',
  followUpAt: null,
  followUpPicked: false,
  note: '',
})

// The 15 who settled before the visit opened: present, and paid in full.
const seedPayments: Record<string, number> = {}
const seedAttendance: Record<string, Attendance> = {}
PREPAID.forEach((m) => {
  seedPayments[m.id] = outstandingOf(m).total
  seedAttendance[m.id] = 'hadir'
})

const seedLeads: Record<string, Lead> = {}
SEED_LEADS.forEach((l) => {
  seedLeads[l.id] = l
})

const initial: AppState = {
  attendance: seedAttendance,
  absenceReasons: {},
  payments: seedPayments,
  nonPayments: {},
  shortfallReasons: {},
  growthResults: {},
  growthReasons: {},
  growthFollowUps: {},
  openMitra: 'm1',
  lastCollect: null,
  photo: false,
  geo: false,
  day: 'today',
  doneTasks: [],
  startedTasks: [],
  sentTasks: [],
  activeTask: null,
  openMajelis: 'mawar',
  majelisDay: null,
  majelisStatus: null,
  openHome: 't3',
  metWith: {},
  payMode: {},
  partialPtp: {},
  newAddress: {},
  mitraAbsence: {},
  dropOut: {},
  reschedules: {},
  deposits: {},
  settlements: [],
  depositAmount: null,
  depositDiffReason: null,
  depositProof: false,
  depositDone: false,
  leads: seedLeads,
  leadOrder: SEED_LEADS.map((l) => l.id),
  openLead: 'l1',
  openEvent: 'e1',
  scheduled: [],
  followUp: emptyFollowUp('l1'),
}

let state: AppState = initial

const listeners = new Set<() => void>()

function emit() {
  // forEach (not for..of) — the repo's tsconfig target predates Set iteration.
  listeners.forEach((l) => l())
}

/**
 * What the just-finished task contributed to the day's cash.
 *
 * The split is the whole point: a mitra who settled through the app paid the
 * company directly and her money is not in the BP's bag. Counting it into the
 * deposit is how a BP ends up short at the counter with nothing to show for it.
 */
function snapshotDeposit(taskId: string): DepositEntry | null {
  const task = findTask(taskId)
  if (!task) return null

  if (task.kind === 'home-visit') {
    const mitra = findMitra(task.mitraId ?? 'h1')
    const cash = state.payments[mitra.id] ?? 0
    // Nothing collected is not a deposit line. A visit that ended in a promise
    // is finished work, and listing it at Rp0 would pad the receipt.
    if (cash <= 0) return null
    return { taskId, label: task.title, detail: mitra.name, cash, digital: 0 }
  }

  let cash = 0
  let digital = 0
  let payers = 0
  MAJELIS.members.forEach((m) => {
    const paid = state.payments[m.id] ?? 0
    if (paid <= 0) return
    if (isSelfServe(m)) digital += paid
    else {
      cash += paid
      payers += 1
    }
  })
  if (cash <= 0 && digital <= 0) return null
  return { taskId, label: task.title, detail: `${payers} mitra tunai`, cash, digital }
}

/**
 * Turns a promise to call into a task on the day it falls.
 *
 * Only dates the schedule can actually render get a task — in this prototype
 * that is tomorrow. A lead due in three months keeps her date on her record and
 * nothing appears anywhere, which is the honest depiction: the app is holding
 * October for her, and October is not a screen.
 *
 * Keyed by lead id, so re-scheduling a prospect MOVES her call rather than
 * booking a second one. A BP who changes her mind twice should not arrive
 * tomorrow to three identical rows.
 */
function scheduleFollowUp(current: Task[], lead: Lead, tomorrow: boolean): Task[] {
  const rest = current.filter((t) => t.leadId !== lead.id)
  if (!tomorrow || !lead.followUpAt) return rest
  // Staggered into the morning gap on tomorrow's roster (08.30 majelis, 11.00
  // door), so several promises made today don't stack on one minute.
  const slot = 15 + rest.length * 30
  const time = `${String(9 + Math.floor(slot / 60)).padStart(2, '0')}.${String(slot % 60).padStart(2, '0')}`
  return [
    ...rest,
    {
      id: `f-${lead.id}`,
      kind: 'follow-up',
      time,
      until: time,
      title: `Follow Up: Ibu ${lead.name}`,
      place: 'WhatsApp / telepon',
      reason: lead.reason || 'Dijanjikan dihubungi kembali',
      leadId: lead.id,
    },
  ]
}

/** Adds a task to the started list once, ignoring a null id. */
const withStarted = (started: string[], taskId: string | null): string[] =>
  !taskId || started.includes(taskId) ? started : [...started, taskId]

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

  /**
   * Starts the pelayanan over — the schedule's "Mulai Pelayanan", which jumps
   * straight past the roster into stage 1, and the roster's own button.
   *
   * `taskId` is passed only when the schedule opened it. It is not required for
   * the schedule row to be ticked afterwards, though: `finishTask` recovers the
   * task from the group when there isn't one, so a BP who reached the group
   * through the Majelis tab still finishes the day's work by doing it.
   */
  startVisit(majelisId: string, taskId: string | null = null) {
    store.set({
      attendance: seedAttendance,
      absenceReasons: {},
      payments: seedPayments,
      nonPayments: {},
      shortfallReasons: {},
      growthResults: {},
      growthReasons: {},
      growthFollowUps: {},
      lastCollect: null,
      photo: false,
      geo: false,
      openMajelis: majelisId,
      activeTask: taskId,
      startedTasks: withStarted(state.startedTasks, taskId),
    })
  },
  /** Opens a group's roster from the Majelis tab, without starting any work. */
  openMajelisPage(majelisId: string) {
    store.set({ openMajelis: majelisId })
  },
  setMajelisDay(day: string | null) {
    store.set({ majelisDay: day })
  },
  setMajelisStatus(status: MajelisStatus | null) {
    store.set({ majelisStatus: status })
  },
  resetMajelisFilters() {
    store.set({ majelisDay: null, majelisStatus: null })
  },
  /**
   * Opens the closing task. The amount is seeded from what the day banked, so
   * the BP's first act is to agree or disagree with a figure, never to type one
   * from memory — she has just carried this money through five stops.
   */
  /**
   * Opens the settlement screen from the SCHEDULE rather than from the closing
   * task. No `activeTask`, deliberately: a mid-day handover must not be able to
   * tick the day's closing row, which is still ahead of her with an afternoon's
   * collections to go.
   */
  openSettlement() {
    store.set({
      activeTask: null,
      depositAmount: null,
      depositDiffReason: null,
      depositProof: false,
    })
  },
  startDeposit(taskId: string) {
    store.set({
      activeTask: taskId,
      depositAmount: depositExpected(state),
      depositDiffReason: null,
      startedTasks: withStarted(state.startedTasks, taskId),
    })
  },
  /** Opens a home visit from the schedule. */
  startHomeVisit(taskId: string) {
    store.set({
      openHome: taskId,
      activeTask: taskId,
      photo: false,
      geo: false,
      startedTasks: withStarted(state.startedTasks, taskId),
    })
  },
  setMetWith(mitraId: string, value: MetWith) {
    store.set({ metWith: { ...state.metWith, [mitraId]: value } })
  },
  setPayMode(mitraId: string, value: PayMode) {
    store.set({ payMode: { ...state.payMode, [mitraId]: value } })
  },
  setPartialPtp(mitraId: string, value: string | null) {
    store.set({ partialPtp: { ...state.partialPtp, [mitraId]: value } })
  },
  setNewAddress(mitraId: string, value: string) {
    store.set({ newAddress: { ...state.newAddress, [mitraId]: value } })
  },
  setMitraAbsence(mitraId: string, value: string) {
    store.set({ mitraAbsence: { ...state.mitraAbsence, [mitraId]: value } })
  },
  /**
   * Records a drop-out. It is neither a payment nor a promise, so it retracts
   * both — a mitra leaving the program cannot also be carrying a part-payment or
   * a janji bayar in the same record.
   */
  setDropOut(mitra: Mitra, reason: string) {
    const payments = { ...state.payments }
    delete payments[mitra.id]
    const nonPayments = { ...state.nonPayments }
    delete nonPayments[mitra.id]
    const shortfallReasons = { ...state.shortfallReasons }
    delete shortfallReasons[mitra.id]
    const partialPtp = { ...state.partialPtp }
    delete partialPtp[mitra.id]
    store.set({
      payments,
      nonPayments,
      shortfallReasons,
      partialPtp,
      dropOut: { ...state.dropOut, [mitra.id]: reason },
      lastCollect: null,
    })
  },
  /** Reverses a drop-out — picked when the BP switches to another outcome. */
  clearDropOut(mitraId: string) {
    if (state.dropOut[mitraId] === undefined) return
    const dropOut = { ...state.dropOut }
    delete dropOut[mitraId]
    store.set({ dropOut })
  },
  /**
   * Moves a visit to another day. It leaves `doneTasks` untouched — a
   * rescheduled visit is not finished — and clears any half-started state, since
   * a door the BP rode away from is no longer in progress today.
   */
  rescheduleTask(taskId: string, reason: string, date: string) {
    store.set({
      reschedules: { ...state.reschedules, [taskId]: { reason, date } },
      startedTasks: state.startedTasks.filter((id) => id !== taskId),
    })
  },
  setDay(day: DayKey) {
    store.set({ day })
  },
  /**
   * Closes the schedule row the finished visit belongs to.
   *
   * Falls back to the group's own scheduled slot when no task was carried in —
   * a pelayanan opened from the Majelis tab is the same work as the one the day
   * rostered, and leaving it open on the schedule would ask the BP to do it
   * twice. Only the route differed.
   */
  finishTask() {
    const id = state.activeTask ?? taskForMajelis(state.openMajelis)?.id
    if (!id || state.doneTasks.includes(id)) {
      store.set({ activeTask: null })
      return
    }
    // Bank what this task put in her bag before the next visit resets the
    // roster. The closing task adds these up rather than re-reading a roster
    // that has moved on.
    const entry = snapshotDeposit(id)
    store.set({
      doneTasks: [...state.doneTasks, id],
      activeTask: null,
      deposits: entry ? { ...state.deposits, [id]: entry } : state.deposits,
    })
  },
  // --- NTB: prospects ------------------------------------------------------

  /** Opens a sosialisasi from the schedule. */
  startSosialisasi(taskId: string) {
    store.set({
      activeTask: taskId,
      openEvent: findTask(taskId)?.eventId ?? 'e1',
      startedTasks: withStarted(state.startedTasks, taskId),
    })
  },
  /** Opens a follow-up from the schedule — the rostered call. */
  startFollowUp(taskId: string) {
    const leadId = findTask(taskId)?.leadId ?? 'l1'
    store.set({
      activeTask: taskId,
      openLead: leadId,
      followUp: emptyFollowUp(leadId),
      startedTasks: withStarted(state.startedTasks, taskId),
    })
  },
  /**
   * Opens a follow-up from the prospect's own record.
   *
   * RESUMES rather than resets when the draft already belongs to this lead —
   * this is the return leg of the "Lengkapi data" round trip, and starting over
   * would punish the BP for going to fetch the very field the screen asked her
   * for. A saved follow-up leaves an empty draft behind, so resuming one is
   * indistinguishable from starting one.
   *
   * Otherwise `activeTask` is cleared: an off-schedule call must NOT run
   * `finishTask`, which falls back to the open majelis when there is no task
   * and would tick a pelayanan the BP hasn't done.
   */
  openFollowUp(leadId: string) {
    if (state.followUp.leadId === leadId) {
      store.set({ openLead: leadId })
      return
    }
    store.set({ activeTask: null, openLead: leadId, followUp: emptyFollowUp(leadId) })
  },
  setFollowUpDraft(patch: Partial<FollowUpDraft>) {
    store.set({ followUp: { ...state.followUp, ...patch } })
  },
  openLeadPage(leadId: string) {
    store.set({ openLead: leadId })
  },

  /**
   * Captures a prospect — the QUICK tier only (see `leads.ts`). Everything the
   * lengkap tier asks for lands empty and shows up as a gap on her record page,
   * which is the design: an empty field the app names is homework, an empty
   * field it hides is a lead nobody can submit and nobody knows why.
   */
  addLead(draft: {
    name: string
    phone: string
    source: Lead['source']
    referredBy: string
    referralKind: Lead['referralKind']
    interest: Interest
    followUpAt: string | null
    followUpTomorrow: boolean
    note: string
  }) {
    const id = `l${state.leadOrder.length + 1}`
    const event = findEvent(state.openEvent)
    const lead: Lead = {
      id,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      source: draft.source,
      referredBy: draft.source === 'referral' ? draft.referredBy.trim() : '',
      referralKind: draft.source === 'referral' ? draft.referralKind : null,
      interest: draft.interest,
      followUpAt: draft.followUpAt,
      address: '',
      // A referral already names the group she would join — that is what being
      // referred BY a mitra means — so it is the one lengkap field a referral
      // arrives with. A cold sosialisasi lead has no answer to it yet.
      majelisId: null,
      hasOtherLoan: null,
      otherLoan: null,
      stage: draft.interest === 'tidak' ? 'tidak' : 'baru',
      reason: '',
      note: draft.note.trim(),
      eventId: event.id,
      log: [
        {
          at: '21 Juli',
          via: 'sosialisasi',
          outcome: `${draft.interest === 'tidak' ? 'Tidak tertarik' : 'Minat ' + draft.interest} · ${
            draft.followUpAt ? `follow up ${draft.followUpAt}` : 'tanpa follow up'
          }`,
          note: draft.note.trim(),
        },
      ],
    }
    store.set({
      leads: { ...state.leads, [id]: lead },
      leadOrder: [...state.leadOrder, id],
      scheduled: scheduleFollowUp(state.scheduled, lead, draft.followUpTomorrow),
    })
  },

  /** The lengkap tier, edited field by field on the lead's record page. */
  updateLead(leadId: string, patch: Partial<Lead>) {
    const lead = state.leads[leadId]
    if (!lead) return
    store.set({ leads: { ...state.leads, [leadId]: { ...lead, ...patch } } })
  },

  /**
   * Closes a follow-up: what happened on the call, and what it changed.
   *
   * The log entry is written HERE rather than left to the screen, because the
   * history is the only thing that survives a lead being handed to another BP,
   * and a record that depends on a screen remembering to append is a record
   * with holes in it.
   */
  recordFollowUp(
    leadId: string,
    result: {
      contact: ContactResult
      via: 'wa' | 'telepon'
      interest: Interest | null
      stage: LeadStage
      reason: string
      followUpAt: string | null
      followUpTomorrow: boolean
      note: string
      outcome: string
    },
  ) {
    const lead = state.leads[leadId]
    if (!lead) return
    const next: Lead = {
      ...lead,
      interest: result.interest ?? lead.interest,
      stage: result.stage,
      reason: result.reason,
      followUpAt: result.followUpAt,
      note: result.note.trim() || lead.note,
      log: [
        ...lead.log,
        { at: '21 Juli', via: result.via, outcome: result.outcome, note: result.note.trim() },
      ],
    }
    store.set({
      leads: { ...state.leads, [leadId]: next },
      scheduled: scheduleFollowUp(state.scheduled, next, result.followUpTomorrow),
      // Spent. Leaving it would let the next visit to her record resume a call
      // that already happened.
      followUp: emptyFollowUp(leadId),
    })
  },

  openMitraPage(mitraId: string) {
    store.set({ openMitra: mitraId })
  },
  setAttendance(mitraId: string, value: Attendance) {
    // Marking present clears any absence reason left behind by a mis-tapped
    // "Tidak" — she was here, so why she wasn't is no longer true.
    const absenceReasons = { ...state.absenceReasons }
    if (value === 'hadir') delete absenceReasons[mitraId]
    store.set({ attendance: { ...state.attendance, [mitraId]: value }, absenceReasons })
  },
  /**
   * Records WHY she isn't here. Marking "Tidak" and giving the reason are two
   * taps on one card now — the card stays where it is and simply grows the
   * reason list — so the absence lands first and this completes it.
   */
  setAbsent(mitraId: string, reason: string) {
    store.set({
      attendance: { ...state.attendance, [mitraId]: 'tidak' },
      absenceReasons: { ...state.absenceReasons, [mitraId]: reason },
    })
  },
  /** Reopens the reason list on a card already marked absent — its "Ubah". */
  clearAbsenceReason(mitraId: string) {
    const absenceReasons = { ...state.absenceReasons }
    delete absenceReasons[mitraId]
    store.set({ absenceReasons })
  },
  /** Puts a mitra back in the unmarked list — the "Ubah" on a recorded row. */
  clearAttendance(mitraId: string) {
    const attendance = { ...state.attendance }
    const absenceReasons = { ...state.absenceReasons }
    delete attendance[mitraId]
    delete absenceReasons[mitraId]
    store.set({ attendance, absenceReasons })
  },
  /**
   * Records the rupiah actually handed over. Money clears any "tidak bayar" on
   * file: she paid, so the reason she gave for not paying is no longer true and
   * must not linger under her name in the recap.
   */
  collect(mitra: Mitra, amount: number, shortfallReason?: string) {
    const nonPayments = { ...state.nonPayments }
    delete nonPayments[mitra.id]
    const shortfallReasons = { ...state.shortfallReasons }
    if (shortfallReason) shortfallReasons[mitra.id] = shortfallReason
    else delete shortfallReasons[mitra.id]
    store.set({
      payments: { ...state.payments, [mitra.id]: amount },
      nonPayments,
      shortfallReasons,
      lastCollect: { mitraId: mitra.id, owed: outstandingOf(mitra).total, paid: amount },
    })
  },
  /** Records a no with its reason and, if given, when she promises to pay. */
  setNonPayment(mitra: Mitra, value: NonPayment) {
    // A refusal and a payment are mutually exclusive outcomes, so recording one
    // has to retract the other — otherwise correcting a mis-tapped payment would
    // leave the money on file under a mitra the recap lists as refusing.
    const payments = { ...state.payments }
    delete payments[mitra.id]
    const shortfallReasons = { ...state.shortfallReasons }
    delete shortfallReasons[mitra.id]
    store.set({
      payments,
      shortfallReasons,
      nonPayments: { ...state.nonPayments, [mitra.id]: value },
      lastCollect: null,
    })
  },
  /**
   * Records what the mitra said to an offer, not merely that she was asked. A
   * `tidak` carries the reason she gave; a `ya` clears any reason left behind
   * by a corrected no — she's interested now, so the old refusal isn't true.
   */
  setGrowthResult(
    mitraId: string,
    result: GrowthResult,
    reason?: string,
    followUp?: GrowthFollowUp,
  ) {
    const growthReasons = { ...state.growthReasons }
    if (result === 'tidak' && reason) growthReasons[mitraId] = reason
    else delete growthReasons[mitraId]

    // The two branches are exclusive: a no has a reason, a yes has a follow-up,
    // and re-answering has to clear whichever no longer applies or the card
    // reads back the previous answer's tail.
    const growthFollowUps = { ...state.growthFollowUps }
    if (result === 'ya' && followUp) growthFollowUps[mitraId] = followUp
    else delete growthFollowUps[mitraId]

    store.set({
      growthResults: { ...state.growthResults, [mitraId]: result },
      growthReasons,
      growthFollowUps,
    })
  },
  /**
   * Sends every finished task that hasn't gone yet. One button for the batch
   * rather than a send per row: they queued because there was no signal, and
   * signal returns for all of them at once.
   */
  sendPending() {
    const pending = state.doneTasks.filter((id) => !state.sentTasks.includes(id))
    if (pending.length === 0) return
    store.set({ sentTasks: [...state.sentTasks, ...pending] })
  },
  setDepositAmount(depositAmount: number | null) {
    // Agreeing with the app clears any difference already explained — there is
    // no longer a gap for the reason to be about.
    store.set({
      depositAmount,
      depositDiffReason: depositAmount === depositExpected(state) ? null : state.depositDiffReason,
    })
  },
  setDepositDiffReason(depositDiffReason: string | null) {
    store.set({ depositDiffReason })
  },
  setDepositProof(depositProof: boolean) {
    store.set({ depositProof })
  },
  /**
   * Hands over everything outstanding. There is no amount argument on purpose:
   * a settlement takes the whole bag, and the only thing the BP chooses is
   * WHEN. `closing` says which door she came through, because the third one is
   * the closing task and the first two are hers to time.
   */
  settle(closing: boolean) {
    const entries = unsettledEntries(state)
    if (entries.length === 0) return
    const no = state.settlements.length + 1
    const expected = entries.reduce((sum, e) => sum + e.cash, 0)
    // What she SAYS she transferred, which is the whole point of the confirm
    // step. This used to record `expected` regardless, so a BP who declared
    // Rp15.000 short — and picked a reason for it — was written down as having
    // handed over the full amount, with the reason attached to nothing. The
    // gap is the record ops chases; losing it is losing the only trace of it.
    const amount = state.depositAmount ?? expected
    const at = closing ? '17.45' : ['11.40', '15.10'][state.settlements.length] ?? '16.20'
    store.set({
      settlements: [
        ...state.settlements,
        {
          no,
          amount,
          expected,
          diffReason: amount === expected ? null : state.depositDiffReason,
          taskIds: entries.map((e) => e.taskId),
          va: vaFor(no),
          at,
          closing,
        },
      ],
      // The next settlement starts clean — its own proof, its own agreement.
      depositProof: false,
      depositAmount: null,
      depositDiffReason: null,
    })
  },
  submitDeposit() {
    store.set({ depositDone: true })
  },
  setPhoto(photo: boolean) {
    store.set({ photo })
  },
  setGeo(geo: boolean) {
    store.set({ geo })
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

// --- Derivations -----------------------------------------------------------

export const paidOf = (s: AppState, mitra: Mitra): number => s.payments[mitra.id] ?? 0

export const remainingOf = (s: AppState, mitra: Mitra): number =>
  Math.max(0, outstandingOf(mitra).total - paidOf(s, mitra))

export function collectStatus(s: AppState, mitra: Mitra): CollectStatus {
  const paid = paidOf(s, mitra)
  // Money wins over a recorded no — `collect` clears the no, but read it in the
  // same order so the two can never disagree.
  if (paid > 0) return paid >= outstandingOf(mitra).total ? 'lunas' : 'sebagian'
  return s.nonPayments[mitra.id] ? 'tidak' : 'belum'
}

// --- Stage 1: attendance ---------------------------------------------------

export const markedCount = (s: AppState): number =>
  MAJELIS.members.filter((m) => s.attendance[m.id]).length

export const presentCount = (s: AppState): number =>
  MAJELIS.members.filter((m) => s.attendance[m.id] === 'hadir').length

/**
 * Her attendance is fully recorded: present, or absent WITH a reason. An
 * absence without a reason is a half-written line in the register — the mark
 * lands the moment "Tidak" is tapped so the card can show it, but the record
 * isn't done until the reason is on file.
 */
export const attendanceSettled = (s: AppState, mitra: Mitra): boolean =>
  s.attendance[mitra.id] === 'hadir' ||
  (s.attendance[mitra.id] === 'tidak' && !!s.absenceReasons[mitra.id])

export const settledCount = (s: AppState): number =>
  MAJELIS.members.filter((m) => attendanceSettled(s, m)).length

/**
 * The gate. Collection does not open until every mitra has been recorded one
 * way or the other — the reference direction is explicit that attendance is
 * completed first, and a half-marked register is the thing that makes a majelis
 * record unauditable later.
 */
export const attendanceComplete = (s: AppState): boolean =>
  settledCount(s) === MAJELIS.members.length

// --- Stage 2: collection ---------------------------------------------------

/** Nobody has recorded an outcome for her yet — the queue. */
export const pendingMembers = (s: AppState): Mitra[] =>
  MAJELIS.members.filter((m) => collectStatus(s, m) === 'belum')

/**
 * She settled before the BP arrived — through the app, an agent, or a transfer.
 * Money the BP never handles, so it is not a collection result and does not
 * belong under "Sudah ditagih": nobody tagih'd her. Kept separate so the two
 * counts the BP is judged on stay honest — what she collected today, and what
 * simply came in.
 */
export const selfPaidMembers = (s: AppState): Mitra[] =>
  MAJELIS.members.filter((m) => isSelfServe(m) && collectStatus(s, m) === 'lunas')

/** An outcome the BP recorded herself: lunas, sebagian, or tidak bayar. */
export const recordedMembers = (s: AppState): Mitra[] =>
  MAJELIS.members.filter(
    (m) => collectStatus(s, m) !== 'belum' && !(isSelfServe(m) && collectStatus(s, m) === 'lunas'),
  )

/** Everything owed across the majelis this visit. */
export const billableTotal = (): number =>
  MAJELIS.members.reduce((sum, m) => sum + outstandingOf(m).total, 0)

/** Everything actually collected so far, cash and app alike. */
export const collectedTotal = (s: AppState): number =>
  MAJELIS.members.reduce((sum, m) => sum + paidOf(s, m), 0)

// The two figures the stage-2 meter runs on. They exclude the self-serve mitra
// on BOTH sides, because that money was never the BP's to collect: it arrived
// through the app before she got there. Measuring her against a denominator
// that includes it makes the bar start part-full for work she didn't do, and
// makes 100% unreachable in the other direction if any of them hadn't paid.
// What the bar is for is the cash in her bag against the cash she came for.

/** What the BP has to collect in cash this visit. */
export const cashBillableTotal = (): number =>
  MAJELIS.members
    .filter((m) => !isSelfServe(m))
    .reduce((sum, m) => sum + outstandingOf(m).total, 0)

/** Cash actually in her hands so far. */
export const cashCollectedTotal = (s: AppState): number =>
  MAJELIS.members.filter((m) => !isSelfServe(m)).reduce((sum, m) => sum + paidOf(s, m), 0)

// --- Stage 3: growth -------------------------------------------------------

export const growthDoneCount = (s: AppState): number =>
  Object.keys(s.growthResults).length

// --- The daily close -------------------------------------------------------

/** The day's banked lines, in the order the tasks were finished. */
export const depositEntries = (s: AppState): DepositEntry[] =>
  TASKS.map((t) => s.deposits[t.id]).filter((e): e is DepositEntry => Boolean(e))

/** Physical money she is carrying — the figure the deposit is about. */
export const depositExpected = (s: AppState): number =>
  depositEntries(s).reduce((sum, e) => sum + e.cash, 0)

// --- Settlement ------------------------------------------------------------

/** Everything handed over so far today, across settlements. */
export const settledTotal = (s: AppState): number =>
  s.settlements.reduce((sum, x) => sum + x.amount, 0)

/** Every rupiah of cash the day's finished tasks have banked. */
const bankedTotal = (s: AppState): number =>
  depositEntries(s).reduce((sum, e) => sum + e.cash, 0)

/**
 * What is still in her bag: banked, minus everything handed over.
 *
 * An AMOUNT, not a set of tasks. It used to be "the entries no settlement has
 * touched", which quietly assumed a settlement always covers its lines in
 * full — so a BP who confirmed Rp3.500.000 against a Rp3.700.000 ledger had
 * the missing Rp200.000 disappear: the tasks were marked gone, the widget
 * emptied, and she was left holding money the app had stopped counting. Money
 * does not settle by the task, it settles by the rupiah.
 */
export const unsettledTotal = (s: AppState): number =>
  Math.max(0, bankedTotal(s) - settledTotal(s))

/**
 * The outstanding balance broken back down into the lines it came from, oldest
 * first, with the covered part drained off. A partly-covered pelayanan appears
 * with only its remainder — which is what she is still carrying from it.
 */
export const unsettledEntries = (s: AppState): DepositEntry[] => {
  let covered = settledTotal(s)
  const out: DepositEntry[] = []
  depositEntries(s).forEach((e) => {
    if (e.cash <= 0) return
    if (covered >= e.cash) {
      covered -= e.cash
      return
    }
    out.push({ ...e, cash: e.cash - covered })
    covered = 0
  })
  return out
}

/**
 * Whether the schedule should offer to settle right now. One condition: she is
 * carrying something.
 *
 * There is no cap. Capping the count made the app hold an opinion about how
 * often a BP should be allowed to put cash down, which is the opposite of what
 * the feature is for — the risk being managed is money on a motorbike, and
 * every handover reduces it. What the count still decides is the FEE: the
 * first three are free, and the settlement page says so. A cost is a reason to
 * think; a lock is a reason to carry cash you wanted to be rid of.
 */
export const canSettle = (s: AppState): boolean => unsettledTotal(s) > 0

/** Handovers that cost nothing. Beyond this the branch charges admin. */
export const freeSettlementsLeft = (s: AppState): number =>
  Math.max(0, DEPOSIT.freePerDay - s.settlements.length)

/**
 * Whether the day can be closed. Everything done, everything SENT, and nothing
 * left in the bag — the three obligations that used to be a closing task's
 * checklist, now the condition for the widget appearing at all.
 */
export const canCloseDay = (s: AppState): boolean =>
  !s.depositDone &&
  TASKS.length > 0 &&
  TASKS.every((t) => s.sentTasks.includes(t.id)) &&
  unsettledTotal(s) === 0

/** Money that reached the company without her. Stated so it isn't asked about. */
export const depositDigital = (s: AppState): number =>
  depositEntries(s).reduce((sum, e) => sum + e.digital, 0)

/**
 * Everything the day has brought in, cash and digital together — the figure the
 * schedule's progress card is about.
 *
 * Deliberately NOT `depositExpected`: that one counts physical money because it
 * is about what leaves her hands at 17.45. This one is about whether the day is
 * on track, and a mitra who settled through the app paid just the same.
 */
export const collectedToday = (s: AppState): number =>
  depositEntries(s).reduce((sum, e) => sum + e.cash + e.digital, 0)

/**
 * What she says she deposited, falling back to the app's figure. Signed
 * difference: positive = she handed over more than the app expected.
 */
export const depositDiff = (s: AppState): number =>
  (s.depositAmount ?? depositExpected(s)) - depositExpected(s)

// --- L0: the schedule ------------------------------------------------------

/** The first task the BP hasn't finished. Undefined once the day is done. */
export const nowTask = (s: AppState): Task | undefined =>
  TASKS.find((t) => !s.doneTasks.includes(t.id))

/** Everything after the current one, in clock order. */
export const laterTasks = (s: AppState): Task[] => {
  const now = nowTask(s)
  if (!now) return []
  return TASKS.filter((t) => !s.doneTasks.includes(t.id) && t.id !== now.id)
}

/**
 * Where one task stands. Four states, and the last two are the pair this
 * direction cares about: finishing a visit and getting it off the handset are
 * different events, and a day that calls both "selesai" hides the gap.
 */
export type TaskStatus = 'belum' | 'dikerjakan' | 'selesai' | 'terkirim'

export function taskStatus(s: AppState, taskId: string): TaskStatus {
  if (s.sentTasks.includes(taskId)) return 'terkirim'
  if (s.doneTasks.includes(taskId)) return 'selesai'
  if (s.startedTasks.includes(taskId)) return 'dikerjakan'
  return 'belum'
}

/** Finished today, still on the handset — what the sync widget counts. */
export const pendingSync = (s: AppState): Task[] =>
  TASKS.filter((t) => s.doneTasks.includes(t.id) && !s.sentTasks.includes(t.id))

export const doneTaskList = (s: AppState): Task[] =>
  TASKS.filter((t) => s.doneTasks.includes(t.id))

/** The group every majelis screen is currently naming itself after. */
export const openMajelisEntry = (s: AppState): MajelisEntry => findMajelisEntry(s.openMajelis)

/** The mitra whose door the home visit is standing at. */
export const openHomeMitra = (s: AppState): Mitra =>
  findMitra(findTask(s.openHome)?.mitraId ?? 'h1')

export const openHomeTask = (s: AppState): Task | undefined => findTask(s.openHome)

/** Visits the BP moved to another day — off today's plate, not done. */
export const rescheduledTasks = (s: AppState): Task[] =>
  TASKS.filter((t) => s.reschedules[t.id])

// --- NTB: prospects --------------------------------------------------------

export const allLeads = (s: AppState): Lead[] => s.leadOrder.map((id) => s.leads[id])

/** The prospect the lead page and the follow-up screen are about. */
export const openLead = (s: AppState): Lead => s.leads[s.openLead] ?? s.leads[s.leadOrder[0]]

export const openEvent = (s: AppState): SosialisasiEvent => findEvent(s.openEvent)

/** Captured at one sosialisasi, in the order the BP took them down. */
export const leadsOfEvent = (s: AppState, eventId: string): Lead[] =>
  allLeads(s).filter((l) => l.eventId === eventId)

/** "4 dari 10" — the count the sosialisasi screen is built around. */
export const eventProgress = (s: AppState, event: SosialisasiEvent) => {
  const captured = leadsOfEvent(s, event.id).length
  return {
    captured,
    target: event.target,
    percent: Math.min(100, Math.round((captured / event.target) * 100)),
  }
}

/** Follow-ups the BP booked today, for a day the schedule can show. */
export const scheduledFor = (s: AppState, day: DayKey): Task[] =>
  day === 'tomorrow' ? s.scheduled : []
