// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'sales',
      title: 'Sales',
      component: lazyScreen(() => import('./screens/sales'), 'SalesScreen'),
      entry: true,
      flowsTo: [
        { to: 'lead-detail', label: 'buka lead' },
        { to: 'lead-new', label: 'Tambah lead' },
      ],
    },
    {
      id: 'lead-detail',
      title: 'Detail Lead',
      component: lazyScreen(() => import('./screens/lead-detail'), 'LeadDetailScreen'),
      flowsTo: [{ to: 'follow-up', label: 'Mulai follow up' }],
    },
    {
      id: 'lead-new',
      title: 'Tambah Lead',
      component: lazyScreen(() => import('./screens/lead-new'), 'LeadNewScreen'),
      flowsTo: [{ to: 'lead-detail', label: 'simpan → buka record' }],
    },
    {
      id: 'follow-up',
      title: 'Follow Up Prospek',
      component: lazyScreen(() => import('./screens/follow-up'), 'FollowUpScreen'),
      states: [
        {
          id: 'default',
          label: 'Default',
          description: 'The default two-step follow-up on a connected lead',
          apply: demo.followUpDefault,
        },
        {
          id: 'alt',
          label: 'Alt · Tawarkan pengajuan',
          description:
            'Two steps — Hubungi, then Tawarkan pengajuan (Ajukan sekarang / Belum siap → catat minat & jadwal)',
          apply: demo.followUpAlt,
        },
      ],
      flowsTo: [{ to: 'sales', label: 'Simpan & Selesai' }],
    },
    {
      id: 'sosialisasi',
      title: 'Sosialisasi',
      component: lazyScreen(() => import('./screens/sosialisasi'), 'SosialisasiScreen'),
      states: [
        {
          id: 'awal',
          label: 'Just started',
          description: 'No prospects captured yet — the empty screen',
          apply: demo.eventEmpty,
        },
        {
          id: 'separuh',
          label: 'Part way',
          description: 'Three names on the board, against a target of nine',
          apply: demo.eventHalf,
        },
        {
          id: 'penuh',
          label: 'Five captured',
          description: 'The list long enough to scroll behind the counter',
          apply: demo.eventFull,
        },
      ],
      flowsTo: [
        { to: 'lead-detail', label: 'ketuk prospek' },
        { to: 'lead-new', label: 'Tambah Prospek → Ajukan' },
        { to: 'sales', label: 'Selesaikan Sosialisasi' },
      ],
    },
  ],
}
