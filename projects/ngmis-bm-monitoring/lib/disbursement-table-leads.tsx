'use client'

// Pencairan — "With Leads monitoring".
//
// The same monthly Pencairan-per-BP table as `disbursement-table.tsx`, with
// differences the STATES panel switches between:
//
// - The three headline cards drop their rate: no %, no "Target: …" corner
//   label. This cut is read as plain counts and rupiah, not counts scored
//   against a target — the scoring lives in the other cut.
// - A new "Potential mitra" section, above the table and as its own column
//   group inside it, opens up the recruitment pipeline that ends at Mitra
//   baru's NoA: Leads tanpa KTP, Leads dengan KTP, UK (menjalani uji
//   kelayakan) and Disetujui — so a BM can tell a cold BP (few leads
//   recruited) from a slow one (leads stuck mid-funnel) rather than reading
//   one flat NoA. The KTP split is named for what it is rather than a
//   "qualified/unqualified" label that made a BM go look up what qualifies a
//   lead.
//
// Potential mitra is deliberately its own group, in both the panel above the
// table and the table's own header row — not folded into "Mitra baru" — so a
// BM never reads a lead count as if it were already a disbursed mitra. Mitra
// baru keeps meaning exactly what it always has: NoA and Pencairan.
//
// The panel is still visually bonded to the Mitra baru card, though: an
// accent line — the card's bottom edge, a short connector bar, the panel's
// top edge — runs from one into the other. It's deliberately an edge accent,
// not a full accent border around the card: a full border around only Mitra
// baru, beside two cards still in `border-default`, reads as "this one is
// selected" (the same grammar a filter chip uses), not "this one continues
// below". The edge-only version reads as a pipe instead of a highlight.
//
// Disetujui and NoA are kept as separate figures on purpose, even though
// they're close: an approved lead can still miss disbursing in the period it
// was approved in, so Disetujui can run ahead of NoA, and folding them
// together would hide that gap — the thing this cut exists to show.
//
// The table itself scrolls horizontally rather than squeezing its twelve
// columns to fit — see the comment at the table wrapper.
//
// Everything else — Total's columns, mitra lanjutan's %NoA and rate pill, the
// per-BP shortfall captions — is unchanged from the plain cut, so a BM
// switching between the two states is comparing the one thing that differs.

import { Fragment, useState } from 'react'
import { Button } from '@/design-system/components'
import { ChevronRight, DownloadSimple } from '@/design-system/icons'
import { BucketCard, Collapsible, Panel, RatePill } from './ui'
import {
  DISBURSEMENT_BPS,
  DISBURSEMENT_TARGETS,
  branchDisbursement,
  meetsRenewal,
  nilaiShortfall,
  nilaiTotal,
  noaBaruShortfall,
  noaTotal,
  potentialMitraFunnel,
  potentialMitraTotal,
  renewalRate,
  renewalShortfall,
  rupiah,
  type DisbursementBp,
} from './data'

const rp = (jutaValue: number) => `Rp${rupiah(jutaValue * 1_000_000)}`
const pct = (v: number) => `${Math.round(v)}%`

const GROUPS = [
  {
    id: 'total',
    header: 'Total',
    target: `Target ${rp(DISBURSEMENT_TARGETS.nilai)} pencairan`,
    cols: ['NoA', 'Pencairan'],
  },
  {
    id: 'potential',
    header: 'Potential mitra',
    target: 'Menuju Mitra baru',
    cols: ['Tanpa KTP', 'Dengan KTP', 'UK', 'Disetujui'],
  },
  {
    id: 'baru',
    header: 'Mitra baru',
    target: `Target ${DISBURSEMENT_TARGETS.noaBaru} NoA`,
    cols: ['NoA', 'Pencairan'],
  },
  {
    id: 'lanjutan',
    header: 'Mitra lanjutan',
    target: `Target ${DISBURSEMENT_TARGETS.renewalRate}% NoA`,
    cols: ['NoA', '%NoA', 'Pencairan'],
  },
] as const

const COLSPAN = 1 + GROUPS.reduce((n, g) => n + g.cols.length, 0)

const SHORT_CELL = 'px-12 pb-16 pt-4 text-center text-10 text-caption'

