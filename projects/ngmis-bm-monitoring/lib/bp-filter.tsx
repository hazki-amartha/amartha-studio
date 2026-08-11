'use client'

// The filter row above the BP table, shared by both variations so the control
// cannot drift between them.
//
// Two selects rather than one: a name and a target status are different
// questions, and folding them into a single dropdown made "Belum capai target"
// sit among the names as though it were one of them.

import { useState, type ReactNode } from 'react'
import { Select } from './ui'
import { REPAYMENT_BPS, targetsMet, type RepaymentBp } from './data'

const ALL = 'all'

const NAMES = [
  { value: ALL, label: 'Nama BP' },
  ...REPAYMENT_BPS.map((bp) => ({ value: bp.id, label: bp.name })),
]

const STATUS = [
  { value: ALL, label: 'Status target' },
  { value: 'missing', label: 'Belum capai target' },
  { value: 'meeting', label: 'Capai semua target' },
]

export function useBpFilter(): { bps: RepaymentBp[]; control: ReactNode } {
  const [name, setName] = useState(ALL)
  const [status, setStatus] = useState(ALL)

  const bps = REPAYMENT_BPS.filter((bp) => {
    if (name !== ALL && bp.id !== name) return false
    if (status === ALL) return true
    const { met, total } = targetsMet(bp)
    return status === 'meeting' ? met === total : met < total
  })

  const control = (
    <div className="flex flex-wrap items-center gap-8">
      <Select label="Nama BP" value={name} onChange={setName} options={NAMES} />
      <Select label="Status target" value={status} onChange={setStatus} options={STATUS} />
    </div>
  )

  return { bps, control }
}
