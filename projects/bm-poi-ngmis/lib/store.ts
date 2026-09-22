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
  jamMulai: string
  jamSelesai: string
}

let pois: PoiRecord[] = [
  {
    id: 'poi-1',
    name: 'Pasar Ciseeng',
    jenis: 'Pasar',
    kecamatan: 'Ciseeng',
    desa: 'Ciseeng',
    jamMulai: '06.00',
    jamSelesai: '12.00',
  },
  {
    id: 'poi-2',
    name: 'Balai Desa Waru',
    jenis: 'Balai',
    kecamatan: 'Parung',
    desa: 'Waru',
    jamMulai: '08.00',
    jamSelesai: '15.00',
  },
  {
    id: 'poi-3',
    name: 'Kampung Curug',
    jenis: 'Kampung',
    kecamatan: 'Gunung Sindur',
    desa: 'Curug',
    jamMulai: '07.00',
    jamSelesai: '11.00',
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
