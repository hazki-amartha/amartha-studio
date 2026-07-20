// The standing details behind a mitra that the ledger itself doesn't carry:
// how to reach her, where she lives, how long she has been a mitra.
//
// Much smaller than the equivalent module in apartner-task-first, and
// deliberately so. There, the mitra page had to synthesise a payment history out
// of a DPD number because nothing else existed; here the ledger IS the history,
// authored week by week in data.ts, so this module has no history to invent.
//
// What remains is generated deterministically from the mitra's name, so she has
// the same phone number and address every time she is opened, from any screen.

import type { Mitra } from './data'

/** Stable small integer from a string. Same mitra, same record, every time. */
function hashOf(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) % 100_000
  }
  return h
}

export interface Profile {
  phone: string
  address: string
  /** How long she has been a mitra — the thing that earns patience. */
  joined: string
}

const JOINED = ['Maret 2023', 'Agustus 2023', 'Januari 2024', 'Juni 2024', 'Oktober 2024']

export function profileOf(mitra: Mitra): Profile {
  const h = hashOf(mitra.name)
  return {
    phone: `0812-${String(3000 + (h % 6000))}-${String(1000 + (h % 8999))}`,
    address: `Kp. Cibeuteung RT ${String(1 + (h % 8)).padStart(2, '0')} / RW 04, Ciseeng`,
    joined: JOINED[h % JOINED.length],
  }
}
