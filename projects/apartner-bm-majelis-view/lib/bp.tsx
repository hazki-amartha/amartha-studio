'use client'

// The Business Partners the BM manages — the axis this direction adds.
//
// A BP carries majelis; a majelis carries mitra. So the BP is authored ONCE
// here and attached to the majelis in `schedule.ts`, and every mitra inherits
// hers from the group she is in. Two lists of "who owns this woman" is how a
// directory ends up disagreeing with itself.

import { Badge } from '@/design-system/components'

export interface BusinessPartner {
  id: string
  name: string
  /** Her BP number — what the branch actually files her under. */
  code: string
}

export const BUSINESS_PARTNERS: BusinessPartner[] = [
  { id: 'bp1', name: 'Siti Rahayu', code: 'BP-10482' },
  { id: 'bp2', name: 'Dewi Lestari', code: 'BP-10517' },
  { id: 'bp3', name: 'Ratna Sari', code: 'BP-10603' },
]

export const findBP = (id: string): BusinessPartner =>
  BUSINESS_PARTNERS.find((bp) => bp.id === id) ?? BUSINESS_PARTNERS[0]

/**
 * How a BP is printed on a card. One component, so the list card and the detail
 * page cannot drift on how the same fact reads.
 *
 * A grey pill rather than a line of prose: on a directory the BM is scanning a
 * column for one name, and a label is something you notice rather than read.
 */
export function BpBadge({ bpId }: { bpId: string }) {
  const bp = findBP(bpId)
  return <Badge intent="neutral">BP · {bp.name}</Badge>
}
