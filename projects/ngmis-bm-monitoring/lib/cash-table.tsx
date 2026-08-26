'use client'

// Setor tunai — cash a BP is still holding, its journey ported from
// ngmis-cash-outstanding's Cash outstanding tab (§1: copied, not imported —
// see NOTES.md):
//  - Koreksi nominal — under the nominal itself, opens the belum-disetor
//    breakdown drawer (tugas, then mitra), where each mitra's nominal can be
//    corrected; a correction cascades through its tugas, the row, and the
//    Belum disetor total.
//  - Setujui keterlambatan — offered once a BP is late on the day (past
//    16.00) and not yet signed off; confirming (with an optional reason)
//    replaces the button with a "Telat disetujui" read-out.
//  - BP mangkir — offered once a BP is more than a day late; marking it drops
//    the BP off this report (and off both totals) and opens the BP's user
//    details page.
// A row offers exactly the action that applies to it — an action that
// doesn't apply is absent, not greyed out; a row with nothing to offer says so.

import { Fragment, useEffect, useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button, Modal } from '@/design-system/components'
import { DownloadSimple, Warning } from '@/design-system/icons'
import { BucketCard, Panel, SheetSection, SideSheet } from './ui'
import {
  CASH_BPS,
  NOW,
  formatSetoran,
  latenessOf,
  originText,
  type CashBpRow,
  type Lateness,
  type OriginRef,
} from './cash-data'
import {
  acknowledgeTelat,
  correctNominal,
  markMangkir,
  setSelectedBp,
  useAcknowledged,
  useCorrections,
  useMangkir,
  type Acknowledgement,
} from './cash-store'
import { rupiah } from './data'

const rp = (n: number) => `Rp${rupiah(n)}`

/** One live mitra share, its nominal reflecting any correction the BM has made. */
interface LiveMember {
  key: string
  name: string
  amount: number
}

interface LiveItem {
  itemKey: string
  origin: OriginRef
  amount: number
  members: LiveMember[]
}

interface LiveRow extends CashBpRow {
  items: LiveItem[]
  outstanding: number
  lateness: Lateness
}

/** The mitra share whose nominal is being corrected. */
interface CorrectTarget {
  key: string
  memberName: string
  origin: OriginRef
  current: number
}

export function CashMetrics() {
  const { rows } = useLiveRows()
  const total = rows.reduce((n, r) => n + r.outstanding, 0)
  const late = rows.filter((r) => r.lateness !== 'onTime').length

  return (
    <div className="grid grid-cols-2 gap-16 pb-16">
      <BucketCard label="Belum disetor" value={rp(total)} caption="Seluruh BP cabang" />
      <BucketCard label="BP Terlambat Setoran" value={`${late}`} caption="dari total BP" />
    </div>
  )
}

export function CashHeading() {
  const [preparing, setPreparing] = useState(false)
  return (
    <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
      <span className="text-16 font-bold text-default">Setor Tunai per BP</span>
      <Button variant="outline" size="sm" onClick={() => setPreparing(true)}>
        <span className="flex items-center gap-8">
          <DownloadSimple size={16} />
          {preparing ? 'Sedang disiapkan' : 'Download'}
        </span>
      </Button>
    </div>
  )
}

/** Builds each row's live figures — corrections folded in, outstanding summed
 *  from its items, lateness computed from that — filtered to BPs still owing
 *  money and not yet marked mangkir, the same set both cards total. */
function useLiveRows(): { rows: LiveRow[]; all: LiveRow[] } {
  const corrections = useCorrections()
  const mangkir = useMangkir()

  const all: LiveRow[] = CASH_BPS.map((bp) => {
    const items = bp.outstandingItems.map((item, i) => {
      const members = item.members.map((m, j) => {
        const key = `${bp.id}:${i}:${j}`
        return { key, name: m.name, amount: corrections[key] ?? m.amount }
      })
      return {
        itemKey: `${bp.id}:${i}`,
        origin: item.origin,
        members,
        amount: members.reduce((n, m) => n + m.amount, 0),
      }
    })
    const outstanding = items.reduce((n, it) => n + it.amount, 0)
    return { ...bp, items, outstanding, lateness: latenessOf(outstanding, bp.lastSetoran, NOW) }
  })

  const rows = all.filter((r) => r.outstanding > 0 && !mangkir[r.id])
  return { rows, all }
}

