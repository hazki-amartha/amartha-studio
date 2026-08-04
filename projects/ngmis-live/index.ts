import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'customer-list',
      title: 'Customer list',
      component: lazyScreen(() => import('./screens/customer-list'), 'CustomerListScreen'),
      entry: true,
    },
  ],
}
