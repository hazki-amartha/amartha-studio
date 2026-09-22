'use client'

// The POI list survives navigation — a BM who adds a POI and lands back on the
// list needs to see it there. Screens remount on every go(), so this lives in
// a module store rather than useState.
//
// The create form's DRAFT lives here too, rather than in the screen's own
// useState — that's what lets the "Auto-filled" state (index.ts) fill the form
// before the screen ever mounts, the same way `apply` seeds any other screen's
// module store.

import { useSyncExternalStore } from 'react'

export interface PoiRecord {
  id: string
  name: string
  jenis: string
  kecamatan: string
  desa: string
  jadwal: string
  assignedFo: string
}

let pois: PoiRecord[] = [
  {
    id: 'poi-1',
    name: 'Pasar Ciseeng',
    jenis: 'Pasar',
    kecamatan: 'Ciseeng',
    desa: 'Ciseeng',
    jadwal: 'Senin',
    assignedFo: 'Sari Handayani',
  },
  {
    id: 'poi-2',
    name: 'Balai Desa Waru',
    jenis: 'Balai',
    kecamatan: 'Parung',
    desa: 'Waru',
    jadwal: 'Rabu',
    assignedFo: 'Rina Marlina',
  },
  {
    id: 'poi-3',
    name: 'Kampung Curug',
    jenis: 'Kampung',
    kecamatan: 'Gunung Sindur',
    desa: 'Curug',
    jadwal: 'Jumat',
    assignedFo: '',
  },
]

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function addPoi(record: Omit<PoiRecord, 'id'>) {
  pois = [...pois, { ...record, id: `poi-${pois.length + 1}` }]
  notify()
}

export function usePois() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => pois,
    () => pois,
  )
}

// --- Create-form draft --------------------------------------------------

export interface PoiDraft {
  name: string
  jenis: string
  jamMulai: string
  jamSelesai: string
  kecamatan: string
  desa: string
  alamat: string
  namaKontak: string
  hpKontak: string
  jadwal: string
  assignedFo: string
  catatan: string
}

const EMPTY_DRAFT: PoiDraft = {
  name: '',
  jenis: '',
  jamMulai: '',
  jamSelesai: '',
  kecamatan: '',
  desa: '',
  alamat: '',
  namaKontak: '',
  hpKontak: '',
  jadwal: '',
  assignedFo: '',
  catatan: '',
}

let draft: PoiDraft = { ...EMPTY_DRAFT }

export function setDraftField<K extends keyof PoiDraft>(field: K, value: PoiDraft[K]) {
  draft = { ...draft, [field]: value }
  notify()
}

export function resetDraft() {
  draft = { ...EMPTY_DRAFT }
  notify()
}

/** The "Auto-filled" state (index.ts) — a representative POI, filled end to
 *  end, so reviewing the filled-out layout doesn't cost re-typing every field. */
export function fillSampleDraft() {
  draft = {
    name: 'Posyandu Melati',
    jenis: 'Posyandu',
    jamMulai: '08.00',
    jamSelesai: '11.00',
    kecamatan: 'Parung',
    desa: 'Waru',
    alamat: 'Jl. Melati No. 4, dekat balai warga',
    namaKontak: 'Ibu Yanti',
    hpKontak: '81234567890',
    jadwal: 'Selasa',
    assignedFo: 'Ani Suryani',
    catatan: 'Sudah dikonfirmasi kader setempat, bawa materi sosialisasi cetak.',
  }
  notify()
}

export function useDraft() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => draft,
    () => draft,
  )
}
