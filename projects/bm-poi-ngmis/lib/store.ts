'use client'

// The POI list survives navigation — a BM who adds a POI and lands back on the
// list needs to see it there. Screens remount on every go(), so this lives in
// a module store rather than useState.
//
// The create/edit form's DRAFT lives here too, rather than in the screen's own
// useState — that's what lets the "Auto-filled" state (index.ts) fill the form
// before the screen ever mounts, and what lets a list row load its own record
// into the same form before navigating to it.

import { useSyncExternalStore } from 'react'

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

export interface PoiRecord extends PoiDraft {
  id: string
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

let pois: PoiRecord[] = [
  {
    id: 'poi-1',
    name: 'Pasar Ciseeng',
    jenis: 'Pasar',
    jamMulai: '06.00',
    jamSelesai: '12.00',
    kecamatan: 'Ciseeng',
    desa: 'Ciseeng',
    alamat: 'Jl. Raya Ciseeng, dekat terminal',
    namaKontak: 'Pak Dedi',
    hpKontak: '81298765432',
    jadwal: 'Senin',
    assignedFo: 'Sari Handayani',
    catatan: '',
  },
  {
    id: 'poi-2',
    name: 'Balai Desa Waru',
    jenis: 'Balai',
    jamMulai: '08.00',
    jamSelesai: '15.00',
    kecamatan: 'Parung',
    desa: 'Waru',
    alamat: 'Jl. Balai Desa Waru No. 1',
    namaKontak: 'Bu Kartini',
    hpKontak: '82112345678',
    jadwal: 'Rabu',
    assignedFo: 'Rina Marlina',
    catatan: '',
  },
  {
    id: 'poi-3',
    name: 'Kampung Curug',
    jenis: 'Kampung',
    jamMulai: '07.00',
    jamSelesai: '11.00',
    kecamatan: 'Gunung Sindur',
    desa: 'Curug',
    alamat: '',
    namaKontak: '',
    hpKontak: '',
    jadwal: 'Jumat',
    assignedFo: '',
    catatan: '',
  },
]

let draft: PoiDraft = { ...EMPTY_DRAFT }
/** The id being edited, or null when the form is for a new POI — set by a
 *  list row's "edit" action, read by the form to switch its title/submit
 *  between "POI Baru" and "Edit POI". */
let editingId: string | null = null

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function addPoi(record: PoiDraft) {
  pois = [...pois, { ...record, id: `poi-${pois.length + 1}` }]
  notify()
}

export function updatePoi(id: string, record: PoiDraft) {
  pois = pois.map((p) => (p.id === id ? { ...record, id } : p))
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

// --- Create/edit form draft ----------------------------------------------

export function setDraftField<K extends keyof PoiDraft>(field: K, value: PoiDraft[K]) {
  draft = { ...draft, [field]: value }
  notify()
}

/** "Tambah POI" — a blank form, no record being edited. */
export function beginCreate() {
  draft = { ...EMPTY_DRAFT }
  editingId = null
  notify()
}

/** A list row — loads that POI's own fields into the form. */
export function beginEdit(poi: PoiRecord) {
  const { id, ...fields } = poi
  draft = { ...fields }
  editingId = id
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
  editingId = null
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

export function useEditingId() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => editingId,
    () => editingId,
  )
}