const FUNNEL_STAGES = [
  { id: 'unqualified', label: 'Tanpa KTP', hint: undefined },
  { id: 'qualified', label: 'Dengan KTP', hint: undefined },
  { id: 'uk', label: 'UK', hint: 'Uji kelayakan' },
  { id: 'disetujui', label: 'Disetujui', hint: undefined },
] as const

function FunnelBox({
  label,
  value,
  hint,
  highlight,
}: {
  label: string
  value: number
  hint?: string
  /** Marks the funnel's actual target — the disbursed NoA it all leads to. */
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-1 flex-col gap-2 rounded-8 p-12 ${
        highlight ? 'border border-primary-500 bg-primary-50' : 'bg-neutral-50'
      }`}
    >
      <span className={`text-12 ${highlight ? 'font-bold text-primary-500' : 'text-caption'}`}>
        {label}
      </span>
      <span
        className={`text-20 font-bold ${highlight ? 'text-primary-500' : 'text-default'}`}
      >
        {value}
      </span>
      {hint ? <span className="text-10 text-caption">{hint}</span> : null}
    </div>
  )
}

/**
 * The branch headline: same three buckets as the plain cut, minus the rate
 * badge and the "Target: …" corner label — this cut reads as counts and
 * rupiah on their own. Underneath, the recruitment pipeline that feeds Mitra
 * baru: four lead stages ending at Disetujui, then an arrow into Disbursed —
 * the NoA count that is the actual target, not just another funnel stage.
 *
 * Mitra baru's card and the panel are bridged by an accent line, not a
 * matching accent OUTLINE: a full primary-500 border around Mitra baru's
 * card, sitting beside two cards in plain `border-default`, read as "this
 * one is selected" rather than "this one continues below" — the same visual
 * grammar a filter chip or a radio card uses. Instead, only the card's
 * bottom edge and the panel's top edge carry the accent, joined by a short
 * connector bar between them, so the colour reads as a pipe running from one
 * to the other rather than a highlight singling Mitra baru out from its
 * siblings. The panel's own layout is untouched — full width, same spacious
 * grid as every other cut, so the numbers stay easy to scan at a glance.
 */
export function DisbursementMetricsLeads() {
  const branch = branchDisbursement()
  const nilai = DISBURSEMENT_BPS.reduce((n, bp) => n + nilaiTotal(bp), 0)
  const funnel = potentialMitraFunnel()

  return (
    <div className="flex flex-col pb-16">
      <div className="grid grid-cols-3 gap-16">
        <BucketCard label="Pencairan" value={rp(nilai)} caption={`/${rp(DISBURSEMENT_TARGETS.nilai * DISBURSEMENT_BPS.length)}`} />
        <BucketCard
          label="Mitra baru"
          value={`${branch.baru}`}
          caption={`/${DISBURSEMENT_TARGETS.noaBaru * DISBURSEMENT_BPS.length}`}
          borderClassName="border-default border-b-4 border-b-primary-500"
        />
        <BucketCard label="Mitra lanjutan" value={`${branch.lanjutan}`} caption={`/${branch.due}`} />
      </div>

      <div className="grid grid-cols-3">
        <div />
        <div className="mx-auto bg-primary-500" style={{ width: 2, height: 8 }} />
        <div />
      </div>

      <Collapsible
        title="Potential mitra — menuju Mitra baru"
        hint={`${potentialMitraTotal()} lead`}
        borderClassName="border-default border-t-4 border-t-primary-500"
      >
        <div className="flex flex-col gap-8">
          <span className="text-12 text-caption">Alur rekrutmen menuju Mitra baru.</span>
          <div className="flex items-stretch gap-8">
            {FUNNEL_STAGES.map((stage) => (
              <FunnelBox key={stage.id} label={stage.label} value={funnel[stage.id]} hint={stage.hint} />
            ))}
            <span className="flex items-center text-disabled">
              <ChevronRight size={16} />
            </span>
            <FunnelBox label="Disbursed" value={branch.baru} highlight />
          </div>
        </div>
      </Collapsible>
    </div>
  )
}

export function DisbursementHeadingLeads() {
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

export function DisbursementTableLeads() {
  return (
    <>
      <DisbursementMetricsLeads />
      <DisbursementHeadingLeads />

      <Panel className="p-0">
        {/* Twelve columns across four groups is more than the viewport
            comfortably holds once Potential mitra's own group is added — this
            cut scrolls horizontally rather than squeezing every column to
            fit, so a BM can still read a value without it wrapping or
            truncating. `min-w-0` on the wrapper is what lets the table
            overflow it instead of stretching the wrapper along with it. */}
        <div className="min-w-0 overflow-x-auto">
          <table className="border-collapse text-left" style={{ minWidth: 1200 }}>
            <thead>
              <tr className="bg-neutral-200">
                <th
                  rowSpan={2}
                  className="px-16 pb-12 pt-16 text-12 font-bold text-default"
                  style={{ width: 150 }}
                >
                  Nama
                </th>
                {GROUPS.map((group) => (
                  <th
                    key={group.id}
                    colSpan={group.cols.length}
                    className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                  >
                    <span className="flex flex-col gap-2">
                      {group.header}
                      <span className="text-12 font-regular text-caption">{group.target}</span>
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="bg-neutral-200">
                {GROUPS.map((group) => (
                  <Fragment key={group.id}>
                    {group.cols.map((label, i) => (
                      <th
                        key={label}
                        className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                          i === 0 ? 'border-l border-default' : ''
                        }`}
                      >
                        {label}
                      </th>
                    ))}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISBURSEMENT_BPS.length === 0 ? (
                <tr>
                  <td colSpan={COLSPAN} className="px-16 py-24 text-center text-12 text-caption">
                    Belum ada pencairan pada periode ini.
                  </td>
                </tr>
              ) : null}
              {DISBURSEMENT_BPS.map((bp, i) => (
                <BpRow key={bp.id} bp={bp} zebra={i % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

function BpRow({ bp, zebra }: { bp: DisbursementBp; zebra: boolean }) {
  const stripe = zebra ? 'bg-neutral-50' : 'bg-neutral-white'
  const noaShort = noaBaruShortfall(bp)
  const lanjutanShort = renewalShortfall(bp)
  const nilaiShort = nilaiShortfall(bp)

  return (
    <Fragment>
      <tr className={`align-middle ${stripe}`}>
        <td rowSpan={2} className="px-16 py-12 text-14 text-default">
          {bp.name}
        </td>

        {/* Total: unchanged from the plain cut. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {noaTotal(bp)}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(nilaiTotal(bp))}</td>

        {/* Potential mitra: its own group, not folded into Mitra baru — a
            lead is not yet a mitra. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.leadsUnqualified}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsQualified}</td>
        <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsUk}</td>
        <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsDisetujui}</td>

        {/* Mitra baru: plain NoA/Pencairan, the same as the default cut — the
            funnel that feeds it is told beside it, not inside it. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaBaru}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiBaru)}</td>

        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaLanjutan}
        </td>
        <td className="px-12 pt-16 text-center">
          <RatePill ok={meetsRenewal(bp)}>{pct(renewalRate(bp))}</RatePill>
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiLanjutan)}</td>
      </tr>

      <tr className={`border-b border-default align-top ${stripe}`}>
        <td className="border-l border-default px-12 pb-16 pt-4" />
        <td className={SHORT_CELL}>{nilaiShort ? `${rp(nilaiShort)} lagi` : null}</td>

        {/* Potential mitra carries no shortfall of its own — it's a leading
            indicator, not something with a monthly pass/fail line. */}
        <td className="border-l border-default px-12 pb-16 pt-4" />
        <td className="px-12 pb-16 pt-4" />
        <td className="px-12 pb-16 pt-4" />
        <td className="px-12 pb-16 pt-4" />

        {/* The shortfall is about clearing the month's mitra baru NoA target,
            so it sits under Mitra baru's own NoA. */}
        <td className={`border-l border-default ${SHORT_CELL}`}>
          {noaShort ? `${noaShort} mitra lagi` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />

        <td className={`border-l border-default ${SHORT_CELL}`}>
          {lanjutanShort ? `${lanjutanShort} mitra lagi` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />
        <td className="px-12 pb-16 pt-4" />
      </tr>
    </Fragment>
  )
}
