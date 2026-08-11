import type { ProjectModule, ScreenState } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

/** Which briefing the dashboard banner prompts — the one "scheduled to start". */
const SCHEDULE_STATES: ScreenState[] = [
  {
    id: 'jadwal-sore',
    label: 'Jadwal: Briefing Sore',
    description: 'Banner briefing sore muncul (default, sore hari).',
    apply: demo.scheduleEvening,
  },
  {
    id: 'jadwal-pagi',
    label: 'Jadwal: Briefing Pagi',
    description: 'Banner briefing pagi muncul (pagi hari).',
    apply: demo.scheduleMorning,
  },
]

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'dashboard',
      title: 'Branch Monitoring',
      component: lazyScreen(() => import('./screens/dashboard'), 'DashboardScreen'),
      entry: true,
      states: SCHEDULE_STATES,
      flowsTo: [
        { to: 'briefing-morning', label: 'Mulai briefing pagi' },
        { to: 'briefing-evening', label: 'Mulai briefing sore' },
        { to: 'briefing-history', label: 'Riwayat briefing' },
      ],
    },
    {
      id: 'briefing-history',
      title: 'Riwayat Briefing',
      component: lazyScreen(() => import('./screens/briefing-history'), 'BriefingHistoryScreen'),
      flowsTo: [
        { to: 'briefing-detail', label: 'Lihat' },
        { to: 'dashboard', label: 'Kembali' },
      ],
    },
    {
      id: 'briefing-morning',
      title: 'Briefing Pagi',
      component: lazyScreen(() => import('./screens/briefing-morning'), 'BriefingMorningScreen'),
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-evening',
      title: 'Briefing Sore',
      component: lazyScreen(() => import('./screens/briefing-evening'), 'BriefingEveningScreen'),
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-detail',
      title: 'Detail Briefing',
      component: lazyScreen(() => import('./screens/briefing-detail'), 'BriefingDetailScreen'),
      flowsTo: [{ to: 'briefing-history', label: 'Kembali' }],
    },
  ],
}
