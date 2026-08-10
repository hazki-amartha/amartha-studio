'use client'

// The BP filter above the table, shared by both variations so the control
// cannot drift between them.
//
// It mixes two kinds of choice — how a BP is doing against the standards, and
// which BP by name — so they sit in labelled groups. Flattened into one list
// they read as peers, and "Belum capai target" looks like somebody's name.

import { useState, type ReactNode } from 'react'
import { Select } from './ui'
import { REPAYMENT_BPS, targetsMet, type RepaymentBp } from './data'

const ALL = 'all'
const MISSING = 'missing'
const MEETING = 'meeting'

export function useBpFilter(): { bps: RepaymentBp[]; control: ReactNode } {
  const [value, setValue] = useState(ALL)

  const bps = REPAYMENT_BPS.filter((bp) => {
    if (value === ALL) return true
    if (value === MISSING || value === MEETING) {
      const { met, total } = targetsMet(bp)
      return value === MEETING ? met === total : met < total
    }
    return bp.id === value
  })

  const control = (
    <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
      <span className="text-12 text-caption">
        {bps.length} dari {REPAYMENT_BPS.length} BP
      </span>
      <Select
        label="Filter BP"
        value={value}
        onChange={setValue}
        options={[{ value: ALL, label: 'Semua BP' }]}
        groups={[
          {
            label: 'Status target',
            options: [
              { value: MISSING, label: 'Belum capai target' },
              { value: MEETING, label: 'Capai semua target' },
            ],
          },
          {
            label: 'Nama BP',
            options: REPAYMENT_BPS.map((bp) => ({ value: bp.id, label: bp.name })),
          },
        ]}
      />
    </div>
  )

  return { bps, control }
}
