'use client'

// The Repayment tab: one table, nothing else.
//
// A row per BP, ranked worst first, with each ageing bucket carrying its total
// and how much of it was paid. The Terbayar figures are the read — they colour
// themselves against a benchmark for their own bucket, because collecting
// little on DPD 90+ is normal and a flat threshold would paint that column red
// on every row and leave no signal at all.
//
// DPD 90+ is tinted as a column and the top three rows as rows, so the two
// things a BM looks for — the oldest money, and who is furthest behind — are
// findable before reading a single number.

import { Fragment } from 'react'
import { Panel } from './ui'
import { RATE_BANDS, REPAYMENT_BPS, rate, type Bucket, type RepaymentBp } from './data'

const GROUPS = [
  { id: 'loans', header: 'Total Loan', totalLabel: 'Aktif' },
  { id: 'dpd0', header: 'DPD 0', totalLabel: 'Total' },
  { id: 'dpd130', header: 'DPD 1-30', totalLabel: 'Total' },
  { id: 'dpd3190', header: 'DPD 31-90', totalLabel: 'Total' },
  { id: 'dpd90', header: 'DPD 90+', totalLabel: 'Total' },
] as const

/** How far down the list still counts as "needs attention". */
const FLAGGED_ROWS = 3

/** One spacing rule for every cell in the table, so column edges line up down
 *  the whole grid rather than each band setting its own inset. */
const CELL_X = 'px-16'

/**
 * A "Terbayar" figure, scored against a benchmark for its own bucket. A bucket
 * with no band is not scored at all: DPD 90+ collects a little from almost
 * nobody, so grading it paints the whole column one colour and says nothing.
 */
function Paid({ bucket, band }: { bucket: Bucket; band: string }) {
  const scale = RATE_BANDS[band]
  if (!scale) return <span className="font-bold text-default">{bucket.paid}</span>
  const pct = rate(bucket)
  const tone =
    pct >= scale.good ? 'text-green-600' : pct >= scale.fair ? 'text-yellow-700' : 'text-red-600'
  return <span className={`font-bold ${tone}`}>{bucket.paid}</span>
}

export function RepaymentView() {
  return (
    <Panel className="p-0">
      {/* The table runs edge to edge in a p-0 Panel, so its square corners have
          to be clipped back to the card's radius. */}
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
                  colSpan={2}
                  className={`border-b border-l border-default ${CELL_X} pb-8 pt-16 text-center text-12 font-bold text-default`}
                >
                  {group.header}
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
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPAYMENT_BPS.map((bp, i) => (
              <tr
                key={bp.id}
                className={`border-b border-default align-middle ${
                  i < FLAGGED_ROWS ? 'bg-orange-50' : ''
                }`}
              >
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
                      <td className={`${CELL_X} py-16 text-center text-14`}>
                        <Paid bucket={bucket} band={group.id} />
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
  )
}

export type { RepaymentBp }
