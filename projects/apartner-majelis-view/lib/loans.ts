// Her disbursement history — every pencairan she has taken, not just the one
// she is repaying now.
//
// The mitra page is about the CURRENT cycle: one ledger, one week strip, one
// bill. That is the right scope for a BP standing in front of her. But "berapa
// kali Ibu sudah cair?" is a real question — a mitra on her third cycle is a
// different conversation from one on her first, and it is the fact the ladder
// screen's whole argument rests on — so it gets a page rather than a line.
//
// Everything here is DERIVED. The active pencairan comes straight off her
// ledger, so the progress on that card and the week strip on her page cannot
// disagree. The finished ones are generated from her name, which means the same
// mitra has the same history every time she is opened, from any screen.

import { fullDate, type Mitra } from './data'

export interface Disbursement {
  /** "3234567" — what the BP reads out to ops. */
  id: string
  /** Her nth cycle. Counts up, so the newest carries the highest number. */
  no: number
  /** "23 April 2025" — when the money landed. */
  cairDate: string
  /** Cycle length in weeks. */
  tenor: number
  /** Instalments settled in full. */
  paidCount: number
  weekly: number
  status: 'aktif' | 'lunas'
  /** Days past due on this cycle. 0 on anything settled. */
  dpd: number
}

/** Stable small integer from a string — the same seed `profile.ts` uses. */
function hashOf(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) % 100_000
  }
  return h
}

/**
 * The DPD bucket, as ops speaks it. A number is what the BP quotes to a mitra
 * ("Ibu telat 34 hari"); a bucket is what decides what happens next, and on a
 * list of finished and unfinished cycles the bucket is the useful grain.
 */
export function dpdBucket(dpd: number): string {
  if (dpd <= 0) return 'Lancar'
  if (dpd <= 7) return 'DPD 1-7'
  if (dpd <= 14) return 'DPD 8-14'
  if (dpd <= 30) return 'DPD 15-30'
  return 'DPD 30+'
}

/**
 * Her cycles, newest first.
 *
 * ONE active pencairan, always. A mitra can carry two in real life, and the
 * reference screen shows exactly that — but every number on the mitra page is
 * derived from a single ledger, and a second live loan would make "total
 * tagihan" mean two different things depending on which screen you read it on.
 * That is the contradiction this project exists to avoid, so the second active
 * card is the one thing from the reference not copied here.
 */
export function loansOf(mitra: Mitra): Disbursement[] {
  const h = hashOf(mitra.name)
  // One or two settled cycles behind her, so the page shows both a first-timer
  // and a long-standing mitra rather than one authored shape.
  const past = 1 + (h % 2)
  const paidCount = mitra.weeks.filter((w) => w.status === 'lunas').length

  const active: Disbursement = {
    id: `${past + 1}${String(200_000 + (h % 800_000)).slice(0, 6)}`,
    no: past + 1,
    // Week 1 of the current ledger is when this money landed.
    cairDate: fullDate(mitra.week - 1),
    tenor: mitra.totalWeeks,
    paidCount,
    weekly: mitra.weekly,
    status: 'aktif',
    dpd: mitra.dpd,
  }

  const settled: Disbursement[] = []
  for (let i = past; i >= 1; i -= 1) {
    // Each earlier cycle ran its full tenor and ended the week before the next
    // one started, so the dates read as one continuous relationship.
    const weeksBack = mitra.week - 1 + (past - i + 1) * mitra.totalWeeks
    settled.push({
      id: `${i}${String(200_000 + ((h * (i + 3)) % 800_000)).slice(0, 6)}`,
      no: i,
      cairDate: fullDate(weeksBack),
      tenor: mitra.totalWeeks,
      paidCount: mitra.totalWeeks,
      // Earlier cycles were smaller — the ladder's whole premise is that modal
      // grows with each one, so a flat history would contradict it.
      weekly: Math.round((mitra.weekly * (0.6 + 0.2 * (i - 1))) / 5_000) * 5_000,
      status: 'lunas',
      dpd: 0,
    })
  }

  return [active, ...settled]
}
