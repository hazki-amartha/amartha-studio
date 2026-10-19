import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'mulai',
      title: 'Mulai',
      component: lazyScreen(() => import('./screens/mulai'), 'MulaiScreen'),
      entry: true,
    },
  ],
}
