import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { showEndState, showMvp } from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'branch-summary',
      title: 'Performa cabang',
      component: lazyScreen(() => import('./screens/branch-summary'), 'BranchSummaryScreen'),
      entry: true,
      states: [
        {
          id: 'mvp',
          label: 'MVP',
          description: 'Angka apa adanya — jumlah mitra, terbayar, dan rate per bucket',
          apply: showMvp,
        },
        {
          id: 'end-state',
          label: 'End state',
          description: 'Rate memimpin dan diberi warna terhadap target, plus aksi untuk BP yang belum capai',
          apply: showEndState,
        },
      ],
    },
  ],
}
