'use client'

// Riwayat — the receipts behind the discipline claim. Progress says a payout is
// coming; this is the record that earns it, week by week.
//
// The two counters at the top are the only aggregate on the page. Everything
// below is the raw ledger, because the mitra opening this screen has usually
// come to check one specific week she is unsure about, and a summary cannot
// answer that.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY } from '../lib/data'
import { StatusMark } from '../lib/ui'

export function RiwayatScreen() {
  const flow = useFlow()
  const total = HISTORY.length
  const bayarCount = HISTORY.filter((e) => e.bayar).length
  const kumpulanCount = HISTORY.filter((e) => e.kumpulan).length

  return (
    <Screen
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

      <div className="overflow-hidden rounded-12 border border-default">
        <div className="flex items-center gap-8 border-b border-default bg-neutral-50 px-16 py-8">
          <span className="flex-1 text-12 font-bold text-caption">Minggu</span>
          <span className="w-48 text-right text-12 font-bold text-caption">Bayar</span>
          <span className="w-48 text-right text-12 font-bold text-caption">Hadir</span>
        </div>
        {HISTORY.map((e, i) => (
          <div
            key={e.week}
            className={`flex items-center gap-8 px-16 py-12 ${
              i === 0 ? '' : 'border-t border-light'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-14 font-bold text-default">Minggu {e.week}</p>
              <p className="text-12 text-caption">{e.date}</p>
            </div>
            <span className="shrink-0">
              <StatusMark
                ok={e.bayar}
                okLabel={e.bayarAmount ?? 'Bayar'}
                failLabel="Belum bayar"
              />
            </span>
            <span className="w-48 shrink-0">
              <StatusMark ok={e.kumpulan} okLabel="Hadir" failLabel="Absen" />
            </span>
          </div>
        ))}
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
