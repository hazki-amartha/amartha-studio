'use client'

// The POI store — the mutable list of sosialisasi POIs, seeded from EVENTS.
//
// POIs used to be fixed seed data. The BM view needs them editable: it can add a
// POI, (re)schedule one with no sosialisasi date, and reassign a POI to another
// petugas. So the working copy lives here and the screens read it via `usePois`,
// while `EVENTS` stays as the seed.

import { useSyncExternalStore } from 'react'
import { EVENTS, type SosialisasiEvent } from './events'
import type { Agenda } from './pipeline'

const seed = (): SosialisasiEvent[] => EVENTS.map((e) => ({ ...e }))

let pois: SosialisasiEvent[] = seed()

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const poiStore = {
  get: () => pois,
  reset() {
    pois = seed()
    emit()
  },
  find(id: string): SosialisasiEvent | undefined {
    return pois.find((p) => p.id === id)
  },

  /** Add a POI (the BM "Add POI" form). Prepended and returned. */
  add(data: Omit<SosialisasiEvent, 'id'>): string {
    const id = `poi${Date.now()}`
    pois = [{ id, ...data }, ...pois]
    emit()
    return id
  },

  /** Set (or replace) a POI's sosialisasi schedule, optionally its petugas. */
  schedule(id: string, agenda: Agenda, fo?: string) {
    pois = pois.map((p) => (p.id === id ? { ...p, agenda, fo: fo ?? p.fo } : p))
    emit()
  },

  /** Reassign a POI's sosialisasi to another petugas. */
  reassign(id: string, fo: string) {
    pois = pois.map((p) => (p.id === id ? { ...p, fo } : p))
    emit()
  },
}

export function usePois(): SosialisasiEvent[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    poiStore.get,
    poiStore.get,
  )
}
