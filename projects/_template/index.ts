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
    // id + title + component is the whole requirement. Two optional extras exist
    // and are OFF by default:
    //   notes    — annotations beside the device on desktop. Add ONLY when the
    //              designer asks. Never write unrequested design rationale.
    //   flowsTo  — descriptive edges for the flow view. Real navigation is
    //              useFlow().go(id) in the component; this just draws the map.
    //              Add it when a diagram helps, skip it otherwise.
    {
      id: 'example', // kebab-case, unique in this project, stable
      title: 'Example',
      component: ExampleScreen,
      entry: true, // exactly ONE screen per project sets entry: true
    },
    {
      id: 'detail',
      title: 'Detail',
      component: DetailScreen,
    },
  ],
}
