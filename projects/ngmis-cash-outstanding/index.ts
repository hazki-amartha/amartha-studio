import type { ProjectModule, ScreenState } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

const STATES: ScreenState[] = [
  {
    id: 'default',
    label: 'Default (16.00)',
    description: 'Hari ini pukul 16.00, lewat deadline, belum ada tindakan.',
    apply: demo.stateDefault,
  },
  {
    id: 'mangkir',
    label: 'BP Marked Mangkir',
    description: 'Diski sudah ditandai mangkir — tombolnya nonaktif, ada badge di nama.',
    apply: demo.stateMangkir,
  },
  {
    id: 'telat',
    label: 'BP Marked Telat',
    description: 'Keterlambatan Sukma sudah di-acknowledge — tombolnya nonaktif, ada badge di nama.',
    apply: demo.stateTelat,
  },
  {
    id: 'earlier',
    label: 'Earlier in the day (14.30)',
    description: 'Sebelum deadline 16.00 — hanya BP yang lewat 1 hari yang tampak telat.',
    apply: demo.stateEarlier,
  },
]

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'fo-report',
      title: 'FO Report — Cash Outstanding',
      component: lazyScreen(() => import('./screens/fo-report'), 'FoReportScreen'),
      entry: true,
      states: STATES,
      flowsTo: [{ to: 'fo-user-management', label: 'Tandai sebagai Mangkir' }],
    },
    {
      id: 'fo-user-management',
      title: 'FO User Management',
      component: lazyScreen(() => import('./screens/fo-user-management'), 'FoUserManagementScreen'),
    },
  ],
}
