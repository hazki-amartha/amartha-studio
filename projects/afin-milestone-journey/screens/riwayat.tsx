'use client'

// Riwayat — the receipts behind the discipline claim. Progress says a payout is
// coming; this is the record that earns it, week by week.
//
// The two counters at the top are the only aggregate on the page. Everything
// below is the raw ledger, because the mitra opening this screen has usually
// come to check one specific week she is unsure about, and a summary cannot
// answer that.
//
// One tile per week, carrying BOTH habits, on a flat white ground — no cards,
// no rails. Two separate grids made the mitra cross-reference her own screen to
// answer "what happened that week"; one tile answers it in place.
//
// The two facts are not equal and the tile says so. The big mark is the
// repayment — the thing the milestone actually pays out on — and attendance
// rides underneath as a small labelled line. Ranking them by size is what stops
// a missed kumpulan reading as a missed instalment.
//
// The tiles WRAP onto the next line rather than scrolling sideways, so every
// week is on the page at once. Newest first: the week she opened this screen to
// check is nearly always the current one, and it should be the first tile she
// lands on — tinted primary, the one tile on the page that is not grey — with
// the weeks behind it running back in time from there.

import { NavigationHeader } from '@/design-system/components'
import { Check, Cross, Users } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY } from '../lib/data'

export function RiwayatScreen() {
  const flow = useFlow()
  const total = HISTORY.length
  const bayarCount = HISTORY.filter((e) => e.bayar).length
  const kumpulanCount = HISTORY.filter((e) => e.kumpulan).length
  // HISTORY is already newest-first, which is the order the grid wants: this
  // week takes the first tile.
  const thisWeek = HISTORY[0]?.week
  const weeks = HISTORY

  return (
    <Screen
      canvas="white"
      topBar={
        <NavigationHeader
          title="Riwayat pembayaran & kehadiran"
          onBack={() => flow.go('home')}
        />
      }
    >
      <div className="flex gap-12">
        <Summary label="Bayar tepat waktu" value={`${bayarCount}/${total}`} tone="green" />
        <Summary label="Hadir kumpulan" value={`${kumpulanCount}/${total}`} tone="primary" />
      </div>

      <WeekGrid
        title="Riwayat mingguan"
        cells={weeks.map((e) => ({
          key: e.week,
          date: shortDate(e.date),
          today: e.week === thisWeek,
          bayar: e.bayar,
          amount: ringkas(e.bayarAmount),
          hadir: e.kumpulan,
        }))}
      />
    </Screen>
  )
}

/** '19 Agu 2024' → '19 Agu'. The year is the same on every tile. */
function shortDate(date: string) {
  return date.split(' ').slice(0, 2).join(' ')
}

/** 'Rp150.000' → 'Rp150rb'; nothing paid → 'Rp0'. A tile can't hold the full
 *  figure, and the rounded one is how the amount is said out loud anyway. */
function ringkas(amount?: string) {
  const value = Number((amount ?? '').replace(/\D/g, ''))
  if (!value) return 'Rp0'
  return value >= 1000000 ? `Rp${value / 1000000}jt` : `Rp${Math.round(value / 1000)}rb`
}

function WeekGrid({
  title,
  cells,
}: {
  title: string
  cells: {
    key: number
    date: string
    today: boolean
    bayar: boolean
    amount: string
    hadir: boolean
  }[]
}) {
  return (
    <div>
      <p className="mb-8 text-14 font-bold text-default">{title}</p>
      {/* Four across: wide enough that "19 Agu" and "Rp150rb" both sit on one
          line, which is the whole reason the tile beats a bare dot. */}
      <div className="grid grid-cols-4 gap-8">
        {cells.map((c) => (
          <div
            key={c.key}
            className={`flex flex-col items-center gap-4 rounded-12 py-12 ${
              c.today ? 'bg-primary-50' : 'bg-neutral-50'
            }`}
          >
            <span className={`text-12 ${c.today ? 'font-bold text-primary-500' : 'text-caption'}`}>
              {c.date}
            </span>
            <span
              className={`flex h-24 w-24 items-center justify-center rounded-full text-neutral-white ${
                c.bayar ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {c.bayar ? <Check size={16} /> : <Cross size={16} />}
            </span>
            <span
              className={`text-12 font-bold ${
                c.today ? 'text-primary-500' : c.bayar ? 'text-default' : 'text-red-500'
              }`}
            >
              {c.amount}
            </span>
            {/* Attendance, ranked below the money: an icon and a word, never a
                second circle. Grey when she came — a good week should not add
                colour to a tile whose story is already told above it. */}
            <span
              className={`flex items-center gap-2 text-10 font-bold ${
                c.hadir ? 'text-caption' : 'text-red-500'
              }`}
            >
              <Users size={16} />
              {c.hadir ? 'Hadir' : 'Absen'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'green' | 'primary'
}) {
  const toneClass =
    tone === 'green' ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
  return (
    <div className={`flex-1 rounded-12 p-16 ${toneClass}`}>
      <p className="text-12 font-regular">{label}</p>
      <p className="mt-4 text-24 font-bold">{value}</p>
    </div>
  )
}
