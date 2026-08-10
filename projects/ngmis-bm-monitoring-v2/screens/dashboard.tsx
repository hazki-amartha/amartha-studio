'use client'

// The BM's landing screen. Two tabs at the same level — Monitoring (the branch
// scorecard) and Briefings (start today's morning / evening briefing, and read
// past ones). The active tab lives in the store so a briefing submitted from the
// Briefings tab returns here to the Briefings tab, not to Monitoring.

import { useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Badge, Button } from '@/design-system/components'
import { Camera } from '@/design-system/icons'
import { BmShell } from '../lib/shell'
import { Scorecard, ClosedDayPanel, ORIENTATION_OPTIONS } from '../lib/scorecard'
import {
  DataTable,
  DateFilter,
  LockedFilter,
  MoonGlyph,
  Panel,
  PanelHeading,
  PageHeading,
  SegmentedControl,
  Select,
  SunGlyph,
  Tabs,
  type Column,
} from '../lib/ui'
import {
  BPS,
  BRIEFING_LABEL,
  HISTORY,
  LOCATION,
  REPORT_DATE,
  type BriefingKind,
  type HistoryEntry,
  type Orientation,
} from '../lib/data'
import { store, useFlowState } from '../lib/store'

const TABS = [
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'briefings', label: 'Briefings' },
]

const BP_OPTIONS = [{ value: 'all', label: 'Semua BP' }, ...BPS.map((b) => ({ value: b.id, label: b.name }))]

const STATUS_INTENT: Record<HistoryEntry['status'], 'green' | 'yellow' | 'neutral'> = {
  Terkirim: 'green',
  Terlambat: 'yellow',
  'Belum diisi': 'neutral',
}

/** The two alternatives, for both briefings — screen id, and what differs. */
const ALT_BRIEFINGS: { id: string; kind: BriefingKind; title: string; subtitle: string }[] = [
  {
    id: 'briefing-morning-alt-terpisah',
    kind: 'morning',
    title: 'Briefing Pagi — komentar terpisah',
    subtitle: 'Tanpa kolom Komentar di tabel; satu komentar per BP di section sendiri.',
  },
  {
    id: 'briefing-evening-alt-terpisah',
    kind: 'evening',
    title: 'Briefing Sore — komentar terpisah',
    subtitle: 'Tanpa kolom Komentar di tabel; satu komentar per BP di section sendiri.',
  },
  {
    id: 'briefing-morning-alt-dialog',
    kind: 'morning',
    title: 'Briefing Pagi — komentar via dialog',
    subtitle: 'Komentar tetap per aktivitas, tapi diisi lewat CTA “Isi” dan dialog.',
  },
  {
    id: 'briefing-evening-alt-dialog',
    kind: 'evening',
    title: 'Briefing Sore — komentar via dialog',
    subtitle: 'Komentar tetap per aktivitas, tapi diisi lewat CTA “Isi” dan dialog.',
  },
]

const HISTORY_COLUMNS: Column[] = [
  { id: 'date', header: 'Tanggal' },
  { id: 'kind', header: 'Jenis' },
  { id: 'by', header: 'Dikirim oleh' },
  { id: 'at', header: 'Waktu' },
  { id: 'status', header: 'Status' },
  { id: 'proof', header: 'Bukti foto' },
  { id: 'action', header: '', align: 'right' },
]

export function DashboardScreen() {
  const flow = useFlow()
  const { tab, submitted, orientation } = useFlowState()
  const [bpFilter, setBpFilter] = useState('all')
  const [day, setDay] = useState('2026-08-07')

  const bps = bpFilter === 'all' ? BPS : BPS.filter((b) => b.id === bpFilter)

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
        { label: 'Monitoring', current: true },
      ]}
      header={
        <>
          <PageHeading
            title="Branch Monitoring"
            actions={
              <>
                <LockedFilter label="Region" value={LOCATION.region} />
                <LockedFilter label="Provinsi" value={LOCATION.provinsi} />
                <LockedFilter label="Kota" value={LOCATION.kota} />
                <LockedFilter label="Branch" value={LOCATION.branch} />
              </>
            }
          />
          <Tabs items={TABS} activeId={tab} onChange={(id) => store.set({ tab: id as typeof tab })} />
        </>
      }
    >
      {tab === 'monitoring' ? (
        <>
          {/* Monitoring filters — day picker and BP, controls only, no labels —
              with the row/column view toggle on the right. */}
          <div className="flex flex-wrap items-center justify-between gap-8 pb-16">
            <div className="flex flex-wrap items-center gap-8">
              <DateFilter label="Tanggal" value={day} onChange={setDay} />
              <Select label="Business Partner" value={bpFilter} onChange={setBpFilter} options={BP_OPTIONS} />
            </div>
            <SegmentedControl
              label="Tampilan tabel"
              value={orientation}
              options={ORIENTATION_OPTIONS}
              onChange={(v) => store.set({ orientation: v as Orientation })}
            />
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-16 pb-16">
            <span className="text-16 font-bold text-default">Aktivitas hari ini</span>
            <span className="text-12 text-caption">Diperbarui hari ini, {REPORT_DATE}, 16.20 WIB</span>
          </div>
          <Scorecard bps={bps} orientation={orientation} />
          <div className="pt-16">
            <ClosedDayPanel bps={bps} />
          </div>
        </>
      ) : (
        <>
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

          {/* Alternative shapes of the same two briefings, parked here so they
              can be opened side by side against the form above. */}
          <div className="pt-16">
            <Panel>
              <PanelHeading
                title="Alternatif penempatan komentar"
                subtitle="Dua alternatif untuk briefing pagi dan sore, dibandingkan dengan form di atas."
              />
              <div className="flex flex-col gap-8">
                {ALT_BRIEFINGS.map((alt) => (
                  <AltBriefingRow
                    key={alt.id}
                    kind={alt.kind}
                    title={alt.title}
                    subtitle={alt.subtitle}
                    onOpen={() => flow.go(alt.id)}
                  />
                ))}
              </div>
            </Panel>
          </div>

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
        </>
      )}
    </BmShell>
  )
}

/** One alternative briefing form, as a row that opens it. Same furniture as
 *  BriefingRow, with the difference spelled out instead of a status chip. */
function AltBriefingRow({
  kind,
  title,
  subtitle,
  onOpen,
}: {
  kind: BriefingKind
  title: string
  subtitle: string
  onOpen: () => void
}) {
  const morning = kind === 'morning'
  return (
    <div className="flex flex-wrap items-center justify-between gap-16 rounded-12 border border-default p-12">
      <div className="flex min-w-0 items-center gap-12">
        <span className={morning ? 'text-orange-500' : 'text-primary-500'}>
          {morning ? <SunGlyph /> : <MoonGlyph />}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-14 font-bold text-default">{title}</span>
          <span className="text-12 text-caption">{subtitle}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onOpen}>
        Lihat
      </Button>
    </div>
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
