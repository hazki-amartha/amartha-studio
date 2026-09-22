'use client'

// The POI list survives navigation — a BM who adds a POI and lands back on the
// list needs to see it there. Screens remount on every go(), so this lives in
// a module store rather than useState.

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
