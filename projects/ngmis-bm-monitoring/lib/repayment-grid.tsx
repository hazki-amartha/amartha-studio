'use client'

// Pembayaran — the end state.
//
// The same figures and the same table as the MVP, plus one column: what the BM
// should do about each BP who is missing a standard. Everything else is held
// identical on purpose, so comparing the two states is a review of that column
// rather than of two different tables.

import { useState } from 'react'
import { Button } from '@/design-system/components'
import { SheetSection, SideSheet } from './ui'
import { BpTable, RepaymentMetrics, TableHeading } from './repayment-table'
import { store, useApp } from './store'
import { ACTION_BRIEFS, recommendedAction, type RepaymentBp, type Unit } from './data'

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

export function RepaymentGrid({
  unit,
  onUnitChange,
}: {
  unit: Unit
  onUnitChange: (u: Unit) => void
}) {
  const [openBp, setOpenBp] = useState<RepaymentBp | null>(null)
  const { scheduled } = useApp()

  return (
    <>
      <RepaymentMetrics unit={unit} />
      <TableHeading unit={unit} onUnitChange={onUnitChange} />

      <BpTable
        unit={unit}
        action={{
          header: 'Aksi',
          render: (bp) => (
            <ActionCell bp={bp} scheduledFor={scheduled[bp.id]} onOpen={() => setOpenBp(bp)} />
          ),
        }}
      />

      {openBp ? <ActionSheet bp={openBp} onClose={() => setOpenBp(null)} /> : null}
    </>
  )
}
