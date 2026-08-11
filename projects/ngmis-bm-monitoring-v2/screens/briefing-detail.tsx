'use client'

// A submitted briefing, read-only: the same layout as filling one in (scorecard
// on the left, the action panel on the right) but with every control disabled.
// Which briefing to show comes from the store; a direct visit falls back to
// today's morning briefing.

import { BriefingForm } from '../lib/briefing-form'
import { REPORT_DATE } from '../lib/data'
import { useFlowState } from '../lib/store'

export function BriefingDetailScreen() {
  const { viewing } = useFlowState()
  return (
    <BriefingForm
      kind={viewing?.kind ?? 'morning'}
      date={viewing?.date ?? REPORT_DATE}
      own={viewing?.own ?? true}
      readOnly
    />
  )
}
