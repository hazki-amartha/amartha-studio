'use client'

// The board: repayment per BP, and nothing else.
//
// Scoped down on engineering's read of what is actually available today. Tasks
// and disbursement came off — disbursement had no real source behind it, and
// tasks belong to the BP drill-down, where a row can name the mitra. What is
// left is the one subject the sheet genuinely carries, on the two clocks it
// carries it on: this week, and today.
//
// Every figure is a PAIR — how many loans sat in the bucket, and how many of
// them were paid. A lone "18" is unreadable; "18 of 50" is a morning's work.
// The colour says how much of the pair came in, one rule across every column,
// so a row can be scanned left to right instead of decoded column by column.
//
// What is deliberately NOT here: the Pulau › Region › Area › Cabang filter. A BM
// has one branch and the BPs in it — four cascading dropdowns are Area Manager
// machinery, and making her walk them every morning to arrive where she already
// was is the main thing this concept removes.

import { Badge } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  BPS,
  BRANCH,
  BUCKETS,
  TODAY,
  TONE_LABEL,
  TONE_TEXT,
  WEEK,
  boardOrder,
  n,
  paidTone,
  rate,
  statusOf,
  taskTotals,
  totalLoan,
  type Book,
  type Bp,
  type Tone,
} from '../lib/data'
import { openBp, setBoardView, useSelection, type BoardView } from '../lib/store'
import {
  GroupedTable,
  MisShell,
  PageHeading,
  Panel,
  PanelHeading,
  SummaryLine,
  ToneLegend,
  ViewTabs,
  type TableGroup,
  type TableRow,
} from '../lib/ui'

/** The two clocks. `clock` is the field on the BP the view reads. */
const VIEWS: Record<BoardView, { tab: string; clock: 'week' | 'day'; period: string }> = {
  minggu: { tab: 'Mingguan', clock: 'week', period: WEEK },
  hari: { tab: 'Harian', clock: 'day', period: TODAY },
}

const TAB_ORDER: BoardView[] = ['minggu', 'hari']

/**
 * Status first, then Total Loan, then the four buckets — each a pair of columns.
 * The lead column stands outside every group: it is who the row is about, not
 * one of the things being measured.
 *
 * Status sits next to the name rather than at the far right because it is the
 * one column that answers the question without arithmetic, and a column that far
 * across a scrolling table is a column nobody reads.
 */
const PAIR = [
  { id: 'total', header: 'Total', align: 'right' as const },
  { id: 'paid', header: 'Terbayar', align: 'right' as const },
]

/** The verdict follows whichever clock is on screen, like every other column —
 *  a status that stayed weekly while the numbers beside it went daily would be
 *  the exact confusion the two views were split to remove. */
const statusGroup = (view: BoardView): TableGroup => ({
  id: 'status',
  label: 'Status',
  columns: [{ id: 'tag', header: view === 'hari' ? 'Hari ini' : 'Minggu ini' }],
})

const LOAN_GROUPS: TableGroup[] = [
  {
    id: 'total',
    label: 'Total Loan',
    columns: [
      { id: 'total', header: 'Aktif', align: 'right' },
      { id: 'paid', header: 'Terbayar', align: 'right' },
    ],
  },
  ...BUCKETS.map((b) => ({ id: b.id, label: b.label, columns: PAIR })),
]

/** Only the daily view carries it: the day's tasks are what a BM can still act
 *  on this afternoon, and they are meaningless against a weekly repayment row. */
const TUGAS_GROUP: TableGroup = {
  id: 'tugas',
  label: 'Tugas hari ini',
  columns: [
    { id: 'selesai', header: 'Selesai', align: 'right' },
    { id: 'sisa', header: 'Sisa', align: 'right' },
  ],
}

/** The left half of a pair: what was owed. Grey, because it is the denominator —
 *  it sets the scale, it is not the number being judged. */
function TotalCell({ value, muted }: { value: number; muted?: boolean }) {
  return <span className={`text-14 ${muted ? 'text-caption' : 'text-default'}`}>{n(value)}</span>
}

/** The right half: what came in, coloured by how much of the pair it is. */
function PaidCell({ value, tone }: { value: number; tone: Tone }) {
  return <span className={`text-14 font-bold ${TONE_TEXT[tone]}`}>{n(value)}</span>
}

/** The BP the row is about — her name and nothing else. Majelis count and the
 *  sheet's `Grouping Reason` moved to her own page, where there is room to read
 *  them; on the board they competed with the figures for the same glance. */
