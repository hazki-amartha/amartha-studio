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
      states: [
        {
          id: 'default',
          label: 'Default',
          description: 'Each section links to its own "Lihat semua" page',
          apply: demo.salesDefault,
        },
        {
          id: 'alt',
          label: 'Alt · All task + See more',
          description: 'Inline "See more" per section, and an "All task" page with search + type filter',
          apply: demo.salesAlt,
        },
      ],
      flowsTo: [
        { to: 'follow-up', label: 'buka lead' },
        { to: 'lead-new', label: 'Tambah lead' },
        { to: 'sosialisasi', label: 'buka POI' },
        { to: 'task-list', label: 'Lihat semua kategori' },
        { to: 'all-tasks', label: 'All task (alt)' },
      ],
    },
    {
      id: 'sales-b',
      title: 'Sales · Option B',
      component: lazyScreen(() => import('./screens/sales-b'), 'SalesBScreen'),
      flowsTo: [
        { to: 'all-leads', label: 'Semua Leads' },
        { to: 'follow-up', label: 'buka lead' },
        { to: 'sosialisasi', label: 'buka POI' },
        { to: 'lead-new', label: 'Add lead' },
      ],
    },
    {
      id: 'all-leads',
      title: 'Semua Leads · Option B',
      component: lazyScreen(() => import('./screens/all-leads'), 'AllLeadsScreen'),
      flowsTo: [
        { to: 'follow-up', label: 'buka lead' },
        { to: 'sosialisasi', label: 'buka POI' },
      ],
    },
    {
      id: 'task-list',
      title: 'Semua tugas',
      component: lazyScreen(() => import('./screens/task-list'), 'TaskListScreen'),
      flowsTo: [
        { to: 'follow-up', label: 'buka lead' },
        { to: 'sosialisasi', label: 'buka POI' },
      ],
    },
    {
      id: 'all-tasks',
      title: 'All task',
      component: lazyScreen(() => import('./screens/all-tasks'), 'AllTasksScreen'),
      flowsTo: [
        { to: 'follow-up', label: 'buka lead' },
        { to: 'sosialisasi', label: 'buka POI' },
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
      flowsTo: [
        { to: 'sales', label: 'Submit → Sales' },
        { to: 'sosialisasi', label: 'POI Visit → POI page' },
      ],
    },
    {
      id: 'follow-up',
      title: 'Follow Up Prospek',
      component: lazyScreen(() => import('./screens/follow-up'), 'FollowUpScreen'),
      states: [
        {
          id: 'first',
          label: '1st Follow up',
          description: 'A POI lead due for her first follow-up (a couple of days late)',
          apply: demo.followUpFirst,
        },
        {
          id: 'reactivation',
          label: 'Reactivation',
          description: 'An ex-mitra reopening — previous & potential loan limits',
          apply: demo.followUpReactivation,
        },
        {
          id: 'self-service',
          label: 'Self-service started',
          description: 'She was sent the AFIN app — the "Takeover application" case',
          apply: demo.followUpSelfService,
        },
      ],
      flowsTo: [
        { to: 'application', label: 'Continue / Takeover application' },
        { to: 'sales', label: 'Reschedule / Drop' },
      ],
    },
    {
      id: 'application',
      title: 'Aplikasi (FO Assisted)',
      component: lazyScreen(() => import('./screens/application'), 'ApplicationScreen'),
      flowsTo: [
        { to: 'sales', label: 'Submit → Mitra' },
        { to: 'follow-up', label: 'kembali' },
      ],
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
        { to: 'follow-up', label: 'ketuk prospek' },
        { to: 'lead-new', label: 'Start add leads' },
        { to: 'sales', label: 'Complete Sosialisasi' },
      ],
    },
  ],
}
