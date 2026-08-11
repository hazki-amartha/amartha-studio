'use client'

// Riwayat Briefing — today's not-yet-sent briefings on top, then the history
// table of past ones. This used to be the dashboard's second tab; it now has its
// own screen, reached from the "Riwayat briefing" entry point beside the filters.

import { useFlow } from '@/platform/runtime'
import { Badge, Button } from '@/design-system/components'
import { Camera } from '@/design-system/icons'
import { BmShell } from '../lib/shell'
import {
  DataTable,
  LockedFilter,
  MoonGlyph,
  Panel,
  PanelHeading,
  PageHeading,
  SunGlyph,
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

const STATUS_INTENT: Record<HistoryEntry['status'], 'green' | 'yellow' | 'neutral'> = {
  Terkirim: 'green',
  Terlambat: 'yellow',
  'Belum diisi': 'neutral',
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

  const openBriefing = (kind: BriefingKind) => flow.go(`briefing-${kind}`)
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
        entry.status === 'Belum diisi' ? (
          <span className="text-placeholder">—</span>
        ) : (
          <button
            type="button"
            onClick={() => viewBriefing(entry.kind, entry.date, false)}
            className="text-14 font-bold text-link active:opacity-70"
          >
            Lihat
          </button>
        ),
    },
  }))

  const kinds: BriefingKind[] = ['morning', 'evening']
  const upcoming = kinds.filter((k) => !submitted[k])

  // A briefing sent today isn't in the seeded history, so it's prepended as its
  // own row — it moves from "belum dimulai" into "Riwayat" the moment it's sent.
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
        <PanelHeading
          title="Briefing belum dimulai"
          subtitle="Briefing hari ini yang belum dikirim."
        />
        {upcoming.length ? (
          <div className="flex flex-col gap-8">
            {upcoming.map((k) => (
              <BriefingRow key={k} kind={k} onStart={() => openBriefing(k)} />
            ))}
          </div>
        ) : (
          <span className="text-14 text-caption">Semua briefing hari ini sudah dikirim.</span>
        )}
      </Panel>

      <div className="pt-16">
        <Panel>
          <PanelHeading title="Riwayat briefing" subtitle="Briefing yang sudah berjalan di branch ini." />
          <DataTable
            columns={HISTORY_COLUMNS}
            rows={[...todayRows, ...historyRows]}
            sort={null}
            onSortChange={() => undefined}
          />
        </Panel>
      </div>
    </BmShell>
  )
}

/** One not-yet-started briefing, as a full-width row in the "belum dimulai"
 *  stack: which briefing, its date, a status chip, and the single Mulai action. */
function BriefingRow({ kind, onStart }: { kind: BriefingKind; onStart: () => void }) {
  const morning = kind === 'morning'
  return (
    <div className="flex flex-wrap items-center justify-between gap-16 rounded-12 border border-default p-12">
      <div className="flex items-center gap-12">
        <span className={morning ? 'text-orange-500' : 'text-primary-500'}>
          {morning ? <SunGlyph /> : <MoonGlyph />}
        </span>
        <div className="flex flex-col">
          <span className="text-14 font-bold text-default">{BRIEFING_LABEL[kind]}</span>
          <span className="text-12 text-caption">{REPORT_DATE}</span>
        </div>
        <Badge intent="neutral" variant="subtle" size="sm">
          Belum diisi
        </Badge>
      </div>
      <Button variant="primary" size="sm" onClick={onStart}>
        Mulai
      </Button>
    </div>
  )
}
