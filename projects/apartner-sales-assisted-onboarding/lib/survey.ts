'use client'

// The assisted survey — two boxes on the Calon Mitra detail page, each its own
// multi-step page:
//
//   BP Feedback        5 steps (Validasi … Penilaian BP), typed fields
//   Survey Uji Kelayakan  6 steps (Data pribadi … Foto tempat usaha), 3 each
//
// (The majelis ritual is no longer part of the survey — it moved into the group
// formation / acceptance flow.) BP Feedback is built from the Assisted
// Onboarding field list (typed fields); Uji Kelayakan questions are placeholders
// for now. Progress is held in a module store so each box shows how far its
// sub-page got, and survives navigating in and out (screens remount).

import { useSyncExternalStore } from 'react'

export type SectionId = 'bp-feedback' | 'uji-kelayakan' | 'ritual'

/** The three ritual points — shared by the onboarding ritual checklist and the
 *  group-formation / acceptance ritual step. */
export const RITUAL_POINTS = [
  'Perkenalan visi & misi Amartha ke seluruh anggota',
  'Penjelasan tanggung renteng & disiplin bayar mingguan',
  'Doa bersama & pembacaan komitmen majelis',
]

export interface AppSection {
  id: SectionId
  label: string
  /** How many steps the section has — the denominator on its card. */
  total: number
}

export const APPLICATION_SECTIONS: AppSection[] = [
  { id: 'bp-feedback', label: 'BP Feedback', total: 5 },
  { id: 'uji-kelayakan', label: 'Survey Uji Kelayakan', total: 6 },
]

/** A BP Feedback field. `foto` captures a selfie + lat/long (stand-in); `dropdown`
 *  picks one option; `dropdown-notes` adds a free-text note; `multiselect` allows
 *  several. Uji Kelayakan still uses plain `questions`. */
export type FieldType = 'foto' | 'dropdown' | 'dropdown-notes' | 'multiselect'

export interface Field {
  label: string
  type: FieldType
  options?: string[]
}

export interface SurveyStep {
  id: string
  title: string
  /** Uji Kelayakan — plain text questions. */
  questions?: string[]
  /** BP Feedback — typed fields (from the Assisted Onboarding field list). */
  fields?: Field[]
}

// BP Feedback — the Assisted Onboarding field list, grouped by category.
export const BP_FEEDBACK_STEPS: SurveyStep[] = [
  {
    id: 'validasi',
    title: 'Validasi',
    fields: [{ label: 'Selfie BP & Mitra', type: 'foto' }],
  },
  {
    id: 'usaha',
    title: 'Kondisi usaha',
    fields: [
      {
        label: 'Apakah usaha mitra saat ini berjalan aktif?',
        type: 'dropdown',
        options: ['Aktif normal', 'Aktif tapi menurun', 'Tutup sementara', 'Tidak ada usaha'],
      },
      {
        label: 'Sudah berapa lama usaha mitra berjalan?',
        type: 'dropdown',
        options: ['< 6 bulan', '6-12 bulan', '1-3 tahun', '> 3 tahun'],
      },
    ],
  },
  {
    id: 'profil',
    title: 'Profil mitra',
    fields: [
      {
        label: 'Status kepemilikan rumah yang ditempati mitra?',
        type: 'dropdown',
        options: ['Milik sendiri', 'Milik keluarga', 'Sewa / kontrak', 'Menumpang'],
      },
      {
        label: 'Sudah berapa lama mitra tinggal di alamat saat ini?',
        type: 'dropdown',
        options: ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'],
      },
    ],
  },
  {
    id: 'lingkungan',
    title: 'Cek lingkungan',
    fields: [
      { label: 'Selfie BP & narasumber lingkungan', type: 'foto' },
      {
        label: 'Bagaimana pengakuan warga / Ketua Majelis terhadap mitra?',
        type: 'dropdown-notes',
        options: ['Dikenal baik', 'Dikenal, netral', 'Kurang dikenal', 'Ada catatan negatif'],
      },
      {
        label: 'Sumber informasi lingkungan yang ditemui BP',
        type: 'dropdown',
        options: ['Ketua Majelis', 'Tetangga', 'Ketua RT / RW', 'Tokoh setempat'],
      },
      {
        label: 'Verifikasi domisili: apakah alamat sekarang sesuai dengan data domisili?',
        type: 'dropdown',
        options: ['Sesuai', 'Tidak sesuai'],
      },
      {
        label: 'Lama tinggal menurut lingkungan',
        type: 'dropdown',
        options: ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'],
      },
      {
        label: 'Apakah usaha mitra sesuai dengan data pengajuan dan masih berjalan?',
        type: 'dropdown',
        options: [
          'Sesuai & berjalan',
          'Sesuai & tidak berjalan',
          'Tidak sesuai & berjalan',
          'Tidak sesuai & tidak berjalan',
        ],
      },
      {
        label: 'Pernah didatangi atau dihubungi debt collector?',
        type: 'dropdown',
        options: ['Pernah', 'Tidak pernah'],
      },
    ],
  },
  {
    id: 'penilaian',
    title: 'Penilaian BP',
    fields: [
      {
        label: 'Kesanggupan pembayaran mitra per minggu',
        type: 'dropdown',
        options: [
          'Rp50.000 - Rp100.000',
          'Rp100.000 - Rp150.000',
          'Rp150.000 - Rp200.000',
          'Rp200.000 - Rp250.000',
          '> Rp250.000',
        ],
      },
      {
        label: 'Apakah ada indikasi buruk terhadap mitra ini?',
        type: 'multiselect',
        options: [
          'Karakter tidak baik (sulit ditemui / ditagih)',
          'Mitra pindah domisili',
          'Isu majelis (tidak akur / KM tidak setuju cair)',
          'Umur lebih dari 64 tahun',
          'Indikasi fraud (joki / atas nama)',
        ],
      },
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
