'use client'

// The Performa page. Which cut of Pembayaran it draws comes from the STATES
// panel beside the device (see lib/demo.ts), not from a control inside the
// prototype — a switch that exists only to demo the design does not belong in
// the design.

import { BranchSummaryPage } from '../lib/branch-summary-page'
import { RepaymentGrid } from '../lib/repayment-grid'
import { RepaymentTable } from '../lib/repayment-table'
import { useState } from 'react'
import { useApp } from '../lib/store'
import type { Unit } from '../lib/data'

export function BranchSummaryScreen() {
  const { variant } = useApp()
  // Which unit the page reads in. Local state: it is a way of looking at the
  // page, not a value that has to survive leaving it.
  const [unit, setUnit] = useState<Unit>('pinjaman')

  return (
    <BranchSummaryPage
      unit={unit}
      onUnitChange={setUnit}
      pembayaran={
        variant === 'mvp' ? <RepaymentTable unit={unit} /> : <RepaymentGrid unit={unit} />
      }
    />
  )
}
