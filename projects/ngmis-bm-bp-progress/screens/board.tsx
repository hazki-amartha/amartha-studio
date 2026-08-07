'use client'

// The board. Ten rows, three subjects, one read.
//
// What is deliberately NOT here: the Pulau › Region › Area › Cabang filter. A BM
// has one branch and the BPs in it — four cascading dropdowns are Area Manager
// machinery, and making her walk them every morning to arrive where she already
// was is the main thing this concept removes.

import { useFlow } from '@/platform/runtime'
import { Badge } from '@/design-system/components'
import {
  BPS,
  BRANCH,
  BUCKETS,
  MONTH,
  PROGRESS_LABEL,
  TODAY,
  WEEK,
  boardOrder,
  bucketsMissed,
  onTarget,
  prevRate,
  progress,
  rate,
  rp,
  taskTotals,
  type BucketId,
} from '../lib/data'
import { openBp } from '../lib/store'
import {
  GapCell,
  GroupedTable,
  MisShell,
  PageHeading,
  Panel,
  PanelHeading,
  RateCell,
  SummaryLine,
  type TableGroup,
} from '../lib/ui'

const GROUPS: TableGroup[] = [
  {
    id: 'tugas',
    label: 'Tugas',
    period: 'hari ini',
    columns: [
      { id: 'selesai', header: 'Selesai', align: 'right' },
      { id: 'sisa', header: 'Sisa', align: 'right' },
    ],
  },
  {
    id: 'repayment',
    label: 'Repayment',
    period: `minggu ini · ${WEEK}`,
    columns: [
      { id: 'd0', header: 'DPD 0', align: 'right' },
      { id: 'd1', header: 'DPD 1–30', align: 'right' },
      { id: 'd3', header: 'DPD 31–90', align: 'right' },
      { id: 'status', header: 'Status' },
    ],
  },
  {
    id: 'disbursement',
    label: 'Disbursement',
    period: `bulan ini · ${MONTH}`,
    columns: [
      { id: 'cair', header: 'Cair', align: 'right' },
      { id: 'gap', header: 'vs target', align: 'right' },
    ],
  },
]

export function BoardScreen() {
  const flow = useFlow()

  const order = boardOrder()
  const offTarget = BPS.filter((b) => bucketsMissed(b) > 0).length
  const tasksLeft = BPS.reduce((sum, b) => {
    const t = taskTotals(b.tasks)
    return sum + (t.total - t.done)
  }, 0)
  const disbGap = BPS.reduce((sum, b) => sum + (b.disb.cair - b.disb.target), 0)

  const rows = order.map((bp) => {
    const t = taskTotals(bp.tasks)
    const cell = (id: BucketId) => (
      <RateCell
        rate={rate(bp.week[id])}
        delta={rate(bp.week[id]) - prevRate(bp, id)}
        onTarget={onTarget(bp, id)}
      />
    )
    const verdict = progress(bp)
    return {
      id: bp.id,
      onClick: () => {
        openBp(bp.id)
        flow.go('bp')
      },
      cells: {
        lead: (
          <span className="flex flex-col gap-2">
            <span className="text-14 font-bold text-default">{bp.name}</span>
            <span className="text-12 text-caption">{bp.majelis} majelis</span>
            {/* The sheet's `Grouping Reason` — shown where ops has recorded one,
                because "1 dari 12 tugas" means something different for a BP
                covering a mangkir BP's portfolio than for one who just stopped. */}
            {bp.konteks ? <span className="text-10 text-caption">{bp.konteks}</span> : null}
          </span>
        ),
        selesai: (
          <span className="text-14 font-bold text-default">
            {t.done}
            <span className="font-regular text-caption">/{t.total}</span>
          </span>
        ),
        sisa:
          t.total - t.done > 0 ? (
            <span className="text-14 font-bold text-red-500">{t.total - t.done}</span>
          ) : (
            <span className="text-14 text-caption">—</span>
          ),
        d0: cell('d0'),
        d1: cell('d1'),
        d3: cell('d3'),
        status: (
          <Badge
            intent={
              verdict === 'on-target' ? 'green' : verdict === 'progressing' ? 'yellow' : 'red'
            }
            variant="subtle"
            size="sm"
          >
            {PROGRESS_LABEL[verdict]}
          </Badge>
        ),
        cair: <span className="text-14 text-default">{rp(bp.disb.cair)}</span>,
        gap: <GapCell value={bp.disb.cair - bp.disb.target} format={rp} />,
      },
    }
  })

  return (
    <MisShell
      breadcrumbs={[{ label: 'Branches' }, { label: 'Monitoring BP' }]}
      header={
        <PageHeading
          title={`Monitoring BP — Cabang ${BRANCH}`}
          meta={`${TODAY} · ${BPS.length} Business Partner`}
        />
      }
    >
      <SummaryLine
        items={[
          {
            label: 'BP di bawah target repayment · minggu ini',
            value: `${offTarget} dari ${BPS.length}`,
            tone: 'text-red-500',
          },
          { label: 'Tugas belum selesai · hari ini', value: `${tasksLeft} tugas` },
          { label: 'Pencairan kurang dari target · bulan ini', value: rp(disbGap) },
        ]}
      />

      <Panel className="p-16">
        <PanelHeading
          title="Business Partner di cabang ini"
          subtitle="Diurutkan dari yang paling banyak meleset. Klik satu baris untuk melihat harinya."
        />
        <GroupedTable leadHeader="Business Partner" groups={GROUPS} rows={rows} />
        <p className="pt-12 text-12 text-caption">
          Target repayment berbeda per bucket:{' '}
          {BUCKETS.filter((b) => b.target !== null)
            .map((b) => `${b.label} ≥ ${b.target}%`)
            .join(' · ')}
          . DPD 90+ dilaporkan tanpa target, sama seperti di sheet BP Loan.
        </p>
      </Panel>
    </MisShell>
  )
}
