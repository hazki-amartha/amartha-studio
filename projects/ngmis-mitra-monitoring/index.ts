import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { scheduleEvening, scheduleMorning, showFo, showHmb } from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'mitra-monitoring',
      title: 'Mitra monitoring',
      component: lazyScreen(() => import('./screens/mitra-monitoring'), 'MitraMonitoringScreen'),
      entry: true,
      states: [
        {
          id: 'hmb',
          label: 'HMB',
          description: 'Higher field officer: DPD 90+ mitra carry a Suggest write off button in the drawer.',
          apply: showHmb,
        },
        {
          id: 'fo',
          label: 'Regular FO',
          description: 'Regular field officer: no write-off entry point — the drawer is read-only.',
          apply: showFo,
        },
        {
          id: 'jadwal-sore',
          label: 'Jadwal: Briefing Sore',
          description: 'Progres harian: banner briefing sore muncul (default, sore hari).',
          apply: scheduleEvening,
        },
        {
          id: 'jadwal-pagi',
          label: 'Jadwal: Briefing Pagi',
          description: 'Progres harian: banner briefing pagi muncul (pagi hari).',
          apply: scheduleMorning,
        },
      ],
    },
    {
      id: 'briefing-history',
      title: 'Riwayat Briefing',
      component: lazyScreen(() => import('./screens/briefing-history'), 'BriefingHistoryScreen'),
      flowsTo: [
        { to: 'briefing-detail', label: 'Lihat' },
        { to: 'mitra-monitoring', label: 'Kembali' },
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
