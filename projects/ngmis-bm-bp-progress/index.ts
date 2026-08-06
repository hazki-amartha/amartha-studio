// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'board',
      title: 'Board BP',
      component: lazyScreen(() => import('./screens/board'), 'BoardScreen'),
      entry: true,
      flowsTo: [{ to: 'bp', label: 'klik satu baris BP' }],
    },
    {
      id: 'bp',
      title: 'Detail BP',
      component: lazyScreen(() => import('./screens/bp'), 'BpScreen'),
      flowsTo: [
        { to: 'task-majelis', label: 'tugas MV' },
        { to: 'task-home', label: 'tugas HV' },
        { to: 'board', label: 'kembali' },
      ],
    },
    {
      id: 'task-majelis',
      title: 'Kunjungan majelis',
      component: lazyScreen(() => import('./screens/task-majelis'), 'TaskMajelisScreen'),
      flowsTo: [{ to: 'bp', label: 'kembali' }],
    },
    {
      id: 'task-home',
      title: 'Kunjungan rumah',
      component: lazyScreen(() => import('./screens/task-home'), 'TaskHomeScreen'),
      flowsTo: [{ to: 'bp', label: 'kembali' }],
    },
  ],
}
