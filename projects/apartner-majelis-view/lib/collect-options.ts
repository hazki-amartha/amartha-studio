'use client'

// The reason and janji-bayar lists shared by the collect menu's three detail
// pages (Minggu ini saja, Jumlah lain, Tidak bayar). They live here rather than
// in one screen because all three record the same field from the same fixed
// vocabulary, and a second copy is a second list ops has to reconcile.

// Field-realistic reasons. Free text is deliberately absent: the BP is standing
// in front of her on a motorbike schedule, not writing a report — and a fixed
// list is the only version ops can count.
export const REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Sedang tidak di tempat',
  'Menolak bayar',
]

// Why she handed over less than the bill. Same list minus "menolak bayar" —
// a woman who paid something did not refuse — plus the two answers that only
// make sense when money did change hands.
export const SHORTFALL_REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Uang belum terkumpul semua',
  'Sisanya menyusul minggu ini',
]

// Discrete options rather than a date picker: a BP negotiates a rough date at
// the majelis, and "no promise at all" has to be expressible.
//
// "Nanti hari ini" leads because it is the most common answer in the room and
// the only one the BP can still act on before she rides home — a mitra fetching
// the rest from the warung is a different plan from one paying next week, and
// without it that promise was being recorded as tomorrow.
export const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Nanti hari ini', value: 'hari ini' },
  { label: 'Besok, 22 Juli', value: '22 Juli' },
  { label: 'Lusa, 23 Juli', value: '23 Juli' },
  { label: 'Minggu depan, 28 Juli', value: '28 Juli' },
  { label: 'Tidak ada janji', value: null },
]

/** The picker label for a stored ptp value. `undefined` = nothing picked yet. */
export function ptpLabelOf(value: string | null | undefined): string | undefined {
  if (value === undefined) return undefined
  return PTP_OPTIONS.find((o) => o.value === value)?.label
}

/** The stored value behind a picked label. */
export function ptpValueOf(label: string): string | null {
  return PTP_OPTIONS.find((o) => o.label === label)?.value ?? null
}
