'use client'

// The Sales pipeline's own store. Separate from `store.ts` (the collection app)
// because a lead is not a mitra. It holds every lead and the transitions that
// move her along the two-level funnel, so a status changed on the detail page is
// on the row when the BP returns to the roster.

import { useSyncExternalStore } from 'react'
import {
  CURRENT_FO,
  SEED_PIPELINE,
  contextSteps,
  dateFromToday,
  followUpDateFor,
  type Channel,
  type Interest,
  type LeadAddress,
  type LeadSource,
  type LeadStatus,
  type MajelisAssignment,
  type MemberRole,
  type PipelineLead,
  type PipelineLog,
  type Product,
  type ReferrerKind,
} from './pipeline'
import { leadCategory } from './tasks'

interface PipelineState {
  leads: Record<string, PipelineLead>
  order: string[]
  /** Which lead the detail page renders. */
  openId: string
  /**
   * The schedule task id when this lead was opened AS a Follow-Up task, so the
   * detail screen can complete that task on the schedule when the call is
   * recorded. Null when opened from the Sales roster.
   */
  followUpTaskId: string | null
  /** Which Follow Up layout to render: the default, or the "Tawarkan pengajuan"
   *  Alt (a two-step flow). Set by the Alt presentation state; reset on any real
   *  navigation so a live follow-up always opens the default. */
  followUpVariant: 'default' | 'alt'
  /** A one-shot confirmation banner for the Sales page — set on a submit/drop,
   *  cleared the next time Sales mounts. */
  flash: string | null
  /**
   * How many of today's tasks the BP has finished, per task category. A finished
   * task leaves today's board (rescheduled forward, dropped, or submitted to
   * Mitra), so its card is gone — but it still counts toward "X dari Y selesai".
   */
  completedToday: Record<string, number>
}

const seedLeads: Record<string, PipelineLead> = {}
SEED_PIPELINE.forEach((l) => {
  seedLeads[l.id] = l
})

