'use client'

// The branch FO Report, opened on the Cash Outstanding tab. The content header
// carries the "FO Report" title + the region → branch → BP filter cascade, then
// the five report tabs. Only the Cash outstanding tab is built: a live, all-time
// per-BP table of what each BP has not yet handed in, a Belum-disetor total and a
// late-setoran headcount above it, and the actions a row can take:
//  - Koreksi nominal — a text link under the nominal itself, opening the
//    belum-disetor breakdown drawer where each mitra's nominal can be corrected
//    (cascading through every total).
//  - Setujui keterlambatan — in Tindakan, shown only while a BP is late on the
//    day (past 16.00) and not yet signed off; a confirmation (with an optional
//    reason) replaces the button with a blue "Telat disetujui" read-out.
//  - BP mangkir — in Tindakan, shown only once a BP is more than a day late;
//    marking it takes the BP off this report (and off both totals) and opens the
//    User details page.
// An action that doesn't apply is absent rather than greyed out, so a row offers
// exactly what can be done to it; a row with nothing to offer says so.
// Leaving the Branch filter on "Semua" turns the single roster into one collapsed
// table per branch, headed by where the branch sits and its own subtotal and
// headcount, so the same screen reads as a branch, area or region view. Those
// grouped tables keep the Tindakan column as a read-out of what has already been
// done, but not the actions themselves — those belong to the branch that owns the
// BP. Which tab is active and which filters are picked is chrome — local state.

import { useEffect, useState, type ReactNode } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button, Modal } from '@/design-system/components'
import {
  ChevronDown,
  ChevronUp,
  TriangleDownFill,
  TriangleUpFill,
  Warning,
} from '@/design-system/icons'
import { FoShell } from '../lib/shell'
import {
  acknowledgeTelat,
  correctNominal,
  markMangkir,
  setFilters,
  setSelectedBp,
  useAcknowledged,
  useCorrections,
  useFilters,
  useMangkir,
  useNow,
  type Acknowledgement,
  type Filters,
} from '../lib/store'
import { LockedFilter, PageHeading, Panel, Select, SideDrawer, Tabs } from '../lib/ui'
import {
  BP_ROWS,
  SEMUA,
  formatSetoran,
  formatUpdatedAt,
  latenessOf,
  rupiah,
  type BpRow,
  type Lateness,
  type OriginRef,
} from '../lib/data'

const TABS = [
  { id: 'daily', label: 'Daily', crumb: 'Daily' },
  { id: 'repayment', label: 'Repayment', crumb: 'Repayment' },
  { id: 'cash-outstanding', label: 'Sisa Setor Tunai', crumb: 'Sisa Setor Tunai' },
  { id: 'disbursement', label: 'Disbursement', crumb: 'Disbursement' },
] as const

/** The region → provinsi → kota → branch cascade. Options are illustrative — the
 *  shell doesn't wire the real dependency between levels. */
const REGIONS = [{ value: 'Jawa', label: 'Jawa' }, { value: 'Sumatera', label: 'Sumatera' }]
const PROVINSI = [
  { value: SEMUA, label: 'Semua' },
  { value: 'Jawa Barat', label: 'Jawa Barat' },
  { value: 'Jawa Tengah', label: 'Jawa Tengah' },
]
const KOTA = [
  { value: SEMUA, label: 'Semua' },
  { value: 'Cirebon', label: 'Cirebon' },
  { value: 'Sukabumi', label: 'Sukabumi' },
  { value: 'Semarang', label: 'Semarang' },
  { value: 'Kudus', label: 'Kudus' },
]
const BRANCH = [
  { value: SEMUA, label: 'Semua' },
  { value: 'Belawa', label: 'Belawa' },
  { value: 'Cisaat', label: 'Cisaat' },
  { value: 'Cibeureum', label: 'Cibeureum' },
  { value: 'Gunungpati', label: 'Gunungpati' },
  { value: 'Mijen', label: 'Mijen' },
  { value: 'Jekulo', label: 'Jekulo' },
]

