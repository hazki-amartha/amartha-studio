'use client'

// Pembayaran — the bucket cards and the BP table, shared by both states.
//
// The page reads in two units, switched by the toggle: how many LOANS are
// behind, and how much MONEY is. They are not the same story — a handful of
// large arrears is a rounding error by count and most of the value by rupiah —
// so both are held on every bucket and neither is derived from the other.
//
// Only the rate wears colour, and only where a standard exists. The two figures
// beside it are facts; the rate is the judgement. DPD 90+ has no target, so it
// shows its two figures and stops — a Rate column there would invite a verdict
// nobody is held to.
//
// Both states render this table, so the thing under review is the one column
// that differs: the end state adds Aksi, the MVP does not.

import { Fragment, type ReactNode } from 'react'
import { Button } from '@/design-system/components'
import { DownloadSimple } from '@/design-system/icons'
import { BucketCard, Panel, RatePill, UnitToggle } from './ui'
import {
  BUCKET_ORDER,
  REPAYMENT_BPS,
  TARGETS,
  branchBucket,
  meetsTarget,
  rate,
  rupiah,
  shortfall,
  shortfallLabel,
  type Bucket,
  type RepaymentBp,
  type Unit,
} from './data'

/** The two readings, in switch order: off is Jumlah pinjaman, on is Nominal. */
export const UNITS = {
  pinjaman: { id: 'pinjaman', label: 'Jumlah pinjaman' },
  rupiah: { id: 'rupiah', label: 'Nominal (Rp)' },
} as const

/** `rated` marks the buckets that carry a standard and so earn a Rate column.
 *  Total pinjaman is an aggregate of the four buckets and DPD 90+ has no
 *  target, so neither gets one — a rate there would invite a verdict nobody is
 *  held to. */
const GROUPS = [
  { id: 'total', header: 'Total pinjaman', rated: false },
  { id: 'dpd0', header: 'DPD 0', rated: true },
  { id: 'dpd130', header: 'DPD 1-30', rated: true },
  { id: 'dpd3190', header: 'DPD 31-90', rated: true },
  { id: 'dpd90', header: 'DPD 90+', rated: false },
] as const

const cols = (g: (typeof GROUPS)[number]) => (g.rated ? 3 : 2)

/** The first two columns are labelled by unit: "Aktif / Terbayar" and
 *  "Total due / Total paid" are the same two facts said in different money. */
const SUB = {
  pinjaman: ['Aktif', 'Terbayar'],
  rupiah: ['Total due', 'Total paid'],
} as const

const whole = (b: Bucket, u: Unit) => (u === 'rupiah' ? b.due : b.total)
const part = (b: Bucket, u: Unit) => (u === 'rupiah' ? b.dibayar : b.paid)
// Both units group thousands: 1.972 loans and Rp121.885.867 read the same way.
const show = (n: number, u: Unit) => rupiah(n)

function Rate({ bucket, band, unit }: { bucket: Bucket; band: string; unit: Unit }) {
  return (
    <RatePill ok={meetsTarget(bucket, band, unit)}>
      {`${rate(bucket, unit).toFixed(1).replace('.', ',').replace(',0', '')}%`}
    </RatePill>
  )
}

/**
 * The branch headline: how big each ageing bucket is.
 *
 * One figure per card, because the cards answer "where is the book sitting"
 * and the table answers "how much of it came in". Two numbers here would just
 * repeat the table's first two columns.
 */
export function RepaymentMetrics({ unit }: { unit: Unit }) {
  return (
    <div className="grid grid-cols-4 gap-16 pb-16">
      {BUCKET_ORDER.map((b) => {
        const bucket = branchBucket(b.id)
        return (
          <BucketCard
            key={b.id}
            label={b.label}
            intent={b.intent}
            value={show(whole(bucket, unit), unit)}
            prefix={unit === 'rupiah' ? 'Rp' : undefined}
            caption={unit === 'rupiah' ? 'Total nilai aktif' : 'Total pinjaman aktif'}
          />
        )
      })}
    </div>
  )
}

