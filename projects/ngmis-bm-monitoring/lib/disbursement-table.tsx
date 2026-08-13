'use client'

// Pencairan — what the branch put out this MONTH, per BP.
//
// Drawn on the same shapes as Pembayaran, so the two tabs are read the same
// way: a row of cards for the branch headline, then one row per BP under
// grouped headers, then a caption line beneath the column each shortfall is
// about.
//
// Disbursement is read as two questions and not one: how MANY loans went out
// (NoA) and how MUCH they were worth, each split into mitra baru and mitra
// lanjutan. A BP can be strong on renewals and put out no new mitra at all, and
// a single pencairan figure hides exactly that.
//
// Colour follows Pembayaran's rule exactly: the counts and the rupiah are
// facts, so they stay black, and only the renewal RATE — the one figure on the
// tab that is a judgement against a stated standard — wears green or red. The
// earlier three-band red/orange/green colouring is gone: it painted every
// figure on the page, which left nothing standing out.
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
  meetsRenewal,
  nilaiShortfall,
  nilaiTotal,
  noaBaruShortfall,
  noaTotal,
  renewalRate,
  renewalShortfall,
  type DisbursementBp,
} from './data'

const juta = (v: number) => `Rp${v} juta`
const pct = (v: number) => `${Math.round(v)}%`

/** The two grouped headers, each three columns wide, each naming the monthly
 *  target it is read against — the same line Pembayaran puts under its bucket
 *  headers. */
const GROUPS = [
  {
    id: 'noa',
    header: 'Jumlah pencairan (NoA)',
    target: `Target ${DISBURSEMENT_TARGETS.noaBaru} mitra baru / bulan`,
  },
  {
    id: 'nilai',
    header: 'Nilai pencairan',
    target: `Target ${juta(DISBURSEMENT_TARGETS.nilai)} / bulan`,
  },
] as const

const SUB = ['Total', 'Mitra baru', 'Mitra lanjutan']

const SHORT_CELL = 'px-12 pb-16 pt-4 text-center text-10 text-caption'

/**
 * The branch headline, on Pembayaran's cards: the figure plain and black, the
 * target it is read against sitting underneath as a caption. The verdict is not
 * repeated here — it lives on the renewal rate in the table, once.
 */
export function DisbursementMetrics() {
  const branch = branchDisbursement()
  const nilai = DISBURSEMENT_BPS.reduce((n, bp) => n + nilaiTotal(bp), 0)

  return (
    <div className="grid grid-cols-3 gap-16 pb-16">
      <BucketCard
        label="Mitra baru"
        value={`${branch.baru}`}
        caption={`Target ${DISBURSEMENT_TARGETS.noaBaru} mitra / bulan`}
      />
      {/* Mitra lanjutan carries its own renewal rate rather than standing
          beside a separate Renewal card: the rate is that count over the mitra
          due back, so two cards said one fact twice and invited them to be
          read as different things. Same shape the table's column uses. */}
      <BucketCard
        label="Mitra lanjutan"
        value={`${branch.lanjutan}`}
        trailing={
          <RatePill ok={branch.renewal >= DISBURSEMENT_TARGETS.renewalRate}>
            {pct(branch.renewal)}
          </RatePill>
        }
        caption={`Dari ${branch.due} mitra jatuh tempo · Target ${DISBURSEMENT_TARGETS.renewalRate}% / bulan`}
      />
      <BucketCard
        label="Nilai pencairan"
        value={`${nilai} juta`}
        prefix="Rp"
        caption={`Target ${juta(DISBURSEMENT_TARGETS.nilai)} / bulan`}
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
      <span className="text-16 font-bold text-default">Pencairan per BP</span>
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
                    colSpan={3}
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
                    {SUB.map((label, i) => (
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
                  <td colSpan={1 + GROUPS.length * 3} className="px-16 py-24 text-center text-12 text-caption">
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
  // Zebra striping, so the eye can track a row across six columns without
  // losing its line. Each BP is two table rows — the figures, then the
  // shortfall centred beneath its whole group — so they share a background and
  // only the second carries the dividing border.
  const stripe = zebra ? 'bg-neutral-50' : 'bg-neutral-white'
  const noaShort = noaBaruShortfall(bp)
  const lanjutanShort = renewalShortfall(bp)
  const nilaiShort = nilaiShortfall(bp)

  return (
    <Fragment>
      <tr className={`align-middle ${stripe}`}>
        {/* Name over its majelis count: how big a book the row's figures came
            out of, which is the first thing that explains a low number. */}
        <td rowSpan={2} className="px-16 py-12">
          <span className="flex min-w-0 flex-col gap-4">
            <span className="text-14 text-default">{bp.name}</span>
            <span className="text-12 text-caption">{bp.majelis} majelis</span>
          </span>
        </td>

        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {noaTotal(bp)}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{bp.noaBaru}</td>
        {/* The count and the rate on one line — the count is the half the BM
            can name mitra for, the rate is the half the target is written in,
            and the only figure on the tab carrying a verdict. The denominator
            is left off: it is the same renewalDue the rate is already computed
            from, and reading it beside the count invites the two to be
            compared as though they were different facts. */}
        <td className="px-12 pt-16 text-center">
          <span className="flex items-center justify-center gap-8">
            <span className="text-14 text-default">{bp.noaLanjutan}</span>
            <RatePill ok={meetsRenewal(bp)}>{pct(renewalRate(bp))}</RatePill>
          </span>
        </td>

        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {juta(nilaiTotal(bp))}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{juta(bp.nilaiBaru)}</td>
        <td className="px-12 pt-16 text-center text-14 text-default">{juta(bp.nilaiLanjutan)}</td>
      </tr>

      {/* Each shortfall sits under the column it is about — the mitra-baru gap
          beneath Mitra baru, the rupiah gap beneath the Nilai total it is
          measured from — rather than centred under the whole group, where it
          read as belonging to all three columns at once. */}
      <tr className={`border-b border-default align-top ${stripe}`}>
        <td className="border-l border-default px-12 pb-16 pt-4" />
        <td className={SHORT_CELL}>{noaShort ? `Kurang ${noaShort} mitra baru` : null}</td>
        <td className={SHORT_CELL}>
          {lanjutanShort ? `Kurang ${lanjutanShort} mitra lanjutan` : null}
        </td>
        <td className={`border-l border-default ${SHORT_CELL}`}>
          {nilaiShort ? `Kurang ${juta(nilaiShort)}` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />
        <td className="px-12 pb-16 pt-4" />
      </tr>
    </Fragment>
  )
}
