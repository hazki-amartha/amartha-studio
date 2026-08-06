'use client'

// The Business Partners the BM manages — the axis this direction adds.
//
// A BP carries majelis; a majelis carries mitra. So the BP is authored ONCE
// here and attached to the majelis in `schedule.ts`, and every mitra inherits
// hers from the group she is in. Two lists of "who owns this woman" is how a
// directory ends up disagreeing with itself.

export interface BusinessPartner {
  id: string
  name: string
  /** Her BP number — what the branch actually files her under. */
  code: string
}

/**
 * The seven she runs. The names are the ones on the briefing's roll call in the
 * reference — that list IS the branch, so the directory filter and the absensi
 * read off the same seven rather than off two hand-kept lists.
 */
export const BUSINESS_PARTNERS: BusinessPartner[] = [
  { id: 'bp1', name: 'Sari Handayani', code: 'BP-10482' },
  { id: 'bp2', name: 'Rina Marlina', code: 'BP-10517' },
  { id: 'bp3', name: 'Ani Suryani', code: 'BP-10603' },
  { id: 'bp4', name: 'Dewi Lestari', code: 'BP-10644' },
  { id: 'bp5', name: 'Siti Aminah', code: 'BP-10709' },
  { id: 'bp6', name: 'Yanti Rohayati', code: 'BP-10755' },
  { id: 'bp7', name: 'Eni Nuraeni', code: 'BP-10812' },
]

export const findBP = (id: string): BusinessPartner =>
  BUSINESS_PARTNERS.find((bp) => bp.id === id) ?? BUSINESS_PARTNERS[0]

/**
 * How a BP is printed on a card: plain caption text directly under the majelis
 * or mitra name, in the same slot on both. One component, so the two cards
 * cannot drift on how the same fact reads.
 *
 * It was a grey pill. It went back to text because a badge is for something
 * that CHANGES — a status, a bucket — and whose book a group is on is a
 * standing fact; among the real badges on these cards it read as a third state.
 */
export function BpLine({ bpId }: { bpId: string }) {
  const bp = findBP(bpId)
  return <span className="truncate text-12 text-caption">BP · {bp.name}</span>
}