export function FoReportScreen() {
  const now = useNow()
  const [activeId, setActiveId] = useState<(typeof TABS)[number]['id']>('cash-outstanding')
  const active = TABS.find((t) => t.id === activeId) ?? TABS[2]

  // The cascade lives in the store so the states selector can open the report at
  // any of its four zoom levels; picking a filter by hand writes to it too.
  const { region, provinsi, kota, branch } = useFilters()
  const setFilter = (patch: Partial<Filters>) =>
    setFilters({ region, provinsi, kota, branch, ...patch })

  return (
    <FoShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'FO Report' },
        { label: active.crumb, current: true },
      ]}
      header={
        <>
          <PageHeading
            title="FO Report"
            meta={formatUpdatedAt(now)}
            actions={
              <>
                <Select
                  label="Region"
                  value={region}
                  onChange={(v) => setFilter({ region: v })}
                  options={REGIONS}
                />
                <Select
                  label="Provinsi"
                  value={provinsi}
                  onChange={(v) => setFilter({ provinsi: v })}
                  options={PROVINSI}
                />
                <Select
                  label="Kota"
                  value={kota}
                  onChange={(v) => setFilter({ kota: v })}
                  options={KOTA}
                />
                <Select
                  label="Branch"
                  value={branch}
                  onChange={(v) => setFilter({ branch: v })}
                  options={BRANCH}
                />
                <LockedFilter label="BP" value="Semua BP" />
              </>
            }
          />
          <div className="pb-4">
            <Tabs
              items={TABS.map((t) => ({ id: t.id, label: t.label }))}
              activeId={activeId}
              onChange={(id) => setActiveId(id as (typeof TABS)[number]['id'])}
            />
          </div>
        </>
      }
    >
      {activeId === 'cash-outstanding' ? (
        <CashOutstanding region={region} provinsi={provinsi} kota={kota} branch={branch} />
      ) : (
        <EmptyTab label={active.crumb} />
      )}
    </FoShell>
  )
}

// --- Cash outstanding tab ---------------------------------------------------

/** Nama BP · Belum disetor · Setoran terakhir · Tindakan. Percentages, so the
 *  table still fills the page, and fixed, so no state can shift a column. */
const COLUMN_WIDTHS = ['24%', '20%', '26%', '30%']

/** Which column the tables are sorted by, and in which direction. The report
 *  opens on the highest belum-disetor amount. */
type SortKey = 'outstanding' | 'setoran'
type SortState = { key: SortKey; dir: 'asc' | 'desc' }

function sortRows(rows: LiveRow[], sort: SortState): LiveRow[] {
  const factor = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const cmp =
      sort.key === 'outstanding'
        ? a.outstanding - b.outstanding
        : a.lastSetoran.localeCompare(b.lastSetoran)
    return cmp * factor
  })
}

/** One live mitra share, its nominal reflecting any correction the BM has made. */
interface LiveMember {
  key: string
  name: string
  amount: number
}

/** A tugas with its mitra shares and the nominal summed from them. */
interface LiveItem {
  itemKey: string
  origin: OriginRef
  amount: number
  members: LiveMember[]
}

/** A BP row with its live tugas and the nominal summed across them. */
interface LiveRow extends BpRow {
  items: LiveItem[]
  lateness: Lateness
}

/** The mitra share whose nominal is being corrected. */
interface CorrectTarget {
  key: string
  memberName: string
  origin: OriginRef
  current: number
}

