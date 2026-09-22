import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'poi-list',
      title: 'POI creation',
      component: lazyScreen(() => import('./screens/poi-list'), 'PoiListScreen'),
      entry: true,
      flowsTo: [{ to: 'poi-create', label: 'Tambah POI' }],
    },
    {
      id: 'poi-create',
      title: 'POI Baru',
      component: lazyScreen(() => import('./screens/poi-create'), 'PoiCreateScreen'),
      flowsTo: [{ to: 'poi-list', label: 'Submit / Batal' }],
    },
  ],
}
