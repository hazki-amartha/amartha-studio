'use client'

// The Performa page. Which cut of Pembayaran it draws comes from the STATES
// panel beside the device (see lib/demo.ts), not from a control inside the
// prototype — a switch that exists only to demo the design does not belong in
// the design.

import { BranchSummaryPage } from '../lib/branch-summary-page'
import { RepaymentGrid } from '../lib/repayment-grid'
import { RepaymentTable } from '../lib/repayment-table'
import { useVariant } from '../lib/store'

export function BranchSummaryScreen() {
  const variant = useVariant()
  return (
    <BranchSummaryPage pembayaran={variant === 'mvp' ? <RepaymentTable /> : <RepaymentGrid />} />
  )
}
