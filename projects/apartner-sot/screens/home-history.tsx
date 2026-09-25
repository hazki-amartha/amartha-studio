'use client'

// Tugas Home Visit — every earlier home visit to this mitra, newest first:
// who went, who was met, what was paid, why not, and what was promised.
// Reached from "Lihat semua" on Kunjungi. Per the BP APP 2026 Figma.

import { Card, NavigationHeader } from '@/design-system/components'
import { Door } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { pastHomeVisits } from '../lib/home-history'
import { openHomeMitra, useApp } from '../lib/store'
import { AppScreen } from '../lib/ui'

export function HomeHistoryScreen() {
  const flow = useFlow()
  const s = useApp()
  const visits = pastHomeVisits(openHomeMitra(s).id)

  return (
    <AppScreen topBar={<NavigationHeader title="Tugas Home Visit" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-12 pb-16">
        {visits.length === 0 ? (
          <p className="py-16 text-center text-12 text-caption">Belum ada home visit sebelumnya.</p>
        ) : null}
        {visits.map((v) => (
          <Card key={v.no}>
            <div className="flex flex-col gap-12">
              <div className="flex items-center gap-12">
                <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                  <Door size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-12 text-caption">Home Visit ke-{v.no}</span>
                  <span className="text-14 font-bold text-default">{v.date}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-12 border-t border-default pt-12">
                <Fact label="Petugas" value={v.officer} />
                <Fact label="Ditemui" value={v.met} />
                <Fact label="Dibayar" value={rupiah(v.paid)} />
                <Fact label="Alasan" value={v.reason} />
                <Fact label="Janji bayar" value={v.ptp} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppScreen>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-2">
      <span className="text-12 text-caption">{label}</span>
      <span className="break-words text-14 text-default">{value}</span>
    </span>
  )
}
