import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { store } from './lib/store'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Home',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
      entry: true,
      // The sales-summary card has two layout explorations — surfaced as
      // one-click chips beside the device rather than tap-to-reach states.
      states: [
        {
          id: 'layout-2',
          label: 'Ringkasan: Pemasukan dulu',
          description: 'Pemasukan (Poket + QRIS) di atas, Total Keuntungan di bawah',
          apply: () => store.set({ layout: 2 }),
        },
        {
          id: 'layout-3',
          label: 'Ringkasan: Total untung dulu',
          description: 'Total Keuntungan memimpin, lalu rincian Pemasukan',
          apply: () => store.set({ layout: 3 }),
        },
      ],
    },
  ],
}
