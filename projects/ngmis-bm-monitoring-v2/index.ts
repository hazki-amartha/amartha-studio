import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'dashboard',
      title: 'Branch Monitoring',
      component: lazyScreen(() => import('./screens/dashboard'), 'DashboardScreen'),
      entry: true,
      flowsTo: [
        { to: 'briefing-morning', label: 'Mulai briefing pagi' },
        { to: 'briefing-evening', label: 'Mulai briefing sore' },
        { to: 'briefing-morning-alt-terpisah', label: 'Alt: komentar terpisah (pagi)' },
        { to: 'briefing-evening-alt-terpisah', label: 'Alt: komentar terpisah (sore)' },
        { to: 'briefing-morning-alt-dialog', label: 'Alt: komentar via dialog (pagi)' },
        { to: 'briefing-evening-alt-dialog', label: 'Alt: komentar via dialog (sore)' },
        { to: 'briefing-detail', label: 'Lihat riwayat' },
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
      id: 'briefing-morning-alt-terpisah',
      title: 'Briefing Pagi — Alt: komentar terpisah',
      component: lazyScreen(
        () => import('./screens/briefing-morning-alt-terpisah'),
        'BriefingMorningAltTerpisahScreen',
      ),
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-evening-alt-terpisah',
      title: 'Briefing Sore — Alt: komentar terpisah',
      component: lazyScreen(
        () => import('./screens/briefing-evening-alt-terpisah'),
        'BriefingEveningAltTerpisahScreen',
      ),
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-morning-alt-dialog',
      title: 'Briefing Pagi — Alt: komentar via dialog',
      component: lazyScreen(
        () => import('./screens/briefing-morning-alt-dialog'),
        'BriefingMorningAltDialogScreen',
      ),
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-evening-alt-dialog',
      title: 'Briefing Sore — Alt: komentar via dialog',
      component: lazyScreen(
        () => import('./screens/briefing-evening-alt-dialog'),
        'BriefingEveningAltDialogScreen',
      ),
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-detail',
      title: 'Detail Briefing',
      component: lazyScreen(() => import('./screens/briefing-detail'), 'BriefingDetailScreen'),
      flowsTo: [{ to: 'dashboard', label: 'Kembali' }],
    },
  ],
}
