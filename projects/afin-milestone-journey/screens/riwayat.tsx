'use client'

// Ibu Siti's progress page — a simplified read of where her loan stands and how
// she has kept up. Two things, in order: what she still owes and how long is
// left to clear it, then the week-by-week record that got her there.
//
// It briefly carried the limit, the payout tile and the instalment row too —
// everything she could DO about the loan. Those belong on home; this page is
// the read, not the actions, so it keeps only the headline and the ledger.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, LOAN_OUTSTANDING, LOAN_PRINCIPAL, WEEKS_LEFT, rupiah } from '../lib/data'
import { WeekGrid } from '../lib/week-tiles'

export function RiwayatScreen() {
  const flow = useFlow()
  const total = HISTORY.length
  // "Tepat waktu" is on-time, so a paid-but-late week does not count here — it
  // still shows its amount on the tile, just not a green mark.
  const bayarCount = HISTORY.filter((e) => e.bayar && !e.late).length
  const kumpulanCount = HISTORY.filter((e) => e.kumpulan).length

  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Ibu Siti" onBack={() => flow.go('home')} />}
    >
      {/* What she still owes, and how long is left to clear it. "Detail" opens
          the loan-level list of every disbursement she has taken. */}
      <div className="rounded-12 border border-default p-16">
        <div className="flex items-start gap-8">
          <p className="min-w-0 flex-1 text-16 text-caption">Sisa angsuran</p>
          <button
            type="button"
            onClick={() => flow.go('pencairan')}
            className="shrink-0 text-14 font-bold text-primary-500"
          >
            Detail
          </button>
        </div>
        {/* Balance and time left on one line: the weeks-left rides as a quiet
            pill beside the figure so it reads as one fact, not two headlines. */}
        <div className="mt-4 flex items-center gap-8">
          <p className="text-20 font-bold text-default">{rupiah(LOAN_OUTSTANDING)}</p>
          <span className="rounded-full bg-neutral-100 px-8 py-4 text-12 font-bold text-neutral-700">
            {WEEKS_LEFT} minggu lagi
          </span>
        </div>
        <p className="mt-2 text-14 text-caption">dari {rupiah(LOAN_PRINCIPAL)}</p>
      </div>

      {/* The record that justifies the headline — its two counters as a summary,
          between the heading and the tiles. */}
      <div>
        <p className="mb-12 text-16 font-bold text-default">Riwayat mingguan</p>
        <div className="mb-12 flex gap-12">
          <Summary label="Bayar tepat waktu" value={`${bayarCount}/${total}`} />
          <Summary label="Hadir kumpulan" value={`${kumpulanCount}/${total}`} />
        </div>
        {/* HISTORY is already newest-first, so this week takes the first tile. */}
        <WeekGrid weeks={HISTORY} highlightWeek={HISTORY[0]?.week} />
      </div>
    </Screen>
  )
}

// Bordered rather than tinted: the two counters are a quiet reference under the
// heading, so they sit in plain outlined boxes and let the tiles below carry the
// colour.
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-12 border border-default p-16">
      <p className="text-12 font-regular text-caption">{label}</p>
      <p className="mt-4 text-24 font-bold text-default">{value}</p>
    </div>
  )
}
