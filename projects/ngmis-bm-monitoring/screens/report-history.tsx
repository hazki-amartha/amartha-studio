'use client'

// Where "Riwayat" lands: the trail of morning and evening reports, so a missed
// one is visible rather than just absent.

import { Badge, Button } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BmShell } from '../lib/shell'
import { DataTable, PageHeading, Panel, PanelHeading, type Column } from '../lib/ui'
import { HISTORY, type HistoryEntry } from '../lib/data'

const COLUMNS: Column[] = [
  { id: 'date', header: 'Tanggal' },
  { id: 'kind', header: 'Jenis report' },
  { id: 'submittedBy', header: 'Diisi oleh' },
  { id: 'submittedAt', header: 'Waktu kirim' },
  { id: 'status', header: 'Status' },
]

const STATUS_INTENT: Record<HistoryEntry['status'], 'green' | 'orange' | 'red'> = {
  Terkirim: 'green',
  Terlambat: 'orange',
  'Tidak diisi': 'red',
}

export function ReportHistoryScreen() {
  const flow = useFlow()

  const rows = HISTORY.map((entry) => ({
    id: entry.id,
    cells: {
      date: entry.date,
      kind: entry.kind,
      submittedBy: entry.submittedBy,
      submittedAt: entry.submittedAt,
      status: (
        <Badge intent={STATUS_INTENT[entry.status]} variant="subtle" size="sm">
          {entry.status}
        </Badge>
      ),
    },
  }))

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'Activity' },
        { label: 'Riwayat report', current: true },
      ]}
    >
      <PageHeading
        title="Riwayat Daily Report"
        meta="Cabang Jeneponto — 7 hari terakhir"
        actions={
          <Button variant="outline" size="sm" onClick={() => flow.back()}>
            Kembali
          </Button>
        }
      />

      <Panel>
        <PanelHeading title="Report terkirim" subtitle="Morning dan evening report per hari." />
        <DataTable columns={COLUMNS} rows={rows} sort={null} onSortChange={() => undefined} />
      </Panel>
    </BmShell>
  )
}
