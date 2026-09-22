'use client'

// POI creation — the entry point: every point of interest the BM has marked
// for her branch, with the way to add another, and to edit one already on
// the list.

import { Button } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { BmShell } from '../lib/shell'
import { EmptyState, PageHeading, Panel, SimpleTable, type TableRow } from '../lib/ui'
import { beginCreate, beginView, usePois } from '../lib/store'

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
    onClick: () => {
      beginView(poi)
      flow.go('poi-detail')
    },
    cells: {
      name: poi.name,
      jenis: poi.jenis,
      lokasi: `${poi.kecamatan} / ${poi.desa}`,
      jadwal: poi.jadwal,
      fo: poi.assignedFo || <span className="text-placeholder">Belum ditugaskan</span>,
    },
  }))

  return (
    <BmShell breadcrumbs={[{ label: 'Home' }, { label: 'Branches' }, { label: 'POI creation', current: true }]}>
      <div className="flex flex-col gap-24">
        <PageHeading
          title="POI creation"
          actions={
            <Button
              onClick={() => {
                beginCreate()
                flow.go('poi-create')
              }}
            >
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
    </BmShell>
  )
}
