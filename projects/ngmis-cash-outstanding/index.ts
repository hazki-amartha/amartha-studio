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
    id: 'earlier',
    label: 'Earlier in the day (14.30)',
    description: 'Sebelum deadline 16.00 — hanya BP yang telat lebih dari 24 jam yang tampak telat.',
    apply: demo.stateEarlier,
  },
  {
    id: 'mangkir',
    label: 'BP Marked Mangkir',
    description: 'Diski sudah ditandai mangkir — barisnya keluar dari tabel dan dari semua total.',
    apply: demo.stateMangkir,
  },
  {
    id: 'telat',
    label: 'BP Marked Telat',
    description:
      'Keterlambatan Sukma sudah disetujui — tombolnya hilang, ada teks biru di kolom setoran.',
    apply: demo.stateTelat,
  },
  {
    id: 'area-view',
    label: 'Area view',
    description: 'Jawa · Jawa Barat · Cirebon · Semua — satu tabel per cabang di kota itu.',
    apply: demo.stateAreaView,
  },
  {
    id: 'region-view',
    label: 'Region view',
    description: 'Jawa · Jawa Barat · Semua · Semua — seluruh cabang di provinsi itu.',
    apply: demo.stateRegionView,
  },
  {
    id: 'island-view',
    label: 'Island view',
    description: 'Jawa · Semua · Semua · Semua — seluruh cabang di pulau itu.',
    apply: demo.stateIslandView,
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
