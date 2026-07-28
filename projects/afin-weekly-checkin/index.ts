import type { ProjectModule, ScreenState } from '@/platform/types'
import { config } from './project.config'
import { midChapter, missedWeek, nearFinal, rewardReady } from './lib/demo'
import { HomeAScreen } from './screens/home-a'
import { HomeBScreen } from './screens/home-b'
import { HomeCScreen } from './screens/home-c'
import { ProgressScreen } from './screens/progress'
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
      title: 'Home C — Jalur',
      component: HomeCScreen,
      states: journeyStates,
    },
    {
      id: 'progress',
      title: 'Perjalanan 48 minggu',
      component: ProgressScreen,
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
