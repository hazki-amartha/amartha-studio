import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { fillSampleDraft, packSchedule } from './lib/store'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'poi-list',
      title: 'POI creation',
      component: lazyScreen(() => import('./screens/poi-list'), 'PoiListScreen'),
      entry: true,
      flowsTo: [
        { to: 'poi-create', label: 'Tambah POI' },
        { to: 'poi-detail', label: 'Lihat POI' },
      ],
    },
    {
      id: 'poi-detail',
      title: 'Detail POI',
      component: lazyScreen(() => import('./screens/poi-detail'), 'PoiDetailScreen'),
      flowsTo: [
        { to: 'poi-list', label: 'Kembali' },
        { to: 'poi-create', label: 'Edit' },
      ],
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
        {
          id: 'jadwal-padat',
          label: 'Jadwal padat (demo)',
          description: "Sari Handayani's week filled with visits, for a presentation.",
          apply: packSchedule,
        },
      ],
    },
  ],
}
