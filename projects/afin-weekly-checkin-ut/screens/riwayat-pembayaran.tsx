'use client'

// Reached only from "Lihat riwayat" on the "Kelancaran pembayaran" factor
// card in Status pinjaman — the exact "Riwayat mingguan" block from
// afin-milestone-journey's Progress pribadi page (§2: project-local port,
// not a cross-project import).

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, WeekGrid } from '../lib/week-history'

export function RiwayatPembayaranScreen() {
  const flow = useFlow()
  const total = HISTORY.length
  // "Tepat waktu" is on-time, so a paid-but-late week does not count here — it
  // still shows its amount on the tile, just not a green mark.
  const bayarCount = HISTORY.filter((e) => e.bayar && !e.late).length
  const kumpulanCount = HISTORY.filter((e) => e.kumpulan).length

  return (
    <Screen topBar={<NavigationHeader title="Riwayat mingguan" onBack={flow.back} />}>
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
