'use client'

// Pencairan — what the branch put out this MONTH, per BP.
//
// Drawn on the same shapes as Pembayaran, so the two tabs are read the same
// way: a row of cards for the branch headline, then one row per BP under
// grouped headers, then a caption line beneath the column each shortfall is
// about.
//
// The table is grouped by mitra segment — Total, mitra baru, mitra lanjutan —
// rather than by NoA vs nilai, because a BM reads a row segment by segment
// ("how did mitra baru do") rather than metric by metric: a BP can be strong
// on renewals and put out no new mitra at all, and grouping by metric instead
// of segment scatters that story across two halves of the table.
//
// Mitra baru and Mitra lanjutan each carry their own "Lihat Alur" — an
// independent toggle that opens that segment's own acquisition funnel
// (NTB for Mitra baru, ETB/renewal for Mitra lanjutan) as extra columns
// inline, right where the segment already sits. The two toggle separately: a
// BM chasing a Mitra baru shortfall can open the NTB funnel without also
// being shown the ETB one she didn't ask about, and vice versa. Every other
// group's header grows nothing when one opens — only the segment that was
// asked for gains columns.
//
// Neither segment carries a %NoA rate column or badge any more — the funnel
// itself is what explains a shortfall now, not a pass/fail badge sitting
// beside a count nobody could act on without the breakdown anyway. The
// headline cards drop their rate the same way, for the same reason.
//
// The targets are monthly and the page now reports a month, so nothing is
// paced: a figure is judged against the month's target as it stands.

import { Fragment, useEffect, useRef, useState } from 'react'
import { Button } from '@/design-system/components'
import { ArrowRight, DownloadSimple } from '@/design-system/icons'
import { BucketCard, Panel } from './ui'
import { MitraDrawer, type MitraDrawerRow } from './mitra-drawer'
import {
  DISBURSEMENT_BPS,
  DISBURSEMENT_TARGETS,
  branchDisbursement,
  disbursementMitraDetailFor,
  nilaiShortfall,
  nilaiTotal,
  noaBaruShortfall,
  noaTotal,
  NTB_STAGE_BUCKETS,
  ntbStageIntent,
  ntbStageLabel,
  renewalShortfall,
  rupiah,
  type DisbursementBp,
  type DisbursementMitraDetail,
} from './data'

/** The month's figures are stored in juta (data.ts); the page reads in full
 *  rupiah, so every value is converted at the point it's shown. */
const rp = (jutaValue: number) => `Rp${rupiah(jutaValue * 1_000_000)}`

const TOTAL_GROUP = {
  id: 'total',
  header: 'Total',
  target: `Target ${rp(DISBURSEMENT_TARGETS.nilai)} pencairan`,
  cols: ['NoA', 'Pencairan'],
} as const

const BARU_GROUP = {
  id: 'baru',
  header: 'Mitra baru',
  target: `Target ${DISBURSEMENT_TARGETS.noaBaru} mitra`,
} as const

const LANJUTAN_GROUP = {
  id: 'lanjutan',
  header: 'Mitra lanjutan',
  target: `Target ${DISBURSEMENT_TARGETS.renewalRate}% NoA`,
} as const

/** Each segment's own funnel — hidden until that segment's "Lihat Alur" is
 *  opened. Both share the same four moving stages (the fifth, Mitra
 *  disetujui, is where they end up); only the first stage's label differs,
 *  because ETB starts from a leads pool rather than a KTP check the way NTB
 *  does. */
const NTB_FUNNEL = [
  { key: 'prospek', label: 'Prospek' },
  { key: 'dilanjuti', label: 'Dilanjuti' },
  { key: 'surveiDimulai', label: 'Survei dimulai' },
  { key: 'surveiDikirim', label: 'Survei dikirim' },
  { key: 'disetujui', label: 'Mitra disetujui' },
] as const

const ETB_FUNNEL = [
  { key: 'totalLeads', label: 'Total leads' },
  { key: 'dilanjuti', label: 'Dilanjuti' },
  { key: 'surveiDimulai', label: 'Survei dimulai' },
  { key: 'surveiDikirim', label: 'Survei dikirim' },
  { key: 'disetujui', label: 'Mitra disetujui' },
] as const

/** Fixed per-column widths, so every sub-column lines up the same amount of
 *  space under its header regardless of how long the label is. */
const COL_WIDTH: Record<string, number> = {
  NoA: 96,
  Pencairan: 116,
  Prospek: 84,
  'Total leads': 88,
  Dilanjuti: 84,
  'Survei dimulai': 100,
  'Survei dikirim': 96,
  'Mitra disetujui': 100,
}

