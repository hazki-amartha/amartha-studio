// The day's completed activity — what the BP has already done today, summarised
// in the context box under the Sales hari ini header. Two short demo lists (a
// handful of rows each, per §3) standing in for the real activity log.

export interface DoneFollowUp {
  name: string
  /** The outcome the BP recorded. */
  outcome: string
  time: string
}

export interface DoneDisbursement {
  name: string
  majelis: string
  amount: string
  time: string
}

/** The day's targets, for the "N dari M" progress on the summary banner. */
export const FOLLOWUP_TARGET = 7
export const DISBURSEMENT_TARGET = 4

export const TODAY_FOLLOWUPS: DoneFollowUp[] = [
  { name: 'Dewi Anggraeni', outcome: 'Tertarik — lanjut ke pendaftaran', time: '09.15' },
  { name: 'Sri Mulyani', outcome: 'Masih ragu — dijadwalkan ulang', time: '10.40' },
  { name: 'Yuyun Wahyuni', outcome: 'Belum berminat — follow up bulan depan', time: '11.05' },
]

export const TODAY_DISBURSEMENTS: DoneDisbursement[] = [
  { name: 'Rohaya', majelis: 'Majelis Mawar', amount: 'Rp2.000.000', time: '08.30' },
  { name: 'Imas Kurniasih', majelis: 'Majelis Kenanga', amount: 'Rp3.500.000', time: '13.20' },
]