/** The strip above the table: title left, unit toggle and Download right. */
export function TableHeading({
  unit,
  onUnitChange,
}: {
  unit: Unit
  onUnitChange: (u: Unit) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
      <span className="text-16 font-bold text-default">Performa BP</span>
      <div className="flex items-center gap-8">
        <UnitToggle
          off={UNITS.pinjaman}
          on={UNITS.rupiah}
          value={unit}
          onChange={(id) => onUnitChange(id as Unit)}
        />
        <Button variant="outline" size="sm" onClick={() => undefined}>
          <span className="flex items-center gap-8">
            <DownloadSimple size={16} />
            Download
          </span>
        </Button>
      </div>
    </div>
  )
}

export function BpTable({
  unit,
  action,
}: {
  unit: Unit
  /** The end state's extra column. Omitted entirely by the MVP rather than
   *  rendered empty, so the two tables differ in shape and not just content. */
  action?: { header: string; render: (bp: RepaymentBp) => ReactNode }
}) {
  return (
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
                  colSpan={cols(group)}
                  className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                >
                  <span className="flex flex-col gap-2">
                    {group.header}
                    {/* Only where a standard exists — Total pinjaman is an
                        aggregate and DPD 90+ carries no target, so a line there
                        would be inventing one. */}
                    {TARGETS[group.id] ? (
                      <span className="text-12 font-regular text-caption">
                        Target {TARGETS[group.id]}%
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
              {action ? (
                <th
                  rowSpan={2}
                  className="border-l border-default px-16 pb-12 pt-16 text-12 font-bold text-default"
                >
                  {action.header}
                </th>
              ) : null}
            </tr>
            <tr className="bg-neutral-200">
              {GROUPS.map((group) => (
                <Fragment key={group.id}>
                  <th className="border-l border-default px-12 pb-12 text-center text-12 font-regular text-caption">
                    {SUB[unit][0]}
                  </th>
                  <th className="px-12 pb-12 text-center text-12 font-regular text-caption">
                    {SUB[unit][1]}
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
            {REPAYMENT_BPS.map((bp, i) => {
              // Zebra striping, so the eye can track a row across sixteen
              // columns without losing its line. Each BP is two table rows —
              // the figures, then the shortfall centred beneath its whole
              // group — so they share a background and only the second carries
              // the dividing border.
              const zebra = i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'
              return (
                <Fragment key={bp.id}>
                  <tr className={`align-middle ${zebra}`}>
                    <td rowSpan={2} className="px-16 text-14 text-default">
                      {bp.name}
                    </td>
                    {GROUPS.map((group) => {
                      const bucket = bp[group.id]
                      return (
                        <Fragment key={group.id}>
                          <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
                            {show(whole(bucket, unit), unit)}
                          </td>
                          <td className="px-12 pt-16 text-center text-14 text-default">
                            {show(part(bucket, unit), unit)}
                          </td>
                          {group.rated ? (
                            <td className="px-12 pt-16 text-center">
                              <Rate bucket={bucket} band={group.id} unit={unit} />
                            </td>
                          ) : null}
                        </Fragment>
                      )
                    })}
                    {action ? (
                      <td rowSpan={2} className="border-l border-default px-16">
                        {action.render(bp)}
                      </td>
                    ) : null}
                  </tr>
                  <tr className={`border-b border-default align-top ${zebra}`}>
                    {GROUPS.map((group) => {
                      const bucket = bp[group.id]
                      const short = shortfall(bucket, group.id, unit)
                      const missing = meetsTarget(bucket, group.id, unit) === false
                      return (
                        <td
                          key={group.id}
                          colSpan={cols(group)}
                          className="border-l border-default px-12 pb-16 pt-4 text-center text-10 text-caption"
                        >
                          {missing && short ? shortfallLabel(short, unit) : null}
                        </td>
                      )
                    })}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function RepaymentTable({ unit }: { unit: Unit }) {
  return (
    <>
      <RepaymentMetrics unit={unit} />
      <BpTable unit={unit} />
    </>
  )
}
