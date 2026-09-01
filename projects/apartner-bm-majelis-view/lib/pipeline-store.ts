'use client'

// The Sales pipeline's store — leads AND the POIs they come from, plus the one
// thing this direction adds on top of the BP model: assignment. A status or an
// assignee changed on a detail page is on the row when the BM returns to the
// roster. Separate from `store.ts` (the collection app) because a lead is not a
// mitra.

import { useSyncExternalStore } from 'react'
import {
  SEED_PIPELINE,
  SEED_POIS,
  SELF,
  followUpDateFor,
  type Channel,
  type Interest,
  type LeadSource,
  type MajelisAssignment,
  type MemberRole,
  type PipelineLead,
  type PipelineLog,
  type PointOfInterest,
  type SosialisasiSchedule,
  type Product,
  type ReferrerKind,
} from './pipeline'

interface PipelineState {
  leads: Record<string, PipelineLead>
  order: string[]
  /** Which lead the detail page renders. */
  openId: string
  pois: Record<string, PointOfInterest>
  poiOrder: string[]
  /** Which POI the POI-detail page renders. */
  openPoiId: string
}

const seedLeads: Record<string, PipelineLead> = {}
SEED_PIPELINE.forEach((l) => {
  seedLeads[l.id] = l
})

const seedPois: Record<string, PointOfInterest> = {}
SEED_POIS.forEach((p) => {
  seedPois[p.id] = p
})

