// Validasi Mitra — the BM's 3-step review of a soft-rejected pengajuan.
//
// Underwriting doesn't only say yes/no: some pengajuan come back "soft
// reject" — the system's automated rules flagged something (usually a debt
// ratio or a thin business history), but the case isn't hopeless. A BM who
// knows the mitra, or her majelis, can look at the full underwriting data and
// decide for herself. This is an existing process; the task on Tugas is what
// makes it visible in the prototype, not a new idea.
//
// One demo case (fixed, not tied to the Sales pipeline's own leads — a soft
// reject is a system/underwriting concern, not a Sales funnel status) carries
// all three steps: the soft-reject notice, the full data, then the decision.

/** One "label — value" pair inside a data section. */
export interface DataRow {
  label: string
  value: string
}

/** One section of the underwriting data (step 2) — a title plus its rows. */
export interface DataSection {
  title: string
  rows: DataRow[]
}

export const SOFT_REJECT_CASE = {
  name: 'Anik Susilowati',
  majelisName: 'Majelis Melati',
  product: 'GL' as const,
  amount: 'Rp2.000.000',
  /** Why the system flagged her — shown on step 1. */
  reason:
    'Rasio utang terhadap pendapatan (DTI) berada di 68%, di atas ambang batas otomatis underwriting (60%).',
}

export const UNDERWRITING_SECTIONS: DataSection[] = [
  {
    title: 'Alamat saat ini',
    rows: [
      { label: 'Alamat', value: 'Jl. Cilandak No.188' },
      { label: 'RT/RW', value: '002 / 001' },
      {
        label: 'Provinsi, kota, kecamatan, kelurahan',
        value: 'Cilandak Barat, Kota Jakarta Selatan, DKI Jakarta, 12430',
      },
    ],
  },
  {
    title: 'Data bank',
    rows: [
      { label: 'Nama bank', value: 'Bank Central Asia (BCA)' },
      { label: 'Nomor rekening', value: '8770333397' },
      { label: 'Pemilik rekening', value: 'Anik Susilowati' },
    ],
  },
  {
    title: 'Data usaha',
    rows: [
      { label: 'Pekerjaan', value: 'Wiraswasta' },
      { label: 'Sumber pendapatan', value: 'Hasil Usaha' },
      { label: 'Bidang', value: 'Industri Rumah Tangga' },
      { label: 'Jenis', value: 'Makanan Kecil' },
      { label: 'Alamat', value: 'Jl. TB Simatupang No.18' },
      { label: 'RT/RW', value: '002 / 001' },
      {
        label: 'Provinsi, kota, kecamatan, kelurahan',
        value: 'Cilandak Barat, Kota Jakarta Selatan, DKI Jakarta, 12430',
      },
      { label: 'Umur usaha', value: '1 tahun' },
      { label: 'Pengeluaran per bulan', value: 'Rp301.000 - Rp500.000' },
      { label: 'Penghasilan per bulan', value: 'Rp501.000 - Rp999.000' },
      { label: 'Penghasilan lainnya per bulan', value: 'Tidak Ada' },
    ],
  },
  {
    title: 'Data penanggung jawab',
    rows: [
      { label: 'Nomor HP penanggung jawab', value: '+62 812-3456-789' },
      { label: 'Hubungan', value: 'Suami' },
    ],
  },
]

export type ValidasiDecision = 'approve' | 'reject'

/** Reasons differ by decision — an approval says why the flag doesn't apply
 *  here, a rejection says which of underwriting's concerns still stands. */
export const DECISION_REASONS: Record<ValidasiDecision, string[]> = {
  approve: [
    'Usaha berjalan baik, arus kas harian terlihat sehat',
    'Sudah dikenal baik oleh majelis/BM',
    'Riwayat pinjaman sebelumnya lancar',
    'Verifikasi lapangan meyakinkan',
    'Lainnya',
  ],
  reject: [
    'Rasio utang terhadap pendapatan tetap terlalu tinggi',
    'Usaha dinilai kurang stabil',
    'Data/dokumen tidak meyakinkan',
    'Riwayat pinjaman bermasalah',
    'Lainnya',
  ],
}

export const DECISION_REASON_OTHER = 'Lainnya'
