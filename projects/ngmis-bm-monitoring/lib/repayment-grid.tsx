'use client'

// Pembayaran — the end state.
//
// Same figures as the MVP, read differently:
//
//   the rate leads, coloured against target → where is it bad
//   an action for every BP who is missing   → what to do about it
//
// Five columns of coloured rates read DOWN as well as across: if DPD 0 is red
// for everyone, that is a branch problem and no amount of per-BP coaching fixes
// it. A sixteen-column table of counts cannot show that.
//
// The cost is that exact counts drop under the rate rather than standing as
// their own columns, which is what the MVP keeps.

import { useState } from 'react'
import { Button } from '@/design-system/components'
import { MetricCard, Panel, RatePill, SheetSection, SideSheet } from './ui'
import { useBpFilter } from './bp-filter'
import { store, useApp } from './store'
import {
  REPAYMENT_BPS,
  REPAYMENT_METRICS,
  TARGETS,
  meetsTarget,
  metricOnTarget,
  mitraShortfall,
  rate,
  ACTION_BRIEFS,
  recommendedAction,
  type RepaymentBp,
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

/** BP column, one cell per bucket, plus the action column — used by the
 *  empty row. */
const COLSPAN = 2 + COLUMNS.length

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
      {/* The counts are the substance behind the rate, so they read at body
          size rather than as a footnote — and the paid figure carries the
          weight, since that is the one that moves week to week. */}
      <span className="text-12 text-caption">
        <span className="font-bold text-default">{bucket.paid}</span>/{bucket.total}
      </span>
      {ok === false && short ? (
        <span className="text-10 text-red-600">kurang {short} mitra</span>
      ) : null}
    </span>
  )
}

/**
 * What to do about this BP. Nothing is drawn for a BP clearing every standard:
 * an action on every row would bury the ones that actually need it, which is
 * the whole job of this column.
 */
function ActionCell({
  bp,
  scheduledFor,
  onOpen,
}: {
  bp: RepaymentBp
  /** Set once a task has been created for this BP. */
  scheduledFor?: string
  onOpen: () => void
}) {
  const action = recommendedAction(bp)
  if (!action) return <span className="text-12 text-caption">—</span>

  // Booked: the cell stops offering the action and reports it instead, so a BM
  // scanning the column can tell at a glance who is already covered.
  if (scheduledFor) {
    return (
      <span className="flex flex-col items-start gap-2">
        <span className="text-12 font-bold text-green-600">{action.label} dijadwalkan</span>
        <span className="text-10 text-caption">{scheduledFor}</span>
      </span>
    )
  }

  return (
    <span className="flex flex-col items-start gap-4">
      <Button variant="outline" size="sm" onClick={onOpen}>
        {action.label}
      </Button>
      <span className="text-10 text-caption">{action.reason}</span>
    </span>
  )
}

/**
 * The brief for one BP's action. Scoped to a single BP on purpose: the task is
 * assigned from her row, so widening it to "every red BP" here would send a
 * task the BM did not ask for.
 */
function ActionSheet({ bp, onClose }: { bp: RepaymentBp; onClose: () => void }) {
  const action = recommendedAction(bp)
  if (!action) return null
  const brief = ACTION_BRIEFS[action.id]

  return (
    <SideSheet
      title={brief.title}
      description="Untuk 1 BP yang belum capai target."
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => {
              store.scheduleTask(bp.id, brief.scheduledFor)
              onClose()
            }}
          >
            Buat tugas
          </Button>
        </>
      }
    >
      <SheetSection label="Untuk siapa">
        <span className="text-14 font-bold text-default">{bp.name}</span>
      </SheetSection>

      <SheetSection label="Apa yang dilakukan">
        <span className="text-14 text-default">{brief.what}</span>
      </SheetSection>

      <SheetSection label="Kapan">
        <span className="text-14 text-default">{brief.when}</span>
      </SheetSection>

      <SheetSection label="Bukti yang dikirim">
        <ul className="flex flex-col gap-4">
          {brief.evidence.map((item) => (
            <li key={item} className="flex items-start gap-8 text-14 text-default">
              <span className="pt-8 text-link">
                <span className="block size-4 rounded-full bg-primary-500" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </SheetSection>

      <SheetSection label="Kalau tidak dikerjakan">
        <span className="text-14 text-default">{brief.ifNotDone}</span>
      </SheetSection>
    </SideSheet>
  )
}

export function RepaymentGrid() {
  const { bps, control } = useBpFilter()
  const [openBp, setOpenBp] = useState<RepaymentBp | null>(null)
  const { scheduled } = useApp()

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
                      {TARGETS[col.id] ? (
                        <span className="text-10 font-regular text-caption">
                          target {TARGETS[col.id]}%
                        </span>
                      ) : null}
                    </span>
                  </th>
                ))}
                <th className="border-b border-l border-default px-16 pb-12 pt-16 text-12 font-bold text-default">
                  Aksi
                </th>
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
                  <td className="border-l border-default px-16 py-12">
                    <ActionCell
                      bp={bp}
                      scheduledFor={scheduled[bp.id]}
                      onOpen={() => setOpenBp(bp)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {openBp ? <ActionSheet bp={openBp} onClose={() => setOpenBp(null)} /> : null}
    </>
  )
}
