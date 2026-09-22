'use client'

// POI creation — the entry point: every point of interest the BM has marked
// for her branch, with the way to add another.

import { Button } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { EmptyState, PageHeading, Panel, SimpleTable, type TableRow } from '../lib/ui'
import { usePois } from '../lib/store'

const COLUMNS = [
  { id: 'name', header: 'Nama tempat' },
  { id: 'jenis', header: 'Jenis' },
  { id: 'lokasi', header: 'Kecamatan / Desa' },
  { id: 'jadwal', header: 'Jadwal Sosialisasi' },
  { id: 'fo', header: 'Assigned FO' },
]

export function PoiListScreen() {
  const flow = useFlow()
  const pois = usePois()

  const rows: TableRow[] = pois.map((poi) => ({
    id: poi.id,
    cells: {
      name: poi.name,
      jenis: poi.jenis,
      lokasi: `${poi.kecamatan} / ${poi.desa}`,
      jadwal: poi.jadwal,
      fo: poi.assignedFo || <span className="text-placeholder">Belum ditugaskan</span>,
    },
  }))

  return (
    <div className="flex h-full flex-col gap-24 overflow-y-auto bg-neutral-50 p-32">
      <PageHeading
        title="POI creation"
        actions={
          <Button onClick={() => flow.go('poi-create')}>
            <Plus size={16} />
            Tambah POI
          </Button>
        }
      />

      <Panel>
        {rows.length ? (
          <SimpleTable columns={COLUMNS} rows={rows} />
        ) : (
          <EmptyState title="Belum ada POI" body="Tambah titik pertama untuk cabang ini." />
        )}
      </Panel>
    </div>
  )
}
