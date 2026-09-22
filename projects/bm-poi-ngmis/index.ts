import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'poi-create',
      title: 'POI Baru',
      component: lazyScreen(() => import('./screens/poi-create'), 'PoiCreateScreen'),
      entry: true,
    },
  ],
}
