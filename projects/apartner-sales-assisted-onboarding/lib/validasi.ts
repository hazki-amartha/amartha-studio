// Validasi Mitra — the BM's 4-step review of a soft-rejected pengajuan.
//
// Underwriting doesn't only say yes/no: some pengajuan come back "soft
// reject" — the system's automated rules flagged something (usually a debt
// ratio or a thin business history), but the case isn't hopeless. A BM who
// knows the mitra, or her majelis, can look at the full underwriting data and
// decide for herself. This is an existing process; the task on Tugas is what
// makes it visible in the prototype, not a new idea.
//
// A handful of demo cases (fixed, not tied to the Sales pipeline's own leads —
// a soft reject is a system/underwriting concern, not a Sales funnel status)
// each carry the same 4-step review: the soft-reject notice (which links out
// to the full underwriting data and the BP's own field feedback — reference
// material, not steps of their own), the BM's own visit to the mitra, her
// visit to the Ketua Majelis, then the decision. A BM can be sitting on more
// than one case at once, so each is its own row on Tugas / Sales, keyed by
// `id` — see validasi-store.ts.

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

/** The BP's own field visit — a condensed one-pager of the real BP Feedback
 *  form (selfie + verification, kondisi usaha, profil mitra, verifikasi
 *  lingkungan, penilaian BP), shown whole on step 3. The human read next to
 *  underwriting's, since a debt ratio doesn't see everything. */
export interface BpAssessment {
  usahaAktif: 'Ya' | 'Tidak'
  lamaUsaha: string
  statusRumah: string
  lamaTinggal: string
  pengakuanLingkungan: string
  verifikasiDomisili: 'Sesuai' | 'Tidak sesuai'
  kesanggupanBayar: string
  indikasiBuruk: string
  /** The BP's own note — what she'd actually say if asked. */
  catatan: string
}

export interface SoftRejectCase {
  id: string
  name: string
  majelisName: string
  product: 'GL' | 'Modal'
  amount: string
  /** Why the system flagged her — shown on step 1. */
  reason: string
  nik: string
  sections: DataSection[]
  bpAssessment: BpAssessment
}