function LeadCell({ bp }: { bp: Bp }) {
  return <span className="text-14 font-bold text-default">{bp.name}</span>
}

/** The verdict on the active clock. */
function StatusCell({ book }: { book: Book }) {
  const status = statusOf(book)
  return (
    <Badge intent={status.intent} variant="subtle" size="sm">
      {status.label}
    </Badge>
  )
}

function cellsFor(bp: Bp, view: BoardView): TableRow['cells'] {
  const book = bp[VIEWS[view].clock]
  const grand = totalLoan(book)
  const cells: TableRow['cells'] = {
    lead: <LeadCell bp={bp} />,
    'status-tag': <StatusCell book={book} />,
    'total-total': <TotalCell value={grand[0]} muted />,
    'total-paid': <PaidCell value={grand[1]} tone={paidTone(grand)} />,
  }
  for (const bucket of BUCKETS) {
    const pair = book[bucket.id]
    cells[`${bucket.id}-total`] = <TotalCell value={pair[0]} />
    cells[`${bucket.id}-paid`] = <PaidCell value={pair[1]} tone={paidTone(pair)} />
  }
  if (view === 'hari') {
    const t = taskTotals(bp.tasks)
    const sisa = t.total - t.done
    cells['tugas-selesai'] = (
      <span className="text-14 font-bold text-default">
        {t.done}
        <span className="font-regular text-caption">/{t.total}</span>
      </span>
    )
    cells['tugas-sisa'] =
      sisa > 0 ? (
        <span className="text-14 font-bold text-red-500">{sisa}</span>
      ) : (
        <span className="text-14 text-caption">—</span>
      )
  }
  return cells
}

export function BoardScreen() {
  const flow = useFlow()
  const { boardView } = useSelection()
  const view = VIEWS[boardView]

  const order = boardOrder(view.clock)
  const groups =
    boardView === 'hari'
      ? [statusGroup(boardView), ...LOAN_GROUPS, TUGAS_GROUP]
      : [statusGroup(boardView), ...LOAN_GROUPS]

  const rows: TableRow[] = order.map((bp) => ({
    id: bp.id,
    onClick: () => {
      openBp(bp.id)
      flow.go('bp')
    },
    cells: cellsFor(bp, boardView),
  }))

  // The branch read: every BP's book on this clock, added up.
  const branch = order.reduce<[number, number]>(
    ([t, p], bp) => {
      const [bt, bp2] = totalLoan(bp[view.clock])
      return [t + bt, p + bp2]
    },
    [0, 0],
  )
  return (
    <MisShell
      breadcrumbs={[{ label: 'Branches' }, { label: 'Monitoring BP' }]}
      header={
        <PageHeading
          title={`Repayment BP — Cabang ${BRANCH}`}
          meta={`${TODAY} · ${BPS.length} Business Partner`}
        />
      }
    >
      <SummaryLine
        items={[
          { label: `Loan aktif · ${view.period}`, value: n(branch[0]) },
          {
            label: 'Sudah terbayar',
            value: `${n(branch[1])} (${rate(branch)}%)`,
            tone: TONE_TEXT[paidTone(branch)],
          },
        ]}
      />

      <Panel className="p-16">
        <PanelHeading
          title="Repayment per BP"
          subtitle={`${view.period}. Setiap kelompok DPD dibaca berpasangan: total loan lalu yang sudah terbayar. Klik satu baris untuk melihat harinya.`}
          action={
            <ViewTabs
              value={boardView}
              onChange={(id) => setBoardView(id as BoardView)}
              items={TAB_ORDER.map((id) => ({ id, label: VIEWS[id].tab }))}
            />
          }
        />
        <ToneLegend
          items={(['green', 'yellow', 'red'] as Tone[]).map((tone) => ({
            tone: tone === 'green' ? 'bg-green-500' : tone === 'yellow' ? 'bg-yellow-500' : 'bg-red-500',
            label: TONE_LABEL[tone],
          }))}
        />
        <GroupedTable leadHeader="BP" groups={groups} rows={rows} />
        <p className="pt-12 text-12 text-caption">
          Total Loan adalah jumlah keempat kelompok DPD. Diurutkan dari yang paling sedikit
          terbayar. Target per bucket dari sheet BP Loan ({' '}
          {BUCKETS.filter((b) => b.target !== null)
            .map((b) => `${b.label} ≥ ${b.target}%`)
            .join(' · ')}
          ) ada di halaman masing-masing BP.
        </p>
      </Panel>
    </MisShell>
  )
}
