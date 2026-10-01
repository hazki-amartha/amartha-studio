'use client'

// The assisted survey — two boxes on the Calon Mitra detail page, each its own
// multi-step page:
//
//   BP Feedback        5 steps (Validasi … Penilaian BP), typed fields
//   Survey Uji Kelayakan  6 steps (Data pribadi … Foto tempat usaha), 3 each
//
// (The majelis ritual is no longer part of the survey — it moved into the group
// formation / acceptance flow.) BP Feedback is built from the Assisted
// Onboarding field list (typed fields); Uji Kelayakan questions are placeholders
// for now. Progress is held in a module store so each box shows how far its
// sub-page got, and survives navigating in and out (screens remount).

import { useSyncExternalStore } from 'react'

export type SectionId = 'bp-feedback' | 'uji-kelayakan' | 'ritual'

/** The three ritual points — shared by the onboarding ritual checklist and the
 *  group-formation / acceptance ritual step. */
export const RITUAL_POINTS = [
  'Perkenalan visi & misi Amartha ke seluruh anggota',
  'Penjelasan tanggung renteng & disiplin bayar mingguan',
  'Doa bersama & pembacaan komitmen majelis',
]

export interface AppSection {
  id: SectionId
  label: string
  /** How many steps the section has — the denominator on its card. */
  total: number
}

export const APPLICATION_SECTIONS: AppSection[] = [
  { id: 'bp-feedback', label: 'BP Feedback', total: 5 },
  { id: 'uji-kelayakan', label: 'Survey Uji Kelayakan', total: 7 },
]

/**
 * A survey field. `foto` captures a photo (stand-in); `dropdown` picks one
 * option; `dropdown-notes` adds a free-text note; `multiselect` allows several.
 * The Uji Kelayakan form (from the Survey UK reference) adds plain inputs:
 * `text`, `numeric`, `date`, `currency` (Rp), `phone` (+62), a `checkbox`
 * consent, and a `readonly` system value.
 */
export type FieldType =
  | 'foto'
  | 'dropdown'
  | 'dropdown-notes'
  | 'multiselect'
  | 'text'
  | 'numeric'
  | 'date'
  | 'currency'
  | 'phone'
  | 'checkbox'
  | 'readonly'

export interface Field {
  label: string
  type: FieldType
  options?: string[]
  required?: boolean
  placeholder?: string
  /** For `readonly` — the system-supplied value shown. */
  value?: string
  /**
   * Prefilled from the KTP captured at Mulai Pendaftaran (OCR). The photo carries
   * over as already attached, and each derived field is filled in — editable, but
   * marked "Terisi dari KTP". For identity/address fields the live lead value is
   * used; `value` here is the OCR stand-in for the rest.
   */
  ktp?: boolean
}

export interface SurveyStep {
  id: string
  title: string
  /** Uji Kelayakan — plain text questions. */
  questions?: string[]
  /** BP Feedback — typed fields (from the Assisted Onboarding field list). */
  fields?: Field[]
}

