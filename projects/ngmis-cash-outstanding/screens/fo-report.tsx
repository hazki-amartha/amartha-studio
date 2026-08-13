'use client'

// The branch FO Report, opened on the Cash Outstanding & Settlement tab. The
// content header carries the "FO Report" title + the region → branch → BP filter
// cascade, then the five report tabs. Only the Cash outstanding tab is built:
// this week's range, the two settlement totals, and the per-BP table. Each money
// cell carries a "Rincian" link that opens the breakdown in a full-height side
// drawer; in the Belum disetor drawer each tugas can be re-opened, which drops it
// from the list and off every nominal on the page. The "tandai BP sebagai
// mangkir" link opens the FO User Management page. Which tab is active and which
// filters are picked is chrome — local state.

import { useState, type ReactNode } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button, Modal } from '@/design-system/components'
import { FoShell } from '../lib/shell'
import { setSelectedBp } from '../lib/store'
import { LockedFilter, PageHeading, Panel, Select, SideDrawer, Tabs } from '../lib/ui'
import {
  BP_ROWS,
  TOTAL_SETTLED,
  WEEK_LABEL,
  formatSetoran,
  isSetoranStale,
  rupiah,
  type BpRow,
  type OriginRef,
  type OutstandingItem,
} from '../lib/data'

const TABS = [
  { id: 'daily', label: 'Daily', crumb: 'Daily' },
  { id: 'tugas', label: 'Tugas', crumb: 'Tugas' },
  { id: 'repayment', label: 'Repayment', crumb: 'Repayment' },
  { id: 'cash-outstanding', label: 'Cash outstanding', crumb: 'Cash outstanding' },
  { id: 'disbursement', label: 'Disbursement', crumb: 'Disbursement' },
] as const

/** The region → provinsi → kota → branch cascade. Options are illustrative — the
 *  shell doesn't wire the real dependency between levels. */
const REGIONS = [{ value: 'jawa', label: 'Jawa' }, { value: 'sumatera', label: 'Sumatera' }]
const PROVINSI = [
  { value: 'jabar-1', label: 'Jawa Barat' },
  { value: 'jateng-1', label: 'Jawa Tengah' },
]
const KOTA = [{ value: 'cirebon', label: 'Cirebon' }, { value: 'cianjur', label: 'Cianjur' }]
const BRANCH = [{ value: 'belawa', label: 'Belawa' }, { value: 'cisaat', label: 'Cisaat' }]

export function FoReportScreen() {
  const [activeId, setActiveId] = useState<(typeof TABS)[number]['id']>('cash-outstanding')
  const active = TABS.find((t) => t.id === activeId) ?? TABS[3]

  const [region, setRegion] = useState('jawa')
  const [provinsi, setProvinsi] = useState('jabar-1')
  const [kota, setKota] = useState('cirebon')
  const [branch, setBranch] = useState('belawa')

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
            actions={
              <>
                <Select label="Region" value={region} onChange={setRegion} options={REGIONS} />
                <Select label="Provinsi" value={provinsi} onChange={setProvinsi} options={PROVINSI} />
                <Select label="Kota" value={kota} onChange={setKota} options={KOTA} />
                <Select label="Branch" value={branch} onChange={setBranch} options={BRANCH} />
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
      {activeId === 'cash-outstanding' ? <CashOutstanding /> : <EmptyTab label={active.crumb} />}
    </FoShell>
  )
}

// --- Cash outstanding tab ---------------------------------------------------

/** Which cell the drawer is showing, or null when it's closed. The row is held
 *  by id, not by value, so the drawer re-reads the live list after a re-open. */
interface DetailTarget {
  rowId: string
  kind: 'outstanding' | 'settled'
}

/** One outstanding item plus the stable `${row.id}:${index}` key it is tracked
 *  by — the list index shifts as items are re-opened, the key does not. */
interface OutstandingEntry {
  key: string
  item: OutstandingItem
}

/** A BP row with its re-opened tugas taken out: the remaining items and the
 *  nominal summed from them. */
interface LiveRow extends BpRow {
  entries: OutstandingEntry[]
}

