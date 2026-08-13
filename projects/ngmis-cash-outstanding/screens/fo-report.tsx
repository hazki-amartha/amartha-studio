'use client'

// The branch FO Report, opened on the Cash Outstanding & Settlement tab. The
// content header carries the "FO Report" title + the region → branch → BP filter
// cascade, then the five report tabs. Only the Cash outstanding tab is built:
// this week's range, the two settlement totals, and the per-BP table. Each money
// cell carries a "Lihat detail" link that opens a breakdown dialog; each row's
// kebab menu offers "Tandai sebagai Mangkir", which opens the FO User Management
// page. Which tab is active and which filters are picked is chrome — local state.

import { useState, type ReactNode } from 'react'
import { useFlow } from '@/platform/runtime'
import { Badge, Modal } from '@/design-system/components'
import { FoShell } from '../lib/shell'
import { LockedFilter, PageHeading, Panel, Select, Tabs } from '../lib/ui'
import {
  BP_ROWS,
  TOTAL_OUTSTANDING,
  TOTAL_SETTLED,
  WEEK_LABEL,
  formatSetoran,
  isSetoranStale,
  rupiah,
  type BpRow,
  type OriginRef,
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

/** The cell + kind the breakdown dialog is showing, or null when it's closed. */
interface DetailTarget {
  row: BpRow
  kind: 'outstanding' | 'settled'
}

function CashOutstanding() {
  const flow = useFlow()
  const [detail, setDetail] = useState<DetailTarget | null>(null)
  // Resubmit requests the BM has approved this session, keyed `${row.id}:${index}`.
  const [approved, setApproved] = useState<Record<string, boolean>>({})
  const approve = (key: string) => setApproved((a) => ({ ...a, [key]: true }))

  /** Outstanding items still waiting on a resubmit approval — the red counter. */
  const openResubmits = (row: BpRow) =>
    row.outstandingItems.filter((it, i) => it.resubmitRequested && !approved[`${row.id}:${i}`])
      .length

  return (
    <div className="flex flex-col gap-16">
      <span className="text-16 font-bold text-default">{WEEK_LABEL}</span>

      <div className="flex flex-wrap gap-16">
        <TotalCard label="Belum disetor" value={rupiah(TOTAL_OUTSTANDING)} tone="text-red-500" />
        <TotalCard label="Sudah disetor" value={rupiah(TOTAL_SETTLED)} tone="text-green-500" />
      </div>

      <Panel className="p-0">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-50">
              <th className="rounded-tl-12 px-16 py-12 text-12 font-bold text-default">BP</th>
              <th className="px-16 py-12 text-12 font-bold text-default">Belum disetor</th>
              <th className="px-16 py-12 text-12 font-bold text-default">Sudah disetor</th>
              <th className="rounded-tr-12 px-16 py-12 text-12 font-bold text-default">
                Setoran terakhir
              </th>
            </tr>
          </thead>
          <tbody>
            {BP_ROWS.map((row) => (
              <tr key={row.id} className="border-t border-default align-top">
                <td className="px-16 py-12 text-14 font-bold text-default">{row.name}</td>
                <td className="px-16 py-12">
                  <MoneyCell
                    amount={row.outstanding}
                    resubmitCount={openResubmits(row)}
                    onDetail={() => setDetail({ row, kind: 'outstanding' })}
                  />
                </td>
                <td className="px-16 py-12">
                  <MoneyCell amount={row.settled} onDetail={() => setDetail({ row, kind: 'settled' })} />
                </td>
                <td className="px-16 py-12">
                  <SetoranTerakhir row={row} onMangkir={() => flow.go('fo-user-management')} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <DetailModal
        target={detail}
        approved={approved}
        onApprove={approve}
        onClose={() => setDetail(null)}
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
 *  nothing to break down. On the Belum disetor cell a red "(n)" counter sits
 *  beside the link when the BP has pending resubmit requests. */
function MoneyCell({
  amount,
  onDetail,
  resubmitCount = 0,
}: {
  amount: number
  onDetail: () => void
  resubmitCount?: number
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-14 text-default">{rupiah(amount)}</span>
      {amount > 0 ? (
        <span className="flex items-center gap-4">
          <button
            type="button"
            onClick={onDetail}
            className="text-12 font-bold text-link active:opacity-70"
          >
            Rincian
          </button>
          {resubmitCount > 0 ? (
            <span className="inline-flex h-16 min-w-16 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
              {resubmitCount}
            </span>
          ) : null}
        </span>
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
            className="text-12 font-bold text-link active:opacity-70"
          >
            tandai BP sebagai mangkir
          </button>{' '}
          bila perlu
        </span>
      ) : null}
    </div>
  )
}

/** The "Lihat detail" breakdown dialog: where the cell's money comes from, by
 *  majelis (MV) or member (HV). For settled money it also shows the settlement
 *  destination and transfer date; the total sits on the bottom row. The body is
 *  passed as children, not `slot`, so it renders on a plain white surface rather
 *  than the design system's tinted `.ds-modal-slot`. */
function DetailModal({
  target,
  approved,
  onApprove,
  onClose,
}: {
  target: DetailTarget | null
  approved: Record<string, boolean>
  onApprove: (key: string) => void
  onClose: () => void
}) {
  const settled = target?.kind === 'settled'
  const kindLabel = settled ? 'Sudah disetor' : 'Belum disetor'
  const total = target ? (settled ? target.row.settled : target.row.outstanding) : 0

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      size="lg"
      title={target ? `${target.row.name} - ${kindLabel}` : undefined}
    >
      {target ? (
        <div className="pt-8">
          {settled ? (
            <SettledBreakdown items={target.row.settledItems} total={total} />
          ) : (
            <OutstandingBreakdown
              rowId={target.row.id}
              items={target.row.outstandingItems}
              total={total}
              approved={approved}
              onApprove={onApprove}
            />
          )}
        </div>
      ) : null}
    </Modal>
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
  rowId,
  items,
  total,
  approved,
  onApprove,
}: {
  rowId: string
  items: BpRow['outstandingItems']
  total: number
  approved: Record<string, boolean>
  onApprove: (key: string) => void
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
      {items.map((item, i) => {
        const key = `${rowId}:${i}`
        return (
          <tr key={key} className="border-t border-default align-top">
            <td className={tdClass}>
              <span className="flex flex-col gap-4">
                <span className="text-14 text-default">{originText(item.origin)}</span>
                {item.resubmitRequested ? (
                  approved[key] ? (
                    <Badge intent="green" variant="subtle" size="sm">
                      Submit ulang disetujui
                    </Badge>
                  ) : (
                    <span className="flex items-center gap-8">
                      <span className="text-12 text-caption">BP request submit ulang tugas</span>
                      <button
                        type="button"
                        onClick={() => onApprove(key)}
                        className="text-12 font-bold text-link active:opacity-70"
                      >
                        Approve
                      </button>
                    </span>
                  )
                ) : null}
              </span>
            </td>
            <td className={`${tdClass} text-right`}>{rupiah(item.amount)}</td>
          </tr>
        )
      })}
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
