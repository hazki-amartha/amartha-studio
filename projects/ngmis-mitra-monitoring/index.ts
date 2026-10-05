import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'mitra-monitoring',
      title: 'Mitra monitoring',
      component: lazyScreen(() => import('./screens/mitra-monitoring'), 'MitraMonitoringScreen'),
      entry: true,
    },
  ],
}
