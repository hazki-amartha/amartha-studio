'use client'

// POI detail — what a list row opens onto by default: the POI's own fields,
// read-only, with an explicit Edit action rather than dropping straight into
// the form. Mirrors the form's section layout (General / Kontak dan Lokasi /
// Detail Sosialisasi) so the two read as one continuous screen.

import { Button } from '@/design-system/components'
import { Pen } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { beginEdit, usePois, useViewingId } from '../lib/store'
import { BmShell } from '../lib/shell'
import { PageHeading, Panel, ReadField, SectionTitle } from '../lib/ui'

export function PoiDetailScreen() {
  const flow = useFlow()
  const pois = usePois()
  const viewingId = useViewingId()
  const poi = pois.find((p) => p.id === viewingId)

  if (!poi) {
    return (
      <BmShell breadcrumbs={[{ label: 'Home' }, { label: 'Branches' }, { label: 'POI creation', current: true }]}>
        <Button variant="outline" onClick={() => flow.go('poi-list')}>
          Kembali ke daftar
        </Button>
      </BmShell>
    )
  }

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'POI creation', onClick: () => flow.go('poi-list') },
        { label: poi.name, current: true },
      ]}
    >
      <div className="flex flex-col gap-24">
        <PageHeading
          title={poi.name}
          actions={
            <Button
              onClick={() => {
                beginEdit(poi)
                flow.go('poi-create')
              }}
            >
              <Pen size={16} />
              Edit
            </Button>
          }
        />

        <Panel>
          <div className="flex flex-col gap-32">
            <div className="flex flex-col gap-16">
              <SectionTitle>General</SectionTitle>
              <div className="grid grid-cols-2 gap-16">
                <ReadField label="POI Name" value={poi.name} />
                <ReadField label="POI Type" value={poi.jenis} />
                <ReadField
                  label="Jam ramai POI"
                  value={poi.jamMulai && poi.jamSelesai ? `${poi.jamMulai} – ${poi.jamSelesai}` : undefined}
                />
              </div>
            </div>

            <div className="flex flex-col gap-16">
              <SectionTitle>Kontak dan Lokasi</SectionTitle>
              <div className="grid grid-cols-2 gap-16">
                <ReadField label="Kecamatan" value={poi.kecamatan} />
                <ReadField label="Kelurahan atau Desa" value={poi.desa} />
                <ReadField label="Alamat (titik di peta)" value={poi.alamat} />
                <ReadField label="Nama kontak" value={poi.namaKontak} />
                <ReadField label="No. HP kontak" value={poi.hpKontak ? `+62 ${poi.hpKontak}` : undefined} />
              </div>
            </div>

            <div className="flex flex-col gap-16">
              <SectionTitle>Detail Sosialisasi</SectionTitle>
              <div className="grid grid-cols-2 gap-16">
                <ReadField label="Jadwal Sosialisasi" value={poi.jadwal} />
                <ReadField label="Assigned FO" value={poi.assignedFo} />
                <ReadField label="Catatan" value={poi.catatan} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => flow.go('poi-list')}>
                Kembali
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </BmShell>
  )
}
