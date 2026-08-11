'use client'

// Riwayat Briefing — the history table of briefings for this branch. Reached from
// the "Riwayat briefing" entry point beside the Monitoring filters. Each sent
// briefing opens its read-only view; a "Tidak dikerjakan" one has nothing to open.

import { useFlow } from '@/platform/runtime'
import { Badge, Button } from '@/design-system/components'
import { Camera } from '@/design-system/icons'
import { BmShell } from '../lib/shell'
import {
  DataTable,
  LockedFilter,
  Panel,
  PanelHeading,
  PageHeading,
  type Column,
} from '../lib/ui'
import {
  BRANCH_LABEL,
  BRIEFING_LABEL,
  HISTORY,
  LOCATION,
  REPORT_DATE,
  type BriefingKind,
  type HistoryEntry,
} from '../lib/data'
import { store, useFlowState } from '../lib/store'

const STATUS_INTENT: Record<HistoryEntry['status'], 'green' | 'neutral'> = {
  Terkirim: 'green',
  'Tidak dikerjakan': 'neutral',
}

const HISTORY_COLUMNS: Column[] = [
  { id: 'date', header: 'Tanggal' },
  { id: 'kind', header: 'Jenis' },
  { id: 'by', header: 'Dikirim oleh' },
  { id: 'at', header: 'Waktu' },
  { id: 'status', header: 'Status' },
  { id: 'proof', header: 'Bukti foto' },
  { id: 'action', header: '', align: 'right' },
]

export function BriefingHistoryScreen() {
  const flow = useFlow()
  const { submitted } = useFlowState()

  const viewBriefing = (kind: BriefingKind, date: string, own: boolean) => {
    store.set({ viewing: { kind, date, own } })
    flow.go('briefing-detail')
  }

  const historyRows = HISTORY.map((entry) => ({
    id: entry.id,
    cells: {
      date: entry.date,
      kind: BRIEFING_LABEL[entry.kind],
      by: entry.submittedBy,
      at: entry.submittedAt,
      status: (
        <Badge intent={STATUS_INTENT[entry.status]} variant="subtle" size="sm">
          {entry.status}
        </Badge>
      ),
      proof: entry.hasPhoto ? (
        <span className="flex items-center gap-4 text-12 text-caption">
          <Camera size={16} /> Ada
        </span>
      ) : (
        <span className="text-placeholder">—</span>
      ),
      action:
        entry.status === 'Terkirim' ? (
          <button
            type="button"
            onClick={() => viewBriefing(entry.kind, entry.date, false)}
            className="text-14 font-bold text-link active:opacity-70"
          >
            Lihat
          </button>
        ) : (
          <span className="text-placeholder">—</span>
        ),
    },
  }))

  const kinds: BriefingKind[] = ['morning', 'evening']

  // A briefing sent today isn't in the seeded history, so it's prepended as its
  // own row — it appears in Riwayat the moment it's sent.
  const todayRows = kinds
    .filter((k) => submitted[k])
    .map((k) => ({
      id: `today-${k}`,
      cells: {
        date: REPORT_DATE,
        kind: BRIEFING_LABEL[k],
        by: 'Rina Marlina (Anda)',
        at: k === 'morning' ? '07.10 WIB' : '17.30 WIB',
        status: (
          <Badge intent="green" variant="subtle" size="sm">
            Terkirim
          </Badge>
        ),
        proof: (
          <span className="flex items-center gap-4 text-12 text-caption">
            <Camera size={16} /> Ada
          </span>
        ),
        action: (
          <button
            type="button"
            onClick={() => viewBriefing(k, REPORT_DATE, true)}
            className="text-14 font-bold text-link active:opacity-70"
          >
            Lihat
          </button>
        ),
      },
    }))

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: BRANCH_LABEL },
        { label: 'Riwayat Briefing', current: true },
      ]}
      header={
        <PageHeading
          title="Riwayat Briefing"
          actions={
            <Button variant="outline" size="sm" onClick={() => flow.go('dashboard')}>
              Kembali
            </Button>
          }
        />
      }
    >
      {/* The fixed location cascade, disabled — same as Monitoring. */}
      <div className="flex flex-wrap items-center gap-8 pb-16">
        <LockedFilter label="Region" value={LOCATION.region} />
        <LockedFilter label="Provinsi" value={LOCATION.provinsi} />
        <LockedFilter label="Kota" value={LOCATION.kota} />
        <LockedFilter label="Branch" value={LOCATION.branch} />
      </div>

      <Panel>
        <PanelHeading title="Riwayat briefing" subtitle="Briefing yang sudah berjalan di branch ini." />
        <DataTable
          columns={HISTORY_COLUMNS}
          rows={[...todayRows, ...historyRows]}
          sort={null}
          onSortChange={() => undefined}
        />
      </Panel>
    </BmShell>
  )
}
