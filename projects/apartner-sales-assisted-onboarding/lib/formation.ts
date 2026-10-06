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

export type FormationStepId = 'anggota' | 'ketua' | 'perjanjian' | 'jadwal' | 'ritual'

export const FORMATION_STEP_ORDER: FormationStepId[] = ['anggota', 'ketua', 'perjanjian', 'jadwal']

export const FORMATION_STEP_LABEL: Record<FormationStepId, string> = {
  anggota: 'Anggota',
  ketua: 'Ketua',
  perjanjian: 'Perjanjian',
  jadwal: 'Jadwal',
  ritual: 'Ritual',
}

/** An existing-majelis acceptance is a single page — just the perjanjian. */
const ACCEPT_STEPS: FormationStepId[] = ['perjanjian']
/** During onboarding the new majelis only needs its perjanjian; the actual
 *  group (ketua + jadwal) is formed after the loan is approved. */
const PERJANJIAN_STEPS: FormationStepId[] = ['perjanjian']
const MAJELIS_STEPS: FormationStepId[] = ['ketua', 'jadwal']

export type FormationContext =
  // Accept newly-approved members into an existing majelis (batch).
  | { mode: 'accept'; majelisName: string; memberIds: string[]; memberNames: string[]; returnTo?: string }
  // Form a new majelis, in two phases: `perjanjian` (during onboarding) and
  // `majelis` (ketua + jadwal, after approval).
  | { mode: 'form'; phase: 'perjanjian' | 'majelis'; majelisName: string; memberCount: number; returnTo?: string }

export function stepsForContext(ctx: FormationContext): FormationStepId[] {
  if (ctx.mode === 'accept') return ACCEPT_STEPS
  return ctx.phase === 'perjanjian' ? PERJANJIAN_STEPS : MAJELIS_STEPS
}

// Which formation the wizard is running — set right before navigating to it.
let context: FormationContext = { mode: 'form', phase: 'majelis', majelisName: '', memberCount: 0 }
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
  /** new-majelis names whose onboarding perjanjian has been agreed. */
  perjanjianMajelis: string[]
  /** new-majelis names that have been formed (activated, post-approval). */
  activatedMajelis: string[]
}

let state: FormationState = { acceptedLeads: [], perjanjianMajelis: [], activatedMajelis: [] }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const formationStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  /** Clear acceptances / activations — used by the "start of the survey" state. */
  reset() {
    state = { acceptedLeads: [], perjanjianMajelis: [], activatedMajelis: [] }
    emit()
  },
  acceptLead(id: string) {
    if (state.acceptedLeads.includes(id)) return
    state = { ...state, acceptedLeads: [...state.acceptedLeads, id] }
    emit()
  },
  /** Mark the onboarding perjanjian agreed for a new majelis. */
  agreePerjanjian(name: string) {
    if (state.perjanjianMajelis.includes(name)) return
    state = { ...state, perjanjianMajelis: [...state.perjanjianMajelis, name] }
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
  // A reactivating ex-mitra is already a known member of her existing majelis —
  // KM acceptance was done the first time around, so it is not repeated.
  if (lead.reactivation && lead.majelis.kind === 'existing') return true
  return (
    lead.majelis.kind === 'existing' &&
    (lead.status === 'approved' || lead.status === 'survey-submitted')
  )
}

export function isMajelisActivated(s: FormationState, name: string): boolean {
  return s.activatedMajelis.includes(name)
}

/** Whether a new majelis' onboarding perjanjian has been agreed. */
export function isPerjanjianAgreed(s: FormationState, name: string): boolean {
  return s.perjanjianMajelis.includes(name)
}

/**
 * Whether an approved lead can start disbursement now — her majelis is settled:
 * an existing group, or a new one already formed (activated). A new majelis that
 * is not yet formed is still "waiting for disbursement".
 */
export function canDisburse(s: FormationState, lead: PipelineLead): boolean {
  if (lead.status !== 'approved') return false
  if (lead.majelis.kind === 'existing') return true
  if (lead.majelis.kind === 'new') return isMajelisActivated(s, lead.majelis.name)
  return false
}
