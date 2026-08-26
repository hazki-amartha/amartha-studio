'use client'

// The Sales pipeline's own store. Separate from `store.ts` (the collection app)
// because a lead is not a mitra. It holds every lead and the transitions that
// move her along the two-level funnel, so a status changed on the detail page is
// on the row when the BP returns to the roster.

import { useSyncExternalStore } from 'react'
import {
  SEED_PIPELINE,
  followUpDateFor,
  type Channel,
  type Interest,
  type LeadSource,
  type MajelisAssignment,
  type PipelineLead,
  type PipelineLog,
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

export const pipelineStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Opens a lead's record from the roster (not as a task). */
  open(id: string) {
    state = { ...state, openId: id, followUpTaskId: null }
    emit()
  },

  /** Opens a lead AS a Follow-Up task, carrying the schedule task id. */
  openFollowUp(id: string, taskId: string) {
    state = { ...state, openId: id, followUpTaskId: taskId }
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
    source: LeadSource
    poi: string
    referredBy: string
    referrerKind: ReferrerKind | null
    majelis: MajelisAssignment
    nik: string
    ktp: boolean
  }): string {
    const id = `p${Date.now()}`
    // KTP captured up front qualifies her on the spot — that is the whole
    // difference between Unqualified (name + phone) and Qualified.
    const qualified = data.ktp && data.nik.replace(/\D/g, '').length === 16
    const referral = data.source === 'referral'
    const lead: PipelineLead = {
      id,
      name: data.name.trim(),
      phone: data.phone.trim(),
      source: data.source,
      poi: referral ? '' : data.poi.trim(),
      referredBy: referral ? data.referredBy.trim() : '',
      referrerKind: referral ? data.referrerKind : null,
      status: qualified ? 'qualified' : 'unqualified',
      interest: 'interested',
      majelis: data.majelis,
      nik: qualified ? data.nik : '',
      ktp: qualified,
      product: null,
      amount: '',
      disburseDate: '',
      // The first touch reads as her opening status, on the channel she came in.
      log: [
        {
          at: '21 Juli',
          via: data.source === 'poi' ? 'poi' : 'manual',
          status: qualified ? 'qualified' : 'unqualified',
          interest: 'interested',
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
    patchLead(id, (lead) => ({
      interest,
      nextFollowUp: when,
      // Recording interest never changes the main status — the entry keeps her
      // current one (Unqualified / Qualified) and pairs it with the new interest.
      log: appendLog(lead, { via, status: lead.status, interest, note: note.trim(), next: when }),
    }))
  },

  /** Edits the lead's name / phone — the pencil on the record. */
  updateContact(id: string, name: string, phone: string) {
    patchLead(id, () => ({ name: name.trim(), phone: phone.trim() }))
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
   * Captures or edits the KTP (NIK + photo). An Unqualified lead who now has a
   * valid KTP is promoted to Qualified — that is the whole difference between
   * the two.
   */
  updateKtp(id: string, nik: string, ktp: boolean) {
    patchLead(id, (lead) => {
      const qualifies = lead.status === 'unqualified' && ktp && nik.replace(/\D/g, '').length === 16
      return {
        nik,
        ktp,
        status: qualifies ? 'qualified' : lead.status,
        log: qualifies
          ? appendLog(lead, {
              via: 'manual',
              status: 'qualified',
              interest: lead.interest ?? 'interested',
              system: 'KTP dilengkapi',
            })
          : lead.log,
      }
    })
  },

  /**
   * Submits the loan form — the Qualified → Submitted step. Fixes the product
   * and the majelis. After this the BP waits for UK. (The plafon is no longer
   * captured here; it is finalised later, at approval.)
   */
  submitLoan(id: string, data: { product: Product; majelis: MajelisAssignment; nik: string }) {
    patchLead(id, (lead) => ({
      status: 'submitted',
      interest: null,
      // Freshly submitted → the first system sub-state: the calon mitra now does
      // self-serve KYC on AFIN. Everything past here is system-driven.
      subStatus: 'kyc',
      product: data.product,
      majelis: data.majelis,
      nik: data.nik || lead.nik,
      ktp: true,
      log: appendLog(lead, {
        via: 'manual',
        status: 'submitted',
        stage: 'kyc',
        system: `Produk ${data.product}`,
      }),
    }))
  },

  /** Reassigns the majelis — allowed at any status (per the concept). */
  assignMajelis(id: string, majelis: MajelisAssignment) {
    patchLead(id, () => ({ majelis }))
  },
}

export function usePipeline(): PipelineState {
  return useSyncExternalStore(pipelineStore.subscribe, pipelineStore.get, pipelineStore.get)
}
