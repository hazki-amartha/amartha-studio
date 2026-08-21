'use client'

// The Sales pipeline's own store. Separate from `store.ts` (the collection app)
// because a lead is not a mitra. It holds every lead and the transitions that
// move her along the two-level funnel, so a status changed on the detail page is
// on the row when the BP returns to the roster.

import { useSyncExternalStore } from 'react'
import {
  SEED_PIPELINE,
  SOURCE_LABEL,
  followUpDateFor,
  type Interest,
  type LeadSource,
  type MajelisAssignment,
  type PipelineLead,
  type Product,
  type ReferrerKind,
} from './pipeline'

interface PipelineState {
  leads: Record<string, PipelineLead>
  order: string[]
  /** Which lead the detail page renders. */
  openId: string
}

const seedLeads: Record<string, PipelineLead> = {}
SEED_PIPELINE.forEach((l) => {
  seedLeads[l.id] = l
})

let state: PipelineState = {
  leads: seedLeads,
  order: SEED_PIPELINE.map((l) => l.id),
  openId: SEED_PIPELINE[0].id,
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function log(lead: PipelineLead, outcome: string, note = '') {
  return [...lead.log, { at: '21 Juli', via: 'telepon' as const, outcome, note: note.trim() }]
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

  /** Opens a lead's record. */
  open(id: string) {
    state = { ...state, openId: id }
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
    const originNote = referral
      ? data.referredBy.trim()
        ? `Referral dari ${data.referredBy.trim()}`
        : ''
      : data.poi.trim()
        ? `Ditemui di ${data.poi.trim()}`
        : ''
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
      log: [
        {
          at: '21 Juli',
          via: data.source === 'poi' ? 'poi' : 'telepon',
          outcome: `Lead baru dari ${SOURCE_LABEL[data.source]}`,
          note: originNote,
        },
      ],
    }
    state = { ...state, leads: { ...state.leads, [id]: lead }, order: [id, ...state.order], openId: id }
    emit()
    return id
  },

  /**
   * Records a call that updates the interest note (Unqualified/Qualified) and
   * schedules the next follow-up from the interest cadence.
   */
  recordInterest(id: string, interest: Interest, label: string, note: string) {
    const next = followUpDateFor(interest)
    patchLead(id, (lead) => ({
      interest,
      nextFollowUp: next,
      log: [...lead.log, { at: '21 Juli', via: 'telepon' as const, outcome: label, note: note.trim(), next }],
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
        log: qualifies ? log(lead, 'Qualified · KTP dilengkapi') : lead.log,
      }
    })
  },

  /**
   * Submits the loan form — the Qualified → Submitted step. Fixes the product,
   * the majelis, and the requested amount. After this the BP waits for UK.
   */
  submitLoan(id: string, data: { product: Product; majelis: MajelisAssignment; amount: string; nik: string }) {
    patchLead(id, (lead) => ({
      status: 'submitted',
      interest: null,
      product: data.product,
      majelis: data.majelis,
      amount: data.amount.trim(),
      nik: data.nik || lead.nik,
      ktp: true,
      log: log(lead, 'Pengajuan dikirim · menunggu UK', `Produk ${data.product}${data.amount ? `, plafon ${data.amount}` : ''}`),
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
