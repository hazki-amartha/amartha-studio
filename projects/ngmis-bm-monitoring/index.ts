import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'branch-summary',
      title: 'Branch Summary',
      component: lazyScreen(() => import('./screens/branch-summary'), 'BranchSummaryScreen'),
      entry: true,
    },
    {
      id: 'morning-report',
      title: 'Morning report',
      component: lazyScreen(() => import('./screens/morning-report'), 'MorningReportScreen'),
      flowsTo: [{ to: 'branch-summary', label: 'Kirim' }],
    },
    {
      id: 'evening-report',
      title: 'Evening report',
      component: lazyScreen(() => import('./screens/evening-report'), 'EveningReportScreen'),
      flowsTo: [{ to: 'branch-summary', label: 'Kirim' }],
    },
    {
      id: 'report-history',
      title: 'Riwayat report',
      component: lazyScreen(() => import('./screens/report-history'), 'ReportHistoryScreen'),
      flowsTo: [{ to: 'branch-summary', label: 'Kembali' }],
    },
  ],
}