// BP Feedback — the Assisted Onboarding field list, grouped by category.
export const BP_FEEDBACK_STEPS: SurveyStep[] = [
  {
    id: 'validasi',
    title: 'Validasi',
    fields: [{ label: 'Selfie BP & Mitra', type: 'foto' }],
  },
  {
    id: 'usaha',
    title: 'Kondisi usaha',
    fields: [
      {
        label: 'Apakah usaha mitra saat ini berjalan aktif?',
        type: 'dropdown',
        options: ['Aktif normal', 'Aktif tapi menurun', 'Tutup sementara', 'Tidak ada usaha'],
      },
      {
        label: 'Sudah berapa lama usaha mitra berjalan?',
        type: 'dropdown',
        options: ['< 6 bulan', '6-12 bulan', '1-3 tahun', '> 3 tahun'],
      },
    ],
  },
  {
    id: 'profil',
    title: 'Profil mitra',
    fields: [
      {
        label: 'Status kepemilikan rumah yang ditempati mitra?',
        type: 'dropdown',
        options: ['Milik sendiri', 'Milik keluarga', 'Sewa / kontrak', 'Menumpang'],
      },
      {
        label: 'Sudah berapa lama mitra tinggal di alamat saat ini?',
        type: 'dropdown',
        options: ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'],
      },
    ],
  },
  {
    id: 'lingkungan',
    title: 'Cek lingkungan',
    fields: [
      { label: 'Selfie BP & narasumber lingkungan', type: 'foto' },
      {
        label: 'Bagaimana pengakuan warga / Ketua Majelis terhadap mitra?',
        type: 'dropdown-notes',
        options: ['Dikenal baik', 'Dikenal, netral', 'Kurang dikenal', 'Ada catatan negatif'],
      },
      {
        label: 'Sumber informasi lingkungan yang ditemui BP',
        type: 'dropdown',
        options: ['Ketua Majelis', 'Tetangga', 'Ketua RT / RW', 'Tokoh setempat'],
      },
      {
        label: 'Verifikasi domisili: apakah alamat sekarang sesuai dengan data domisili?',
        type: 'dropdown',
        options: ['Sesuai', 'Tidak sesuai'],
      },
      {
        label: 'Lama tinggal menurut lingkungan',
        type: 'dropdown',
        options: ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'],
      },
      {
        label: 'Apakah usaha mitra sesuai dengan data pengajuan dan masih berjalan?',
        type: 'dropdown',
        options: [
          'Sesuai & berjalan',
          'Sesuai & tidak berjalan',
          'Tidak sesuai & berjalan',
          'Tidak sesuai & tidak berjalan',
        ],
      },
      {
        label: 'Pernah didatangi atau dihubungi debt collector?',
        type: 'dropdown',
        options: ['Pernah', 'Tidak pernah'],
      },
    ],
  },
  {
    id: 'penilaian',
    title: 'Penilaian BP',
    fields: [
      {
        label: 'Kesanggupan pembayaran mitra per minggu',
        type: 'dropdown',
        options: [
          'Rp50.000 - Rp100.000',
          'Rp100.000 - Rp150.000',
          'Rp150.000 - Rp200.000',
          'Rp200.000 - Rp250.000',
          '> Rp250.000',
        ],
      },
      {
        label: 'Apakah ada indikasi buruk terhadap mitra ini?',
        type: 'multiselect',
        options: [
          'Karakter tidak baik (sulit ditemui / ditagih)',
          'Mitra pindah domisili',
          'Isu majelis (tidak akur / KM tidak setuju cair)',
          'Umur lebih dari 64 tahun',
          'Indikasi fraud (joki / atas nama)',
        ],
      },
    ],
  },
]

