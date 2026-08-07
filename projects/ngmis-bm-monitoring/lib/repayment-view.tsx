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

/** The oldest bucket gets a standing tint — it is the money that hurts most. */
const OLDEST = 'dpd90'
const OLDEST_TINT = 'bg-red-50'

/** How far down the list still counts as "needs attention". */
const FLAGGED_ROWS = 3

function Paid({ bucket, band }: { bucket: Bucket; band: string }) {
  const pct = rate(bucket)
  const { good, fair } = RATE_BANDS[band]
  const tone = pct >= good ? 'text-green-600' : pct >= fair ? 'text-yellow-700' : 'text-red-600'
  return <span className={`font-bold ${tone}`}>{bucket.paid}</span>
}

function Rank({ n }: { n: number }) {
  const flagged = n <= FLAGGED_ROWS
  return (
    <span
      className={`flex size-24 shrink-0 items-center justify-center rounded-6 text-12 font-bold ${
        flagged ? 'bg-red-500 text-neutral-white' : 'bg-neutral-200 text-caption'
      }`}
    >
      {n}
    </span>
  )
}

export function RepaymentView() {
  return (
    <Panel className="p-0">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-50">
              <th
                rowSpan={2}
                className="border-b border-default px-16 py-12 text-12 font-bold text-default"
              >
                BP
              </th>
              {GROUPS.map((group) => (
                <th
                  key={group.id}
                  colSpan={2}
                  className={`border-b border-l border-default px-12 pt-12 text-center text-12 font-bold text-default ${
                    group.id === OLDEST ? OLDEST_TINT : ''
                  }`}
                >
                  {group.header}
                </th>
              ))}
            </tr>
            <tr className="bg-neutral-50">
              {GROUPS.map((group) => (
                <Fragment key={group.id}>
                  <th
                    className={`border-b border-l border-default px-12 pb-12 text-center text-12 font-regular text-caption ${
                      group.id === OLDEST ? OLDEST_TINT : ''
                    }`}
                  >
                    {group.totalLabel}
                  </th>
                  <th
                    className={`border-b border-default px-12 pb-12 text-center text-12 font-regular text-caption ${
                      group.id === OLDEST ? OLDEST_TINT : ''
                    }`}
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
                <td className="px-16 py-12">
                  <span className="flex items-start gap-12">
                    <Rank n={i + 1} />
                    <span className="flex min-w-0 flex-col gap-2">
                      <span className="text-14 font-bold text-default">{bp.name}</span>
                      <span className="text-12 text-caption">{bp.majelis} majelis</span>
                    </span>
                  </span>
                </td>
                {GROUPS.map((group) => {
                  const bucket = bp[group.id]
                  const tint = group.id === OLDEST ? OLDEST_TINT : ''
                  return (
                    <Fragment key={group.id}>
                      <td
                        className={`border-l border-default px-12 py-12 text-center text-14 text-caption ${tint}`}
                      >
                        {bucket.total}
                      </td>
                      <td className={`px-12 py-12 text-center text-14 ${tint}`}>
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