const SHORT_CELL = 'px-12 pb-16 pt-4 text-center text-10 text-caption whitespace-nowrap'

const STAGE_STATUS_OPTIONS = NTB_STAGE_BUCKETS.map((b) => ({ value: b.id, label: b.label }))

/** `DisbursementMitraDetail`'s funnel-stage shape mapped into the shared
 *  drawer's generic chip — Pencairan's own reading of "what to show beside a
 *  lead's name and her tindakan log", the way repayment-grid.tsx maps its
 *  own DPD shape. No metric: a lead carries no figure the way Pembayaran's
 *  mitra carries tunggakan, so `metricLabel`/`metricValue` stay unset and
 *  the drawer skips that block entirely. */
function toDrawerRow(m: DisbursementMitraDetail): MitraDrawerRow {
  return {
    id: m.id,
    code: m.code ?? undefined,
    name: m.name,
    majelis: m.majelis ?? undefined,
    statusId: m.stageId,
    statusLabel: ntbStageLabel(m.stageId),
    statusIntent: ntbStageIntent(m.stageId),
    leadDate: m.leadDate,
    leadDateRelative: m.leadDateRelative,
    source: m.source,
    location: m.location,
    tindakan: m.tindakan,
    followUp: m.followUp,
  }
}

function ntbFunnelValues(bp: DisbursementBp) {
  return {
    prospek: bp.ntbProspek,
    dilanjuti: bp.ntbDilanjuti,
    surveiDimulai: bp.ntbSurveiDimulai,
    surveiDikirim: bp.ntbSurveiDikirim,
    disetujui: bp.leadsDisetujui,
  }
}

function etbFunnelValues(bp: DisbursementBp) {
  return {
    totalLeads: bp.etbTotalLeads,
    dilanjuti: bp.etbDilanjuti,
    surveiDimulai: bp.etbSurveiDimulai,
    surveiDikirim: bp.etbSurveiDikirim,
    disetujui: bp.etbDisetujui,
  }
}

/**
 * The branch headline: each card names the target it's read against in the
 * corner, then the count, then how much of the denominator that figure
 * represents underneath. No rate badge — the funnel toggles below are what
 * explain a shortfall now.
 */
export function DisbursementMetrics() {
  const branch = branchDisbursement()
  const bpCount = DISBURSEMENT_BPS.length
  const nilai = DISBURSEMENT_BPS.reduce((n, bp) => n + nilaiTotal(bp), 0)
  const nilaiTarget = DISBURSEMENT_TARGETS.nilai * bpCount
  const baruTarget = DISBURSEMENT_TARGETS.noaBaru * bpCount

  return (
    <div className="grid grid-cols-3 gap-16 pb-16">
      <BucketCard label="Pencairan" value={rp(nilai)} caption={`/${rp(nilaiTarget)}`} />
      <BucketCard label="Mitra baru" value={`${branch.baru}`} caption={`/${baruTarget}`} />
      <BucketCard label="Mitra lanjutan" value={`${branch.lanjutan}`} caption={`/${branch.due}`} />
    </div>
  )
}

/** The strip above the table: title left, Download right. */
export function DisbursementHeading() {
  const [preparing, setPreparing] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
      <span className="text-16 font-bold text-default">Pencairan per Business Partner (BP)</span>
      <Button variant="outline" size="sm" onClick={() => setPreparing(true)}>
        <span className="flex items-center gap-8">
          <DownloadSimple size={16} />
          {preparing ? 'Sedang disiapkan' : 'Download'}
        </span>
      </Button>
    </div>
  )
}

/** The header cell shared by Mitra baru and Mitra lanjutan: label + target on
 *  the left, the segment's own "Lihat Alur"/"Tutup Alur" toggle on the
 *  right — independent of the other segment's toggle. */
function FunnelGroupHeader({
  header,
  target,
  open,
  onToggle,
}: {
  header: string
  target: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <span className="flex items-center justify-center gap-16 whitespace-nowrap">
      <span className="flex flex-col gap-2 text-center">
        <span className="text-12 font-bold text-default">{header}</span>
        <span className="text-12 font-regular text-caption">{target}</span>
      </span>
      <Button variant="ghost" size="sm" onClick={onToggle}>
        <span className="flex items-center gap-4">
          {open ? 'Tutup Alur' : 'Lihat Alur'}
          <ArrowRight size={16} />
        </span>
      </Button>
    </span>
  )
}

