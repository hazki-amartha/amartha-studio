'use client'

// Halaman Majelis — a light read-only view of the majelis a lead belongs to,
// reached from an approved lead's "Lihat halaman Majelis" CTA. A click-through
// placeholder standing in for the real Majelis surface (the bottom-nav Majelis
// tab): it shows the group, its schedule and its roster, enough to land the
// approved lead somewhere that reads as "her majelis" without leaving the app.

import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { CalendarDots, MapPin, Users } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { majelisLine } from '../lib/pipeline'
import { usePipeline } from '../lib/pipeline-store'
import { AppScreen } from '../lib/ui'

// A short stand-in roster — enough to read as a real group beside the lead.
const ROSTER = ['Rohaya', 'Siti Aisyah', 'Euis Komariah', 'Nia Kurniasih']

export function MajelisPageScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Halaman Majelis" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const roster = [lead.name, ...ROSTER.filter((n) => n !== lead.name)].slice(0, 5)

  return (
    <AppScreen topBar={<NavigationHeader title="Halaman Majelis" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex items-start justify-between gap-8">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-18 font-bold text-default">{majelisLine(lead)}</span>
              <span className="flex items-center gap-4 text-12 text-caption">
                <MapPin size={16} />
                {lead.address?.kecamatan ? `Kec. ${lead.address.kecamatan}` : 'Wilayah BP'}
              </span>
            </div>
            <Badge intent="green">Aktif</Badge>
          </div>
          <div className="flex items-center gap-8 rounded-12 bg-canvas-blue px-12 py-8 text-12 text-default">
            <span className="text-primary-500">
              <CalendarDots size={20} />
            </span>
            Kumpulan setiap minggu · {roster.length} anggota
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <span className="flex items-center gap-8 text-14 font-bold text-default">
            <Users size={20} />
            Anggota Majelis
          </span>
          <div className="flex flex-col">
            {roster.map((name, i) => (
              <div
                key={name}
                className={`flex items-center gap-12 py-8 ${i > 0 ? 'border-t border-default' : ''}`}
              >
                <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-12 font-bold text-caption">
                  {name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-14 text-default">{name}</span>
                {i === 0 ? (
                  <Badge intent="primary" size="sm">
                    Baru
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </AppScreen>
  )
}
