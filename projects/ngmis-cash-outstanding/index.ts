import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'fo-report',
      title: 'FO Report — Cash Outstanding',
      component: lazyScreen(() => import('./screens/fo-report'), 'FoReportScreen'),
      entry: true,
      flowsTo: [{ to: 'fo-user-management', label: 'Tandai sebagai Mangkir' }],
    },
    {
      id: 'fo-user-management',
      title: 'FO User Management',
      component: lazyScreen(() => import('./screens/fo-user-management'), 'FoUserManagementScreen'),
    },
  ],
}