function CashOutstanding({
  region,
  provinsi,
  kota,
  branch,
}: {
  region: string
  provinsi: string
  kota: string
  branch: string
}) {
  const flow = useFlow()
  const now = useNow()
  const mangkir = useMangkir()
  const corrections = useCorrections()
  const acknowledged = useAcknowledged()
  // The row whose drawer is open (by id), or null when it's closed.
  const [detailRowId, setDetailRowId] = useState<string | null>(null)
  // The mitra whose nominal is being edited, or null when the editor is closed.
  const [correcting, setCorrecting] = useState<CorrectTarget | null>(null)
  // The BP whose lateness acknowledgement is being confirmed.
  const [acking, setAcking] = useState<{ id: string; name: string } | null>(null)
  // Shown once a correction has been saved.
  const [correctionSaved, setCorrectionSaved] = useState(false)
  // How every table on the page is sorted — opens on highest belum disetor.
  const [sort, setSort] = useState<SortState>({ key: 'outstanding', dir: 'desc' })
  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' },
    )

  const rows: LiveRow[] = BP_ROWS.map((row) => {
    const items = row.outstandingItems.map((item, i) => {
      const members = item.members.map((m, j) => {
        const key = `${row.id}:${i}:${j}`
        return { key, name: m.name, amount: corrections[key] ?? m.amount }
      })
      return {
        itemKey: `${row.id}:${i}`,
        origin: item.origin,
        members,
        amount: members.reduce((total, m) => total + m.amount, 0),
      }
    })
    const live = { ...row, items, outstanding: items.reduce((total, it) => total + it.amount, 0) }
    return { ...live, lateness: latenessOf(live, now) }
  })

  // What the report is actually about: BPs who still owe money, are not already
  // marked mangkir (they have left the BM's chase list), and sit inside the
  // filtered area. Both totals read from exactly this set, so they always agree
  // with what is on screen.
  const visible = rows.filter(
    (row) =>
      row.outstanding > 0 &&
      !mangkir[row.id] &&
      row.region === region &&
      (provinsi === SEMUA || row.provinsi === provinsi) &&
      (kota === SEMUA || row.kota === kota) &&
      (branch === SEMUA || row.branch === branch),
  )

  // Narrowed to one branch it stays a single roster; left on "Semua" the same
  // rows break into a table per branch, each with its own subtotal. Every level
  // above the branch that is also on "Semua" gets named in the header, so a
  // region-wide view still says which provinsi and kota a branch belongs to.
  const sortedVisible = sortRows(visible, sort)
  const groups =
    branch === SEMUA
      ? groupByBranch(sortedVisible)
      : null

  const totalOutstanding = visible.reduce((total, r) => total + r.outstanding, 0)
  const lateCount = visible.filter((r) => r.lateness !== 'onTime').length

  const detailRow = detailRowId ? rows.find((r) => r.id === detailRowId) ?? null : null

  // Shared by every table on the page — one roster or one per branch.
  const tableActions = {
    acknowledged,
    sort,
    onSort,
    onKoreksi: (row: LiveRow) => setDetailRowId(row.id),
    onAck: (row: LiveRow) => setAcking({ id: row.id, name: row.name }),
    onMangkir: (row: LiveRow) => {
      markMangkir(row.id)
      setSelectedBp(row.name)
      flow.go('fo-user-management')
    },
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-wrap gap-16">
        <TotalCard label="Belum disetor" value={rupiah(totalOutstanding)} tone="text-default" />
        <TotalCard label="BP Terlambat Setoran" value={`${lateCount} orang`} tone="text-default" />
      </div>

      {visible.length === 0 ? (
        <Panel className="p-32">
          <span className="text-14 text-caption">
            Tidak ada BP dengan cash outstanding di filter ini.
          </span>
        </Panel>
      ) : groups ? (
        groups.map((group) => (
          <BranchSection key={group.key} group={group}>
            <BpTable rows={group.rows} roundedTop={false} showActions={false} {...tableActions} />
          </BranchSection>
        ))
      ) : (
        <Panel className="p-0">
          <BpTable rows={sortedVisible} {...tableActions} />
        </Panel>
      )}

      <DetailDrawer
        row={detailRow}
        onCorrect={setCorrecting}
        onClose={() => setDetailRowId(null)}
      />

      <CorrectionDialog
        target={correcting}
        onCancel={() => setCorrecting(null)}
        onSave={(key, amount) => {
          correctNominal(key, amount)
          setCorrecting(null)
          setCorrectionSaved(true)
        }}
      />

      <CorrectionSaved open={correctionSaved} onClose={() => setCorrectionSaved(false)} />

      <AckDialog
        target={acking}
        onCancel={() => setAcking(null)}
        onConfirm={(id, reason) => {
          acknowledgeTelat(id, reason)
          setAcking(null)
        }}
      />
    </div>
  )
}

// --- The area view ----------------------------------------------------------

/** One branch's slice of the filtered rows, with its own subtotal. `place` is the
 *  small line above the branch name that says where the branch sits. */
interface BranchGroup {
  key: string
  place: string
  label: string
  rows: LiveRow[]
  total: number
}

/** Split the visible rows into one group per branch, in the order the branches
 *  first appear. The branch is the headline; its provinsi and kota sit above it
 *  as "Region: Jawa Tengah, Area: Semarang", because a branch name alone wouldn't
 *  place it once the view is wider than one kota. */
function groupByBranch(rows: LiveRow[]): BranchGroup[] {
  const groups: BranchGroup[] = []
  for (const row of rows) {
    const key = `${row.provinsi}/${row.kota}/${row.branch}`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = {
        key,
        place: `Region: ${row.provinsi}, Area: ${row.kota}`,
        label: row.branch,
        rows: [],
        total: 0,
      }
      groups.push(group)
    }
    group.rows.push(row)
    group.total += row.outstanding
  }
  return groups
}

