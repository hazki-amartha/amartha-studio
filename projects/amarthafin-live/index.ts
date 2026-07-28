import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { AmarthaFinHomeScreen } from './screens/home'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'AmarthaFin Home',
      component: AmarthaFinHomeScreen,
      entry: true,
    },
  ],
}
