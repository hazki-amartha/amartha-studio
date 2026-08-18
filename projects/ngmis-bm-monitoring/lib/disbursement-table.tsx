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
// Every segment carries its own Rate now, not just mitra lanjutan: Total and
// Mitra baru are both read against a real monthly count, so the same verdict
// colour Pembayaran reserves for figures with a standard applies here too.
//
// The targets are monthly and the page now reports a month, so nothing is
// paced: a figure is judged against the month's target as it stands.

import { Fragment, useState } from 'react'
import { Button } from '@/design-system/components'
import { DownloadSimple } from '@/design-system/icons'
import { BucketCard, Panel, RatePill } from './ui'
import {
  DISBURSEMENT_BPS,
  DISBURSEMENT_TARGETS,
  branchDisbursement,
  meetsNilai,
  meetsNoaBaru,
  meetsRenewal,
  nilaiRate,
  nilaiShortfall,
  nilaiTotal,
  noaBaruRate,
  noaBaruShortfall,
  noaTotal,
  renewalRate,
  renewalShortfall,
  rupiah,
  type DisbursementBp,
} from './data'

/** The month's figures are stored in juta (data.ts); the page reads in full
 *  rupiah, so every value is converted at the point it's shown. */
const rp = (jutaValue: number) => `Rp${rupiah(jutaValue * 1_000_000)}`
const pct = (v: number) => `${Math.round(v)}%`

/** The three grouped headers, each naming the monthly target it is read
 *  against — the same line Pembayaran puts under its bucket headers. Every
 *  group shares the same three columns now: NoA, Pencairan, Rate. */
const GROUPS = [
  {
    id: 'total',
    header: 'Total',
    target: `Target ${rp(DISBURSEMENT_TARGETS.nilai)} pencairan`,
  },
  {
    id: 'baru',
    header: 'Mitra baru',
    target: `Target ${DISBURSEMENT_TARGETS.noaBaru} NoA`,
  },
  {
    id: 'lanjutan',
    header: 'Mitra lanjutan',
    target: `Target ${DISBURSEMENT_TARGETS.renewalRate}%`,
  },
] as const

const SUB_COLS = ['NoA', 'Pencairan', 'Rate']
const COLSPAN = 1 + GROUPS.length * SUB_COLS.length

const SHORT_CELL = 'px-12 pb-16 pt-4 text-center text-10 text-caption'

/**
 * The branch headline: each card names the target it's read against in the
 * corner, then the figure with its rate badge beside it, then how much of the
 * denominator that figure represents underneath — the same shape the table's
 * rows use, once.
 */
export function DisbursementMetrics() {
  const branch = branchDisbursement()
  const bpCount = DISBURSEMENT_BPS.length
  const nilai = DISBURSEMENT_BPS.reduce((n, bp) => n + nilaiTotal(bp), 0)
  const nilaiTarget = DISBURSEMENT_TARGETS.nilai * bpCount
  const baruTarget = DISBURSEMENT_TARGETS.noaBaru * bpCount
  const nilaiPct = nilaiTarget === 0 ? 0 : (nilai / nilaiTarget) * 100
  const baruPct = baruTarget === 0 ? 0 : (branch.baru / baruTarget) * 100

  return (
    <div className="grid grid-cols-3 gap-16 pb-16">
      <BucketCard
        label="Pencairan"
        targetLabel="Target: 100%"
        value={rp(nilai)}
        trailing={<RatePill ok={nilaiPct >= 100}>{pct(nilaiPct)}</RatePill>}
        caption={`/${rp(nilaiTarget)}`}
      />
      <BucketCard
        label="Mitra baru"
        targetLabel="Target: 100%"
        value={`${branch.baru}`}
        trailing={<RatePill ok={baruPct >= 100}>{pct(baruPct)}</RatePill>}
        caption={`/${baruTarget}`}
      />
      {/* Mitra lanjutan carries its own renewal rate rather than standing
          beside a separate Renewal card: the rate is that count over the mitra
          due back, so two cards said one fact twice and invited them to be
          read as different things. Same shape the table's column uses. */}
      <BucketCard
        label="Mitra lanjutan"
        targetLabel={`Target: ${DISBURSEMENT_TARGETS.renewalRate}%`}
        value={`${branch.lanjutan}`}
        trailing={
          <RatePill ok={branch.renewal >= DISBURSEMENT_TARGETS.renewalRate}>
            {pct(branch.renewal)}
          </RatePill>
        }
        caption={`/${branch.due}`}
      />
    </div>
  )
}

/** The strip above the table: title left, Download right — Pembayaran's, minus
 *  the unit toggle, which Pencairan has no second reading to switch to. */
export function DisbursementHeading() {
  // The export the BM actually asks for. It stays inside the prototype
  // (CLAUDE.md §3): the button reports that the file is being prepared rather
  // than really downloading one, which is the part under review anyway.
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

export function DisbursementTable() {
  return (
    <>
      <DisbursementMetrics />
      <DisbursementHeading />

      <Panel className="p-0">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
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
                    colSpan={SUB_COLS.length}
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
                    {SUB_COLS.map((label, i) => (
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
  // Zebra striping, so the eye can track a row across nine columns without
  // losing its line. Each BP is two table rows — the figures, then the
  // shortfall under the column it's about — so they share a background and
  // only the second carries the dividing border.
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

        {/* Total: NoA, Pencairan, Rate — read against the branch's own nilai
            target, so unlike Pembayaran's aggregate column this one carries a
            real verdict. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {noaTotal(bp)}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(nilaiTotal(bp))}</td>
        <td className="px-12 pt-16 text-center">
          <RatePill ok={meetsNilai(bp)}>{pct(nilaiRate(bp))}</RatePill>
        </td>

        {/* Mitra baru: NoA, Pencairan, Rate. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaBaru}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiBaru)}</td>
        <td className="px-12 pt-16 text-center">
          <RatePill ok={meetsNoaBaru(bp)}>{pct(noaBaruRate(bp))}</RatePill>
        </td>

        {/* Mitra lanjutan: NoA, Pencairan, Rate. The denominator is left off:
            it is the same renewalDue the rate is already computed from, and
            printing it beside the count invites the two to be compared as
            though they were different facts. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaLanjutan}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiLanjutan)}</td>
        <td className="px-12 pt-16 text-center">
          <RatePill ok={meetsRenewal(bp)}>{pct(renewalRate(bp))}</RatePill>
        </td>
      </tr>

      {/* Each shortfall sits under the column it is about — the rupiah gap
          beneath Total's Pencairan, the mitra gap beneath each segment's NoA —
          rather than centred under the whole group, where it read as
          belonging to every column at once. */}
      <tr className={`border-b border-default align-top ${stripe}`}>
        <td className="border-l border-default px-12 pb-16 pt-4" />
        <td className={SHORT_CELL}>{nilaiShort ? `${rp(nilaiShort)} lagi` : null}</td>
        <td className="px-12 pb-16 pt-4" />

        <td className={`border-l border-default ${SHORT_CELL}`}>
          {noaShort ? `${noaShort} mitra lagi` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />
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
