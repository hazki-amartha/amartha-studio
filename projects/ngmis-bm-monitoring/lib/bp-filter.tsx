'use client'

// The BP filter above the table, shared by both variations so the control
// cannot drift between them.
//
// It filters on the one thing the page is for: whether a BP is clearing the
// biz team's standards. Filtering by name would just be a slower way to use
// your eyes on ten rows.

import { useState, type ReactNode } from 'react'
import { Select } from './ui'
import { REPAYMENT_BPS, targetsMet, type RepaymentBp } from './data'

export const BP_TARGET_FILTERS = [
  { value: 'all', label: 'Semua BP' },
  { value: 'missing', label: 'Belum capai target' },
  { value: 'meeting', label: 'Capai semua target' },
]

export function useBpFilter(): { bps: RepaymentBp[]; control: ReactNode } {
  const [value, setValue] = useState('all')

  const bps = REPAYMENT_BPS.filter((bp) => {
    if (value === 'all') return true
    const { met, total } = targetsMet(bp)
    return value === 'meeting' ? met === total : met < total
  })

  const control = (
    <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
      <span className="text-12 text-caption">
        {bps.length} dari {REPAYMENT_BPS.length} BP
      </span>
      <Select label="Filter BP" value={value} onChange={setValue} options={BP_TARGET_FILTERS} />
    </div>
  )

  return { bps, control }
}
