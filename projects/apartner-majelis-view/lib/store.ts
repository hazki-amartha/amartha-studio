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
  TASKS,
  findMajelisEntry,
  findTask,
  taskForMajelis,
  type DayKey,
  type MajelisEntry,
  type Task,
} from './schedule'

/** Who actually answered the door on a home visit. */
export type MetWith = 'mitra' | 'pj' | 'nobody'

/** The payment outcome picked inline on a home visit. */
export type PayMode = 'penuh' | 'sebagian' | 'tidak'

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
  /** mitraId → what she said to her growth offer. Absent = not pitched. */
  growthResults: Record<string, GrowthResult>
  /**
   * mitraId → why she said no to the offer. Recorded alongside a `tidak`
   * result: "tidak tertarik" alone tells next week's BP nothing about whether
   * to pitch again, and an offer with no reason on file gets either re-pushed
   * blindly or dropped for good. Absent = interested, or not yet answered.
   */
  growthReasons: Record<string, string>
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

  // --- The daily close -----------------------------------------------------

  /** taskId → what that finished task put in her bag. Written by `finishTask`. */
  deposits: Record<string, DepositEntry>
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
  growthResults: {},
  growthReasons: {},
  openMitra: 'm1',
  lastCollect: null,
  photo: false,
  geo: false,
  day: 'today',
  doneTasks: [],
  activeTask: null,
  openMajelis: 'mawar',
  openHome: 't3',
  metWith: {},
  payMode: {},
  partialPtp: {},
  newAddress: {},
  deposits: {},
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
      growthResults: {},
      growthReasons: {},
      lastCollect: null,
      photo: false,
      geo: false,
      openMajelis: majelisId,
      activeTask: taskId,
    })
  },
  /** Opens a group's roster from the Majelis tab, without starting any work. */
  openMajelisPage(majelisId: string) {
    store.set({ openMajelis: majelisId })
  },
  /**
   * Opens the closing task. The amount is seeded from what the day banked, so
   * the BP's first act is to agree or disagree with a figure, never to type one
   * from memory — she has just carried this money through five stops.
   */
  startDeposit(taskId: string) {
    store.set({
      activeTask: taskId,
      depositAmount: depositExpected(state),
      depositDiffReason: null,
    })
  },
  /** Opens a home visit from the schedule. */
  startHomeVisit(taskId: string) {
    store.set({ openHome: taskId, activeTask: taskId, photo: false, geo: false })
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
    store.set({ activeTask: taskId, openEvent: findTask(taskId)?.eventId ?? 'e1' })
  },
  /** Opens a follow-up from the schedule — the rostered call. */
  startFollowUp(taskId: string) {
    const leadId = findTask(taskId)?.leadId ?? 'l1'
    store.set({ activeTask: taskId, openLead: leadId, followUp: emptyFollowUp(leadId) })
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
   * Marks a mitra absent WITH the reason she isn't here, in one gesture — the
   * reason and the absence are recorded together so her card only leaves the
   * register once the record is complete.
   */
  setAbsent(mitraId: string, reason: string) {
    store.set({
      attendance: { ...state.attendance, [mitraId]: 'tidak' },
      absenceReasons: { ...state.absenceReasons, [mitraId]: reason },
    })
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
  collect(mitra: Mitra, amount: number) {
    const nonPayments = { ...state.nonPayments }
    delete nonPayments[mitra.id]
    store.set({
      payments: { ...state.payments, [mitra.id]: amount },
      nonPayments,
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
    store.set({
      payments,
      nonPayments: { ...state.nonPayments, [mitra.id]: value },
      lastCollect: null,
    })
  },
  /**
   * Records what the mitra said to an offer, not merely that she was asked. A
   * `tidak` carries the reason she gave; a `ya` clears any reason left behind
   * by a corrected no — she's interested now, so the old refusal isn't true.
   */
  setGrowthResult(mitraId: string, result: GrowthResult, reason?: string) {
    const growthReasons = { ...state.growthReasons }
    if (result === 'tidak' && reason) growthReasons[mitraId] = reason
    else delete growthReasons[mitraId]
    store.set({ growthResults: { ...state.growthResults, [mitraId]: result }, growthReasons })
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
 * The register drains the same way the collection queue does: a mitra leaves the
 * list the moment she is marked EITHER way, so what is on screen is always
 * exactly who is still unaccounted for. In a 22-member majelis the alternative
 * is scanning a full list for the four rows without a pill on them.
 */
export const unmarkedMembers = (s: AppState): Mitra[] =>
  MAJELIS.members.filter((m) => !s.attendance[m.id])

export const markedMembers = (s: AppState): Mitra[] =>
  MAJELIS.members.filter((m) => s.attendance[m.id])

/**
 * The gate. Collection does not open until every mitra has been marked one way
 * or the other — the reference direction is explicit that attendance is
 * completed first, and a half-marked register is the thing that makes a majelis
 * record unauditable later.
 */
export const attendanceComplete = (s: AppState): boolean =>
  markedCount(s) === MAJELIS.members.length

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

/** Everything actually collected so far. */
export const collectedTotal = (s: AppState): number =>
  MAJELIS.members.reduce((sum, m) => sum + paidOf(s, m), 0)

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

/** Money that reached the company without her. Stated so it isn't asked about. */
export const depositDigital = (s: AppState): number =>
  depositEntries(s).reduce((sum, e) => sum + e.digital, 0)

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

export const doneTaskList = (s: AppState): Task[] =>
  TASKS.filter((t) => s.doneTasks.includes(t.id))

/** The group every majelis screen is currently naming itself after. */
export const openMajelisEntry = (s: AppState): MajelisEntry => findMajelisEntry(s.openMajelis)

/** The mitra whose door the home visit is standing at. */
export const openHomeMitra = (s: AppState): Mitra =>
  findMitra(findTask(s.openHome)?.mitraId ?? 'h1')

export const openHomeTask = (s: AppState): Task | undefined => findTask(s.openHome)

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
