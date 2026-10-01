// The day's completed activity — what the BP has already done today, summarised
// in the context box under the Sales hari ini header. Two short demo lists (a
// handful of rows each, per §3) standing in for the real activity log.

export interface DoneFollowUp {
  name: string
  /** The outcome the BP recorded. */
  outcome: string
  time: string
}

export interface NewProspek {
  name: string
  /** Where she came from — the prospect's source line. */
  source: string
  time: string
}

/** The day's follow-up target, for the "N dari M" progress on the detail page. */
export const FOLLOWUP_TARGET = 7

export const TODAY_FOLLOWUPS: DoneFollowUp[] = [
  { name: 'Dewi Anggraeni', outcome: 'Tertarik — lanjut ke pendaftaran', time: '09.15' },
  { name: 'Sri Mulyani', outcome: 'Masih ragu — dijadwalkan ulang', time: '10.40' },
  { name: 'Yuyun Wahyuni', outcome: 'Belum berminat — follow up bulan depan', time: '11.05' },
]

export const TODAY_PROSPEKS: NewProspek[] = [
  { name: 'Marta Hakim', source: 'Referral · Ibu Yanti (Majelis Kenanga)', time: '08.50' },
  { name: 'Nenden Sari', source: 'Sosialisasi · Pasar Ciseeng', time: '10.10' },
  { name: 'Euis Rohaeti', source: 'Canvassing · Parung', time: '12.30' },
]
