'use client'

// Jadwal Pembayaran — Figma node 2967:32902. Every Minggu of the 48-week loan
// with its due date; reached from "Lihat semua tanggal" on Progress limit.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { WeekCard, weekDate } from '../lib/riwayat'

export function JadwalPembayaranScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Jadwal Pembayaran" onBack={flow.back} />}>
      <div className="-mx-16 -mt-16 flex flex-1 flex-col gap-16 bg-neutral-50 p-16">
        {Array.from({ length: 48 }, (_, i) => (
          <WeekCard key={i} title={`Minggu ${i + 1}`} date={weekDate(i + 1)} />
        ))}
      </div>
    </Screen>
  )
}
