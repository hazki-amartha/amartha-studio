import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'AmarthaFin Home',
      component: lazyScreen(() => import('./screens/home'), 'AmarthaFinHomeScreen'),
      entry: true,
      states: [
        {
          id: 'modal-aktif',
          label: 'Modal aktif',
          description: 'A running Modal loan: limit card in place, PPOB as a five-shortcut strip.',
          apply: demo.modalAktif,
        },
        {
          id: 'amarthalink-aktif',
          label: 'AmarthaLink aktif',
          description:
            'An active agency: PPOB expands into the agent widget, and Modal moves to the recommendations.',
          apply: demo.amarthaLinkAktif,
        },
      ],
    },
  ],
}
