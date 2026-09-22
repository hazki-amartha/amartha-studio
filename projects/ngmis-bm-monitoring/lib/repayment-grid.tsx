'use client'

// Pembayaran — the end state.
//
// The same figures and the same table as the MVP. "Lihat detail" opens every
// mitra under a BP — not just the ones behind a standard, a general lookup
// rather than a shortfall list — then drills once more into one mitra's own
// call/visit history. The drawer chrome itself lives in ./mitra-drawer,
// shared with Pencairan's own "Lihat detail" (CLAUDE.md §4 — wanted twice);
// this file only maps `mitraDetailFor`'s DPD-flavoured rows into the shared
// `MitraDrawerRow` shape.

import { useState } from 'react'
import { BpTable, RepaymentMetrics, TableHeading } from './repayment-table'
import { MitraDrawer, type MitraDrawerRow } from './mitra-drawer'
import {
  dpdChipIntent,
  dpdChipLabel,
  mitraDetailFor,
  MITRA_DPD_BUCKETS,
  rupiah,
  type BpMitraDetail,
  type RepaymentBp,
  type Unit,
} from './data'

const STATUS_OPTIONS = MITRA_DPD_BUCKETS.map((b) => ({ value: b.id, label: b.label }))

/** `BpMitraDetail`'s DPD/tunggakan shape mapped into the drawer's generic
 *  chip + metric — Pembayaran's own reading of "what to show beside a
 *  mitra's name and her tindakan log". */
function toDrawerRow(m: BpMitraDetail): MitraDrawerRow {
  return {
    id: m.id,
    code: m.code,
    name: m.name,
    majelis: m.majelis,
    statusId: m.dpdId,
    statusLabel: dpdChipLabel(m.dpdId),
    statusIntent: dpdChipIntent(m.dpdId),
    metricLabel: 'Tunggakan',
    metricValue: `Rp${rupiah(m.tunggakan)}`,
    tindakan: m.tindakan,
    followUp: m.followUp,
  }
}

export function RepaymentGrid({ unit }: { unit: Unit }) {
  const [detailBp, setDetailBp] = useState<RepaymentBp | null>(null)
  const [detailMitraId, setDetailMitraId] = useState<string | null>(null)

  const roster = detailBp ? mitraDetailFor(detailBp).map(toDrawerRow) : []
  const detailMitra = roster.find((m) => m.id === detailMitraId) ?? null

  return (
    <>
      <RepaymentMetrics unit={unit} />
      <TableHeading />

      <BpTable
        unit={unit}
        onDetailClick={(bp) => {
          setDetailMitraId(null)
          setDetailBp(bp)
        }}
      />

      {detailBp ? (
        <MitraDrawer
          bpName={detailBp.name}
          roster={roster}
          statusOptions={STATUS_OPTIONS}
          mitra={detailMitra}
          onCloseAll={() => {
            setDetailBp(null)
            setDetailMitraId(null)
          }}
          onSelectMitra={(m) => setDetailMitraId(m.id)}
          onCloseMitra={() => setDetailMitraId(null)}
        />
      ) : null}
    </>
  )
}
