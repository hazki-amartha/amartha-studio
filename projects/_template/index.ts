// Project module — exports config + screens. Register the project with one
// appended line in projects/registry.ts:
//   'my-project': () => import('./my-project').then((m) => m.project),

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { ExampleScreen } from './screens/example'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'example',
      title: 'Example',
      component: ExampleScreen,
      entry: true, // exactly one screen per project sets entry: true
      notes: ['Annotation shown beside the device on desktop.'],
      flowsTo: [], // e.g. [{ to: 'next-screen', label: 'on submit' }]
    },
  ],
}
