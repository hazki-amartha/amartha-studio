import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { showEndState, showMvp, scheduleEvening, scheduleMorning } from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'branch-summary',
      title: 'Performa cabang',
      component: lazyScreen(() => import('./screens/branch-summary'), 'BranchSummaryScreen'),
      entry: true,
      states: [
        {
          id: 'mvp',
          label: 'MVP',
          description: 'Angka apa adanya — jumlah mitra, terbayar, dan rate per bucket',
          apply: showMvp,
        },
        {
          id: 'end-state',
          label: 'End state',
          description: 'Rate memimpin dan diberi warna terhadap target, plus aksi untuk BP yang belum capai',
          apply: showEndState,
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
        { to: 'branch-summary', label: 'Kembali' },
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