export const SOFT_REJECT_CASES: SoftRejectCase[] = [
  {
    id: 'anik-susilowati',
    name: 'Anik Susilowati',
    majelisName: 'Majelis Melati',
    product: 'GL',
    amount: 'Rp2.000.000',
    reason:
      'Rasio utang terhadap pendapatan (DTI) berada di 68%, di atas ambang batas otomatis underwriting (60%).',
    nik: '3578071234560003',
    sections: [
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
    ],
    bpAssessment: {
      usahaAktif: 'Ya',
      lamaUsaha: '1 tahun',
      statusRumah: 'Sewa',
      lamaTinggal: '1 tahun',
      pengakuanLingkungan: 'Kurang dikenal oleh warga sekitar',
      verifikasiDomisili: 'Sesuai',
      kesanggupanBayar: 'Diragukan',
      indikasiBuruk: 'Ada — riwayat menunda pembayaran cicilan, sulit dihubungi',
      catatan:
        'Anik beberapa kali menunda pembayaran cicilan pinjaman sebelumnya tanpa pemberitahuan, dan sulit dihubungi saat kunjungan rutin.',
    },
  },
  {
    id: 'siti-nurjanah',
    name: 'Siti Nurjanah',
    majelisName: 'Majelis Kenanga',
    product: 'GL',
    amount: 'Rp1.500.000',
    reason:
      'Usaha berjalan kurang dari 6 bulan — di bawah ambang batas otomatis underwriting untuk lama usaha minimum (1 tahun).',
    nik: '3204125509910006',
    sections: [
      {
        title: 'Alamat saat ini',
        rows: [
          { label: 'Alamat', value: 'Jl. Kopo Sayati No.42' },
          { label: 'RT/RW', value: '005 / 010' },
          {
            label: 'Provinsi, kota, kecamatan, kelurahan',
            value: 'Margahayu, Kabupaten Bandung, Jawa Barat, 40228',
          },
        ],
      },
      {
        title: 'Data bank',
        rows: [
          { label: 'Nama bank', value: 'Bank Rakyat Indonesia (BRI)' },
          { label: 'Nomor rekening', value: '0092881145' },
          { label: 'Pemilik rekening', value: 'Siti Nurjanah' },
        ],
      },
      {
        title: 'Data usaha',
        rows: [
          { label: 'Pekerjaan', value: 'Wiraswasta' },
          { label: 'Sumber pendapatan', value: 'Hasil Usaha' },
          { label: 'Bidang', value: 'Perdagangan' },
          { label: 'Jenis', value: 'Sembako' },
          { label: 'Alamat', value: 'Jl. Kopo Sayati No.42' },
          { label: 'RT/RW', value: '005 / 010' },
          {
            label: 'Provinsi, kota, kecamatan, kelurahan',
            value: 'Margahayu, Kabupaten Bandung, Jawa Barat, 40228',
          },
          { label: 'Umur usaha', value: '4 bulan' },
          { label: 'Pengeluaran per bulan', value: 'Rp201.000 - Rp300.000' },
          { label: 'Penghasilan per bulan', value: 'Rp401.000 - Rp500.000' },
          { label: 'Penghasilan lainnya per bulan', value: 'Tidak Ada' },
        ],
      },
      {
        title: 'Data penanggung jawab',
        rows: [
          { label: 'Nomor HP penanggung jawab', value: '+62 813-9988-2210' },
          { label: 'Hubungan', value: 'Suami' },
        ],
      },
    ],
    bpAssessment: {
      usahaAktif: 'Ya',
      lamaUsaha: '4 bulan',
      statusRumah: 'Milik sendiri',
      lamaTinggal: '5 tahun',
      pengakuanLingkungan: 'Dikenal baik, aktif di pertemuan majelis',
      verifikasiDomisili: 'Sesuai',
      kesanggupanBayar: 'Mampu',
      indikasiBuruk: 'Tidak ada',
      catatan: 'Warung Siti selalu ramai pembeli setiap kunjungan, dan ia rutin hadir di pertemuan majelis.',
    },
  },
  {
    id: 'ratna-dewi',
    name: 'Ratna Dewi',
    majelisName: 'Majelis Anggrek',
    product: 'Modal',
    amount: 'Rp3.000.000',
    reason:
      'Rencana penggunaan Modal tidak sebanding dengan skala usaha tercatat — sistem menahan otomatis untuk verifikasi lanjutan.',
    nik: '3175056812880004',
    sections: [
      {
        title: 'Alamat saat ini',
        rows: [
          { label: 'Alamat', value: 'Jl. Kebon Jeruk Raya No.7' },
          { label: 'RT/RW', value: '003 / 004' },
          {
            label: 'Provinsi, kota, kecamatan, kelurahan',
            value: 'Kebon Jeruk, Kota Jakarta Barat, DKI Jakarta, 11530',
          },
        ],
      },
      {
        title: 'Data bank',
        rows: [
          { label: 'Nama bank', value: 'Bank Mandiri' },
          { label: 'Nomor rekening', value: '1330019452201' },
          { label: 'Pemilik rekening', value: 'Ratna Dewi' },
        ],
      },
      {
        title: 'Data usaha',
        rows: [
          { label: 'Pekerjaan', value: 'Wiraswasta' },
          { label: 'Sumber pendapatan', value: 'Hasil Usaha' },
          { label: 'Bidang', value: 'Konveksi' },
          { label: 'Jenis', value: 'Pakaian Jadi' },
          { label: 'Alamat', value: 'Jl. Kebon Jeruk Raya No.7' },
          { label: 'RT/RW', value: '003 / 004' },
          {
            label: 'Provinsi, kota, kecamatan, kelurahan',
            value: 'Kebon Jeruk, Kota Jakarta Barat, DKI Jakarta, 11530',
          },
          { label: 'Umur usaha', value: '2 tahun' },
          { label: 'Pengeluaran per bulan', value: 'Rp501.000 - Rp1.000.000' },
          { label: 'Penghasilan per bulan', value: 'Rp1.001.000 - Rp1.500.000' },
          { label: 'Penghasilan lainnya per bulan', value: 'Tidak Ada' },
        ],
      },
      {
        title: 'Data penanggung jawab',
        rows: [
          { label: 'Nomor HP penanggung jawab', value: '+62 811-2233-4409' },
          { label: 'Hubungan', value: 'Suami' },
        ],
      },
    ],
    bpAssessment: {
      usahaAktif: 'Ya',
      lamaUsaha: '2 tahun',
      statusRumah: 'Milik sendiri',
      lamaTinggal: '3 tahun',
      pengakuanLingkungan: 'Dikenal cukup baik oleh warga sekitar',
      verifikasiDomisili: 'Sesuai',
      kesanggupanBayar: 'Mampu, dengan catatan',
      indikasiBuruk: 'Tidak ada, namun beberapa kali telat menyerahkan dokumen',
      catatan: 'Ratna cukup kooperatif, namun beberapa kali telat menyerahkan dokumen usaha yang diminta.',
    },
  },
]

/** The 4-step flow's own StageBar labels — same order as the screens.
 *  Data Underwriting and BP Feedback are no longer steps of their own: step 1
 *  links out to them (see validasi-mitra.tsx), and they link back to it —
 *  they're reference material for the review, not stages of it. */
export const VALIDASI_STEPS = ['Hasil', 'Validasi mitra', 'Validasi KM', 'Keputusan']

/** The screen id each step's StageBar circle jumps to, 1-indexed to match
 *  StageBar's own numbering — the BM can move freely between all four, there
 *  is nothing here that gates going back or skipping ahead. */
export const VALIDASI_STEP_SCREENS = [
  'validasi-mitra',
  'validasi-verifikasi-mitra',
  'validasi-verifikasi-ketua',
  'validasi-keputusan',
] as const

// BM's own verification (step 4, before Keputusan) — she re-checks a few of
// the same facts the BP already reported (see bpAssessment), plus what only
// she can attest to: majelis members vouching for the mitra, and her own
// selfie+geotag with the majelis and its Ketua.
export const STATUS_RUMAH_OPTIONS = ['Milik sendiri', 'Sewa', 'Menumpang']
export const USAHA_BERJALAN_OPTIONS = ['Ya', 'Tidak']
export const ASET_OPTIONS = [
  'Rumah',
  'Tanah',
  'Motor',
  'Sepeda',
  'Ternak',
  'Emas / perhiasan',
  'Alat usaha',
  'Perabot rumah tangga',
  'Tidak ada aset',
]
export const MAJELIS_CHECKING_OPTIONS = [
  'Ya, dikenal baik oleh Ketua Majelis',
  'Cukup dikenal',
  'Tidak dikenal / Ketua Majelis tidak mengenali',
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

/** "2000000" → "Rp2.000.000" — same grouping InputNominal shows while typing,
 *  for reading the proposed limit back elsewhere. */
export function formatRupiah(digits: string): string {
  return `Rp${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}
