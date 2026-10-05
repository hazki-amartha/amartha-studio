import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { showFo, showHmb } from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'mitra-monitoring',
      title: 'Mitra monitoring',
      component: lazyScreen(() => import('./screens/mitra-monitoring'), 'MitraMonitoringScreen'),
      entry: true,
      states: [
        {
          id: 'hmb',
          label: 'HMB',
          description: 'Higher field officer: DPD 90+ mitra carry a Suggest write off button in the drawer.',
          apply: showHmb,
        },
        {
          id: 'fo',
          label: 'Regular FO',
          description: 'Regular field officer: no write-off entry point — the drawer is read-only.',
          apply: showFo,
        },
      ],
    },
  ],
}
