import type { ProjectModule, ScreenState } from '@/platform/types'
import { config } from './project.config'
import {
  groupGood,
  groupLost,
  groupWatch,
  midChapter,
  missedWeek,
  nearFinal,
  rewardReady,
} from './lib/demo'
import { HomeAScreen } from './screens/home-a'
import { HomeBScreen } from './screens/home-b'
import { HomeCScreen } from './screens/home-c'
import { MajelisScreen } from './screens/majelis'
import { ProgressWeeksScreen } from './screens/progress-weeks'
import { ProgressRewardsScreen } from './screens/progress-rewards'
import { MilestoneScreen } from './screens/milestone'

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
      title: 'Home A — Deret minggu',
      component: HomeAScreen,
      entry: true,
      states: journeyStates,
    },
    {
      id: 'home-b',
      title: 'Home B — Papan hadiah',
      component: HomeBScreen,
      states: journeyStates,
    },
    {
      id: 'home-c',
      title: 'Home C — Papan + 12 hadiah',
      component: HomeCScreen,
      states: journeyStates,
    },
    {
      id: 'majelis',
      title: 'Kelompok Melati',
      component: MajelisScreen,
      states: journeyStates,
    },
    {
      id: 'progress-weeks',
      title: 'Detail 1 — Perjalanan minggu (A & B)',
      component: ProgressWeeksScreen,
      states: journeyStates,
    },
    {
      id: 'progress-rewards',
      title: 'Detail 2 — Koleksi hadiah (C)',
      component: ProgressRewardsScreen,
      states: journeyStates,
    },
    {
      id: 'milestone',
      title: 'Hadiah terbuka',
      component: MilestoneScreen,
      states: journeyStates,
    },
  ],
}