let state: PipelineState = {
  leads: seedLeads,
  order: SEED_PIPELINE.map((l) => l.id),
  openId: SEED_PIPELINE[0].id,
  followUpTaskId: null,
  followUpVariant: 'default',
  flash: null,
  completedToday: {},
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

// Appends one history entry. A thin helper so the fixed `at` and the array
// spread live in one place; callers pass the two-level status the entry records.
function appendLog(lead: PipelineLead, entry: Omit<PipelineLog, 'at'>) {
  return [...lead.log, { at: '21 Juli', ...entry }]
}

function patchLead(id: string, make: (lead: PipelineLead) => Partial<PipelineLead>) {
  const lead = state.leads[id]
  if (!lead) return
  state = { ...state, leads: { ...state.leads, [id]: { ...lead, ...make(lead) } } }
  emit()
}

/**
 * Like `patchLead`, but also tallies this task as finished for the day, under
 * the category it had BEFORE the patch (a drop reclassifies her as reactivation,
 * yet the task done was the follow-up she was in). One state update, one emit.
 */
function completeTask(id: string, make: (lead: PipelineLead) => Partial<PipelineLead>) {
  const lead = state.leads[id]
  if (!lead) return
  const category = leadCategory(lead)
  state = {
    ...state,
    leads: { ...state.leads, [id]: { ...lead, ...make(lead) } },
    completedToday: {
      ...state.completedToday,
      [category]: (state.completedToday[category] ?? 0) + 1,
    },
  }
  emit()
}

const seedState: PipelineState = state

export const pipelineStore = {
  get: () => state,

  /** Back to the seed. Only the presentation states in `demo.ts` call this. */
  reset() {
    state = seedState
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Opens a lead's record from the roster (not as a task). */
  open(id: string) {
    state = { ...state, openId: id, followUpTaskId: null, followUpVariant: 'default' }
    emit()
  },

  /** Opens a lead AS a Follow-Up task, carrying the schedule task id. */
  openFollowUp(id: string, taskId: string) {
    state = { ...state, openId: id, followUpTaskId: taskId, followUpVariant: 'default' }
    emit()
  },

  /** Switches the Follow Up layout — the Alt presentation state sets this. */
  setFollowUpVariant(variant: 'default' | 'alt') {
    state = { ...state, followUpVariant: variant }
    emit()
  },

  /** Clears the Follow-Up task link once the task is done or left. */
  endFollowUp() {
    state = { ...state, followUpTaskId: null }
    emit()
  },

  /** Raise a one-shot confirmation banner for the Sales page. */
  setFlash(message: string) {
    state = { ...state, flash: message }
    emit()
  },

  /** Clear the banner — called by Sales once it has shown it. */
  clearFlash() {
    if (state.flash === null) return
    state = { ...state, flash: null }
    emit()
  },

  /**
   * Reschedule the next follow-up to a later day. Moves her off today's board
   * by pushing the agenda's due date out; the old `when` label is replaced with
   * the plain date the BP picked.
   */
  rescheduleFollowUp(id: string, dueInDays: number, whenLabel: string, note?: string) {
    completeTask(id, (lead) => ({
      agenda: {
        day: 'upcoming',
        kind: lead.agenda?.kind ?? 'Follow up',
        when: whenLabel,
        order: lead.agenda?.order ?? 0,
        dueDays: dueInDays,
      },
      nextFollowUp: whenLabel,
      lastResult: { kind: 'rescheduled', date: dateFromToday(0), reason: note?.trim() || undefined },
      contextHistory: [
        ...contextSteps(lead),
        { date: dateFromToday(0), title: 'Follow up rescheduled', detail: note?.trim() || undefined },
      ],
      log: appendLog(lead, {
        via: 'manual',
        status: lead.status,
        system: 'Follow up dijadwalkan ulang',
        note: note?.trim() || undefined,
      }),
    }))
  },

  /** Drops a lead as Not interested — she reopens later as a reactivation task. */
  dropLead(id: string, reason: string) {
    completeTask(id, (lead) => ({
      status: 'not-interested',
      lastResult: { kind: 'dropped', date: dateFromToday(0), reason: reason.trim() || undefined },
      contextHistory: [
        ...contextSteps(lead),
        { date: dateFromToday(0), title: 'Dropped', detail: reason.trim() || undefined },
      ],
      // Off today's board; she comes back on her reactivation date.
      agenda: {
        day: 'upcoming',
        kind: 'Reaktivasi',
        when: 'Reaktivasi',
        order: lead.agenda?.order ?? 0,
        dueDays: 30,
      },
      log: appendLog(lead, { via: 'manual', status: 'not-interested', note: reason.trim() || undefined }),
    }))
  },

  /**
   * Send her the self-service AFIN application. She stays on the Sales list —
   * still `interested`, now flagged as started — so the next follow-up can check
   * on her or take the application over. Pushes the follow-up out a few days.
   */
  startSelfService(id: string, dueInDays = 3, whenLabel = 'Follow up self-service') {
    completeTask(id, (lead) => ({
      selfServiceStarted: true,
      agenda: {
        day: 'upcoming',
        kind: 'Follow up',
        when: whenLabel,
        order: lead.agenda?.order ?? 0,
        dueDays: dueInDays,
      },
      lastResult: { kind: 'self-service', date: dateFromToday(0) },
      contextHistory: [
        ...contextSteps(lead),
        { date: dateFromToday(0), title: 'Self service application started' },
      ],
      log: appendLog(lead, {
        via: 'manual',
        status: lead.status,
        system: 'Aplikasi self-service AFIN dikirim',
      }),
    }))
  },

  /**
   * Save an FO-assisted application in progress ("Continue later"): remember the
   * sections already done and push the next follow-up out one day, so the BP can
   * resume it from where she left off.
   */
  saveAssistedProgress(id: string, completed: string[], whenLabel: string, note?: string) {
    completeTask(id, (lead) => ({
      assistedStarted: true,
      assistedDone: completed,
      // Taking over supersedes any self-service state.
      selfServiceStarted: false,
      agenda: {
        day: 'upcoming',
        kind: 'Follow up',
        when: whenLabel,
        order: lead.agenda?.order ?? 0,
        dueDays: 1,
      },
      nextFollowUp: whenLabel,
      lastResult: { kind: 'assisted', date: dateFromToday(0), reason: note?.trim() || undefined },
      contextHistory: [
        ...contextSteps(lead),
        { date: dateFromToday(0), title: 'Assisted application started', detail: note?.trim() || undefined },
      ],
      log: appendLog(lead, {
        via: 'manual',
        status: lead.status,
        system: `Aplikasi assisted disimpan (${completed.length}/8 bagian)`,
        note: note?.trim() || undefined,
      }),
    }))
  },

  /**
   * Continue application → Modal → Existing majelis. She joins that majelis and
   * a "Follow up for Kumpulan" task is created — she stays on Sales, to be
   * reminded to come to the kumpulan day. The follow-up she was in counts done.
   */
  createKumpulanFollowUp(id: string, majelis: MajelisAssignment) {
    completeTask(id, (lead) => ({
      product: 'Modal',
      majelis,
      kumpulanStage: 'follow-up',
      agenda: {
        day: 'today',
        kind: 'Kumpulan',
        when: 'Hari ini',
        order: lead.agenda?.order ?? 0,
        dueDays: 0,
      },
      lastResult: { kind: 'kumpulan', date: dateFromToday(0) },
      contextHistory: [
        ...contextSteps(lead),
        { date: dateFromToday(0), title: 'Aplikasi untuk majelis existing' },
      ],
      log: appendLog(lead, {
        via: 'manual',
        status: lead.status,
        system: 'Produk Modal — follow up kumpulan dibuat',
      }),
    }))
  },

  /**
   * Continue application → Modal → New majelis. A sosialisasi is scheduled for
   * the new majelis (it lands on the Task page); she leaves the Sales list.
   */
  createKumpulanSosialisasi(id: string, majelisName: string, when: string) {
    completeTask(id, (lead) => ({
      product: 'Modal',
      majelis: { kind: 'new', name: majelisName },
      kumpulanStage: 'sosialisasi',
      log: appendLog(lead, {
        via: 'manual',
        status: lead.status,
        system: `Sosialisasi ${majelisName} dijadwalkan — ${when}`,
      }),
    }))
  },

  /** "Lead sudah hadir" at the kumpulan — she moves on to the Mitra list. */
  markKumpulanHadir(id: string) {
    completeTask(id, (lead) => ({
      status: 'survey-submitted',
      kumpulanStage: undefined,
      log: appendLog(lead, {
        via: 'manual',
        status: 'survey-submitted',
        system: 'Lead hadir di kumpulan — pindah ke daftar Mitra',
      }),
    }))
  },

  /**
   * Submit the pengajuan from a completed assisted application. She moves to
   * survey-submitted — the system takes over (KYC → underwriting) and she leaves
   * the Sales list for Mitra.
   */
  submitApplication(id: string) {
    completeTask(id, (lead) => ({
      status: 'survey-submitted',
      assistedStarted: false,
      log: appendLog(lead, {
        via: 'manual',
        status: 'survey-submitted',
        system: 'Aplikasi dikirim — pindah ke daftar Mitra',
      }),
    }))
  },

  /**
   * Captures a brand-new lead — Unqualified, Interested, since a lead the BP
   * just met has by definition never been worked and entered the funnel because
   * she showed some interest. Prepended and opened.
   */
  addLead(data: {
    name: string
    phone: string
    address?: LeadAddress
    fo?: string
    photo?: boolean
    source: LeadSource
    poi: string
    referredBy: string
    referrerKind: ReferrerKind | null
    majelis: MajelisAssignment
    role?: MemberRole
    nik: string
    ktp: boolean
    product?: Product | null
    competitorLoan?: boolean
    competitorLender?: string
    competitorAmount?: string
  }): string {
    const id = `p${Date.now()}`
    // KTP captured up front makes her Qualified (a type), but her status opens
    // the same either way: Interested, the first touch that put her in the funnel.
    const qualified = data.ktp && data.nik.replace(/\D/g, '').length === 16
    const referral = data.source === 'referral'
    const lead: PipelineLead = {
      id,
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address?.kecamatan ? data.address : undefined,
      fo: data.fo ?? CURRENT_FO,
      photo: data.photo ?? false,
      source: data.source,
      poi: referral ? '' : data.poi.trim(),
      referredBy: referral ? data.referredBy.trim() : '',
      referrerKind: referral ? data.referrerKind : null,
      competitorLoan: data.competitorLoan,
      competitorLender: data.competitorLoan ? data.competitorLender?.trim() || undefined : undefined,
      competitorAmount: data.competitorLoan ? data.competitorAmount?.trim() || undefined : undefined,
      // Written down today and never contacted — that is exactly New.
      status: 'new',
      ageDays: 0,
      // Straight onto today's schedule: a lead captured in the field is worked
      // the same day or it is a name in a notebook.
      agenda: { day: 'today', kind: 'Diproses', when: 'Hari ini', order: 0 },
      majelis: data.majelis,
      role: data.majelis.kind === 'new' ? data.role ?? 'anggota' : 'anggota',
      nik: qualified ? data.nik : '',
      ktp: qualified,
      product: data.product ?? null,
      amount: '',
      disburseDate: '',
      // The first touch reads as her opening status, on the channel she came in.
      log: [
        {
          at: '21 Juli',
          via: data.source === 'poi' ? 'poi' : 'manual',
          status: 'new',
          note: referral && data.referredBy.trim() ? `Referral dari ${data.referredBy.trim()}` : '',
        },
      ],
    }
    state = { ...state, leads: { ...state.leads, [id]: lead }, order: [id, ...state.order], openId: id }
    emit()
    return id
  },

  /**
   * Records a call that updates the interest note (Unqualified/Qualified) and
   * schedules the next follow-up. `next` defaults to the interest cadence but the
   * BP can override it with a date she picked.
   */
  recordInterest(
    id: string,
    interest: Interest,
    note: string,
    next?: string,
    via: Channel = 'telepon',
  ) {
    const when = next ?? followUpDateFor(interest)
    // The status model has two contacted outcomes, not three: a lead who is
    // still thinking has been reached and has not said no, so she sits with the
    // Interested ones. The undecided-ness survives as the note and the longer
    // follow-up cadence, which is where it changes what the BP does anyway.
    const status: LeadStatus = interest === 'not-interested' ? 'not-interested' : 'interested'
    patchLead(id, (lead) => ({
      status,
      nextFollowUp: when,
      log: appendLog(lead, { via, status, note: note.trim(), next: when }),
    }))
  },

  /** Sets just the next follow-up date — used at capture (no extra log entry). */
  setFollowUp(id: string, date: string) {
    patchLead(id, () => ({ nextFollowUp: date }))
  },

  /** Edits the lead's name / phone — the pencil on the record. */
  updateContact(id: string, name: string, phone: string) {
    patchLead(id, () => ({ name: name.trim(), phone: phone.trim() }))
  },

  /** Inline setters — no trim, so a space typed mid-edit survives. */
  setName(id: string, name: string) {
    patchLead(id, () => ({ name }))
  },
  setPhone(id: string, phone: string) {
    patchLead(id, () => ({ phone }))
  },

  /** Sets her home address (and an optional maps coordinate). */
  setAddress(id: string, address: LeadAddress) {
    patchLead(id, () => ({ address: { ...address, detail: address.detail.trim() } }))
  },

  /** Reassigns the lead to another field officer. */
  setFo(id: string, fo: string) {
    patchLead(id, () => ({ fo }))
  },

  /** The capture photo — attached or removed. */
  setPhoto(id: string, photo: boolean) {
    patchLead(id, () => ({ photo }))
  },

  /** Changes the source — which POI, or who referred her. */
  setSource(id: string, data: { source: LeadSource; poi: string; referredBy: string; referrerKind: ReferrerKind | null }) {
    patchLead(id, () => ({
      source: data.source,
      poi: data.source === 'poi' ? data.poi.trim() : '',
      referredBy: data.source === 'referral' ? data.referredBy.trim() : '',
      referrerKind: data.source === 'referral' ? data.referrerKind : null,
    }))
  },

  /**
   * Captures or edits the KTP (NIK + photo). This completes her data — she
   * becomes Qualified (a type, derived from KTP) — but her status is unchanged;
   * the completion is noted in her history.
   */
  updateKtp(id: string, nik: string, ktp: boolean) {
    patchLead(id, (lead) => {
      const wasIncomplete = !(lead.ktp && lead.nik.replace(/\D/g, '').length === 16)
      const nowComplete = ktp && nik.replace(/\D/g, '').length === 16
      return {
        nik,
        ktp,
        log:
          wasIncomplete && nowComplete
            ? appendLog(lead, { via: 'manual', status: lead.status, system: 'KTP dilengkapi' })
            : lead.log,
      }
    })
  },

  /**
   * Files the pengajuan — the pengajuan form goes in and she moves to Waiting
   * for KYC. After this the process is system-driven.
   */
  submitLoan(id: string, data: { product: Product; majelis: MajelisAssignment; nik: string }) {
    patchLead(id, (lead) => ({
      status: 'survey-created',
      // Filed with the BP sitting beside her.
      surveyMode: 'assisted' as const,
      product: data.product,
      majelis: data.majelis,
      nik: data.nik || lead.nik,
      ktp: true,
      log: appendLog(lead, {
        via: 'manual',
        status: 'survey-created',
        system: `Produk ${data.product}`,
      }),
    }))
  },

  /**
   * Reassigns the majelis — allowed at any status (per the concept). Joining an
   * existing group drops any `ketua` role: an existing majelis already has one.
   */
  assignMajelis(id: string, majelis: MajelisAssignment) {
    patchLead(id, (lead) => ({
      majelis,
      role: majelis.kind === 'new' ? lead.role : 'anggota',
    }))
  },

  /** Sets her role in the majelis (Anggota / Ketua). */
  setRole(id: string, role: MemberRole) {
    patchLead(id, () => ({ role }))
  },

  /** Picks the loan product on the record, before the pengajuan goes in. */
  setProduct(id: string, product: Product) {
    patchLead(id, () => ({ product }))
  },

  /**
   * Invites her as a calon mitra — files the pengajuan straight from the record
   * she already has (KTP, majelis, product), no re-entry. Qualified → Submitted,
   * and the system takes over (KYC → underwriting → decision).
   */
  invite(id: string) {
    patchLead(id, (lead) => {
      if (!lead.product) return {}
      return {
        status: 'survey-created',
        // Invited to fill it in herself, on AFin.
        surveyMode: 'self' as const,
        ktp: true,
        log: appendLog(lead, {
          via: 'manual',
          status: 'survey-created',
          system: `Produk ${lead.product}`,
        }),
      }
    })
  },
}

export function usePipeline(): PipelineState {
  return useSyncExternalStore(pipelineStore.subscribe, pipelineStore.get, pipelineStore.get)
}

// --- Add-Lead entry -------------------------------------------------------
// How the Add Lead form opens on its next mount. The SOURCE is chosen BEFORE the
// form — from a bottom sheet on the Sales page, or fixed by a sosialisasi — so
// it arrives already picked and read-only. `returnTo` says where Submit and Back
// go. It is a plain module value, set right before navigating, read once on
// mount.

export interface AddLeadSource {
  source: LeadSource
  poi: string
  referredBy: string
  referrerKind: ReferrerKind | null
}

export interface AddLeadEntry {
  mode: 'save' | 'ajukan'
  /** The preselected source — null only as a defensive default. */
  source: AddLeadSource | null
  /** Where Submit / Back return to. */
  returnTo: 'sales' | 'sosialisasi'
  draft: { name: string; phone: string; nik: string; ktp: boolean; poi: string } | null
}

let addLeadEntry: AddLeadEntry = { mode: 'save', source: null, returnTo: 'sales', draft: null }

// Set right before navigating to Add Lead; NOT reset on read, so it survives a
// StrictMode double-mount. Every entry point sets it explicitly.
export function setAddLeadEntry(entry: AddLeadEntry) {
  addLeadEntry = entry
}

export function getAddLeadEntry(): AddLeadEntry {
  return addLeadEntry
}
