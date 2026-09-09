'use client'

// The Sales pipeline's own store. Separate from `store.ts` (the collection app)
// because a lead is not a mitra. It holds every lead and the transitions that
// move her along the two-level funnel, so a status changed on the detail page is
// on the row when the BP returns to the roster.

import { useSyncExternalStore } from 'react'
import {
  CURRENT_FO,
  SEED_PIPELINE,
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
  type SalesTask,
  type Product,
  type ReferrerKind,
} from './pipeline'

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
  /** Which task group the group list is showing. */
  openTask: SalesTask
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
  openTask: 'new-leads',
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

  /** Opens one of the five task groups as its own list. */
  openTaskGroup(task: SalesTask) {
    state = { ...state, openTask: task }
    emit()
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
// How the Add Lead screen behaves on its next open: a plain save, or a direct
// pengajuan ("Langsung Ajukan Pinjaman" from a sosialisasi), optionally with a
// draft (name/phone/KTP/POI) carried over from the quick capture. It is a plain
// module value — set right before navigating, consumed once on mount.

export interface AddLeadEntry {
  mode: 'save' | 'ajukan'
  draft: { name: string; phone: string; nik: string; ktp: boolean; poi: string } | null
}

let addLeadEntry: AddLeadEntry = { mode: 'save', draft: null }

// Set right before navigating to Add Lead; NOT reset on read, so it survives a
// StrictMode double-mount. Every entry point sets it explicitly (Sales → save).
export function setAddLeadEntry(entry: AddLeadEntry) {
  addLeadEntry = entry
}

export function getAddLeadEntry(): AddLeadEntry {
  return addLeadEntry
}
