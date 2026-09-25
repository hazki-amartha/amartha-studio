'use client'

// The reason and janji-bayar lists shared by the collect menu's three detail
// pages (Minggu ini saja, Jumlah lain, Tidak bayar). They live here rather than
// in one screen because all three record the same field from the same fixed
// vocabulary, and a second copy is a second list ops has to reconcile.

// Field-realistic reasons. Free text is deliberately absent: the BP is standing
// in front of her on a motorbike schedule, not writing a report — and a fixed
// list is the only version ops can count.
export const REASONS = [
  'Ada kebutuhan mendesak',
  'Usaha sedang sepi',
  'Usaha bangkrut',
  'Penanggung jawab kena PHK',
  'Sakit',
  'Meninggal dunia',
  'Sudah bayar sendiri via Poket/metode lain',
  'Lainnya',
]

/**
 * The refusal that is not one: she already paid through Poket or another
 * channel. Nothing is left to chase, so it skips the janji bayar step.
 */
export const PAID_ELSEWHERE = 'Sudah bayar sendiri via Poket/metode lain'

// Why she handed over less than the bill ("Alasan bayar sebagian"). The
// refusal list minus "sudah bayar sendiri" — a woman handing over cash today
// did not pay somewhere else.
export const SHORTFALL_REASONS = [
  'Ada kebutuhan mendesak',
  'Usaha sedang sepi',
  'Usaha bangkrut',
  'Penanggung jawab kena PHK',
  'Sakit',
  'Meninggal dunia',
  'Lainnya',
]

/** The refusal that ends the loan rather than delaying it: asks for a date. */
export const DECEASED = 'Meninggal dunia'

/** The option that opens a free-text box under a reason list. */
export const OTHER = 'Lainnya'

/** "Lainnya" + her words, as one stored reason: "Lainnya: …". */
export function joinOther(pick: string | null, text: string): string | null {
  if (pick === null) return null
  return pick === OTHER ? `${OTHER}: ${text.trim()}` : pick
}

/** The reverse, for reopening a recorded reason into the list + text box. */
export function splitOther(stored: string | null | undefined): { pick: string | null; text: string } {
  if (!stored) return { pick: null, text: '' }
  if (stored.startsWith(`${OTHER}: `)) return { pick: OTHER, text: stored.slice(OTHER.length + 2) }
  return { pick: stored, text: '' }
}

/** A reason is complete once picked — and, for "Lainnya", once written. */
export function reasonDone(pick: string | null, text: string): boolean {
  return pick !== null && (pick !== OTHER || text.trim() !== '')
}

// Why she is leaving the program. "Meninggal dunia" and "pindah tanpa kabar"
// are the two that open a case ops has to pick up rather than a promise to
// chase — which is the whole reason a drop-out is its own outcome and not a
// heavier "tidak bayar". Shared by the majelis collect menu and the home visit,
// which record the same fact from the same list.
export const DROPOUT_REASONS = [
  'Usaha bangkrut',
  'Pindah tanpa kabar',
  'Menolak melanjutkan',
  'Meninggal dunia',
]

// Discrete options rather than a date picker: a BP negotiates a rough date at
// the majelis, and "no promise at all" has to be expressible. The list follows
// the BP APP 2026 Figma ("Janji bayar — Pilih tanggal").
export const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Hari ini', value: 'hari ini' },
  { label: 'Rabu, 22 Juli (besok)', value: '22 Juli' },
  { label: 'Kamis, 23 Juli', value: '23 Juli' },
  { label: 'Jumat, 24 Juli', value: '24 Juli' },
  { label: 'Selasa, 28 Juli (minggu depan)', value: '28 Juli' },
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
