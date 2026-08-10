'use client'

// Pembayaran — the table variation.
//
// Every bucket carries three figures: how many mitra sit in it, how many paid,
// and the rate between them. Counts alone are not comparable across BPs — a
// small book and a large one produce very different Terbayar numbers at the
// same performance — so the rate is stated rather than left to the reader.
//
// Colour sits on the rate, never on the counts. The counts are facts; the rate
// is the judgement, so it is the only thing carrying a verdict. Colouring both
// would say the same thing twice across sixteen columns.

import { Fragment } from 'react'
import { MetricCard, Panel } from './ui'
import { useBpFilter } from './bp-filter'
import {
  REPAYMENT_BPS,
  REPAYMENT_METRICS,
  TARGETS,
  meetsTarget,
  metricOnTarget,
  mitraShortfall,
  rate,
  type Bucket,
} from './data'

const GROUPS = [
  { id: 'mitra', header: 'Total Mitra', totalLabel: 'Aktif' },
  { id: 'dpd0', header: 'DPD 0', totalLabel: 'Total' },
  { id: 'dpd130', header: 'DPD 1-30', totalLabel: 'Total' },
  { id: 'dpd3190', header: 'DPD 31-90', totalLabel: 'Total' },
  { id: 'dpd90', header: 'DPD 90+', totalLabel: 'Total' },
] as const

/** One spacing rule for every cell, so column edges line up down the grid. */
const CELL_X = 'px-16'

/** BP column plus three figures per bucket — used by the empty row. */
const COLSPAN = 1 + GROUPS.length * 3

/**
 * The repayment rate for a bucket, read against the biz team's standard. The
 * question a BM asks is binary — is this BP meeting the target — so the colour
 * is binary too, and the size of the gap is left to the number itself.
 *
 * A bucket with no standard is not coloured at all: Total Mitra is an aggregate
 * and nobody is held to a figure on DPD 90+, so a verdict there would be
 * inventing one.
 */
function Rate({ bucket, band }: { bucket: Bucket; band: string }) {
  const ok = meetsTarget(bucket, band)
  const short = mitraShortfall(bucket, band)
  const tone = ok === null ? 'text-caption' : ok ? 'text-green-600' : 'text-red-600'
  return (
    <span className="flex flex-col items-center gap-2">
      <span className={`text-14 font-bold ${tone}`}>
        {rate(bucket).toFixed(1).replace('.', ',')}%
      </span>
      {ok === false && short ? (
        <span className="text-10 text-red-600">kurang {short} mitra</span>
      ) : null}
    </span>
  )
}

export function RepaymentMetrics() {
  return (
    <div className="grid grid-cols-2 gap-16 pb-16">
      {REPAYMENT_METRICS.map((metric) => (
        <MetricCard
          key={metric.id}
          label={metric.label}
          value={`${metric.value}%`}
          target={`${metric.target}%`}
          onTarget={metricOnTarget(metric)}
        />
      ))}
    </div>
  )
}

export function RepaymentTable() {
  const { bps, control } = useBpFilter()

  return (
    <>
      <RepaymentMetrics />
      {control}

      <Panel className="p-0">
        <div className="min-w-0 overflow-hidden rounded-12">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-white">
                <th
                  rowSpan={2}
                  className={`border-b border-default ${CELL_X} pb-12 pt-16 text-12 font-bold text-default`}
                >
                  BP
                </th>
                {GROUPS.map((group) => (
                  <th
                    key={group.id}
                    colSpan={3}
                    className={`border-b border-l border-default ${CELL_X} pb-8 pt-16 text-center text-12 font-bold text-default`}
                  >
                    <span className="flex flex-col gap-2">
                      {group.header}
                      {TARGETS[group.id] ? (
                        <span className="text-10 font-regular text-caption">
                          target {TARGETS[group.id]}%
                        </span>
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="bg-neutral-white">
                {GROUPS.map((group) => (
                  <Fragment key={group.id}>
                    <th
                      className={`border-b border-l border-default ${CELL_X} pb-12 text-center text-12 font-regular text-caption`}
                    >
                      {group.totalLabel}
                    </th>
                    <th
                      className={`border-b border-default ${CELL_X} pb-12 text-center text-12 font-regular text-caption`}
                    >
                      Terbayar
                    </th>
                    <th
                      className={`border-b border-default ${CELL_X} pb-12 text-center text-12 font-regular text-caption`}
                    >
                      Rate
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {bps.length === 0 ? (
                <tr>
                  <td colSpan={COLSPAN} className="px-16 py-24 text-center text-12 text-caption">
                    Tidak ada BP yang cocok dengan filter ini.
                  </td>
                </tr>
              ) : null}
              {bps.map((bp) => (
                <tr key={bp.id} className="border-b border-default align-middle">
                  <td className={`${CELL_X} py-16`}>
                    <span className="flex min-w-0 flex-col gap-4">
                      <span className="text-14 font-bold text-default">{bp.name}</span>
                      <span className="text-12 text-caption">{bp.majelis} majelis</span>
                    </span>
                  </td>
                  {GROUPS.map((group) => {
                    const bucket = bp[group.id]
                    return (
                      <Fragment key={group.id}>
                        <td
                          className={`border-l border-default ${CELL_X} py-16 text-center text-14 text-caption`}
                        >
                          {bucket.total}
                        </td>
                        <td
                          className={`${CELL_X} py-16 text-center text-14 font-bold text-default`}
                        >
                          {bucket.paid}
                        </td>
                        <td className={`${CELL_X} py-16 text-center text-14`}>
                          <Rate bucket={bucket} band={group.id} />
                        </td>
                      </Fragment>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
