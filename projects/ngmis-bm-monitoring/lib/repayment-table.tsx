'use client'

// Pembayaran — the MVP.
//
// Every bucket carries three figures: how many mitra sit in it, how many paid,
// and the rate between them. Counts alone are not comparable across BPs — a
// small book and a large one produce very different Terbayar numbers at the
// same performance — so the rate is stated rather than left to the reader.
//
// Only the rate wears colour, and only where a standard exists. The counts are
// facts; the rate is the judgement. DPD 90+ has no target at all, so it shows
// its two counts and stops — a Rate column there would invite a verdict nobody
// is held to.

import { Fragment } from 'react'
import { MetricCard, Panel, RatePill } from './ui'
import { useBpFilter } from './bp-filter'
import {
  REPAYMENT_BPS,
  REPAYMENT_METRICS,
  meetsTarget,
  metricOnTarget,
  rate,
  type Bucket,
} from './data'

/** `rated` is what separates DPD 90+ from the rest: no standard, so no Rate
 *  column and no verdict. */
const GROUPS = [
  { id: 'mitra', header: 'Total mitra', rated: true },
  { id: 'dpd0', header: 'DPD 0', rated: true },
  { id: 'dpd130', header: 'DPD 1-30', rated: true },
  { id: 'dpd3190', header: 'DPD 31-90', rated: true },
  { id: 'dpd90', header: 'DPD 90+', rated: false },
] as const

const cols = (g: (typeof GROUPS)[number]) => (g.rated ? 3 : 2)
const COLSPAN = 1 + GROUPS.reduce((n, g) => n + cols(g), 0)

function Rate({ bucket, band }: { bucket: Bucket; band: string }) {
  return (
    <RatePill ok={meetsTarget(bucket, band)}>
      {`${rate(bucket).toFixed(1).replace('.', ',').replace(',0', '')}%`}
    </RatePill>
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

      <Panel className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-16 p-16">
          <span className="text-16 font-bold text-default">Performa BP</span>
          {control}
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-200">
                <th
                  rowSpan={2}
                  className="px-16 pb-12 pt-16 text-12 font-bold text-default"
                  style={{ width: 140 }}
                >
                  Nama
                </th>
                {GROUPS.map((group) => (
                  <th
                    key={group.id}
                    colSpan={cols(group)}
                    className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                  >
                    {group.header}
                  </th>
                ))}
              </tr>
              <tr className="bg-neutral-200">
                {GROUPS.map((group) => (
                  <Fragment key={group.id}>
                    <th className="border-l border-default px-12 pb-12 text-center text-12 font-regular text-caption">
                      Aktif
                    </th>
                    <th className="px-12 pb-12 text-center text-12 font-regular text-caption">
                      Terbayar
                    </th>
                    {group.rated ? (
                      <th className="px-12 pb-12 text-center text-12 font-regular text-caption">
                        Rate
                      </th>
                    ) : null}
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
              {bps.map((bp, i) => (
                <tr
                  key={bp.id}
                  // Zebra striping, so the eye can track a row across sixteen
                  // columns without losing its line.
                  className={`align-middle ${i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'}`}
                >
                  <td className="px-16 py-16 text-14 text-default">{bp.name}</td>
                  {GROUPS.map((group) => {
                    const bucket = bp[group.id]
                    return (
                      <Fragment key={group.id}>
                        <td className="border-l border-default px-12 py-16 text-center text-14 text-default">
                          {bucket.total}
                        </td>
                        <td className="px-12 py-16 text-center text-14 text-default">
                          {bucket.paid}
                        </td>
                        {group.rated ? (
                          <td className="px-12 py-16 text-center">
                            <Rate bucket={bucket} band={group.id} />
                          </td>
                        ) : null}
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
