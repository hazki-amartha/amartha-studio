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
        { to: 'follow-up', label: 'buka lead' },
        { to: 'calon-mitra', label: 'buka calon mitra' },
        { to: 'lead-new', label: 'Tambah lead' },
        { to: 'sosialisasi', label: 'buka POI' },
        { to: 'all-tasks', label: 'Lihat semua' },
        { to: 'poi-select', label: 'Sumber POI Visit' },
      ],
    },
    {
      id: 'poi-select',
      title: 'Pilih POI',
      component: lazyScreen(() => import('./screens/poi-select'), 'PoiSelectScreen'),
      flowsTo: [{ to: 'lead-new', label: 'Pilih POI → form' }],
    },
    {
      id: 'poi-new',
      title: 'Tambah POI',
      component: lazyScreen(() => import('./screens/poi-new'), 'PoiNewScreen'),
      flowsTo: [{ to: 'sales', label: 'Save POI' }],
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
          label: 'Follow up',
          description: 'A POI lead due for a follow-up (a couple of days late)',
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
        { to: 'pendaftaran', label: 'Mulai onboarding' },
        { to: 'calon-mitra', label: 'Lanjutkan onboarding' },
        { to: 'majelis-page', label: 'Survey approved → majelis' },
        { to: 'sales', label: 'Reschedule / Drop' },
      ],
    },
    {
      id: 'pendaftaran',
      title: 'Mulai Pendaftaran',
      component: lazyScreen(() => import('./screens/pendaftaran'), 'PendaftaranScreen'),
      flowsTo: [
        { to: 'kumpulan-jadwal', label: 'Majelis baru → buat majelis' },
        { to: 'calon-mitra', label: 'Existing → onboarding' },
        { to: 'survey-started', label: 'Existing → survey self-service' },
      ],
    },
    {
      id: 'kumpulan-jadwal',
      title: 'Buat Majelis Baru',
      component: lazyScreen(() => import('./screens/kumpulan-jadwal'), 'KumpulanJadwalScreen'),
      flowsTo: [
        { to: 'calon-mitra', label: 'Onboarding assisted' },
        { to: 'survey-started', label: 'Survey self-service' },
      ],
    },
    {
      id: 'calon-mitra',
      title: 'Calon Mitra',
      component: lazyScreen(() => import('./screens/calon-mitra'), 'CalonMitraScreen'),
      flowsTo: [
        { to: 'survey-form', label: 'BP Feedback / Uji Kelayakan' },
        { to: 'group-formation', label: 'Penerimaan majelis' },
        { to: 'sales', label: 'Submit onboarding' },
      ],
    },
    {
      id: 'survey-form',
      title: 'Survey Form',
      component: lazyScreen(() => import('./screens/survey-form'), 'SurveyFormScreen'),
      flowsTo: [{ to: 'calon-mitra', label: 'Selesai' }],
    },
    {
      id: 'survey-started',
      title: 'Survey Self-service',
      component: lazyScreen(() => import('./screens/survey-started'), 'SurveyStartedScreen'),
      flowsTo: [
        { to: 'sales', label: 'Kembali ke Sales' },
        { to: 'calon-mitra', label: 'Ambil alih jadi assisted' },
      ],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: lazyScreen(() => import('./screens/majelis-list'), 'MajelisListScreen'),
      flowsTo: [{ to: 'majelis-page', label: 'Buka majelis' }],
    },
    {
      id: 'mitra-list',
      title: 'Mitra',
      component: lazyScreen(() => import('./screens/mitra-list'), 'MitraListScreen'),
      flowsTo: [{ to: 'calon-mitra', label: 'Buka mitra' }],
    },
    {
      id: 'majelis-page',
      title: 'Halaman Majelis',
      component: lazyScreen(() => import('./screens/majelis-page'), 'MajelisPageScreen'),
      flowsTo: [
        { to: 'follow-up', label: 'Kembali (lead)' },
        { to: 'majelis-list', label: 'Kembali (direktori)' },
      ],
    },
    {
      id: 'tugas',
      title: 'Tugas',
      component: lazyScreen(() => import('./screens/tugas'), 'TugasScreen'),
      flowsTo: [{ to: 'group-formation', label: 'Group Formation' }],
    },
    {
      id: 'group-formation',
      title: 'Pembentukan Majelis',
      component: lazyScreen(() => import('./screens/group-formation'), 'GroupFormationScreen'),
      flowsTo: [{ to: 'sales', label: 'Majelis terbentuk' }],
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