let state: PipelineState = {
  leads: seedLeads,
  order: SEED_PIPELINE.map((l) => l.id),
  openId: SEED_PIPELINE[0].id,
  pois: seedPois,
  poiOrder: SEED_POIS.map((p) => p.id),
  openPoiId: SEED_POIS[0].id,
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function appendLog(lead: PipelineLead, entry: Omit<PipelineLog, 'at'>) {
  return [...lead.log, { at: '21 Juli', ...entry }]
}

function patchLead(id: string, make: (lead: PipelineLead) => Partial<PipelineLead>) {
  const lead = state.leads[id]
  if (!lead) return
  state = { ...state, leads: { ...state.leads, [id]: { ...lead, ...make(lead) } } }
  emit()
}

function patchPoi(id: string, make: (poi: PointOfInterest) => Partial<PointOfInterest>) {
  const poi = state.pois[id]
  if (!poi) return
  state = { ...state, pois: { ...state.pois, [id]: { ...poi, ...make(poi) } } }
  emit()
}

export const pipelineStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Opens a lead's record from the roster. */
  open(id: string) {
    state = { ...state, openId: id }
    emit()
  },

  /** Opens a POI's page from the POI list. */
  openPoi(id: string) {
    state = { ...state, openPoiId: id }
    emit()
  },

  /**
   * Captures a brand-new lead — Unqualified, Interested. `assignedTo` defaults to
   * the BM herself; she reassigns from the record. Prepended and opened.
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
    assignedTo: string
    majelis: MajelisAssignment
    role?: MemberRole
    nik: string
    ktp: boolean
    product?: Product | null
  }): string {
    const id = `p${Date.now()}`
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
      assignedTo: data.assignedTo,
      majelis: data.majelis,
      role: data.majelis.kind === 'new' ? data.role ?? 'anggota' : 'anggota',
      nik: qualified ? data.nik : '',
      ktp: qualified,
      product: data.product ?? null,
      amount: '',
      disburseDate: '',
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

  /** Reassigns the lead — to a BP, or to the BM herself (`SELF`). */
  assignLead(id: string, assignedTo: string) {
    patchLead(id, () => ({ assignedTo }))
  },

  recordInterest(
    id: string,
    interest: Interest,
    note: string,
    next?: string,
    via: Channel = 'telepon',
  ) {
    const when = next ?? followUpDateFor(interest)
    patchLead(id, (lead) => ({
      status: interest,
      nextFollowUp: when,
      log: appendLog(lead, { via, status: interest, note: note.trim(), next: when }),
    }))
  },

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

  setSource(id: string, data: { source: LeadSource; poi: string; referredBy: string; referrerKind: ReferrerKind | null }) {
    patchLead(id, () => ({
      source: data.source,
      poi: data.source === 'poi' ? data.poi.trim() : '',
      referredBy: data.source === 'referral' ? data.referredBy.trim() : '',
      referrerKind: data.source === 'referral' ? data.referrerKind : null,
    }))
  },

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

  assignMajelis(id: string, majelis: MajelisAssignment) {
    patchLead(id, (lead) => ({
      majelis,
      role: majelis.kind === 'new' ? lead.role : 'anggota',
    }))
  },

  setRole(id: string, role: MemberRole) {
    patchLead(id, () => ({ role }))
  },

  setProduct(id: string, product: Product) {
    patchLead(id, () => ({ product }))
  },

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

  // --- POIs -----------------------------------------------------------------

  /** Creates a POI and opens it. Assigned on creation (a BP, or the BM). */
  addPoi(data: {
    name: string
    area: string
    mapsCoord?: string
    assignedTo: string
    contactName?: string
    contactPhone?: string
    photo?: boolean
    target?: number
    note?: string
    sosialisasi?: SosialisasiSchedule
  }): string {
    const id = `poi-${Date.now()}`
    const poi: PointOfInterest = {
      id,
      name: data.name.trim(),
      area: data.area.trim(),
      mapsCoord: data.mapsCoord?.trim() || undefined,
      assignedTo: data.assignedTo,
      sosialisasi: data.sosialisasi,
      contactName: data.contactName?.trim() || undefined,
      contactPhone: data.contactPhone?.trim() || undefined,
      photo: data.photo || undefined,
      target: data.target || undefined,
      note: data.note?.trim() || undefined,
    }
    state = { ...state, pois: { ...state.pois, [id]: poi }, poiOrder: [id, ...state.poiOrder], openPoiId: id }
    emit()
    return id
  },

  /** Reassigns a POI — to a BP, or to the BM herself (`SELF`). */
  assignPoi(id: string, assignedTo: string) {
    patchPoi(id, () => ({ assignedTo }))
  },

  /** Sets (or clears, with `undefined`) the POI's sosialisasi schedule. */
  setSosialisasi(id: string, sosialisasi: SosialisasiSchedule | undefined) {
    patchPoi(id, () => ({ sosialisasi }))
  },

  /** Inline text edits — no trim, so a space typed mid-edit survives. */
  setPoiText(
    id: string,
    patch: { name?: string; area?: string; contactName?: string; contactPhone?: string; note?: string },
  ) {
    patchPoi(id, () => {
      const next: Partial<PointOfInterest> = {}
      if (patch.name !== undefined) next.name = patch.name
      if (patch.area !== undefined) next.area = patch.area
      if (patch.contactName !== undefined) next.contactName = patch.contactName || undefined
      if (patch.contactPhone !== undefined) next.contactPhone = patch.contactPhone || undefined
      if (patch.note !== undefined) next.note = patch.note || undefined
      return next
    })
  },

  /**
   * Edits a POI in place — the same fields Tambah POI captures. Empty strings on
   * the optional fields clear them back to undefined so a detail row reads
   * "Belum ada" rather than an empty value.
   */
  updatePoi(
    id: string,
    patch: {
      name?: string
      area?: string
      mapsCoord?: string
      contactName?: string
      contactPhone?: string
      photo?: boolean
      target?: number
      note?: string
    },
  ) {
    patchPoi(id, () => {
      const next: Partial<PointOfInterest> = {}
      if (patch.name !== undefined) next.name = patch.name.trim()
      if (patch.area !== undefined) next.area = patch.area.trim()
      if (patch.target !== undefined) next.target = patch.target || undefined
      if (patch.mapsCoord !== undefined) next.mapsCoord = patch.mapsCoord.trim() || undefined
      if (patch.contactName !== undefined) next.contactName = patch.contactName.trim() || undefined
      if (patch.contactPhone !== undefined) next.contactPhone = patch.contactPhone.trim() || undefined
      if (patch.photo !== undefined) next.photo = patch.photo || undefined
      if (patch.note !== undefined) next.note = patch.note.trim() || undefined
      return next
    })
  },
}

export function usePipeline(): PipelineState {
  return useSyncExternalStore(pipelineStore.subscribe, pipelineStore.get, pipelineStore.get)
}

/** The leads captured at a POI — matched by name, newest last (roster order). */
export function leadsForPoi(state: PipelineState, poiName: string): PipelineLead[] {
  return state.order
    .map((id) => state.leads[id])
    .filter((l) => l.source === 'poi' && l.poi === poiName)
}

export { SELF }
