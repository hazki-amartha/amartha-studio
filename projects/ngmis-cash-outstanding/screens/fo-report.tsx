'use client'

// The branch FO Report, opened on the Cash Outstanding tab. The content header
// carries the "FO Report" title + the region → branch → BP filter cascade, then
// the five report tabs. Only the Cash outstanding tab is built: a live, all-time
// per-BP table of what each BP has not yet handed in, a Belum-disetor total and a
// late-setoran headcount above it, and a Tindakan column of row actions:
//  - Koreksi nominal — opens the belum-disetor breakdown drawer, where each
//    mitra's nominal can be corrected (cascading through every total).
//  - Acknowledge telat — enabled once a BP is late (past 16.00); a confirmation
//    marks the lateness reviewed and the button flips to a "Telat diakui" chip.
//  - BP mangkir — enabled once a BP is more than a day late; marks the BP mangkir
//    (a badge on the name that survives navigation) and opens the User details page.
// Which tab is active and which filters are picked is chrome — local state.

import { useEffect, useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Badge, Button, Modal } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { FoShell } from '../lib/shell'
import {
  acknowledgeTelat,
  correctNominal,
  markMangkir,
  setSelectedBp,
  useAcknowledged,
  useCorrections,
  useMangkir,
  useNow,
} from '../lib/store'
import { LockedFilter, PageHeading, Panel, Select, SideDrawer, Tabs } from '../lib/ui'
import {
  BP_ROWS,
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
  const now = useNow()
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
            meta={formatUpdatedAt(now)}
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

function CashOutstanding() {
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

  // Only BPs who still owe money belong in the table — a BP who has handed
  // everything in is nothing for the BM to chase. The totals below read from the
  // full list, but a fully-settled BP adds nothing to either of them.
  const owing = rows.filter((row) => row.outstanding > 0)

  const totalOutstanding = rows.reduce((total, r) => total + r.outstanding, 0)
  const lateCount = rows.filter((r) => r.lateness !== 'onTime').length

  const detailRow = detailRowId ? rows.find((r) => r.id === detailRowId) ?? null : null

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-wrap gap-16">
        <TotalCard label="Belum disetor" value={rupiah(totalOutstanding)} tone="text-red-500" />
        <TotalCard label="BP Terlambat Setoran" value={`${lateCount} orang`} tone="text-red-500" />
      </div>

      <Panel className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-50">
                <th className="rounded-tl-12 px-16 py-12 text-12 font-bold text-default">Nama BP</th>
                <th className="px-16 py-12 text-12 font-bold text-default">Belum disetor</th>
                <th className="px-16 py-12 text-12 font-bold text-default">Setoran terakhir</th>
                <th className="rounded-tr-12 px-16 py-12 text-12 font-bold text-default">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {owing.map((row) => (
                <tr key={row.id} className="border-t border-default align-top">
                  <td className="px-16 py-12">
                    <span className="flex flex-wrap items-center gap-8">
                      <span className="text-14 font-bold text-default">{row.name}</span>
                      {mangkir[row.id] ? (
                        <Badge intent="red" variant="subtle" size="sm">
                          Mangkir
                        </Badge>
                      ) : null}
                      {acknowledged[row.id] ? (
                        <Badge
                          intent="green"
                          variant="subtle"
                          size="sm"
                          leadingIcon={<CheckCircleFill size={16} />}
                        >
                          Telat diakui
                        </Badge>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-16 py-12 text-14 text-default">{rupiah(row.outstanding)}</td>
                  <td className="px-16 py-12">
                    <SetoranTerakhir row={row} />
                  </td>
                  <td className="px-16 py-12">
                    <RowActions
                      row={row}
                      acknowledged={!!acknowledged[row.id]}
                      mangkir={!!mangkir[row.id]}
                      onKoreksi={() => setDetailRowId(row.id)}
                      onAck={() => setAcking({ id: row.id, name: row.name })}
                      onMangkir={() => {
                        markMangkir(row.id)
                        setSelectedBp(row.name)
                        flow.go('fo-user-management')
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

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
        }}
      />

      <AckDialog
        target={acking}
        onCancel={() => setAcking(null)}
        onConfirm={(id) => {
          acknowledgeTelat(id)
          setAcking(null)
        }}
      />
    </div>
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

/** The last-setoran timestamp, coloured by how late the BP is, with a note under
 *  it once they've missed the 16.00 deadline. */
function SetoranTerakhir({ row }: { row: LiveRow }) {
  const tone =
    row.lateness === 'overdue'
      ? 'text-red-500'
      : row.lateness === 'today'
        ? 'text-orange-500'
        : 'text-default'
  const note =
    row.lateness === 'overdue' ? 'Lewat 1 hari' : row.lateness === 'today' ? 'Lewat jam 4 sore' : null
  return (
    <div className="flex flex-col gap-2">
      <span className={`text-14 ${row.lateness === 'onTime' ? 'text-default' : `font-bold ${tone}`}`}>
        {formatSetoran(row.lastSetoran)}
      </span>
      {note ? <span className={`text-12 ${tone}`}>{note}</span> : null}
    </div>
  )
}

/** The three row actions. Acknowledge unlocks once the BP is late (past 16.00)
 *  and disables once acknowledged; BP mangkir unlocks once they are more than a
 *  day late and disables once the BP is marked mangkir. */
function RowActions({
  row,
  acknowledged,
  mangkir,
  onKoreksi,
  onAck,
  onMangkir,
}: {
  row: LiveRow
  acknowledged: boolean
  mangkir: boolean
  onKoreksi: () => void
  onAck: () => void
  onMangkir: () => void
}) {
  const canAck = row.lateness !== 'onTime'
  const canMangkir = row.lateness === 'overdue'
  return (
    <div className="flex items-center gap-8">
      <Button variant="primary" size="sm" onClick={onKoreksi}>
        Koreksi nominal
      </Button>
      <Button variant="primary" size="sm" disabled={!canAck || acknowledged} onClick={onAck}>
        Acknowledge telat
      </Button>
      <Button variant="primary" size="sm" disabled={!canMangkir || mangkir} onClick={onMangkir}>
        BP mangkir
      </Button>
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

/** Confirm that a BP is simply late — nothing to worry about — before marking
 *  the lateness reviewed. */
function AckDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: { id: string; name: string } | null
  onCancel: () => void
  onConfirm: (id: string) => void
}) {
  return (
    <Modal
      open={target !== null}
      onClose={onCancel}
      size="sm"
      title="Acknowledge keterlambatan?"
      description={
        target
          ? `Tandai bahwa ${target.name} hanya terlambat menyetor dan tidak ada masalah. Keterlambatan akan tercatat sudah ditinjau.`
          : undefined
      }
      primaryAction={
        <Button variant="primary" size="md" onClick={() => target && onConfirm(target.id)}>
          Ya, acknowledge
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