export function CashTable() {
  const flow = useFlow()
  const { rows, all } = useLiveRows()
  const acknowledged = useAcknowledged()

  // The row whose drawer is open (by id), or null when it's closed.
  const [detailRowId, setDetailRowId] = useState<string | null>(null)
  // The mitra whose nominal is being edited, or null when the editor is closed.
  const [correcting, setCorrecting] = useState<CorrectTarget | null>(null)
  // The BP whose lateness acknowledgement is being confirmed.
  const [acking, setAcking] = useState<{ id: string; name: string } | null>(null)
  // Shown once a correction has been saved.
  const [correctionSaved, setCorrectionSaved] = useState(false)

  const detailRow = detailRowId ? all.find((r) => r.id === detailRowId) ?? null : null

  return (
    <>
      <CashMetrics />
      <CashHeading />

      <Panel className="p-0">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-200">
                <th className="px-16 py-12 text-12 font-bold text-default" style={{ width: 180 }}>
                  Nama BP
                </th>
                <th className="border-l border-default px-16 py-12 text-left text-12 font-bold text-default">
                  Belum disetor
                </th>
                <th className="border-l border-default px-16 py-12 text-left text-12 font-bold text-default">
                  Setoran terakhir
                </th>
                <th className="border-l border-default px-16 py-12 text-left text-12 font-bold text-default">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-16 py-24 text-center text-12 text-caption">
                    Tidak ada BP dengan cash outstanding.
                  </td>
                </tr>
              ) : null}
              {rows.map((row, i) => (
                <CashRowView
                  key={row.id}
                  row={row}
                  zebra={i % 2 === 1}
                  acknowledgement={acknowledged[row.id]}
                  onKoreksi={() => setDetailRowId(row.id)}
                  onAck={() => setAcking({ id: row.id, name: row.name })}
                  onMangkir={() => {
                    markMangkir(row.id)
                    setSelectedBp(row.name)
                    flow.go('bp-user-details')
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {detailRow ? (
        <SideSheet
          title={`${detailRow.name} - Belum disetor`}
          onClose={() => setDetailRowId(null)}
        >
          <OutstandingBreakdown items={detailRow.items} onCorrect={setCorrecting} />
        </SideSheet>
      ) : null}

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
    </>
  )
}

function CashRowView({
  row,
  zebra,
  acknowledgement,
  onKoreksi,
  onAck,
  onMangkir,
}: {
  row: LiveRow
  zebra: boolean
  acknowledgement: Acknowledgement | undefined
  onKoreksi: () => void
  onAck: () => void
  onMangkir: () => void
}) {
  const stripe = zebra ? 'bg-neutral-50' : 'bg-neutral-white'
  return (
    <tr className={`border-b border-default align-top ${stripe}`}>
      <td className="px-16 py-16 text-14 font-bold text-default">{row.name}</td>
      <td className="border-l border-default px-16 py-16 text-14 text-default">
        <span className="flex flex-col items-start gap-2">
          <span>{rp(row.outstanding)}</span>
          <button type="button" onClick={onKoreksi} className="text-12 text-link underline active:opacity-70">
            Koreksi nominal
          </button>
        </span>
      </td>
      <td className="border-l border-default px-16 py-16">
        <SetoranTerakhir row={row} />
      </td>
      <td className="border-l border-default px-16 py-16">
        <Tindakan row={row} acknowledgement={acknowledgement} onAck={onAck} onMangkir={onMangkir} />
      </td>
    </tr>
  )
}

/** The last-setoran timestamp, coloured by how late the BP is, with a warning
 *  under it once they've missed the 16.00 deadline. What the BM did about
 *  that lateness is reported in Tindakan, not here. */
function SetoranTerakhir({ row }: { row: LiveRow }) {
  const tone =
    row.lateness === 'overdue' ? 'text-red-500' : row.lateness === 'today' ? 'text-orange-500' : 'text-default'
  const note =
    row.lateness === 'overdue'
      ? 'Telat setor >24 jam'
      : row.lateness === 'today'
        ? 'Telat setor (lewat jam 4 sore)'
        : null
  return (
    <div className="flex flex-col gap-2">
      <span className={`text-14 ${row.lateness === 'onTime' ? 'text-default' : `font-bold ${tone}`}`}>
        {formatSetoran(row.lastSetoran)}
      </span>
      {note ? (
        <span className={`flex items-center gap-4 text-10 ${tone}`}>
          <Warning size={16} />
          {note}
        </span>
      ) : null}
    </div>
  )
}

/** What can be done to this row, or what already was.
 *
 * Once the lateness is signed off, the outcome replaces the button: the cell
 * reads "Telat disetujui", with the BM's reason under it when they gave one.
 * Setujui keterlambatan covers a same-day slip only — it goes away once the
 * lateness is over 24 hours, which is no longer something a BM signs off; BP
 * mangkir takes over there. */
function Tindakan({
  row,
  acknowledgement,
  onAck,
  onMangkir,
}: {
  row: LiveRow
  acknowledgement: Acknowledgement | undefined
  onAck: () => void
  onMangkir: () => void
}) {
  if (acknowledgement) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-14 text-blue-500">Telat disetujui</span>
        {typeof acknowledgement === 'string' ? (
          <span className="text-12 text-caption">{acknowledgement}</span>
        ) : null}
      </div>
    )
  }
  if (row.lateness === 'today') {
    return (
      <Button variant="primary" size="sm" onClick={onAck}>
        Setujui keterlambatan
      </Button>
    )
  }
  if (row.lateness === 'overdue') {
    return (
      <Button variant="primary" size="sm" onClick={onMangkir}>
        BP mangkir
      </Button>
    )
  }
  return <span className="text-12 text-caption">—</span>
}

/** The belum-disetor drawer: the BP's outstanding money, broken down by tugas
 *  and — under each tugas — by mitra. Each mitra's nominal can be corrected
 *  from here. */
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
        <SheetSection key={item.itemKey} label={originText(item.origin)}>
          <div className="flex flex-col gap-2 rounded-8 border border-default p-12">
            <div className="flex items-center justify-between gap-16 pb-8">
              <span className="text-12 text-caption">Total tugas</span>
              <span className="text-14 font-bold text-default">{rp(item.amount)}</span>
            </div>
            {item.members.map((m) => (
              <Fragment key={m.key}>
                <div className="flex items-start justify-between gap-16 border-t border-default py-8">
                  <span className="text-12 text-default">{m.name}</span>
                  <span className="flex flex-col items-end gap-2">
                    <span className="text-12 text-default">{rp(m.amount)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onCorrect({ key: m.key, memberName: m.name, origin: item.origin, current: m.amount })
                      }
                      className="text-12 text-link underline active:opacity-70"
                    >
                      Koreksi nominal
                    </button>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </SheetSection>
      ))}
    </div>
  )
}

/** Edit one mitra's nominal. Saving overrides the seeded amount and cascades
 *  through the tugas, the row, and the Belum disetor total. */
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
 *  the lateness reviewed. The reason is optional. */
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
