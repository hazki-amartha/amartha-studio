'use client'

// The weekly record as a grid of dated tiles — one tile per week, carrying
// BOTH habits (payment and attendance). Project-local port of the WeekGrid
// on afin-milestone-journey's "Progress pribadi" screen, copied verbatim
// (§2/§3: never import across projects).

import { Check, Cross, Users } from '@/design-system/icons'

export interface WeekEntry {
  week: number
  date: string
  bayar: boolean
  /** Only set when `bayar` — the tile prints the amount, not a tick. */
  bayarAmount?: string
  /** Paid, but after the due date: still counts as paid, so the amount shows and
   *  the tile marks amber rather than green, and it drops out of "tepat waktu". */
  late?: boolean
  kumpulan: boolean
}

// Twelve weeks, newest first, ending on the week of 14 Jul 2026 — the same
// record shown on afin-milestone-journey's Progress pribadi page.
export const HISTORY: WeekEntry[] = [
  { week: 12, date: '14 Jul 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 11, date: '7 Jul 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 10, date: '30 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: false },
  { week: 9, date: '23 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 8, date: '16 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 7, date: '9 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 6, date: '2 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 5, date: '26 Mei 2026', bayar: true, bayarAmount: 'Rp150.000', late: true, kumpulan: true },
  { week: 4, date: '19 Mei 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 3, date: '12 Mei 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 2, date: '5 Mei 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 1, date: '28 Apr 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
]

/** '19 Agu 2024' → '19 Agu'. The year is the same on every tile. */
export function shortDate(date: string) {
  return date.split(' ').slice(0, 2).join(' ')
}

/** 'Rp150.000' → 'Rp150rb'; nothing paid → 'Rp0'. A tile can't hold the full
 *  figure, and the rounded one is how the amount is said out loud anyway. */
export function ringkas(amount?: string) {
  const value = Number((amount ?? '').replace(/\D/g, ''))
  if (!value) return 'Rp0'
  return value >= 1000000 ? `Rp${value / 1000000}jt` : `Rp${Math.round(value / 1000)}rb`
}

export function WeekGrid({
  title,
  weeks,
  /** The week drawn in primary — normally the current one. Omit for none. */
  highlightWeek,
}: {
  title?: string
  weeks: WeekEntry[]
  highlightWeek?: number
}) {
  return (
    <div>
      {title ? <p className="mb-8 text-14 font-bold text-default">{title}</p> : null}
      {/* Four across: wide enough that "19 Agu" and "Rp150rb" both sit on one
          line, which is the whole reason the tile beats a bare dot. */}
      <div className="grid grid-cols-4 gap-8">
        {weeks.map((w) => {
          const today = w.week === highlightWeek
          return (
            <div
              key={w.week}
              className={`flex flex-col items-center gap-4 rounded-12 py-12 ${
                today ? 'bg-primary-50' : 'bg-neutral-50'
              }`}
            >
              <span className={`text-12 ${today ? 'font-bold text-primary-500' : 'text-caption'}`}>
                {shortDate(w.date)}
              </span>
              {/* Three marks, not two: paid on time is green, paid late is amber
                  (she paid, just not on the day), and unpaid is a red cross. */}
              <span
                className={`flex h-24 w-24 items-center justify-center rounded-full text-neutral-white ${
                  !w.bayar ? 'bg-red-500' : w.late ? 'bg-orange-500' : 'bg-green-500'
                }`}
              >
                {w.bayar ? <Check size={16} /> : <Cross size={16} />}
              </span>
              <span
                className={`text-12 font-bold ${
                  today ? 'text-primary-500' : w.bayar ? 'text-default' : 'text-red-500'
                }`}
              >
                {ringkas(w.bayarAmount)}
              </span>
              {/* Attendance, ranked below the money: an icon and a word, never a
                  second circle. Green when she came, red when she missed — the
                  colour echoes the mark above so the tile reads at a glance. */}
              <span
                className={`flex items-center gap-2 text-12 font-bold ${
                  w.kumpulan ? 'text-green-600' : 'text-red-500'
                }`}
              >
                <Users size={16} />
                {w.kumpulan ? 'Hadir' : 'Absen'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
