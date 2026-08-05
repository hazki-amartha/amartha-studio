'use client'

// The weekly record as a grid of dated tiles — one tile per week, carrying BOTH
// habits. Lives here rather than in a screen because two screens now argue from
// the same evidence: Riwayat, where it IS the page, and the missed-milestone
// screen, where the last ten weeks are what makes "kumpulan tidak teratur" a
// finding rather than an accusation. Drawing the record two different ways
// would let the two screens disagree about the same twelve weeks.
//
// The two facts are not equal and the tile says so. The big mark is the
// repayment — the thing the milestone actually pays out on — and attendance
// rides underneath as a small labelled line. Ranking them by size is what stops
// a missed kumpulan reading as a missed instalment.

import { Check, Cross, Users } from '@/design-system/icons'
import type { WeekEntry } from './data'

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
                className={`flex items-center gap-2 text-10 font-bold ${
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