export function DisbursementTable() {
  // Each segment opens its own funnel independently — a BM chasing Mitra
  // baru shouldn't have Mitra lanjutan's columns appear too, and vice versa.
  const [ntbOpen, setNtbOpen] = useState(false)
  const [etbOpen, setEtbOpen] = useState(false)
  // "Lihat detail" — same BP → mitra drill-down Pembayaran uses, reading the
  // NTB funnel instead of DPD (see toDrawerRow above).
  const [detailBp, setDetailBp] = useState<DisbursementBp | null>(null)
  const [detailMitraId, setDetailMitraId] = useState<string | null>(null)
  const drawerRoster = detailBp ? disbursementMitraDetailFor(detailBp).map(toDrawerRow) : []
  const drawerMitra = drawerRoster.find((m) => m.id === detailMitraId) ?? null
  // Scrolled to whenever its funnel opens, so the newly-added columns land
  // in view instead of the BM having to notice and scroll for herself.
  const ntbFunnelRef = useRef<HTMLTableCellElement>(null)
  const etbFunnelRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    if (ntbOpen) ntbFunnelRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' })
  }, [ntbOpen])

  useEffect(() => {
    if (etbOpen) etbFunnelRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' })
  }, [etbOpen])

  const baruCols = ntbOpen ? ['NoA', 'Pencairan', ...NTB_FUNNEL.map((f) => f.label)] : ['NoA', 'Pencairan']
  const lanjutanCols = etbOpen
    ? ['NoA', 'Pencairan', ...ETB_FUNNEL.map((f) => f.label)]
    : ['NoA', 'Pencairan']
  const colspan = 1 + TOTAL_GROUP.cols.length + baruCols.length + lanjutanCols.length
  const minWidth =
    150 +
    [...TOTAL_GROUP.cols, ...baruCols, ...lanjutanCols].reduce((n, label) => n + (COL_WIDTH[label] ?? 90), 0)

  return (
    <>
      <DisbursementMetrics />
      <DisbursementHeading />

      <Panel className="p-0">
        <div className="min-w-0 overflow-x-auto">
          <table className="border-collapse text-left" style={{ width: '100%', minWidth }}>
            <colgroup>
              <col style={{ width: 150 }} />
              {TOTAL_GROUP.cols.map((label) => (
                <col key={`total-${label}`} style={{ width: COL_WIDTH[label] ?? 90 }} />
              ))}
              {baruCols.map((label, i) => (
                <col key={`baru-${label}-${i}`} style={{ width: COL_WIDTH[label] ?? 90 }} />
              ))}
              {lanjutanCols.map((label, i) => (
                <col key={`lanjutan-${label}-${i}`} style={{ width: COL_WIDTH[label] ?? 90 }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-neutral-200">
                <th
                  rowSpan={2}
                  className="px-16 pb-12 pt-16 text-12 font-bold text-default"
                  style={{ width: 150 }}
                >
                  Nama
                </th>
                <th
                  colSpan={TOTAL_GROUP.cols.length}
                  className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                >
                  <span className="flex flex-col gap-2">
                    {TOTAL_GROUP.header}
                    <span className="text-12 font-regular text-caption">{TOTAL_GROUP.target}</span>
                  </span>
                </th>
                <th
                  colSpan={baruCols.length}
                  className="border-l border-default px-16 pb-8 pt-16 text-12 font-bold text-default"
                >
                  <FunnelGroupHeader
                    header={BARU_GROUP.header}
                    target={BARU_GROUP.target}
                    open={ntbOpen}
                    onToggle={() => setNtbOpen(!ntbOpen)}
                  />
                </th>
                <th
                  colSpan={lanjutanCols.length}
                  className="border-l border-default px-16 pb-8 pt-16 text-12 font-bold text-default"
                >
                  <FunnelGroupHeader
                    header={LANJUTAN_GROUP.header}
                    target={LANJUTAN_GROUP.target}
                    open={etbOpen}
                    onToggle={() => setEtbOpen(!etbOpen)}
                  />
                </th>
              </tr>
              <tr className="bg-neutral-200">
                {TOTAL_GROUP.cols.map((label, i) => (
                  <th
                    key={label}
                    className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                      i === 0 ? 'border-l border-default' : ''
                    }`}
                  >
                    {label}
                  </th>
                ))}
                {baruCols.map((label, i) => (
                  <th
                    key={`baru-${label}-${i}`}
                    ref={i === baruCols.length - 1 ? ntbFunnelRef : undefined}
                    className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                      i === 0 ? 'border-l border-default' : ''
                    }`}
                  >
                    {label}
                  </th>
                ))}
                {lanjutanCols.map((label, i) => (
                  <th
                    key={`lanjutan-${label}-${i}`}
                    ref={i === lanjutanCols.length - 1 ? etbFunnelRef : undefined}
                    className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                      i === 0 ? 'border-l border-default' : ''
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISBURSEMENT_BPS.length === 0 ? (
                <tr>
                  <td colSpan={colspan} className="px-16 py-24 text-center text-12 text-caption">
                    Belum ada pencairan pada periode ini.
                  </td>
                </tr>
              ) : null}
              {DISBURSEMENT_BPS.map((bp, i) => (
                <BpRow
                  key={bp.id}
                  bp={bp}
                  zebra={i % 2 === 1}
                  ntbOpen={ntbOpen}
                  etbOpen={etbOpen}
                  onDetailClick={() => {
                    setDetailMitraId(null)
                    setDetailBp(bp)
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {detailBp ? (
        <MitraDrawer
          bpName={detailBp.name}
          roster={drawerRoster}
          statusOptions={STAGE_STATUS_OPTIONS}
          mitra={drawerMitra}
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

function BpRow({
  bp,
  zebra,
  ntbOpen,
  etbOpen,
  onDetailClick,
}: {
  bp: DisbursementBp
  zebra: boolean
  ntbOpen: boolean
  etbOpen: boolean
  onDetailClick: () => void
}) {
  const stripe = zebra ? 'bg-neutral-50' : 'bg-neutral-white'
  const noaShort = noaBaruShortfall(bp)
  const lanjutanShort = renewalShortfall(bp)
  const nilaiShort = nilaiShortfall(bp)
  const ntb = ntbFunnelValues(bp)
  const etb = etbFunnelValues(bp)

  return (
    <Fragment>
      <tr onClick={onDetailClick} className={`cursor-pointer align-middle hover:bg-neutral-100 ${stripe}`}>
        <td rowSpan={2} className="px-16 py-12 text-14 text-default">
          <span className="flex flex-col items-start gap-2">
            {bp.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDetailClick()
              }}
              className="text-12 text-link hover:underline"
            >
              Lihat detail
            </button>
          </span>
        </td>

        {/* Total: NoA, Pencairan — no funnel, it's the sum of the two
            segments below. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {noaTotal(bp)}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(nilaiTotal(bp))}</td>

        {/* Mitra baru: NoA, Pencairan, then its own NTB funnel once opened. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaBaru}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiBaru)}</td>
        {ntbOpen
          ? NTB_FUNNEL.map((f, i) => (
              <td
                key={f.key}
                className={`px-12 pt-16 text-center text-14 text-default ${
                  i === 0 ? 'border-l border-default' : ''
                }`}
              >
                {ntb[f.key]}
              </td>
            ))
          : null}

        {/* Mitra lanjutan: NoA, Pencairan, then its own ETB funnel once
            opened — independent of Mitra baru's. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaLanjutan}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiLanjutan)}</td>
        {etbOpen
          ? ETB_FUNNEL.map((f, i) => (
              <td
                key={f.key}
                className={`px-12 pt-16 text-center text-14 text-default ${
                  i === 0 ? 'border-l border-default' : ''
                }`}
              >
                {etb[f.key]}
              </td>
            ))
          : null}
      </tr>

      {/* Each shortfall sits under the column it is about — the rupiah gap
          beneath Total's Pencairan, the mitra gap beneath each segment's
          NoA. The funnel columns carry no shortfall of their own: they're a
          leading indicator, not something with a monthly pass/fail line. */}
      <tr
        onClick={onDetailClick}
        className={`cursor-pointer border-b border-default align-top hover:bg-neutral-100 ${stripe}`}
      >
        <td className="border-l border-default px-12 pb-16 pt-4" />
        <td className={SHORT_CELL}>{nilaiShort ? `${rp(nilaiShort)} lagi` : null}</td>

        <td className={`border-l border-default ${SHORT_CELL}`}>
          {noaShort ? `${noaShort} mitra lagi` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />
        {ntbOpen
          ? NTB_FUNNEL.map((f, i) => (
              <td key={f.key} className={`px-12 pb-16 pt-4 ${i === 0 ? 'border-l border-default' : ''}`} />
            ))
          : null}

        <td className={`border-l border-default ${SHORT_CELL}`}>
          {lanjutanShort ? `${lanjutanShort} mitra lagi` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />
        {etbOpen
          ? ETB_FUNNEL.map((f, i) => (
              <td key={f.key} className={`px-12 pb-16 pt-4 ${i === 0 ? 'border-l border-default' : ''}`} />
            ))
          : null}
      </tr>
    </Fragment>
  )
}
