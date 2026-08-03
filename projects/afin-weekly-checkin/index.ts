import type { ProjectModule, ScreenState } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import {
  atRisk,
  dropped,
  firstWindow,
  groupGood,
  groupLost,
  groupWatch,
  lateCaught,
  recovered,
  windowEve,
} from './lib/demo'

// The same conditions apply to every screen here, because every screen reads
// the same journey — the 12-week grading and the majelis. Most of them cannot
// be reached by tapping: a week has to have gone by unpaid, or twelve weeks
// have to have already been graded against her.
const journeyStates: ScreenState[] = [
  {
    id: 'first-window',
    label: 'Penilaian pertama',
    description: 'Minggu 6, belum ada penambahan sama sekali — status modal sudah Sangat Baik.',
    apply: firstWindow,
  },
  {
    id: 'at-risk',
    label: 'Perlu Ditingkatkan',
    description: 'Minggu 17 belum dibayar, 12 minggu ini belum selesai. Masih bisa diselamatkan.',
    apply: atRisk,
  },
  {
    id: 'late-caught',
    label: 'Baik, bukan Sangat Baik',
    description: 'Dua minggu dibayar terlambat: status turun ke Baik, penambahannya lebih kecil.',
    apply: lateCaught,
  },
  {
    id: 'window-eve',
    label: 'Sehari sebelum penilaian',
    description: 'Minggu 24, semua lancar — satu tap dari penambahan penuh.',
    apply: windowEve,
  },
  {
    id: 'tier-dropped',
    label: 'Status modal turun',
    description: 'Minggu 22 belum dibayar sampai penilaian ke-2 selesai: Tidak Lancar.',
    apply: dropped,
  },
  {
    id: 'tier-recovered',
    label: 'Status modal pulih',
    description: 'Tunggakan lunas: status naik lagi ke Baik, penambahan berikutnya di minggu 36.',
    apply: recovered,
  },
  {
    id: 'group-good',
    label: 'Kelompok baik',
    description: 'Semua anggota lancar. Status tanpa angka sama sekali.',
    apply: groupGood,
  },
  {
    id: 'group-watch',
    label: 'Kelompok perlu dijaga',
    description: 'Dua anggota belum bayar — satu-satunya kondisi yang menyebut angka.',
    apply: groupWatch,
  },
  {
    id: 'group-lost',
    label: 'Tambahan kelompok lewat',
    description: 'Enam minggu tidak lengkap: 90% tidak terkejar. Tetap terlihat, tanpa nilai buruk.',
    apply: groupLost,
  },
]

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home-b',
      title: 'Beranda — Status modal',
      component: lazyScreen(() => import('./screens/home-b'), 'HomeBScreen'),
      entry: true,
      states: journeyStates,
    },
    {
      id: 'majelis',
      title: 'Kelompok Melati',
      component: lazyScreen(() => import('./screens/majelis'), 'MajelisScreen'),
      states: journeyStates,
    },
    {
      id: 'progress-tier',
      title: 'Status modal & penambahan',
      component: lazyScreen(() => import('./screens/progress-tier'), 'ProgressTierScreen'),
      states: journeyStates,
    },
    {
      id: 'window-close',
      title: '12 minggu selesai — penilaian',
      component: lazyScreen(() => import('./screens/window-close'), 'WindowCloseScreen'),
      states: journeyStates,
    },
  ],
}
