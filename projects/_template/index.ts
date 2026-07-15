// Project module — exports config + the screens array. Register the project
// with ONE appended line in projects/registry.ts (above the marker):
//   'my-project': () => import('./my-project').then((m) => m.project),

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { ExampleScreen } from './screens/example'
import { DetailScreen } from './screens/detail'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'example', // kebab-case, unique in this project, stable (used by flow edges)
      title: 'Example',
      component: ExampleScreen,
      entry: true, // exactly ONE screen per project sets entry: true
      notes: ['Annotation shown beside the device on desktop while this screen is active.'],
      // flowsTo is descriptive metadata for the flow view — the real navigation
      // happens via useFlow().go(id) inside the component. Keep them in sync.
      flowsTo: [{ to: 'detail', label: 'view detail' }],
    },
    {
      id: 'detail',
      title: 'Detail',
      component: DetailScreen,
      notes: ['Back returns to the entry screen via useFlow().back().'],
      flowsTo: [{ to: 'example', label: 'back' }],
    },
  ],
}