function CashOutstanding() {
  const flow = useFlow()
  const [detail, setDetail] = useState<DetailTarget | null>(null)
  // Tugas the BM has re-opened this session, keyed `${row.id}:${index}`. A
  // re-opened tugas leaves the list and stops counting towards any nominal.
  const [reopened, setReopened] = useState<Record<string, boolean>>({})
  // The tugas awaiting confirmation, or null when the confirmation is closed.
  const [confirming, setConfirming] = useState<OutstandingEntry | null>(null)

  const rows: LiveRow[] = BP_ROWS.map((row) => {
    const entries = row.outstandingItems
      .map((item, i) => ({ key: `${row.id}:${i}`, item }))
      .filter((entry) => !reopened[entry.key])
    return {
      ...row,
      entries,
      outstanding: entries.reduce((total, e) => total + e.item.amount, 0),
    }
  })

  const totalOutstanding = rows.reduce((total, r) => total + r.outstanding, 0)
  /** BPs whose last setoran is stale — the "terlambat setoran" headcount. */
  const lateCount = rows.filter(isSetoranStale).length

  const detailRow = detail ? rows.find((r) => r.id === detail.rowId) ?? null : null

  return (
    <div className="flex flex-col gap-16">
      <span className="text-16 font-bold text-default">{WEEK_LABEL}</span>

      <div className="flex flex-wrap gap-16">
        <TotalCard label="Belum disetor" value={rupiah(totalOutstanding)} tone="text-red-500" />
        <TotalCard label="Sudah disetor" value={rupiah(TOTAL_SETTLED)} tone="text-green-500" />
        <TotalCard label="BP Terlambat Setoran" value={`${lateCount} orang`} tone="text-red-500" />
      </div>

      <Panel className="p-0">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-50">
              <th className="rounded-tl-12 px-16 py-12 text-12 font-bold text-default">Nama BP</th>
              <th className="px-16 py-12 text-12 font-bold text-default">Belum disetor</th>
              <th className="px-16 py-12 text-12 font-bold text-default">Sudah disetor</th>
              <th className="rounded-tr-12 px-16 py-12 text-12 font-bold text-default">
                Setoran terakhir
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-default align-top">
                <td className="px-16 py-12 text-14 font-bold text-default">{row.name}</td>
                <td className="px-16 py-12">
                  <MoneyCell
                    amount={row.outstanding}
                    onDetail={() => setDetail({ rowId: row.id, kind: 'outstanding' })}
                  />
                </td>
                <td className="px-16 py-12">
                  <MoneyCell
                    amount={row.settled}
                    onDetail={() => setDetail({ rowId: row.id, kind: 'settled' })}
                  />
                </td>
                <td className="px-16 py-12">
                  <SetoranTerakhir
                    row={row}
                    onMangkir={() => {
                      setSelectedBp(row.name)
                      flow.go('fo-user-management')
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <DetailDrawer
        row={detailRow}
        kind={detail?.kind ?? 'outstanding'}
        onReopen={setConfirming}
        onClose={() => setDetail(null)}
      />

      <ReopenConfirm
        entry={confirming}
        onCancel={() => setConfirming(null)}
        onConfirm={(key) => {
          setReopened((r) => ({ ...r, [key]: true }))
          setConfirming(null)
        }}
      />
    </div>
  )
}

/** One of the two summary boxes above the table. */
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

/** A money figure with its "Rincian" breakdown link — hidden when there is
 *  nothing to break down. */
function MoneyCell({ amount, onDetail }: { amount: number; onDetail: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-14 text-default">{rupiah(amount)}</span>
      {amount > 0 ? (
        <button
          type="button"
          onClick={onDetail}
          className="self-start text-12 font-regular text-link underline active:opacity-70"
        >
          Rincian
        </button>
      ) : null}
    </div>
  )
}

/** The last-setoran timestamp. When it's stale (red) it carries a nudge line,
 *  with "tandai BP sebagai mangkir" as an inline link into FO User Management. */
function SetoranTerakhir({ row, onMangkir }: { row: BpRow; onMangkir: () => void }) {
  const stale = isSetoranStale(row)
  return (
    <div className="flex flex-col gap-2">
      <span className={`text-14 ${stale ? 'font-bold text-red-500' : 'text-default'}`}>
        {formatSetoran(row.lastSetoran)}
      </span>
      {stale ? (
        <span className="text-12 text-caption">
          Lebih 1 hari - tegur atau{' '}
          <button
            type="button"
            onClick={onMangkir}
            className="text-12 font-regular text-link underline active:opacity-70"
          >
            tandai BP sebagai mangkir
          </button>{' '}
          bila perlu
        </span>
      ) : null}
    </div>
  )
}

/** The breakdown drawer: where the cell's money comes from, by majelis (MV) or
 *  member (HV). For settled money it also shows the settlement destination and
 *  transfer date; the total sits on the bottom row. Full height from the right,
 *  so the table it is about stays visible beside it. */
function DetailDrawer({
  row,
  kind,
  onReopen,
  onClose,
}: {
  row: LiveRow | null
  kind: 'outstanding' | 'settled'
  onReopen: (entry: OutstandingEntry) => void
  onClose: () => void
}) {
  const settled = kind === 'settled'
  const kindLabel = settled ? 'Sudah disetor' : 'Belum disetor'
  const total = row ? (settled ? row.settled : row.outstanding) : 0

  return (
    <SideDrawer
      open={row !== null}
      onClose={onClose}
      title={row ? `${row.name} - ${kindLabel}` : undefined}
    >
      {row ? (
        settled ? (
          <SettledBreakdown items={row.settledItems} total={total} />
        ) : (
          <OutstandingBreakdown entries={row.entries} total={total} onReopen={onReopen} />
        )
      ) : null}
    </SideDrawer>
  )
}

/** "Are you sure?" before a tugas goes back to the BP. Sits above the drawer;
 *  confirming drops the tugas from the list and off every nominal. */
function ReopenConfirm({
  entry,
  onCancel,
  onConfirm,
}: {
  entry: OutstandingEntry | null
  onCancel: () => void
  onConfirm: (key: string) => void
}) {
  return (
    <Modal
      open={entry !== null}
      onClose={onCancel}
      size="sm"
      title="Re-open task?"
      description={
        entry
          ? `Tugas ${originText(entry.item.origin)} akan dibuka kembali dan BP perlu submit ulang.`
          : undefined
      }
      primaryAction={
        <Button variant="primary" size="md" onClick={() => entry && onConfirm(entry.key)}>
          Ya, re-open
        </Button>
      }
      secondaryAction={
        <Button variant="outline" size="md" onClick={onCancel}>
          Batal
        </Button>
      }
    />
  )
}

/** "HV - Ibu Siti Aminah" / "MV - Majelis Kenanga". */
function originText(origin: OriginRef): string {
  return `${origin.kind} - ${origin.label}`
}

/** The neutral table shell shared by both breakdowns — grey header, bordered
 *  rows, matching the main-page table. */
function BreakdownTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-8 border border-default">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-neutral-50">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

const thClass = 'px-12 py-8 text-12 font-bold text-default'
const tdClass = 'px-12 py-8 text-14 text-default'

function OutstandingBreakdown({
  entries,
  total,
  onReopen,
}: {
  entries: OutstandingEntry[]
  total: number
  onReopen: (entry: OutstandingEntry) => void
}) {
  return (
    <BreakdownTable
      head={
        <>
          <th className={thClass}>Asal tugas</th>
          <th className={`${thClass} text-right`}>Nominal</th>
        </>
      }
    >
      {entries.length === 0 ? (
        <tr className="border-t border-default">
          <td className={`${tdClass} text-caption`} colSpan={2}>
            Tidak ada tugas tersisa.
          </td>
        </tr>
      ) : (
        entries.map((entry) => (
          <tr key={entry.key} className="border-t border-default align-top">
            <td className={tdClass}>
              <span className="flex flex-col gap-4">
                <span className="text-14 text-default">{originText(entry.item.origin)}</span>
                <button
                  type="button"
                  onClick={() => onReopen(entry)}
                  className="self-start text-12 font-regular text-link underline active:opacity-70"
                >
                  Re-open task
                </button>
              </span>
            </td>
            <td className={`${tdClass} text-right`}>{rupiah(entry.item.amount)}</td>
          </tr>
        ))
      )}
      <tr className="border-t border-default">
        <td className={`${tdClass} font-bold`}>Total</td>
        <td className={`${tdClass} text-right font-bold`}>{rupiah(total)}</td>
      </tr>
    </BreakdownTable>
  )
}

function SettledBreakdown({ items, total }: { items: BpRow['settledItems']; total: number }) {
  return (
    <BreakdownTable
      head={
        <>
          <th className={thClass}>Asal tugas</th>
          <th className={thClass}>Setoran</th>
          <th className={`${thClass} text-right`}>Nominal</th>
        </>
      }
    >
      {items.map((item, i) => (
        <tr key={`${item.origin.label}-${i}`} className="border-t border-default align-top">
          <td className={tdClass}>{originText(item.origin)}</td>
          <td className={tdClass}>
            <span className="flex flex-col gap-2">
              <span className="text-14 text-default">{item.dest.label}</span>
              <span className="text-12 text-caption">{item.dest.detail}</span>
              <span className="text-12 text-caption">{item.date}</span>
            </span>
          </td>
          <td className={`${tdClass} text-right`}>{rupiah(item.amount)}</td>
        </tr>
      ))}
      <tr className="border-t border-default">
        <td className={`${tdClass} font-bold`}>Total</td>
        <td className={tdClass} />
        <td className={`${tdClass} text-right font-bold`}>{rupiah(total)}</td>
      </tr>
    </BreakdownTable>
  )
}

// --- Other tabs -------------------------------------------------------------

function EmptyTab({ label }: { label: string }) {
  return (
    <Panel className="flex flex-1 items-center justify-center p-32">
      <span className="text-14 text-caption">Konten {label} belum dibuat.</span>
    </Panel>
  )
}