// Survey Uji Kelayakan — the field list from the Survey UK reference, grouped
// into its seven steps.
export const UJI_KELAYAKAN_STEPS: SurveyStep[] = [
  {
    id: 'pribadi',
    title: 'Data pribadi',
    fields: [
      { label: 'Foto KTP', type: 'foto', required: true, ktp: true },
      {
        label: 'NIK',
        type: 'numeric',
        required: true,
        placeholder: 'Masukkan NIK',
        ktp: true,
        value: '3201094507850007',
      },
      { label: 'Nama sesuai KTP', type: 'text', required: true, ktp: true },
      {
        label: 'Jenis kelamin',
        type: 'dropdown',
        required: true,
        options: ['Laki-laki', 'Perempuan'],
        ktp: true,
        value: 'Perempuan',
      },
      { label: 'Tempat lahir', type: 'text', required: true, ktp: true, value: 'Bogor' },
      { label: 'Tanggal lahir', type: 'date', required: true, ktp: true, value: '07/05/1985' },
      { label: 'Alamat lengkap', type: 'text', required: true, ktp: true },
      {
        label: 'Provinsi',
        type: 'dropdown',
        required: true,
        options: ['Banten', 'Jawa Barat', 'DKI Jakarta', 'Jawa Tengah', 'Jawa Timur'],
        ktp: true,
        value: 'Jawa Barat',
      },
      {
        label: 'Kota/Kabupaten',
        type: 'dropdown',
        required: true,
        options: ['Kab. Bogor', 'Kab. Tangerang', 'Kota Bogor', 'Kota Tangerang'],
        ktp: true,
        value: 'Kab. Bogor',
      },
      { label: 'Kecamatan', type: 'text', required: true, ktp: true },
      { label: 'Kelurahan', type: 'text', required: true, ktp: true },
      { label: 'RT', type: 'numeric', required: true, placeholder: 'Isi RT', ktp: true, value: '02' },
      { label: 'RW', type: 'numeric', required: true, placeholder: 'Isi RW', ktp: true, value: '05' },
      {
        label: 'Agama',
        type: 'dropdown',
        placeholder: 'Pilih Agama',
        options: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'],
        ktp: true,
        value: 'Islam',
      },
      {
        label: 'Status pernikahan',
        type: 'dropdown',
        placeholder: 'Pilih Status Pernikahan',
        options: ['Belum kawin', 'Kawin', 'Cerai hidup', 'Cerai mati'],
        ktp: true,
        value: 'Kawin',
      },
      {
        label: 'Pendidikan terakhir',
        type: 'dropdown',
        placeholder: 'Pilih Pendidikan Terakhir',
        options: ['SD', 'SMP', 'SMA/SMK', 'D1-D3', 'S1', 'S2/S3'],
      },
      {
        label: 'Nama lengkap ibu kandung',
        type: 'text',
        placeholder: 'Masukkan Nama lengkap ibu kandung',
      },
      { label: 'Selfie mitra', type: 'foto', required: true },
      { label: 'Saya setuju dengan Syarat & Ketentuan', type: 'checkbox', required: true },
      { label: 'Alamat saat ini', type: 'text', required: true, placeholder: 'Isi alamat saat ini' },
      { label: 'RT (alamat saat ini)', type: 'numeric', required: true, placeholder: 'Isi RT' },
      { label: 'RW (alamat saat ini)', type: 'numeric', required: true, placeholder: 'Isi RW' },
    ],
  },
  {
    id: 'bank',
    title: 'Data bank dan usaha',
    fields: [
      {
        label: 'Nama bank',
        type: 'dropdown',
        required: true,
        placeholder: 'Pilih Bank',
        options: ['BRI', 'BCA', 'BNI', 'Mandiri', 'BTPN Syariah', 'Seabank'],
      },
      {
        label: 'Nomor rekening aktif',
        type: 'numeric',
        required: true,
        placeholder: 'Masukkan Nomor Rekening aktif',
      },
      { label: 'Aktifkan Poket Premium dan Autodebit', type: 'checkbox' },
      { label: 'Pemilik rekening', type: 'readonly', value: 'Sesuai data bank' },
      {
        label: 'Sumber pendapatan',
        type: 'dropdown',
        required: true,
        placeholder: 'Pilih sumber pendapatan',
        options: ['Usaha sendiri', 'Karyawan', 'Petani', 'Pedagang', 'Lainnya'],
      },
      {
        label: 'Bidang usaha',
        type: 'dropdown',
        required: true,
        placeholder: 'Pilih bidang usaha',
        options: ['Perdagangan', 'Jasa', 'Pertanian', 'Produksi/Kerajinan', 'Peternakan'],
      },
      {
        label: 'Jenis usaha',
        type: 'dropdown',
        required: true,
        placeholder: 'Pilih jenis usaha',
        options: ['Warung/Toko', 'Kuliner', 'Konveksi', 'Tani/Ternak', 'Lainnya'],
      },
      {
        label: 'Umur usaha',
        type: 'dropdown',
        required: true,
        placeholder: 'Pilih lama usaha',
        options: ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'],
      },
      {
        label: 'Pengeluaran per bulan',
        type: 'currency',
        required: true,
        placeholder: 'Isi nominal pengeluaran',
      },
      {
        label: 'Pendapatan per bulan',
        type: 'currency',
        required: true,
        placeholder: 'Isi nominal pendapatan',
      },
      { label: 'Pendapatan lainnya per bulan (jika ada)', type: 'currency' },
      { label: 'Total pendapatan per tahun', type: 'readonly', value: 'Rp60.000.000' },
    ],
  },
  {
    id: 'penanggung',
    title: 'Data penanggung jawab',
    fields: [
      {
        label: 'Hubungan dengan Anda',
        type: 'dropdown',
        required: true,
        placeholder: 'Pilih hubungan',
        options: ['Suami/Istri', 'Anak', 'Orang tua', 'Saudara kandung'],
      },
      {
        label: 'Nomor HP penanggung jawab',
        type: 'phone',
        required: true,
        placeholder: 'Contoh: 8567891298',
      },
      { label: 'Penghasilan PJ per bulan', type: 'currency', required: true },
    ],
  },
  {
    id: 'keluarga',
    title: 'Data keluarga',
    fields: [
      { label: 'Foto Kartu Keluarga', type: 'foto', required: true },
      {
        label: 'Nomor Kartu Keluarga',
        type: 'numeric',
        required: true,
        placeholder: 'Isi nomor kartu keluarga',
      },
      {
        label: 'Jumlah tanggungan (orang)',
        type: 'dropdown',
        required: true,
        options: ['1', '2', '3', '> 3'],
      },
    ],
  },
  {
    id: 'foto-rumah',
    title: 'Foto rumah tinggal',
    fields: [{ label: 'Foto rumah tinggal', type: 'foto', required: true }],
  },
  {
    id: 'foto-usaha',
    title: 'Foto tempat usaha',
    fields: [
      { label: 'Foto tempat usaha', type: 'foto', required: true },
      { label: 'Alamat tempat usaha', type: 'text', required: true, placeholder: 'Isi alamat' },
      { label: 'RT', type: 'numeric', required: true, placeholder: 'Isi RT' },
      { label: 'RW', type: 'numeric', required: true, placeholder: 'Isi RW' },
    ],
  },
  {
    id: 'pinjaman',
    title: 'Data pinjaman',
    fields: [
      {
        label: 'Apakah mitra memiliki pinjaman lain di luar Amartha?',
        type: 'dropdown',
        required: true,
        options: ['0', '1', '2', '> 2'],
      },
      {
        label: 'Dari mana Anda mendapatkan pinjaman ini?',
        type: 'dropdown',
        options: [
          'BTPN Syariah',
          'PNM - Permodalan Nasional Madani',
          'BRI - Bank Rakyat Indonesia',
          'Seabank',
          'MBK - Mitra Bisnis Keluarga',
          'BPD - Bank Pembangunan Daerah',
          'AKULAKU',
          'BINA ARTHA',
          'KREDIVO',
          'FIF',
          'ADIRA',
          'PEGADAIAN',
          'Lainnya',
        ],
      },
      { label: 'Berapa jumlah pinjaman yang Anda terima?', type: 'currency' },
      { label: 'Berapa cicilan yang Anda bayar?', type: 'currency' },
      { label: 'Kapan pinjaman ini lunas?', type: 'date' },
    ],
  },
]

