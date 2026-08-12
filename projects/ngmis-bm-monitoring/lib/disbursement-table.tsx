'use client'

// Pencairan — what the branch put out this period, per BP.
//
// The table is one row per BP under two grouped headers, because disbursement
// is read as two questions and not one: how MANY loans went out (NoA) and how
// MUCH they were worth, each split into mitra baru and mitra lanjutan. A BP can
// be strong on renewals and put out no new mitra at all, and a single pencairan
// figure hides exactly that.
//
// Only three things wear colour, and each is a judgement against a stated
// target: the new-mitra count, the renewal rate, and the rupiah still missing.
// Everything else is a fact, and facts stay black — the same rule the
// Pembayaran table follows, so the two tabs are read the same way.
//
// Mitra lanjutan carries its RATE beside the count. Eleven renewals means
// nothing on its own: it is excellent on a book with twelve mitra maturing and
// poor on one with twenty, and the target is written as a percentage anyway.

import { Fragment, useState } from 'react'
import { Button } from '@/design-system/components'
import { DownloadSimple } from '@/design-system/icons'
import { MetricCard, Panel } from './ui'
import {
  DISBURSEMENT_BPS,
  DISBURSEMENT_TARGETS,
  WEEKS_IN_MONTH,
  branchDisbursement,
  nilaiShortfall,
  nilaiTotal,
  noaBaruBand,
  noaTotal,
  renewalRate,
  shortfallBand,
  type Band,
  type DisbursementBp,
} from './data'

const BAND_TEXT: Record<Band, string> = {
  red: 'text-red-500',
  orange: 'text-orange-500',
  green: 'text-green-500',
}

const juta = (v: number) => `Rp${v} juta`
const pct = (v: number) => `${Math.round(v)}%`

/** The two grouped headers, each three columns wide. */
const GROUPS = [
  { id: 'noa', header: 'Jumlah pencairan (NoA)' },
  { id: 'nilai', header: 'Nilai pencairan' },
]

const COLSPAN = 1 + GROUPS.length * 3 + 1

export function DisbursementMetrics() {
  const branch = branchDisbursement()
  return (
    <div className="grid grid-cols-2 gap-16 pb-16">
      {/* Both targets are MONTHLY and the page reports a week, so the count is
          judged against its paced share rather than against 20 — a branch four
          days into a month is not failing by being under twenty. The card
          still names the monthly figure, because that is the number the
          business set. */}
      <MetricCard
        label="Mitra baru cair"
        value={`${branch.baru} mitra`}
        target={`${DISBURSEMENT_TARGETS.noaBaru} mitra / bulan`}
        onTarget={branch.baru >= DISBURSEMENT_TARGETS.noaBaru / WEEKS_IN_MONTH}
      />
      <MetricCard
        label="Renewal mitra lanjutan cair"
        value={pct(branch.renewal)}
        target={`${DISBURSEMENT_TARGETS.renewalRate}% / bulan`}
        onTarget={branch.renewal >= DISBURSEMENT_TARGETS.renewalRate}
      />
    </div>
  )
}

export function DisbursementTable() {
  // The export the BM actually asks for. It stays inside the prototype
  // (CLAUDE.md §3): the button reports that the file is being prepared rather
  // than really downloading one, which is the part under review anyway.
  const [preparing, setPreparing] = useState(false)

  return (
    <>
      <DisbursementMetrics />

      <Panel className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-16 p-16">
          <span className="text-16 font-bold text-default">Pencairan per BP</span>
          <Button variant="outline" size="sm" onClick={() => setPreparing(true)}>
            <span className="flex items-center gap-4">
              <DownloadSimple size={16} />
              {preparing ? 'Sedang disiapkan' : 'Download'}
            </span>
          </Button>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-200">
                <th
                  rowSpan={2}
                  className="px-16 pb-12 pt-16 text-12 font-bold text-default"
                  style={{ width: 180 }}
                >
                  Nama
                </th>
                {GROUPS.map((group) => (
                  <th
                    key={group.id}
                    colSpan={3}
                    className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                  >
                    {group.header}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="border-l border-default px-16 pb-12 pt-16 text-right text-12 font-bold text-default"
                >
                  Kurang dari target
                </th>
              </tr>
              <tr className="bg-neutral-200">
                {GROUPS.map((group) => (
                  <Fragment key={group.id}>
                    <th className="border-l border-default px-12 pb-12 text-center text-12 font-regular text-caption">
                      Total
                    </th>
                    <th className="px-12 pb-12 text-center text-12 font-regular text-caption">
                      Mitra baru
                    </th>
                    <th className="px-12 pb-12 text-center text-12 font-regular text-caption">
                      Mitra lanjutan
                    </th>
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
  const short = nilaiShortfall(bp)
  const rate = renewalRate(bp)
  const renewalOk = rate >= DISBURSEMENT_TARGETS.renewalRate

  return (
    <tr
      className={`border-b border-default align-middle ${
        zebra ? 'bg-neutral-50' : 'bg-neutral-white'
      }`}
    >
      {/* Name over its majelis count: how big a book the row's figures came
          out of, which is the first thing that explains a low number. */}
      <td className="px-16 py-12">
        <div className="flex flex-col gap-2">
          <span className="text-14 text-default">{bp.name}</span>
          <span className="text-12 text-caption">{bp.majelis} majelis</span>
        </div>
      </td>

      <td className="border-l border-default px-12 py-12 text-center text-14 font-bold text-default">
        {noaTotal(bp)}
      </td>
      <td
        className={`px-12 py-12 text-center text-14 font-bold ${BAND_TEXT[noaBaruBand(bp.noaBaru)]}`}
      >
        {bp.noaBaru}
      </td>
      {/* The count and the rate together — the rate is the half the target is
          written in, the count is the half the BM can name mitra for. */}
      <td className="px-12 py-12 text-center">
        <div className="flex flex-col gap-2">
          <span className="text-14 text-default">{bp.noaLanjutan}</span>
          <span className={`text-12 font-bold ${renewalOk ? 'text-green-500' : 'text-orange-500'}`}>
            {pct(rate)} dari {bp.renewalDue}
          </span>
        </div>
      </td>

      <td className="border-l border-default px-12 py-12 text-center text-14 font-bold text-default">
        {juta(nilaiTotal(bp))}
      </td>
      <td className="px-12 py-12 text-center text-14 text-caption">{juta(bp.nilaiBaru)}</td>
      <td className="px-12 py-12 text-center text-14 text-caption">{juta(bp.nilaiLanjutan)}</td>

      <td
        className={`border-l border-default px-16 py-12 text-right text-14 font-bold ${
          BAND_TEXT[shortfallBand(short)]
        }`}
      >
        {short === 0 ? 'Tercapai' : juta(short)}
      </td>
    </tr>
  )
}
