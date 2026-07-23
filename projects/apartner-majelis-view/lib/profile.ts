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
  /**
   * Where she trades. A separate route from her house because the BP chasing a
   * warung owner at 10.00 wants the warung, not a locked front door — and the
   * two are rarely the same address.
   */
  business: string
  /** Her penanggung jawab — who the BP calls when the mitra doesn't answer. */
  pjName: string
  pjPhone: string
  /** How long she has been a mitra — the thing that earns patience. */
  joined: string
}

const JOINED = ['Maret 2023', 'Agustus 2023', 'Januari 2024', 'Juni 2024', 'Oktober 2024']
const TRADES = ['Warung sembako', 'Kios sayur', 'Warung nasi', 'Toko kelontong', 'Lapak buah']
const PJ_NAMES = ['Ibu Ketua Nurhayati', 'Ibu Imas Masitoh', 'Ibu Tuti Herawati', 'Bapak Asep Saepudin']

function phoneFrom(h: number): string {
  return `0812-${String(3000 + (h % 6000))}-${String(1000 + (h % 8999))}`
}

export function profileOf(mitra: Mitra): Profile {
  const h = hashOf(mitra.name)
  return {
    phone: phoneFrom(h),
    address: `Kp. Cibeuteung RT ${String(1 + (h % 8)).padStart(2, '0')} / RW 04, Ciseeng`,
    business: `${TRADES[h % TRADES.length]} — Pasar Ciseeng blok ${String.fromCharCode(65 + (h % 4))}`,
    pjName: PJ_NAMES[h % PJ_NAMES.length],
    pjPhone: phoneFrom(h * 7 + 13),
    joined: JOINED[h % JOINED.length],
  }
}
