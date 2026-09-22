'use client'

// Branches ▸ POI creation — every point of interest the BM has marked for her
// branch, with the way to add another.

import { Button } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { BmShell, PageHeading } from '../lib/shell'
import { EmptyState, Panel, SimpleTable, type TableRow } from '../lib/ui'
import { usePois } from '../lib/store'

const COLUMNS = [
  { id: 'name', header: 'Nama tempat' },
  { id: 'jenis', header: 'Jenis' },
  { id: 'lokasi', header: 'Kecamatan / Desa' },
  { id: 'jam', header: 'Jam operasional' },
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
      jam: `${poi.jamMulai} – ${poi.jamSelesai}`,
    },
  }))

  return (
    <BmShell breadcrumbs={[{ label: 'Branches' }, { label: 'POI creation', current: true }]}>
      <PageHeading
        title="POI creation"
        meta="Titik pasar, balai, atau kampung yang sudah ditandai di cabang ini"
        actions={
          <Button variant="primary" size="sm" onClick={() => flow.go('poi-create')}>
            <Plus size={16} />
            Tambah POI
          </Button>
        }
      />

      <Panel className="p-0">
        {rows.length ? (
          <SimpleTable columns={COLUMNS} rows={rows} />
        ) : (
          <EmptyState title="Belum ada POI" body="Tambah titik pertama untuk cabang ini." />
        )}
      </Panel>
    </BmShell>
  )
}
