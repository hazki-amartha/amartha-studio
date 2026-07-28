import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'AmarthaFin Home',
      component: lazyScreen(() => import('./screens/home'), 'AmarthaFinHomeScreen'),
      entry: true,
    },
  ],
}
