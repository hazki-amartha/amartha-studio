'use client'

// The Sales pipeline's own little store. It is separate from `store.ts` (the
// collection app's state) because the two concepts don't share anything — a
// lead is not a mitra — and folding pipeline fields into that already-large
// module would only couple them.
//
// It exists at all, rather than useState, for the usual reason: recording a
// call on a lead's record changes her STATUS, and that change has to survive
// the trip back to the Sales roster. So the roster reads its leads from here
// too, and a status recorded on the detail page is on the row when the BP
// returns.

import { useSyncExternalStore } from 'react'
import {
  SEED_PIPELINE,
  type MajelisAssignment,
  type PipelineLead,
  type PipelineStatus,
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

function patchLead(id: string, patch: Partial<PipelineLead>) {
  const lead = state.leads[id]
  if (!lead) return
  state = { ...state, leads: { ...state.leads, [id]: { ...lead, ...patch } } }
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
   * Records a call and moves the lead to a new status. Appends the outcome to
   * her history so the record reads as a running log, oldest first.
   */
  recordCall(id: string, next: PipelineStatus, outcomeLabel: string, note: string) {
    const lead = state.leads[id]
    if (!lead) return
    patchLead(id, {
      status: next,
      log: [...lead.log, { at: '21 Juli', via: 'telepon', outcome: outcomeLabel, note: note.trim() }],
    })
  },

  /**
   * Submits the lead to the BM — the Ajukan step. Captures her NIK and majelis,
   * and moves her to `diajukan`, after which the BP can do nothing more.
   */
  submitToBM(id: string, data: { nik: string; plafon: string; majelis: MajelisAssignment }) {
    const lead = state.leads[id]
    if (!lead) return
    const detail = data.plafon ? `Plafon ${data.plafon}` : 'Diajukan ke BM'
    patchLead(id, {
      status: 'diajukan',
      nik: data.nik,
      majelis: data.majelis,
      log: [...lead.log, { at: '21 Juli', via: 'telepon', outcome: 'Diajukan ke BM', note: detail }],
    })
  },

  /** Marks the foto KTP attached. */
  attachKtp(id: string) {
    patchLead(id, { ktp: true })
  },
}

export function usePipeline(): PipelineState {
  return useSyncExternalStore(pipelineStore.subscribe, pipelineStore.get, pipelineStore.get)
}
