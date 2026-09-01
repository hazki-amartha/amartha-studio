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
  type MemberRole,
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
    address?: string
    mapsCoord?: string
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
      address: data.address?.trim() || undefined,
      mapsCoord: data.mapsCoord?.trim() || undefined,
      source: data.source,
      poi: referral ? '' : data.poi.trim(),
      referredBy: referral ? data.referredBy.trim() : '',
      referrerKind: referral ? data.referrerKind : null,
      status: 'interested',
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
          status: 'interested',
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
      // Her interest IS her status while she is in the New phase.
      status: interest,
      nextFollowUp: when,
      log: appendLog(lead, { via, status: interest, note: note.trim(), next: when }),
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
  setAddress(id: string, address: string, mapsCoord: string) {
    patchLead(id, () => ({ address: address.trim(), mapsCoord: mapsCoord.trim() }))
  },

  /** Inline address edits — no trim (address), and the map-pin toggle. */
  setAddressText(id: string, address: string) {
    patchLead(id, () => ({ address }))
  },
  setMapsCoord(id: string, mapsCoord: string) {
    patchLead(id, () => ({ mapsCoord }))
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
      status: 'waiting-kyc',
      product: data.product,
      majelis: data.majelis,
      nik: data.nik || lead.nik,
      ktp: true,
      log: appendLog(lead, {
        via: 'manual',
        status: 'waiting-kyc',
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
        status: 'waiting-kyc',
        ktp: true,
        log: appendLog(lead, {
          via: 'manual',
          status: 'waiting-kyc',
          system: `Produk ${lead.product}`,
        }),
      }
    })
  },
}

export function usePipeline(): PipelineState {
  return useSyncExternalStore(pipelineStore.subscribe, pipelineStore.get, pipelineStore.get)
}
