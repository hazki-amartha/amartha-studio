'use client'

// Riwayat — the receipts behind the discipline claim. Progress says a payout is
// coming; this is the record that earns it, week by week.
//
// The two counters at the top are the only aggregate on the page. Everything
// below is the raw ledger, because the mitra opening this screen has usually
// come to check one specific week she is unsure about, and a summary cannot
// answer that.
//
// The ledger itself is `WeekGrid` (lib/week-tiles) — one tile per week, on a
// flat white ground. Newest first: the week she opened this screen to check is
// nearly always the current one, and it should be the first tile she lands on.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY } from '../lib/data'
import { WeekGrid } from '../lib/week-tiles'

export function RiwayatScreen() {
  const flow = useFlow()
  const total = HISTORY.length
  const bayarCount = HISTORY.filter((e) => e.bayar).length
  const kumpulanCount = HISTORY.filter((e) => e.kumpulan).length

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

      {/* HISTORY is already newest-first, so this week takes the first tile. */}
      <WeekGrid title="Riwayat mingguan" weeks={HISTORY} highlightWeek={HISTORY[0]?.week} />
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
