'use client'

// The assisted survey — two boxes on the Calon Mitra detail page, each its own
// multi-step page:
//
//   BP Feedback        3 steps, 3 questions each
//   Survey Uji Kelayakan  6 steps (Data pribadi … Foto tempat usaha), 3 each
//
// (The majelis ritual is no longer part of the survey — it moved into the group
// formation / acceptance flow.) The questions are placeholders for now. Progress
// is held in a module store so each box shows how far its sub-page got, and
// survives navigating in and out (screens remount).

import { useSyncExternalStore } from 'react'

export type SectionId = 'bp-feedback' | 'uji-kelayakan'

export interface AppSection {
  id: SectionId
  label: string
  /** How many steps the section has — the denominator on its card. */
  total: number
}

export const APPLICATION_SECTIONS: AppSection[] = [
  { id: 'bp-feedback', label: 'BP Feedback', total: 3 },
  { id: 'uji-kelayakan', label: 'Survey Uji Kelayakan', total: 6 },
]

export interface SurveyStep {
  id: string
  title: string
  questions: string[]
}

export const BP_FEEDBACK_STEPS: SurveyStep[] = [
  {
    id: 'kesan',
    title: 'Kesan & profil',
    questions: [
      'Bagaimana kesan awal terhadap calon mitra?',
      'Sudah berapa lama calon mitra menjalankan usaha?',
      'Apakah calon mitra kooperatif saat kunjungan?',
    ],
  },
  {
    id: 'usaha',
    title: 'Penilaian usaha',
    questions: [
      'Bagaimana kondisi tempat usaha calon mitra?',
      'Apakah usaha berjalan setiap hari?',
      'Berapa perkiraan omzet harian usaha?',
    ],
  },
  {
    id: 'rekomendasi',
    title: 'Rekomendasi BP',
    questions: [
      'Apakah BP merekomendasikan calon mitra?',
      'Apa risiko yang perlu diperhatikan komite?',
      'Catatan tambahan untuk komite?',
    ],
  },
]

const KELAYAKAN_TITLES: { id: string; title: string }[] = [
  { id: 'pribadi', title: 'Data pribadi' },
  { id: 'bank', title: 'Data bank dan usaha' },
  { id: 'penanggung', title: 'Data penanggung jawab' },
  { id: 'keluarga', title: 'Data keluarga' },
  { id: 'foto-rumah', title: 'Foto rumah tinggal' },
  { id: 'foto-usaha', title: 'Foto tempat usaha' },
]

export const UJI_KELAYAKAN_STEPS: SurveyStep[] = KELAYAKAN_TITLES.map(({ id, title }) => ({
  id,
  title,
  questions: [
    `Pertanyaan 1 — ${title}`,
    `Pertanyaan 2 — ${title}`,
    `Pertanyaan 3 — ${title}`,
  ],
}))

export function stepsFor(section: SectionId): SurveyStep[] {
  return section === 'bp-feedback' ? BP_FEEDBACK_STEPS : UJI_KELAYAKAN_STEPS
}

// --- Progress store --------------------------------------------------------
// Completed step ids per lead + section: `${leadId}:${section}` -> string[].

interface SurveyState {
  done: Record<string, string[]>
}

let state: SurveyState = { done: {} }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const key = (leadId: string, section: SectionId) => `${leadId}:${section}`

export const surveyStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  markStep(leadId: string, section: SectionId, stepId: string) {
    const k = key(leadId, section)
    const current = state.done[k] ?? []
    if (current.includes(stepId)) return
    state = { done: { ...state.done, [k]: [...current, stepId] } }
    emit()
  },
  /** Toggle a ritual point (checkbox) on/off. */
  toggleStep(leadId: string, section: SectionId, stepId: string) {
    const k = key(leadId, section)
    const current = state.done[k] ?? []
    const next = current.includes(stepId)
      ? current.filter((id) => id !== stepId)
      : [...current, stepId]
    state = { done: { ...state.done, [k]: next } }
    emit()
  },
}

export function useSurvey(): SurveyState {
  return useSyncExternalStore(surveyStore.subscribe, surveyStore.get, surveyStore.get)
}

export function doneCount(s: SurveyState, leadId: string, section: SectionId): number {
  return (s.done[key(leadId, section)] ?? []).length
}

export function doneStepIds(s: SurveyState, leadId: string, section: SectionId): string[] {
  return s.done[key(leadId, section)] ?? []
}

export function sectionTotal(section: SectionId): number {
  return APPLICATION_SECTIONS.find((x) => x.id === section)?.total ?? 0
}

export function sectionComplete(s: SurveyState, leadId: string, section: SectionId): boolean {
  return doneCount(s, leadId, section) >= sectionTotal(section)
}

// Which section the shared survey-form page is showing — set before navigating.
let activeSection: SectionId = 'bp-feedback'
export function setActiveSection(section: SectionId) {
  activeSection = section
}
export function getActiveSection(): SectionId {
  return activeSection
}
