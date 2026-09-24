'use client'

// The group-formation / acceptance flow, in two shapes:
//
//   - `form`   — a NEW (draft) majelis is activated: all four steps
//                (Ketua · Perjanjian · Jadwal & Lokasi · Ritual). Opened from the
//                draft majelis' "belum aktif" box or the Tugas task.
//   - `accept` — a calon mitra is accepted into an EXISTING majelis: only the two
//                per-member steps (Perjanjian · Ritual). Opened from the majelis
//                box on her Calon Mitra detail.
//
// A module store remembers which leads are accepted and which draft majelis have
// been activated, so the majelis box / directory reflect it after navigating.

import { useSyncExternalStore } from 'react'
import type { PipelineLead } from './pipeline'

export type FormationStepId = 'ketua' | 'perjanjian' | 'jadwal' | 'ritual'

export const FORMATION_STEP_ORDER: FormationStepId[] = ['ketua', 'perjanjian', 'jadwal']

export const FORMATION_STEP_LABEL: Record<FormationStepId, string> = {
  ketua: 'Ketua',
  perjanjian: 'Perjanjian',
  jadwal: 'Jadwal',
  ritual: 'Ritual',
}

/** An existing-majelis acceptance is a single page — just the perjanjian. */
const ACCEPT_STEPS: FormationStepId[] = ['perjanjian']

export type FormationContext =
  // Accept newly-approved members into an existing majelis (batch).
  | { mode: 'accept'; majelisName: string; memberIds: string[]; memberNames: string[] }
  | { mode: 'form'; majelisName: string; memberCount: number }

export function stepsForContext(ctx: FormationContext): FormationStepId[] {
  return ctx.mode === 'accept' ? ACCEPT_STEPS : FORMATION_STEP_ORDER
}

// Which formation the wizard is running — set right before navigating to it.
let context: FormationContext = { mode: 'form', majelisName: '', memberCount: 0 }
export function setFormation(c: FormationContext) {
  context = c
}
export function getFormation(): FormationContext {
  return context
}

// --- Store: accepted leads + activated majelis -----------------------------

interface FormationState {
  /** lead ids accepted into their existing majelis. */
  acceptedLeads: string[]
  /** new-majelis names that have been formed (activated). */
  activatedMajelis: string[]
}

let state: FormationState = { acceptedLeads: [], activatedMajelis: [] }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const formationStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  acceptLead(id: string) {
    if (state.acceptedLeads.includes(id)) return
    state = { ...state, acceptedLeads: [...state.acceptedLeads, id] }
    emit()
  },
  activateMajelis(name: string) {
    if (state.activatedMajelis.includes(name)) return
    state = { ...state, activatedMajelis: [...state.activatedMajelis, name] }
    emit()
  },
}

export function useFormation(): FormationState {
  return useSyncExternalStore(formationStore.subscribe, formationStore.get, formationStore.get)
}

export function isLeadAccepted(s: FormationState, id: string): boolean {
  return s.acceptedLeads.includes(id)
}

/**
 * Whether a lead has been accepted by her existing majelis. Beyond an explicit
 * acceptance run, the rule is: in an EXISTING majelis, KM acceptance is required
 * before the survey is submitted — so any lead who has reached Survey submitted
 * or Approved there has, by definition, already been accepted.
 */
export function isMemberAccepted(s: FormationState, lead: PipelineLead): boolean {
  if (isLeadAccepted(s, lead.id)) return true
  return (
    lead.majelis.kind === 'existing' &&
    (lead.status === 'approved' || lead.status === 'survey-submitted')
  )
}

export function isMajelisActivated(s: FormationState, name: string): boolean {
  return s.activatedMajelis.includes(name)
}