export function stepsFor(section: SectionId): SurveyStep[] {
  return section === 'bp-feedback' ? BP_FEEDBACK_STEPS : UJI_KELAYAKAN_STEPS
}

// --- Progress store --------------------------------------------------------
// Completed step ids per lead + section: `${leadId}:${section}` -> string[].

interface SurveyState {
  done: Record<string, string[]>
}

let state: SurveyState = { done: {} }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const key = (leadId: string, section: SectionId) => `${leadId}:${section}`

export const surveyStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  /** Clear all recorded progress — used by the "start of the survey" demo state. */
  reset() {
    state = { done: {} }
    emit()
  },
  markStep(leadId: string, section: SectionId, stepId: string) {
    const k = key(leadId, section)
    const current = state.done[k] ?? []
    if (current.includes(stepId)) return
    state = { done: { ...state.done, [k]: [...current, stepId] } }
    emit()
  },
  /** Toggle a ritual point (checkbox) on/off. */
  toggleStep(leadId: string, section: SectionId, stepId: string) {
    const k = key(leadId, section)
    const current = state.done[k] ?? []
    const next = current.includes(stepId)
      ? current.filter((id) => id !== stepId)
      : [...current, stepId]
    state = { done: { ...state.done, [k]: next } }
    emit()
  },
}

export function useSurvey(): SurveyState {
  return useSyncExternalStore(surveyStore.subscribe, surveyStore.get, surveyStore.get)
}

export function doneCount(s: SurveyState, leadId: string, section: SectionId): number {
  return (s.done[key(leadId, section)] ?? []).length
}

export function doneStepIds(s: SurveyState, leadId: string, section: SectionId): string[] {
  return s.done[key(leadId, section)] ?? []
}

export function sectionTotal(section: SectionId): number {
  return APPLICATION_SECTIONS.find((x) => x.id === section)?.total ?? 0
}

export function sectionComplete(s: SurveyState, leadId: string, section: SectionId): boolean {
  return doneCount(s, leadId, section) >= sectionTotal(section)
}

// Which section the shared survey-form page is showing — set before navigating.
let activeSection: SectionId = 'bp-feedback'
export function setActiveSection(section: SectionId) {
  activeSection = section
}
export function getActiveSection(): SectionId {
  return activeSection
}

// When a section was last completed — used to show a short "Diproses" state on
// the card before it settles to "Selesai".
const processedAt: Record<string, number> = {}
export function markProcessed(leadId: string, section: SectionId) {
  processedAt[key(leadId, section)] = Date.now()
}
/** Milliseconds since the section was last completed (Infinity if never). */
export function processedSince(leadId: string, section: SectionId): number {
  const at = processedAt[key(leadId, section)]
  return at ? Date.now() - at : Infinity
}
