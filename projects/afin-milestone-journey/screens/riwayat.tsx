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
  const bayarCount = HISTORY.filter((e) => e.bayar).length
  const kumpulanCount = HISTORY.filter((e) => e.kumpulan).length

  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Ibu Siti" onBack={() => flow.go('home')} />}
    >
      {/* What she still owes, and how long is left to clear it. "Lihat detail"
          opens the loan's own journey — the full ladder. */}
      <div className="rounded-12 border border-default p-16">
        <div className="flex items-start gap-8">
          <p className="min-w-0 flex-1 text-16 text-caption">Sisa angsuran</p>
          <button
            type="button"
            onClick={() => flow.go('progress')}
            className="shrink-0 text-14 font-bold text-primary-500"
          >
            Lihat detail
          </button>
        </div>
        {/* Balance and time left on one line: they are one fact, and splitting
            them made the page read as two headlines. */}
        <p className="mt-4 text-20 font-bold text-default">
          {rupiah(LOAN_OUTSTANDING)} ({WEEKS_LEFT} minggu lagi)
        </p>
        <p className="mt-2 text-14 text-caption">dari {rupiah(LOAN_PRINCIPAL)}</p>
      </div>

      {/* The record that justifies the headline — its two counters as a summary,
          between the heading and the tiles. */}
      <div>
        <p className="mb-12 text-16 font-bold text-default">Riwayat mingguan</p>
        <div className="mb-12 flex gap-12">
          <Summary label="Bayar tepat waktu" value={`${bayarCount}/${total}`} tone="green" />
          <Summary label="Hadir kumpulan" value={`${kumpulanCount}/${total}`} tone="primary" />
        </div>
        {/* HISTORY is already newest-first, so this week takes the first tile. */}
        <WeekGrid weeks={HISTORY} highlightWeek={HISTORY[0]?.week} />
      </div>
    </Screen>
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
