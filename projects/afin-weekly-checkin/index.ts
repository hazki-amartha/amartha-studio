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
  midChapter,
  missedWeek,
  mixedRepayments,
  nearFinal,
  recovered,
  rewardReady,
  windowEve,
} from './lib/demo'

// The same four conditions apply to every screen here, because every screen
// reads the same journey. Three of them cannot be reached by tapping.
const journeyStates: ScreenState[] = [
  {
    id: 'mid-chapter',
    label: 'Tengah chapter',
    description: 'Dua minggu lancar, dua lagi sampai hadiah.',
    apply: midChapter,
  },
  {
    id: 'reward-ready',
    label: 'Hadiah terbuka',
    description: 'Minggu keempat baru terisi — Rp500rb siap dicairkan.',
    apply: rewardReady,
  },
  {
    id: 'missed-week',
    label: 'Ada minggu terlewat',
    description: 'Minggu 14 kosong: barisan bertambah satu, hadiahnya tidak bergeser.',
    apply: missedWeek,
  },
  {
    id: 'near-final',
    label: 'Menjelang minggu 48',
    description: 'Dua minggu dari kenaikan limit — garis tujuan hampir penuh.',
    apply: nearFinal,
  },
  {
    id: 'mixed-repayments',
    label: 'Bayar, telat, belum bayar',
    description:
      'Ketiga status di satu papan: minggu 7 telat, minggu 8 belum dibayar — blok 2 tidak menambah apa pun.',
    apply: mixedRepayments,
  },
  // Option B's six, all about the 12-week grading. Four of them cannot be
  // tapped to at all: a week has to have gone by unpaid, or twelve weeks have
  // to have already been graded against her.
  {
    id: 'first-window',
    label: 'Penilaian pertama (B)',
    description: 'Minggu 6, belum ada penambahan sama sekali — status modal sudah Sangat Baik.',
    apply: firstWindow,
  },
  {
    id: 'at-risk',
    label: 'Perlu Ditingkatkan (B)',
    description: 'Minggu 17 belum dibayar, 12 minggu ini belum selesai. Masih bisa diselamatkan.',
    apply: atRisk,
  },
  {
    id: 'late-caught',
    label: 'Baik, bukan Sangat Baik (B)',
    description: 'Dua minggu dibayar terlambat: status turun ke Baik, penambahannya lebih kecil.',
    apply: lateCaught,
  },
  {
    id: 'window-eve',
    label: 'Sehari sebelum penilaian (B)',
    description: 'Minggu 24, semua lancar — satu tap dari penambahan penuh.',
    apply: windowEve,
  },
  {
    id: 'tier-dropped',
    label: 'Status modal turun (B)',
    description: 'Minggu 22 belum dibayar sampai penilaian ke-2 selesai: Tidak Lancar.',
    apply: dropped,
  },
  {
    id: 'tier-recovered',
    label: 'Status modal pulih (B)',
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
      id: 'home-a',
      title: 'Home A — Anchor limit',
      component: lazyScreen(() => import('./screens/home-a'), 'HomeAScreen'),
      entry: true,
      states: journeyStates,
    },
    {
      id: 'home-b',
      title: 'Home B — Anchor status modal',
      component: lazyScreen(() => import('./screens/home-b'), 'HomeBScreen'),
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
      title: 'Detail B — Status modal & penambahan',
      component: lazyScreen(() => import('./screens/progress-tier'), 'ProgressTierScreen'),
      states: journeyStates,
    },
    {
      id: 'window-close',
      title: '12 minggu selesai — penilaian (B)',
      component: lazyScreen(() => import('./screens/window-close'), 'WindowCloseScreen'),
      states: journeyStates,
    },
    {
      id: 'progress-weeks',
      title: 'Detail A — Angsuran & pencairan',
      component: lazyScreen(() => import('./screens/progress-weeks'), 'ProgressWeeksScreen'),
      states: journeyStates,
    },
    {
      id: 'milestone',
      title: 'Empat minggu lancar',
      component: lazyScreen(() => import('./screens/milestone'), 'MilestoneScreen'),
      states: journeyStates,
    },
  ],
}