/** One branch's card: a header carrying the branch, its subtotal and its BP
 *  headcount, over the branch's own table. Collapsed by default — an area view
 *  opens as a list of subtotals, and a branch is expanded when it's the one
 *  being discussed. */
function BranchSection({ group, children }: { group: BranchGroup; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Panel className="p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-16 px-16 py-12 text-left"
      >
        <span className="flex min-w-0 flex-col gap-2">
          <span className="text-12 text-caption">{group.place}</span>
          <span className="text-20 font-bold text-default">{group.label}</span>
        </span>
        {/* Subtotal and headcount ride the right edge, so they line up down a
            stack of branches however long the names are. */}
        <span className="flex shrink-0 items-center gap-8">
          <span className="text-20 font-bold text-default">
            {rupiah(group.total)} - {group.rows.length} BP
          </span>
          <span className="text-caption">
            {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </span>
      </button>
      {open ? children : null}
    </Panel>
  )
}

/** The per-BP table. One of these on a branch view, one per branch on an area
 *  view — identical either way, so the columns line up down the page. Tindakan is
 *  on every view: on a branch view it offers the actions, on a grouped view it
 *  reports what has already been done, since the actions belong to the branch
 *  that owns the BP. */
function BpTable({
  rows,
  acknowledged,
  sort,
  onSort,
  onKoreksi,
  onAck,
  onMangkir,
  roundedTop = true,
  showActions = true,
}: {
  rows: LiveRow[]
  acknowledged: Record<string, Acknowledgement>
  sort: SortState
  onSort: (key: SortKey) => void
  onKoreksi: (row: LiveRow) => void
  onAck: (row: LiveRow) => void
  onMangkir: (row: LiveRow) => void
  roundedTop?: boolean
  showActions?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      {/* Fixed layout: the columns keep these widths whatever a row is showing,
          so a badge appearing or a lateness note wrapping never re-measures the
          table — and every branch's table matches every other's. */}
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          {COLUMN_WIDTHS.map((width, i) => (
            <col key={i} style={{ width }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-neutral-200">
            <th className={`${thHeadClass} ${roundedTop ? 'rounded-tl-12' : ''}`}>Nama BP</th>
            <th className={`${thHeadClass} ${colDivider}`}>
              <SortHeader label="Belum disetor" active={sort.key === 'outstanding'} dir={sort.dir} onClick={() => onSort('outstanding')} />
            </th>
            <th className={`${thHeadClass} ${colDivider}`}>Tindakan</th>
            <th className={`${thHeadClass} ${colDivider} ${roundedTop ? 'rounded-tr-12' : ''}`}>
              <SortHeader label="Setoran terakhir" active={sort.key === 'setoran'} dir={sort.dir} onClick={() => onSort('setoran')} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-t border-default align-top ${i % 2 === 1 ? 'bg-neutral-50' : 'bg-white'}`}
            >
              <td className="px-16 py-12 text-16 font-regular text-default">{row.name}</td>
              <td className={`px-16 py-12 ${colDivider}`}>
                {/* The correction control sits beside the nominal it edits. */}
                <span className="flex items-center gap-8">
                  <span className="flex-1 text-18 font-bold text-default">{rupiah(row.outstanding)}</span>
                  {showActions ? (
                    <Button variant="secondary" size="sm" onClick={() => onKoreksi(row)}>
                      Ubah
                    </Button>
                  ) : null}
                </span>
              </td>
              <td className={`px-16 py-12 ${colDivider}`}>
                <Tindakan
                  row={row}
                  acknowledgement={acknowledged[row.id]}
                  interactive={showActions}
                  onAck={() => onAck(row)}
                  onMangkir={() => onMangkir(row)}
                />
              </td>
              <td className={`px-16 py-12 ${colDivider}`}>
                <SetoranTerakhir row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thHeadClass = 'px-16 py-12 text-16 font-bold text-default'
// A vertical stroke on the left of every column but the first, matching the
// reference table's column dividers.
const colDivider = 'border-l border-default'

/** A sortable column header: the label with a two-triangle sort toggle beside
 *  it. Both triangles read grey at rest; the one matching the active direction
 *  turns blue when the table is sorted by this column. */
function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  const up = active && dir === 'asc' ? 'text-blue-500' : 'text-disabled'
  const down = active && dir === 'desc' ? 'text-blue-500' : 'text-disabled'
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 text-left active:opacity-70"
    >
      {label}
      <span className="relative inline-block h-16 w-16 shrink-0">
        <TriangleUpFill size={16} className={`absolute left-0 top-0 ${up}`} />
        <TriangleDownFill size={16} className={`absolute left-0 top-0 ${down}`} />
      </span>
    </button>
  )
}

/** One of the summary boxes above the table. */
function TotalCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Panel className="min-w-0 flex-1 p-16">
      <div className="flex flex-col gap-4">
        <span className="text-12 text-caption">{label}</span>
        <span className={`text-24 font-bold ${tone}`}>{value}</span>
      </div>
    </Panel>
  )
}

/** The last-setoran timestamp, coloured by how late the BP is, with a warning
 *  under it once they've missed the 16.00 deadline. What the BM did about that
 *  lateness is reported in Tindakan, not here. */
function SetoranTerakhir({ row }: { row: LiveRow }) {
  const tone =
    row.lateness === 'overdue'
      ? 'text-red-500'
      : row.lateness === 'today'
        ? 'text-orange-500'
        : 'text-default'
  const note =
    row.lateness === 'overdue'
      ? 'Telat setor >24 jam'
      : row.lateness === 'today'
        ? 'Telat setor (lewat jam 4 sore)'
        : null
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-16 font-regular text-default"
      >
        {formatSetoran(row.lastSetoran)}
      </span>
      {note ? (
        <span className={`flex items-center gap-4 text-16 ${tone}`}>
          <Warning size={16} />
          {note}
        </span>
      ) : null}
    </div>
  )
}

/**
 * The Tindakan cell — what can be done to this row, or what already was.
 *
 * Once the lateness is signed off the outcome replaces the button: the cell
 * reads "Telat disetujui", with the BM's reason under it when they gave one.
 * Setujui keterlambatan covers the same-day slip only — it appears once the BP
 * is past 16.00 and goes away once the lateness is over 24 hours, which is no
 * longer something a BM signs off; BP mangkir takes over there, and marking it
 * drops the BP off this report altogether.
 *
 * On the grouped views the cell is a read-out only: the actions belong to the
 * branch that owns the BP, so an untouched row says so rather than offering a
 * button that would act from the wrong place.
 */
function Tindakan({
  row,
  acknowledgement,
  interactive,
  onAck,
  onMangkir,
}: {
  row: LiveRow
  acknowledgement: Acknowledgement | undefined
  interactive: boolean
  onAck: () => void
  onMangkir: () => void
}) {
  if (acknowledgement) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-16 text-default">Telat telah disetujui</span>
        {typeof acknowledgement === 'string' ? (
          <span className="text-16 text-caption">Alasan: {acknowledgement}</span>
        ) : null}
      </div>
    )
  }

  if (!interactive) {
    return <span className="text-16 text-disabled">No action have been taken</span>
  }

  const showAck = row.lateness === 'today'
  const showMangkir = row.lateness === 'overdue'
  if (!showAck && !showMangkir) {
    return <span className="text-16 text-disabled">Not available</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-8">
      {showAck ? (
        <Button variant="secondary" size="sm" onClick={onAck}>
          Setujui keterlambatan
        </Button>
      ) : null}
      {showMangkir ? (
        <Button variant="secondary" size="sm" onClick={onMangkir}>
          Tandai mangkir
        </Button>
      ) : null}
    </div>
  )
}

/** The belum-disetor drawer: the BP's outstanding money, broken down by tugas
 *  and — under each tugas — by mitra. Each mitra's nominal can be corrected from
 *  here. Full height from the right, so the table stays visible beside it. */
function DetailDrawer({
  row,
  onCorrect,
  onClose,
}: {
  row: LiveRow | null
  onCorrect: (target: CorrectTarget) => void
  onClose: () => void
}) {
  return (
    <SideDrawer
      open={row !== null}
      onClose={onClose}
      title={row ? `${row.name} - Belum disetor` : undefined}
    >
      {row ? <OutstandingBreakdown items={row.items} onCorrect={onCorrect} /> : null}
    </SideDrawer>
  )
}

function OutstandingBreakdown({
  items,
  onCorrect,
}: {
  items: LiveItem[]
  onCorrect: (target: CorrectTarget) => void
}) {
  if (items.length === 0) {
    return <span className="text-14 text-caption">Tidak ada tugas tersisa.</span>
  }
  return (
    <div className="flex flex-col gap-12">
      {items.map((item) => (
        <div key={item.itemKey} className="flex flex-col gap-8 rounded-8 border border-default p-12">
          <div className="flex items-center justify-between gap-16">
            <span className="text-14 font-bold text-default">{originText(item.origin)}</span>
            <span className="text-14 font-bold text-default">{rupiah(item.amount)}</span>
          </div>
          <div className="flex flex-col">
            {item.members.map((m) => (
              <div
                key={m.key}
                className="flex items-start justify-between gap-16 border-t border-default py-8 first:border-t-0 first:pt-0"
              >
                <span className="text-12 text-default">{m.name}</span>
                {/* The correction link sits directly under the nominal it edits. */}
                <span className="flex flex-col items-end gap-2">
                  <span className="text-12 text-default">{rupiah(m.amount)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onCorrect({ key: m.key, memberName: m.name, origin: item.origin, current: m.amount })
                    }
                    className="text-12 font-regular text-link underline active:opacity-70"
                  >
                    Koreksi nominal
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Edit one mitra's nominal. Saving overrides the seeded amount and cascades
 *  through the tugas, the row, and the Belum-disetor total. */
function CorrectionDialog({
  target,
  onCancel,
  onSave,
}: {
  target: CorrectTarget | null
  onCancel: () => void
  onSave: (key: string, amount: number) => void
}) {
  const [value, setValue] = useState('')
  useEffect(() => {
    if (target) setValue(String(target.current))
  }, [target])

  return (
    <Modal
      open={target !== null}
      onClose={onCancel}
      size="sm"
      title="Koreksi nominal"
      primaryAction={
        <Button
          variant="primary"
          size="md"
          onClick={() => target && onSave(target.key, parseInt(value || '0', 10))}
        >
          Simpan
        </Button>
      }
      secondaryAction={
        <Button variant="outline" size="md" onClick={onCancel}>
          Batal
        </Button>
      }
    >
      <div className="flex flex-col gap-8 pt-8">
        {target ? (
          <span className="text-12 text-caption">
            {target.memberName} · {originText(target.origin)}
          </span>
        ) : null}
        <label className="flex flex-col gap-4">
          <span className="text-12 text-caption">Nominal baru</span>
          <span className="flex h-40 items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 focus-within:border-primary-500">
            <span className="text-14 text-caption">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="Nominal baru"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-transparent text-14 font-regular text-default focus:outline-none"
            />
          </span>
        </label>
      </div>
    </Modal>
  )
}

/** The receipt for a saved correction, with the follow-up the BM owes the BP. */
function CorrectionSaved({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Koreksi nominal berhasil"
      description="Ingatkan BP untuk kirim bukti bayar terbaru via APartner."
      primaryAction={
        <Button variant="primary" size="md" onClick={onClose}>
          Mengerti
        </Button>
      }
    />
  )
}

/** Confirm that a BP is simply late — nothing to worry about — before marking
 *  the lateness reviewed. The reason is optional: a BM who has one can leave it
 *  for whoever reads the report later, and one who doesn't just confirms. */
function AckDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: { id: string; name: string } | null
  onCancel: () => void
  onConfirm: (id: string, reason: string) => void
}) {
  const [reason, setReason] = useState('')
  useEffect(() => {
    if (target) setReason('')
  }, [target])

  return (
    <Modal
      open={target !== null}
      onClose={onCancel}
      size="sm"
      title="Setujui keterlambatan?"
      description={
        target
          ? `Tandai bahwa ${target.name} hanya terlambat menyetor dan tidak ada masalah. Keterlambatan akan tercatat sudah ditinjau.`
          : undefined
      }
      primaryAction={
        <Button variant="primary" size="md" onClick={() => target && onConfirm(target.id, reason)}>
          Ya, setujui
        </Button>
      }
      secondaryAction={
        <Button variant="outline" size="md" onClick={onCancel}>
          Batal
        </Button>
      }
    >
      <label className="flex flex-col gap-4 pt-8">
        <span className="text-12 text-caption">Alasan (opsional)</span>
        <textarea
          rows={3}
          aria-label="Alasan keterlambatan"
          placeholder="Misal: BP izin sakit, setor besok pagi"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full resize-none rounded-8 border border-default bg-neutral-white px-12 py-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none"
        />
      </label>
    </Modal>
  )
}

/** "HV - Ibu Marlina" / "MV - Majelis Kenanga". */
function originText(origin: OriginRef): string {
  return `${origin.kind} - ${origin.label}`
}

// --- Other tabs -------------------------------------------------------------

function EmptyTab({ label }: { label: string }) {
  return (
    <Panel className="flex flex-1 items-center justify-center p-32">
      <span className="text-14 text-caption">Konten {label} belum dibuat.</span>
    </Panel>
  )
}
