// Project module — exports config + the screens array. Register the project
// with ONE appended line in EACH of the two maps (above their markers):
//   projects/registry.ts  'my-project': () => import('./my-project').then((m) => m.project),
//   projects/configs.ts   'my-project': () => import('./my-project/project.config').then((m) => m.config),
//
// Screens are declared with lazyScreen(), never imported at the top of this
// file: the index is the project's metadata, and listing a screen should not
// load it. See platform/lazyScreen.tsx.

import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'

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
      component: lazyScreen(() => import('./screens/example'), 'ExampleScreen'),
      entry: true, // exactly ONE screen per project sets entry: true
    },
    {
      id: 'detail',
      title: 'Detail',
      component: lazyScreen(() => import('./screens/detail'), 'DetailScreen'),
    },
  ],
}
