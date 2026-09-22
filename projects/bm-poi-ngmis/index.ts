import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { fillSampleDraft } from './lib/store'

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
      states: [
        {
          id: 'auto-filled',
          label: 'Auto-filled',
          description: 'Every field filled with a representative POI, ready to review or submit.',
          apply: fillSampleDraft,
        },
      ],
    },
  ],
}
