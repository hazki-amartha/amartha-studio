'use client'

// Pembayaran — the end state.
//
// Same figures as the MVP, three things added, each answering a question the
// MVP leaves open:
//
//   the rate leads, coloured against target → where is it bad
//   the branch rate under every column       → is this BP off, or everyone
//   the branch's weakest bucket, called out  → what to fix first
//
// The last two are the reason for the grid shape. Five columns of coloured
// rates read DOWN as well as across: if DPD 0 is red for everyone, that is a
// branch problem and no amount of per-BP coaching fixes it. A sixteen-column
// table of counts cannot show that.
//
// The cost is that exact counts drop to small text under the rate, which is
// precisely what the MVP keeps at full size.

import { MetricCard, Panel, RatePill } from './ui'
import { useBpFilter } from './bp-filter'
import {
  REPAYMENT_BPS,
  REPAYMENT_METRICS,
  TARGETS,
  branchRate,
  meetsTarget,
  metricOnTarget,
  mitraShortfall,
  rate,
  weakestBucket,
  type Bucket,
} from './data'

const COLUMNS = [
  { id: 'mitra', header: 'Total Mitra' },
  { id: 'dpd0', header: 'DPD 0' },
  { id: 'dpd130', header: 'DPD 1-30' },
  { id: 'dpd3190', header: 'DPD 31-90' },
  { id: 'dpd90', header: 'DPD 90+' },
] as const

const fmt = (n: number) => n.toFixed(1).replace('.', ',')

/** BP column plus one cell per bucket — used by the empty row. */
const COLSPAN = 1 + COLUMNS.length

/**
 * A rate cell, read against the biz team's standard. The question is binary —
 * meeting the target or not — so the colour is binary too, and how far off it
 * is carried by the shortfall line in mitra beneath.
 *
 * A bucket with no standard stays neutral: Total Mitra is an aggregate and
 * nobody is held to a figure on DPD 90+, so a verdict there would be invented.
 */
function RateCell({ bucket, band }: { bucket: Bucket; band: string }) {
  const pct = rate(bucket)
  const ok = meetsTarget(bucket, band)
  const short = mitraShortfall(bucket, band)
  return (
    <span className="flex flex-col items-center gap-4">
      <RatePill ok={ok}>{`${fmt(pct)}%`}</RatePill>
      <span className="text-10 text-caption">
        {bucket.paid}/{bucket.total}
      </span>
      {ok === false && short ? (
        <span className="text-10 text-red-600">kurang {short} mitra</span>
      ) : null}
    </span>
  )
}

export function RepaymentGrid() {
  const { bps, control } = useBpFilter()
  const weakest = weakestBucket()
  const weakestLabel = COLUMNS.find((c) => c.id === weakest.id)?.header ?? weakest.id

  return (
    <>
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

      {/* Reading down the columns, not across the rows. */}
      <div className="pb-16">
        <Panel>
          <div className="flex flex-col gap-4">
            <span className="text-14 font-bold text-default">
              Bucket paling tertinggal: {weakestLabel} — {fmt(weakest.pct)}% se-cabang, target{' '}
              {weakest.target}%
            </span>
            <span className="text-12 text-caption">
              Berlaku untuk hampir semua BP, jadi ini soal cabang, bukan soal satu orang.
            </span>
          </div>
        </Panel>
      </div>

      {control}

      <Panel className="p-0">
        <div className="min-w-0 overflow-hidden rounded-12">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-white">
                <th className="border-b border-default px-16 pb-12 pt-16 text-12 font-bold text-default">
                  BP
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className="border-b border-l border-default px-16 pb-12 pt-16 text-center text-12 font-bold text-default"
                  >
                    <span className="flex flex-col gap-2">
                      {col.header}
                      <span className="text-10 font-regular text-caption">
                        {TARGETS[col.id] ? `target ${TARGETS[col.id]}% · ` : ''}se-cabang{' '}
                        {fmt(branchRate(col.id))}%
                      </span>
                    </span>
                  </th>
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
                  <td className="px-16 py-12">
                    <span className="flex min-w-0 flex-col gap-4">
                      <span className="text-14 font-bold text-default">{bp.name}</span>
                      <span className="text-12 text-caption">{bp.majelis} majelis</span>
                    </span>
                  </td>
                  {COLUMNS.map((col) => (
                    <td key={col.id} className="border-l border-default px-12 py-12">
                      <RateCell bucket={bp[col.id]} band={col.id} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
